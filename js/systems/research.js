// js/systems/research.js
// Tech tree unlock dan gain RP.

// ===== RP gain per turn =====
// Basis dari lab riset + bonus dari engineer process
function calcRPGain(state) {
  let base = 3;

  // Bonus dari jumlah engineer
  base += Math.floor(state.team.length * 0.5);

  // Bonus dari engineer spesialis process
  const processEngs = state.team.filter(e => e.specialty === 'process');
  for (const eng of processEngs) {
    const lv = getLevelInfo(eng.level);
    base += lv.effectMult * 1.5;
  }

  // Bonus dari market share (semakin besar, semakin banyak resource untuk riset)
  base += state.marketShare * 20;

  return Math.round(base);
}

// ===== Cek bisa riset node berikutnya =====
function canResearchNext(state) {
  const next = getNextTech(state.currentNode);
  if (!next) return { ok: false, reason: 'Node sudah paling canggih' };
  if (state.tahun < next.year) {
    return { ok: false, reason: `Tersedia tahun ${next.year}` };
  }
  if (state.researchPoint < next.rp) {
    return { ok: false, reason: `Butuh ${next.rp} RP` };
  }
  if (state.uang < next.cost) {
    return { ok: false, reason: `Butuh ${formatMoneyShort(next.cost)}` };
  }
  return { ok: true, next };
}

// ===== Lakukan riset =====
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
