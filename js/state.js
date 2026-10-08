// js/state.js
// Global state, save/load, auto-save.

const SAVE_KEY = 'founder-companies-v2';
const SAVE_VERSION = 5;
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

function createFounderEngineer(name, specialty) {
  return {
    id: 'founder',
    name: name || 'You (Founder)',
    level: 'A',
    specialty: specialty || 'microarch',
    salary: 0,
    loyalty: 100,
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

    team: [founder],
    pool: generatePool(6),

    projects: [],
    products: [],

    log: [],
    triggeredEvents: [],
    notifications: [],

    totalRevenue: 0,
    totalProducts: 0,
    debt: 0,

    history: {
      cash: [],
      share: [],
      revenue: [],
      revPerTurn: [],
      profit: [],
    },

    archetype: arch ? arch.id : 'founder',
    companyName: arch ? arch.name : 'Founder Companies',
    difficulty: 'normal',

    gameOver: false,
    founded: { tahun: 1995, bulan: 1 },

    _lastTotalRevenue: 0,
    _processing: false,
    _lastSpeed: 0,
    speed: 0,
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
    migrateState(state);
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

  if (options.companyName) {
    state.companyName = options.companyName;
    const f = state.team.find(e => e.isFounder);
    if (f) f.name = options.companyName + ' (Founder)';
  }

  addLog(`${arch.name} founded in ${formatDate(state.tahun, state.bulan)}.`, 'milestone');
  addLog(`Starting cash: ${formatMoneyShort(state.uang)}. Node: 350nm.`, 'info');
  addLog('You are the first engineer. Hire more to scale R&D.', 'info');
  startAutoSave();
}

// =========================================================
// MIGRATION
// =========================================================
function migrateState(s) {
  if (!s) return;

  if (!s.archetype) s.archetype = 'founder';
  if (!s.triggeredEvents) s.triggeredEvents = [];
  if (!s.pool || s.pool.length === 0) s.pool = generatePool(6);
  if (!s.difficulty) s.difficulty = 'normal';
  if (!s.companyName) {
    const arch = getArchetype(s.archetype);
    s.companyName = arch ? arch.name : 'Founder Companies';
  }

  if (!s.history) {
    s.history = { cash: [], share: [], revenue: [], revPerTurn: [], profit: [] };
  }
  if (!s.history.cash) s.history.cash = [];
  if (!s.history.share) s.history.share = [];
  if (!s.history.revenue) s.history.revenue = [];
  if (!s.history.revPerTurn) s.history.revPerTurn = [];
  if (!s.history.profit) s.history.profit = [];

  if (!s.team) s.team = [];
  if (!s.notifications) s.notifications = [];

  if (!s.team.some(e => e.isFounder)) {
    const arch = getArchetype(s.archetype) || { name: 'Founder' };
    s.team.unshift(createFounderEngineer(s.companyName || arch.name, 'microarch'));
  }

  s._processing = false;
  s._lastTotalRevenue = s.totalRevenue || 0;
  s.speed = 0;

  return s;
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
    const snapshot = JSON.parse(JSON.stringify(state));
    delete snapshot._processing;
    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
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
    if (!data.version || data.version < 2) {
      console.warn('Save too old — discarding.');
      return null;
    }
    data.version = SAVE_VERSION;
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
