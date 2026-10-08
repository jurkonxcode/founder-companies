// js/data/tech.js
// Process node semikonduktor 1995-2025, sesuai sejarah asli.
// Setiap node punya karakteristik fisik yang mempengaruhi desain chip.

const TECH_TREE = [
  {
    id: '350nm', name: '350 nm', year: 1995,
    rp: 0, cost: 0,
    transistorDensity: 0.8,      // juta transistor / mm²
    baseYield: 0.85,             // yield rata-rata di awal rilis
    waferCost: 1200,             // biaya per wafer (USD)
    tdpFactor: 1.0,              // pengali TDP
    maxClock: 300,               // MHz — batas fisik node ini
    refPerf: 10,
  },
  {
    id: '250nm', name: '250 nm', year: 1997,
    rp: 60, cost: 250000,
    transistorDensity: 1.5,
    baseYield: 0.82,
    waferCost: 1600,
    tdpFactor: 0.85,
    maxClock: 550,
    refPerf: 25,
  },
  {
    id: '180nm', name: '180 nm', year: 1999,
    rp: 150, cost: 600000,
    transistorDensity: 3.0,
    baseYield: 0.80,
    waferCost: 2200,
    tdpFactor: 0.72,
    maxClock: 1100,
    refPerf: 45,
  },
  {
    id: '130nm', name: '130 nm', year: 2001,
    rp: 300, cost: 1400000,
    transistorDensity: 6.0,
    baseYield: 0.78,
    waferCost: 3000,
    tdpFactor: 0.62,
    maxClock: 2200,
    refPerf: 75,
  },
  {
    id: '90nm', name: '90 nm', year: 2003,
    rp: 550, cost: 3000000,
    transistorDensity: 12,
    baseYield: 0.75,
    waferCost: 4200,
    tdpFactor: 0.55,
    maxClock: 3800,
    refPerf: 115,
  },
  {
    id: '65nm', name: '65 nm', year: 2006,
    rp: 850, cost: 6000000,
    transistorDensity: 24,
    baseYield: 0.72,
    waferCost: 5800,
    tdpFactor: 0.48,
    maxClock: 4500,
    refPerf: 165,
  },
  {
    id: '45nm', name: '45 nm', year: 2008,
    rp: 1200, cost: 11000000,
    transistorDensity: 45,
    baseYield: 0.70,
    waferCost: 7500,
    tdpFactor: 0.42,
    maxClock: 5200,
    refPerf: 230,
  },
  {
    id: '28nm', name: '28 nm', year: 2010,
    rp: 1700, cost: 20000000,
    transistorDensity: 90,
    baseYield: 0.72,
    waferCost: 9500,
    tdpFactor: 0.38,
    maxClock: 5800,
    refPerf: 310,
  },
  {
    id: '22nm', name: '22 nm', year: 2011,
    rp: 2100, cost: 28000000,
    transistorDensity: 140,
    baseYield: 0.68,
    waferCost: 11500,
    tdpFactor: 0.34,
    maxClock: 6200,
    refPerf: 390,
  },
  {
    id: '14nm', name: '14 nm', year: 2014,
    rp: 2800, cost: 44000000,
    transistorDensity: 250,
    baseYield: 0.66,
    waferCost: 14000,
    tdpFactor: 0.30,
    maxClock: 6800,
    refPerf: 520,
  },
  {
    id: '10nm', name: '10 nm', year: 2016,
    rp: 3700, cost: 70000000,
    transistorDensity: 400,
    baseYield: 0.62,
    waferCost: 17500,
    tdpFactor: 0.26,
    maxClock: 7200,
    refPerf: 680,
  },
  {
    id: '7nm', name: '7 nm', year: 2018,
    rp: 4900, cost: 110000000,
    transistorDensity: 700,
    baseYield: 0.60,
    waferCost: 22000,
    tdpFactor: 0.22,
    maxClock: 7600,
    refPerf: 890,
  },
  {
    id: '5nm', name: '5 nm', year: 2020,
    rp: 6400, cost: 170000000,
    transistorDensity: 1100,
    baseYield: 0.58,
    waferCost: 28000,
    tdpFactor: 0.19,
    maxClock: 7800,
    refPerf: 1150,
  },
  {
    id: '3nm', name: '3 nm', year: 2022,
    rp: 8200, cost: 250000000,
    transistorDensity: 1700,
    baseYield: 0.55,
    waferCost: 34000,
    tdpFactor: 0.16,
    maxClock: 8000,
    refPerf: 1450,
  },
  {
    id: '2nm', name: '2 nm', year: 2025,
    rp: 11000, cost: 380000000,
    transistorDensity: 2600,
    baseYield: 0.52,
    waferCost: 42000,
    tdpFactor: 0.13,
    maxClock: 8200,
    refPerf: 1850,
  },
];

function getTech(id) {
  return TECH_TREE.find(t => t.id === id) || null;
}

function getNextTech(id) {
  const i = TECH_TREE.findIndex(t => t.id === id);
  if (i === -1 || i >= TECH_TREE.length - 1) return null;
  return TECH_TREE[i + 1];
}

function getTechsUpToYear(year) {
  return TECH_TREE.filter(t => t.year <= year);
}
