// js/ui/notifications.js
// Notification bell + drawer for real-world tech headlines.

const MAX_NOTIFICATIONS = 30;

// =========================================================
// PUBLIC — called on new year
// =========================================================
function checkYearHeadline(year) {
  const headlines = getHeadlinesForYear(year);
  if (headlines.length === 0) return;

  if (!state.notifications) state.notifications = [];
  const existingIds = new Set(state.notifications.map(n => n.id));

  headlines.forEach((h, i) => {
    const id = `${year}_${i}`;
    if (existingIds.has(id)) return;

    const notif = {
      id,
      year,
      title: h.title,
      desc: h.desc,
      turn: state.turn,
      read: false,
      timestamp: Date.now(),
    };
    state.notifications.unshift(notif);

    // Toast the first one only (avoid spam)
    if (i === 0) {
      toast(h.desc, 'info', `📰 ${year} · ${h.title}`);
    }
    addLog(`[${year}] ${h.title} — ${h.desc}`, 'milestone');
  });

  // Trim
  if (state.notifications.length > MAX_NOTIFICATIONS) {
    state.notifications.length = MAX_NOTIFICATIONS;
  }

  updateBellBadge();
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

  // Mark all as read (after a short delay so user sees the badge clear)
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
        <div class="notif-empty-title">No news yet</div>
        <div class="notif-empty-desc">Headlines from real world history appear as you pass each year.</div>
      </div>
    `;
    return;
  }

  // Group by year
  const byYear = {};
  notifs.forEach(n => {
    if (!byYear[n.year]) byYear[n.year] = [];
    byYear[n.year].push(n);
  });

  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

  body.innerHTML = years.map(yr => `
    <div class="notif-year-group">
      <div class="notif-year-label">${yr}</div>
      ${byYear[yr].map(n => `
        <div class="notif-item ${n.read ? '' : 'unread'}">
          <div class="notif-dot"></div>
          <div class="notif-content">
            <div class="notif-title">${escapeHtml(n.title)}</div>
            <div class="notif-desc">${escapeHtml(n.desc)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');
}

// =========================================================
// BINDINGS
// =========================================================
function bindNotificationBell() {
  const bell = document.getElementById('btn-bell');
  if (!bell) return;
  if (bell.dataset.bound === '1') return;
  bell.dataset.bound = '1';

  bell.addEventListener('click', openNotifDrawer);
  document.getElementById('notif-drawer-close')?.addEventListener('click', closeNotifDrawer);
  document.getElementById('notif-backdrop')?.addEventListener('click', closeNotifDrawer);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeNotifDrawer();
  });

  updateBellBadge();
}

// Self-bind when DOM is ready
document.addEventListener('DOMContentLoaded', bindNotificationBell);
window.addEventListener('load', bindNotificationBell);
setTimeout(bindNotificationBell, 500);
