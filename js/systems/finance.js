// js/systems/finance.js
// Kas, pengeluaran bulanan, laba/rugi.

// ===== Biaya operasional per turn =====
function calcOperatingCost(state) {
  const costs = {
    salary: 0,
    office: 0,
    marketing: 0,
    rnd: 0,        // biaya proyek yang aktif
    total: 0,
  };

  // 1. Gaji engineer
  costs.salary = state.team.reduce((s, e) => s + e.salary, 0) / 3; // 1 turn = 10 hari, ~1/3 bulan

  // 2. Sewa kantor: skala dengan jumlah tim
  const teamSize = state.team.length;
  costs.office = Math.round(1000 + teamSize * 800);

  // 3. Marketing: produk yang baru diluncurkan
  for (const p of state.products) {
    if (!p.launched) continue;
    const ageTurns = state.turn - p.launchTurn;
    if (ageTurns <= 6) {
      costs.marketing += 5000; // aktif marketing 6 turn pertama
    }
  }

  // 4. Biaya R&D (dari proyek aktif)
  // Ini dihitung terpisah di production.js, tapi kita total di sini
  // untuk reporting
  costs.rnd = state.projects
    .filter(p => p.status === 'active')
    .reduce((s, p) => s + Math.round(p.designBudget / 15), 0); // rata-rata per turn

  costs.total = costs.salary + costs.office + costs.marketing + costs.rnd;
  return costs;
}

// ===== Laba/rugi per turn =====
function calcProfitLoss(state, income, costs) {
  return {
    income,
    costs,
    net: income - costs.total,
  };
}

// ===== Cek kebangkrutan =====
function checkBankruptcy(state) {
  if (state.uang <= 0) {
    return { bankrupt: true, reason: 'Kas habis.' };
  }
  // Cek: kalau pengeluaran 3 turn melebihi kas, peringatkan
  const costs = calcOperatingCost(state);
  if (state.uang < costs.total * 3) {
    return { bankrupt: false, warning: 'Kas menipis. Kurangi pengeluaran.' };
  }
  return { bankrupt: false };
}

// ===== Bisa ambil utang? =====
function canTakeLoan(state) {
  const maxLoan = Math.round(state.totalRevenue * 0.5 + 500000);
  const currentDebt = state.debt || 0;
  const remaining = maxLoan - currentDebt;
  return { ok: remaining > 50000, max: remaining };
}

// ===== Ambil utang =====
function takeLoan(state, amount) {
  const check = canTakeLoan(state);
  if (!check.ok || amount > check.max) return { success: false };
  state.uang += amount;
  state.debt = (state.debt || 0) + amount;
  state.loanTurns = (state.loanTurns || 0) + 20; // 20 turn untuk bayar
  return { success: true, amount };
}

// ===== Bayar utang per turn =====
function payDebtTick(state) {
  if (!state.debt || state.debt <= 0) return 0;
  const monthlyPayment = Math.round(state.debt * 0.06); // 6% per turn
  const payment = Math.min(monthlyPayment, state.uang);
  state.uang -= payment;
  state.debt = Math.max(0, state.debt - payment);
  return payment;
}
