// js/ui/panelProduction.js
// Production hub — Active R&D, Product Portfolio, Factory, Research, Team.

function showProduction(focus) {
  const active = state.projects.filter(p => p.status === 'active');
  const ready = state.projects.filter(p => p.status === 'done');
  const launched = state.products.filter(p => p.launched);

  const nextTech = (typeof getNextTech === 'function') ? getNextTech(state.currentNode) : null;
  const canRes = (typeof canResearchNext === 'function') ? canResearchNext(state) : { ok: false };
  const rpGain = (typeof calcRPGain === 'function') ? calcRPGain(state) : 2;

  const founder = state.team.find(e => e.isFounder);
  const hired = state.team.filter(e => !e.isFounder);
  const salary = hired.reduce((s, e) => s + (e.salary || 0), 0);

  const tech = (typeof getTech === 'function') ? getTech(state.currentNode) : null;
  const waferCost = tech ? tech.waferCost : 0;
  const nodeYear = tech ? tech.year : 1995;

  setPanel('Production', `${active.length} active · ${ready.length} ready · ${launched.length} shipped`, `

    ${ready.length > 0 ? `
      <div class="section-title">Ready to launch · ${ready.length}</div>
      ${ready.map(p => `
        <div class="card selected" style="border-color:var(--good)">
          <div class="row between">
            <h3>${iconFor(p.category)} ${escapeHtml(p.name)}</h3>
            <span class="badge good">READY</span>
          </div>
          <div class="meta">${p.node} · PERF ${p.perfScore} · TDP ${p.tdp}W · $${p.price}</div>
          <div class="stat-row"><span class="k">Unit cost</span><span class="v">${formatMoney(p.unitCost)}</span></div>
          <div class="stat-row"><span class="k">Margin</span><span class="v ${p.price - p.unitCost > 0 ? 'good' : 'bad'}">${formatMoney(p.price - p.unitCost)}</span></div>
          <button class="btn good lg mt-2" data-launch-prod="${p.id}">Luncurkan ke Pasar</button>
        </div>
      `).join('')}
    ` : ''}

    ${active.length > 0 ? `
      <div class="section-title">Active R&D · ${active.length}</div>
      ${active.map(p => renderActiveProjectCard(p)).join('')}
    ` : ''}

    <div class="section-title">Product portfolio · ${launched.length}</div>
    ${renderPortfolio(launched)}

    <div class="section-title" id="prod-factory">Factory</div>
    <div class="prod-hub-card">
      <div class="prod-hub-head">
        <div class="prod-hub-icon" style="background:rgba(184,133,43,0.14);color:var(--warn)">🏭</div>
        <div class="prod-hub-body">
          <div class="prod-hub-title">Fab capability</div>
          <div class="prod-hub-sub">Node ${escapeHtml(state.currentNode)} · wafer ${formatMoneyShort(waferCost)}</div>
        </div>
      </div>
      <div class="stat-row"><span class="k">Node era</span><span class="v">${nodeYear}</span></div>
      <div class="stat-row"><span class="k">Wafer cost</span><span class="v">${formatMoneyShort(waferCost)}</span></div>
      <div class="stat-row"><span class="k">Transistor density</span><span class="v">${tech ? tech.transistorDensity : 0} M/mm²</span></div>
      <div class="stat-row"><span class="k">Base yield</span><span class="v">${tech ? Math.round(tech.baseYield * 100) : 0}%</span></div>
      <div class="stat-row"><span class="k">TDP factor</span><span class="v">${tech ? tech.tdpFactor : 1}</span></div>
    </div>

    <div class="section-title" id="prod-research">Research</div>
    <div class="prod-hub-card">
      <div class="prod-hub-head">
        <div class="prod-hub-icon" style="background:rgba(122,91,168,0.14);color:var(--purple)">🔬</div>
        <div class="prod-hub-body">
          <div class="prod-hub-title">Next node: ${nextTech ? nextTech.name : 'Maxed'}</div>
          <div class="prod-hub-sub">${state.researchPoint.toLocaleString('en-US')} RP · +${rpGain} RP/turn</div>
        </div>
      </div>
      <div class="stat-row"><span class="k">Current node</span><span class="v">${state.currentNode}</span></div>
      <div class="stat-row"><span class="k">Unlocked</span><span class="v">${state.unlockedNodes.length} / ${typeof TECH_TREE !== 'undefined' ? TECH_TREE.length : 0}</span></div>
      ${nextTech ? `
        <div class="stat-row"><span class="k">Next node</span><span class="v">${nextTech.name}</span></div>
        <div class="stat-row"><span class="k">Availability</span><span class="v">${nextTech.year}</span></div>
        <div class="stat-row"><span class="k">Cost</span><span class="v">${nextTech.rp} RP · ${formatMoneyShort(nextTech.cost)}</span></div>
      ` : ''}
      <button class="btn primary mt-2" id="prod-research-btn" ${canRes.ok ? '' : 'disabled'}>
        ${canRes.ok ? `Riset ${nextTech.name} sekarang` : (canRes.reason || 'Belum tersedia')}
      </button>
    </div>

    <div class="section-title" id="prod-team">Team & Office</div>
    <div class="prod-hub-card">
      <div class="prod-hub-head">
        <div class="prod-hub-icon" style="background:rgba(201,84,42,0.14);color:var(--accent)">👥</div>
        <div class="prod-hub-body">
          <div class="prod-hub-title">${state.team.length} engineer${state.team.length === 1 ? '' : 's'}</div>
          <div class="prod-hub-sub">${hired.length} hired · ${formatMoneyShort(salary)}/turn salaries</div>
        </div>
      </div>
      ${founder ? `<div class="stat-row"><span class="k">Founder</span><span class="v">${escapeHtml(founder.name)}</span></div>` : ''}
      <div class="stat-row"><span class="k">Hired engineers</span><span class="v">${hired.length}</span></div>
      <div class="stat-row"><span class="k">Candidates waiting</span><span class="v">${state.pool.length}</span></div>
      <div class="row mt-2" style="gap:8px;flex-wrap:wrap;">
        <button class="btn primary" id="prod-team-hire">Hire & manage →</button>
      </div>
    </div>
  `);

  // Bind
  document.querySelectorAll('[data-launch-prod]').forEach(b => {
    b.addEventListener('click', () => launchFromProduction(b.dataset.launchProd));
  });

  document.querySelectorAll('[data-portfolio-cat]').forEach(el => {
    el.addEventListener('click', () => toast('Product detail coming soon.', 'info'));
  });

  document.getElementById('prod-research-btn')?.addEventListener('click', () => {
    if (typeof performResearch === 'function') {
      const r = performResearch(state);
      if (r.success) {
        addLog(`Riset selesai: node ${r.tech.name} dikuasai.`, 'good');
        toast(`Node ${r.tech.name} unlocked!`, 'good');
        showProduction();
      } else {
        toast(r.reason, 'bad');
      }
    }
  });

  document.getElementById('prod-team-hire')?.addEventListener('click', () => {
    toast('Team management coming soon via modal.', 'info');
  });

  if (focus === 'team' || focus === 'research' || focus === 'factory') {
    setTimeout(() => {
      const el = document.getElementById('prod-' + focus);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}

// =========================================================
// ACTIVE PROJECT CARD — with duration in months
// =========================================================
function renderActiveProjectCard(p) {
  const progress = (typeof calcOverallProgress === 'function') ? calcOverallProgress(p) : 0;
  const stages = p.stages || PROJECT_STAGES;
  const stage = stages[p.stageIndex] || { name: 'Design' };
  const assigned = state.team.filter(e => p.engineerIds && p.engineerIds.includes(e.id));
  const remaining = (typeof estimateRemainingTurns === 'function') ? estimateRemainingTurns(p, assigned) : 0;
  const totalMonths = p.totalMonths || stages.reduce((s, st) => s + st.baseTurns, 0);
  const elapsed = p.elapsedMonths || 0;

  // Timeline visualization
  const timelineHtml = stages.map((s, i) => {
    const done = i < p.stageIndex;
    const active = i === p.stageIndex;
    return `
      <div class="proj-timeline-node ${done ? 'done' : ''} ${active ? 'active' : ''}" title="${escapeHtml(s.name)} · ${s.baseTurns}mo">
        <div class="proj-node-dot"></div>
        <div class="proj-node-label">${escapeHtml(s.name)}</div>
        <div class="proj-node-months">${s.baseTurns}mo</div>
      </div>
    `;
  }).join('');

  return `
    <div class="card">
      <div class="row between">
        <h3>${iconFor(p.category)} ${escapeHtml(p.name)}</h3>
        <span class="badge info">${stage.name}</span>
      </div>
      <div class="meta">${p.node} · ${(typeof getSegment === 'function' ? getSegment(p.segment)?.name : '—') || '—'} · ${assigned.length} engineer${assigned.length === 1 ? '' : 's'}</div>

      <div class="progress">
        <div class="progress-fill" style="width:${progress}%"></div>
      </div>
      <div class="row between" style="font-size:11px;color:var(--fg-3);font-family:var(--font-mono);">
        <span>${progress}% · ${stage.name}</span>
        <span>~${remaining} mo left</span>
      </div>

      <!-- Month counter -->
      <div class="proj-month-counter">
        <span class="pmc-elapsed">${elapsed}</span>
        <span class="pmc-slash">/</span>
        <span class="pmc-total">${totalMonths}</span>
        <span class="pmc-label">months</span>
      </div>

      <!-- Stage timeline -->
      <div class="proj-timeline">
        ${timelineHtml}
      </div>

      <div class="divider"></div>

      <div class="stat-row"><span class="k">Target perf</span><span class="v">${p.perfScore}</span></div>
      <div class="stat-row"><span class="k">TDP</span><span class="v">${p.tdp} W</span></div>
      <div class="stat-row"><span class="k">Budget</span><span class="v">${formatMoneyShort(p.spent || 0)} / ${formatMoneyShort(p.designBudget || 0)}</span></div>

      <button class="btn danger sm mt-2" data-cancel-prod="${p.id}">Batalkan</button>
    </div>
  `;
}

// =========================================================
// PORTFOLIO
// =========================================================
function renderPortfolio(launched) {
  if (launched.length === 0) {
    return `
      <div class="portfolio-empty">
        <div class="portfolio-empty-icon">📦</div>
        <div class="portfolio-empty-title">No products shipped yet</div>
        <div class="portfolio-empty-desc">Design and launch your first chip to build a product history.</div>
        <button class="btn primary" onclick="if(typeof openDesignerCategoryChooser==='function')openDesignerCategoryChooser()">
          Open Designer
        </button>
      </div>
    `;
  }

  const categories = ['cpu', 'gpu', 'laptop', 'smartphone', 'os'];
  const grouped = {};
  categories.forEach(c => grouped[c] = []);
  launched.forEach(p => {
    if (grouped[p.category]) grouped[p.category].push(p);
  });
  categories.forEach(c => grouped[c].sort((a, b) => (a.launchTurn || 0) - (b.launchTurn || 0)));

  const blocks = categories.map(cat => {
    const items = grouped[cat];
    if (items.length === 0) return '';
    return renderPortfolioCategory(cat, items);
  }).filter(Boolean).join('');

  const knownCats = new Set(categories);
  const orphans = launched.filter(p => !knownCats.has(p.category));
  const orphanBlock = orphans.length > 0 ? renderPortfolioCategory(orphans[0].category, orphans) : '';

  return `<div class="portfolio-wrap">${blocks}${orphanBlock}</div>`;
}

function renderPortfolioCategory(cat, items) {
  const catInfo = (typeof getCategory === 'function') ? getCategory(cat) : { name: cat };
  const isOS = cat === 'os';
  const nodes = items.map(p => p.node);
  const countLabel = isOS
    ? `${items.length} version${items.length === 1 ? '' : 's'}`
    : `${items.length} product${items.length === 1 ? '' : 's'}`;
  const firstNode = nodes[0];
  const lastNode = nodes[nodes.length - 1];
  const nodeMoved = nodes.length > 1 && firstNode !== lastNode;

  return `
    <div class="portfolio-category">
      <div class="portfolio-head">
        <div class="portfolio-cat-name">
          ${iconFor(cat)}
          <span>${escapeHtml(catInfo.name)}</span>
        </div>
        <div class="portfolio-cat-count">${countLabel}</div>
      </div>

      ${nodeMoved ? `
        <div class="portfolio-progression">
          <span class="pp-from">${escapeHtml(firstNode)}</span>
          <span class="pp-arrow">→</span>
          <span class="pp-to">${escapeHtml(lastNode)}</span>
          <span class="pp-label">node shrink ${items.length - 1}×</span>
        </div>
      ` : nodes.length === 1 ? `
        <div class="portfolio-progression">
          <span class="pp-from">${escapeHtml(firstNode)}</span>
          <span class="pp-label">initial node</span>
        </div>
      ` : ''}

      <div class="portfolio-scroll">
        ${items.map(p => renderPortfolioCard(p, cat, isOS)).join('')}
      </div>
    </div>
  `;
}

function renderPortfolioCard(p, cat, isOS) {
  const catColor = (typeof categoryColor === 'function') ? categoryColor(cat) : '#c9542a';
  const rank = state.products.filter(x => x.launched && x.category === cat)
    .sort((a, b) => (a.launchTurn || 0) - (b.launchTurn || 0))
    .findIndex(x => x.id === p.id) + 1;
  const versionLabel = isOS ? `v${rank}` : `#${rank}`;

  return `
    <div class="portfolio-card" data-portfolio-cat="${cat}">
      <div class="portfolio-version" style="background:${catColor}20;color:${catColor}">${versionLabel}</div>
      <div class="portfolio-art">${typeof renderBoxArt === 'function' ? renderBoxArt(p) : ''}</div>
      <div class="portfolio-name">${escapeHtml(p.name)}</div>
      <div class="portfolio-meta">
        <span>${p.node}</span><span>·</span><span>${p.perfScore} pts</span>
      </div>
      <div class="portfolio-price">${formatMoneyShort(p.revenue || 0)}</div>
    </div>
  `;
}

// =========================================================
// LAUNCH / CANCEL
// =========================================================
function launchFromProduction(projectId) {
  if (typeof launchProduct === 'function') return launchProduct(projectId);
  const p = state.projects.find(x => x.id === projectId);
  if (!p) return;
  p.status = 'launched';
  toast('Launched!', 'good');
  showProduction();
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-cancel-prod]');
  if (!btn) return;
  const id = btn.dataset.cancelProd;
  const p = state.projects.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Batalkan proyek "${p.name}"?`)) return;
  p.status = 'cancelled';
  const refund = Math.round(((p.designBudget || 0) - (p.spent || 0)) * 0.3);
  state.uang += refund;
  addLog(`Proyek "${p.name}" dibatalkan. Refund ${formatMoneyShort(refund)}.`, 'warn');
  toast('Proyek dibatalkan.', 'warn');
  showProduction();
});

if (typeof iconFor !== 'function') {
  window.iconFor = function(cat) {
    const colors = { cpu:'#c9542a', gpu:'#7a5ba8', os:'#3d8b5f', laptop:'#b8852b', smartphone:'#c47a2e' };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="${colors[cat] || '#7d8590'}" stroke-width="2" width="14" height="14"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>`;
  };
                                }
