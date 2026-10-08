// js/ui/panelMarket.js
// Market modal — menggunakan onclick global. Tidak pakai event delegation.

let marketView = 'menu';

// =========================================================
// OPEN / CLOSE / NAVIGATE — global functions
// =========================================================
function openMarketModal() {
  const modal = document.getElementById('market-modal');
  if (!modal) { alert('Market modal container missing.'); return; }
  if (!state) return;
  marketView = 'menu';
  renderMarketModal();
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  console.log('[Market] opened');
}

function closeMarketModal() {
  const modal = document.getElementById('market-modal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
  console.log('[Market] closed');
}

function goMarket(view) {
  console.log('[Market] navigate to:', view);
  marketView = view;
  renderMarketModal();
}

function backToMarketMenu() {
  console.log('[Market] back to menu');
  marketView = 'menu';
  renderMarketModal();
}

function showMarket() { openMarketModal(); }

// Backdrop click — handled globally, check target
document.addEventListener('click', function(e) {
  const modal = document.getElementById('market-modal');
  if (!modal || !modal.classList.contains('active')) return;
  if (e.target === modal) closeMarketModal();
});

// ESC handler
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  const modal = document.getElementById('market-modal');
  if (!modal || !modal.classList.contains('active')) return;
  if (marketView !== 'menu') backToMarketMenu();
  else closeMarketModal();
});

// =========================================================
// RENDER
// =========================================================
function renderMarketModal() {
  const modal = document.getElementById('market-modal');
  if (!modal) return;
  modal.innerHTML = marketView === 'menu' ? renderMarketMenu() : renderMarketSub(marketView);
}

// =========================================================
// MENU
// =========================================================
function renderMarketMenu() {
  const launched = state.products.filter(p => p.launched);
  const activeComps = (typeof getActiveCompetitors === 'function') ? getActiveCompetitors(state.tahun).length : 0;
  const notifCount = (state.notifications || []).length;

  return `
    <div class="profile-sheet market-sheet">
      <div class="market-sheet-head">
        <div>
          <div class="market-sheet-eyebrow">Market</div>
          <h3>Business intelligence</h3>
        </div>
        <button type="button" class="market-sheet-close" onclick="closeMarketModal()" aria-label="Close">✕</button>
      </div>
      <div class="market-sheet-body">
        <p class="market-sheet-sub">Sales results, demand, competitors, and press.</p>

        <div class="market-tile-grid">
          <button type="button" class="profile-tile" onclick="goMarket('sales')" style="--tile-color:#c9542a">
            <div class="profile-tile-icon" style="background:rgba(201,84,42,0.12);color:#c9542a">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 17l5-5 4 4 8-8"/><path d="M14 8h6v6"/>
              </svg>
            </div>
            <div class="profile-tile-label">Sales</div>
            <div class="profile-tile-sub">${launched.length} products</div>
          </button>

          <button type="button" class="profile-tile" onclick="goMarket('demand')" style="--tile-color:#2e8391">
            <div class="profile-tile-icon" style="background:rgba(46,131,145,0.12);color:#2e8391">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 3v18h18"/><path d="M7 14l3-4 3 3 5-7"/>
              </svg>
            </div>
            <div class="profile-tile-label">Demand</div>
            <div class="profile-tile-sub">5 segments</div>
          </button>

          <button type="button" class="profile-tile" onclick="goMarket('competitors')" style="--tile-color:#7a5ba8">
            <div class="profile-tile-icon" style="background:rgba(122,91,168,0.12);color:#7a5ba8">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 20V10M10 20V4M16 20v-8M20 20V6"/>
              </svg>
            </div>
            <div class="profile-tile-label">Competitors</div>
            <div class="profile-tile-sub">${activeComps} active</div>
          </button>

          <button type="button" class="profile-tile" onclick="goMarket('press')" style="--tile-color:#b8852b">
            <div class="profile-tile-icon" style="background:rgba(184,133,43,0.12);color:#b8852b">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
                <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>
              </svg>
            </div>
            <div class="profile-tile-label">Press</div>
            <div class="profile-tile-sub">${notifCount} articles</div>
          </button>
        </div>

        <div class="market-quick-stats">
          <div class="mqs-cell">
            <div class="mqs-label">Market share</div>
            <div class="mqs-value accent">${(state.marketShare * 100).toFixed(1)}%</div>
          </div>
          <div class="mqs-cell">
            <div class="mqs-label">Products live</div>
            <div class="mqs-value">${launched.length}</div>
          </div>
          <div class="mqs-cell">
            <div class="mqs-label">Total revenue</div>
            <div class="mqs-value good">${formatMoneyShort(state.totalRevenue || 0)}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// =========================================================
// SUB DISPATCHER
// =========================================================
function renderMarketSub(view) {
  if (view === 'sales')       return renderMarketSales();
  if (view === 'demand')      return renderMarketDemand();
  if (view === 'competitors') return renderMarketCompetitors();
  if (view === 'press')       return renderMarketPress();
  return renderMarketMenu();
}

function renderSubHeader(title, subtitle) {
  return `
    <div class="profile-sub-head">
      <button type="button" class="profile-sub-back" onclick="backToMarketMenu()" aria-label="Back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div class="profile-sub-title">
        <div class="profile-sub-eyebrow">${escapeHtml(subtitle)}</div>
        <h3>${escapeHtml(title)}</h3>
      </div>
      <button type="button" class="profile-sub-close" onclick="closeMarketModal()" aria-label="Close">✕</button>
    </div>
  `;
}

// =========================================================
// SALES
// =========================================================
function renderMarketSales() {
  const launched = state.products.filter(p => p.launched);
  if (launched.length === 0) {
    return `
      <div class="profile-sheet market-sheet">
        ${renderSubHeader('Sales', 'No products')}
        <div class="market-sheet-body">
          <div class="profile-empty">
            <div class="profile-empty-icon">📊</div>
            <div class="profile-empty-title">No sales yet</div>
            <div class="profile-empty-desc">Launch your first product to see sales data here.</div>
          </div>
        </div>
      </div>
    `;
  }
  const total = launched.reduce((s, p) => s + (p.revenue || 0), 0);
  const sorted = launched.slice().sort((a, b) => (b.revenue || 0) - (a.revenue || 0));

  return `
    <div class="profile-sheet market-sheet">
      ${renderSubHeader('Sales', `${launched.length} products`)}
      <div class="market-sheet-body">
        <div class="market-totals">
          <div class="market-total-cell">
            <div class="mtc-label">Lifetime revenue</div>
            <div class="mtc-value good">${formatMoneyShort(total)}</div>
          </div>
          <div class="market-total-cell">
            <div class="mtc-label">Total units</div>
            <div class="mtc-value">${launched.reduce((s, p) => s + (p.sales || 0), 0).toLocaleString('en-US')}</div>
          </div>
        </div>

        <div class="section-title">All products</div>
        <div class="market-sales-list">
          ${sorted.map(p => {
            const pct = total > 0 ? (p.revenue / total) * 100 : 0;
            return `
              <div class="market-sales-row">
                <div class="market-sales-head">
                  <div class="market-sales-name">${escapeHtml(p.name)}</div>
                  <div class="market-sales-rev">${formatMoneyShort(p.revenue || 0)}</div>
                </div>
                <div class="market-sales-meta">${p.node} · ${(typeof getCategory === 'function' ? getCategory(p.category)?.name : p.category) || p.category}</div>
                <div class="market-sales-bar-wrap"><div class="market-sales-bar" style="width:${pct}%"></div></div>
                <div class="market-sales-units">${(p.sales || 0).toLocaleString('en-US')} units</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

// =========================================================
// DEMAND
// =========================================================
function renderMarketDemand() {
  const segs = (typeof getAvailableSegments === 'function') ? getAvailableSegments(state.tahun) : [];
  return `
    <div class="profile-sheet market-sheet">
      ${renderSubHeader('Demand', `${segs.length} segments`)}
      <div class="market-sheet-body">
        <div class="profile-bench-note" style="margin-bottom:16px;">
          Demand shifts with real-world events. Watch for booms and crises.
        </div>
        ${segs.map(s => {
          const yearsLive = Math.max(0, state.tahun - s.year);
          const currentSize = s.marketSize * Math.pow(1 + s.growthRate, yearsLive);
          return `
            <div class="card">
              <div class="row between">
                <h3>${s.icon} ${escapeHtml(s.name)}</h3>
                <span class="badge">${(s.growthRate * 100).toFixed(1)}%/yr</span>
              </div>
              <div class="meta">~${Math.round(currentSize).toLocaleString('en-US')} units / year</div>
              <div class="stat-row"><span class="k">Price priority</span><span class="v">${(s.priceWeight * 100).toFixed(0)}%</span></div>
              <div class="stat-row"><span class="k">Performance priority</span><span class="v">${(s.perfWeight * 100).toFixed(0)}%</span></div>
              <div class="stat-row"><span class="k">TDP priority</span><span class="v">${(s.tdpWeight * 100).toFixed(0)}%</span></div>
              <div class="stat-row"><span class="k">Feature priority</span><span class="v">${(s.featureWeight * 100).toFixed(0)}%</span></div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// =========================================================
// COMPETITORS
// =========================================================
function renderMarketCompetitors() {
  const breakdown = (typeof getMarketBreakdown === 'function') ? getMarketBreakdown(state) : { competitors: [], others: { share: 0 } };
  const active = (typeof getActiveCompetitors === 'function') ? getActiveCompetitors(state.tahun) : [];

  return `
    <div class="profile-sheet market-sheet">
      ${renderSubHeader('Competitors', `${active.length} active`)}
      <div class="market-sheet-body">
        <div class="market-share-bar-wrap">
          <div class="market-share-bar-you" style="width:${state.marketShare * 100}%"></div>
        </div>
        <div class="stat-row"><span class="k">Your share</span><span class="v accent">${(state.marketShare * 100).toFixed(1)}%</span></div>
        ${breakdown.competitors.map(c => `
          <div class="stat-row"><span class="k">${c.icon || '●'} ${escapeHtml(c.name)}</span><span class="v">${(c.share * 100).toFixed(1)}%</span></div>
        `).join('')}
        <div class="stat-row"><span class="k">Others (fragmented)</span><span class="v">${(breakdown.others.share * 100).toFixed(1)}%</span></div>

        <div class="section-title">Rival profiles</div>
        ${active.map(c => `
          <div class="card">
            <div class="row between">
              <h3>${c.icon} ${escapeHtml(c.name)}</h3>
              <span class="badge">since ${c.founded}</span>
            </div>
            <div class="meta">Focus · ${c.focus.join(', ').toUpperCase()}</div>
            <div style="font-size:12px;color:var(--fg-2);line-height:1.5;margin-top:4px;">${escapeHtml(c.personality || '')}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// =========================================================
// PRESS
// =========================================================
function renderMarketPress() {
  const notifs = (state.notifications || []).slice(0, 40);
  const catMeta = (typeof HEADLINE_CATEGORIES !== 'undefined') ? HEADLINE_CATEGORIES : {};
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return `
    <div class="profile-sheet market-sheet">
      ${renderSubHeader('Press', `${notifs.length} articles`)}
      <div class="market-sheet-body">
        ${notifs.length === 0 ? `
          <div class="profile-empty">
            <div class="profile-empty-icon">📰</div>
            <div class="profile-empty-title">No press yet</div>
            <div class="profile-empty-desc">Headlines appear as you pass each month.</div>
          </div>
        ` : notifs.map(n => {
          const cat = catMeta[n.cat] || { label: 'Industry', color: '#786d5b' };
          const mLabel = monthNames[(n.month || 1) - 1];
          return `
            <div class="market-press-item">
              <div class="market-press-head">
                <span class="profile-article-tag" style="background:${cat.color}20;color:${cat.color}">${escapeHtml(cat.label)}</span>
                <span class="profile-article-date">${mLabel} ${n.year}</span>
              </div>
              <div class="market-press-title">${escapeHtml(n.title)}</div>
              <div class="market-press-desc">${escapeHtml(n.desc)}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Expose globals
window.openMarketModal = openMarketModal;
window.closeMarketModal = closeMarketModal;
window.goMarket = goMarket;
window.backToMarketMenu = backToMarketMenu;
window.showMarket = showMarket;
