// js/systems/market.js
// Demand, sales, market share, competitor simulation.
// Rebalanced for $5k economy.

// ===== Demand multiplier from active events =====
function getActiveEventMultiplier(state, categoryId) {
  let mult = 1.0;
  for (const ev of state.triggeredEvents) {
    const turnsSince = state.turn - ev.turn;
    if (turnsSince < 0 || turnsSince > 12) continue;
    if (ev.effects && ev.effects.demand && ev.effects.demand[categoryId]) {
      mult *= ev.effects.demand[categoryId];
    }
  }
  return mult;
}

// ===== Calculate product sales =====
function calcProductSales(product, state, year) {
  const segment = getSegment(product.segment);
  if (!segment) return { sales: 0, revenue: 0, fit: 0 };

  const yearsSinceLaunch = Math.max(0, year - segment.year);
  const marketSize = segment.marketSize * Math.pow(1 + segment.growthRate, yearsSinceLaunch);

  const fit = calcSegmentFit(segment, {
    perfScore: product.perfScore,
    tdp: product.tdp,
    price: product.price,
    featureScore: product.featureScore,
  });

  const shareMult = 0.3 + state.marketShare * 4;
  const eventMult = getActiveEventMultiplier(state, product.category);

  const competitors = getActiveCompetitors(year);
  const competition = 1 / (1 + competitors.length * 0.15);

  const ageTurns = state.turn - (product.launchTurn || state.turn);
  const ageDecay = Math.max(0.2, Math.pow(0.97, ageTurns));

  const sales = Math.round(
    marketSize * fit * shareMult * eventMult * competition * ageDecay * 0.02
    * archPerfMult(product.category)
  );

  const revenue = sales * product.price;
  return { sales, revenue, fit: Math.round(fit * 100) };
}

// ===== Update player market share =====
function updateMarketShare(state, recentSales) {
  let delta = 0;
  delta -= 0.0005;

  for (const s of recentSales) {
    if (s.turnsSinceLaunch <= 2) {
      delta += s.fit * 0.008;
    }
  }

  const activeComps = getActiveCompetitors(state.tahun);
  for (const c of activeComps) {
    delta -= c.aggression * 0.0005;
  }

  state.marketShare = Math.max(0.005, Math.min(0.75, state.marketShare + delta));
}

// ===== Simulate competitor actions =====
function simulateCompetitorActions(state, rng = Math.random) {
  const events = [];
  const activeComps = getActiveCompetitors(state.tahun);

  for (const c of activeComps) {
    if (rng() > c.aggression * 0.03) continue;

    const availableCats = c.focus.filter(f => {
      if (f === 'mobile' || f === 'smartphone') return state.tahun >= 2007;
      if (f === 'gpu') return state.tahun >= 1999;
      if (f === 'laptop') return state.tahun >= 2001;
      return true;
    });
    if (availableCats.length === 0) continue;

    const cat = availableCats[Math.floor(rng() * availableCats.length)];

    const techs = getTechsUpToYear(state.tahun);
    const playerIdx = techs.findIndex(t => t.id === state.currentNode);
    const compIdx = Math.max(0, playerIdx - Math.floor(rng() * 2));
    const compTech = techs[compIdx] || techs[0];

    const shareShift = 0.004 * c.aggression * (compTech.refPerf / 200);

    events.push({ competitor: c, category: cat, tech: compTech, shareShift });
  }

  return events;
}

// ===== Market share breakdown =====
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

// ===== Passive income from existing products =====
function calcPassiveIncome(state) {
  let total = 0;
  for (const p of state.products) {
    if (!p.launched) continue;
    const ageTurns = state.turn - p.launchTurn;
    if (ageTurns < 1) continue;
    const decay = Math.max(0.05, Math.pow(0.94, ageTurns));
    total += p.revenue * 0.03 * decay;
  }
  return Math.round(total);
}
