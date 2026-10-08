// js/ui/panelDesign.js
// Chip design form. Most complex panel — all parameters live here.
// Gated by engineer requirement.

let designDraft = null;

function showDesign() {
  const readyCount = state.projects.filter(p => p.status === 'done').length;
  const noEngineers = state.team.length === 0;

  if (!designDraft) {
    designDraft = createDraft(state.tahun);
    designDraft.segment = getAvailableSegments(state.tahun)[0]?.id || 'budget_pc';
    designDraft.isa = getAvailableISAs(state.tahun)[0]?.id || 'x86';
    designDraft.node = state.currentNode;
    designDraft.budget = calcMinDesignCost(designDraft, getTech(designDraft.node));
    designDraft.price = 20;
  }

  const tech = getTech(designDraft.node);
  const limits = getDesignLimits(designDraft.node);
  const availableISAs = getAvailableISAs(state.tahun);
  const availableSegments = getAvailableSegments(state.tahun);
  const availableSIMD = getAvailableSIMD(state.tahun);

  const chipData = finalizeChip(designDraft, state.tahun, {});
  if (!chipData) {
    setPanel('Design', 'error', `<div class="empty">${ICONS.alert}<h3>Invalid node</h3></div>`);
    return;
  }

  const minCost = chipData.minDesignCost;
  const affordable = state.uang >= designDraft.budget && !noEngineers;

  setPanel('Design Product', 'R&D Lab', `
    ${noEngineers ? `
      <div class="card" style="border-color:var(--warn)">
        <div class="row between">
          <div>
            <h3 style="color:var(--warn)">No engineers hired</h3>
            <div class="meta">You must recruit at least one engineer before starting R&D.</div>
          </div>
          <button class="btn" onclick="renderPanel('team')">Go to Team</button>
        </div>
      </div>
    ` : ''}

    ${readyCount > 0 ? `
      <div class="card" style="border-color:var(--good)">
        <div class="row between">
          <div>
            <h3>${readyCount} product${readyCount > 1 ? 's' : ''} ready to launch</h3>
            <div class="meta">Finish launching before starting a new project.</div>
          </div>
          <button class="btn good" onclick="renderPanel('production')">View Production</button>
        </div>
      </div>
    ` : ''}

    <div class="field-row-3">
      <div class="field">
        <label>Category</label>
        <select id="d-cat">
          ${CHIP_CATEGORIES.map(c => `<option value="${c.id}" ${c.id === designDraft.category ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Product Name</label>
        <input id="d-name" type="text" value="${escapeHtml(designDraft.name)}" placeholder="Axion-97">
      </div>
      <div class="field">
        <label>Target Segment</label>
        <select id="d-seg">
          ${availableSegments.map(s => `<option value="${s.id}" ${s.id === designDraft.segment ? 'selected' : ''}>${s.icon} ${s.name}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="section-title">Architecture</div>
    <div class="field-row">
      <div class="field">
        <label>Instruction Set</label>
        <select id="d-isa">
          ${availableISAs.map(i => `<option value="${i.id}" ${i.id === designDraft.isa ? 'selected' : ''}>${i.name} — ${i.description}</option>`).join('')}
        </select>
        <div class="help">ISA determines ecosystem and power efficiency.</div>
      </div>
      <div class="field">
        <label>Process Node</label>
        <select id="d-node">
          ${state.unlockedNodes.map(n => {
            const t = getTech(n);
            return `<option value="${n}" ${n === designDraft.node ? 'selected' : ''}>${t.name} · max ${t.maxClock} MHz</option>`;
          }).join('')}
        </select>
        <div class="help">Smaller node = denser but more expensive.</div>
      </div>
    </div>

    <div class="section-title">Chip Specifications</div>
    <div class="field-row">
      <div class="field">
        <label>Cores — ${designDraft.cores}</label>
        <input id="d-cores" type="range" min="1" max="${limits.maxCores}" step="1" value="${designDraft.cores}">
        <div class="help">Node limit: ${limits.maxCores} cores</div>
      </div>
      <div class="field">
        <label>Base Clock — ${designDraft.baseClock} MHz</label>
        <input id="d-base" type="range" min="50" max="${limits.maxClock}" step="50" value="${designDraft.baseClock}">
        <div class="help">Node limit: ${limits.maxClock} MHz</div>
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label>Boost Clock — ${designDraft.boostClock} MHz</label>
        <input id="d-boost" type="range" min="50" max="${Math.round(limits.maxClock * 1.1)}" step="50" value="${designDraft.boostClock}">
        <div class="help">Higher boost = more performance, more TDP.</div>
      </div>
      <div class="field">
        <label>L2 Cache — ${designDraft.cacheL2} KB</label>
        <input id="d-cache2" type="range" min="64" max="${limits.maxCacheL2}" step="64" value="${designDraft.cacheL2}">
        <div class="help">Larger cache = pricier but faster.</div>
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label>L1 Cache — ${designDraft.cacheL1} KB/core</label>
        <input id="d-cache1" type="range" min="8" max="${limits.maxCacheL1}" step="8" value="${designDraft.cacheL1}">
      </div>
      <div class="field">
        <label>L3 Cache — ${designDraft.cacheL3} KB</label>
        <input id="d-cache3" type="range" min="0" max="${limits.maxCacheL3}" step="256" value="${designDraft.cacheL3}">
      </div>
    </div>

    <div class="section-title">SIMD Extensions</div>
    <div class="card">
      <div class="row wrap">
        ${availableSIMD.map(s => `
          <button class="btn sm ${designDraft.simd.includes(s.id) ? 'primary' : ''}" data-simd="${s.id}">
            ${designDraft.simd.includes(s.id) ? '✓ ' : ''}${s.name}
          </button>
        `).join('')}
        ${availableSIMD.length === 0 ? '<span class="muted" style="font-size:12px">No SIMD sets available this year.</span>' : ''}
      </div>
    </div>

    <div class="section-title">Budget & Pricing</div>
    <div class="field-row">
      <div class="field">
        <label>R&D Budget — ${formatMoney(designDraft.budget)}</label>
        <input id="d-budget" type="range" min="${minCost}" max="${minCost * 3}" step="${Math.max(1, Math.round(minCost / 50))}" value="${designDraft.budget}">
        <div class="help">Minimum: ${formatMoney(minCost)}</div>
      </div>
      <div class="field">
        <label>Unit Price — $${designDraft.price}</label>
        <input id="d-price" type="range" min="1" max="500" step="1" value="${designDraft.price}">
        <div class="help">Unit cost: ${formatMoney(chipData.unitCost)}</div>
      </div>
    </div>

    <div class="section-title">Projection</div>
    <div class="card">
      <div class="stat-row"><span class="k">Performance score</span><span class="v accent">${chipData.perfScore}</span></div>
      <div class="stat-row"><span class="k">TDP</span><span class="v ${chipData.tdp > 150 ? 'bad' : 'good'}">${chipData.tdp} W</span></div>
      <div class="stat-row"><span class="k">Feature score</span><span class="v">${chipData.featureScore}/100</span></div>
      <div class="stat-row"><span class="k">Transistors</span><span class="v">${chipData.transistors}M</span></div>
      <div class="stat-row"><span class="k">Die area</span><span class="v">${chipData.dieArea} mm²</span></div>
      <div class="stat-row"><span class="k">Estimated yield</span><span class="v ${chipData.yieldRate < 0.5 ? 'bad' : 'good'}">${(chipData.yieldRate * 100).toFixed(0)}%</span></div>
      <div class="stat-row"><span class="k">Unit cost</span><span class="v">${formatMoney(chipData.unitCost)}</span></div>
      <div class="stat-row"><span class="k">Margin per unit</span><span class="v ${designDraft.price > chipData.unitCost ? 'good' : 'bad'}">${formatMoney(designDraft.price - chipData.unitCost)}</span></div>
    </div>

    <div class="row between mt-2">
      <button class="btn" id="d-reset">Reset</button>
      <div class="row">
        <span class="muted" style="font-size:12px">${noEngineers ? 'Recruit an engineer first.' : (!affordable ? 'Not enough funds.' : '')}</span>
        <button class="btn primary lg" id="d-start" ${affordable ? '' : 'disabled'}>
          ${noEngineers ? 'Recruit an engineer first' : `Start R&D · ${formatMoneyShort(designDraft.budget)}`}
        </button>
      </div>
    </div>
  `);

  bindDesignForm();
}

function bindDesignForm() {
  const $ = id => document.getElementById(id);

  $('d-cat')?.addEventListener('change', e => {
    designDraft.category = e.target.value;
    showDesign();
  });

  $('d-name')?.addEventListener('input', e => { designDraft.name = e.target.value; });

  $('d-seg')?.addEventListener('change', e => {
    designDraft.segment = e.target.value;
    showDesign();
  });

  $('d-isa')?.addEventListener('change', e => {
    designDraft.isa = e.target.value;
    showDesign();
  });

  $('d-node')?.addEventListener('change', e => {
    designDraft.node = e.target.value;
    const limits = getDesignLimits(designDraft.node);
    if (designDraft.cores > limits.maxCores) designDraft.cores = limits.maxCores;
    if (designDraft.baseClock > limits.maxClock) designDraft.baseClock = limits.maxClock;
    if (designDraft.boostClock > limits.maxClock * 1.1) designDraft.boostClock = Math.round(limits.maxClock);
    if (designDraft.cacheL1 > limits.maxCacheL1) designDraft.cacheL1 = limits.maxCacheL1;
    if (designDraft.cacheL2 > limits.maxCacheL2) designDraft.cacheL2 = limits.maxCacheL2;
    if (designDraft.cacheL3 > limits.maxCacheL3) designDraft.cacheL3 = limits.maxCacheL3;
    const mc = calcMinDesignCost(designDraft, getTech(designDraft.node));
    if (designDraft.budget < mc) designDraft.budget = mc;
    showDesign();
  });

  const bindLive = (id, key) => {
    $(id)?.addEventListener('input', e => {
      designDraft[key] = parseInt(e.target.value);
      updateLivePreview();
    });
  };
  bindLive('d-cores', 'cores');
  bindLive('d-base', 'baseClock');
  bindLive('d-boost', 'boostClock');
  bindLive('d-cache1', 'cacheL1');
  bindLive('d-cache2', 'cacheL2');
  bindLive('d-cache3', 'cacheL3');
  bindLive('d-budget', 'budget');
  bindLive('d-price', 'price');

  document.querySelectorAll('[data-simd]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.simd;
      const idx = designDraft.simd.indexOf(id);
      if (idx >= 0) designDraft.simd.splice(idx, 1);
      else designDraft.simd.push(id);
      showDesign();
    });
  });

  $('d-reset')?.addEventListener('click', () => {
    designDraft = null;
    showDesign();
  });

  $('d-start')?.addEventListener('click', startDesign);
}

function updateLivePreview() {
  const el = document.getElementById('d-budget');
  if (!el) return;
  const labels = {
    'd-cores':  `Cores — ${designDraft.cores}`,
    'd-base':   `Base Clock — ${designDraft.baseClock} MHz`,
    'd-boost':  `Boost Clock — ${designDraft.boostClock} MHz`,
    'd-cache1': `L1 Cache — ${designDraft.cacheL1} KB/core`,
    'd-cache2': `L2 Cache — ${designDraft.cacheL2} KB`,
    'd-cache3': `L3 Cache — ${designDraft.cacheL3} KB`,
    'd-budget': `R&D Budget — ${formatMoney(designDraft.budget)}`,
    'd-price':  `Unit Price — $${designDraft.price}`,
  };
  for (const [id, text] of Object.entries(labels)) {
    const input = document.getElementById(id);
    if (!input) continue;
    const label = input.previousElementSibling;
    if (label && label.tagName === 'LABEL') label.textContent = text;
  }

  const chipData = finalizeChip(designDraft, state.tahun, {});
  if (!chipData) return;
  const values = document.querySelectorAll('.stat-row .v');
  if (values[0]) values[0].textContent = chipData.perfScore;
  if (values[1]) {
    values[1].textContent = chipData.tdp + ' W';
    values[1].className = 'v ' + (chipData.tdp > 150 ? 'bad' : 'good');
  }
  if (values[2]) values[2].textContent = chipData.featureScore + '/100';
  if (values[3]) values[3].textContent = chipData.transistors + 'M';
  if (values[4]) values[4].textContent = chipData.dieArea + ' mm²';
  if (values[5]) {
    values[5].textContent = (chipData.yieldRate * 100).toFixed(0) + '%';
    values[5].className = 'v ' + (chipData.yieldRate < 0.5 ? 'bad' : 'good');
  }
  if (values[6]) values[6].textContent = formatMoney(chipData.unitCost);
  if (values[7]) {
    const margin = designDraft.price - chipData.unitCost;
    values[7].textContent = formatMoney(margin);
    values[7].className = 'v ' + (margin > 0 ? 'good' : 'bad');
  }
}

function startDesign() {
  if (state.team.length === 0) {
    toast('You need at least one engineer to start R&D.', 'bad', 'No engineers');
    renderPanel('team');
    return;
  }

  if (!designDraft) return;
  const chipData = finalizeChip(designDraft, state.tahun, {});
  if (!chipData) { toast('Invalid design.', 'bad'); return; }
  if (state.uang < designDraft.budget) { toast('Not enough funds.', 'bad'); return; }

  const name = (designDraft.name || `FC-${state.tahun}-${Math.floor(Math.random() * 900 + 100)}`).trim();

  const project = createProject({ ...chipData, name }, state.tahun, state.bulan, state.team);
  state.projects.push(project);

  const upfront = Math.round(designDraft.budget * 0.3);
  state.uang -= upfront;

  addLog(`R&D started: "${name}" (${getCategory(chipData.category).name} ${chipData.node}).`, 'good');
  toast(`Project "${name}" started. Upfront cost ${formatMoneyShort(upfront)}.`, 'good');

  designDraft = null;
  renderPanel('production');
    }
