// js/ui/panelResearch.js
// Panel tech tree.

function showResearch() {
  const next = getNextTech(state.currentNode);
  const check = canResearchNext(state);

  setPanel('Riset Teknologi', `${state.researchPoint} RP`, `
    <div class="card-grid">
      <div class="card">
        <div class="meta">RESEARCH POINT</div>
        <div style="font-size:26px;font-family:var(--font-mono);font-weight:700;color:var(--accent)">
          ${state.researchPoint.toLocaleString('id-ID')} RP
        </div>
        <div class="mt-1" style="font-size:11px;color:var(--fg-3)">
          +${calcRPGain(state)} RP/turn
        </div>
      </div>
      <div class="card">
        <div class="meta">NODE AKTIF</div>
        <div style="font-size:26px;font-family:var(--font-mono);font-weight:700">
          ${state.currentNode}
        </div>
        <div class="mt-1" style="font-size:11px;color:var(--fg-3)">
          ${state.unlockedNodes.length} / ${TECH_TREE.length} dikuasai
        </div>
      </div>
    </div>

    ${check.ok ? `
      <div class="card selected">
        <div class="row between">
          <div>
            <h3>Riset ${check.next.name}</h3>
            <div class="meta">Biaya: ${check.next.rp} RP · ${formatMoneyShort(check.next.cost)}</div>
            <p class="muted" style="font-size:12px;margin-top:6px">
              Node ${check.next.name} membuka clock hingga ${check.next.maxClock}MHz
              dengan TDP factor ${check.next.tdpFactor}. Density ${check.next.transistorDensity} juta/mm².
            </p>
          </div>
          <button class="btn primary lg" id="do-research">Riset Sekarang</button>
        </div>
      </div>
    ` : `
      <div class="card">
        <div class="meta">STATUS RISET</div>
        <p class="muted" style="font-size:12px">${check.reason || 'Tidak ada riset tersedia.'}</p>
      </div>
    `}

    <div class="section-title">Roadmap Teknologi</div>
    ${TECH_TREE.map(t => renderTechRow(t)).join('')}
  `);

  document.getElementById('do-research')?.addEventListener('click', () => {
    const result = performResearch(state);
    if (result.success) {
      addLog(`Riset selesai: node ${result.tech.name} dikuasai.`, 'good');
      toast(`Node ${result.tech.name} berhasil diriset!`, 'good');
      showResearch();
    } else {
      toast(result.reason, 'bad');
    }
  });
}

function renderTechRow(t) {
  const owned = state.unlockedNodes.includes(t.id);
  const isNext = getNextTech(state.currentNode)?.id === t.id;
  const yearOk = state.tahun >= t.year;

  let badge = '';
  if (owned) badge = '<span class="badge good">Dikuasai</span>';
  else if (isNext && !yearOk) badge = `<span class="badge warn">Tersedia ${t.year}</span>`;
  else if (isNext) badge = '<span class="badge info">Tersedia riset</span>';
  else badge = '<span class="badge">Terkunci</span>';

  return `
    <div class="card ${owned ? 'selected' : ''}" style="${!owned && !isNext ? 'opacity:0.55' : ''}">
      <div class="row between">
        <h3>${t.name}</h3>
        ${badge}
      </div>
      <div class="meta">
        PERF ${t.refPerf} · MAX ${t.maxClock} MHz · DENSITY ${t.transistorDensity} jt/mm² · YIELD ${(t.baseYield * 100).toFixed(0)}%
      </div>
      <div class="row" style="font-size:11px;color:var(--fg-3);font-family:var(--font-mono);gap:14px">
        <span>RP: ${t.rp}</span>
        <span>Biaya: ${formatMoneyShort(t.cost)}</span>
        <span>Wafer: ${formatMoneyShort(t.waferCost)}</span>
      </div>
    </div>
  `;
}
