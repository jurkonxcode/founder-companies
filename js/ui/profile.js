// js/ui/profile.js
// Profile modal — menu + 7 detailed sub-views.

let profileView = 'menu';
let rankingsSort = 'revenue'; // revenue | share | products

// =========================================================
// OPEN / CLOSE
// =========================================================
function openProfile() {
  const modal = document.getElementById('profile-modal');
  if (!modal) { alert('Profile modal not found in HTML.'); return; }
  if (!state) { alert('Game state not loaded yet.'); return; }
  profileView = 'menu';
  renderProfile();
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProfile() {
  const modal = document.getElementById('profile-modal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function goProfile(view) {
  profileView = view;
  renderProfile();
}

function backToProfileMenu() {
  profileView = 'menu';
  renderProfile();
}

// =========================================================
// MAIN RENDER
// =========================================================
function renderProfile() {
  const modal = document.getElementById('profile-modal');
  if (!modal || !state) return;
  modal.innerHTML = profileView === 'menu' ? renderProfileMenu() : renderProfileSub(profileView);
  bindProfileEvents();
}

function _esc(s) {
  if (typeof escapeHtml === 'function') return escapeHtml(s);
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function _money(n) {
  if (typeof formatMoneyShort === 'function') return formatMoneyShort(n);
  const abs = Math.abs(n);
  if (abs >= 1e9) return '$' + (abs/1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return '$' + (abs/1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return '$' + (abs/1e3).toFixed(0) + 'K';
  return '$' + Math.round(abs);
}
function _date(t, b) {
  if (typeof formatDate === 'function') return formatDate(t, b);
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return (M[(b || 1) - 1] || 'Jan') + ' ' + (t || 1995);
}

// =========================================================
// MENU VIEW
// =========================================================
function renderProfileMenu() {
  const arch = (typeof getArchetype === 'function' && state.archetype) ? getArchetype(state.archetype) : null;
  const diff = (typeof getDifficulty === 'function' && state.difficulty) ? getDifficulty(state.difficulty) : null;
  const companyName = state.companyName || (arch ? arch.name : 'Founder Companies');
  const initial = (companyName || 'F').trim().charAt(0).toUpperCase();
  const foundedStr = _date(state.founded?.tahun || 1995, state.founded?.bulan || 1);

  const notifCount = (state.notifications || []).length;
  const unreadCount = (state.notifications || []).filter(n => !n.read).length;

  return `
    <div class="profile-sheet">

      <div class="profile-hero">
        <button class="profile-hero-close" id="profile-close" aria-label="Close">✕</button>
        <div class="profile-hero-body">
          <div class="profile-hero-avatar">${_esc(initial)}</div>
          <div class="profile-hero-info">
            <div class="profile-hero-name">${_esc(companyName)}</div>
            <div class="profile-hero-tags">
              ${arch ? `<span class="profile-tag primary" style="background:${arch.color};border-color:${arch.color}">${_esc(arch.roleTag)}</span>` : ''}
              ${diff ? `<span class="profile-tag">${_esc(diff.name)}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="profile-hero-meta">
          <span>Founded ${_esc(foundedStr)}</span>
          <span>·</span>
          <span>Turn ${state.turn || 0}</span>
        </div>
      </div>

      <div class="profile-body">

        <!-- NEWS & UPDATES -->
        <div class="profile-menu-section">
          <div class="profile-menu-title">News & Updates</div>
          <div class="profile-tile-grid">
            ${renderMenuTile('press', 'Press archive', 'icon-press', '#c9542a', notifCount ? `${notifCount} articles${unreadCount ? ' · ' + unreadCount + ' new' : ''}` : '')}
            ${renderMenuTile('journal', 'Journal', 'icon-journal', '#b8852b', (state.log || []).length ? `${(state.log || []).length} entries` : '')}
            ${renderMenuTile('dlc', 'Expansions', 'icon-dlc', '#7a5ba8', '0 / 2')}
          </div>
        </div>

        <!-- RANKINGS & TOOLS -->
        <div class="profile-menu-section">
          <div class="profile-menu-title">Rankings & Tools</div>
          <div class="profile-tile-grid">
            ${renderMenuTile('rankings', 'Rankings', 'icon-rank', '#7a5ba8', '')}
            ${renderMenuTile('benchmarks', 'Benchmarks', 'icon-bench', '#7a5ba8', '')}
          </div>
        </div>

        <!-- HELP & SETTINGS -->
        <div class="profile-menu-section">
          <div class="profile-menu-title">Help & Settings</div>
          <div class="profile-tile-grid">
            ${renderMenuTile('wiki', 'Wiki', 'icon-wiki', '#7a5ba8', '')}
            ${renderMenuTile('settings', 'Settings', 'icon-settings', '#4f4739', '')}
          </div>
        </div>

      </div>
    </div>
  `;
}

function renderMenuTile(id, label, iconName, color, sub) {
  return `
    <button class="profile-tile" data-profile-view="${id}" style="--tile-color:${color}">
      <div class="profile-tile-icon">${profileIcon(iconName)}</div>
      <div class="profile-tile-label">${_esc(label)}</div>
      ${sub ? `<div class="profile-tile-sub">${_esc(sub)}</div>` : ''}
    </button>
  `;
}

// =========================================================
// SUB-VIEW DISPATCHER
// =========================================================
function renderProfileSub(view) {
  const map = {
    press:      renderPressArchive,
    journal:    renderJournal,
    dlc:        renderDLC,
    rankings:   renderRankings,
    benchmarks: renderBenchmarks,
    wiki:       renderWiki,
    settings:   renderSettings,
  };
  const fn = map[view];
  return fn ? fn() : renderProfileMenu();
}

function renderSubHeader(title, subtitle) {
  return `
    <div class="profile-sub-head">
      <button class="profile-sub-back" id="profile-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div class="profile-sub-title">
        <div class="profile-sub-eyebrow">${_esc(subtitle)}</div>
        <h3>${_esc(title)}</h3>
      </div>
      <button class="profile-sub-close" id="profile-close" aria-label="Close">✕</button>
    </div>
  `;
}

// =========================================================
// PRESS ARCHIVE
// =========================================================
function renderPressArchive() {
  const notifs = (state.notifications || []).slice().sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return (b.month || 1) - (a.month || 1);
  });

  // Group by year
  const byYear = {};
  notifs.forEach(n => {
    if (!byYear[n.year]) byYear[n.year] = [];
    byYear[n.year].push(n);
  });
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

  const catMeta = (typeof HEADLINE_CATEGORIES !== 'undefined') ? HEADLINE_CATEGORIES : {};
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return `
    <div class="profile-sheet">
      ${renderSubHeader('Press archive', `${notifs.length} articles`)}
      <div class="profile-body">
        ${years.length === 0 ? `
          <div class="profile-empty">
            <div class="profile-empty-icon">📰</div>
            <div class="profile-empty-title">No articles yet</div>
            <div class="profile-empty-desc">Real-world tech headlines appear as you pass each month.</div>
          </div>
        ` : years.map(yr => `
          <div class="profile-year-group">
            <div class="profile-year-label">${yr}</div>
            ${byYear[yr].map(n => {
              const cat = catMeta[n.cat] || { label: 'Industry', color: '#786d5b' };
              const mLabel = monthNames[(n.month || 1) - 1];
              return `
                <div class="profile-article">
                  <div class="profile-article-head">
                    <span class="profile-article-tag" style="background:${cat.color}20; color:${cat.color}">${_esc(cat.label)}</span>
                    <span class="profile-article-date">${mLabel} ${n.year}</span>
                  </div>
                  <div class="profile-article-title">${_esc(n.title)}</div>
                  <div class="profile-article-desc">${_esc(n.desc)}</div>
                </div>
              `;
            }).join('')}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// =========================================================
// JOURNAL
// =========================================================
function renderJournal() {
  const logs = (state.log || []).slice(0);
  const goodCount = logs.filter(l => l.type === 'good').length;
  const badCount  = logs.filter(l => l.type === 'bad').length;
  const mileCount = logs.filter(l => l.type === 'milestone').length;

  return `
    <div class="profile-sheet">
      ${renderSubHeader('Journal', `${logs.length} entries`)}
      <div class="profile-body">

        <div class="profile-stat-grid" style="margin-bottom:20px;">
          <div class="profile-stat-tile">
            <div class="pst-label">Wins</div>
            <div class="pst-value good">${goodCount}</div>
          </div>
          <div class="profile-stat-tile">
            <div class="pst-label">Setbacks</div>
            <div class="pst-value" style="color:var(--bad)">${badCount}</div>
          </div>
          <div class="profile-stat-tile">
            <div class="pst-label">Milestones</div>
            <div class="pst-value purple">${mileCount}</div>
          </div>
        </div>

        ${logs.length === 0 ? `
          <div class="profile-empty">
            <div class="profile-empty-icon">📓</div>
            <div class="profile-empty-title">Empty journal</div>
            <div class="profile-empty-desc">Every decision and event will be recorded here.</div>
          </div>
        ` : logs.map(item => `
          <div class="profile-journal-row profile-journal-${item.type || 'info'}">
            <div class="profile-journal-dot"></div>
            <div class="profile-journal-content">
              <div class="profile-journal-date">T${item.turn} · ${_date(item.tahun, item.bulan)}</div>
              <div class="profile-journal-text">${_esc(item.text)}</div>
            </div>
          </div>
        `).join('')}

      </div>
    </div>
  `;
}

// =========================================================
// EXPANSIONS (DLC)
// =========================================================
function renderDLC() {
  return `
    <div class="profile-sheet">
      ${renderSubHeader('Expansions', 'Extra content')}
      <div class="profile-body">

        <div class="profile-dlc-banner">
          <div class="profile-dlc-banner-icon">📦</div>
          <div class="profile-dlc-banner-title">Archive Edition</div>
          <div class="profile-dlc-banner-desc">Historical scenario mode with hand-authored events and endgame conditions from 1995 to 2025.</div>
          <div class="profile-dlc-banner-status">Locked · 0 / 2 expansions required</div>
        </div>

        <div class="profile-menu-section">
          <div class="profile-menu-title">Expansion 1 · Foundry Wars</div>
          <div class="profile-dlc-item">
            <div class="profile-dlc-icon" style="background:#f7e0d4;color:#c9542a">⚙️</div>
            <div class="profile-dlc-body">
              <div class="profile-dlc-title">Build your own fab</div>
              <div class="profile-dlc-desc">Own wafer fabs, manage yield, negotiate with suppliers. Unlock at 100 turns played.</div>
            </div>
          </div>
        </div>

        <div class="profile-menu-section">
          <div class="profile-menu-title">Expansion 2 · Silicon Cold War</div>
          <div class="profile-dlc-item">
            <div class="profile-dlc-icon" style="background:#ece2f5;color:#7a5ba8">🌐</div>
            <div class="profile-dlc-body">
              <div class="profile-dlc-title">Geopolitics of chips</div>
              <div class="profile-dlc-desc">Export controls, sanctions, and supply chain security. Unlock at $1B lifetime revenue.</div>
            </div>
          </div>
        </div>

        <div class="profile-menu-section">
          <div class="profile-menu-title">Coming soon</div>
          <div class="profile-dlc-item">
            <div class="profile-dlc-icon" style="background:#dcefe2;color:#3d8b5f">🤖</div>
            <div class="profile-dlc-body">
              <div class="profile-dlc-title">AI Nexus</div>
              <div class="profile-dlc-desc">Datacenter AI accelerators, LLM chips, and software-defined silicon.</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

// =========================================================
// RANKINGS
// =========================================================
function renderRankings() {
  const opCost = (typeof calcOperatingCost === 'function') ? calcOperatingCost(state) : { total: 0 };
  const hist = state.history || {};
  const revPerTurn = hist.revPerTurn && hist.revPerTurn.length
    ? hist.revPerTurn[hist.revPerTurn.length - 1]
    : ((typeof calcPassiveIncome === 'function') ? calcPassiveIncome(state) : 0);

  const playerShare = state.marketShare || 0.02;
  const totalMarketRev = playerShare > 0 ? revPerTurn / playerShare : 0;

  const rivals = (typeof getActiveCompetitors === 'function' ? getActiveCompetitors(state.tahun) : []).map(c => ({
    id: c.id,
    name: c.name,
    color: c.color,
    icon: c.icon,
    share: c.startingShare * (1 + (state.tahun - c.founded) * 0.01),
    productCount: Math.max(1, Math.floor((state.tahun - c.founded) * 1.2)),
  }));

  const rows = [
    {
      id: 'player',
      name: state.companyName || 'You',
      color: 'var(--accent)',
      isPlayer: true,
      revenue: revPerTurn,
      share: playerShare,
      productCount: state.products.filter(p => p.launched).length,
    },
    ...rivals.map(r => ({
      ...r,
      revenue: totalMarketRev * r.share,
    })),
  ];

  // Sort
  const sorted = rows.slice().sort((a, b) => {
    if (rankingsSort === 'revenue') return b.revenue - a.revenue;
    if (rankingsSort === 'share') return b.share - a.share;
    if (rankingsSort === 'products') return b.productCount - a.productCount;
    return 0;
  });

  const maxRev = Math.max(...rows.map(r => r.revenue), 1);

  return `
    <div class="profile-sheet">
      ${renderSubHeader('Rankings', `${rows.length} companies`)}
      <div class="profile-body">

        <div class="profile-sort-row">
          <span class="profile-sort-label">Sort by</span>
          <div class="profile-sort-seg">
            <button data-sort="revenue" class="${rankingsSort === 'revenue' ? 'active' : ''}">Revenue</button>
            <button data-sort="share" class="${rankingsSort === 'share' ? 'active' : ''}">Share</button>
            <button data-sort="products" class="${rankingsSort === 'products' ? 'active' : ''}">Products</button>
          </div>
        </div>

        ${sorted.map((r, i) => {
          const barPct = Math.max(4, (r.revenue / maxRev) * 100);
          return `
            <div class="profile-rank-row ${r.isPlayer ? 'is-you' : ''}">
              <div class="profile-rank-pos">${i + 1}</div>
              <div class="profile-rank-body">
                <div class="profile-rank-head">
                  <span class="profile-rank-dot" style="background:${r.color}"></span>
                  <span class="profile-rank-name">${_esc(r.name)}</span>
                  ${r.isPlayer ? '<span class="profile-rank-you">YOU</span>' : ''}
                </div>
                <div class="profile-rank-bar-wrap">
                  <div class="profile-rank-bar" style="width:${barPct}%; background:${r.color}"></div>
                </div>
                <div class="profile-rank-meta">
                  <span>${_money(r.revenue)}/mo</span>
                  <span>·</span>
                  <span>${(r.share * 100).toFixed(1)}% share</span>
                  <span>·</span>
                  <span>${r.productCount} products</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}

      </div>
    </div>
  `;
}

// =========================================================
// BENCHMARKS
// =========================================================
function renderBenchmarks() {
  const tech = (typeof getTech === 'function') ? getTech(state.currentNode) : null;
  const refPerf = tech ? tech.refPerf : 10;
  const industryMult = 0.92; // rival average is ~92% of player's node reference

  // Get player's best products by category
  const categories = ['cpu', 'gpu', 'os', 'laptop', 'smartphone'];
  const launched = state.products.filter(p => p.launched);
  const bestByCat = {};
  categories.forEach(c => {
    const prods = launched.filter(p => p.category === c);
    if (prods.length > 0) {
      bestByCat[c] = prods.reduce((a, b) => (a.perfScore > b.perfScore ? a : b));
    }
  });

  return `
    <div class="profile-sheet">
      ${renderSubHeader('Benchmarks', 'You vs industry')}
      <div class="profile-body">

        <div class="profile-bench-note">
          Industry average is derived from the current process node (${_esc(state.currentNode)}). Your numbers come from actual shipped products.
        </div>

        ${categories.map(cat => {
          const best = bestByCat[cat];
          if (!best) {
            return `
              <div class="profile-bench-block profile-bench-empty">
                <div class="profile-bench-cat">${_esc(cat.toUpperCase())}</div>
                <div class="profile-bench-empty-text">No ${_esc(cat.toUpperCase())} shipped yet</div>
              </div>
            `;
          }
          const industryPerf = Math.round(refPerf * industryMult);
          const industryTdp = Math.round(best.tdp * 0.9);
          const industryPrice = Math.round(best.price * 1.1);
          const playerEfficiency = best.tdp > 0 ? (best.perfScore / best.tdp) : 0;
          const industryEfficiency = industryTdp > 0 ? (industryPerf / industryTdp) : 0;

          const perfDelta = best.perfScore - industryPerf;
          const efficiencyDelta = playerEfficiency - industryEfficiency;

          return `
            <div class="profile-bench-block">
              <div class="profile-bench-cat">${_esc(cat.toUpperCase())} — ${_esc(best.name)}</div>
              <div class="profile-bench-row">
                <div class="profile-bench-col">
                  <div class="profile-bench-label">Performance</div>
                  <div class="profile-bench-values">
                    <span class="pb-you">${best.perfScore}</span>
                    <span class="pb-vs">vs</span>
                    <span class="pb-them">${industryPerf}</span>
                  </div>
                  <div class="profile-bench-delta ${perfDelta >= 0 ? 'good' : 'bad'}">
                    ${perfDelta >= 0 ? '▲' : '▼'} ${Math.abs(perfDelta)} ${perfDelta >= 0 ? 'ahead' : 'behind'}
                  </div>
                </div>
                <div class="profile-bench-col">
                  <div class="profile-bench-label">Perf/Watt</div>
                  <div class="profile-bench-values">
                    <span class="pb-you">${playerEfficiency.toFixed(2)}</span>
                    <span class="pb-vs">vs</span>
                    <span class="pb-them">${industryEfficiency.toFixed(2)}</span>
                  </div>
                  <div class="profile-bench-delta ${efficiencyDelta >= 0 ? 'good' : 'bad'}">
                    ${efficiencyDelta >= 0 ? '▲' : '▼'} ${Math.abs(efficiencyDelta).toFixed(2)}
                  </div>
                </div>
                <div class="profile-bench-col">
                  <div class="profile-bench-label">Price</div>
                  <div class="profile-bench-values">
                    <span class="pb-you">$${best.price}</span>
                    <span class="pb-vs">vs</span>
                    <span class="pb-them">$${industryPrice}</span>
                  </div>
                  <div class="profile-bench-delta ${best.price <= industryPrice ? 'good' : 'bad'}">
                    ${best.price <= industryPrice ? '▲ competitive' : '▼ premium'}
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}

      </div>
    </div>
  `;
}

// =========================================================
// WIKI
// =========================================================
function renderWiki() {
  const entries = [
    { cat: 'Silicon', title: 'Process node', body: 'A manufacturing generation — 350nm, 250nm, 7nm, 2nm. Smaller nodes pack more transistors, run cooler, and use less power. Unlocks in-game in its real-world year.' },
    { cat: 'Silicon', title: 'ISA (Instruction Set Architecture)', body: 'The language a CPU speaks. x86 dominates desktops, ARM rules mobile, RISC-V is open. Changing ISA is a long-term decision that locks your software ecosystem.' },
    { cat: 'Silicon', title: 'TDP (Thermal Design Power)', body: 'Heat output in watts. Higher TDP allows higher clocks but hurts mobile efficiency. Budget and mobile segments punish high TDP heavily.' },
    { cat: 'Silicon', title: 'Yield', body: 'The percentage of chips per wafer that work. Small die = high yield. Complex designs and early nodes drop yield fast — the cost killer.' },
    { cat: 'Silicon', title: 'SIMD', body: 'Single Instruction, Multiple Data. MMX, SSE, AVX-512. Each generation unlocks new workloads. Rivals counter with broader SIMD over time.' },
    { cat: 'Design',  title: 'R&D pipeline', body: 'Every product goes Design → Verification → Software → Fab → Launch. Engineers accelerate each stage. Rushing hurts yield.' },
    { cat: 'Design',  title: 'Die area', body: 'Physical chip size in mm². Bigger die = more performance but lower yield and higher unit cost.' },
    { cat: 'Business', title: 'Market share', body: 'Your slice of the total market. Each launch moves it. Rivals chip away at it every turn — staying still means falling behind.' },
    { cat: 'Business', title: 'Research points (RP)', body: 'Accumulate automatically from engineers and progress. Spend them to unlock the next process node in its real-world year.' },
    { cat: 'Business', title: 'Difficulty', body: 'Easy — rivals respond slowly. Normal — balanced. Hard — rivals anticipate your moves and counter broadly.' },
    { cat: 'Business', title: 'Bankruptcy', body: 'Cash hits zero and the game ends. Watch burn rate, salaries, and R&D commitments. Loans buy time but compound.' },
    { cat: 'Industry', title: 'Historical events', body: 'Dot-com crash, 2008 crisis, smartphone boom, AI era. Real events shape demand curves in-game at the correct months.' },
  ];

  const byCat = {};
  entries.forEach(e => {
    if (!byCat[e.cat]) byCat[e.cat] = [];
    byCat[e.cat].push(e);
  });

  return `
    <div class="profile-sheet">
      ${renderSubHeader('Wiki', `${entries.length} entries`)}
      <div class="profile-body">
        ${Object.keys(byCat).map(cat => `
          <div class="profile-menu-section">
            <div class="profile-menu-title">${_esc(cat)}</div>
            <div class="profile-wiki-list">
              ${byCat[cat].map(e => `
                <details class="profile-wiki-item">
                  <summary>
                    <span>${_esc(e.title)}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="m6 9 6 6 6-6"/></svg>
                  </summary>
                  <div class="profile-wiki-body">${_esc(e.body)}</div>
                </details>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// =========================================================
// SETTINGS
// =========================================================
function renderSettings() {
  return `
    <div class="profile-sheet">
      ${renderSubHeader('Settings', 'Preferences')}
      <div class="profile-body">

        <div class="profile-menu-section">
          <div class="profile-menu-title">Gameplay</div>
          <div class="profile-settings">
            <div class="setting-row">
              <div class="setting-body">
                <div class="setting-label">Default speed</div>
                <div class="setting-desc">Applied when a new game starts.</div>
              </div>
              <div class="seg" id="seg-speed">
                <button data-speed="0" class="${(state._defaultSpeed || 0) === 0 ? 'active' : ''}">⏸</button>
                <button data-speed="1" class="${(state._defaultSpeed || 0) === 1 ? 'active' : ''}">1×</button>
                <button data-speed="2" class="${(state._defaultSpeed || 0) === 2 ? 'active' : ''}">2×</button>
                <button data-speed="4" class="${(state._defaultSpeed || 0) === 4 ? 'active' : ''}">4×</button>
              </div>
            </div>
            <div class="setting-row">
              <div class="setting-body">
                <div class="setting-label">Autosave</div>
                <div class="setting-desc">Save to browser every 30 seconds.</div>
              </div>
              <button class="switch ${state._autosave !== false ? 'on' : ''}" id="sw-autosave"></button>
            </div>
            <div class="setting-row">
              <div class="setting-body">
                <div class="setting-label">Pause on milestones</div>
                <div class="setting-desc">Auto-pause when an event fires.</div>
              </div>
              <button class="switch ${state._pauseOnMilestone !== false ? 'on' : ''}" id="sw-pause"></button>
            </div>
          </div>
        </div>

        <div class="profile-menu-section">
          <div class="profile-menu-title">Save & Data</div>
          <div class="profile-actions">
            <button class="profile-action" id="pf-save">
              <div class="pa-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg></div>
              <div class="pa-body">
                <div class="pa-title">Save now</div>
                <div class="pa-desc">Autosaves every 30 seconds.</div>
              </div>
            </button>
            <button class="profile-action" id="pf-export">
              <div class="pa-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg></div>
              <div class="pa-body">
                <div class="pa-title">Export save</div>
                <div class="pa-desc">Copy as text for backup.</div>
              </div>
            </button>
            <button class="profile-action" id="pf-import">
              <div class="pa-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg></div>
              <div class="pa-body">
                <div class="pa-title">Import save</div>
                <div class="pa-desc">Restore from exported code.</div>
              </div>
            </button>
            <button class="profile-action danger" id="pf-reset">
              <div class="pa-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></div>
              <div class="pa-body">
                <div class="pa-title">Reset game</div>
                <div class="pa-desc">Delete save, start fresh.</div>
              </div>
            </button>
          </div>
        </div>

        <div class="profile-about">
          Founder Companies <strong>v2.0.0</strong><br>
          Turn-based semiconductor tycoon<br>
          Built with vanilla JavaScript
        </div>

      </div>
    </div>
  `;
}

// =========================================================
// EVENT BINDINGS
// =========================================================
function bindProfileEvents() {
  document.getElementById('profile-close')?.addEventListener('click', closeProfile);
  document.getElementById('profile-back')?.addEventListener('click', backToProfileMenu);

  const modal = document.getElementById('profile-modal');
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeProfile();
  });

  // Menu tiles
  document.querySelectorAll('[data-profile-view]').forEach(tile => {
    tile.addEventListener('click', () => goProfile(tile.dataset.profileView));
  });

  // Rankings sort
  document.querySelectorAll('[data-sort]').forEach(btn => {
    btn.addEventListener('click', () => {
      rankingsSort = btn.dataset.sort;
      renderProfile();
    });
  });

  // Save/load actions
  document.getElementById('pf-save')?.addEventListener('click', () => {
    if (typeof saveGame === 'function') {
      saveGame();
      popCenterToast('Game saved');
    }
  });

  document.getElementById('pf-export')?.addEventListener('click', () => {
    try {
      const data = JSON.stringify(state);
      const b64 = btoa(unescape(encodeURIComponent(data)));
      if (navigator.clipboard) {
        navigator.clipboard.writeText(b64).then(
          () => popCenterToast('Save copied'),
          () => prompt('Copy this save code:', b64)
        );
      } else {
        prompt('Copy this save code:', b64);
      }
    } catch (e) { alert('Export failed: ' + e.message); }
  });

  document.getElementById('pf-import')?.addEventListener('click', () => {
    const code = prompt('Paste your save code:');
    if (!code) return;
    try {
      const json = decodeURIComponent(escape(atob(code.trim())));
      const data = JSON.parse(json);
      if (!data || !data.version) throw new Error('Invalid');
      state = data;
      if (typeof saveGame === 'function') saveGame(true);
      popCenterToast('Save imported');
      setTimeout(() => location.reload(), 700);
    } catch (e) { alert('Invalid save code.'); }
  });

  document.getElementById('pf-reset')?.addEventListener('click', () => {
    if (!confirm('Reset your company? All progress will be lost.')) return;
    if (typeof resetGame === 'function') resetGame();
    if (typeof saveGame === 'function') saveGame(true);
    location.reload();
  });

  // Settings
  document.querySelectorAll('#seg-speed button').forEach(btn => {
    btn.addEventListener('click', () => {
      const sp = parseInt(btn.dataset.speed);
      state._defaultSpeed = sp;
      document.querySelectorAll('#seg-speed button').forEach(b => b.classList.toggle('active', b === btn));
      if (typeof saveGame === 'function') saveGame(true);
      popCenterToast('Default speed: ' + (sp === 0 ? 'Pause' : sp + '×'));
    });
  });

  document.getElementById('sw-autosave')?.addEventListener('click', (e) => {
    state._autosave = !(state._autosave !== false);
    e.currentTarget.classList.toggle('on', state._autosave !== false);
    if (typeof saveGame === 'function') saveGame(true);
    popCenterToast('Autosave ' + (state._autosave !== false ? 'on' : 'off'));
  });

  document.getElementById('sw-pause')?.addEventListener('click', (e) => {
    state._pauseOnMilestone = !(state._pauseOnMilestone !== false);
    e.currentTarget.classList.toggle('on', state._pauseOnMilestone !== false);
    if (typeof saveGame === 'function') saveGame(true);
    popCenterToast('Pause on milestones ' + (state._pauseOnMilestone !== false ? 'on' : 'off'));
  });
}

// =========================================================
// UTIL
// =========================================================
function popCenterToast(msg) {
  const el = document.createElement('div');
  el.className = 'toast-center';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 1400);
}

function updateProfileAvatar() {
  const el = document.getElementById('profile-avatar');
  if (!el || !state) return;
  const arch = (typeof getArchetype === 'function' && state.archetype) ? getArchetype(state.archetype) : null;
  const name = state.companyName || (arch ? arch.name : 'F');
  el.textContent = (name || 'F').trim().charAt(0).toUpperCase();
}

// =========================================================
// ICONS
// =========================================================
function profileIcon(name) {
  const icons = {
    'icon-press':    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/></svg>',
    'icon-journal':  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    'icon-dlc':      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></svg>',
    'icon-rank':     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21V9M12 21V5M16 21v-8M3 21h18"/></svg>',
    'icon-bench':    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M9 20V4M14 20v-6M19 20v-10"/></svg>',
    'icon-wiki':     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    'icon-settings': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  };
  return icons[name] || icons['icon-settings'];
}

// =========================================================
// ESC + SELF-BIND
// =========================================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (profileView !== 'menu') { backToProfileMenu(); }
    else { closeProfile(); }
  }
});

function bindProfileButton() {
  const btn = document.getElementById('btn-profile');
  if (!btn || btn.dataset.bound === '1') return;
  btn.dataset.bound = '1';
  btn.addEventListener('click', openProfile);
}

document.addEventListener('DOMContentLoaded', () => { bindProfileButton(); updateProfileAvatar(); });
window.addEventListener('load', bindProfileButton);

window.openProfile = openProfile;
window.closeProfile = closeProfile;
