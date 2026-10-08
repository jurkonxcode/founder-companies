// js/ui/panelProduction.js
// Panel proyek aktif, siap diluncurkan, dan riwayat produk.

function showProduction() {
  const active = state.projects.filter(p => p.status === 'active');
  const ready = state.projects.filter(p => p.status === 'done');
  const launched = state.products.filter(p => p.launched);
  const cancelled = state.projects.filter(p => p.status === 'cancelled');

  setPanel('Produksi', `${active.length} aktif · ${ready.length} siap`, `
    ${ready.length > 0 ? `
      <div class="section-title">Siap Diluncurkan (${ready.length})</div>
      ${ready.map(p => renderReadyCard(p)).join('')}
    ` : ''}

    ${active.length > 0 ? `
      <div class="section-title">Proyek Berjalan (${active.length})</div>
      ${active.map(p => renderActiveCard(p)).join('')}
    ` : ''}

    ${active.length === 0 && ready.length === 0 ? `
      <div class="empty">
        ${ICONS.empty}
        <h3>Tidak ada proyek berjalan</h3>
        <p>Mulai proyek baru di tab Rancang.</p>
        <button class="btn primary" onclick="renderPanel('design')">Rancang Chip</button>
      </div>
    ` : ''}

    ${launched.length > 0 ? `
      <div class="section-title">Produk di Pasar (${launched.length})</div>
      <div class="card">
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Kategori</th>
              <th>Node</th>
              <th class="num">Perf</th>
              <th class="num">Harga</th>
              <th class="num">Terjual</th>
              <th class="num">Pendapatan</th>
            </tr>
          </thead>
          <tbody>
            ${launched.slice(-10).reverse().map(p => `
              <tr>
                <td>${escapeHtml(p.name)}</td>
                <td>${getCategory(p.category).name}</td>
                <td>${p.node}</td>
                <td class="num">${p.perfScore}</td>
                <td class="num">$${p.price}</td>
                <td class="num">${p.sales.toLocaleString('id-ID')}</td>
                <td class="num good">${formatMoneyShort(p.revenue)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    ${cancelled.length > 0 ? `
      <div class="section-title">Dibatalkan (${cancelled.length})</div>
      ${cancelled.slice(-3).reverse().map(p => `
        <div class="card" style="opacity:0.5">
          <div class="meta">${escapeHtml(p.name)} · ${p.node} · DIBATALKAN</div>
        </div>
      `).join('')}
    ` : ''}
  `);

  // Bind
  document.querySelectorAll('[data-launch]').forEach(b => {
    b.addEventListener('click', () => launchProduct(b.dataset.launch));
  });
  document.querySelectorAll('[data-cancel]').forEach(b => {
    b.addEventListener('click', () => confirmCancel(b.dataset.cancel));
  });
}

function renderActiveCard(p) {
  const progress = calcOverallProgress(p);
  const stage = PROJECT_STAGES[p.stageIndex];
  const assigned = state.team.filter(e => p.engineerIds.includes(e.id));
  const remaining = estimateRemainingTurns(p, assigned);

  return `
    <div class="card">
      <div class="row between">
        <h3>${iconOf(p.category)} ${escapeHtml(p.name)}</h3>
        <span class="badge info">${stage.name}</span>
      </div>
      <div class="meta">${p.node} · ${getSegment(p.segment)?.name || '-'} · ${assigned.length} engineer</div>

      <div class="progress">
        <div class="progress-fill" style="width:${progress}%"></div>
      </div>
      <div class="row between" style="font-size:11px;color:var(--fg-3);font-family:var(--font-mono)">
        <span>${progress}% · ${stage.name}</span>
        <span>~${remaining} turn lagi</span>
      </div>

      <div class="divider"></div>

      <div class="stat-row"><span class="k">Performa target</span><span class="v">${p.perfScore}</span></div>
      <div class="stat-row"><span class="k">TDP target</span><span class="v">${p.tdp} W</span></div>
      <div class="stat-row"><span class="k">Biaya terpakai</span><span class="v">${formatMoneyShort(p.spent)} / ${formatMoneyShort(p.designBudget)}</span></div>

      <div class="mt-2">
        <button class="btn danger sm" data-cancel="${p.id}">Batalkan Proyek</button>
      </div>
    </div>
  `;
}

function renderReadyCard(p) {
  const seg = getSegment(p.segment);
  const margin = p.price - p.unitCost;
  return `
    <div class="card selected">
      <div class="row between">
        <h3>${iconOf(p.category)} ${escapeHtml(p.name)}</h3>
        <span class="badge good">SIAP</span>
      </div>
      <div class="meta">${p.node} · TARGET: ${seg?.name || '-'}</div>

      <div class="stat-row"><span class="k">Performa</span><span class="v accent">${p.perfScore}</span></div>
      <div class="stat-row"><span class="k">TDP</span><span class="v">${p.tdp} W</span></div>
      <div class="stat-row"><span class="k">Yield</span><span class="v">${(p.yieldRate * 100).toFixed(0)}%</span></div>
      <div class="stat-row"><span class="k">Unit cost</span><span class="v">${formatMoney(p.unitCost)}</span></div>
      <div class="stat-row"><span class="k">Harga jual</span><span class="v">$${p.price}</span></div>
      <div class="stat-row"><span class="k">Margin per unit</span><span class="v ${margin > 0 ? 'good' : 'bad'}">${formatMoney(margin)}</span></div>

      <button class="btn good lg mt-2" data-launch="${p.id}">
        ${ICONS.check} Luncurkan ke Pasar
      </button>
    </div>
  `;
}

function launchProduct(projectId) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project || project.status !== 'done') return;

  // Konversi proyek menjadi produk
  const product = {
    id: project.id,
    name: project.name,
    category: project.category,
    node: project.node,
    perfScore: project.perfScore,
    tdp: project.tdp,
    featureScore: project.featureScore,
    yieldRate: project.yieldRate,
    unitCost: project.unitCost,
    price: project.price,
    segment: project.segment,
    launchTurn: state.turn,
    launchYear: state.tahun,
    launchMonth: state.bulan,
    sales: 0,
    revenue: 0,
    launched: true,
  };

  // Hitung penjualan awal
  const salesResult = calcProductSales(product, state, state.tahun);
  product.sales = salesResult.sales;
  product.revenue = salesResult.revenue;

  state.uang += salesResult.revenue;
  state.totalRevenue += salesResult.revenue;
  state.totalProducts += 1;
  state.researchPoint += Math.round(project.perfScore / 8);

  // Bonus market share
  const shareGain = Math.min(0.05, salesResult.fit / 2500);
  state.marketShare = Math.min(0.75, state.marketShare + shareGain);

  state.products.push(product);

  addLog(
    `"${product.name}" diluncurkan — ${product.sales.toLocaleString('id-ID')} unit, pendapatan ${formatMoneyShort(product.revenue)}.`,
    'good'
  );
  toast(
    `${product.name} sukses diluncurkan! ${formatMoneyShort(product.revenue)}`,
    'good'
  );

  renderPanel('production');
}

function confirmCancel(projectId) {
  const p = state.projects.find(x => x.id === projectId);
  if (!p) return;
  const refund = Math.round((p.designBudget - p.spent) * 0.3);
  openModal({
    title: 'Batalkan Proyek',
    body: `
      <p>Batalkan <strong>${escapeHtml(p.name)}</strong>?</p>
      <p class="muted mt-1">Refund ${formatMoneyShort(refund)} dari sisa budget.</p>
    `,
    actions: [
      { label: 'Batal', type: '' },
      {
        label: 'Ya, Batalkan',
        type: 'danger',
        onClick: () => {
          p.status = 'cancelled';
          state.uang += refund;
          addLog(`Proyek "${p.name}" dibatalkan. Refund ${formatMoneyShort(refund)}.`, 'warn');
          toast('Proyek dibatalkan.', 'warn');
          renderPanel('production');
        },
      },
    ],
  });
    }
