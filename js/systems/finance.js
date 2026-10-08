// js/systems/finance.js
// Cash flow, operating costs, loans.
// Rebalanced for $5,000 starting economy.

// ===== Operating costs per turn =====
function calcOperatingCost(state) {
  const costs = { salary: 0, office: 0, marketing: 0, rnd: 0, total: 0 };

  // 1. Engineer salaries (already per turn)
  costs.salary = state.team.reduce((s, e) => s + e.salary, 0);

  // 2. Office rent: $50 base + $30 per engineer
  costs.office = 50 + state.team.length * 30;

  // 3. Marketing: $100 per product launched within last 6 turns
  for (const p of state.products) {
    if (!p.launched) continue;
    const ageTurns = state.turn - p.launchTurn;
    if (ageTurns <= 6) costs.marketing += 100;
  }

  // 4. R&D burn: portion of active project budget per turn
  costs.rnd = state.projects
    .filter(p => p.status === 'active')
    .reduce((s, p) => s + Math.round(p.designBudget / 15), 0);

  costs.total = costs.salary + costs.office + costs.marketing + costs.rnd;
  return costs;
}

// ===== Profit/loss for reporting =====
function calcProfitLoss(state, income, costs) {
  return { income, costs, net: income - costs.total };
}

// ===== Bankruptcy check =====
function checkBankruptcy(state) {
  if (state.uang <= 0) {
    return { bankrupt: true, reason: 'Out of cash.' };
  }
  const costs = calcOperatingCost(state);
  if (state.uang < costs.total * 3) {
    return { bankrupt: false, warning: 'Cash is running low. Cut spending.' };
  }
  return { bankrupt: false };
}

// ===== Loan capacity =====
function canTakeLoan(state) {
  const maxLoan = Math.round(state.totalRevenue * 0.4 + 2000);
  const currentDebt = state.debt || 0;
  const remaining = maxLoan - currentDebt;
  return { ok: remaining > 500, max: remaining };
}

// ===== Take a loan =====
function takeLoan(state, amount) {
  const check = canTakeLoan(state);
  if (!check.ok || amount > check.max) return { success: false };
  state.uang += amount;
  state.debt = (state.debt || 0) + amount;
  state.loanTurns = (state.loanTurns || 0) + 20;
  return { success: true, amount };
}

// ===== Debt payment per turn =====
function payDebtTick(state) {
  if (!state.debt || state.debt <= 0) return 0;
  const monthlyPayment = Math.round(state.debt * 0.06);
  const payment = Math.min(monthlyPayment, state.uang);
  state.uang -= payment;
  state.debt = Math.max(0, state.debt - payment);
  return payment;
}
