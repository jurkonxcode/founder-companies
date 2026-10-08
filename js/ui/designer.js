// js/ui/designer.js
// Designer wizard engine — 5 categories with detailed silicon floorplans.

let dsWizard = null;

// =========================================================
// ENTRY
// =========================================================
function openDesignerCategoryChooser() {
  console.log('[Designer] opening');
  if (!state) return;
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
  if (!wrap) return;

  const groups = [
    { title: 'Silicon', items: [
      { id: 'cpu', label: 'CPU', icon: 'cpu', color: '#c9542a' },
      { id: 'gpu', label: 'GPU', icon: 'gpu', color: '#7a5ba8' },
    ]},
    { title: 'Systems', items: [
      { id: 'laptop',     label: 'Laptop',     icon: 'laptop', color: '#b8852b' },
      { id: 'os',         label: 'OS',         icon: 'os',     color: '#3d8b5f' },
      { id: 'smartphone', label: 'Smartphone', icon: 'phone',  color: '#c47a2e' },
    ]},
  ];

  wrap.innerHTML = `
    <div class="modal ds-modal ds-modal-tiles">
      <div class="modal-head">
        <h3>Create</h3>
        <button class="btn sm" data-ds-close>✕</button>
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
    tile.addEventListener('click', () => startDesignerWizard(tile.dataset.dsCat));
  });
}

// =========================================================
// WIZARD
// =========================================================
function startDesignerWizard(catId) {
  const config = DESIGNER_CONFIG[catId];
  if (!config) { alert('Unknown category: ' + catId); return; }
  dsWizard = { cat: catId, step: 0, draft: buildEmptyDraft(catId), config };
  renderDesignerShell();
}

function buildEmptyDraft(catId) {
  return {
    name: '', segment: null, node: state.currentNode, price: 100, budget: 100,
    isa: 'x86', cores: 1, baseClock: 200, boostClock: 250,
    cacheL1: 16, cacheL2: 256, cacheL3: 0, simd: [],
    shaderUnits: 4, rops: 4, memoryType: 'sdram', memoryGB: 4,
    chassis: 'mainstream', screenSize: 14, batteryWh: 40, useOwnCpu: true,
    kernel: 'unix', features: ['gui', 'network'],
    body: 'glass', phoneScreen: 5.5, phoneBattery: 3000, cameraTier: 'mid', useOwnChip: true,
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
  dsWizard.step++; renderDesignerShell();
}
function designerPrev() {
  if (!dsWizard || dsWizard.step === 0) return;
  dsWizard.step--; renderDesignerShell();
}
function validateStep(step) {
  const d = dsWizard.draft;
  const sName = dsWizard.config.steps[step];
  if (sName === 'Concept' || sName === 'Kernel') {
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
  const chipData = finalizeChip({ ...draft, category: cat === 'smartphone' ? 'smartphone' : cat, price: draft.price || 100 }, state.tahun, {});
  if (!chipData) { toast('Design failed.', 'bad'); return; }
  const minCost = chipData.minDesignCost || 100;
  const name = draft.name.trim() || `${cat.toUpperCase()}-${state.tahun}`;
  const project = createProject({ ...chipData, name }, state.tahun, state.bulan, state.team);
  state.projects.push(project);
  state.uang -= Math.round(minCost * 0.3);
  addLog(`R&D started: "${name}" (${getCategory(cat).name} ${draft.node}).`, 'good');
  toast(`"${name}" design locked in.`, 'good');
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
      : (draft.shaderUnits || 4) * 6 + (draft.boostClock || 200) / 100 * 2) * tech.tdpFactor));
  const cost = Math.round(tech.cost * 0.05 + 100 + (draft.cores || 1) * 30 + ((draft.shaderUnits || 0) * 15));
  return { st, mt, tdp, cost };
}
function computeProductStats(draft) {
  const cat = dsWizard.cat;
  const tech = getTech(draft.node) || { refPerf: 10 };
  if (cat === 'laptop') {
    const chassis = LAPTOP_CONFIG.chassis.find(c => c.id === draft.chassis) || LAPTOP_CONFIG.chassis[0];
    return { perf: Math.round(tech.refPerf * 0.8 + 50), weight: chassis.weight.toFixed(1) + 'kg', battery: draft.batteryWh + 'Wh', cost: 200 + chassis.cost };
  }
  if (cat === 'os') {
    const kern = OS_CONFIG.kernels.find(k => k.id === draft.kernel) || OS_CONFIG.kernels[0];
    return { perf: Math.round(tech.refPerf * kern.perfBonus), compat: (draft.features || []).length * 10 + '%', size: (draft.features || []).length * 40 + 'MB', cost: 100 + (draft.features || []).length * 50 };
  }
  if (cat === 'smartphone') {
    const body = PHONE_CONFIG.bodies.find(b => b.id === draft.body) || PHONE_CONFIG.bodies[0];
    return { perf: Math.round(tech.refPerf * 0.7), battery: draft.phoneBattery + 'mAh', weight: body.weight + 'g', cost: 80 + body.cost };
  }
  return null;
}

// =========================================================
// ============ SILICON FLOORPLAN RENDERERS ============
// =========================================================
// Shared palette
const DIE_COLORS = {
  core:      { fill: 'rgba(201,84,42,0.18)',  stroke: 'rgba(201,84,42,0.65)',  text: 'rgba(150,55,25,0.95)' },
  cache:     { fill: 'rgba(122,91,168,0.16)', stroke: 'rgba(122,91,168,0.55)', text: 'rgba(90,65,130,0.95)' },
  io:        { fill: 'rgba(120,109,91,0.14)', stroke: 'rgba(120,109,91,0.45)', text: 'rgba(90,80,65,0.9)'  },
  mem:       { fill: 'rgba(57,197,207,0.14)', stroke: 'rgba(46,131,145,0.55)', text: 'rgba(35,100,110,0.95)' },
  shader:    { fill: 'rgba(122,91,168,0.18)', stroke: 'rgba(122,91,168,0.6)',  text: 'rgba(90,65,130,0.95)' },
  rop:       { fill: 'rgba(184,133,43,0.18)', stroke: 'rgba(184,133,43,0.55)', text: 'rgba(140,100,30,0.95)' },
  video:     { fill: 'rgba(61,139,95,0.14)',  stroke: 'rgba(61,139,95,0.55)',  text: 'rgba(40,100,65,0.95)' },
  bus:       { fill: 'rgba(201,84,42,0.10)',  stroke: 'rgba(201,84,42,0.4)',   text: 'rgba(150,55,25,0.85)' },
};

function dieBlock(x, y, w, h, label, type = 'io', fontSize = 7) {
  const c = DIE_COLORS[type] || DIE_COLORS.io;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${c.fill}" stroke="${c.stroke}" stroke-width="0.7"/>
    ${label ? `<text x="${x + w/2}" y="${y + h/2 + fontSize*0.35}" text-anchor="middle" font-size="${fontSize}" font-weight="700" fill="${c.text}" font-family="monospace">${label}</text>` : ''}
  `;
}

function diePads(W, H, margin = 6, count = 22, size = 1.4) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const x = margin + t * (W - margin * 2);
    const y = margin + t * (H - margin * 2);
    out += `<circle cx="${x.toFixed(1)}" cy="${margin}" r="${size}" fill="rgba(120,109,91,0.45)"/>`;
    out += `<circle cx="${x.toFixed(1)}" cy="${H - margin}" r="${size}" fill="rgba(120,109,91,0.45)"/>`;
    out += `<circle cx="${margin}" cy="${y.toFixed(1)}" r="${size}" fill="rgba(120,109,91,0.45)"/>`;
    out += `<circle cx="${W - margin}" cy="${y.toFixed(1)}" r="${size}" fill="rgba(120,109,91,0.45)"/>`;
  }
  return out;
}

function dieFrame(W, H, label, subLabel, color = '#c9542a') {
  return `
    <rect x="0" y="0" width="${W}" height="${H}" rx="10" fill="rgba(239,232,217,0.55)"/>
    <rect x="6" y="6" width="${W-12}" height="${H-12}" rx="6" fill="none" stroke="rgba(120,109,91,0.2)" stroke-width="0.7"/>
    <text x="14" y="20" font-size="8" font-weight="700" fill="rgba(120,109,91,0.7)" font-family="monospace" letter-spacing="1">${escapeHtml(label)}</text>
    ${subLabel ? `<text x="${W-14}" y="20" text-anchor="end" font-size="8" font-weight="700" fill="${color}" font-family="monospace" letter-spacing="1">${escapeHtml(subLabel)}</text>` : ''}
  `;
}

// =========================================================
// CPU DIE
// =========================================================
function renderCpuDieSVG(large = false) {
  const d = dsWizard.draft;
  const cores = Math.max(1, d.cores || 1);
  const tech = getTech(d.node) || { year: 1995 };
  const yearFactor = Math.max(0, ((tech.year || 1995) - 1995) / 30);

  const W = large ? 340 : 300;
  const H = large ? 380 : 330;
  const pad = 22;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;

  // Decide if this CPU has integrated graphics (from ~2003)
  const hasIGPU = yearFactor > 0.25;
  // L3 exists if set
  const hasL3 = (d.cacheL3 || 0) > 0;

  // Vertical layout bands (proportional)
  const memH = 18;      // memory controller strip
  const ioH = 20;       // I/O at bottom
  const igpuH = hasIGPU ? 34 : 0;
  const l3H = hasL3 ? 26 : 0;
  const gap = 4;

  const coreBandH = innerH - memH - ioH - igpuH - l3H - gap * 4;

  // Arrange cores in a grid
  const cols = cores <= 2 ? cores : cores <= 4 ? 2 : cores <= 8 ? 4 : Math.min(8, Math.ceil(Math.sqrt(cores * 1.5)));
  const rows = Math.max(1, Math.ceil(cores / cols));
  const coreGap = 3;
  const coreW = (innerW - coreGap * (cols - 1)) / cols;
  const coreH = (coreBandH - coreGap * (rows - 1)) / rows;

  let blocks = '';
  let y = pad;

  // Memory controller strip (top)
  for (let i = 0; i < 4; i++) {
    const mw = (innerW - gap * 3) / 4;
    blocks += dieBlock(pad + i * (mw + gap), y, mw, memH, 'MC' + i, 'mem', 6.5);
  }
  y += memH + gap;

  // Cores grid
  for (let i = 0; i < cores; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    const x = pad + c * (coreW + coreGap);
    const yy = y + r * (coreH + coreGap);
    const label = cores > 12 ? String(i) : 'C' + i;
    blocks += dieBlock(x, yy, coreW, coreH, label, 'core', cores > 16 ? 6 : 7);
  }
  y += coreBandH + gap;

  // L3 cache band
  if (hasL3) {
    blocks += dieBlock(pad, y, innerW, l3H, 'L3 CACHE ' + d.cacheL3 + 'KB', 'cache', 7);
    y += l3H + gap;
  }

  // Integrated graphics
  if (hasIGPU) {
    const iw = innerW * 0.55;
    blocks += dieBlock(pad, y, iw, igpuH, 'iGPU', 'shader', 7);
    blocks += dieBlock(pad + iw + gap, y, innerW - iw - gap, igpuH, 'MEM CTRL', 'mem', 6.5);
    y += igpuH + gap;
  }

  // I/O band
  const ioWidths = [0.22, 0.24, 0.20, 0.34];
  let xAcc = pad;
  const ioLabels = ['DDR', 'PCIe', 'USB', 'I/O'];
  const ioT  = ['mem', 'io', 'io', 'io'];
  for (let i = 0; i < 4; i++) {
    const iw = innerW * ioWidths[i] - gap * 0.5;
    blocks += dieBlock(xAcc, y, iw, ioH, ioLabels[i], ioT[i], 6);
    xAcc += iw + gap;
  }

  return `
    <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block;margin:0 auto">
      ${dieFrame(W, H, state.companyName ? state.companyName.toUpperCase() : 'CPU', (d.node || '350nm') + ' · ' + (d.isa || 'x86').toUpperCase())}
      ${diePads(W, H)}
      <rect x="${pad-4}" y="${pad-4}" width="${innerW+8}" height="${innerH+8}" rx="3" fill="none" stroke="rgba(201,84,42,0.35)" stroke-width="0.8" stroke-dasharray="3 3"/>
      ${blocks}
    </svg>
  `;
}

// =========================================================
// GPU DIE
// =========================================================
function renderGpuDieSVG(large = false) {
  const d = dsWizard.draft;
  const shaders = Math.max(2, d.shaderUnits || 4);
  const rops = Math.max(2, d.rops || 4);
  const tech = getTech(d.node) || { year: 1995 };
  const yearFactor = Math.max(0, ((tech.year || 1995) - 1995) / 30);

  const W = large ? 340 : 300;
  const H = large ? 380 : 330;
  const pad = 22;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;

  const memW = 20;      // memory controller side strips
  const botH = 26;      // video + display engine at bottom
  const l2H = 24;       // L2 cache strip
  const gap = 4;
  const centerW = innerW - memW * 2 - gap * 2;

  // Shader cluster grid
  const cols = shaders <= 4 ? 2 : shaders <= 12 ? 3 : shaders <= 24 ? 4 : 6;
  const rows = Math.max(1, Math.ceil(shaders / cols));
  const sBandH = innerH - l2H - botH - gap * 2;
  const sGap = 3;
  const sW = (centerW - sGap * (cols - 1)) / cols;
  const sH = (sBandH - sGap * (rows - 1)) / rows;

  let blocks = '';
  const topY = pad;
  const centerX = pad + memW + gap;

  // Memory controllers left + right strips
  const mcCount = Math.min(8, Math.max(2, Math.ceil(memW / 4)));
  for (let i = 0; i < mcCount; i++) {
    const slotH = (sBandH - 2 * (mcCount - 1)) / mcCount;
    const yy = topY + i * (slotH + 2);
    blocks += dieBlock(pad, yy, memW, slotH, '', 'mem', 5);
    blocks += dieBlock(pad + innerW - memW, yy, memW, slotH, '', 'mem', 5);
  }
  // "MC" vertical label
  blocks += `<text x="${pad + memW/2}" y="${topY + sBandH/2 + 3}" text-anchor="middle" font-size="7" font-weight="800" fill="rgba(35,100,110,0.9)" font-family="monospace" transform="rotate(-90 ${pad + memW/2} ${topY + sBandH/2})">MEM</text>`;
  blocks += `<text x="${pad + innerW - memW/2}" y="${topY + sBandH/2 + 3}" text-anchor="middle" font-size="7" font-weight="800" fill="rgba(35,100,110,0.9)" font-family="monospace" transform="rotate(90 ${pad + innerW - memW/2} ${topY + sBandH/2})">MEM</text>`;

  // Shader clusters
  for (let i = 0; i < shaders; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    const x = centerX + c * (sW + sGap);
    const yy = topY + r * (sH + sGap);
    const label = shaders > 24 ? '' : 'SM' + i;
    blocks += dieBlock(x, yy, sW, sH, label, 'shader', shaders > 16 ? 5.5 : 6.5);
  }

  // L2 cache strip below shaders
  const l2Y = topY + sBandH + gap;
  blocks += dieBlock(centerX, l2Y, centerW, l2H, 'L2 CACHE', 'cache', 7);

  // Bottom band: video + display
  const botY = l2Y + l2H + gap;
  const vw = centerW * 0.45;
  blocks += dieBlock(centerX, botY, vw, botH, 'VIDEO', 'video', 6.5);
  blocks += dieBlock(centerX + vw + gap, botY, centerW - vw - gap, botH, 'DISPLAY', 'rop', 6.5);

  // ROP strip along the bottom outside
  const ropY = topY + innerH + gap;
  // Actually place ROP inside the last band
  // Add a small ROP label at bottom-left corner near mem strip
  blocks += `<text x="${pad}" y="${botY + botH + 12}" font-size="7" font-weight="800" fill="rgba(140,100,30,0.9)" font-family="monospace">ROP ×${rops}</text>`;

  const memLabel = (d.memoryType || 'sdram').toUpperCase() + ' ' + (d.memoryGB || 4) + 'GB';

  return `
    <svg viewBox="0 0 ${W} ${H}" height="${H}" width="100%" style="max-width:${W}px;display:block;margin:0 auto">
      ${dieFrame(W, H, state.companyName ? state.companyName.toUpperCase() : 'GPU', (d.node || '350nm') + ' · ' + memLabel)}
      ${diePads(W, H)}
      <rect x="${pad-4}" y="${pad-4}" width="${innerW+8}" height="${innerH+8}" rx="3" fill="none" stroke="rgba(122,91,168,0.35)" stroke-width="0.8" stroke-dasharray="3 3"/>
      ${blocks}
    </svg>
  `;
}

// =========================================================
// LAPTOP — MOTHERBOARD LAYOUT
// =========================================================
function renderLaptopSVG(chassis, screen) {
  const d = dsWizard.draft;
  const W = 320;
  const H = 240;
  const pad = 16;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;

  const chassisColors = {
    budget:     { outer: 'rgba(180,160,130,0.55)', fill: 'rgba(220,210,190,0.7)',  accent: 'rgba(140,120,90,0.7)' },
    mainstream: { outer: 'rgba(150,140,120,0.65)', fill: 'rgba(200,195,185,0.8)',  accent: 'rgba(110,100,85,0.75)' },
    premium:    { outer: 'rgba(120,110,95,0.75)',  fill: 'rgba(180,175,165,0.9)',  accent: 'rgba(90,80,70,0.8)' },
  };
  const cc = chassisColors[chassis] || chassisColors.mainstream;

  // Board layout areas (proportional to a laptop motherboard)
  const boardX = pad + 6;
  const boardY = pad + 6;
  const boardW = innerW - 12;
  const boardH = innerH - 12;

  // CPU socket: upper-left
  const cpuW = boardW * 0.22;
  const cpuH = boardH * 0.28;
  const cpuX = boardX + boardW * 0.06;
  const cpuY = boardY + boardH * 0.08;

  // RAM slots: upper-right, two thin long slots
  const ramX = boardX + boardW * 0.42;
  const ramY = cpuY;
  const ramW = boardW * 0.34;
  const ramH = 10;

  // Storage: right side
  const storX = boardX + boardW * 0.42;
  const storY = ramY + ramH + 12;
  const storW = boardW * 0.34;
  const storH = 22;

  // Cooling: top-center-right
  const fanCX = boardX + boardW * 0.68;
  const fanCY = boardY + boardH * 0.58;
  const fanR = Math.min(boardW, boardH) * 0.14;

  // Battery: bottom strip
  const batY = boardY + boardH * 0.78;
  const batH = boardH * 0.16;
  const batW = boardW;

  // Ports: left edge
  const portH = 6;
  const portColors = ['#c9542a', '#7a5ba8', '#3d8b5f', '#b8852b'];

  const screenSize = screen || 14;

  return `
    <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block;margin:0 auto">
      <!-- Chassis outline -->
      <rect x="0" y="0" width="${W}" height="${H}" rx="12" fill="${cc.fill}"/>
      <rect x="6" y="6" width="${W-12}" height="${H-12}" rx="8" fill="none" stroke="${cc.accent}" stroke-width="1"/>
      <text x="${pad}" y="${pad - 3}" font-size="8" font-weight="700" fill="rgba(120,109,91,0.7)" font-family="monospace" letter-spacing="1">${screenSize}" · ${chassis.toUpperCase()}</text>
      <text x="${W - pad}" y="${pad - 3}" text-anchor="end" font-size="8" font-weight="700" fill="#c9542a" font-family="monospace" letter-spacing="1">MOTHERBOARD</text>

      <!-- PCB base -->
      <rect x="${boardX}" y="${boardY}" width="${boardW}" height="${boardH}" rx="4" fill="rgba(235,228,211,0.5)" stroke="rgba(120,109,91,0.3)" stroke-width="0.8"/>

      <!-- CPU socket -->
      ${dieBlock(cpuX, cpuY, cpuW, cpuH, 'CPU', 'core', 8)}
      <!-- Die on socket -->
      <rect x="${cpuX + cpuW*0.15}" y="${cpuY + cpuH*0.2}" width="${cpuW*0.7}" height="${cpuH*0.6}" rx="1" fill="rgba(201,84,42,0.4)" stroke="rgba(201,84,42,0.8)" stroke-width="0.5"/>

      <!-- RAM slots (two long thin) -->
      ${dieBlock(ramX, ramY, ramW, ramH, 'DDR', 'mem', 6.5)}
      ${dieBlock(ramX, ramY + ramH + 3, ramW, ramH, 'DDR', 'mem', 6.5)}

      <!-- Storage -->
      ${dieBlock(storX, storY, storW, storH, 'M.2 SSD', 'cache', 6.5)}

      <!-- Chipset -->
      ${dieBlock(boardX + boardW*0.06, boardY + boardH*0.48, boardW*0.22, boardH*0.18, 'PCH', 'io', 7)}

      <!-- Fan / heatsink -->
      <circle cx="${fanCX}" cy="${fanCY}" r="${fanR}" fill="rgba(120,109,91,0.1)" stroke="rgba(120,109,91,0.5)" stroke-width="0.8"/>
      <circle cx="${fanCX}" cy="${fanCY}" r="${fanR*0.7}" fill="none" stroke="rgba(120,109,91,0.35)" stroke-width="0.5" stroke-dasharray="2 2"/>
      <circle cx="${fanCX}" cy="${fanCY}" r="${fanR*0.4}" fill="none" stroke="rgba(120,109,91,0.35)" stroke-width="0.5" stroke-dasharray="2 2"/>
      <text x="${fanCX}" y="${fanCY + 2.5}" text-anchor="middle" font-size="6.5" font-weight="700" fill="rgba(90,80,65,0.9)" font-family="monospace">FAN</text>
      <!-- Heat pipe -->
      <path d="M ${cpuX + cpuW} ${cpuY + cpuH/2} L ${cpuX + cpuW + 10} ${cpuY + cpuH/2} L ${fanCX - fanR - 2} ${fanCY - fanR*0.6}" fill="none" stroke="rgba(184,133,43,0.7)" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M ${fanCX - fanR - 2} ${fanCY + fanR*0.6} L ${cpuX + cpuW + 10} ${cpuY + cpuH/2 + 4} L ${cpuX + cpuW} ${cpuY + cpuH/2 + 4}" fill="none" stroke="rgba(184,133,43,0.7)" stroke-width="1.5" stroke-linecap="round"/>

      <!-- Battery -->
      <rect x="${boardX + 2}" y="${batY}" width="${batW - 4}" height="${batH}" rx="3" fill="rgba(61,139,95,0.14)" stroke="rgba(61,139,95,0.5)" stroke-width="0.8"/>
      <text x="${boardX + batW/2}" y="${batY + batH/2 + 2}" text-anchor="middle" font-size="6.5" font-weight="700" fill="rgba(40,100,65,0.9)" font-family="monospace">BATTERY · ${d.batteryWh}Wh</text>
      ${[0,1,2,3,4,5].map(i => `<line x1="${boardX + 10 + i*((batW-20)/5)}" y1="${batY + 3}" x2="${boardX + 10 + i*((batW-20)/5)}" y2="${batY + batH - 3}" stroke="rgba(61,139,95,0.4)" stroke-width="0.5"/>`).join('')}

      <!-- Ports on left edge -->
      ${portColors.map((c, i) => `
        <rect x="1" y="${boardY + 12 + i*(portH + 6)}" width="6" height="${portH}" rx="1" fill="${c}" opacity="0.7"/>
      `).join('')}

      <!-- Wifi / antenna pads -->
      <circle cx="${boardX + boardW - 8}" cy="${boardY + 8}" r="2.5" fill="rgba(122,91,168,0.5)"/>
      <circle cx="${boardX + boardW - 8}" cy="${boardY + 16}" r="2.5" fill="rgba(122,91,168,0.5)"/>

      <!-- RAM slots external clips -->
      <rect x="${ramX - 3}" y="${ramY - 2}" width="2" height="${ramH + 4}" rx="0.5" fill="rgba(120,109,91,0.5)"/>
      <rect x="${ramX + ramW + 1}" y="${ramY - 2}" width="2" height="${ramH + 4}" rx="0.5" fill="rgba(120,109,91,0.5)"/>
    </svg>
  `;
}

// =========================================================
// OS — KERNEL ARCHITECTURE DIAGRAM
// =========================================================
function renderOsStackSVG() {
  const d = dsWizard.draft;
  const features = d.features || [];
  const kernel = d.kernel || 'unix';

  const W = 320;
  const H = 300;
  const pad = 14;
  const innerW = W - pad * 2;

  const layerH = 30;
  const gap = 4;

  const kernelLabels = {
    unix: 'UNIX KERNEL',
    nt:   'HYBRID KERNEL',
    micro:'MICROKERNEL',
    rt:   'REAL-TIME KERNEL',
  };

  // Feature to layer mapping
  const featureMap = {
    gui:       { layer: 'user',    label: 'GUI' },
    network:   { layer: 'kernel',  label: 'NET' },
    multitask: { layer: 'kernel',  label: 'SCHED' },
    multiuser: { layer: 'kernel',  label: 'USR' },
    browser:   { layer: 'user',    label: 'BROWSER' },
    mobile:    { layer: 'user',    label: 'MOBILE SHELL' },
    touch:     { layer: 'kernel',  label: 'TOUCH DRV' },
    cloud:     { layer: 'user',    label: 'CLOUD SYNC' },
    ai:        { layer: 'user',    label: 'AI ASSIST' },
    arm64:     { layer: 'kernel',  label: 'ARM64' },
  };

  // Which features are active for each layer
  const userFeatures = features.filter(f => featureMap[f] && featureMap[f].layer === 'user');
  const kernelFeatures = features.filter(f => featureMap[f] && featureMap[f].layer === 'kernel');

  let y = pad;
  let blocks = '';

  // Top: user space label
  blocks += `<rect x="${pad}" y="${y}" width="${innerW}" height="14" rx="3" fill="rgba(122,91,168,0.10)" stroke="rgba(122,91,168,0.4)" stroke-width="0.6"/>`;
  blocks += `<text x="${W/2}" y="${y + 9.5}" text-anchor="middle" font-size="7" font-weight="800" fill="rgba(90,65,130,0.9)" font-family="monospace" letter-spacing="1.5">USER SPACE</text>`;
  y += 14 + gap;

  // User layer block with features
  const userBlockH = 30 + Math.floor(userFeatures.length / 4) * 12;
  blocks += `<rect x="${pad}" y="${y}" width="${innerW}" height="${userBlockH}" rx="3" fill="rgba(122,91,168,0.06)" stroke="rgba(122,91,168,0.3)" stroke-width="0.6"/>`;

  if (userFeatures.length > 0) {
    const cols = Math.min(4, userFeatures.length);
    const rows2 = Math.ceil(userFeatures.length / cols);
    const chipW = (innerW - 8 * (cols + 1)) / cols;
    const chipH = 10;
    userFeatures.forEach((f, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const fx = pad + 4 + c * (chipW + 8);
      const fy = y + 6 + r * (chipH + 4);
      blocks += `<rect x="${fx}" y="${fy}" width="${chipW}" height="${chipH}" rx="2" fill="rgba(122,91,168,0.18)" stroke="rgba(122,91,168,0.5)" stroke-width="0.6"/>`;
      blocks += `<text x="${fx + chipW/2}" y="${fy + chipH/2 + 2.5}" text-anchor="middle" font-size="6.5" font-weight="700" fill="rgba(90,65,130,0.95)" font-family="monospace">${featureMap[f].label}</text>`;
    });
  } else {
    blocks += `<text x="${W/2}" y="${y + userBlockH/2 + 2.5}" text-anchor="middle" font-size="7" fill="rgba(120,109,91,0.6)" font-family="monospace" font-style="italic">no userland services</text>`;
  }
  y += userBlockH + gap;

  // System call boundary
  blocks += `<line x1="${pad}" y1="${y}" x2="${pad + innerW}" y2="${y}" stroke="rgba(201,84,42,0.5)" stroke-width="0.7" stroke-dasharray="3 3"/>`;
  blocks += `<text x="${W - pad - 4}" y="${y - 2}" text-anchor="end" font-size="6" font-weight="700" fill="rgba(201,84,42,0.85)" font-family="monospace">syscall</text>`;
  y += 4;

  // Kernel space label
  blocks += `<rect x="${pad}" y="${y}" width="${innerW}" height="14" rx="3" fill="rgba(201,84,42,0.10)" stroke="rgba(201,84,42,0.4)" stroke-width="0.6"/>`;
  blocks += `<text x="${W/2}" y="${y + 9.5}" text-anchor="middle" font-size="7" font-weight="800" fill="rgba(150,55,25,0.9)" font-family="monospace" letter-spacing="1.5">KERNEL SPACE</text>`;
  y += 14 + gap;

  // Kernel components grid
  const kernelBlockH = 42 + Math.floor(kernelFeatures.length / 3) * 12;
  blocks += `<rect x="${pad}" y="${y}" width="${innerW}" height="${kernelBlockH}" rx="3" fill="rgba(201,84,42,0.05)" stroke="rgba(201,84,42,0.3)" stroke-width="0.6"/>`;

  // Kernel title
  blocks += `<text x="${W/2}" y="${y + 12}" text-anchor="middle" font-size="9" font-weight="800" fill="rgba(150,55,25,0.95)" font-family="monospace" letter-spacing="1.5">${kernelLabels[kernel] || 'KERNEL'}</text>`;

  // Kernel features below
  if (kernelFeatures.length > 0) {
    const cols = Math.min(3, kernelFeatures.length);
    const chipW = (innerW - 8 * (cols + 1)) / cols;
    const chipH = 10;
    kernelFeatures.forEach((f, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const fx = pad + 4 + c * (chipW + 8);
      const fy = y + 18 + r * (chipH + 4);
      blocks += `<rect x="${fx}" y="${fy}" width="${chipW}" height="${chipH}" rx="2" fill="rgba(201,84,42,0.18)" stroke="rgba(201,84,42,0.55)" stroke-width="0.6"/>`;
      blocks += `<text x="${fx + chipW/2}" y="${fy + chipH/2 + 2.5}" text-anchor="middle" font-size="6.5" font-weight="700" fill="rgba(150,55,25,0.95)" font-family="monospace">${featureMap[f].label}</text>`;
    });
  }
  y += kernelBlockH + gap;

  // HAL
  blocks += `<rect x="${pad}" y="${y}" width="${innerW}" height="22" rx="3" fill="rgba(120,109,91,0.1)" stroke="rgba(120,109,91,0.4)" stroke-width="0.6"/>`;
  blocks += `<text x="${W/2}" y="${y + 14}" text-anchor="middle" font-size="7" font-weight="800" fill="rgba(90,80,65,0.9)" font-family="monospace" letter-spacing="1">HARDWARE ABSTRACTION LAYER</text>`;
  y += 22 + gap;

  // HAL sub blocks
  const halSubs = ['CPU', 'GPU', 'MEM', 'I/O'];
  const halW = (innerW - 4 * 3) / 4;
  halSubs.forEach((s, i) => {
    blocks += `<rect x="${pad + i * (halW + 3)}" y="${y}" width="${halW}" height="16" rx="2" fill="rgba(120,109,91,0.14)" stroke="rgba(120,109,91,0.45)" stroke-width="0.6"/>`;
    blocks += `<text x="${pad + i * (halW + 3) + halW/2}" y="${y + 10.5}" text-anchor="middle" font-size="7" font-weight="700" fill="rgba(90,80,65,0.95)" font-family="monospace">${s}</text>`;
  });
  y += 16 + gap;

  // Hardware line
  blocks += `<line x1="${pad}" y1="${y}" x2="${pad + innerW}" y2="${y}" stroke="rgba(120,109,91,0.6)" stroke-width="0.8"/>`;
  blocks += `<text x="${W/2}" y="${y + 12}" text-anchor="middle" font-size="7" font-weight="700" fill="rgba(120,109,91,0.8)" font-family="monospace" letter-spacing="1.5">SILICON</text>`;

  return `
    <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block;margin:0 auto">
      <rect x="0" y="0" width="${W}" height="${H}" rx="10" fill="rgba(239,232,217,0.4)"/>
      <rect x="6" y="6" width="${W-12}" height="${H-12}" rx="6" fill="none" stroke="rgba(120,109,91,0.2)" stroke-width="0.7"/>
      <text x="${pad}" y="${pad - 3}" font-size="8" font-weight="700" fill="rgba(120,109,91,0.7)" font-family="monospace" letter-spacing="1">OS STACK</text>
      <text x="${W-pad}" y="${pad - 3}" text-anchor="end" font-size="8" font-weight="700" fill="#3d8b5f" font-family="monospace" letter-spacing="1">${(features.length)} SERVICES</text>
      ${blocks}
    </svg>
  `;
}

// =========================================================
// SMARTPHONE — PCB LAYOUT
// =========================================================
function renderPhoneSVG(body, screen) {
  const d = dsWizard.draft;
  const W = 180;
  const H = 340;
  const pad = 14;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;

  const bodyColors = {
    plastic: { outer: 'rgba(200,190,170,0.85)', edge: 'rgba(160,150,130,0.9)' },
    glass:   { outer: 'rgba(60,60,72,0.9)',     edge: 'rgba(40,40,50,1)' },
    ceramic: { outer: 'rgba(230,225,215,0.95)', edge: 'rgba(180,175,165,1)' },
  };
  const bc = bodyColors[body] || bodyColors.glass;

  // Camera tier affects number of camera bumps
  const camMap = { basic: 1, mid: 1, high: 2, dual: 2, triple: 3 };
  const camCount = camMap[d.cameraTier] || 1;

  // Areas
  const camAreaH = 44;
  const socAreaH = 60;
  const batAreaH = 110;
  const gap = 6;

  let y = pad + camAreaH + 8;
  let blocks = '';

  // Camera module (top)
  blocks += `<rect x="${pad + 4}" y="${pad + 4}" width="60" height="${camAreaH}" rx="8" fill="rgba(120,109,91,0.1)" stroke="rgba(120,109,91,0.4)" stroke-width="0.7"/>`;
  for (let i = 0; i < camCount; i++) {
    const cx = pad + 4 + 14 + i * 16;
    const cy = pad + 4 + camAreaH / 2;
    blocks += `<circle cx="${cx}" cy="${cy}" r="6.5" fill="rgba(30,30,40,0.6)" stroke="rgba(20,20,30,0.9)" stroke-width="0.8"/>`;
    blocks += `<circle cx="${cx}" cy="${cy}" r="3.5" fill="rgba(80,120,160,0.7)"/>`;
  }
  // Flash LED
  blocks += `<circle cx="${pad + 4 + 54}" cy="${pad + 4 + camAreaH - 10}" r="3" fill="rgba(255,220,150,0.7)" stroke="rgba(180,140,60,0.7)" stroke-width="0.5"/>`;

  // Antenna band top (line)
  blocks += `<line x1="${pad}" y1="${pad + camAreaH + 8 + 4}" x2="${W - pad}" y2="${pad + camAreaH + 8 + 4}" stroke="rgba(120,109,91,0.4)" stroke-width="0.7" stroke-dasharray="2 3"/>`;

  // SoC area
  const socX = pad + 6;
  const socY = y + 4;
  const socW = innerW - 12;
  const socH = socAreaH;

  blocks += `<rect x="${socX}" y="${socY}" width="${socW}" height="${socH}" rx="4" fill="rgba(235,228,211,0.4)" stroke="rgba(120,109,91,0.35)" stroke-width="0.7"/>`;
  blocks += `<text x="${socX + 4}" y="${socY + 10}" font-size="6" font-weight="700" fill="rgba(120,109,91,0.8)" font-family="monospace" letter-spacing="1">SOC</text>`;

  // SoC main die
  const dieW = socW * 0.55;
  const dieH = socH - 16;
  const dieX = socX + 6;
  const dieY = socY + 8;
  blocks += dieBlock(dieX, dieY, dieW, dieH, 'CPU+GPU', 'core', 6);
  blocks += `<rect x="${dieX + 4}" y="${dieY + 4}" width="${dieW - 8}" height="${dieH - 8}" rx="2" fill="rgba(201,84,42,0.35)" stroke="rgba(201,84,42,0.8)" stroke-width="0.5"/>`;

  // RAM stacked next to SoC
  const ramW = socW - dieW - 14;
  blocks += dieBlock(dieX + dieW + 4, dieY, ramW, dieH, 'RAM', 'mem', 6);

  y = socY + socH + 10;

  // Battery
  blocks += `<rect x="${pad + 6}" y="${y}" width="${innerW - 12}" height="${batAreaH}" rx="6" fill="rgba(61,139,95,0.10)" stroke="rgba(61,139,95,0.5)" stroke-width="0.8"/>`;
  blocks += `<text x="${W/2}" y="${y + 14}" text-anchor="middle" font-size="7" font-weight="800" fill="rgba(40,100,65,0.9)" font-family="monospace" letter-spacing="1">BATTERY</text>`;
  blocks += `<text x="${W/2}" y="${y + 26}" text-anchor="middle" font-size="6.5" fill="rgba(40,100,65,0.8)" font-family="monospace">${d.phoneBattery} mAh</text>`;

  // Battery cells
  const cellCount = Math.round(d.phoneBattery / 500);
  for (let i = 0; i < Math.min(8, cellCount); i++) {
    const cw = (innerW - 16) / Math.min(8, cellCount);
    const cx = pad + 8 + i * cw;
    blocks += `<line x1="${cx}" y1="${y + 32}" x2="${cx}" y2="${y + batAreaH - 4}" stroke="rgba(61,139,95,0.35)" stroke-width="0.5"/>`;
  }

  y += batAreaH + 6;

  // Charging port
  blocks += `<rect x="${W/2 - 14}" y="${y}" width="28" height="6" rx="2" fill="rgba(120,109,91,0.4)" stroke="rgba(120,109,91,0.6)" stroke-width="0.5"/>`;
  blocks += `<text x="${W/2}" y="${y + 18}" text-anchor="middle" font-size="6" font-weight="700" fill="rgba(120,109,91,0.7)" font-family="monospace">USB-C</text>`;

  return `
    <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block;margin:0 auto">
      <!-- Chassis -->
      <rect x="0" y="0" width="${W}" height="${H}" rx="22" fill="${bc.outer}"/>
      <rect x="5" y="5" width="${W-10}" height="${H-10}" rx="18" fill="none" stroke="${bc.edge}" stroke-width="1.2"/>
      <!-- Screen border light -->
      <rect x="7" y="7" width="${W-14}" height="${H-14}" rx="16" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="0.6"/>
      <!-- Antenna bands top and bottom -->
      <line x1="6" y1="${pad - 2}" x2="${W-6}" y2="${pad - 2}" stroke="rgba(180,180,180,0.5)" stroke-width="0.8"/>
      <line x1="6" y1="${H - pad + 2}" x2="${W-6}" y2="${H - pad + 2}" stroke="rgba(180,180,180,0.5)" stroke-width="0.8"/>
      <!-- Title -->
      <text x="${pad}" y="${pad - 5}" font-size="7" font-weight="700" fill="rgba(255,255,255,0.6)" font-family="monospace" letter-spacing="1">${(screen||5.5).toFixed(1)}" · ${body.toUpperCase()}</text>
      ${blocks}
    </svg>
  `;
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
      <div class="ds-die-preview">${renderCpuDieSVG()}<div class="ds-die-caption">${d.cores}C · ${d.boostClock}MHz · ${d.node}</div><div class="ds-die-hint">SILICON LAYOUT · Live</div></div>
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
    <div class="ds-section"><div class="ds-die-preview ds-die-large">${renderCpuDieSVG(true)}<div class="ds-die-caption">${d.cores}C · ${d.boostClock}MHz · ${d.node}</div><div class="ds-die-hint">FINAL SILICON LAYOUT</div></div></div>
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
    <div class="ds-section"><div class="ds-die-preview">${renderGpuDieSVG()}<div class="ds-die-caption">${d.shaderUnits} SH · ${d.rops} ROP · ${d.boostClock}MHz</div><div class="ds-die-hint">GPU FLOORPLAN · Live</div></div></div>
    ${renderSlider('Shader Clusters', 'ds-shaders', d.shaderUnits, 2, 64, 1, v => v)}
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
    <div class="ds-section"><div class="ds-die-preview ds-die-large">${renderGpuDieSVG(true)}<div class="ds-die-caption">${d.shaderUnits} SH · ${d.memoryGB}GB ${d.memoryType.toUpperCase()}</div><div class="ds-die-hint">FINAL GPU FLOORPLAN</div></div></div>
    ${renderSummaryGrid([
      ['Shaders', d.shaderUnits + ' clusters'],
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
    <div class="ds-section"><div class="ds-die-preview">${renderLaptopSVG('mainstream', 14)}</div></div>
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
    <div class="ds-section"><div class="ds-die-preview">${renderLaptopSVG(d.chassis, d.screenSize)}<div class="ds-die-caption">MOTHERBOARD LAYOUT</div></div></div>
  `;
}
function renderLaptopRelease() {
  const d = dsWizard.draft;
  if (!d.price) d.price = 800;
  return `
    <div class="ds-section"><div class="ds-die-preview ds-die-large">${renderLaptopSVG(d.chassis, d.screenSize)}<div class="ds-die-caption">${d.name || 'Untitled'} · ${d.screenSize}"</div></div></div>
    ${renderSummaryGrid([
      ['Chassis', d.chassis], ['Screen', d.screenSize + '"'],
      ['Battery', d.batteryWh + ' Wh'], ['CPU', d.useOwnCpu ? 'In-house' : 'Third-party'],
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
    <div class="ds-section"><div class="ds-die-preview ds-die-large">${renderOsStackSVG()}<div class="ds-die-caption">${d.kernel.toUpperCase()} · ${(d.features || []).length} features</div><div class="ds-die-hint">OS ARCHITECTURE · Live</div></div></div>
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
    <div class="ds-section"><div class="ds-die-preview ds-die-large">${renderOsStackSVG()}<div class="ds-die-caption">${d.name || 'Untitled'}</div></div></div>
    ${renderSummaryGrid([
      ['Kernel', d.kernel], ['Features', (d.features || []).length + ' packs'],
      ['Segment', d.segment || '—'], ['Type', 'Software'],
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
    <div class="ds-section"><div class="ds-die-preview ds-die-large">${renderPhoneSVG(d.body, d.phoneScreen)}<div class="ds-die-caption">PCB LAYOUT</div></div></div>
  `;
}
function renderPhoneRelease() {
  const d = dsWizard.draft;
  if (!d.price) d.price = 400;
  return `
    <div class="ds-section"><div class="ds-die-preview ds-die-large">${renderPhoneSVG(d.body, d.phoneScreen)}<div class="ds-die-caption">${d.name || 'Untitled'} · ${d.phoneScreen}"</div></div></div>
    ${renderSummaryGrid([
      ['Body', d.body], ['Screen', d.phoneScreen.toFixed(1) + '"'],
      ['Battery', d.phoneBattery + ' mAh'], ['Camera', d.cameraTier],
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
      // Redraw die preview live (throttled by microtask)
      const preview = document.querySelector('.ds-die-preview');
      if (preview && dsWizard.cat === 'cpu') preview.innerHTML = renderCpuDieSVG() + preview.querySelector('.ds-die-caption')?.outerHTML + preview.querySelector('.ds-die-hint')?.outerHTML;
      if (preview && dsWizard.cat === 'gpu') preview.innerHTML = renderGpuDieSVG() + preview.querySelector('.ds-die-caption')?.outerHTML + preview.querySelector('.ds-die-hint')?.outerHTML;
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
// ICONS
// =========================================================
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
