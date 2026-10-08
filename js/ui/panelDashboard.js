// js/ui/panelDashboard.js
// Home panel — swipeable carousel (rank + media + latest product) + chart + lineup.

// =========================================================
// HELPERS
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
  return `${line} L ${lastX},${h - pad} L ${pad},${h - pad} Z`;
}

function monthLabel(turnOffset, currentTurn, currentYear, currentMonth) {
  let m = currentMonth - turnOffset;
  let y = currentYear;
  while (m <= 0) { m += 12; y -= 1; }
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${names[m-1]} '${String(y).slice(-2)}`;
}

// =========================================================
// MEDIA COVERAGE GENERATOR
// =========================================================
function generateMediaCoverage() {
  const items = [];
  const companyName = state.companyName || 'Your company';
  const launched = state.products.filter(p => p.launched);
  const latest = launched[launched.length - 1];
  const teamSize = state.team.length;

  // 1. Latest product launch
  if (latest) {
    const age = state.turn - (latest.launchTurn || 0);
    if (age <= 6) {
      items.push({
        outlet: 'TechWire Daily',
        icon: '📰',
        color: '#c9542a',
        headline: `${companyName} ships first ${getCategory(latest.category).name} — "${latest.name}"`,
        excerpt: `Analysts call it a solid ${latest.node} entry. ${latest.perfScore} pts performance.`,
        time: age <= 1 ? 'Just now' : `${age} months ago`,
      });
    }
  }

  // 2. Market share milestone
  const share = state.marketShare || 0;
  if (share >= 0.15) {
    items.push({
      outlet: 'Silicon Report',
      icon: '📊',
      color: '#7a5ba8',
      headline: `${companyName} now controls ${(share * 100).toFixed(1)}% of the semiconductor market`,
      excerpt: `Steady growth puts pressure on established rivals.`,
      time: 'Recent',
    });
  } else if (share >= 0.05) {
    items.push({
      outlet: 'Silicon Report',
      icon: '📊',
      color: '#7a5ba8',
      headline: `${companyName} breaks into double-digit territory at ${(share * 100).toFixed(1)}%`,
      excerpt: `A newcomer with real momentum.`,
      time: 'Recent',
    });
  }

  // 3. Revenue milestone
  const rev = state.totalRevenue || 0;
  if (rev >= 100000000) {
    items.push({
      outlet: 'Fortune Tech',
      icon: '💼',
      color: '#3d8b5f',
      headline: `${companyName} crosses ${formatMoneyShort(rev)} in lifetime revenue`,
      excerpt: `A giant is forming. Investors take notice.`,
      time: 'This quarter',
    });
  } else if (rev >= 10000000) {
    items.push({
      outlet: 'Fortune Tech',
      icon: '💼',
      color: '#3d8b5f',
      headline: `${companyName} passes ${formatMoneyShort(rev)} — a serious player emerges`,
      excerpt: `Silicon Valley is watching.`,
      time: 'This quarter',
    });
  } else if (rev >= 1000000) {
    items.push({
      outlet: 'Business Insider',
      icon: '💼',
      color: '#3d8b5f',
      headline: `${companyName} joins the million-dollar club at ${formatMoneyShort(rev)}`,
      excerpt: `A small team making real money.`,
      time: 'Recently',
    });
  }

  // 4. Team growth
  if (teamSize >= 20) {
    items.push({
      outlet: 'Talent Weekly',
      icon: '👥',
      color: '#b8852b',
      headline: `${companyName} now employs ${teamSize} engineers`,
      excerpt: `Aggressive hiring signals big ambitions.`,
      time: 'This month',
    });
  } else if (teamSize >= 10) {
    items.push({
      outlet: 'Talent Weekly',
      icon: '👥',
      color: '#b8852b',
      headline: `${companyName} grows engineering team to ${teamSize}`,
      excerpt: `Scaling up for the next big launch.`,
      time: 'This month',
    });
  }

  // 5. Node advancement
  const node = state.currentNode;
  if (node !== '350nm') {
    items.push({
      outlet: 'Node Watch',
      icon: '⚗️',
      color: '#2e8391',
      headline: `${companyName} achieves ${node} process milestone`,
      excerpt: `In-house research pays off with a smaller, denser node.`,
      time: 'Recent',
    });
  }

  // 6. Products count
  if (launched.length >= 5) {
    items.push({
      outlet: 'Product Review',
      icon: '🛍️',
      color: '#c47a2e',
      headline: `${launched.length} products in ${companyName}'s lineup`,
      excerpt: `Breadth across categories — the company is diversifying.`,
      time: 'Ongoing',
    });
  }

  // Fallback for early game
  if (items.length === 0) {
    items.push({
      outlet: 'TechWire Daily',
      icon: '📰',
      color: '#c9542a',
      headline: `${companyName} opens its doors in 1995`,
      excerpt: `A small startup with big plans. Time will tell.`,
      time: 'Just now',
    });
  }

  return items.slice(0, 3);
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

  // ===== Revenue =====
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
  const gapToLeader = leader.revenue - revPerTurn;

  // ===== Profit chart data =====
  const profitSeries = (hist.profit && hist.profit.length >= 2)
    ? hist.profit.slice(-12)
    : [profitPerTurn, profitPerTurn];
  const peakProfit = Math.max(...profitSeries);
  const peakIdx = profitSeries.indexOf(peakProfit);

  // ===== Lineup =====
  const lineupProducts = launched.slice(-8).reverse();
  const totalProductRev = launched.reduce((s, p) => s + (p.revenue || 0), 0);

  // ===== Media + latest product =====
  const mediaItems = generateMediaCoverage();
  const latestProduct = launched[launched.length - 1];

  setPanel('Home', `Turn ${state.turn} · ${formatDate(state.tahun, state.bulan)}`, `

    <!-- ============ SWIPEABLE CAROUSEL ============ -->
    <div class="home-carousel">
      <div class="carousel-track" id="home-carousel">

        <!-- Slide 1: Rank -->
        <div class="carousel-slide">
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
                <div class="chip chip-bad">▼ ${formatMoneyShort(gapToLeader)}/mo behind ${escapeHtml(leader.name)}</div>
              ` : `
                <div class="chip chip-good">▲ Industry leader</div>
              `}
              <div class="chip chip-neutral">Market share ${(playerShare * 100).toFixed(1)}%</div>
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
        </div>

        <!-- Slide 2: Media coverage -->
        <div class="carousel-slide">
          <div class="media-card">
            <div class="media-head">
              <div class="media-eyebrow">Media coverage</div>
              <div class="media-sub">${mediaItems.length} recent article${mediaItems.length === 1 ? '' : 's'}</div>
            </div>
            <div class="media-list">
              ${mediaItems.map(m => `
                <div class="media-item">
                  <div class="media-item-head">
                    <div class="media-outlet">
                      <span class="media-icon">${m.icon}</span>
                      <span class="media-outlet-name" style="color:${m.color}">${escapeHtml(m.outlet)}</span>
                    </div>
                    <div class="media-time">${escapeHtml(m.time)}</div>
                  </div>
                  <div class="media-headline">${escapeHtml(m.headline)}</div>
                  <div class="media-excerpt">${escapeHtml(m.excerpt)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Slide 3: Latest product -->
        <div class="carousel-slide">
          ${latestProduct ? `
            <div class="latest-card">
              <div class="latest-head">
                <div class="latest-eyebrow">Latest product</div>
                <div class="latest-badge" style="background:${categoryColor(latestProduct.category)}20;color:${categoryColor(latestProduct.category)}">
                  ${getCategory(latestProduct.category).name}
                </div>
              </div>
              <div class="latest-body">
                <div class="latest-art">
                  ${renderBoxArt(latestProduct)}
                </div>
                <div class="latest-info">
                  <div class="latest-name">${escapeHtml(latestProduct.name)}</div>
                  <div class="latest-node">${latestProduct.node} · ${getSegment(latestProduct.segment)?.name || 'General'}</div>
                  <div class="latest-stats">
                    <div class="latest-stat">
                      <div class="ls-label">Performance</div>
                      <div class="ls-value">${latestProduct.perfScore} pts</div>
                    </div>
                    <div class="latest-stat">
                      <div class="ls-label">TDP</div>
                      <div class="ls-value">${latestProduct.tdp}W</div>
                    </div>
                    <div class="latest-stat">
                      <div class="ls-label">Price</div>
                      <div class="ls-value">$${latestProduct.price}</div>
                    </div>
                    <div class="latest-stat">
                      <div class="ls-label">Units</div>
                      <div class="ls-value">${(latestProduct.sales || 0).toLocaleString('en-US')}</div>
                    </div>
                  </div>
                  <button class="latest-cta" onclick="renderPanel('market')">View in Market →</button>
                </div>
              </div>
            </div>
          ` : `
            <div class="latest-card latest-empty">
              <div class="latest-empty-icon">📦</div>
              <div class="latest-empty-title">No products yet</div>
              <div class="latest-empty-desc">Design and launch your first chip to see it here.</div>
              <button class="btn primary" onclick="if(typeof openDesignerCategoryChooser==='function')openDesignerCategoryChooser()">Open Designer</button>
            </div>
          `}
        </div>

      </div>

      <div class="carousel-dots" id="carousel-dots">
        <span class="dot active" data-dot="0"></span>
        <span class="dot" data-dot="1"></span>
        <span class="dot" data-dot="2"></span>
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

        <line x1="20" y1="45" x2="580" y2="45" stroke="var(--line)" stroke-width="0.5" stroke-dasharray="2 6" opacity="0.6"/>
        <line x1="20" y1="90" x2="580" y2="90" stroke="var(--line)" stroke-width="0.5" stroke-dasharray="2 6" opacity="0.6"/>
        <line x1="20" y1="135" x2="580" y2="135" stroke="var(--line)" stroke-width="0.5" stroke-dasharray="2 6" opacity="0.6"/>

        ${profitSeries.length >= 2 ? `
          <path d="${svgAreaPath(profitSeries, 600, 180, 20)}" fill="url(#profitFill)"/>
          <path d="${svgLinePath(profitSeries, 600, 180, 20)}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        ` : ''}

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

    <!-- ============ LINEUP ============ -->
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

    <!-- ============ READY TO LAUNCH ============ -->
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

    <!-- ============ ACTIVE R&D ============ -->
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

  // ===== Bind carousel =====
  bindHomeCarousel();

  // ===== Bind lineup cards =====
  document.querySelectorAll('.lineup-card').forEach(card => {
    card.addEventListener('click', () => renderPanel('market'));
  });
}

// =========================================================
// CAROUSEL BINDING
// =========================================================
function bindHomeCarousel() {
  const track = document.getElementById('home-carousel');
  const dotsWrap = document.getElementById('carousel-dots');
  if (!track || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll('.dot'));

  const updateDots = () => {
    const slideW = track.clientWidth;
    if (slideW === 0) return;
    const page = Math.round(track.scrollLeft / slideW);
    dots.forEach((d, i) => d.classList.toggle('active', i === page));
  };

  // Update on scroll (throttled)
  let ticking = false;
  track.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateDots();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Click dot to jump
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
    });
  });

  // Initial position sync
  requestAnimationFrame(updateDots);
}

// =========================================================
// BOX ART
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
      <ellipse cx="50" cy="116" rx="34" ry="3" fill="rgba(60,50,35,0.15)"/>
      <rect x="12" y="14" width="76" height="100" rx="3" fill="#1c1814"/>
      <rect x="12" y="14" width="76" height="2" rx="1" fill="rgba(255,255,255,0.08)"/>
      <circle cx="50" cy="52" r="22" fill="none" stroke="${c}" stroke-width="2"/>
      <circle cx="50" cy="52" r="16" fill="none" stroke="${c}" stroke-width="1" opacity="0.5"/>
      <circle cx="50" cy="52" r="6" fill="${c}" opacity="0.85"/>
      <text x="50" y="56" text-anchor="middle" font-size="9" font-weight="700" fill="white" font-family="monospace">${p.category.toUpperCase().slice(0,2)}</text>
      <text x="50" y="88" text-anchor="middle" font-size="8" font-weight="700" fill="white" font-family="sans-serif">${escapeHtml(shortName)}</text>
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
