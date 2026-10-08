// js/ui/panelFinance.js
// Panel keuangan: kas, biaya, utang, P&L.

function showFinance() {
  const opCost = calcOperatingCost(state);
  const bankruptcy = checkBankruptcy(state);
  const loan = canTakeLoan(state);

  // Pendapatan 5 turn terakhir dari log
  const recentIncome = state.products
    .filter(p => p.launched && state.turn - p.launchTurn < 5)
    .reduce((s, p) => s + p.revenue, 0);

  const netPerTurn = recentIncome - opCost.total;

  setPanel('Keuangan', netPerTurn >= 0 ? 'sehat' : 'perhatian', `
    ${bankruptcy.warning ? `
      <div class="card" style="border-color:var(--warn)">
        <div class="row between">
          <div class="row">
            ${ICONS.alert}
            <div>
              <h3 style="color:var(--warn)">Peringatan</h3>
              <div class="meta">${bankruptcy.warning}</div>
            </div>
          </div>
        </div>
      </div>
    ` : ''}

    <div class="card-grid">
      <div class="card">
        <div class="meta">KAS SAAT INI</div>
        <div style="font-size:26px;font-family:var(--font-mono);font-weight:700;color:${state.uang > 1000000 ? 'var(--good)' : 'var(--fg-0)'}">
          ${formatMoneyShort(state.uang)}
        </div>
      </div>
      <div class="card">
        <div class="meta">TOTAL PENDAPATAN</div>
        <div style="font-size:26px;font-family:var(--font-mono);font-weight:700;color:var(--good)">
          ${formatMoneyShort(state.totalRevenue)}
        </div>
      </div>
      <div class="card">
        <div class="meta">UTANG</div>
        <div style="font-size:26px;font-family:var(--font-mono);font-weight:700;color:${state.debt > 0 ? 'var(--bad)' : 'var(--fg-2)'}">
          ${state.debt > 0 ? formatMoneyShort(state.debt) : '—'}
        </div>
      </div>
    </div>

    <div class="section-title">Biaya Operasional per Turn</div>
    <div class="card">
      <div class="stat-row"><span class="k">Gaji engineer (${state.team.length})</span><span class="v">${formatMoney(opCost.salary)}</span></div>
      <div class="stat-row"><span class="k">Sewa kantor</span><span class="v">${formatMoney(opCost.office)}</span></div>
      <div class="stat-row"><span class="k">Marketing</span><span class="v">${formatMoney(opCost.marketing)}</span></div>
      <div class="stat-row"><span class="k">R&D aktif</span><span class="v">${formatMoney(opCost.rnd)}</span></div>
      <div class="divider"></div>
      <div class="stat-row">
        <span class="k"><strong>Total</strong></span>
        <span class="v bad"><strong>${formatMoney(opCost.total)}</strong></span>
      </div>
    </div>

    <div class="section-title">Aksi Keuangan</div>
    <div class="card">
      ${state.debt > 0 ? `
        <div class="row between mb-1">
          <div>
            <h3>Bayar Utang</h3>
            <div class="meta">Sisa ${formatMoneyShort(state.debt)}</div>
          </div>
          <button class="btn sm" id="pay-debt">Bayar 20%</button>
        </div>
        <div class="divider"></div>
      ` : ''}
      <div class="row between">
        <div>
          <h3>Ambil Pinjaman</h3>
          <div class="meta">Maks: ${formatMoneyShort(loan.max)}</div>
        </div>
        <button class="btn" id="take-loan" ${loan.ok ? '' : 'disabled'}>Ajukan</button>
      </div>
    </div>
  `);

  bindFinance();
}

function bindFinance() {
  document.getElementById('pay-debt')?.addEventListener('click', () => {
    if (!state.debt) return;
    const pay = Math.min(state.debt, Math.round(state.debt * 0.2));
    if (state.uang < pay) { toast('Dana tidak cukup.', 'bad'); return; }
    state.uang -= pay;
    state.debt -= pay;
    addLog(`Bayar utang: ${formatMoneyShort(pay)}. Sisa ${formatMoneyShort(state.debt)}.`, 'info');
    toast('Pembayaran berhasil.', 'good');
    showFinance();
  });

  document.getElementById('take-loan')?.addEventListener('click', () => {
    const check = canTakeLoan(state);
    if (!check.ok) { toast('Tidak bisa ambil pinjaman.', 'bad'); return; }

    openModal({
      title: 'Ambil Pinjaman',
      body: `
        <p>Berapa yang ingin dipinjam?</p>
        <div class="field mt-2">
          <label>Jumlah</label>
          <input id="loan-amount" type="number" min="50000" max="${check.max}" value="${Math.min(500000, check.max)}" step="50000">
        </div>
        <p class="muted" style="font-size:11px">Bunga 6% per turn, dibayar otomatis.</p>
      `,
      actions: [
        { label: 'Batal' },
        {
          label: 'Pinjam',
          type: 'primary',
          onClick: () => {
            const amount = parseInt(document.getElementById('loan-amount').value);
            const res = takeLoan(state, amount);
            if (res.success) {
              addLog(`Pinjaman diterima: ${formatMoneyShort(amount)}.`, 'warn');
              toast(`Pinjaman ${formatMoneyShort(amount)} diterima.`, 'warn');
              renderPanel('finance');
            }
          },
        },
      ],
    });
  });
}
