// js/main.js
// Entry point: menu init, game boot, turn loop, speed control.
// 4-tab nav: Home · Create · Production · Market.

// =========================================================
// SPEED CONTROL
// =========================================================
let _turnTimer = null;

function setSpeed(rate) {
  if (_turnTimer) { clearInterval(_turnTimer); _turnTimer = null; }

  if (typeof state !== 'undefined' && state) {
    state.speed = rate;
    if (rate > 0) state._lastSpeed = rate;
  }

  document.querySelectorAll('[data-speed]').forEach(b => {
    const bRate = parseInt(b.dataset.speed);
    b.classList.toggle('active', bRate === rate);
  });

  if (rate > 0) {
    const interval = 3000 / rate;
    _turnTimer = setInterval(() => {
      if (!state || state.gameOver) { setSpeed(0); return; }
      nextTurn(true);
    }, interval);
  }
}

function togglePause() {
  if (!state) return;
  if (state.speed > 0) setSpeed(0);
  else setSpeed(state._lastSpeed || 1);
}

function bindSpeedControls() {
  document.querySelectorAll('[data-speed]').forEach(btn => {
    btn.addEventListener('click', () => setSpeed(parseInt(btn.dataset.speed)));
  });
}

// =========================================================
// RENDER ALL
// =========================================================
function renderAll() {
  renderTopbar();
  renderBottomBar();
  renderLog();
  refreshCurrentPanel();
  updateNavBadges();
}

function updateNavBadges() {
  const ready = state.projects.filter(p => p.status === 'done').length;
  setNavBadge('production', ready > 0);
  const candidates = state.pool.length;
  const needTeam = state.team.filter(e => !e.isFounder).length === 0 && candidates > 0;
  if (needTeam) setNavBadge('production', true);
}

// =========================================================
// NEXT TURN
// =========================================================
function nextTurn(fromAuto = false) {
  if (!state || state.gameOver || state._processing) return;
  state._processing = true;

  const btn = document.getElementById('btn-next-turn');
  if (!fromAuto && btn) btn.disabled = true;
  setBottomNote('Processing turn...', 'busy');

  // 1. Advance time
  state.turn += 1;
  state.bulan += 1;
  if (state.bulan > 12) {
    state.bulan = 1;
    state.tahun += 1;
    addLog(`Year ${state.tahun} begins.`, 'info');
  }

  // 1b. Trigger headlines for this month
  if (typeof checkMonthHeadlines === 'function') {
    checkMonthHeadlines(state.tahun, state.bulan);
  }

  // 2. Refresh candidate pool every 6 turns
  if (state.turn % 6 === 0) {
    state.pool = refreshPool(state.pool, state.tahun);
    addLog('Engineer candidate pool refreshed.', 'info');
  }

  // 3. Advance R&D projects
  let rdSpend = 0;
  const activeProjects = state.projects.filter(p => p.status === 'active');
  for (const p of activeProjects) {
    const assigned = state.team.filter(e => p.engineerIds && p.engineerIds.includes(e.id));
    const result = advanceProject(p, assigned);
    rdSpend += result.cost;

    const stages = p.stages || PROJECT_STAGES;

    if (result.completed) {
      addLog(`Project "${p.name}" completed. Ready to launch.`, 'good');
      toast(`${p.name} is ready to launch!`, 'good', '✅ R&D Complete');
      if (typeof pushNotification === 'function') {
        pushNotification({
          cat: 'rnd',
          title: `R&D complete: ${p.name}`,
          desc: 'Ready to launch from Production tab.',
          isActivity: true,
        });
      }
      if (state.speed > 0) setSpeed(0);
    } else if (result.stageChanged) {
      const stage = stages[p.stageIndex];
      addLog(`"${p.name}" entered ${stage.name} stage.`, 'info');
      if (typeof pushNotification === 'function') {
        pushNotification({
          cat: 'rnd',
          title: `${p.name} → ${stage.name}`,
          desc: `Stage ${p.stageIndex + 1} of ${stages.length} · ${p.elapsedMonths || 0}/${p.totalMonths || 0} months elapsed.`,
          isActivity: true,
        });
      }
    }
  }
  state.uang -= rdSpend;

  // 4. Salaries
  const salary = Math.round(calcMonthlySalary(state.team));
  if (salary > 0) state.uang -= salary;

  // 5. Research points
  const rpGain = calcRPGain(state);
  state.researchPoint += rpGain;

  // 6. Competitor moves
  const compEvents = simulateCompetitorActions(state);
  for (const ev of compEvents) {
    addLog(`${ev.competitor.name} released a new ${ev.category} (${ev.tech.name}).`, 'warn');
  }

  // 7. Update market share
  const recentSales = state.products
    .filter(p => p.launched && state.turn - p.launchTurn <= 2)
    .map(p => ({
      fit: Math.min(1, p.perfScore / 800),
      turnsSinceLaunch: state.turn - p.launchTurn,
    }));
  updateMarketShare(state, recentSales);

  // 8. Passive income
  const passive = calcPassiveIncome(state);
  if (passive > 0) {
    state.uang += passive;
    state.totalRevenue += passive;
  }

  // 8b. AUTO-PAUSE SAFETY — stop if cash falls below 3 turns of burn
  const currentBurn = calcOperatingCost(state).total + rdSpend;
  const cashFloor = currentBurn * 3;
  let _autoPausedThisTurn = false;

  if (state.uang > 0 && state.uang < cashFloor && state.speed > 0) {
    setSpeed(0);
    _autoPausedThisTurn = true;
    addLog(`⚠ Low cash (${formatMoneyShort(state.uang)}) — auto-paused. Burn: ${formatMoneyShort(currentBurn)}/turn.`, 'warn');
    toast(
      `Cash ${formatMoneyShort(state.uang)} below safety floor. Speed auto-paused.`,
      'warn',
      '⚠ Low Cash'
    );
  }

  // 9. Debt payment
  if (state.debt > 0) {
    const payment = Math.min(Math.round(state.debt * 0.06), Math.round(state.uang * 0.3));
    if (payment > 0) {
      state.uang -= payment;
      state.debt -= payment;
      if (state.debt < 1000) {
        addLog('Debt fully repaid.', 'good');
        state.debt = 0;
      }
    }
  }

  // 10. Historical event
  const histEv = getHistoricalEvent(state.tahun, state.bulan);
  if (histEv && !state.triggeredEvents.find(e => e.id === histEv.id)) {
    state.triggeredEvents.push({
      id: histEv.id,
      turn: state.turn,
      effects: histEv.effects,
    });
    const logType = histEv.type === 'bad' ? 'bad' : histEv.type === 'milestone' ? 'milestone' : 'info';
    addLog(`${histEv.title} — ${histEv.desc}`, logType);
    toast(histEv.desc, histEv.type === 'bad' ? 'bad' : 'info', histEv.title);

    if (histEv.effects.share) {
      state.marketShare = Math.min(0.75, state.marketShare + histEv.effects.share);
    }
    if (state.speed > 0) setSpeed(0);
  }

  // 11. Random event
  const randEv = rollRandomEvent();
  if (randEv) handleRandomEvent(randEv);

  // 12. Loyalty update
  updateLoyalty(state.team, state.marketShare);

  // 13. Resignations
  const resigned = checkResignations(state.team);
  for (const eng of resigned) {
    addLog(`${eng.name} resigned.`, 'bad');
    toast(`${eng.name} resigned!`, 'bad');
    state.team = state.team.filter(e => e.id !== eng.id);
    for (const p of state.projects) {
      if (p.engineerIds) p.engineerIds = p.engineerIds.filter(id => id !== eng.id);
    }
  }

  // 14. Bankruptcy
  const bk = checkBankruptcy(state);

  // 14b. Near-bankruptcy alert (before hitting zero)
  if (!bk.bankrupt && state.uang > 0 && state.uang < currentBurn && state.speed > 0) {
    setSpeed(0);
    _autoPausedThisTurn = true;
    addLog(`⚠ CRITICAL: Cash ${formatMoneyShort(state.uang)} — less than 1 turn of burn.`, 'bad');
    toast(
      `Cash ${formatMoneyShort(state.uang)}. Less than 1 turn of expenses. Production paused.`,
      'bad',
      '🚨 Near Bankruptcy'
    );
  }

  if (bk.bankrupt) {
    state.gameOver = true;
    addLog('COMPANY BANKRUPT. Game over.', 'bad');
    toast('Company bankrupt!', 'bad', 'Game Over');
    if (state.speed > 0) setSpeed(0);
    renderAll();
    if (btn) btn.disabled = true;
    setBottomNote('Game over.', 'busy');
    state._processing = false;
    return;
  }

  // 15. History
  if (!state.history) {
    state.history = { cash: [], share: [], revenue: [], revPerTurn: [], profit: [] };
  }
  if (!state.history.revPerTurn) state.history.revPerTurn = [];
  if (!state.history.profit) state.history.profit = [];

  state.history.cash.push(Math.round(state.uang));
  state.history.share.push(parseFloat(state.marketShare.toFixed(4)));
  state.history.revenue.push(Math.round(state.totalRevenue));

  const revThisTurn = Math.max(0, state.totalRevenue - (state._lastTotalRevenue || 0));
  state._lastTotalRevenue = state.totalRevenue;

  const opCostNow = calcOperatingCost(state);
  const profitThisTurn = revThisTurn - opCostNow.total;

  state.history.revPerTurn.push(Math.round(revThisTurn));
  state.history.profit.push(Math.round(profitThisTurn));

  ['cash', 'share', 'revenue', 'revPerTurn', 'profit'].forEach(k => {
    if (state.history[k] && state.history[k].length > 24) state.history[k].shift();
  });

  // 16. Turn summary
  const net = passive - salary - rdSpend;
  if (!_autoPausedThisTurn) {
    setBottomNote(
      `Cash ${formatMoneyShort(state.uang)} · ${rpGain} RP · ${compEvents.length} rival moves`,
      net >= 0 ? 'good' : 'busy'
    );
  }

  renderAll();
  if (!fromAuto && btn) btn.disabled = false;
  state._processing = false;
}

// =========================================================
// RANDOM EVENT
// =========================================================
function handleRandomEvent(ev) {
  const logType = ev.type === 'bad' ? 'bad' : 'good';
  addLog(`${ev.title} — ${ev.desc}`, logType);
  toast(ev.desc, logType, ev.title);

  const diff = (typeof getActiveDifficulty === 'function' && state)
    ? getActiveDifficulty(state)
    : { playerPenaltyMult: 1 };

  switch (ev.effect) {
    case 'poach': {
      const hired = state.team.filter(e => !e.isFounder);
      if (hired.length === 0) break;
      const victim = hired[Math.floor(Math.random() * hired.length)];
      victim.loyalty = Math.max(0, victim.loyalty - 20);
      break;
    }
    case 'viral': {
      const bonus = Math.round(50000 + state.team.length * 10000);
      state.uang += bonus;
      addLog(`Viral bonus: ${formatMoneyShort(bonus)}.`, 'good');
      break;
    }
    case 'bug': {
      const cost = Math.round((20000 + state.projects.length * 15000) * diff.playerPenaltyMult);
      state.uang = Math.max(0, state.uang - cost);
      addLog(`Bug fix cost: ${formatMoneyShort(cost)}.`, 'bad');
      break;
    }
    case 'award': {
      state.marketShare = Math.min(0.75, state.marketShare + 0.01);
      break;
    }
    case 'lawsuit': {
      const cost = Math.round((80000 + state.marketShare * 500000) * diff.playerPenaltyMult);
      state.uang = Math.max(0, state.uang - cost);
      addLog(`Lawsuit fine: ${formatMoneyShort(cost)}.`, 'bad');
      break;
    }
    case 'subsidy': {
      const bonus = Math.round(100000 + state.researchPoint * 200);
      state.uang += bonus;
      addLog(`Government subsidy: ${formatMoneyShort(bonus)}.`, 'good');
      break;
    }
  }
}

// =========================================================
// PANEL ROUTER
// =========================================================
function renderPanel(name, focus) {
  switch (name) {
    case 'dashboard':
    case 'home':
      if (typeof showDashboard === 'function') showDashboard();
      break;
    case 'production':
    case 'factory':
      if (typeof showProduction === 'function') showProduction(focus);
      break;
    case 'team':
      if (typeof showProduction === 'function') showProduction('team');
      break;
    case 'research':
      if (typeof showProduction === 'function') showProduction('research');
      break;
    case 'market':
      if (typeof openMarketModal === 'function') openMarketModal();
      break;
    case 'design':
      if (typeof showDesign === 'function') showDesign();
      break;
    case 'finance':
      if (typeof showFinance === 'function') showFinance();
      break;
    default:
      if (typeof showDashboard === 'function') showDashboard();
  }
  updateActiveTab(name);
}

function updateActiveTab(name) {
  const tabMap = {
    dashboard: 'dashboard',
    home: 'dashboard',
    production: 'production',
    factory: 'production',
    team: 'production',
    research: 'production',
    design: 'design',
    finance: 'production',
    market: null,
  };
  const target = tabMap[name];
  if (target === null) return;
  document.querySelectorAll('.nav-btn').forEach(b => {
    const panel = b.dataset.panel;
    b.classList.toggle('active', panel === target);
  });
}

let _currentPanel = 'dashboard';
function refreshCurrentPanel() {
  const marketOpen = document.getElementById('market-modal')?.classList.contains('active');
  const profileOpen = document.getElementById('profile-modal')?.classList.contains('active');
  const designerOpen = document.getElementById('modal-wrap')?.classList.contains('active');

  if (marketOpen || profileOpen || designerOpen) return;

  if (_currentPanel === 'dashboard') {
    if (typeof showDashboard === 'function') showDashboard();
  } else if (_currentPanel === 'production') {
    if (typeof showProduction === 'function') showProduction();
  } else if (_currentPanel === 'design') {
    if (typeof showDesign === 'function') showDesign();
  } else if (_currentPanel === 'finance') {
    if (typeof showFinance === 'function') showFinance();
  }
}

const _origRenderPanel = renderPanel;
window.renderPanel = function(name, focus) {
  if (name && name !== 'market') _currentPanel = name;
  return _origRenderPanel(name, focus);
};

// =========================================================
// BINDINGS
// =========================================================
function bindGlobalActions() {
  document.getElementById('btn-next-turn')?.addEventListener('click', () => nextTurn(false));
}

function bindNav() {
  document.querySelectorAll('.nav-btn[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => {
      _currentPanel = btn.dataset.panel;
      renderPanel(btn.dataset.panel);
    });
  });

  document.getElementById('nav-create')?.addEventListener('click', () => {
    if (typeof openDesignerCategoryChooser === 'function') {
      openDesignerCategoryChooser();
    } else {
      alert('designer.js not loaded.');
    }
  });

  document.getElementById('nav-market')?.addEventListener('click', () => {
    if (typeof openMarketModal === 'function') {
      openMarketModal();
    } else {
      alert('panelMarket.js not loaded.');
    }
  });
}

function bindKeyboard() {
  document.addEventListener('keydown', e => {
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (state && !state.gameOver) nextTurn(false);
    }
    if (e.key === ' ') {
      e.preventDefault();
      togglePause();
    }

    if (e.key === '1') { if (e.shiftKey) setSpeed(1); else { _currentPanel = 'dashboard'; renderPanel('dashboard'); } }
    if (e.key === '2') { if (e.shiftKey) setSpeed(2); else { _currentPanel = 'production'; renderPanel('production'); } }
    if (e.key === '3') { if (e.shiftKey) setSpeed(3); else { if (typeof openDesignerCategoryChooser === 'function') openDesignerCategoryChooser(); } }
    if (e.key === '4') { if (e.shiftKey) setSpeed(4); else { if (typeof openMarketModal === 'function') openMarketModal(); } }

    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (saveGame()) toast('Game saved.', 'good');
    }
  });
}

// =========================================================
// BOOT
// =========================================================
function boot() {
  if (!state) initState();
  bindNav();
  bindGlobalActions();
  bindKeyboard();
  bindSpeedControls();
  if (typeof bindProfileButton === 'function') bindProfileButton();
  if (typeof updateProfileAvatar === 'function') updateProfileAvatar();
  if (typeof initSystemStatus === 'function') initSystemStatus();
  if (typeof bindNewsDrawer === 'function') bindNewsDrawer();
  if (typeof bindNotificationBell === 'function') bindNotificationBell();
  _currentPanel = 'dashboard';
  renderPanel('dashboard');
  renderAll();

  const savedSpeed = state.speed || 0;
  setSpeed(savedSpeed);

  if (state.gameOver) {
    const btn = document.getElementById('btn-next-turn');
    if (btn) btn.disabled = true;
    setBottomNote('Game over. Reset to play again.', 'busy');
  } else {
    setBottomNote('Welcome, founder. Choose a speed to begin.', '');
  }
}

function bootGame() {
  boot();
}

function loadAndBootGame() {
  initState();
  boot();
}

// =========================================================
// ENTRY POINT
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
  if (typeof initMenu === 'function') {
    initMenu();
  } else {
    console.warn('[Main] initMenu not found — booting directly.');
    boot();
  }
});
