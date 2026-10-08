// js/state.js
// Global state, save/load, auto-save.

const SAVE_KEY = 'founder-companies-v2';
const SAVE_VERSION = 3;
const AUTO_SAVE_INTERVAL = 30000;

let state = null;
let autoSaveTimer = null;

// =========================================================
// HELPERS
// =========================================================
function getCategory(id) {
  return (typeof CHIP_CATEGORIES !== 'undefined')
    ? CHIP_CATEGORIES.find(c => c.id === id) || null
    : null;
}

// =========================================================
// FOUNDER ENGINEER — you are the first team member
// =========================================================
function createFounderEngineer(name, specialty) {
  return {
    id: 'founder',
    name: name || 'You (Founder)',
    level: 'A',
    specialty: specialty || 'microarch',
    salary: 0,          // founders don't draw salary
    loyalty: 100,       // founders don't quit
    hiredYear: 1995,
    hiredMonth: 1,
    isFounder: true,
  };
}

// =========================================================
// INITIAL STATE
// =========================================================
function createInitialState(archetype = null) {
  const arch = archetype || getArchetype('founder');
  const startingCash = arch?.bonuses?.startingCash || 5000;

  const founder = createFounderEngineer(arch ? arch.name : 'Founder', 'microarch');

  return {
    version: SAVE_VERSION,
    tahun: 1995,
    bulan: 1,
    turn: 0,

    uang: startingCash,
    researchPoint: 0,

    currentNode: '350nm',
    unlockedNodes: ['350nm'],

    marketShare: 0.02,

    team: [founder],           // ← founder included
    pool: generatePool(6),

    projects: [],
    products: [],

    log: [],
    triggeredEvents: [],

    totalRevenue: 0,
    totalProducts: 0,
    debt: 0,

    history: { cash: [], share: [], revenue: [] },

    archetype: arch ? arch.id : 'founder',
    companyName: arch ? arch.name : 'Founder Companies',
    difficulty: 'normal',

    gameOver: false,
    founded: { tahun: 1995, bulan: 1 },
  };
}

// =========================================================
// INIT
// =========================================================
function initState() {
  if (state) { startAutoSave(); return; }

  const loaded = loadGame();
  if (loaded) {
    state = loaded;
    if (!state.archetype) state.archetype = 'founder';
    if (!state.triggeredEvents) state.triggeredEvents = [];
    if (!state.pool || state.pool.length === 0) state.pool = generatePool(6);
    if (!state.history) state.history = { cash: [], share: [], revenue: [] };

    // Migration: ensure founder exists in team
    if (!state.team.some(e => e.isFounder)) {
      const arch = getArchetype(state.archetype) || { name: 'Founder' };
      state.team.unshift(createFounderEngineer(state.companyName || arch.name, 'microarch'));
    }

    addLog('Save loaded. Resuming campaign...', 'info');
  } else {
    state = createInitialState();
  }
  startAutoSave();
}

function initStateWithArchetype(arch, options = {}) {
  state = createInitialState(arch);
  if (options.tahun) state.tahun = options.tahun;
  if (options.uang) state.uang = options.uang;

  // Custom founder name from company name
  if (options.companyName) {
    state.companyName = options.companyName;
    const f = state.team.find(e => e.isFounder);
    if (f) f.name = options.companyName + ' (Founder)';
  }

  addLog(`${arch.name} founded in ${formatDate(state.tahun, state.bulan)}.`, 'milestone');
  addLog(`Starting cash: ${formatMoneyShort(state.uang)}. Node: 350nm.`, 'info');
  addLog(`You are the first engineer. Hire more to scale R&D.`, 'info');
  startAutoSave();
}

// =========================================================
// ARCHETYPE HELPERS
// =========================================================
function archBonus(key) {
  if (!state || !state.archetype) return 1;
  const arch = getArchetype(state.archetype);
  if (!arch || !arch.bonuses) return 1;
  return arch.bonuses[key] !== undefined ? arch.bonuses[key] : 1;
}

function archPerfMult(category) {
  if (!state) return 1;
  const key = category === 'cpu' ? 'perfCpu'
           : category === 'gpu' ? 'perfGpu'
           : category === 'mobile' || category === 'smartphone' ? 'perfMobile'
           : null;
  return key ? archBonus(key) : 1;
}

// =========================================================
// SAVE / LOAD
// =========================================================
function saveGame(silent = false) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    if (!silent) addLog('Game saved.', 'info');
    return true;
  } catch (e) {
    console.error('Save error:', e);
    if (!silent) addLog('Failed to save game.', 'bad');
    return false;
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.version !== SAVE_VERSION) {
      console.warn('Save version mismatch — discarding old save.');
      return null;
    }
    return data;
  } catch (e) {
    console.error('Load error:', e);
    return null;
  }
}

function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  state = createInitialState();
  addLog('Game reset. Starting from January 1995.', 'warn');
}

// =========================================================
// AUTO-SAVE
// =========================================================
function startAutoSave() {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  autoSaveTimer = setInterval(() => saveGame(true), AUTO_SAVE_INTERVAL);
}

window.addEventListener('beforeunload', () => {
  if (state && !state.gameOver) saveGame(true);
});

// =========================================================
// LOG
// =========================================================
function addLog(text, type = 'info') {
  if (!state) return;
  state.log.unshift({
    turn: state.turn,
    tahun: state.tahun,
    bulan: state.bulan,
    text,
    type,
  });
  if (state.log.length > 200) state.log.length = 200;
}
