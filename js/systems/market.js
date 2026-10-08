// js/systems/market.js
// Demand, sales, market share, competitor simulation.
// Difficulty now affects rival behavior.

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
// Now respects difficulty: rivalAggression scales the natural drift.
function updateMarketShare(state, recentSales) {
  const diff = getActiveDifficulty(state);
  let delta = 0;

  // Natural erosion — scaled by difficulty
  delta -= 0.0005 * diff.rivalAggression;

  // Boost from recently launched successful products
  for (const s of recentSales) {
    if (s.turnsSinceLaunch <= 2) {
      delta += s.fit * 0.008;
    }
  }

  // Competitor pressure — scaled by difficulty
  const activeComps = getActiveCompetitors(state.tahun);
  for (const c of activeComps) {
    delta -= c.aggression * 0.0005 * diff.rivalAggression;
  }

  state.marketShare = Math.max(0.005, Math.min(0.75, state.marketShare + delta));
}

// ===== Simulate competitor actions =====
// Now respects difficulty:
//   - rivalAggression multiplies release chance
//   - rivalAnswerScope determines how many categories they counter
//   - rivalReactionTurns gates how quickly they respond after your launch
function simulateCompetitorActions(state, rng = Math.random) {
  const diff = getActiveDifficulty(state);
  const events = [];
  const activeComps = getActiveCompetitors(state.tahun);

  // Find last launch turn (used to enforce reaction delay)
  const lastLaunch = state.products
    .filter(p => p.launched)
    .sort((a, b) => (b.launchTurn || 0) - (a.launchTurn || 0))[0];
  const turnsSinceLaunch = lastLaunch ? state.turn - lastLaunch.launchTurn : 999;

  // Rivals are slower to respond right after a launch on lower difficulties
  let responseGate = 1.0;
  if (turnsSinceLaunch < diff.rivalReactionTurns) {
    responseGate = 0.3;
  }

  for (const c of activeComps) {
    const chance = c.aggression * 0.03 * diff.rivalAggression * responseGate;
    if (rng() > chance) continue;

    // Available categories for this competitor
    const availableCats = c.focus.filter(f => {
      if (f === 'mobile' || f === 'smartphone') return state.tahun >= 2007;
      if (f === 'gpu') return state.tahun >= 1999;
      if (f === 'laptop') return state.tahun >= 2001;
      return true;
    });
    if (availableCats.length === 0) continue;

    // Pick how many categories this release covers
    const scope = Math.min(diff.rivalAnswerScope, availableCats.length);
    const shuffled = [...availableCats].sort(() => rng() - 0.5);
    const chosen = shuffled.slice(0, scope);

    // Determine competitor node (0-1 behind player)
    const techs = getTechsUpToYear(state.tahun);
    const playerIdx = techs.findIndex(t => t.id === state.currentNode);
    const compIdx = Math.max(0, playerIdx - Math.floor(rng() * 2));
    const compTech = techs[compIdx] || techs[0];

    for (const cat of chosen) {
      const shareShift = 0.004 * c.aggression * (compTech.refPerf / 200) * diff.rivalAggression;
      events.push({
        competitor: c,
        category: cat,
        tech: compTech,
        shareShift,
      });
    }
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
// =========================================================
// PUBLIC RATING — how the market perceives a launched product
// =========================================================
// Rating 0–100 dengan tier S/A/B/C/D
// Dipengaruhi oleh: segment fit, value (perf/price), TDP, features.
// Deterministic per product (berdasarkan ID) supaya konsisten saat reload.

function computePublicRating(product, state) {
  const segment = (typeof getSegment === 'function') ? getSegment(product.segment) : null;
  if (!segment) return { score: 50, tier: 'B', verdict: 'Unknown' };

  // 1. Segment fit (0–100)
  const fit = (typeof calcSegmentFit === 'function')
    ? calcSegmentFit(segment, {
        perfScore: product.perfScore,
        tdp: product.tdp,
        price: product.price,
        featureScore: product.featureScore,
      }) * 100
    : 50;

  // 2. Value: perf per dollar vs segment sweet spot
  const expectedPerfPerPrice = Math.max(0.5, segment.priceSweet / 100);
  const actualPerfPerPrice = product.perfScore / Math.max(1, product.price);
  const valueRatio = actualPerfPerPrice / expectedPerfPerPrice;
  const valueScore = Math.max(0, Math.min(100, 40 + (valueRatio - 1) * 70));

  // 3. Feature completeness
  const featureScore = Math.max(0, Math.min(100, product.featureScore || 50));

  // 4. TDP penalty vs segment priority
  let tdpScore = 100;
  const tdpSensitivity = segment.tdpWeight || 0.15;
  if (tdpSensitivity > 0.25 && product.tdp > 40) {
    tdpScore = Math.max(0, 100 - (product.tdp - 40) * (1.8 * tdpSensitivity));
  } else if (product.tdp > 120) {
    tdpScore = Math.max(0, 100 - (product.tdp - 120) * 0.8);
  }

  // 5. Timing bonus: rilis lebih awal di segmen = lebih fresh
  const yearsInSegment = Math.max(0, state.tahun - (segment.year || 1995));
  const timingBonus = Math.min(8, yearsInSegment * 0.4);

  // Weighted composite
  const composite =
    fit         * 0.35 +
    valueScore  * 0.35 +
    featureScore* 0.15 +
    tdpScore    * 0.15 +
    timingBonus;

  // Deterministic per-product noise (public opinion isn't fully rational)
  const seed = String(product.id || 'x')
    .split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const noise = ((seed % 11) - 5); // -5 to +5

  const score = Math.max(0, Math.min(100, Math.round(composite + noise)));

  // Tier
  let tier, tierLabel;
  if (score >= 90)      { tier = 'S'; tierLabel = 'Legendary'; }
  else if (score >= 75) { tier = 'A'; tierLabel = 'Excellent'; }
  else if (score >= 60) { tier = 'B'; tierLabel = 'Good'; }
  else if (score >= 40) { tier = 'C'; tierLabel = 'Mixed'; }
  else                  { tier = 'D'; tierLabel = 'Flop'; }

  // Verdict — pilih narasi berdasarkan dimensi terlemah
  let verdict = tierLabel;
  const dims = [
    { key: 'value',      score: valueScore,   low: 'Overpriced',      good: 'Great value' },
    { key: 'fit',        score: fit,          low: 'Off-target',      good: 'Perfect fit' },
    { key: 'tdp',        score: tdpScore,     low: 'Too hot',         good: 'Efficient' },
    { key: 'feature',    score: featureScore, low: 'Feature-poor',    good: 'Feature-rich' },
  ];
  const weakest = dims.reduce((a, b) => a.score < b.score ? a : b);
  const strongest = dims.reduce((a, b) => a.score > b.score ? a : b);

  if (score >= 75)      verdict = strongest.good;
  else if (score >= 55) verdict = 'Solid';
  else if (score < 35)  verdict = weakest.low;
  else                  verdict = 'Mixed reception';

  return { score, tier, tierLabel, verdict };
}

function getRatingTierColor(tier) {
  return ({
    S: '#c9542a',
    A: '#3d8b5f',
    B: '#2e8391',
    C: '#b8852b',
    D: '#b83333',
  })[tier] || '#786d5b';
}

// Average rating across all launched products
function calcAverageRating(launched) {
  if (!launched || launched.length === 0) return 0;
  const total = launched.reduce((s, p) => s + (computePublicRating(p, state).score), 0);
  return Math.round(total / launched.length);
}
