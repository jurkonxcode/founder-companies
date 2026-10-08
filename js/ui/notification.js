// js/ui/notifications.js
// Notification bell + drawer. Month-aware headlines + R&D activity.

const MAX_NOTIFICATIONS = 80;

// =========================================================
// PUSH helper — used by R&D system + headlines
// =========================================================
function pushNotification(opts) {
  if (!state) return;
  if (!state.notifications) state.notifications = [];
  const id = opts.id || ('n_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
  if (state.notifications.find(n => n.id === id)) return;

  state.notifications.unshift({
    id,
    year: opts.year || state.tahun,
    month: opts.month || state.bulan,
    cat: opts.cat || 'general',
    title: opts.title || '',
    desc: opts.desc || '',
    turn: state.turn,
    read: false,
    timestamp: Date.now(),
    isActivity: !!opts.isActivity,   // R&D events get a badge
  });
  if (state.notifications.length > MAX_NOTIFICATIONS) {
    state.notifications.length = MAX_NOTIFICATIONS;
  }
  updateBellBadge();
}

// =========================================================
// HEADLINES (monthly check)
// =========================================================
function checkMonthHeadlines(year, month) {
  const headlines = getHeadlinesForMonth(year, month);
  if (headlines.length === 0) return;

  let newCount = 0;
  headlines.forEach((h, i) => {
    const id = `h_${h.y}_${h.m}_${h.cat}_${i}`;
    if (state.notifications.find(n => n.id === id)) return;

    pushNotification({
      id,
      year: h.y, month: h.m, cat: h.cat,
      title: h.title,
      desc: h.desc,
    });
    newCount++;

    if (i === 0) {
      toast(h.desc, 'info', `📰 ${h.y} · ${h.title}`);
    }
    addLog(`[${h.y}] ${h.title} — ${h.desc}`, 'milestone');
  });

  if (newCount > 0) updateBellBadge();
}

function checkYearHeadline(year) {
  for (let m = 1; m <= 12; m++) checkMonthHeadlines(year, m);
}

// =========================================================
// BADGE
// =========================================================
function updateBellBadge() {
  const badge = document.getElementById('bell-badge');
  if (!badge) return;
  const unread = (state.notifications || []).filter(n => !n.read).length;
  if (unread > 0) {
    badge.textContent = unread > 9 ? '9+' : String(unread);
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// =========================================================
// DRAWER
// =========================================================
function openNotifDrawer() {
  const drawer = document.getElementById('notif-drawer');
  const backdrop = document.getElementById('notif-backdrop');
  if (!drawer) return;
  renderNotifDrawer();
  drawer.classList.add('open');
  backdrop?.classList.add('open');

  setTimeout(() => {
    (state.notifications || []).forEach(n => n.read = true);
    updateBellBadge();
    if (typeof saveGame === 'function') saveGame(true);
  }, 800);
}

function closeNotifDrawer() {
  document.getElementById('notif-drawer')?.classList.remove('open');
  document.getElementById('notif-backdrop')?.classList.remove('open');
}

function renderNotifDrawer() {
  const body = document.getElementById('notif-drawer-body');
  if (!body) return;
  const notifs = state.notifications || [];
  if (notifs.length === 0) {
    body.innerHTML = `
      <div class="notif-empty">
        <div class="notif-empty-icon">📰</div>
        <div class="notif-empty-title">No notifications yet</div>
        <div class="notif-empty-desc">Headlines and R&D activity will appear here.</div>
      </div>
    `;
    return;
  }

  // Group by year, but R&D activity goes on top
  const activities = notifs.filter(n => n.isActivity).slice(0, 6);
  const news = notifs.filter(n => !n.isActivity);

  const byYear = {};
  news.forEach(n => {
    if (!byYear[n.year]) byYear[n.year] = [];
    byYear[n.year].push(n);
  });
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const catMeta = (typeof HEADLINE_CATEGORIES !== 'undefined') ? HEADLINE_CATEGORIES : {};

  body.innerHTML = `
    ${activities.length > 0 ? `
      <div class="notif-year-group">
        <div class="notif-year-label">R&D Activity</div>
        ${activities.map(n => {
          const cat = catMeta[n.cat] || { label: 'Activity', color: '#c9542a' };
          return `
            <div class="notif-item notif-activity ${n.read ? '' : 'unread'}">
              <div class="notif-tag" style="background:${cat.color}20; color:${cat.color}">
                ${escapeHtml(cat.label)}
              </div>
              <div class="notif-content">
                <div class="notif-meta">T${n.turn} · ${monthNames[(n.month||1)-1]} ${n.year}</div>
                <div class="notif-title">${escapeHtml(n.title)}</div>
                <div class="notif-desc">${escapeHtml(n.desc)}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    ` : ''}

    ${years.map(yr => `
      <div class="notif-year-group">
        <div class="notif-year-label">${yr}</div>
        ${byYear[yr].sort((a, b) => (a.month || 1) - (b.month || 1)).map(n => {
          const cat = catMeta[n.cat] || { label: 'Industry', color: '#786d5b' };
          const mLabel = monthNames[(n.month || 1) - 1];
          return `
            <div class="notif-item ${n.read ? '' : 'unread'}">
              <div class="notif-tag" style="background:${cat.color}20; color:${cat.color}">
                ${escapeHtml(cat.label)}
              </div>
              <div class="notif-content">
                <div class="notif-meta">${mLabel} ${n.year}</div>
                <div class="notif-title">${escapeHtml(n.title)}</div>
                <div class="notif-desc">${escapeHtml(n.desc)}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `).join('')}
  `;
}

// =========================================================
// BINDINGS
// =========================================================
function bindNotificationBell() {
  const bell = document.getElementById('btn-bell');
  if (!bell || bell.dataset.bound === '1') return;
  bell.dataset.bound = '1';

  bell.addEventListener('click', openNotifDrawer);
  document.getElementById('notif-drawer-close')?.addEventListener('click', closeNotifDrawer);
  document.getElementById('notif-backdrop')?.addEventListener('click', closeNotifDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNotifDrawer(); });
  updateBellBadge();
}

document.addEventListener('DOMContentLoaded', bindNotificationBell);
window.addEventListener('load', bindNotificationBell);
setTimeout(bindNotificationBell, 500);

// Make pushNotification globally accessible
window.pushNotification = pushNotification;
