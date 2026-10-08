// js/ui/panelDashboard.js
// Panel utama: ringkasan perusahaan.

function showDashboard() {
  const opCost = calcOperatingCost(state);
  const activeProjects = state.projects.filter(p => p.status === 'active');
  const doneProjects = state.projects.filter(p => p.status === 'done');
  const launchedThisYear = state.products.filter(p => p.launched && p.launchYear === state.tahun);

  // Cari capaian milik pemain vs kompetitor
  const latestProduct = state.products[state.products.length - 1];

  setPanel('Dashboard', `turn ${state.turn}`, `
    <div class="card-grid">
      <div class="card">
        <div class="meta">KAS PERUSAHAAN</div>
        <div style="font-size:26px;font-family:var(--font-mono);font-weight:700;color:var(--fg-0)">
          ${formatMoneyShort(state.uang)}
        </div>
        <div class="mt-1" style="font-size:11px;color:var(--fg-3)">
          Operasional: ${formatMoneyShort(opCost.total)}/turn
        </div>
      </div>

      <div class="card">
        <div class="meta">PANGSA PASAR</div>
        <div style="font-size:26px;font-family:var(--font-mono);font-weight:700;color:var(--accent)">
          ${formatPercent(state.marketShare)}
        </div>
        <div class="progress mt-1">
          <div class="progress-fill" style="width:${Math.min(100, state.marketShare * 100)}%"></div>
        </div>
      </div>

      <div class="card">
        <div class="meta">TOTAL PENDAPATAN</div>
        <div style="font-size:26px;font-family:var(--font-mono);font-weight:700;color:var(--good)">
          ${formatMoneyShort(state.totalRevenue)}
        </div>
        <div class="mt-1" style="font-size:11px;color:var(--fg-3)">
          ${state.products.filter(p => p.launched).length} produk diluncurkan
        </div>
      </div>
    </div>

    <div class="section-title">Status Perusahaan</div>
    <div class="card">
      <div class="stat-row"><span class="k">Node teknologi aktif</span><span class="v accent">${state.currentNode}</span></div>
      <div class="stat-row"><span class="k">Node dikuasai</span><span class="v">${state.unlockedNodes.length} / ${TECH_TREE.length}</span></div>
      <div class="stat-row"><span class="k">Engineer aktif</span><span class="v">${state.team.length}</span></div>
      <div class="stat-row"><span class="k">Proyek berjalan</span><span class="v">${activeProjects.length}</span></div>
      <div class="stat-row"><span class="k">Produk di pasar</span><span class="v">${state.products.filter(p => p.launched).length}</span></div>
      <div class="stat-row"><span class="k">Utang</span><span class="v ${state.debt > 0 ? 'bad' : ''}">${state.debt > 0 ? formatMoneyShort(state.debt) : '—'}</span></div>
    </div>

    ${activeProjects.length > 0 ? `
      <div class="section-title">Proyek Berjalan</div>
      ${activeProjects.map(p => renderProjectMini(p)).join('')}
    ` : ''}

    ${doneProjects.length > 0 ? `
      <div class="section-title">Siap Diluncurkan</div>
      ${doneProjects.map(p => `
        <div class="card clickable" onclick="renderPanel('production')">
          <div class="row between">
            <h3>${iconOf(p.category)} ${escapeHtml(p.name)}</h3>
            <span class="badge good">Siap</span>
          </div>
          <div class="meta">${p.node} · PERF ${p.perfScore} · TDP ${p.tdp}W · HARGA $${p.price}</div>
        </div>
      `).join('')}
    ` : ''}

    ${latestProduct ? `
      <div class="section-title">Produk Terakhir</div>
      <div class="card">
        <div class="row between">
          <h3>${iconOf(latestProduct.category)} ${escapeHtml(latestProduct.name)}</h3>
          <span class="badge ${latestProduct.launched ? 'good' : 'warn'}">${latestProduct.launched ? 'Diluncurkan' : 'Belum luncur'}</span>
        </div>
        <div class="meta">${getCategory(latestProduct.category).name} · ${latestProduct.node}</div>
        ${latestProduct.launched ? `
          <div class="stat-row"><span class="k">Unit terjual</span><span class="v">${latestProduct.sales.toLocaleString('id-ID')}</span></div>
          <div class="stat-row"><span class="k">Pendapatan</span><span class="v good">${formatMoneyShort(latestProduct.revenue)}</span></div>
        ` : ''}
      </div>
    ` : ''}
  `);
}

function renderProjectMini(p) {
  const progress = calcOverallProgress(p);
  const stage = PROJECT_STAGES[p.stageIndex];
  const remaining = estimateRemainingTurns(p, state.team.filter(e => p.engineerIds.includes(e.id)));
  return `
    <div class="card clickable" onclick="renderPanel('production')">
      <div class="row between">
        <h3>${iconOf(p.category)} ${escapeHtml(p.name)}</h3>
        <span class="badge info">${stage.name}</span>
      </div>
      <div class="meta">${p.node} · ESTIMASI ${remaining} TURN LAGI</div>
      <div class="progress">
        <div class="progress-fill" style="width:${progress}%"></div>
      </div>
      <div style="font-size:11px;color:var(--fg-3);font-family:var(--font-mono)">
        ${progress}% selesai · ${stage.name}
      </div>
    </div>
  `;
}
