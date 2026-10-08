// js/ui/panelTeam.js
// Panel tim: hire, fire, training.

function showTeam() {
  const totalSalary = calcMonthlySalary(state.team);
  const perTurnSalary = Math.round(totalSalary / 3);

  setPanel('Tim Engineer', `${state.team.length} aktif · ${state.pool.length} kandidat`, `
    <div class="card-grid">
      <div class="card">
        <div class="meta">TOTAL ENGINEER</div>
        <div style="font-size:26px;font-family:var(--font-mono);font-weight:700">${state.team.length}</div>
      </div>
      <div class="card">
        <div class="meta">BIAYA GAJI / TURN</div>
        <div style="font-size:26px;font-family:var(--font-mono);font-weight:700;color:var(--warn)">${formatMoneyShort(perTurnSalary)}</div>
      </div>
      <div class="card">
        <div class="meta">RATA-RATA LOYALITAS</div>
        <div style="font-size:26px;font-family:var(--font-mono);font-weight:700;color:var(--good)">
          ${state.team.length === 0 ? '—' : Math.round(state.team.reduce((s, e) => s + e.loyalty, 0) / state.team.length) + '%'}
        </div>
      </div>
    </div>

    <div class="section-title">Tim Aktif (${state.team.length})</div>
    ${state.team.length === 0
      ? `<div class="card"><p class="muted">Belum ada engineer. Rekrut dari kandidat di bawah.</p></div>`
      : state.team.map(e => renderEngineerCard(e, 'hired')).join('')
    }

    <div class="section-title">Kandidat (${state.pool.length})</div>
    <div class="row between mb-1">
      <p class="muted" style="font-size:12px">Refresh otomatis tiap 6 turn.</p>
      <button class="btn sm" id="refresh-pool">Muat Ulang (gratis)</button>
    </div>
    ${state.pool.map(e => renderEngineerCard(e, 'candidate')).join('')}
  `);

  bindTeamEvents();
}

function renderEngineerCard(eng, mode) {
  const lv = getLevelInfo(eng.level);
  const spec = getSpecialtyInfo(eng.specialty);
  const lvBadgeClass = {
    C: 'badge', B: 'badge info', A: 'badge cyan',
    S: 'badge purple', SS: 'badge warn',
  }[eng.level] || 'badge';

  const actions = mode === 'candidate'
    ? `<button class="btn primary sm" data-hire="${eng.id}">Rekrut · ${formatMoneyShort(getHireCost(eng))}</button>`
    : `
        <button class="btn sm" data-train="${eng.id}">Latih · ${formatMoneyShort(getTrainingCost(eng) || 0)}</button>
        <button class="btn danger sm" data-fire="${eng.id}">Lepas · ${formatMoneyShort(fireEngineer(eng))}</button>
      `;

  return `
    <div class="card">
      <div class="row between">
        <h3>${spec?.icon || '👤'} ${escapeHtml(eng.name)}</h3>
        <span class="${lvBadgeClass}">${eng.level} · ${lv.name}</span>
      </div>
      <div class="meta">${spec?.name || 'Generalist'} · ${spec?.desc || ''}</div>
      <div class="stat-row"><span class="k">Gaji / bulan</span><span class="v">${formatMoneyShort(eng.salary)}</span></div>
      ${mode === 'hired' ? `
        <div class="stat-row"><span class="k">Loyalitas</span><span class="v ${eng.loyalty < 40 ? 'bad' : eng.loyalty > 80 ? 'good' : ''}">${Math.round(eng.loyalty)}%</span></div>
        <div class="progress">
          <div class="progress-fill ${eng.loyalty < 40 ? 'bad' : eng.loyalty > 80 ? 'good' : ''}" style="width:${eng.loyalty}%"></div>
        </div>
      ` : ''}
      <div class="row mt-2" style="gap:6px">
        ${actions}
      </div>
    </div>
  `;
}

function bindTeamEvents() {
  document.querySelectorAll('[data-hire]').forEach(b => {
    b.addEventListener('click', () => doHire(b.dataset.hire));
  });
  document.querySelectorAll('[data-fire]').forEach(b => {
    b.addEventListener('click', () => doFire(b.dataset.fire));
  });
  document.querySelectorAll('[data-train]').forEach(b => {
    b.addEventListener('click', () => doTrain(b.dataset.train));
  });
  document.getElementById('refresh-pool')?.addEventListener('click', () => {
    state.pool = generatePool(8);
    addLog('Pool kandidat diperbarui.', 'info');
    showTeam();
  });
}

function doHire(engId) {
  const eng = state.pool.find(e => e.id === engId);
  if (!eng) return;
  const cost = getHireCost(eng);
  if (state.uang < cost) { toast('Dana tidak cukup.', 'bad'); return; }

  state.uang -= cost;
  hireEngineer(eng, state.tahun, state.bulan);
  state.team.push(eng);
  state.pool = state.pool.filter(e => e.id !== engId);

  addLog(`Merekrut ${eng.name} (${eng.level} ${eng.specialty}).`, 'good');
  toast(`${eng.name} bergabung.`, 'good');
  showTeam();
}

function doFire(engId) {
  const eng = state.team.find(e => e.id === engId);
  if (!eng) return;
  const severance = fireEngineer(eng);
  state.uang -= severance;
  state.team = state.team.filter(e => e.id !== engId);

  // Hapus dari proyek
  for (const p of state.projects) {
    p.engineerIds = p.engineerIds.filter(id => id !== engId);
  }

  addLog(`${eng.name} meninggalkan perusahaan. Pesangon ${formatMoneyShort(severance)}.`, 'warn');
  toast(`${eng.name} telah dilepas.`, 'warn');
  showTeam();
}

function doTrain(engId) {
  const eng = state.team.find(e => e.id === engId);
  if (!eng) return;
  const cost = getTrainingCost(eng);
  if (cost === null) { toast('Sudah level maksimal.', 'warn'); return; }
  if (state.uang < cost) { toast('Dana tidak cukup.', 'bad'); return; }

  const result = trainEngineer(eng);
  if (result.success) {
    state.uang -= result.cost;
    addLog(`${eng.name} naik ke level ${eng.level}.`, 'good');
    toast(`${eng.name} naik level!`, 'good');
    showTeam();
  }
}
