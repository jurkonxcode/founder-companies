// js/systems/production.js
// Pipeline produksi 5 tahap. Setiap proyek berjalan melalui tahap-
// tahap ini selama beberapa turn.

const PROJECT_STAGES = [
  { id: 'design',   name: 'Design',        baseTurns: 6, costFactor: 0.45,
    desc: 'Merancang arsitektur dan layout chip.' },
  { id: 'test',     name: 'Verification',  baseTurns: 3, costFactor: 0.15,
    desc: 'Validasi fungsional dan karakterisasi yield.' },
  { id: 'software', name: 'Software',      baseTurns: 2, costFactor: 0.10,
    desc: 'Driver, compiler, dan SDK.' },
  { id: 'fab',      name: 'Fabrication',   baseTurns: 4, costFactor: 0.20,
    desc: 'Produksi wafer dan packaging.' },
  { id: 'launch',   name: 'Launch',        baseTurns: 1, costFactor: 0.10,
    desc: 'Peluncuran resmi ke pasar.' },
];

function getStage(id) {
  return PROJECT_STAGES.find(s => s.id === id) || null;
}

// ===== Buat proyek baru dari chip yang sudah difinalisasi =====
function createProject(chip, year, month, assignedEngineers = []) {
  return {
    id: 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    // Spesifikasi
    name: chip.name,
    category: chip.category,
    isa: chip.isa,
    cores: chip.cores,
    baseClock: chip.baseClock,
    boostClock: chip.boostClock,
    cacheL1: chip.cacheL1,
    cacheL2: chip.cacheL2,
    cacheL3: chip.cacheL3,
    node: chip.node,
    simd: chip.simd,
    segment: chip.segment,
    price: chip.price,

    // Statistik
    perfScore: chip.perfScore,
    tdp: chip.tdp,
    yieldRate: chip.yieldRate,
    featureScore: chip.featureScore,
    transistors: chip.transistors,
    dieArea: chip.dieArea,
    unitCost: chip.unitCost,

    // Pipeline
    stageIndex: 0,
    stageProgress: 0,          // 0-100
    engineerIds: assignedEngineers.map(e => e.id),
    status: 'active',          // active | done | cancelled

    // Biaya R&D total (di-commit di awal)
    designBudget: chip.minDesignCost,
    spent: 0,

    // Timestamp
    startYear: year,
    startMonth: month,

    // Hasil setelah launch
    launchYear: null,
    launchMonth: null,
    sales: 0,
    revenue: 0,
  };
}

// ===== Hitung kecepatan progres per turn =====
// Default: 100% progress terselesaikan dalam baseTurns turn.
// Engineer mempercepat.
function calcStageSpeed(project, engineers) {
  const stage = PROJECT_STAGES[project.stageIndex];
  if (!stage) return 100;

  // Progres dasar per turn
  const baseProgress = 100 / stage.baseTurns;

  // Bonus engineer: setiap engineer menambah hingga +15%
  let speedMult = 1.0;
  for (const eng of engineers) {
    const level = getLevelInfo(eng.level);
    speedMult += level.effectMult * 0.05;
  }

  return baseProgress * speedMult;
}

// ===== Majukan proyek satu turn =====
// Mengembalikan objek { stageChanged: bool, completed: bool, cost: number }
function advanceProject(project, engineers, rng = Math.random) {
  const stage = PROJECT_STAGES[project.stageIndex];
  if (!stage) return { stageChanged: false, completed: false, cost: 0 };

  const speed = calcStageSpeed(project, engineers);
  project.stageProgress += speed;

  // Biaya tahap ini (per turn)
  const stageCost = project.designBudget * stage.costFactor / stage.baseTurns;
  // Variasi acak ±15%
  const cost = Math.round(stageCost * (0.85 + rng() * 0.3));
  project.spent += cost;

  let stageChanged = false;
  let completed = false;

  if (project.stageProgress >= 100) {
    project.stageProgress = 0;
    project.stageIndex += 1;
    stageChanged = true;

    if (project.stageIndex >= PROJECT_STAGES.length) {
      project.status = 'done';
      project.stageIndex = PROJECT_STAGES.length - 1; // clamp
      project.stageProgress = 100;
      completed = true;
    }
  }

  return { stageChanged, completed, cost };
}

// ===== Persentase progres keseluruhan =====
function calcOverallProgress(project) {
  let total = 0;
  const n = PROJECT_STAGES.length;
  for (let i = 0; i < n; i++) {
    if (i < project.stageIndex) total += 100;
    else if (i === project.stageIndex) total += project.stageProgress;
  }
  return Math.round(total / n);
}

// ===== Estimasi sisa turn =====
function estimateRemainingTurns(project, engineers) {
  if (project.status !== 'active') return 0;
  let turns = 0;
  let stageIdx = project.stageIndex;
  let progress = project.stageProgress;

  while (stageIdx < PROJECT_STAGES.length) {
    const speed = calcStageSpeed(
      { ...project, stageIndex: stageIdx },
      engineers
    );
    const needed = 100 - progress;
    turns += Math.ceil(needed / speed);
    stageIdx += 1;
    progress = 0;
  }
  return turns;
}

// ===== Ganti prioritas / batalkan =====
function cancelProject(project) {
  project.status = 'cancelled';
  // Refund sebagian (30% dari sisa budget)
  const refund = Math.round((project.designBudget - project.spent) * 0.3);
  return Math.max(0, refund);
}
