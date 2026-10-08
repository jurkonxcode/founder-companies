// js/ui/panelDashboard.js
// Home panel — rank card, profit chart, product lineup.

// =========================================================
// HELPERS — SVG chart engine
// =========================================================
function svgLinePath(data, w, h, pad) {
  if (!data || data.length < 2) return '';
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = (max - min) || 1;
  const stepX = (w - pad * 2) / (data.length - 1);
  return data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (h - pad * 2) * (1 - (v - min) / range);
    return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
}

function svgAreaPath(data, w, h, pad) {
  const line = svgLinePath(data, w, h, pad);
  if (!line) return '';
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = (max - min) || 1;
  const stepX = (w - pad * 2) / (data.length - 1);
  const lastX = pad + (data.length - 1) * stepX;
  const firstX = pad;
  return `${line} L ${lastX},${h - pad} L ${firstX},${h - pad} Z`;
}

function monthLabel(turnOffset, currentTurn, currentYear, currentMonth) {
  // Walk back `turnOffset` months from current (year,month)
  let m = currentMonth - turnOffset;
  let y = currentYear;
  while (m <= 0) { m += 12; y -= 1; }
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${names[m-1]} '${String(y).slice(-2)}`;
}

// =========================================================
// MAIN
// =========================================================
function showDashboard() {
  const opCost = calcOperatingCost(state);
  const launched = state.products.filter(p => p.launched);
  const activeProjects = state.projects.filter(p => p.status === 'active');
  const doneProjects = state.projects.filter(p => p.status === 'done');
  const hist = state.history || {};

  // ===== Monthly revenue (this turn) =====
  const revPerTurn = hist.revPerTurn && hist.revPerTurn.length
    ? hist.revPerTurn[hist.revPerTurn.length - 1]
    : calcPassiveIncome(state);
  const profitPerTurn = hist.profit && hist.profit.length
    ? hist.profit[hist.profit.length - 1]
    : revPerTurn - opCost.total;

  // ===== Rival leaderboard =====
  const playerShare = state.marketShare || 0.02;
  const totalMarketRev = playerShare > 0 ? revPerTurn / playerShare : 0;
  const rivals = (getActiveCompetitors(state.tahun) || []).map(c => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    share: c.startingShare * (1 + (state.tahun - c.founded) * 0.01),
  }));
  const rivalRev = rivals.map(r => ({
    ...r,
    revenue: totalMarketRev * r.share,
  }));
  const allCompanies = [
    { id: 'player', name: state.companyName || 'You', icon: '⭐', color: 'var(--accent)', revenue: revPerTurn, isPlayer: true, share: playerShare },
    ...rivalRev,
  ].sort((a, b) => b.revenue - a.revenue);

  const myRank = allCompanies.findIndex(c => c.isPlayer) + 1;
  const leader = allCompanies[0];
  const second = allCompanies[1];
  const gapToLeader = leader.revenue - revPerTurn;
  const gapToSecond = second && !second.isPlayer ? second.revenue - revPerTurn : 0;

  // ===== Profit chart data =====
  const profitSeries = (hist.profit && hist.profit.length >= 2)
    ? hist.profit.slice(-12)
    : [profitPerTurn, profitPerTurn]; // fallback

  const peakProfit = Math.max(...profitSeries);
  const minProfit = Math.min(...profitSeries);
  const peakIdx = profitSeries.indexOf(peakProfit);

  // ===== Lineup =====
  const lineupProducts = launched.slice(-8).reverse();
  const totalProductRev = launched.reduce((s, p) => s + (p.revenue || 0), 0);

  setPanel('Home', `Turn ${state.turn} · ${formatDate(state.tahun, state.bulan)}`, `

    <!-- ============ RANK CARD ============ -->
    <div class="rank-card">
      <div class="rank-top">
        <div class="rank-number">
          <span class="hash">#</span><span class="num">${myRank}</span>
        </div>
        <div class="rank-company">
          <div class="rank-name-row">
            <span class="rank-dot" style="background: var(--accent);"></span>
            <span class="rank-name">${escapeHtml(state.companyName || 'Founder Companies')}</span>
            <span class="rank-you">YOU</span>
          </div>
          <div class="rank-sub">${formatMoneyShort(revPerTurn)}/mo · of ${allCompanies.length} companies</div>
        </div>
      </div>

      <div class="rank-chips">
        ${myRank > 1 ? `
          <div class="chip chip-bad">
            ▼ ${formatMoneyShort(gapToLeader)}/mo behind ${escapeHtml(leader.name)}
          </div>
        ` : `
          <div class="chip chip-good">
            ▲ Industry leader
          </div>
        `}
        <div class="chip chip-neutral">
          Market share ${(playerShare * 100).toFixed(1)}%
        </div>
      </div>

      <div class="leaderboard">
        ${allCompanies.slice(0, 3).map((c, i) => `
          <div class="lb-row ${c.isPlayer ? 'is-you' : ''}">
            <span class="lb-rank">${i + 1}</span>
            <span class="lb-dot" style="background:${c.isPlayer ? 'var(--accent)' : (c.color || 'var(--fg-3)')}"></span>
            <span class="lb-name">${escapeHtml(c.name)}</span>
            <span class="lb-value">${formatMoneyShort(c.revenue)}/mo</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- ============ PROFIT CHART ============ -->
    <div class="chart-card">
      <div class="chart-head">
        <div class="chart-label">PROFIT</div>
        <div class="chart-legend">
          <span class="chart-badge ${profitPerTurn >= 0 ? 'positive' : 'negative'}">
            ${profitPerTurn >= 0 ? '▲' : '▼'} ${formatMoneyShort(Math.abs(profitPerTurn))}
          </span>
          <span class="chart-period">${profitSeries.length} MO</span>
        </div>
      </div>

      <svg class="profit-chart" viewBox="0 0 600 180" preserveAspectRatio="none">
        <defs>
          <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.28"/>
            <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.02"/>
          </linearGradient>
        </defs>

        <!-- Reference lines -->
        <line x1="20" y1="45" x2="580" y2="45" stroke="var(--line)" stroke-width="0.5" stroke-dasharray="2 6" opacity="0.6"/>
        <line x1="20" y1="90" x2="580" y2="90" stroke="var(--line)" stroke-width="0.5" stroke-dasharray="2 6" opacity="0.6"/>
        <line x1="20" y1="135" x2="580" y2="135" stroke="var(--line)" stroke-width="0.5" stroke-dasharray="2 6" opacity="0.6"/>

        <!-- Area + line -->
        ${profitSeries.length >= 2 ? `
          <path d="${svgAreaPath(profitSeries, 600, 180, 20)}" fill="url(#profitFill)"/>
          <path d="${svgLinePath(profitSeries, 600, 180, 20)}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        ` : ''}

        <!-- Peak marker -->
        ${profitSeries.length >= 2 && peakIdx >= 0 ? (() => {
          const stepX = (600 - 40) / (profitSeries.length - 1);
          const x = 20 + peakIdx * stepX;
          const range = (Math.max(...profitSeries) - Math.min(...profitSeries)) || 1;
          const y = 20 + (180 - 40) * (1 - (peakProfit - Math.min(...profitSeries)) / range);
          return `
            <circle cx="${x}" cy="${y}" r="4" fill="var(--good)" stroke="white" stroke-width="2"/>
            <text x="${x}" y="${y - 10}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--good)" font-family="monospace">+${formatMoneyShort(peakProfit)}</text>
          `;
        })() : ''}

        <!-- Current marker -->
        ${profitSeries.length >= 2 ? (() => {
          const last = profitSeries[profitSeries.length - 1];
          const range = (Math.max(...profitSeries) - Math.min(...profitSeries)) || 1;
          const y = 20 + (180 - 40) * (1 - (last - Math.min(...profitSeries)) / range);
          return `
            <circle cx="580" cy="${y}" r="12" fill="var(--accent)" opacity="0.15"/>
            <circle cx="580" cy="${y}" r="5" fill="var(--accent)" stroke="white" stroke-width="2"/>
          `;
        })() : ''}
      </svg>

      <div class="chart-axis">
        <span>${monthLabel(profitSeries.length - 1, state.turn, state.tahun, state.bulan)}</span>
        <span>${monthLabel(Math.floor((profitSeries.length - 1) / 2), state.turn, state.tahun, state.bulan)}</span>
        <span>${monthLabel(0, state.turn, state.tahun, state.bulan)}</span>
      </div>
    </div>

    <!-- ============ YOUR LINEUP ============ -->
    ${lineupProducts.length > 0 ? `
      <div class="lineup-section">
        <div class="lineup-head">
          <div class="lineup-title">Your lineup</div>
          <button class="lineup-all" onclick="renderPanel('market')">All →</button>
        </div>
        <div class="lineup-scroll">
          ${lineupProducts.map(p => {
            const share = totalProductRev > 0 ? (p.revenue / totalProductRev) : 0;
            const monthlyRev = revPerTurn * share;
            return `
              <div class="lineup-card" data-product-id="${p.id}">
                ${renderBoxArt(p)}
                <div class="lineup-name">${escapeHtml(p.name)}</div>
                <div class="lineup-rev">+${formatMoneyShort(monthlyRev)}/mo</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : ''}

    <!-- ============ STATUS STRIP ============ -->
    <div class="status-strip">
      <div class="status-item">
        <div class="si-label">Cash</div>
        <div class="si-value accent">${formatMoneyShort(state.uang)}</div>
      </div>
      <div class="status-item">
        <div class="si-label">Burn</div>
        <div class="si-value">${formatMoneyShort(opCost.total)}</div>
      </div>
      <div class="status-item">
        <div class="si-label">Node</div>
        <div class="si-value">${state.currentNode}</div>
      </div>
      <div class="status-item">
        <div class="si-label">Team</div>
        <div class="si-value">${state.team.length}</div>
      </div>
      <div class="status-item">
        <div class="si-label">Products</div>
        <div class="si-value">${launched.length}</div>
      </div>
      <div class="status-item">
        <div class="si-label">Debt</div>
        <div class="si-value ${state.debt > 0 ? 'bad' : 'muted'}">${state.debt > 0 ? formatMoneyShort(state.debt) : '—'}</div>
      </div>
    </div>

    <!-- ============ ACTIVE R&D ============ -->
    ${doneProjects.length > 0 ? `
      <div class="section-title">Ready to launch · ${doneProjects.length}</div>
      ${doneProjects.map(p => `
        <div class="card clickable" onclick="renderPanel('production')" style="border-color:var(--good)">
          <div class="row between">
            <h3>${iconFor(p.category)} ${escapeHtml(p.name)}</h3>
            <span class="badge good">SHIP</span>
          </div>
          <div class="meta">${p.node} · PERF ${p.perfScore} · TDP ${p.tdp}W · $${p.price}</div>
        </div>
      `).join('')}
    ` : ''}

    ${activeProjects.length > 0 ? `
      <div class="section-title">Active R&D · ${activeProjects.length}</div>
      ${activeProjects.map(p => renderProjectMini(p)).join('')}
    ` : ''}

    <!-- ============ RECENT ACTIVITY ============ -->
    <div class="section-title">Recent activity</div>
    <div class="card activity-card">
      ${(state.log || []).slice(0, 4).map(item => `
        <div class="activity-row">
          <div class="activity-dot ${item.type || 'info'}"></div>
          <div class="activity-text">
            <div class="activity-date">T${item.turn} · ${formatDate(item.tahun, item.bulan)}</div>
            <div class="activity-body">${escapeHtml(item.text)}</div>
          </div>
        </div>
      `).join('') || '<div class="muted" style="padding:8px 0">No activity yet.</div>'}
    </div>

  `);

  // Bind lineup cards
  document.querySelectorAll('.lineup-card').forEach(card => {
    card.addEventListener('click', () => {
      renderPanel('market');
    });
  });
}

// =========================================================
// BOX ART — SVG mockup of product packaging
// =========================================================
function renderBoxArt(p) {
  const catColors = {
    cpu:        '#c9542a',
    gpu:        '#7a5ba8',
    os:         '#3d8b5f',
    laptop:     '#b8852b',
    smartphone: '#c47a2e',
  };
  const c = catColors[p.category] || '#c9542a';
  const tier = p.perfScore > 800 ? 'ELITE' : p.perfScore > 400 ? 'STD' : 'REG';
  const shortName = p.name.length > 14 ? p.name.slice(0, 12) + '…' : p.name;

  return `
    <svg class="box-art" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <!-- Base shadow -->
      <ellipse cx="50" cy="116" rx="34" ry="3" fill="rgba(60,50,35,0.15)"/>
      <!-- Box face -->
      <rect x="12" y="14" width="76" height="100" rx="3" fill="#1c1814"/>
      <!-- Box top edge highlight -->
      <rect x="12" y="14" width="76" height="2" rx="1" fill="rgba(255,255,255,0.08)"/>
      <!-- Logo ring -->
      <circle cx="50" cy="52" r="22" fill="none" stroke="${c}" stroke-width="2"/>
      <circle cx="50" cy="52" r="16" fill="none" stroke="${c}" stroke-width="1" opacity="0.5"/>
      <!-- Center mark -->
      <circle cx="50" cy="52" r="6" fill="${c}" opacity="0.85"/>
      <!-- Category icon -->
      <text x="50" y="56" text-anchor="middle" font-size="9" font-weight="700" fill="white" font-family="monospace">${p.category.toUpperCase().slice(0,2)}</text>
      <!-- Product name -->
      <text x="50" y="88" text-anchor="middle" font-size="8" font-weight="700" fill="white" font-family="sans-serif">${escapeHtml(shortName)}</text>
      <!-- Tier badge -->
      <rect x="34" y="96" width="32" height="12" rx="2" fill="${c}"/>
      <text x="50" y="105" text-anchor="middle" font-size="7" font-weight="800" fill="white" font-family="monospace">${tier}</text>
    </svg>
  `;
}

// =========================================================
// PROJECT MINI CARD
// =========================================================
function renderProjectMini(p) {
  const progress = calcOverallProgress(p);
  const stage = PROJECT_STAGES[p.stageIndex];
  const assigned = state.team.filter(e => p.engineerIds && p.engineerIds.includes(e.id));
  const remaining = estimateRemainingTurns(p, assigned);
  return `
    <div class="card clickable" onclick="renderPanel('production')">
      <div class="row between">
        <h3>${iconFor(p.category)} ${escapeHtml(p.name)}</h3>
        <span class="badge info">${stage.name}</span>
      </div>
      <div class="meta">${p.node} · ~${remaining} turn${remaining === 1 ? '' : 's'} remaining</div>
      <div class="progress">
        <div class="progress-fill" style="width:${progress}%"></div>
      </div>
      <div style="font-size:11px;color:var(--fg-3);font-family:var(--font-mono)">${progress}% complete</div>
    </div>
  `;
}

// =========================================================
// ICONS
// =========================================================
function categoryColor(cat) {
  return {
    cpu:        '#c9542a',
    gpu:        '#7a5ba8',
    os:         '#3d8b5f',
    laptop:     '#b8852b',
    smartphone: '#c47a2e',
  }[cat] || '#7d8590';
}
function iconFor(cat) {
  const c = categoryColor(cat);
  const inner = {
    cpu:        '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/>',
    gpu:        '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
    os:         '<rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 20h8M12 18v2"/>',
    laptop:     '<rect x="4" y="5" width="16" height="11" rx="1"/><path d="M2 19h20"/>',
    smartphone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  }[cat] || '<rect x="5" y="5" width="14" height="14" rx="2"/>';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" width="14" height="14">${inner}</svg>`;
}
