// js/data/engineers.js
// Engineer pool. Rebalanced for $5,000 starting economy.

const SPECIALTIES = {
  microarch:    { name: 'Microarchitecture', icon: '🧩', desc: '+IPC, +performance',     effect: 'perf' },
  cache:        { name: 'Cache Design',      icon: '📦', desc: '+cache efficiency',      effect: 'cache' },
  clock:        { name: 'Clock & Timing',    icon: '⏱️', desc: '+safe clock headroom',    effect: 'clock' },
  thermal:      { name: 'Thermal Design',    icon: '🌡️', desc: '-TDP, +efficiency',       effect: 'thermal' },
  verification: { name: 'Verification',      icon: '🔍', desc: '+yield, -bugs',           effect: 'yield' },
  io:           { name: 'I/O & Memory',      icon: '🔌', desc: '+memory bandwidth',       effect: 'io' },
  process:      { name: 'Process Integration', icon: '⚗️', desc: '+node maturity',         effect: 'process' },
};

const LEVELS = {
  C:  { name: 'Junior',    salaryMult: 1.0,  effectMult: 0.6, color: 'fg-2' },
  B:  { name: 'Mid',       salaryMult: 2.0,  effectMult: 1.0, color: 'fg-1' },
  A:  { name: 'Senior',    salaryMult: 4.0,  effectMult: 1.5, color: 'accent' },
  S:  { name: 'Principal', salaryMult: 8.0,  effectMult: 2.2, color: 'purple' },
  SS: { name: 'Legendary', salaryMult: 16.0, effectMult: 3.5, color: 'warn' },
};

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

// Base salary per turn (1 turn = 1 month). C-level = $60.
const BASE_SALARY = 60;

function _randPick(arr, rng = Math.random) {
  return arr[Math.floor(rng() * arr.length)];
}

function generateEngineer(rng = Math.random, forceLevel = null) {
  const first = _randPick(FIRST_NAMES, rng);
  const last  = _randPick(LAST_NAMES, rng);

  let level = forceLevel;
  if (!level) {
    const r = rng();
    if (r < 0.50) level = 'C';        // 50% junior
    else if (r < 0.80) level = 'B';   // 30% mid
    else if (r < 0.94) level = 'A';   // 14% senior
    else if (r < 0.99) level = 'S';   // 5% principal
    else level = 'SS';                // 1% legendary
  }

  const specKeys = Object.keys(SPECIALTIES);
  const spec = _randPick(specKeys, rng);

  const lv = LEVELS[level];
  const variation = 0.85 + rng() * 0.30; // ±15%
  const salary = Math.round(BASE_SALARY * lv.salaryMult * variation);

  return {
    id: 'eng_' + Date.now() + '_' + Math.floor(rng() * 100000),
    name: `${first} ${last}`,
    level,
    specialty: spec,
    salary,
    loyalty: 70 + Math.floor(rng() * 30),
    hiredYear: null,
  };
}

function generatePool(count = 6, rng = Math.random) {
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

// Hire cost = 3× monthly salary (signing bonus)
function getHireCost(eng) {
  return eng.salary * 3;
}

// Training cost = jump to next level
function getTrainingCost(eng) {
  const order = ['C','B','A','S','SS'];
  const idx = order.indexOf(eng.level);
  if (idx >= order.length - 1) return null;
  const nextLevel = order[idx + 1];
  const nextLv = LEVELS[nextLevel];
  return Math.round(eng.salary * (nextLv.salaryMult / LEVELS[eng.level].salaryMult) * 2);
}

function getNextLevel(currentLevel) {
  const order = ['C','B','A','S','SS'];
  const i = order.indexOf(currentLevel);
  if (i === -1 || i >= order.length - 1) return null;
  return order[i + 1];
}
