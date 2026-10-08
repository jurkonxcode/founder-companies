// js/state.js
// State global, save/load, auto-save.
// File ini di-load setelah semua data & systems, sebelum ui.

const SAVE_KEY = 'founder-companies-v2';
const SAVE_VERSION = 2;
const AUTO_SAVE_INTERVAL = 30000; // 30 detik

let state = null;
let autoSaveTimer = null;

// ===== Helper kategori =====
// (CHIP_CATEGORIES didefinisikan di systems/chipDesign.js)
function getCategory(id) {
  return CHIP_CATEGORIES.find(c => c.id === id) || null;
}

// ===== State awal =====
function createInitialState() {
  return {
    version: SAVE_VERSION,
    tahun: 1995,
    bulan: 1,
    turn: 0,

    uang: 1000000,
    researchPoint: 0,

    currentNode: '350nm',
    unlockedNodes: ['350nm'],

    marketShare: 0.02,

    team: [],
    pool: generatePool(8),

    projects: [],
    products: [],

    log: [],
    triggeredEvents: [],

    totalRevenue: 0,
    totalProducts: 0,
    debt: 0,

    gameOver: false,
    founded: { tahun: 1995, bulan: 1 },
  };
}

// ===== Init =====
function initState() {
  const loaded = loadGame();
  if (loaded) {
    state = loaded;
    if (!state.triggeredEvents) state.triggeredEvents = [];
    if (!state.pool || state.pool.length === 0) state.pool = generatePool(8);
    addLog('Save dimuat. Melanjutkan perjalanan...', 'info');
  } else {
    state = createInitialState();
    addLog('Founder Companies didirikan pada Januari 1995.', 'milestone');
    addLog('Modal awal $1.000.000. Node tersedia: 350nm.', 'info');
    addLog('Rekrut engineer di tab Tim untuk memulai R&D.', 'info');
  }
  startAutoSave();
}

// ===== Save / Load =====
function saveGame(silent = false) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    if (!silent) addLog('Game disimpan.', 'info');
    return true;
  } catch (e) {
    console.error('Save error:', e);
    if (!silent) addLog('Gagal menyimpan game.', 'bad');
    return false;
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.version !== SAVE_VERSION) {
      console.warn('Versi save tidak cocok, dibuang.');
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
  addLog('Game direset. Memulai dari Januari 1995.', 'warn');
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
