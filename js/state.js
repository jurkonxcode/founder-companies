// js/state.js
// Global state, save/load, auto-save.
// Loaded after data & systems, before UI.

const SAVE_KEY = 'founder-companies-v2';
const SAVE_VERSION = 2;
const AUTO_SAVE_INTERVAL = 30000;

let state = null;
let autoSaveTimer = null;

// ===== Category helper =====
function getCategory(id) {
  return CHIP_CATEGORIES.find(c => c.id === id) || null;
}

// ===== Initial state =====
function createInitialState(archetype = null) {
  const arch = archetype || getArchetype('founder');
  const startingCash = arch?.bonuses?.startingCash || 5000;

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

    team: [],
    pool: generatePool(6),

    projects: [],
    products: [],

    log: [],
    triggeredEvents: [],

    totalRevenue: 0,
    totalProducts: 0,
    debt: 0,

    archetype: arch ? arch.id : 'founder',

    gameOver: false,
    founded: { tahun: 1995, bulan: 1 },
  };
}

// ===== Init =====
function initState() {
  if (state) { startAutoSave(); return; }

  const loaded = loadGame();
  if (loaded) {
    state = loaded;
    if (!state.archetype) state.archetype = 'founder';
    if (!state.triggeredEvents) state.triggeredEvents = [];
    if (!state.pool || state.pool.length === 0) state.pool = generatePool(6);
    addLog('Save loaded. Resuming campaign...', 'info');
  } else {
    state = createInitialState();
  }
  startAutoSave();
}

// ===== Init with specific archetype (called from menu) =====
function initStateWithArchetype(arch, options = {}) {
  state = createInitialState(arch);
  if (options.tahun) state.tahun = options.tahun;
  if (options.uang) state.uang = options.uang;
  addLog(`${arch.name} founded in ${formatDate(state.tahun, state.bulan)}.`, 'milestone');
  addLog(`Starting cash: ${formatMoneyShort(state.uang)}. Node: 350nm.`, 'info');
  addLog('Recruit at least one engineer before starting R&D.', 'info');
  startAutoSave();
}

// ===== Archetype bonus helpers =====
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

// ===== Save / Load =====
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
      console.warn('Save version mismatch, discarding.');
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

// ===== Auto-save =====
function startAutoSave() {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  autoSaveTimer = setInterval(() => saveGame(true), AUTO_SAVE_INTERVAL);
}

window.addEventListener('beforeunload', () => {
  if (state && !state.gameOver) saveGame(true);
});

// ===== Log =====
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
