// js/ui/systemStatus.js
// Indikator real-time: jam device, baterai, dan session timer.
// Bergaya status bar OS, terinspirasi Silicon Empire.

let _sessionStart = null;
let _sessionTimer = null;
let _clockTimer = null;

function initSystemStatus() {
  _sessionStart = Date.now();
  startClock();
  startBattery();
  startSessionTimer();
}

// ===== Jam device =====
function startClock() {
  const el = document.getElementById('dev-clock');
  if (!el) return;
  const tick = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    el.textContent = `${hh}:${mm}`;
    el.title = `${hh}:${mm}:${ss}`;
  };
  tick();
  if (_clockTimer) clearInterval(_clockTimer);
  _clockTimer = setInterval(tick, 1000);
}

// ===== Baterai device =====
function startBattery() {
  const wrap = document.getElementById('dev-battery');
  const fill = document.getElementById('dev-bat-fill');
  const pct = document.getElementById('dev-bat-pct');
  if (!wrap || !fill || !pct) return;

  if (!navigator.getBattery) {
    // Firefox & sebagian browser tidak support
    wrap.style.display = 'none';
    return;
  }

  navigator.getBattery().then(battery => {
    const update = () => {
      const level = Math.round(battery.level * 100);
      pct.textContent = level + '%';
      fill.style.width = level + '%';

      wrap.classList.toggle('charging', battery.charging);
      wrap.classList.toggle('low', level <= 20 && !battery.charging);
      wrap.classList.toggle('mid', level > 20 && level <= 50 && !battery.charging);

      wrap.title = battery.charging
        ? `Baterai ${level}% · Mengisi daya`
        : `Baterai ${level}%`;
    };
    update();
    battery.addEventListener('levelchange', update);
    battery.addEventListener('chargingchange', update);
  }).catch(() => {
    wrap.style.display = 'none';
  });
}

// ===== Session timer =====
function startSessionTimer() {
  const el = document.getElementById('dev-session');
  if (!el) return;
  const tick = () => {
    const elapsed = Math.floor((Date.now() - _sessionStart) / 1000);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    if (h > 0) {
      el.textContent = `${h}j ${String(m).padStart(2, '0')}m`;
    } else {
      el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  };
  tick();
  if (_sessionTimer) clearInterval(_sessionTimer);
  _sessionTimer = setInterval(tick, 1000);
}
