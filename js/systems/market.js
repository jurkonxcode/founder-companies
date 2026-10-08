// js/systems/market.js
// Demand, penjualan, market share, simulasi kompetitor.

// ===== Hitung demand multiplier dari event aktif =====
function getActiveEventMultiplier(state, categoryId) {
  let mult = 1.0;
  // Cek event bersejarah yang terjadi 12 turn terakhir
  for (const ev of state.triggeredEvents) {
    const turnsSince = state.turn - ev.turn;
    if (turnsSince < 0 || turnsSince > 12) continue;
    if (ev.effects && ev.effects.demand && ev.effects.demand[categoryId]) {
      mult *= ev.effects.demand[categoryId];
    }
  }
  return mult;
}

// ===== Hitung penjualan produk =====
// Dipengaruhi oleh: fit ke segmen, harga, market share, event
function calcProductSales(product, state, year) {
  const segment = getSegment(product.segment);
  if (!segment) return { sales: 0, revenue: 0, fit: 0 };

  // Market size tumbuh dari tahun segment rilis
  const yearsSinceLaunch = Math.max(0, year - segment.year);
  const marketSize = segment.marketSize * Math.pow(1 + segment.growthRate, yearsSinceLaunch);

  // Fit chip ke segmen
  const fit = calcSegmentFit(segment, {
    perfScore: product.perfScore,
    tdp: product.tdp,
    price: product.price,
    featureScore: product.featureScore,
  });

  // Pengali dari market share pemain
  const shareMult = 0.3 + state.marketShare * 4;

  // Pengali dari event aktif
  const eventMult = getActiveEventMultiplier(state, product.category);

  // Kompetisi: makin banyak kompetitor aktif, makin terbagi
  const competitors = getActiveCompetitors(year);
  const competition = 1 / (1 + competitors.length * 0.15);

  // Umur produk (produk lama makin tidak laku)
  const ageTurns = state.turn - (product.launchTurn || state.turn);
  const ageDecay = Math.max(0.2, Math.pow(0.97, ageTurns));

  // Hitung
  const sales = Math.round(
    marketSize * fit * shareMult * eventMult * competition * ageDecay * 0.15
  );

  const revenue = sales * product.price;

  return { sales, revenue, fit: Math.round(fit * 100) };
}

// ===== Update market share pemain =====
// Dipengaruhi oleh: keberhasilan produk, pergerakan kompetitor
function updateMarketShare(state, recentSales) {
  let delta = 0;

  // Erosi alami: 0.05% per turn
  delta -= 0.0005;

  // Kontribusi dari produk yang baru rilis (2 turn terakhir)
  for (const s of recentSales) {
    if (s.turnsSinceLaunch <= 2) {
      delta += s.fit * 0.008;
    }
  }

  // Kompetitor bergerak: makin agresif, makin menggerus
  const activeComps = getActiveCompetitors(state.tahun);
  for (const c of activeComps) {
    delta -= c.aggression * 0.0005;
  }

  state.marketShare = Math.max(0.005, Math.min(0.75, state.marketShare + delta));
}

// ===== Simulasi kompetitor merilis produk =====
function simulateCompetitorActions(state, rng = Math.random) {
  const events = [];
  const activeComps = getActiveCompetitors(state.tahun);

  for (const c of activeComps) {
    // Chance rilis = aggression * 0.03 per turn (~1 rilis per 33 turn)
    if (rng() > c.aggression * 0.03) continue;

    // Pilih kategori fokus yang sudah unlock
    const availableCats = c.focus.filter(f => {
      if (f === 'mobile' || f === 'smartphone') return state.tahun >= 2007;
      if (f === 'gpu') return state.tahun >= 1999;
      if (f === 'laptop') return state.tahun >= 2001;
      return true;
    });
    if (availableCats.length === 0) continue;

    const cat = availableCats[Math.floor(rng() * availableCats.length)];

    // Kompetitor umumnya 0-1 node di belakang pemain
    const techs = getTechsUpToYear(state.tahun);
    const playerIdx = techs.findIndex(t => t.id === state.currentNode);
    const compIdx = Math.max(0, playerIdx - Math.floor(rng() * 2));
    const compTech = techs[compIdx] || techs[0];

    // Kompetitor merebut share
    const shareShift = 0.004 * c.aggression * (compTech.refPerf / 200);

    events.push({
      competitor: c,
      category: cat,
      tech: compTech,
      shareShift,
    });
  }

  return events;
}

// ===== Breakdown market share =====
function getMarketBreakdown(state) {
  const active = getActiveCompetitors(state.tahun);
  const comps = active.map(c => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    share: c.startingShare * (1 + (state.tahun - c.founded) * 0.01),
  }));
  const totalComp = comps.reduce((s, c) => s + c.share, 0);
  const others = Math.max(0, 1 - state.marketShare - totalComp);

  return {
    player: { share: state.marketShare },
    competitors: comps,
    others: { share: others },
  };
}

// ===== Pendapatan pasif dari produk lama =====
function calcPassiveIncome(state) {
  let total = 0;
  for (const p of state.products) {
    if (!p.launched) continue;
    const ageTurns = state.turn - p.launchTurn;
    if (ageTurns < 1) continue;
    // Produk lama memberi ~3% revenue awal per turn, menurun
    const decay = Math.max(0.05, Math.pow(0.96, ageTurns));
    total += p.revenue * 0.015 * decay;
  }
  return Math.round(total);
}
