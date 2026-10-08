// js/systems/chipDesign.js
// Rumus desain chip: performa, TDP, yield, biaya produksi.
// Bergantung pada: tech.js, isa.js, segments.js

// Kategori produk yang bisa dirancang
const CHIP_CATEGORIES = [
  { id: 'cpu',        name: 'CPU',         icon: 'cpu',    isaRequired: true  },
  { id: 'gpu',        name: 'GPU',         icon: 'gpu',    isaRequired: false },
  { id: 'os',         name: 'Sistem Operasi', icon: 'os', isaRequired: false },
  { id: 'laptop',     name: 'Laptop',      icon: 'laptop', isaRequired: true  },
  { id: 'smartphone', name: 'Smartphone',  icon: 'phone',  isaRequired: true  },
];

// SIMD extensions dengan tahun rilis asli
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

// ===== Buat draft kosong =====
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
    budget: 100000,
    price: 100,
  };
}

// ===== Batas maksimum desain berdasarkan node =====
function getDesignLimits(nodeId) {
  const tech = getTech(nodeId);
  if (!tech) return null;
  const yearFactor = (tech.year - 1995) / 30;
  return {
    maxCores: 1 + Math.floor(yearFactor * 32),
    maxClock: tech.maxClock,
    maxCacheL1: Math.round(32 + yearFactor * 96),      // KB
    maxCacheL2: Math.round(512 + yearFactor * 32768),  // KB
    maxCacheL3: Math.round(yearFactor * 65536),        // KB
  };
}

// ===== Hitung transistor (juta) =====
function calcTransistors(draft, tech) {
  const coreTrans = draft.cores * 5; // 5 juta per core dasar
  const cacheTrans = (draft.cacheL1 * draft.cores + draft.cacheL2 + draft.cacheL3) / 1000;
  const simdTrans = draft.simd.length * 1.5;
  const clockFactor = 1 + (draft.boostClock / tech.maxClock) * 0.4;
  const total = (coreTrans + cacheTrans + simdTrans) * clockFactor;
  return Math.round(total * 10) / 10;
}

// ===== Hitung die area (mm²) =====
function calcDieArea(draft, tech) {
  const transistors = calcTransistors(draft, tech);
  const area = transistors / tech.transistorDensity;
  return Math.round(area * 10) / 10;
}

// ===== Hitung TDP (watt) =====
function calcTDP(draft, tech, teamBonus = {}) {
  const baseTDP = draft.cores * 12 + (draft.boostClock / 100) * 3;
  const nodeFactor = tech.tdpFactor;
  const thermalBonus = 1 - Math.min(0.5, teamBonus.thermal || 0);
  return Math.max(3, Math.round(baseTDP * nodeFactor * thermalBonus));
}

// ===== Hitung performa (skor) =====
function calcPerfScore(draft, tech, teamBonus = {}) {
  const yearFactor = Math.max(0, (tech.year - 1995) / 30);

  // Ekspektasi pada node ini
  const expectedCores = 1 + yearFactor * 8;
  const expectedClock = tech.maxClock * 0.65;
  const expectedCache = 32 + yearFactor * 4096; // KB total

  // Skor per dimensi (rasio terhadap ekspektasi, cap 2.0)
  const coreScore = Math.min(2.0, draft.cores / expectedCores);
  const clockScore = Math.min(1.5, draft.boostClock / expectedClock);
  const totalCache = draft.cacheL1 * draft.cores + draft.cacheL2 + draft.cacheL3;
  const cacheScore = Math.min(2.0, Math.max(0.3, totalCache / expectedCache));

  // Bonus ISA
  const isa = getISA(draft.isa);
  const isaMult = isa ? isa.perfBonus : 1.0;

  // Bonus SIMD
  const simdMult = 1 + draft.simd.length * 0.04;

  // Bonus tim engineer
  const microBonus = 1 + (teamBonus.perf || 0);

  // Quality factor (rata-rata geometrik)
  const quality = Math.pow(coreScore * clockScore * cacheScore, 1/3)
                * isaMult * simdMult * microBonus;

  return Math.round(tech.refPerf * quality);
}

// ===== Hitung yield (0-1) =====
function calcYield(draft, tech, teamBonus = {}) {
  const dieArea = calcDieArea(draft, tech);
  // Semakin besar die, semakin rendah yield (efek defect density)
  const areaPenalty = Math.pow(Math.max(0.2, 1 - dieArea / 400), 0.5);
  const teamYield = teamBonus.yield || 0;

  const y = tech.baseYield * areaPenalty + teamYield;
  return Math.max(0.15, Math.min(0.95, y));
}

// ===== Hitung feature score (0-100) =====
function calcFeatureScore(draft, tech) {
  let score = 0;
  for (const s of draft.simd) {
    const simd = SIMD_SETS.find(x => x.id === s);
    if (simd) score += simd.featureScore;
  }
  // Cache besar = fitur
  const totalCacheMB = (draft.cacheL1 * draft.cores + draft.cacheL2 + draft.cacheL3) / 1024;
  score += Math.min(30, totalCacheMB * 2);
  return Math.min(100, Math.round(score));
}

// ===== Hitung biaya desain minimum =====
function calcMinDesignCost(draft, tech) {
  const transistors = calcTransistors(draft, tech);
  const base = tech.cost * 0.4;       // basis dari harga node
  const complexity = transistors * 20000; // tiap juta transistor butuh $20K
  return Math.round(base + complexity + 50000);
}

// ===== Hitung biaya produksi per unit =====
function calcUnitCost(draft, tech, yieldRate) {
  // Ukuran die menentukan berapa chip per wafer
  const dieArea = calcDieArea(draft, tech);
  const waferArea = 30000; // mm² (300mm wafer)
  const chipsPerWafer = Math.max(1, Math.floor(waferArea / dieArea * 0.85)); // 85% utilisation
  const costPerGoodChip = tech.waferCost / (chipsPerWafer * yieldRate);

  // Packaging & testing overhead
  const packaging = 15 + Math.log2(1 + draft.cores) * 5;

  return Math.round(costPerGoodChip + packaging);
}

// ===== Hitung skor komposit akhir =====
// Mengembalikan objek lengkap yang siap masuk production pipeline
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

// ===== Skor tim dari engineer =====
// Mengumpulkan bonus dari semua engineer yang ditugaskan ke proyek
function calcTeamBonus(engineers) {
  const bonus = { perf: 0, thermal: 0, yield: 0, clock: 0, cache: 0, io: 0, process: 0, feature: 0 };
  for (const eng of engineers) {
    const level = getLevelInfo(eng.level);
    const effect = level.effectMult * 0.05; // maksimal ~17% untuk SS
    const spec = SPECIALTIES[eng.specialty];
    if (!spec) continue;
    bonus[spec.effect] = (bonus[spec.effect] || 0) + effect;
  }
  return bonus;
    }
