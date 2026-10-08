// js/systems/production.js
// Production pipeline — 5 stages with per-category realistic durations.

const PROJECT_STAGES = [
  { id: 'design',   name: 'Design',       costFactor: 0.45,
    desc: 'Architecture, specification, and design.' },
  { id: 'verify',   name: 'Verification', costFactor: 0.20,
    desc: 'Functional validation and yield characterization.' },
  { id: 'software', name: 'Software',     costFactor: 0.12,
    desc: 'Drivers, firmware, and SDK.' },
  { id: 'fab',      name: 'Fabrication',  costFactor: 0.18,
    desc: 'Manufacturing and packaging.' },
  { id: 'launch',   name: 'Launch',       costFactor: 0.05,
    desc: 'Market release and distribution.' },
];

// ===== Real-world-inspired durations (in months) =====
// Base at 1995, scaled up to 2025 as complexity increases.
const DURATION_BASE = {
  cpu:        18,   // Pentium (1995): ~14 mo → Modern CPU: ~24 mo
  gpu:        16,   // Early GPU: ~12 mo → Modern GPU: ~21 mo
  os:          9,   // Windows 95: ~7 mo → Modern OS: ~12 mo
  laptop:     12,   // ~9 mo → ~16 mo
  smartphone: 16,   // 2007 iPhone: ~16 mo → Modern: ~21 mo
};

// Stage weight distribution per category
const STAGE_WEIGHTS = {
  cpu:        [0.45, 0.20, 0.10, 0.20, 0.05],
  gpu:        [0.45, 0.20, 0.10, 0.20, 0.05],
  os:         [0.30, 0.20, 0.40, 0.00, 0.10],   // no fab
  laptop:     [0.30, 0.20, 0.15, 0.25, 0.10],
  smartphone: [0.30, 0.22, 0.25, 0.13, 0.10],
};

// ===== Estimate total months for a project =====
function estimateProjectDuration(category, year) {
  const yearFactor = Math.max(0, Math.min(1, (year - 1995) / 30));
  const base = DURATION_BASE[category] || 12;
  const scale = 0.75 + yearFactor * 0.55;   // 0.75 in 1995 → 1.30 in 2025
  return Math.max(3, Math.round(base * scale));
}

// ===== Get stage durations for a specific category/year =====
function getStageDurations(category, year) {
  const total = estimateProjectDuration(category, year);
  const weights = STAGE_WEIGHTS[category] || STAGE_WEIGHTS.cpu;
  let allocated = 0;
  const durations = weights.map((w, i) => {
    if (i === weights.length - 1) {
      return Math.max(1, total - allocated);
    }
    const turns = Math.max(1, Math.round(total * w));
    allocated += turns;
    return turns;
  });
  return PROJECT_STAGES.map((stage, i) => ({
    ...stage,
    baseTurns: durations[i],
  }));
}

function getStage(id) {
  return PROJECT_STAGES.find(s => s.id === id) || null;
}

// ===== Create project =====
function createProject(chip, year, month, assignedEngineers = []) {
  const stages = getStageDurations(chip.category, year);
  const totalMonths = stages.reduce((s, st) => s + st.baseTurns, 0);

  return {
    id: 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
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

    perfScore: chip.perfScore,
    tdp: chip.tdp,
    yieldRate: chip.yieldRate,
    featureScore: chip.featureScore,
    transistors: chip.transistors,
    dieArea: chip.dieArea,
    unitCost: chip.unitCost,

    // Pipeline
    stages,
    stageIndex: 0,
    stageProgress: 0,
    engineerIds: assignedEngineers.map(e => e.id),
    status: 'active',

    // Budget
    designBudget: chip.minDesignCost,
    spent: 0,

    // Duration tracking
    totalMonths,
    elapsedMonths: 0,
    startTurn: state ? state.turn : 0,
    startYear: year,
    startMonth: month,

    // Results
    launchYear: null,
    launchMonth: null,
    launchTurn: null,
    sales: 0,
    revenue: 0,
  };
}

// ===== Stage speed calc =====
function calcStageSpeed(project, engineers) {
  const stages = project.stages || PROJECT_STAGES;
  const stage = stages[project.stageIndex];
  if (!stage) return 100;

  const baseProgress = 100 / stage.baseTurns;
  let speedMult = 1.0;
  for (const eng of engineers) {
    const level = (typeof getLevelInfo === 'function') ? getLevelInfo(eng.level) : { effectMult: 1 };
    speedMult += level.effectMult * 0.05;
  }
  return baseProgress * speedMult;
}

// ===== Advance one turn =====
function advanceProject(project, engineers, rng = Math.random) {
  const stages = project.stages || PROJECT_STAGES;
  const stage = stages[project.stageIndex];
  if (!stage) return { stageChanged: false, completed: false, cost: 0 };

  const speed = calcStageSpeed(project, engineers);
  project.stageProgress += speed;
  project.elapsedMonths = (project.elapsedMonths || 0) + 1;

  const stageCost = project.designBudget * stage.costFactor / stage.baseTurns;
  const cost = Math.round(stageCost * (0.85 + rng() * 0.3));
  project.spent += cost;

  let stageChanged = false;
  let completed = false;

  if (project.stageProgress >= 100) {
    project.stageProgress = 0;
    project.stageIndex += 1;
    stageChanged = true;

    if (project.stageIndex >= stages.length) {
      project.status = 'done';
      project.stageIndex = stages.length - 1;
      project.stageProgress = 100;
      completed = true;
    }
  }

  return { stageChanged, completed, cost };
}

// ===== Overall progress =====
function calcOverallProgress(project) {
  const stages = project.stages || PROJECT_STAGES;
  let total = 0;
  const n = stages.length;
  for (let i = 0; i < n; i++) {
    if (i < project.stageIndex) total += 100;
    else if (i === project.stageIndex) total += project.stageProgress;
  }
  return Math.round(total / n);
}

// ===== Estimate remaining turns =====
function estimateRemainingTurns(project, engineers) {
  if (project.status !== 'active') return 0;
  const stages = project.stages || PROJECT_STAGES;
  let turns = 0;
  let stageIdx = project.stageIndex;
  let progress = project.stageProgress;

  while (stageIdx < stages.length) {
    const speed = calcStageSpeed({ ...project, stageIndex: stageIdx }, engineers);
    const needed = 100 - progress;
    turns += Math.ceil(needed / speed);
    stageIdx += 1;
    progress = 0;
  }
  return turns;
}

// ===== Cancel =====
function cancelProject(project) {
  project.status = 'cancelled';
  const refund = Math.round((project.designBudget - project.spent) * 0.3);
  return Math.max(0, refund);
}
