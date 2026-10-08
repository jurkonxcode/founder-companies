// js/ui/notifications.js
// Notification bell + drawer. Month-aware headlines with categories.

const MAX_NOTIFICATIONS = 60;

// =========================================================
// PUBLIC — called every turn (from main.js)
// =========================================================
function checkMonthHeadlines(year, month) {
  const headlines = getHeadlinesForMonth(year, month);
  if (headlines.length === 0) return;

  if (!state.notifications) state.notifications = [];
  const existingIds = new Set(state.notifications.map(n => n.id));
  let newCount = 0;

  headlines.forEach((h, i) => {
    const id = `${h.y}_${h.m}_${h.cat}_${i}`;
    if (existingIds.has(id)) return;

    const notif = {
      id,
      year: h.y,
      month: h.m,
      cat: h.cat,
      title: h.title,
      desc: h.desc,
      turn: state.turn,
      read: false,
      timestamp: Date.now(),
    };
    state.notifications.unshift(notif);
    newCount++;

    // Toast the first headline only (avoid spam)
    if (i === 0) {
      const catLabel = (HEADLINE_CATEGORIES[h.cat] || {}).label || '';
      toast(h.desc, 'info', `📰 ${h.y} · ${h.title}`);
    }
    addLog(`[${h.y}] ${h.title} — ${h.desc}`, 'milestone');
  });

  // Trim oldest
  if (state.notifications.length > MAX_NOTIFICATIONS) {
    state.notifications.length = MAX_NOTIFICATIONS;
  }

  if (newCount > 0) updateBellBadge();
}

// Keep the old name as alias for backward compatibility
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
        <div class="notif-empty-title">No news yet</div>
        <div class="notif-empty-desc">Headlines from real-world history appear as you pass through the years.</div>
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
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  body.innerHTML = years.map(yr => {
    // Sort within year by month (ascending)
    const items = byYear[yr].slice().sort((a, b) => (a.month || 0) - (b.month || 0));
    return `
      <div class="notif-year-group">
        <div class="notif-year-label">${yr}</div>
        ${items.map(n => {
          const cat = HEADLINE_CATEGORIES[n.cat] || HEADLINE_CATEGORIES.general;
          const mLabel = monthNames[(n.month || 1) - 1];
          return `
            <div class="notif-item ${n.read ? '' : 'unread'}">
              <div class="notif-tag" style="background:${cat.color}20; color:${cat.color};">
                ${cat.label}
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
    `;
  }).join('');
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

document.addEventListener('DOMContentLoaded', bindNotificationBell);
window.addEventListener('load', bindNotificationBell);
setTimeout(bindNotificationBell, 500);
