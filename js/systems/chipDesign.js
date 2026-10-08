// js/systems/chipDesign.js
// Chip design math: performance, TDP, yield, cost.
// Depends on: tech.js, isa.js, segments.js, archetypes.js

const CHIP_CATEGORIES = [
  { id: 'cpu',        name: 'CPU',             icon: 'cpu',    isaRequired: true  },
  { id: 'gpu',        name: 'GPU',             icon: 'gpu',    isaRequired: false },
  { id: 'os',         name: 'Operating System',icon: 'os',     isaRequired: false },
  { id: 'laptop',     name: 'Laptop',          icon: 'laptop', isaRequired: true  },
  { id: 'smartphone', name: 'Smartphone',      icon: 'phone',  isaRequired: true  },
];

const SIMD_SETS = [
  { id: 'mmx',    name: 'MMX',     year: 1997, featureScore: 5  },
  { id: 'sse',    name: 'SSE',     year: 1999, featureScore: 8  },
  { id: 'sse2',   name: 'SSE2',    year: 2001, featureScore: 10 },
  { id: 'sse3',   name: 'SSE3',    year: 2004, featureScore: 10 },
  { id: 'ssse3',  name: 'SSSE3',   year: 2006, featureScore: 8  },
  { id: 'sse4',   name: 'SSE4',    year: 2008, featureScore: 12 },
  { id: 'avx',    name: 'AVX',     year: 2011, featureScore: 18 },
  { id: 'avx2',   name: 'AVX2',    year: 2013, featureScore: 22 },
  { id: 'avx512', name: 'AVX-512', year: 2017, featureScore: 35 },
];

function getAvailableSIMD(year) {
  return SIMD_SETS.filter(s => s.year <= year);
}

// ===== Create empty draft =====
function createDraft(year) {
  const techs = getTechsUpToYear(year);
  const latest = techs[techs.length - 1];
  return {
    name: '',
    category: 'cpu',
    isa: 'x86',
    cores: 1,
    baseClock: 200,
    boostClock: 250,
    cacheL1: 16,
    cacheL2: 256,
    cacheL3: 0,
    node: latest ? latest.id : '350nm',
    simd: [],
    segment: 'budget_pc',
    budget: 100,
    price: 20,
  };
}

// ===== Design limits based on process node =====
function getDesignLimits(nodeId) {
  const tech = getTech(nodeId);
  if (!tech) return null;
  const yearFactor = (tech.year - 1995) / 30;
  return {
    maxCores: 1 + Math.floor(yearFactor * 32),
    maxClock: Math.round(tech.maxClock * archBonus('clockMax')),
    maxCacheL1: Math.round(32 + yearFactor * 96),
    maxCacheL2: Math.round(512 + yearFactor * 32768),
    maxCacheL3: Math.round(yearFactor * 65536),
  };
}

// ===== Transistor count (millions) =====
function calcTransistors(draft, tech) {
  const coreTrans = draft.cores * 5;
  const cacheTrans = (draft.cacheL1 * draft.cores + draft.cacheL2 + draft.cacheL3) / 1000;
  const simdTrans = draft.simd.length * 1.5;
  const clockFactor = 1 + (draft.boostClock / tech.maxClock) * 0.4;
  const total = (coreTrans + cacheTrans + simdTrans) * clockFactor;
  return Math.round(total * 10) / 10;
}

// ===== Die area (mm²) =====
function calcDieArea(draft, tech) {
  const transistors = calcTransistors(draft, tech);
  const area = transistors / tech.transistorDensity;
  return Math.round(area * 10) / 10;
}

// ===== TDP (watts) =====
function calcTDP(draft, tech, teamBonus = {}) {
  const baseTDP = draft.cores * 12 + (draft.boostClock / 100) * 3;
  const nodeFactor = tech.tdpFactor;
  const thermalBonus = 1 - Math.min(0.5, teamBonus.thermal || 0);
  const tdpMult = (draft.category === 'mobile' || draft.category === 'smartphone')
    ? archBonus('tdpMobile') : 1;
  return Math.max(3, Math.round(baseTDP * nodeFactor * thermalBonus * tdpMult));
}

// ===== Performance score =====
function calcPerfScore(draft, tech, teamBonus = {}) {
  const yearFactor = Math.max(0, (tech.year - 1995) / 30);

  const expectedCores = 1 + yearFactor * 8;
  const expectedClock = tech.maxClock * 0.65;
  const expectedCache = 32 + yearFactor * 4096;

  const coreScore = Math.min(2.0, draft.cores / expectedCores);
  const clockScore = Math.min(1.5, draft.boostClock / expectedClock);
  const totalCache = draft.cacheL1 * draft.cores + draft.cacheL2 + draft.cacheL3;
  const cacheScore = Math.min(2.0, Math.max(0.3, totalCache / expectedCache));

  const isa = getISA(draft.isa);
  const isaMult = isa ? isa.perfBonus : 1.0;
  const simdMult = 1 + draft.simd.length * 0.04;
  const microBonus = 1 + (teamBonus.perf || 0);

  const quality = Math.pow(coreScore * clockScore * cacheScore, 1/3)
                * isaMult * simdMult * microBonus;

  const basePerf = tech.refPerf * quality;
  return Math.round(basePerf * archPerfMult(draft.category));
}

// ===== Yield (0-1) =====
function calcYield(draft, tech, teamBonus = {}) {
  const dieArea = calcDieArea(draft, tech);
  const areaPenalty = Math.pow(Math.max(0.2, 1 - dieArea / 400), 0.5);
  const teamYield = teamBonus.yield || 0;
  const y = tech.baseYield * areaPenalty + teamYield;
  return Math.max(0.15, Math.min(0.95, y));
}

// ===== Feature score (0-100) =====
function calcFeatureScore(draft, tech) {
  let score = 0;
  for (const s of draft.simd) {
    const simd = SIMD_SETS.find(x => x.id === s);
    if (simd) score += simd.featureScore;
  }
  const totalCacheMB = (draft.cacheL1 * draft.cores + draft.cacheL2 + draft.cacheL3) / 1024;
  score += Math.min(30, totalCacheMB * 2);
  return Math.min(100, Math.round(score));
}

// ===== Minimum design cost (rebalanced for $5k start) =====
function calcMinDesignCost(draft, tech) {
  const transistors = calcTransistors(draft, tech);
  const base = 100;
  const complexity = transistors * 40;
  const nodeFee = tech.cost * 0.05;
  return Math.round((base + complexity + nodeFee) * archBonus('designCost'));
}

// ===== Unit production cost per chip =====
function calcUnitCost(draft, tech, yieldRate) {
  const dieArea = calcDieArea(draft, tech);
  const waferArea = 30000;
  const chipsPerWafer = Math.max(1, Math.floor(waferArea / dieArea * 0.85));
  const costPerGoodChip = tech.waferCost / (chipsPerWafer * yieldRate);
  const packaging = 1 + Math.log2(1 + draft.cores) * 0.5;
  return Math.round((costPerGoodChip + packaging) * 10) / 10;
}

// ===== Finalize chip design =====
function finalizeChip(draft, year, teamBonus = {}) {
  const tech = getTech(draft.node);
  if (!tech) return null;

  const perf = calcPerfScore(draft, tech, teamBonus);
  const tdp = calcTDP(draft, tech, teamBonus);
  const yieldRate = calcYield(draft, tech, teamBonus);
  const featureScore = calcFeatureScore(draft, tech);
  const transistors = calcTransistors(draft, tech);
  const dieArea = calcDieArea(draft, tech);
  const unitCost = calcUnitCost(draft, tech, yieldRate);
  const minCost = calcMinDesignCost(draft, tech);

  return {
    ...draft,
    perfScore: perf,
    tdp,
    yieldRate: Math.round(yieldRate * 100) / 100,
    featureScore,
    transistors,
    dieArea,
    unitCost,
    minDesignCost: minCost,
    estimatedScore: Math.round(perf * 0.6 + featureScore * 0.4),
  };
}

// ===== Team bonus from engineers =====
function calcTeamBonus(engineers) {
  const bonus = { perf: 0, thermal: 0, yield: 0, clock: 0, cache: 0, io: 0, process: 0, feature: 0 };
  for (const eng of engineers) {
    const level = getLevelInfo(eng.level);
    const effect = level.effectMult * 0.05;
    const spec = SPECIALTIES[eng.specialty];
    if (!spec) continue;
    bonus[spec.effect] = (bonus[spec.effect] || 0) + effect;
  }
  return bonus;
                        }
