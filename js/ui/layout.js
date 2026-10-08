// js/ui/layout.js
// Helper UI global: navigasi tab, topbar, log, toast, modal, format.
// Semua panel lain memakai file ini.

// ===== State UI lokal =====
let currentPanel = 'dashboard';
const lastValues = {};

// ===== SVG icons =====
const ICONS = {
  cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/></svg>',
  gpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>',
  os:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 20h8M12 18v2"/></svg>',
  laptop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="4" y="5" width="16" height="11" rx="1"/><path d="M2 19h20"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>',
  empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M9 15c1-1 2-1.5 3-1.5s2 .5 3 1.5"/></svg>',
  team:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="7" r="3"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><path d="M20 6 9 17l-5-5"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
};

function iconOf(cat) { return ICONS[cat] || ICONS.cpu; }

// ===== Escape HTML =====
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]
  ));
}

// ===== Format =====
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function formatDate(tahun, bulan) {
  return `${MONTH_NAMES[bulan - 1]} ${tahun}`;
}

function formatMoney(n) {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(Math.round(n));
  return sign + '$' + abs.toLocaleString('id-ID');
}

function formatMoneyShort(n) {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1e9) return sign + '$' + (abs / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return sign + '$' + (abs / 1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return sign + '$' + (abs / 1e3).toFixed(0) + 'K';
  return sign + '$' + Math.round(abs);
}

function formatPercent(n, digits = 1) {
  return (n * 100).toFixed(digits) + '%';
}

// ===== Toast =====
function toast(msg, type = 'info', title = null) {
  const wrap = document.getElementById('toast-wrap');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const displayTitle = title || (type === 'good' ? 'Berhasil' : type === 'bad' ? 'Gagal' : type === 'warn' ? 'Perhatian' : 'Info');
  el.innerHTML = `
    <div class="title">${escapeHtml(displayTitle)}</div>
    <div class="desc">${escapeHtml(msg)}</div>
  `;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    el.style.transition = 'all 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 3400);
}

// ===== Modal =====
function openModal({ title, body, actions = [] }) {
  const wrap = document.getElementById('modal-wrap');
  wrap.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <h3>${escapeHtml(title)}</h3>
        <button class="btn sm" data-modal-close>✕</button>
      </div>
      <div class="modal-body">${body}</div>
      <div class="modal-foot">
        ${actions.map((a, i) => `
          <button class="btn ${a.type || ''}" data-modal-action="${i}">
            ${escapeHtml(a.label)}
          </button>
        `).join('')}
      </div>
    </div>
  `;
  wrap.classList.add('active');

  wrap.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);
  wrap.querySelectorAll('[data-modal-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.modalAction);
      const action = actions[idx];
      if (action?.onClick) action.onClick();
      if (action?.closeOnClick !== false) closeModal();
    });
  });
}

function closeModal() {
  const wrap = document.getElementById('modal-wrap');
  wrap.classList.remove('active');
  wrap.innerHTML = '';
}

// ===== Count-up animation =====
function animateNumber(el, newVal, formatter) {
  const key = el.id;
  const old = lastValues[key] ?? newVal;
  lastValues[key] = newVal;
  if (old === newVal || typeof newVal !== 'number') {
    el.textContent = formatter(newVal);
    return;
  }
  const dur = 400;
  const start = performance.now();
  function frame(t) {
    const p = Math.min((t - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const v = old + (newVal - old) * eased;
    el.textContent = formatter(v);
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ===== Render Topbar =====
function renderTopbar() {
  animateNumber(document.getElementById('stat-money'), state.uang, v => formatMoneyShort(v));
  document.getElementById('stat-date').textContent = formatDate(state.tahun, state.bulan);
  document.getElementById('stat-turn').textContent = state.turn;
  document.getElementById('stat-rp').textContent = state.researchPoint.toLocaleString('id-ID') + ' RP';
  document.getElementById('stat-share').textContent = formatPercent(state.marketShare);
  document.getElementById('stat-team').textContent = state.team.length;
  document.getElementById('brand-sub').textContent = `Semiconductor Empire · ${state.tahun}`;
}

// ===== Render Bottom Bar =====
function renderBottomBar() {
  document.getElementById('bb-turn').textContent = state.turn;
  document.getElementById('bb-date').textContent = formatDate(state.tahun, state.bulan);
}

function setBottomNote(text, kind = '') {
  const el = document.getElementById('bb-note');
  el.textContent = text;
  el.className = 'bb-note ' + kind;
}

// ===== Render Log =====
function renderLog() {
  const body = document.getElementById('log-body');
  const count = document.getElementById('log-count');
  count.textContent = state.log.length + '';

  if (state.log.length === 0) {
    body.innerHTML = `<div class="empty">${ICONS.empty}<h3>Belum ada berita</h3><p>Feed akan terisi saat turn berjalan.</p></div>`;
    return;
  }

  body.innerHTML = state.log.slice(0, 60).map(item => `
    <div class="log-item ${item.type || 'info'}">
      <div class="dot"></div>
      <div class="body">
        <div class="date">T${item.turn} · ${formatDate(item.tahun, item.bulan)}</div>
        <div class="text">${escapeHtml(item.text)}</div>
      </div>
    </div>
  `).join('');
}

// ===== Panel header helper =====
function setPanel(title, hint, html) {
  document.getElementById('panel-title').textContent = title;
  document.getElementById('panel-hint').textContent = hint;
  document.getElementById('panel-body').innerHTML = html;
}

function setPanelBody(html) {
  document.getElementById('panel-body').innerHTML = html;
}

// ===== Panel router =====
function renderPanel(name) {
  currentPanel = name;
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.panel === name);
  });
  switch (name) {
    case 'dashboard':  showDashboard();  break;
    case 'design':     showDesign();     break;
    case 'production': showProduction(); break;
    case 'team':       showTeam();       break;
    case 'research':   showResearch();   break;
    case 'market':     showMarket();     break;
    case 'finance':    showFinance();    break;
    default:           showDashboard();
  }
}

function refreshCurrentPanel() {
  // Design tidak auto-refresh supaya input user tidak hilang
  if (currentPanel === 'design') return;
  renderPanel(currentPanel);
}

// ===== Bind navigasi =====
function bindNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => renderPanel(btn.dataset.panel));
  });
}

// ===== Badge di nav (opsional) =====
function setNavBadge(panelName, show) {
  const btn = document.querySelector(`.nav-btn[data-panel="${panelName}"]`);
  if (!btn) return;
  const existing = btn.querySelector('.badge-dot');
  if (show && !existing) {
    const dot = document.createElement('div');
    dot.className = 'badge-dot';
    btn.appendChild(dot);
  } else if (!show && existing) {
    existing.remove();
  }
}
