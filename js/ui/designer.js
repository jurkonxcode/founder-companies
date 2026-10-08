// js/ui/designer.js
// Designer wizard engine — 5 categories. Self-binds Create button.

let dsWizard = null;

// =========================================================
// ENTRY — category chooser
// =========================================================
function openDesignerCategoryChooser() {
  console.log('[Designer] openDesignerCategoryChooser called');

  if (!state) { console.warn('[Designer] no state'); return; }
  if (state.team.length === 0) {
    toast('Recruit an engineer before starting R&D.', 'bad', 'No engineers');
    renderPanel('team');
    return;
  }
  if (typeof DESIGNER_CONFIG === 'undefined') {
    alert('DESIGNER_CONFIG not loaded. Check js/data/designer-config.js');
    return;
  }

  const wrap = document.getElementById('modal-wrap');
  if (!wrap) { console.warn('[Designer] #modal-wrap not found'); return; }

  const groups = [
    {
      title: 'Silicon',
      items: [
        { id: 'cpu', label: 'CPU', icon: 'cpu', color: '#c9542a' },
        { id: 'gpu', label: 'GPU', icon: 'gpu', color: '#7a5ba8' },
      ],
    },
    {
      title: 'Systems',
      items: [
        { id: 'laptop',     label: 'Laptop',     icon: 'laptop', color: '#b8852b' },
        { id: 'os',         label: 'OS',         icon: 'os',     color: '#3d8b5f' },
        { id: 'smartphone', label: 'Smartphone', icon: 'phone',  color: '#c47a2e' },
      ],
    },
  ];

  wrap.innerHTML = `
    <div class="modal ds-modal ds-modal-tiles">
      <div class="modal-head">
        <h3>Create</h3>
        <button class="btn sm" data-ds-close aria-label="Close">✕</button>
      </div>
      <div class="modal-body">
        <p class="ds-modal-subtitle">Choose a product to design.</p>

        ${groups.map(g => `
          <div class="ds-tile-section">
            <div class="ds-tile-section-title">${g.title}</div>
            <div class="ds-tile-row">
              ${g.items.map(it => `
                <button class="ds-tile" data-ds-cat="${it.id}" style="--tile-color:${it.color}">
                  <div class="ds-tile-icon">${svgIconFor(it.icon, it.color)}</div>
                  <div class="ds-tile-label">${it.label}</div>
                </button>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  wrap.classList.add('active');

  wrap.querySelector('[data-ds-close]')?.addEventListener('click', closeDesigner);
  wrap.querySelectorAll('[data-ds-cat]').forEach(tile => {
    tile.addEventListener('click', () => {
      console.log('[Designer] category tapped:', tile.dataset.dsCat);
      startDesignerWizard(tile.dataset.dsCat);
    });
  });
}

// =========================================================
// WIZARD
// =========================================================
function startDesignerWizard(catId) {
  const config = DESIGNER_CONFIG[catId];
  if (!config) { alert('Unknown category: ' + catId); return; }

  dsWizard = {
    cat: catId,
    step: 0,
    draft: buildEmptyDraft(catId),
    config,
  };
  renderDesignerShell();
}

function buildEmptyDraft(catId) {
  return {
    name: '',
    segment: null,
    node: state.currentNode,
    price: 100,
    budget: 100,
    isa: 'x86',
    cores: 1,
    baseClock: 200,
    boostClock: 250,
    cacheL1: 16,
    cacheL2: 256,
    cacheL3: 0,
    simd: [],
    shaderUnits: 4,
    rops: 4,
    memoryType: 'sdram',
    memoryGB: 4,
    chassis: 'mainstream',
    screenSize: 14,
    batteryWh: 40,
    useOwnCpu: true,
    kernel: 'unix',
    features: ['gui', 'network'],
    body: 'glass',
    phoneScreen: 5.5,
    phoneBattery: 3000,
    cameraTier: 'mid',
    useOwnChip: true,
  };
}

function renderDesignerShell() {
  const wrap = document.getElementById('modal-wrap');
  if (!wrap || !dsWizard) return;

  const { config, step } = dsWizard;
  const isChip = (dsWizard.cat === 'cpu' || dsWizard.cat === 'gpu');
  const stats = isChip ? computeChipStats(dsWizard.draft) : computeProductStats(dsWizard.draft);

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

      <div class="ds-body" id="ds-body">${renderDesignerStep(step)}</div>

      ${stats ? `
        <div class="ds-statbar">
          ${config.statBar.map((label, i) => {
            const key = ['st','mt','tdp','cost','perf','weight','battery','size','compat'][i];
            const val = stats[key];
            return `
              <div class="ds-statbar-cell">
                <div class="ds-sb-label">${label}</div>
                <div class="ds-sb-value">${val != null ? val : '—'}</div>
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

  document.getElementById('ds-back')?.addEventListener('click', closeDesigner);
  document.getElementById('ds-prev')?.addEventListener('click', designerPrev);
  document.getElementById('ds-next')?.addEventListener('click', designerNext);
  document.getElementById('ds-help')?.addEventListener('click', () => alert(config.hint || 'Design step by step.'));

  bindDesignerStep();
}

function renderDesignerStep(step) {
  const c = dsWizard.cat;
  if (c === 'cpu')        return renderCpuStep(step);
  if (c === 'gpu')        return renderGpuStep(step);
  if (c === 'laptop')     return renderLaptopStep(step);
  if (c === 'os')         return renderOsStep(step);
  if (c === 'smartphone') return renderPhoneStep(step);
  return '';
}

function designerNext() {
  const { config, step } = dsWizard;
  const v = validateStep(step);
  if (!v.ok) { toast(v.msg, 'bad'); return; }
  if (step === config.steps.length - 1) { commitWizard(); return; }
  dsWizard.step++;
  renderDesignerShell();
}

function designerPrev() {
  if (!dsWizard || dsWizard.step === 0) return;
  dsWizard.step--;
  renderDesignerShell();
}

function validateStep(step) {
  const d = dsWizard.draft;
  const stepName = dsWizard.config.steps[step];
  if (stepName === 'Concept' || stepName === 'Kernel') {
    if (!d.name.trim()) return { ok: false, msg: 'Enter a name to continue.' };
    if (!d.segment)     return { ok: false, msg: 'Pick a target segment.' };
  }
  return { ok: true };
}

function closeDesigner() {
  const wrap = document.getElementById('modal-wrap');
  if (!wrap) return;
  wrap.classList.remove('active');
  wrap.innerHTML = '';
  dsWizard = null;
}

function commitWizard() {
  const { cat, draft } = dsWizard;
  const chipData = finalizeChip({
    ...draft,
    category: cat === 'smartphone' ? 'smartphone' : cat,
    price: draft.price || 100,
  }, state.tahun, {});

  if (!chipData) { toast('Design failed.', 'bad'); return; }

  const minCost = chipData.minDesignCost || 100;
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

// =========================================================
// LIVE STATS
// =========================================================
function computeChipStats(draft) {
  const tech = getTech(draft.node) || { refPerf: 10, tdpFactor: 1, maxClock: 300, cost: 0 };
  const clockRatio = (draft.boostClock || 200) / (tech.maxClock || 300);
  let st = 0, mt = 0;

  if (dsWizard.cat === 'cpu') {
    const cores = draft.cores || 1;
    const cacheTotal = (draft.cacheL1 || 0) * cores + (draft.cacheL2 || 0) + (draft.cacheL3 || 0);
    const simdBonus = 1 + (draft.simd || []).length * 0.05;
    st = Math.round((tech.refPerf * 0.9 * clockRatio + cacheTotal / 200) * simdBonus);
    mt = Math.round(st * Math.pow(cores, 0.85));
  } else {
    const shaders = draft.shaderUnits || 4;
    const rops = draft.rops || 4;
    st = Math.round((tech.refPerf * 0.6 + shaders * 4 + rops * 2) * clockRatio);
    mt = st;
  }

  const tdp = Math.max(3, Math.round(
    (dsWizard.cat === 'cpu'
      ? (draft.cores || 1) * 12 + (draft.boostClock || 200) / 100 * 3
      : (draft.shaderUnits || 4) * 6 + (draft.boostClock || 200) / 100 * 2
    ) * tech.tdpFactor
  ));

  const cost = Math.round(tech.cost * 0.05 + 100 + (draft.cores || 1) * 30 + ((draft.shaderUnits || 0) * 15));
  return { st, mt, tdp, cost };
}

function computeProductStats(draft) {
  const cat = dsWizard.cat;
  const tech = getTech(draft.node) || { refPerf: 10 };
  if (cat === 'laptop') {
    const chassis = LAPTOP_CONFIG.chassis.find(c => c.id === draft.chassis) || LAPTOP_CONFIG.chassis[0];
    return {
      perf: Math.round(tech.refPerf * 0.8 + 50),
      weight: chassis.weight.toFixed(1) + 'kg',
      battery: draft.batteryWh + 'Wh',
      cost: 200 + chassis.cost,
    };
  }
  if (cat === 'os') {
    const kern = OS_CONFIG.kernels.find(k => k.id === draft.kernel) || OS_CONFIG.kernels[0];
    return {
      perf: Math.round(tech.refPerf * kern.perfBonus),
      compat: (draft.features || []).length * 10 + '%',
      size: (draft.features || []).length * 40 + 'MB',
      cost: 100 + (draft.features || []).length * 50,
    };
  }
  if (cat === 'smartphone') {
    const body = PHONE_CONFIG.bodies.find(b => b.id === draft.body) || PHONE_CONFIG.bodies[0];
    return {
      perf: Math.round(tech.refPerf * 0.7),
      battery: draft.phoneBattery + 'mAh',
      weight: body.weight + 'g',
      cost: 80 + body.cost,
    };
  }
  return null;
}

// =========================================================
// CPU STEPS
// =========================================================
function renderCpuStep(step) {
  if (step === 0) return renderCpuConcept();
  if (step === 1) return renderCpuMicro();
  if (step === 2) return renderCpuFloor();
  return '';
}
function renderCpuConcept() {
  const d = dsWizard.draft;
  const isas = CPU_CONFIG.isas.filter(i => !i.minYear || state.tahun >= i.minYear);
  const segs = CPU_CONFIG.segments.filter(s => !s.minYear || state.tahun >= s.minYear);
  return `
    ${renderNameInput()}
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
        ${segs.map(s => `<button class="ds-chip ds-chip-lg ${d.segment === s.id ? 'active' : ''}" data-ds-seg="${s.id}">${s.name}</button>`).join('')}
      </div>
    </div>
  `;
}
function renderCpuMicro() {
  const d = dsWizard.draft;
  const limits = getDesignLimits(d.node);
  const simdSets = getAvailableSIMD(state.tahun);
  return `
    <div class="ds-section">
      <div class="ds-die-preview">${renderDieSVG()}<div class="ds-die-caption">${d.cores}C · ${d.boostClock}MHz · ${d.node}</div><div class="ds-die-hint">DIE · Live preview</div></div>
    </div>
    ${renderSlider('Cores', 'ds-cores', d.cores, 1, limits.maxCores, 1, v => v)}
    ${renderSlider('Boost Clock', 'ds-clock', d.boostClock, 50, Math.round(limits.maxClock * 1.1), 50, v => v + ' MHz')}
    ${renderSlider('L2 Cache', 'ds-l2', d.cacheL2, 64, limits.maxCacheL2, 64, v => v + ' KB')}
    ${renderSlider('L3 Cache', 'ds-l3', d.cacheL3, 0, limits.maxCacheL3, 256, v => v + ' KB')}
    <div class="ds-section">
      <div class="ds-section-label">SIMD extensions</div>
      <div class="ds-chips">
        ${simdSets.length === 0 ? '<span class="muted" style="font-size:12px">No SIMD sets available.</span>'
          : simdSets.map(s => `<button class="ds-chip ${(d.simd || []).includes(s.id) ? 'active' : ''}" data-ds-simd="${s.id}">${s.name}</button>`).join('')}
      </div>
    </div>
  `;
}
function renderCpuFloor() {
  const d = dsWizard.draft;
  const chipData = finalizeChip({ ...d, category: 'cpu' }, state.tahun, {}) || {};
  const minCost = chipData.minDesignCost || 100;
  if (!d.budget || d.budget < minCost) d.budget = minCost;
  if (!d.price) d.price = Math.round((chipData.unitCost || 10) * 2);
  return `
    <div class="ds-section"><div class="ds-die-preview ds-die-large">${renderDieSVG(true)}<div class="ds-die-caption">${d.cores}C · ${d.boostClock}MHz · ${d.node}</div><div class="ds-die-hint">FINAL DIE</div></div></div>
    ${renderSummaryGrid([
      ['Architecture', d.isa.toUpperCase() + ' · ' + d.cores + ' core'],
      ['Performance', (chipData.perfScore || 0) + ' pts'],
      ['TDP', (chipData.tdp || 0) + 'W'],
      ['Yield', Math.round((chipData.yieldRate || 0.5) * 100) + '%'],
    ])}
    ${renderSlider('R&D Budget', 'ds-budget', d.budget, minCost, Math.round(minCost * 3), Math.max(10, Math.round(minCost / 40)), v => formatMoney(v))}
    ${renderSlider('Unit Price', 'ds-price', d.price, 5, 500, 5, v => '$' + v)}
  `;
}

// =========================================================
// GPU STEPS
// =========================================================
function renderGpuStep(step) {
  if (step === 0) return renderGpuConcept();
  if (step === 1) return renderGpuShaders();
  if (step === 2) return renderGpuMemory();
  if (step === 3) return renderGpuFloor();
  return '';
}
function renderGpuConcept() {
  const d = dsWizard.draft;
  const segs = GPU_CONFIG.segments.filter(s => !s.minYear || state.tahun >= s.minYear);
  return `
    ${renderNameInput()}
    <div class="ds-section">
      <div class="ds-section-label">Target segment</div>
      <div class="ds-chips">
        ${segs.map(s => `<button class="ds-chip ds-chip-lg ${d.segment === s.id ? 'active' : ''}" data-ds-seg="${s.id}">${s.name}</button>`).join('')}
      </div>
    </div>
    <div class="ds-section">
      <div class="ds-section-label">About</div>
      <p class="muted" style="font-size:12.5px;line-height:1.5">GPUs render graphics and accelerate compute. Ship a strong one before AI arrives in 2017.</p>
    </div>
  `;
}
function renderGpuShaders() {
  const d = dsWizard.draft;
  const tech = getTech(d.node) || { maxClock: 300 };
  return `
    <div class="ds-section"><div class="ds-die-preview">${renderGpuDieSVG()}<div class="ds-die-caption">${d.shaderUnits} SH · ${d.rops} ROP · ${d.boostClock}MHz</div><div class="ds-die-hint">GPU DIE · Live</div></div></div>
    ${renderSlider('Shader Units', 'ds-shaders', d.shaderUnits, 2, 64, 1, v => v)}
    ${renderSlider('ROP Units', 'ds-rops', d.rops, 2, 32, 1, v => v)}
    ${renderSlider('Boost Clock', 'ds-clock', d.boostClock, 50, Math.round(tech.maxClock || 300), 50, v => v + ' MHz')}
  `;
}
function renderGpuMemory() {
  const d = dsWizard.draft;
  const mems = GPU_CONFIG.memoryTypes.filter(m => !m.minYear || state.tahun >= m.minYear);
  return `
    <div class="ds-section">
      <div class="ds-section-label">Memory type</div>
      <div class="ds-option-list">
        ${mems.map(m => `
          <button class="ds-option ${d.memoryType === m.id ? 'active' : ''}" data-ds-mem="${m.id}">
            <div class="ds-option-name">${m.name}</div>
            <div class="ds-option-desc">Bandwidth ×${m.bwMult} · Cost ×${m.costMult}</div>
          </button>
        `).join('')}
      </div>
    </div>
    ${renderSlider('VRAM', 'ds-vram', d.memoryGB, 1, 64, 1, v => v + ' GB')}
  `;
}
function renderGpuFloor() {
  const d = dsWizard.draft;
  const chipData = finalizeChip({ ...d, category: 'gpu' }, state.tahun, {}) || {};
  const minCost = chipData.minDesignCost || 100;
  if (!d.budget || d.budget < minCost) d.budget = minCost;
  if (!d.price) d.price = Math.round((chipData.unitCost || 10) * 2);
  return `
    <div class="ds-section"><div class="ds-die-preview ds-die-large">${renderGpuDieSVG(true)}<div class="ds-die-caption">${d.shaderUnits} SH · ${d.memoryGB}GB ${d.memoryType.toUpperCase()} · ${d.node}</div><div class="ds-die-hint">FINAL GPU</div></div></div>
    ${renderSummaryGrid([
      ['Shaders', d.shaderUnits + ' units'],
      ['Memory', d.memoryGB + 'GB ' + d.memoryType.toUpperCase()],
      ['TDP', (chipData.tdp || 0) + 'W'],
      ['Yield', Math.round((chipData.yieldRate || 0.5) * 100) + '%'],
    ])}
    ${renderSlider('R&D Budget', 'ds-budget', d.budget, minCost, Math.round(minCost * 3), Math.max(10, Math.round(minCost / 40)), v => formatMoney(v))}
    ${renderSlider('Unit Price', 'ds-price', d.price, 5, 2000, 5, v => '$' + v)}
  `;
}

// =========================================================
// LAPTOP STEPS
// =========================================================
function renderLaptopStep(step) {
  if (step === 0) return renderLaptopConcept();
  if (step === 1) return renderLaptopPlatform();
  if (step === 2) return renderLaptopChassis();
  if (step === 3) return renderLaptopRelease();
  return '';
}
function renderLaptopConcept() {
  const d = dsWizard.draft;
  const segs = LAPTOP_CONFIG.segments.filter(s => !s.minYear || state.tahun >= s.minYear);
  return `
    ${renderNameInput()}
    <div class="ds-section">
      <div class="ds-section-label">Target segment</div>
      <div class="ds-chips">
        ${segs.map(s => `<button class="ds-chip ds-chip-lg ${d.segment === s.id ? 'active' : ''}" data-ds-seg="${s.id}">${s.name}</button>`).join('')}
      </div>
    </div>
    <div class="ds-section"><div class="ds-preview-laptop">${renderLaptopSVG('mainstream', 14)}</div></div>
  `;
}
function renderLaptopPlatform() {
  const d = dsWizard.draft;
  return `
    <div class="ds-section"><div class="ds-die-preview ds-die-large">${renderLaptopSVG(d.chassis, d.screenSize)}<div class="ds-die-caption">${d.screenSize}" · ${d.chassis.toUpperCase()}</div></div></div>
    <div class="ds-section">
      <div class="ds-section-label">Silicon</div>
      <div class="ds-option-list">
        <button class="ds-option ${d.useOwnCpu ? 'active' : ''}" data-ds-owncpu="1">
          <div class="ds-option-name">Use in-house CPU</div>
          <div class="ds-option-desc">Integrate your latest CPU design.</div>
        </button>
        <button class="ds-option ${!d.useOwnCpu ? 'active' : ''}" data-ds-owncpu="0">
          <div class="ds-option-name">Third-party CPU</div>
          <div class="ds-option-desc">Off-the-shelf silicon. Slightly cheaper.</div>
        </button>
      </div>
    </div>
    ${renderSlider('Screen Size', 'ds-screen', d.screenSize, 11, 18, 1, v => v + '"')}
    ${renderSlider('Battery', 'ds-battery', d.batteryWh, 30, 120, 5, v => v + ' Wh')}
  `;
}
function renderLaptopChassis() {
  const d = dsWizard.draft;
  return `
    <div class="ds-section">
      <div class="ds-section-label">Chassis</div>
      <div class="ds-option-list">
        ${LAPTOP_CONFIG.chassis.map(c => `
          <button class="ds-option ${d.chassis === c.id ? 'active' : ''}" data-ds-chassis="${c.id}">
            <div class="ds-option-name">${c.name}</div>
            <div class="ds-option-desc">Weight ${c.weight}kg · +$${c.cost} · ${c.desc}</div>
          </button>
        `).join('')}
      </div>
    </div>
    <div class="ds-section"><div class="ds-die-preview">${renderLaptopSVG(d.chassis, d.screenSize)}<div class="ds-die-caption">Chassis preview</div></div></div>
  `;
}
function renderLaptopRelease() {
  const d = dsWizard.draft;
  if (!d.price) d.price = 800;
  return `
    <div class="ds-section"><div class="ds-die-preview ds-die-large">${renderLaptopSVG(d.chassis, d.screenSize)}<div class="ds-die-caption">${d.name || 'Untitled'} · ${d.screenSize}"</div></div></div>
    ${renderSummaryGrid([
      ['Chassis', d.chassis],
      ['Screen', d.screenSize + '"'],
      ['Battery', d.batteryWh + ' Wh'],
      ['CPU', d.useOwnCpu ? 'In-house' : 'Third-party'],
    ])}
    ${renderSlider('Retail Price', 'ds-price', d.price, 200, 5000, 50, v => '$' + v)}
  `;
}

// =========================================================
// OS STEPS
// =========================================================
function renderOsStep(step) {
  if (step === 0) return renderOsKernel();
  if (step === 1) return renderOsFeatures();
  if (step === 2) return renderOsRelease();
  return '';
}
function renderOsKernel() {
  const d = dsWizard.draft;
  const segs = OS_CONFIG.segments.filter(s => !s.minYear || state.tahun >= s.minYear);
  return `
    ${renderNameInput()}
    <div class="ds-section">
      <div class="ds-section-label">Kernel type</div>
      <div class="ds-option-list">
        ${OS_CONFIG.kernels.map(k => `
          <button class="ds-option ${d.kernel === k.id ? 'active' : ''}" data-ds-kernel="${k.id}">
            <div class="ds-option-name">${k.name}</div>
            <div class="ds-option-desc">${k.desc}</div>
          </button>
        `).join('')}
      </div>
    </div>
    <div class="ds-section">
      <div class="ds-section-label">Target segment</div>
      <div class="ds-chips">
        ${segs.map(s => `<button class="ds-chip ds-chip-lg ${d.segment === s.id ? 'active' : ''}" data-ds-seg="${s.id}">${s.name}</button>`).join('')}
      </div>
    </div>
  `;
}
function renderOsFeatures() {
  const d = dsWizard.draft;
  const feats = OS_CONFIG.featurePacks.filter(f => !f.year || state.tahun >= f.year);
  return `
    <div class="ds-section">
      <div class="ds-section-label">Feature packs</div>
      <div class="ds-chips">
        ${feats.map(f => `<button class="ds-chip ${(d.features || []).includes(f.id) ? 'active' : ''}" data-ds-feat="${f.id}">${f.name} · $${f.cost}</button>`).join('')}
      </div>
      <p class="muted" style="font-size:11px;margin-top:10px">Each feature expands compatibility and raises unit cost.</p>
    </div>
  `;
}
function renderOsRelease() {
  const d = dsWizard.draft;
  if (!d.price) d.price = 90;
  return `
    ${renderSummaryGrid([
      ['Kernel', d.kernel],
      ['Features', (d.features || []).length + ' packs'],
      ['Segment', d.segment || '—'],
      ['Type', 'Software'],
    ])}
    ${renderSlider('License Price', 'ds-price', d.price, 20, 400, 5, v => '$' + v)}
  `;
}

// =========================================================
// PHONE STEPS
// =========================================================
function renderPhoneStep(step) {
  if (step === 0) return renderPhoneConcept();
  if (step === 1) return renderPhonePlatform();
  if (step === 2) return renderPhoneBody();
  if (step === 3) return renderPhoneRelease();
  return '';
}
function renderPhoneConcept() {
  const d = dsWizard.draft;
  const segs = PHONE_CONFIG.segments.filter(s => !s.minYear || state.tahun >= s.minYear);
  return `
    ${renderNameInput()}
    <div class="ds-section">
      <div class="ds-section-label">Target segment</div>
      <div class="ds-chips">
        ${segs.map(s => `<button class="ds-chip ds-chip-lg ${d.segment === s.id ? 'active' : ''}" data-ds-seg="${s.id}">${s.name}</button>`).join('')}
      </div>
    </div>
    <div class="ds-section"><div class="ds-preview-phone">${renderPhoneSVG('glass', 5.5)}</div></div>
  `;
}
function renderPhonePlatform() {
  const d = dsWizard.draft;
  return `
    <div class="ds-section"><div class="ds-die-preview ds-die-large">${renderPhoneSVG(d.body, d.phoneScreen)}<div class="ds-die-caption">${d.phoneScreen}" · ${d.body.toUpperCase()}</div></div></div>
    <div class="ds-section">
      <div class="ds-section-label">Silicon</div>
      <div class="ds-option-list">
        <button class="ds-option ${d.useOwnChip ? 'active' : ''}" data-ds-ownchip="1">
          <div class="ds-option-name">Use in-house chip</div>
          <div class="ds-option-desc">Vertical integration. Better efficiency.</div>
        </button>
        <button class="ds-option ${!d.useOwnChip ? 'active' : ''}" data-ds-ownchip="0">
          <div class="ds-option-name">Third-party chip</div>
          <div class="ds-option-desc">Cheaper, but lower margin.</div>
        </button>
      </div>
    </div>
    ${renderSlider('Screen Size', 'ds-pscreen', d.phoneScreen, 3, 7, 0.1, v => v.toFixed(1) + '"')}
    ${renderSlider('Battery', 'ds-pbattery', d.phoneBattery, 800, 6000, 100, v => v + ' mAh')}
  `;
}
function renderPhoneBody() {
  const d = dsWizard.draft;
  const cams = PHONE_CONFIG.cameraTiers.filter(c => !c.year || state.tahun >= c.year);
  return `
    <div class="ds-section">
      <div class="ds-section-label">Body material</div>
      <div class="ds-option-list">
        ${PHONE_CONFIG.bodies.map(b => `
          <button class="ds-option ${d.body === b.id ? 'active' : ''}" data-ds-body="${b.id}">
            <div class="ds-option-name">${b.name}</div>
            <div class="ds-option-desc">Weight ${b.weight}g · +$${b.cost} · ${b.desc}</div>
          </button>
        `).join('')}
      </div>
    </div>
    <div class="ds-section">
      <div class="ds-section-label">Camera</div>
      <div class="ds-chips">
        ${cams.map(c => `<button class="ds-chip ${d.cameraTier === c.id ? 'active' : ''}" data-ds-cam="${c.id}">${c.name} · $${c.cost}</button>`).join('')}
      </div>
    </div>
    <div class="ds-section"><div class="ds-die-preview">${renderPhoneSVG(d.body, d.phoneScreen)}<div class="ds-die-caption">Body preview</div></div></div>
  `;
}
function renderPhoneRelease() {
  const d = dsWizard.draft;
  if (!d.price) d.price = 400;
  return `
    <div class="ds-section"><div class="ds-die-preview ds-die-large">${renderPhoneSVG(d.body, d.phoneScreen)}<div class="ds-die-caption">${d.name || 'Untitled'} · ${d.phoneScreen}"</div></div></div>
    ${renderSummaryGrid([
      ['Body', d.body],
      ['Screen', d.phoneScreen.toFixed(1) + '"'],
      ['Battery', d.phoneBattery + ' mAh'],
      ['Camera', d.cameraTier],
    ])}
    ${renderSlider('Retail Price', 'ds-price', d.price, 100, 2000, 10, v => '$' + v)}
  `;
}

// =========================================================
// SHARED WIDGETS
// =========================================================
function renderNameInput() {
  const d = dsWizard.draft;
  const cfg = dsWizard.config;
  return `
    <div class="ds-section">
      <div class="ds-section-label">Series name</div>
      <input type="text" id="ds-name" class="ds-input-lg" placeholder="${escapeHtml(cfg.namePlaceholder)}" value="${escapeHtml(d.name)}" maxlength="24">
      <div class="ds-chips">
        ${cfg.nameSuggestions.map(s => `<button class="ds-chip" data-ds-name="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}
      </div>
    </div>
  `;
}
function renderSlider(label, id, value, min, max, step, fmt) {
  return `
    <div class="ds-slider">
      <div class="ds-slider-head">
        <span class="ds-slider-label">${label}</span>
        <span class="ds-slider-value">${fmt(value)}</span>
      </div>
      <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}">
    </div>
  `;
}
function renderSummaryGrid(rows) {
  return `
    <div class="ds-section">
      <div class="ds-summary-grid">
        ${rows.map(([k, v]) => `
          <div class="ds-summary-cell">
            <div class="ds-sum-label">${escapeHtml(k)}</div>
            <div class="ds-sum-value">${escapeHtml(String(v))}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function bindDesignerStep() {
  const d = dsWizard?.draft;
  if (!d) return;
  const $ = id => document.getElementById(id);

  $('ds-name')?.addEventListener('input', e => { d.name = e.target.value; });
  document.querySelectorAll('[data-ds-name]').forEach(b => {
    b.addEventListener('click', () => { d.name = b.dataset.dsName; if ($('ds-name')) $('ds-name').value = d.name; });
  });

  document.querySelectorAll('[data-ds-isa]').forEach(b => b.addEventListener('click', () => { d.isa = b.dataset.dsIsa; renderDesignerShell(); }));
  document.querySelectorAll('[data-ds-seg]').forEach(b => b.addEventListener('click', () => { d.segment = b.dataset.dsSeg; renderDesignerShell(); }));
  document.querySelectorAll('[data-ds-simd]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.dsSimd; const arr = d.simd || (d.simd = []); const i = arr.indexOf(id);
    if (i >= 0) arr.splice(i, 1); else arr.push(id); renderDesignerShell();
  }));
  document.querySelectorAll('[data-ds-mem]').forEach(b => b.addEventListener('click', () => { d.memoryType = b.dataset.dsMem; renderDesignerShell(); }));
  document.querySelectorAll('[data-ds-chassis]').forEach(b => b.addEventListener('click', () => { d.chassis = b.dataset.dsChassis; renderDesignerShell(); }));
  document.querySelectorAll('[data-ds-kernel]').forEach(b => b.addEventListener('click', () => { d.kernel = b.dataset.dsKernel; renderDesignerShell(); }));
  document.querySelectorAll('[data-ds-feat]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.dsFeat; const arr = d.features || (d.features = []); const i = arr.indexOf(id);
    if (i >= 0) arr.splice(i, 1); else arr.push(id); renderDesignerShell();
  }));
  document.querySelectorAll('[data-ds-body]').forEach(b => b.addEventListener('click', () => { d.body = b.dataset.dsBody; renderDesignerShell(); }));
  document.querySelectorAll('[data-ds-cam]').forEach(b => b.addEventListener('click', () => { d.cameraTier = b.dataset.dsCam; renderDesignerShell(); }));
  document.querySelectorAll('[data-ds-owncpu]').forEach(b => b.addEventListener('click', () => { d.useOwnCpu = b.dataset.dsOwncpu === '1'; renderDesignerShell(); }));
  document.querySelectorAll('[data-ds-ownchip]').forEach(b => b.addEventListener('click', () => { d.useOwnChip = b.dataset.dsOwnchip === '1'; renderDesignerShell(); }));

  const live = (id, key, fmt) => {
    $(id)?.addEventListener('input', e => {
      d[key] = parseFloat(e.target.value);
      const el = e.target.previousElementSibling.querySelector('.ds-slider-value');
      if (el) el.textContent = fmt ? fmt(d[key]) : d[key];
      updateStatbarLive();
    });
  };
  live('ds-cores', 'cores', v => v);
  live('ds-clock', 'boostClock', v => v + ' MHz');
  live('ds-l2', 'cacheL2', v => v + ' KB');
  live('ds-l3', 'cacheL3', v => v + ' KB');
  live('ds-shaders', 'shaderUnits', v => v);
  live('ds-rops', 'rops', v => v);
  live('ds-vram', 'memoryGB', v => v + ' GB');
  live('ds-screen', 'screenSize', v => v + '"');
  live('ds-battery', 'batteryWh', v => v + ' Wh');
  live('ds-pscreen', 'phoneScreen', v => v.toFixed(1) + '"');
  live('ds-pbattery', 'phoneBattery', v => v + ' mAh');
  live('ds-budget', 'budget', v => formatMoney(v));
  live('ds-price', 'price', v => '$' + v);
}

function updateStatbarLive() {
  if (!dsWizard) return;
  const isChip = (dsWizard.cat === 'cpu' || dsWizard.cat === 'gpu');
  if (!isChip) return;
  const stats = computeChipStats(dsWizard.draft);
  const cells = document.querySelectorAll('.ds-statbar-cell .ds-sb-value');
  if (cells.length >= 4) {
    cells[0].textContent = stats.st;
    cells[1].textContent = stats.mt;
    cells[2].textContent = stats.tdp + 'W';
    cells[3].textContent = '$' + stats.cost;
  }
}

// =========================================================
// SVG RENDERERS
// =========================================================
function renderDieSVG(large = false) {
  const d = dsWizard.draft;
  const cores = Math.max(1, d.cores || 1);
  const cols = Math.min(cores, Math.ceil(Math.sqrt(cores)) || 1);
  const rows = Math.ceil(cores / cols);
  const W = large ? 320 : 260, H = large ? 320 : 260, pad = 16;
  const innerW = W - pad * 2, innerH = H - pad * 2;
  const gap = 4;
  const cW = (innerW - gap * (cols - 1)) / cols;
  const cH = (innerH - gap * (rows - 1)) / rows;

  let coresHtml = '';
  for (let i = 0; i < cores; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    const x = pad + c * (cW + gap), y = pad + r * (cH + gap);
    coresHtml += `<rect x="${x}" y="${y}" width="${cW}" height="${cH}" rx="3" fill="rgba(201,84,42,0.12)" stroke="rgba(201,84,42,0.5)" stroke-width="0.8"/>`;
    if (cores <= 16) coresHtml += `<text x="${x + cW/2}" y="${y + cH/2 + 3}" text-anchor="middle" font-size="7" fill="rgba(201,84,42,0.7)" font-family="monospace">C${i}</text>`;
  }

  let pins = '';
  for (let i = 0; i < 12; i++) {
    const p = (i / 11) * W;
    pins += `<circle cx="${p}" cy="4" r="1.5" fill="rgba(120,109,91,0.5)"/>`;
    pins += `<circle cx="${p}" cy="${H-4}" r="1.5" fill="rgba(120,109,91,0.5)"/>`;
    pins += `<circle cx="4" cy="${p}" r="1.5" fill="rgba(120,109,91,0.5)"/>`;
    pins += `<circle cx="${W-4}" cy="${p}" r="1.5" fill="rgba(120,109,91,0.5)"/>`;
  }

  return `
    <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block;margin:0 auto">
      <rect x="0" y="0" width="${W}" height="${H}" rx="10" fill="rgba(239,232,217,0.5)"/>
      <rect x="8" y="8" width="${W-16}" height="${H-16}" rx="6" fill="none" stroke="rgba(120,109,91,0.2)" stroke-width="1"/>
      <rect x="${pad-6}" y="${pad-6}" width="${innerW+12}" height="${innerH+12}" rx="6" fill="rgba(255,255,255,0.4)" stroke="rgba(201,84,42,0.3)" stroke-width="1" stroke-dasharray="3 3"/>
      ${pins}${coresHtml}
    </svg>
  `;
}

function renderGpuDieSVG(large = false) {
  const d = dsWizard.draft;
  const W = large ? 320 : 260, H = large ? 320 : 260, pad = 16;
  const shaders = Math.max(2, d.shaderUnits || 4);
  const rows = Math.min(6, Math.ceil(Math.sqrt(shaders)));
  const cols = Math.ceil(shaders / rows);
  const innerW = W - pad * 2, innerH = H - pad * 2 - 30;
  const gap = 3;
  const cW = (innerW - gap * (cols - 1)) / cols;
  const cH = (innerH - gap * (rows - 1)) / rows;

  let shHtml = '';
  for (let i = 0; i < shaders; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    const x = pad + c * (cW + gap), y = pad + r * (cH + gap);
    shHtml += `<rect x="${x}" y="${y}" width="${cW}" height="${cH}" rx="2" fill="rgba(122,91,168,0.14)" stroke="rgba(122,91,168,0.5)" stroke-width="0.8"/>`;
  }

  return `
    <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block;margin:0 auto">
      <rect x="0" y="0" width="${W}" height="${H}" rx="10" fill="rgba(239,232,217,0.5)"/>
      <rect x="8" y="8" width="${W-16}" height="${H-16}" rx="6" fill="none" stroke="rgba(120,109,91,0.2)"/>
      ${shHtml}
      <rect x="${pad}" y="${H-pad-22}" width="${W-pad*2}" height="20" rx="3" fill="rgba(122,91,168,0.08)" stroke="rgba(122,91,168,0.4)" stroke-width="0.8"/>
      <text x="${W/2}" y="${H-pad-9}" text-anchor="middle" font-size="8" fill="rgba(122,91,168,0.75)" font-family="monospace">VRAM · ${d.memoryGB}GB ${d.memoryType.toUpperCase()}</text>
    </svg>
  `;
}

function renderLaptopSVG(chassis, screen) {
  const w = 280, h = 200;
  const ratio = Math.max(0.7, Math.min(1.3, (screen || 14) / 14));
  const lidW = 200 * ratio, lidH = 120 * ratio;
  const x = (w - lidW) / 2, y = 20;
  const bezel = 6;
  const screenW = lidW - bezel * 2, screenH = lidH - bezel * 2 - 12;
  const colors = {
    budget:     { outer: 'rgba(180,160,130,0.5)', fill: 'rgba(220,210,190,0.6)' },
    mainstream: { outer: 'rgba(150,140,120,0.6)', fill: 'rgba(200,195,185,0.7)' },
    premium:    { outer: 'rgba(120,110,95,0.7)',  fill: 'rgba(180,175,165,0.8)' },
  };
  const c = colors[chassis] || colors.mainstream;
  return `
    <svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px;display:block;margin:0 auto">
      <rect x="${x}" y="${y}" width="${lidW}" height="${lidH}" rx="8" fill="${c.outer}"/>
      <rect x="${x+bezel}" y="${y+bezel}" width="${screenW}" height="${screenH}" rx="3" fill="#1a1a1a"/>
      <rect x="${x+bezel+4}" y="${y+bezel+4}" width="${screenW-8}" height="${screenH-8}" rx="2" fill="rgba(201,84,42,0.2)"/>
      <rect x="${x}" y="${y+lidH-10}" width="${lidW}" height="10" rx="3" fill="${c.fill}"/>
      <path d="M ${x-14} ${y+lidH+8} L ${x+lidW+14} ${y+lidH+8} L ${x+lidW+22} ${y+lidH+30} L ${x-22} ${y+lidH+30} Z" fill="${c.outer}"/>
      <rect x="${w/2-18}" y="${y+lidH+14}" width="36" height="6" rx="3" fill="rgba(255,255,255,0.3)"/>
    </svg>
  `;
}

function renderPhoneSVG(body, screen) {
  const w = 180, h = 300;
  const ratio = Math.max(0.7, Math.min(1.2, (screen || 5.5) / 5.5));
  const phoneW = 110 * ratio, phoneH = 220 * ratio;
  const x = (w - phoneW) / 2, y = (h - phoneH) / 2;
  const bezel = 5;
  const colors = {
    plastic: 'rgba(200,190,170,0.7)',
    glass:   'rgba(80,80,90,0.7)',
    ceramic: 'rgba(230,225,215,0.9)',
  };
  const c = colors[body] || colors.glass;
  return `
    <svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px;display:block;margin:0 auto">
      <rect x="${x}" y="${y}" width="${phoneW}" height="${phoneH}" rx="16" fill="${c}"/>
      <rect x="${x+bezel}" y="${y+bezel}" width="${phoneW-bezel*2}" height="${phoneH-bezel*2}" rx="12" fill="#111"/>
      <rect x="${x+bezel+3}" y="${y+bezel+10}" width="${phoneW-bezel*2-6}" height="${phoneH-bezel*2-20}" rx="9" fill="rgba(201,84,42,0.25)"/>
      <circle cx="${x+phoneW/2}" cy="${y+phoneH-bezel-8}" r="4" fill="rgba(255,255,255,0.15)"/>
      <rect x="${x+phoneW/2-8}" y="${y+bezel}" width="16" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
    </svg>
  `;
}

function svgIconFor(name, color) {
  const map = {
    cpu:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></svg>',
    gpu:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>',
    laptop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="16" height="11" rx="1"/><path d="M2 19h20"/></svg>',
    os:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 20h8M12 18v2"/></svg>',
    phone:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>',
  };
  return (map[name] || map.cpu).replace('<svg ', `<svg style="color:${color}" `);
}

// =========================================================
// SELF-BINDING — Create button
// Independent of main.js. Runs on load and after delays.
// =========================================================
function _bindCreateButton() {
  const btn = document.getElementById('nav-create');
  if (!btn) { console.warn('[Designer] #nav-create not found'); return; }
  if (btn.dataset.designerBound === '1') return;
  btn.dataset.designerBound = '1';
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[Designer] Create button clicked');
    if (typeof openDesignerCategoryChooser === 'function') {
      openDesignerCategoryChooser();
    }
  });
  console.log('[Designer] Create button bound');
}

document.addEventListener('DOMContentLoaded', _bindCreateButton);
window.addEventListener('load', _bindCreateButton);
setTimeout(_bindCreateButton, 500);
setTimeout(_bindCreateButton, 1500);
