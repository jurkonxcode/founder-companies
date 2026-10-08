// js/ui/panelMarket.js
// Pangsa pasar, kompetitor, produk di pasar.

function showMarket() {
  const breakdown = getMarketBreakdown(state);
  const activeComps = getActiveCompetitors(state.tahun);
  const launchedProducts = state.products.filter(p => p.launched);

  setPanel('Pasar', `${formatPercent(state.marketShare)} share`, `
    <div class="section-title">Pangsa Pasar Global</div>
    <div class="card">
      <div class="stat-row">
        <span class="k"><strong>Founder Companies</strong> (kamu)</span>
        <span class="v good">${formatPercent(breakdown.player.share)}</span>
      </div>
      <div class="progress">
        <div class="progress-fill good" style="width:${breakdown.player.share * 100}%"></div>
      </div>
      <div class="divider"></div>
      ${breakdown.competitors.map(c => `
        <div class="stat-row">
          <span class="k">${c.icon} ${c.name}</span>
          <span class="v">${formatPercent(c.share)}</span>
        </div>
        <div class="progress">
          <div class="progress-fill" style="width:${c.share * 100}%;background:${c.color || 'var(--fg-3)'}"></div>
        </div>
      `).join('')}
      <div class="stat-row mt-1">
        <span class="k">Lainnya (fragmentasi)</span>
        <span class="v">${formatPercent(breakdown.others.share)}</span>
      </div>
    </div>

    <div class="section-title">Kompetitor Aktif (${activeComps.length})</div>
    ${activeComps.map(c => renderCompetitorCard(c)).join('')}

    <div class="section-title">Segmen Pasar</div>
    ${getAvailableSegments(state.tahun).map(s => renderSegmentCard(s)).join('')}

    ${launchedProducts.length > 0 ? `
      <div class="section-title">Produk Kamu di Pasar (${launchedProducts.length})</div>
      ${launchedProducts.slice(-6).reverse().map(p => renderProductMarketCard(p)).join('')}
    ` : ''}
  `);
}

function renderCompetitorCard(c) {
  return `
    <div class="card">
      <div class="row between">
        <h3>${c.icon} ${c.name}</h3>
        <span class="badge">Sejak ${c.founded}</span>
      </div>
      <div class="meta">FOKUS: ${c.focus.join(', ').toUpperCase()}</div>
      <p class="muted" style="font-size:12px">${c.personality}</p>
      <div class="divider"></div>
      <div class="stat-row"><span class="k">Agresivitas</span><span class="v">${(c.aggression * 100).toFixed(0)}%</span></div>
      <div class="stat-row"><span class="k">Kualitas chip</span><span class="v">${(c.quality * 100).toFixed(0)}%</span></div>
      <div class="stat-row"><span class="k">Strategi harga</span><span class="v">${(c.pricing * 100).toFixed(0)}%</span></div>
    </div>
  `;
}

function renderSegmentCard(s) {
  const sizeMult = Math.pow(1 + s.growthRate, state.tahun - s.year);
  return `
    <div class="card">
      <div class="row between">
        <h3>${s.icon} ${s.name}</h3>
        <span class="badge info">Sejak ${s.year}</span>
      </div>
      <div class="meta">PASAR: ~${Math.round(s.marketSize * sizeMult).toLocaleString('id-ID')} unit/thn · PERTUMBUHAN ${(s.growthRate * 100).toFixed(1)}%/thn</div>
      <div class="stat-row"><span class="k">Prioritas harga</span><span class="v">${(s.priceWeight * 100).toFixed(0)}%</span></div>
      <div class="stat-row"><span class="k">Prioritas performa</span><span class="v">${(s.perfWeight * 100).toFixed(0)}%</span></div>
      <div class="stat-row"><span class="k">Prioritas TDP</span><span class="v">${(s.tdpWeight * 100).toFixed(0)}%</span></div>
      <div class="stat-row"><span class="k">Prioritas fitur</span><span class="v">${(s.featureWeight * 100).toFixed(0)}%</span></div>
    </div>
  `;
}

function renderProductMarketCard(p) {
  const ageTurns = state.turn - p.launchTurn;
  return `
    <div class="card">
      <div class="row between">
        <h3>${iconOf(p.category)} ${escapeHtml(p.name)}</h3>
        <span class="badge ${ageTurns < 3 ? 'good' : ageTurns < 12 ? 'info' : ''}">
          ${ageTurns < 3 ? 'Baru' : ageTurns < 12 ? 'Aktif' : 'Lama'}
        </span>
      </div>
      <div class="meta">${p.node} · ${getSegment(p.segment)?.name || '-'} · ${formatDate(p.launchYear, p.launchMonth)}</div>
      <div class="stat-row"><span class="k">Total terjual</span><span class="v">${p.sales.toLocaleString('id-ID')}</span></div>
      <div class="stat-row"><span class="k">Total pendapatan</span><span class="v good">${formatMoneyShort(p.revenue)}</span></div>
      <div class="stat-row"><span class="k">Umur produk</span><span class="v">${ageTurns} turn</span></div>
    </div>
  `;
}
