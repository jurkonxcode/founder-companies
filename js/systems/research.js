// js/systems/research.js
// Tech tree unlock and RP accumulation.
// Research grows automatically each turn based on engineers and progress.

// ===== RP gain per turn =====
// Base: 2 RP. +2 RP per hired engineer. +bonus from process specialists.
// +market share contribution. +archetype multiplier.
function calcRPGain(state) {
  let base = 2;
  base += state.team.length * 2;

  const processEngs = state.team.filter(e => e.specialty === 'process');
  for (const eng of processEngs) {
    const lv = getLevelInfo(eng.level);
    base += lv.effectMult * 3;
  }

  base += state.marketShare * 10;

  return Math.round(base * archBonus('rpGain'));
}

// ===== Check if next node is researchable =====
function canResearchNext(state) {
  const next = getNextTech(state.currentNode);
  if (!next) return { ok: false, reason: 'Already at the latest node' };
  if (state.tahun < next.year) {
    return { ok: false, reason: `Available in ${next.year}` };
  }
  const cost = Math.round(next.cost * archBonus('nodeCost'));
  if (state.researchPoint < next.rp) {
    return { ok: false, reason: `Need ${next.rp} RP` };
  }
  if (state.uang < cost) {
    return { ok: false, reason: `Need ${formatMoneyShort(cost)}` };
  }
  return { ok: true, next: { ...next, cost, originalCost: next.cost } };
}

// ===== Perform research =====
function performResearch(state) {
  const check = canResearchNext(state);
  if (!check.ok) return { success: false, reason: check.reason };

  const next = check.next;
  state.researchPoint -= next.rp;
  state.uang -= next.cost;
  state.currentNode = next.id;
  if (!state.unlockedNodes.includes(next.id)) {
    state.unlockedNodes.push(next.id);
  }
  return { success: true, tech: next };
}
