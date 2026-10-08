// js/data/engineers.js
// Pool engineer yang bisa direkrut. Setiap engineer punya spesialisasi.

const SPECIALTIES = {
  microarch:  { name: 'Microarchitecture', icon: '🧩', desc: '+IPC, +performa',           effect: 'perf' },
  cache:      { name: 'Cache Design',      icon: '📦', desc: '+cache efisien, -latensi',  effect: 'cache' },
  clock:      { name: 'Clock & Timing',    icon: '⏱️', desc: '+clock speed aman',         effect: 'clock' },
  thermal:    { name: 'Thermal Design',    icon: '🌡️', desc: '-TDP, +efisiensi',          effect: 'thermal' },
  verification:{ name: 'Verification',     icon: '🔍', desc: '+yield, -bug',              effect: 'yield' },
  io:         { name: 'I/O & Memory',      icon: '🔌', desc: '+bandwidth memori',         effect: 'io' },
  process:    { name: 'Process Integration',icon:'⚗️', desc: '+node maturity',            effect: 'process' },
};

const LEVELS = {
  C:  { name: 'Junior',   salaryMult: 1.0,  effectMult: 0.6, color: 'fg-2' },
  B:  { name: 'Mid',      salaryMult: 1.8,  effectMult: 1.0, color: 'fg-1' },
  A:  { name: 'Senior',   salaryMult: 3.2,  effectMult: 1.5, color: 'accent' },
  S:  { name: 'Principal',salaryMult: 6.0,  effectMult: 2.2, color: 'purple' },
  SS: { name: 'Legendary',salaryMult: 12.0, effectMult: 3.5, color: 'warn' },
};

// Nama fiktif dari berbagai negara — biar terasa industri global
const FIRST_NAMES = [
  'Kenji','Hiroshi','Yuki','Minjun','Seoyeon','Wei','Li','Chen',
  'Rajesh','Priya','Anil','Sanjay',
  'Elena','Marcus','Sophie','Lukas','Anna','Peter','Ingrid',
  'Amir','Fatima','Omar','Layla',
  'Diego','Sofia','Mateo','Isabella',
  'John','Sarah','Michael','Emily','David','Rachel',
];

const LAST_NAMES = [
  'Tanaka','Yamamoto','Nakamura','Kim','Park','Lee','Wang','Zhang',
  'Patel','Sharma','Kumar','Reddy',
  'Schmidt','Müller','Novak','Petrov','Andersson','Larsen',
  'Al-Rashid','Hassan','Khalil',
  'Silva','Santos','Rodriguez','Garcia',
  'Smith','Johnson','Williams','Brown','Davis','Miller',
];

// Rating awal untuk generate engineer acak.
// Salary dihitung dari level * base.
const BASE_SALARY = 8000; // USD/bulan

function _randPick(arr, rng = Math.random) {
  return arr[Math.floor(rng() * arr.length)];
}

// Generate satu engineer acak. Bisa dipanggil saat startup untuk isi pool.
function generateEngineer(rng = Math.random, forceLevel = null) {
  const first = _randPick(FIRST_NAMES, rng);
  const last  = _randPick(LAST_NAMES, rng);

  // Distribusi level: C 45%, B 30%, A 18%, S 6%, SS 1%
  let level = forceLevel;
  if (!level) {
    const r = rng();
    if (r < 0.45) level = 'C';
    else if (r < 0.75) level = 'B';
    else if (r < 0.93) level = 'A';
    else if (r < 0.99) level = 'S';
    else level = 'SS';
  }

  const specKeys = Object.keys(SPECIALTIES);
  const spec = _randPick(specKeys, rng);

  const lv = LEVELS[level];
  // Salary dengan variasi ±20%
  const variation = 0.8 + rng() * 0.4;
  const salary = Math.round(BASE_SALARY * lv.salaryMult * variation);

  return {
    id: 'eng_' + Date.now() + '_' + Math.floor(rng() * 100000),
    name: `${first} ${last}`,
    level,
    specialty: spec,
    salary,
    loyalty: 70 + Math.floor(rng() * 30),  // 70-100
    hiredYear: null,                        // diisi saat direkrut
  };
}

function generatePool(count = 8, rng = Math.random) {
  const pool = [];
  for (let i = 0; i < count; i++) pool.push(generateEngineer(rng));
  return pool;
}

function getLevelInfo(level) {
  return LEVELS[level] || LEVELS.C;
}

function getSpecialtyInfo(id) {
  return SPECIALTIES[id] || null;
}

// Biaya rekrut = 3x salary bulanan (signing bonus)
function getHireCost(eng) {
  return eng.salary * 3;
}

// Biaya pelatihan: naikkan level satu tingkat
function getTrainingCost(eng) {
  const levelOrder = ['C','B','A','S','SS'];
  const idx = levelOrder.indexOf(eng.level);
  if (idx >= levelOrder.length - 1) return null; // sudah maksimal
  const nextLevel = levelOrder[idx + 1];
  const nextLv = LEVELS[nextLevel];
  return Math.round(eng.salary * nextLv.salaryMult * 4);
}

function getNextLevel(currentLevel) {
  const order = ['C','B','A','S','SS'];
  const i = order.indexOf(currentLevel);
  if (i === -1 || i >= order.length - 1) return null;
  return order[i + 1];
}
