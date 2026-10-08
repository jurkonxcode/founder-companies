// js/ui/designer.js
// Multi-step designer wizard. Currently supports full CPU flow.

// ===== State =====
let dsWizard = null; // { cat, step, draft, results }

// ===== Entry: open designer =====
function openDesignerCategoryChooser() {
  const wrap = document.getElementById('modal-wrap');
  if (!wrap) return;

  wrap.innerHTML = `
    <div class="modal ds-modal">
      <div class="modal-head">
        <h3>Create</h3>
        <button class="btn sm" data-ds-close>✕</button>
      </div>
      <div class="modal-body">
        <p class="muted mb-2" style="font-size:13px">Choose a product to build.</p>
        <div class="ds-cat-grid">
          ${renderCategoryTile('cpu', 'CPU', 'cpu', '#c9542a')}
          ${renderCategoryTile('gpu', 'GPU', 'gpu', '#7a5ba8')}
          ${renderCategoryTile('laptop', 'Laptop', 'laptop', '#b8852b')}
          ${renderCategoryTile('os', 'OS', 'os', '#3d8b5f')}
          ${renderCategoryTile('smartphone', 'Phone', 'phone', '#c47a2e')}
        </div>
      </div>
    </div>
  `;
  wrap.classList.add('active');

  wrap.querySelector('[data-ds-close]')?.addEventListener('click', closeDesigner);
  wrap.querySelectorAll('[data-ds-cat]').forEach(tile => {
    tile.addEventListener('click', () => {
      openCategoryDesigner(tile.dataset.dsCat);
    });
  });
}

function renderCategoryTile(cat, label, icon, color) {
  return `
    <button class="ds-cat-tile" data-ds-cat="${cat}" style="--tile-color:${color}">
      <div class="ds-cat-icon">${svgIconFor(icon, color)}</div>
      <div class="ds-cat-label">${label}</div>
    </button>
  `;
}

// ===== Category designer entry =====
function openCategoryDesigner(catId) {
  if (catId === 'cpu') {
    startDesignerWizard('cpu');
  } else if (catId === 'gpu') {
    startDesignerWizard('gpu');
  } else if (catId === 'laptop') {
    startDesignerWizard('laptop');
  } else if (catId === 'os') {
    startDesignerWizard('os');
  } else if (catId === 'smartphone') {
    startDesignerWizard('smartphone');
  } else {
    toast('This designer is coming soon.', 'warn');
  }
}

// ===== Wizard engine =====
function startDesignerWizard(catId) {
  if (!state) return;

  // Gate: engineer required
  if (state.team.length === 0) {
    toast('Recruit an engineer before starting R&D.', 'bad', 'No engineers');
    renderPanel('team');
    return;
  }

  const config = DESIGNER_CONFIG[catId];
  if (!config) return;

  dsWizard = {
    cat: catId,
    step: 0,
    draft: buildEmptyDraft(catId),
    config,
  };

  renderDesignerShell();
}

function buildEmptyDraft(catId) {
  const base = {
    name: '',
    segment: null,
    node: state.currentNode,
    price: 100,
    budget: 0,
    // chip params
    isa: 'x86',
    cores: 1,
    baseClock: 200,
    boostClock: 250,
    cacheL1: 16,
    cacheL2: 256,
    cacheL3: 0,
    simd: [],
    // gpu params
    shaderUnits: 4,
    rops: 4,
    memoryType: 'sdram',
    memoryGB: 4,
    // os
    kernelType: 'custom',
    features: [],
    // laptop
    chassis: 'mainstream',
    cpuRef: null,
    gpuRef: null,
    osRef: null,
    screenSize: 14,
    batteryWh: 40,
    // smartphone
    phoneScreen: 5.5,
    phoneBattery: 3000,
    cameraMP: 8,
  };
  return base;
}

// ===== Shell render =====
function renderDesignerShell() {
  const wrap = document.getElementById('modal-wrap');
  if (!wrap || !dsWizard) return;

  const { config, step, draft } = dsWizard;
  const isChip = dsWizard.cat === 'cpu' || dsWizard.cat === 'gpu';

  // Compute live stats (chip only)
  const stats = isChip ? computeChipStats(draft) : null;

  wrap.innerHTML = `
    <div class="modal ds-wizard ${isChip ? 'has-statbar' : ''}">
      <div class="ds-header">
        <button class="ds-back-btn" id="ds-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div class="ds-title">
          <div class="ds-title-main">${escapeHtml(config.title)}</div>
          <div class="ds-title-cash">
            <div class="ds-cash-value">${formatMoneyShort(state.uang)}</div>
            <div class="ds-cash-date">${formatDate(state.tahun, state.bulan)}</div>
          </div>
        </div>
        <button class="ds-help-btn" id="ds-help">?</button>
      </div>

      <div class="ds-progress">
        <div class="ds-progress-track">
          ${config.steps.map((s, i) => `
            <div class="ds-progress-dot ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}">
              <div class="ds-dot"></div>
              <div class="ds-dot-label">${escapeHtml(s)}</div>
            </div>
          `).join('')}
        </div>
        <div class="ds-step-label">
          <div class="ds-step-title">${escapeHtml(config.steps[step])}</div>
          <div class="ds-step-counter">${step + 1} / ${config.steps.length}</div>
        </div>
      </div>

      <div class="ds-body" id="ds-body">
        ${renderDesignerStep(step)}
      </div>

      ${isChip && stats ? `
        <div class="ds-statbar">
          ${config.statBar.map((label, i) => {
            const key = ['st','mt','tdp','cost'][i];
            const val = stats[key];
            return `
              <div class="ds-statbar-cell">
                <div class="ds-sb-label">${label}</div>
                <div class="ds-sb-value">${val}</div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}

      <div class="ds-footer">
        <button class="ds-nav-btn ds-nav-back" id="ds-prev" ${step === 0 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button class="ds-nav-btn ds-nav-next" id="ds-next">
          ${step === config.steps.length - 1 ? 'Start R&D' : 'Next'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  `;

  // Bind
  document.getElementById('ds-back')?.addEventListener('click', closeDesigner);
  document.getElementById('ds-prev')?.addEventListener('click', designerPrev);
  document.getElementById('ds-next')?.addEventListener('click', designerNext);
  document.getElementById('ds-help')?.addEventListener('click', () => {
    alert('Configure your product step by step. Live stats appear at the bottom for chip designs.');
  });

  bindDesignerStep();
}

function renderDesignerStep(step) {
  if (dsWizard.cat === 'cpu') return renderCpuStep(step);
  if (dsWizard.cat === 'gpu') return renderGpuStep(step);
  if (dsWizard.cat === 'laptop') return renderLaptopStep(step);
  if (dsWizard.cat === 'os') return renderOsStep(step);
  if (dsWizard.cat === 'smartphone') return renderPhoneStep(step);
  return '';
}

// ===== Navigation =====
function designerNext() {
  if (!dsWizard) return;
  const { config, step } = dsWizard;

  // Validate
  const validation = validateDesignerStep(step);
  if (!validation.ok) {
    toast(validation.msg, 'bad');
    return;
  }

  if (step === config.steps.length - 1) {
    commitDesignerWizard();
    return;
  }

  dsWizard.step++;
  renderDesignerShell();
}

function designerPrev() {
  if (!dsWizard || dsWizard.step === 0) return;
  dsWizard.step--;
  renderDesignerShell();
}

function validateDesignerStep(step) {
  const d = dsWizard.draft;
  const cat = dsWizard.cat;
  const stepName = dsWizard.config.steps[step];

  if (stepName === 'Concept') {
    if (!d.name.trim()) return { ok: false, msg: 'Enter a name to continue.' };
    if (!d.segment) return { ok: false, msg: 'Pick a target segment.' };
  }
  return { ok: true };
}

// ===== Commit =====
function commitDesignerWizard() {
  if (!dsWizard) return;
  const { cat, draft } = dsWizard;

  // Compute final chip spec
  const tech = getTech(draft.node);
  if (!tech) { toast('Invalid node.', 'bad'); return; }

  const chipData = finalizeChip({
    ...draft,
    category: cat,
    price: draft.price,
  }, state.tahun, {});

  if (!chipData) { toast('Design failed.', 'bad'); return; }

  const minCost = chipData.minDesignCost;
  const name = draft.name.trim() || `${cat.toUpperCase()}-${state.tahun}`;
  const project = createProject({ ...chipData, name }, state.tahun, state.bulan, state.team);
  state.projects.push(project);

  const upfront = Math.round(minCost * 0.3);
  state.uang -= upfront;

  addLog(`R&D started: "${name}" (${getCategory(cat).name} ${draft.node}).`, 'good');
  toast(`"${name}" design locked in. R&D started.`, 'good');

  closeDesigner();
  renderPanel('production');
}

function closeDesigner() {
  const wrap = document.getElementById('modal-wrap');
  if (!wrap) return;
  wrap.classList.remove('active');
  wrap.innerHTML = '';
  dsWizard = null;
}

// ===== Live chip stats =====
function computeChipStats(draft) {
  const tech = getTech(draft.node) || { refPerf: 10, tdpFactor: 1, maxClock: 300, cost: 0 };
  const yearFactor = Math.max(0, (tech.year - 1995) / 30);
  const clockRatio = (draft.boostClock || 200) / (tech.maxClock || 300);

  // CPU scoring
  let st = 0, mt = 0;
  if (dsWizard.cat === 'cpu') {
    const cores = draft.cores || 1;
    const cacheTotal = (draft.cacheL1 || 0) * cores + (draft.cacheL2 || 0) + (draft.cacheL3 || 0);
    const simdBonus = 1 + (draft.simd || []).length * 0.05;
    st = Math.round((tech.refPerf * 0.9 * clockRatio + cacheTotal / 200) * simdBonus);
    mt = Math.round(st * Math.pow(cores, 0.85));
  } else {
    // GPU scoring
    const shaders = draft.shaderUnits || 4;
    const rops = draft.rops || 4;
    st = Math.round((tech.refPerf * 0.6 + shaders * 4 + rops * 2) * clockRatio);
    mt = Math.round(st * 1.2);
  }

  const tdp = Math.max(3, Math.round(
    (dsWizard.cat === 'cpu'
      ? (draft.cores || 1) * 12 + (draft.boostClock || 200) / 100 * 3
      : (draft.shaderUnits || 4) * 6 + (draft.boostClock || 200) / 100 * 2
    ) * tech.tdpFactor
  ));

  const cost = Math.round(
    (tech.cost * 0.05 + 100
      + (draft.cores || 1) * 30
      + ((draft.shaderUnits || 0) * 15)
    ) * (dsWizard.cat === 'cpu' ? 1 : 1)
  );

  return { st, mt, tdp, cost };
}

// ===== CPU Step renderers =====
function renderCpuStep(step) {
  if (step === 0) return renderCpuConcept();
  if (step === 1) return renderCpuMicroarch();
  if (step === 2) return renderCpuFloorplan();
  return '';
}

function renderCpuConcept() {
  const d = dsWizard.draft;
  const isas = CPU_CONFIG.isas.filter(i => !i.minYear || state.tahun >= i.minYear);
  const segs = CPU_CONFIG.segments.filter(s => !s.minYear || state.tahun >= s.minYear);

  return `
    <div class="ds-section">
      <div class="ds-section-label">Series name</div>
      <input type="text" id="ds-name" class="ds-input-lg" placeholder="${DESIGNER_CONFIG.cpu.namePlaceholder}" value="${escapeHtml(d.name)}" maxlength="24">
      <div class="ds-chips">
        ${DESIGNER_CONFIG.cpu.nameSuggestions.map(s => `
          <button class="ds-chip" data-ds-name="${s}">${s}</button>
        `).join('')}
      </div>
    </div>

    <div class="ds-section">
      <div class="ds-section-label">Instruction set</div>
      <div class="ds-option-list">
        ${isas.map(i => `
          <button class="ds-option ${d.isa === i.id ? 'active' : ''}" data-ds-isa="${i.id}">
            <div class="ds-option-name">${i.name}</div>
            <div class="ds-option-desc">${i.desc}</div>
          </button>
        `).join('')}
      </div>
    </div>

    <div class="ds-section">
      <div class="ds-section-label">Target segment</div>
      <div class="ds-chips">
        ${segs.map(s => `
          <button class="ds-chip ds-chip-lg ${d.segment === s.id ? 'active' : ''}" data-ds-seg="${s.id}">
            ${s.name}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderCpuMicroarch() {
  const d = dsWizard.draft;
  const limits = getDesignLimits(d.node);
  const simdSets = getAvailableSIMD(state.tahun);

  return `
    <div class="ds-section">
      <div class="ds-die-preview">
        ${renderDieSVG()}
        <div class="ds-die-caption">
          ${d.cores}C · ${d.boostClock}MHz · ${d.node}
        </div>
        <div class="ds-die-hint">DIE FLOORPLAN · Live preview</div>
      </div>
    </div>

    <div class="ds-section">
      <div class="ds-slider">
        <div class="ds-slider-head">
          <span class="ds-slider-label">Cores</span>
          <span class="ds-slider-value">${d.cores}</span>
        </div>
        <input type="range" id="ds-cores" min="1" max="${limits.maxCores}" step="1" value="${d.cores}">
      </div>

      <div class="ds-slider">
        <div class="ds-slider-head">
          <span class="ds-slider-label">Boost Clock</span>
          <span class="ds-slider-value">${d.boostClock} MHz</span>
        </div>
        <input type="range" id="ds-clock" min="50" max="${Math.round(limits.maxClock * 1.1)}" step="50" value="${d.boostClock}">
      </div>

      <div class="ds-slider">
        <div class="ds-slider-head">
          <span class="ds-slider-label">L2 Cache</span>
          <span class="ds-slider-value">${d.cacheL2} KB</span>
        </div>
        <input type="range" id="ds-l2" min="64" max="${limits.maxCacheL2}" step="64" value="${d.cacheL2}">
      </div>

      <div class="ds-slider">
        <div class="ds-slider-head">
          <span class="ds-slider-label">L3 Cache</span>
          <span class="ds-slider-value">${d.cacheL3} KB</span>
        </div>
        <input type="range" id="ds-l3" min="0" max="${limits.maxCacheL3}" step="256" value="${d.cacheL3}">
      </div>
    </div>

    <div class="ds-section">
      <div class="ds-section-label">SIMD extensions</div>
      <div class="ds-chips">
        ${simdSets.length === 0
          ? '<span class="muted" style="font-size:12px">No SIMD sets available this year.</span>'
          : simdSets.map(s => `
            <button class="ds-chip ${(d.simd || []).includes(s.id) ? 'active' : ''}" data-ds-simd="${s.id}">
              ${s.name}
            </button>
          `).join('')}
      </div>
    </div>
  `;
}

function renderCpuFloorplan() {
  const d = dsWizard.draft;
  const chipData = finalizeChip({ ...d, category: 'cpu' }, state.tahun, {}) || {};
  const minCost = chipData.minDesignCost || 100;
  if (!d.budget || d.budget < minCost) d.budget = minCost;

  return `
    <div class="ds-section">
      <div class="ds-die-preview ds-die-large">
        ${renderDieSVG(true)}
        <div class="ds-die-caption">
          ${d.cores}C · ${d.boostClock}MHz · ${d.node}
        </div>
        <div class="ds-die-hint">FINAL DIE FLOORPLAN</div>
      </div>
    </div>

    <div class="ds-section">
      <div class="ds-summary-grid">
        <div class="ds-summary-cell">
          <div class="ds-sum-label">Architecture</div>
          <div class="ds-sum-value">${d.isa.toUpperCase()} · ${d.cores} core</div>
        </div>
        <div class="ds-summary-cell">
          <div class="ds-sum-label">Performance</div>
          <div class="ds-sum-value">${chipData.perfScore || 0} pts</div>
        </div>
        <div class="ds-summary-cell">
          <div class="ds-sum-label">TDP</div>
          <div class="ds-sum-value">${chipData.tdp || 0}W</div>
        </div>
        <div class="ds-summary-cell">
          <div class="ds-sum-label">Yield estimate</div>
          <div class="ds-sum-value">${Math.round((chipData.yieldRate || 0.5) * 100)}%</div>
        </div>
      </div>
    </div>

    <div class="ds-section">
      <div class="ds-slider">
        <div class="ds-slider-head">
          <span class="ds-slider-label">R&D Budget</span>
          <span class="ds-slider-value">${formatMoney(d.budget)}</span>
        </div>
        <input type="range" id="ds-budget" min="${minCost}" max="${Math.round(minCost * 3)}" step="${Math.max(10, Math.round(minCost / 40))}" value="${d.budget}">
        <div class="ds-slider-help">Minimum ${formatMoney(minCost)} · recommended ${formatMoney(Math.round(minCost * 1.8))}</div>
      </div>

      <div class="ds-slider">
        <div class="ds-slider-head">
          <span class="ds-slider-label">Unit Price</span>
          <span class="ds-slider-value">$${d.price}</span>
        </div>
        <input type="range" id="ds-price" min="5" max="500" step="5" value="${d.price}">
        <div class="ds-slider-help">Unit cost ${formatMoney(chipData.unitCost || 0)} · margin ${formatMoney(d.price - (chipData.unitCost || 0))}</div>
      </div>
    </div>
  `;
}

// ===== Die SVG visualization =====
function renderDieSVG(large = false) {
  const d = dsWizard.draft;
  const cores = Math.max(1, d.cores || 1);
  const cols = Math.min(cores, Math.ceil(Math.sqrt(cores)) || 1);
  const rows = Math.ceil(cores / cols);

  const W = large ? 320 : 260;
  const H = large ? 320 : 260;
  const pad = 16;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;

  const coreGap = 4;
  const coreW = (innerW - coreGap * (cols - 1)) / cols;
  const coreH = (innerH - coreGap * (rows - 1)) / rows;

  let cores_html = '';
  for (let i = 0; i < cores; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = pad + c * (coreW + coreGap);
    const y = pad + r * (coreH + coreGap);
    cores_html += `<rect x="${x}" y="${y}" width="${coreW}" height="${coreH}" rx="3" fill="rgba(201,84,42,0.12)" stroke="rgba(201,84,42,0.5)" stroke-width="0.8"/>`;
    cores_html += `<text x="${x + coreW/2}" y="${y + coreH/2 + 3}" text-anchor="middle" font-size="7" fill="rgba(201,84,42,0.7)" font-family="monospace">C${i}</text>`;
  }

  // Ball grid array pins
  let pins = '';
  const pinCount = 12;
  for (let i = 0; i < pinCount; i++) {
    const p = (i / (pinCount - 1)) * W;
    pins += `<circle cx="${p}" cy="4" r="1.5" fill="rgba(120,109,91,0.5)"/>`;
    pins += `<circle cx="${p}" cy="${H-4}" r="1.5" fill="rgba(120,109,91,0.5)"/>`;
    pins += `<circle cx="4" cy="${p}" r="1.5" fill="rgba(120,109,91,0.5)"/>`;
    pins += `<circle cx="${W-4}" cy="${p}" r="1.5" fill="rgba(120,109,91,0.5)"/>`;
  }

  return `
    <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block;margin:0 auto">
      <rect x="0" y="0" width="${W}" height="${H}" rx="10" fill="rgba(239,232,217,0.5)"/>
      <rect x="8" y="8" width="${W-16}" height="${H-16}" rx="6" fill="none" stroke="rgba(120,109,91,0.2)" stroke-width="1"/>
      <rect x="${pad - 6}" y="${pad - 6}" width="${innerW + 12}" height="${innerH + 12}" rx="6" fill="rgba(255,255,255,0.4)" stroke="rgba(201,84,42,0.3)" stroke-width="1" stroke-dasharray="3 3"/>
      ${pins}
      ${cores_html}
    </svg>
  `;
}

// ===== Bind step events =====
function bindDesignerStep() {
  const d = dsWizard?.draft;
  if (!d) return;

  const $ = id => document.getElementById(id);

  $('ds-name')?.addEventListener('input', e => { d.name = e.target.value; });
  document.querySelectorAll('[data-ds-name]').forEach(b => {
    b.addEventListener('click', () => {
      d.name = b.dataset.dsName;
      $('ds-name').value = d.name;
    });
  });

  document.querySelectorAll('[data-ds-isa]').forEach(b => {
    b.addEventListener('click', () => { d.isa = b.dataset.dsIsa; renderDesignerShell(); });
  });
  document.querySelectorAll('[data-ds-seg]').forEach(b => {
    b.addEventListener('click', () => { d.segment = b.dataset.dsSeg; renderDesignerShell(); });
  });
  document.querySelectorAll('[data-ds-simd]').forEach(b => {
    b.addEventListener('click', () => {
      const id = b.dataset.dsSimd;
      const arr = d.simd || (d.simd = []);
      const i = arr.indexOf(id);
      if (i >= 0) arr.splice(i, 1); else arr.push(id);
      renderDesignerShell();
    });
  });

  // Sliders — live update
  const bindLive = (id, key, fmt) => {
    $(id)?.addEventListener('input', e => {
      d[key] = parseInt(e.target.value);
      const valEl = e.target.previousElementSibling.querySelector('.ds-slider-value');
      if (valEl) valEl.textContent = fmt ? fmt(d[key]) : d[key];
      updateStatbar();
    });
  };
  bindLive('ds-cores', 'cores');
  bindLive('ds-clock', 'boostClock', v => v + ' MHz');
  bindLive('ds-l2', 'cacheL2', v => v + ' KB');
  bindLive('ds-l3', 'cacheL3', v => v + ' KB');
  bindLive('ds-budget', 'budget', v => formatMoney(v));
  bindLive('ds-price', 'price', v => '$' + v);
}

function updateStatbar() {
  if (!dsWizard) return;
  const stats = computeChipStats(dsWizard.draft);
  const cells = document.querySelectorAll('.ds-statbar-cell .ds-sb-value');
  if (cells.length === 4) {
    cells[0].textContent = stats.st;
    cells[1].textContent = stats.mt;
    cells[2].textContent = stats.tdp + 'W';
    cells[3].textContent = '$' + stats.cost;
  }
}

// ===== Placeholder stubs (Batch 2) =====
function renderGpuStep(step) { return '<div class="ds-empty">GPU Designer coming soon.</div>'; }
function renderLaptopStep(step) { return '<div class="ds-empty">Laptop Designer coming soon.</div>'; }
function renderOsStep(step) { return '<div class="ds-empty">OS Designer coming soon.</div>'; }
function renderPhoneStep(step) { return '<div class="ds-empty">Phone Designer coming soon.</div>'; }

// ===== Icon helper =====
function svgIconFor(name, color) {
  const map = {
    cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></svg>',
    gpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>',
    laptop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="16" height="11" rx="1"/><path d="M2 19h20"/></svg>',
    os: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 20h8M12 18v2"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>',
  };
  return (map[name] || map.cpu).replace('<svg ', `<svg style="color:${color}" `);
}
