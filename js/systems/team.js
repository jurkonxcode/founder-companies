// js/systems/team.js
// Hire, fire, training, loyalty. Bergantung pada engineers.js

// ===== Gaji bulanan total =====
function calcMonthlySalary(team) {
  return team.reduce((sum, e) => sum + e.salary, 0);
}

// ===== Hire engineer =====
function hireEngineer(engineer, year, month) {
  engineer.hiredYear = year;
  engineer.hiredMonth = month;
  return engineer;
}

// ===== Fire engineer =====
// Mengembalikan biaya pesangon
function fireEngineer(engineer) {
  // Pesangon = 2x gaji bulanan
  return engineer.salary * 2;
}

// ===== Latih engineer =====
// Menaikkan level satu tingkat.
function trainEngineer(engineer) {
  const next = getNextLevel(engineer.level);
  if (!next) return { success: false, reason: 'Level maksimal' };
  const cost = getTrainingCost(engineer);
  engineer.level = next;
  // Loyalitas naik setelah training
  engineer.loyalty = Math.min(100, engineer.loyalty + 5);
  return { success: true, cost };
}

// ===== Update loyalitas tiap turn =====
// Loyalitas turun kalau: gaji rendah, banyak kompetitor, tidak pernah training.
// Naik kalau: baru training, bonus, tim kecil.
function updateLoyalty(team, marketShare, rng = Math.random) {
  for (const eng of team) {
    let delta = 0;

    // Tim besar = lebih banyak drama internal
    if (team.length > 10) delta -= 0.3;
    if (team.length > 20) delta -= 0.3;

    // Market share tinggi = kebanggaan
    if (marketShare > 0.15) delta += 0.5;
    if (marketShare > 0.30) delta += 0.5;

    // Fluktuasi alami
    delta += (rng() - 0.5) * 0.5;

    eng.loyalty = Math.max(0, Math.min(100, eng.loyalty + delta));
  }
}

// ===== Cek engineer yang resign =====
// Peluang resign tiap turn = (100 - loyalty) * 0.002
function checkResignations(team, rng = Math.random) {
  const resigned = [];
  for (const eng of team) {
    const chance = (100 - eng.loyalty) * 0.002;
    if (rng() < chance) resigned.push(eng);
  }
  return resigned;
}

// ===== Bonus efektivitas dari tim =====
// Tim yang punya spesialisasi beragam lebih efektif
function calcTeamDiversityBonus(team) {
  if (team.length === 0) return 0;
  const specialties = new Set(team.map(e => e.specialty));
  const coverage = specialties.size / 7; // 7 spesialisasi total
  return coverage * 0.05; // maksimal +5%
}

// ===== Refresh pool kandidat =====
// Pool berubah setiap beberapa turn
function refreshPool(pool, year, rng = Math.random) {
  // Buang 2 kandidat lama, tambah 2 baru
  pool.shift();
  pool.shift();
  pool.push(generateEngineer(rng));
  pool.push(generateEngineer(rng));
  return pool;
}
