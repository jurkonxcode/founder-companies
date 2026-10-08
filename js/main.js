// js/main.js
// Entry point. Boot, binding tombol, dan orkestrasi nextTurn().

// ===== Render semua =====
function renderAll() {
  renderTopbar();
  renderBottomBar();
  renderLog();
  refreshCurrentPanel();
  updateNavBadges();
}

// ===== Badge di nav =====
function updateNavBadges() {
  const ready = state.projects.filter(p => p.status === 'done').length;
  setNavBadge('production', ready > 0);
  const canResearch = canResearchNext(state).ok;
  setNavBadge('research', canResearch);
  const candidates = state.pool.length;
  setNavBadge('team', state.team.length === 0 && candidates > 0);
}

// ===== NEXT TURN — orkestrasi utama =====
function nextTurn() {
  if (!state || state.gameOver) return;

  const btn = document.getElementById('btn-next-turn');
  btn.disabled = true;
  setBottomNote('Memproses turn...', 'busy');

  // 1. Majukan waktu
  state.turn += 1;
  state.bulan += 1;
  if (state.bulan > 12) {
    state.bulan = 1;
    state.tahun += 1;
    addLog(`Tahun ${state.tahun} dimulai.`, 'info');
  }

  // 2. Refresh pool kandidat tiap 6 turn
  if (state.turn % 6 === 0) {
    state.pool = refreshPool(state.pool, state.tahun);
    addLog('Pool kandidat engineer diperbarui.', 'info');
  }

  // 3. Majukan proyek R&D
  let rdSpend = 0;
  const activeProjects = state.projects.filter(p => p.status === 'active');
  for (const p of activeProjects) {
    const assigned = state.team.filter(e => p.engineerIds.includes(e.id));
    const result = advanceProject(p, assigned);
    rdSpend += result.cost;

    if (result.completed) {
      addLog(`Proyek "${p.name}" selesai. Siap diluncurkan.`, 'good');
      toast(`${p.name} selesai dirancang!`, 'good', 'R&D Selesai');
    } else if (result.stageChanged) {
      const stage = PROJECT_STAGES[p.stageIndex];
      addLog(`"${p.name}" masuk tahap ${stage.name}.`, 'info');
    }
  }
  state.uang -= rdSpend;

  // 4. Gaji engineer
  const salary = Math.round(calcMonthlySalary(state.team));
  if (salary > 0) state.uang -= salary;

  // 5. Research point
  const rpGain = calcRPGain(state);
  state.researchPoint += rpGain;

  // 6. Kompetitor bergerak
  const compEvents = simulateCompetitorActions(state);
  for (const ev of compEvents) {
    addLog(`${ev.competitor.name} merilis ${ev.category} baru (${ev.tech.name}).`, 'warn');
  }

  // 7. Update market share
  const recentSales = state.products
    .filter(p => p.launched && state.turn - p.launchTurn <= 2)
    .map(p => ({
      fit: Math.min(1, p.perfScore / 800),
      turnsSinceLaunch: state.turn - p.launchTurn,
    }));
  updateMarketShare(state, recentSales);

  // 8. Pendapatan pasif dari produk lama
  const passive = calcPassiveIncome(state);
  if (passive > 0) {
    state.uang += passive;
    state.totalRevenue += passive;
  }

  // 9. Bayar utang
  if (state.debt > 0) {
    const payment = Math.min(Math.round(state.debt * 0.06), Math.round(state.uang * 0.3));
    if (payment > 0) {
      state.uang -= payment;
      state.debt -= payment;
      if (state.debt < 1000) {
        addLog('Utang lunas.', 'good');
        state.debt = 0;
      }
    }
  }

  // 10. Event bersejarah
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

    // Bonus share langsung
    if (histEv.effects.share) {
      state.marketShare = Math.min(0.75, state.marketShare + histEv.effects.share);
    }
  }

  // 11. Event acak
  const randEv = rollRandomEvent();
  if (randEv) handleRandomEvent(randEv);

  // 12. Update loyalitas
  updateLoyalty(state.team, state.marketShare);

  // 13. Resignasi
  const resigned = checkResignations(state.team);
  for (const eng of resigned) {
    addLog(`${eng.name} mengundurkan diri.`, 'bad');
    toast(`${eng.name} resign!`, 'bad');
    state.team = state.team.filter(e => e.id !== eng.id);
    for (const p of state.projects) {
      p.engineerIds = p.engineerIds.filter(id => id !== eng.id);
    }
  }

  // 14. Cek bangkrut
  const bk = checkBankruptcy(state);
  if (bk.bankrupt) {
    state.gameOver = true;
    addLog('PERUSAHAAN BANGKRUT. Permainan berakhir.', 'bad');
    toast('Perusahaan bangkrut!', 'bad', 'Game Over');
    renderAll();
    btn.disabled = true;
    setBottomNote('Game over.', 'busy');
    return;
  }

  // 15. Ringkasan turn
  const net = passive - salary - rdSpend;
  setBottomNote(
    `Kas ${formatMoneyShort(state.uang)} · ${rpGain} RP · ${compEvents.length} gerakan kompetitor`,
    net >= 0 ? 'good' : 'busy'
  );

  // 16. Render
  renderAll();
  btn.disabled = false;
}

// ===== Handle event acak =====
function handleRandomEvent(ev) {
  const logType = ev.type === 'bad' ? 'bad' : 'good';
  addLog(`${ev.title} — ${ev.desc}`, logType);
  toast(ev.desc, logType, ev.title);

  switch (ev.effect) {
    case 'poach': {
      // Turunkan loyalitas satu engineer acak
      if (state.team.length === 0) break;
      const victim = state.team[Math.floor(Math.random() * state.team.length)];
      victim.loyalty = Math.max(0, victim.loyalty - 20);
      break;
    }
    case 'viral': {
      // Bonus kas instan
      const bonus = Math.round(50000 + state.team.length * 10000);
      state.uang += bonus;
      addLog(`Bonus viral: ${formatMoneyShort(bonus)}.`, 'good');
      break;
    }
    case 'bug': {
      // Biaya perbaikan
      const cost = Math.round(20000 + state.projects.length * 15000);
      state.uang = Math.max(0, state.uang - cost);
      addLog(`Biaya perbaikan bug: ${formatMoneyShort(cost)}.`, 'bad');
      break;
    }
    case 'award': {
      // Tambah market share
      state.marketShare = Math.min(0.75, state.marketShare + 0.01);
      break;
    }
    case 'lawsuit': {
      const cost = Math.round(80000 + state.marketShare * 500000);
      state.uang = Math.max(0, state.uang - cost);
      addLog(`Denda gugatan: ${formatMoneyShort(cost)}.`, 'bad');
      break;
    }
    case 'subsidy': {
      const bonus = Math.round(100000 + state.researchPoint * 200);
      state.uang += bonus;
      addLog(`Subsidi pemerintah: ${formatMoneyShort(bonus)}.`, 'good');
      break;
    }
  }
}

// ===== Binding =====
function bindGlobalActions() {
  document.getElementById('btn-next-turn').addEventListener('click', nextTurn);

  document.getElementById('btn-save').addEventListener('click', () => {
    if (saveGame()) toast('Game disimpan.', 'good');
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    openModal({
      title: 'Reset Game',
      body: '<p>Semua progres akan hilang. Yakin?</p>',
      actions: [
        { label: 'Batal' },
        {
          label: 'Ya, Reset',
          type: 'danger',
          onClick: () => {
            resetGame();
            designDraft = null;
            renderPanel('dashboard');
            renderAll();
          },
        },
      ],
    });
  });
}

// ===== Keyboard shortcuts =====
function bindKeyboard() {
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!state.gameOver) nextTurn();
    }
    if (e.key === '1') renderPanel('dashboard');
    if (e.key === '2') renderPanel('design');
    if (e.key === '3') renderPanel('production');
    if (e.key === '4') renderPanel('team');
    if (e.key === '5') renderPanel('research');
    if (e.key === '6') renderPanel('market');
    if (e.key === '7') renderPanel('finance');
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (saveGame()) toast('Game disimpan.', 'good');
    }
  });
}

// ===== Boot =====
function boot() {
  initState();
  bindNav();
  bindGlobalActions();
  bindKeyboard();
  renderPanel('dashboard');
  renderAll();

  // Kalau game over dari save lama, disable tombol
  if (state.gameOver) {
    document.getElementById('btn-next-turn').disabled = true;
    setBottomNote('Game over. Reset untuk memulai lagi.', 'busy');
  } else {
    setBottomNote(`Selamat datang, pendiri. Klik Next Turn untuk memulai.`, '');
  }
}

document.addEventListener('DOMContentLoaded', boot);
