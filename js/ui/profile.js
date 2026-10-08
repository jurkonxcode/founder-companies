// js/ui/profile.js
// Profile modal — company dashboard, milestones, save/load, settings.
// Self-binding: tidak butuh perubahan di main.js.

// ===== Milestone definitions =====
const MILESTONES = [
  { id: 'founded',    label: 'Founded your company',           hint: 'The garage is small. The dream is not.',  check: s => true,                                          badge: 'T0' },
  { id: 'first_hire', label: 'Hired your first engineer',      hint: 'Great chips need great people.',           check: s => (s.team && s.team.length > 0) },
  { id: 'first_chip', label: 'Shipped your first chip',        hint: 'Silicon in the wild.',                     check: s => s.products && s.products.some(p => p.launched) },
  { id: 'share_5',    label: 'Reached 5% market share',        hint: 'You are now a real player.',               check: s => (s.marketShare || 0) >= 0.05 },
  { id: 'million',    label: 'Earned $1M lifetime revenue',    hint: 'Business model validated.',                check: s => (s.totalRevenue || 0) >= 1000000 },
  { id: 'nodes_3',    label: 'Unlocked 3 process nodes',       hint: "Riding the Moore's Law curve.",            check: s => s.unlockedNodes && s.unlockedNodes.length >= 3 },
  { id: 'diversify',  label: 'Shipped 3 different categories', hint: 'Not a one-trick pony.',                    check: s => s.products && new Set(s.products.filter(p => p.launched).map(p => p.category)).size >= 3 },
  { id: '7nm',        label: 'Reached the 7nm era',            hint: 'Modern silicon.',                           check: s => s.unlockedNodes && s.unlockedNodes.includes('7nm') },
  { id: 'decade',     label: 'Survived 10 years',              hint: 'Turn 120 and counting.',                    check: s => (s.turn || 0) >= 120 },
  { id: '2nm',        label: 'Reached the 2nm era',            hint: 'The bleeding edge. Only legends get here.', check: s => s.unlockedNodes && s.unlockedNodes.includes('2nm') },
];

// ===== Open / Close =====
function openProfile() {
  const modal = document.getElementById('profile-modal');
  if (!modal) {
    alert('Profile modal not found in HTML. Make sure <div id="profile-modal"></div> exists.');
    return;
  }
  if (!state) {
    alert('Game state not loaded yet.');
    return;
  }
  try {
    renderProfile();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  } catch (e) {
    console.error('[Profile] render error:', e);
    alert('Failed to open profile: ' + e.message);
  }
}

function closeProfile() {
  const modal = document.getElementById('profile-modal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// ===== Escape helpers =====
function _esc(s) {
  if (typeof escapeHtml === 'function') return escapeHtml(s);
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function _money(n) {
  if (typeof formatMoneyShort === 'function') return formatMoneyShort(n);
  const abs = Math.abs(n);
  if (abs >= 1e9) return '$' + (abs/1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return '$' + (abs/1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return '$' + (abs/1e3).toFixed(0) + 'K';
  return '$' + Math.round(abs);
}
function _date(t, b) {
  if (typeof formatDate === 'function') return formatDate(t, b);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return (MONTHS[(b || 1) - 1] || 'Jan') + ' ' + (t || 1995);
}

// ===== Render =====
function renderProfile() {
  const modal = document.getElementById('profile-modal');
  if (!modal || !state) return;

  const arch = (typeof getArchetype === 'function' && state.archetype) ? getArchetype(state.archetype) : null;
  const diff = (typeof getDifficulty === 'function' && state.difficulty) ? getDifficulty(state.difficulty) : null;
  const companyName = state.companyName || (arch ? arch.name : 'Founder Companies');
  const initial = (companyName || 'F').trim().charAt(0).toUpperCase();
  const foundedStr = _date(state.founded?.tahun || 1995, state.founded?.bulan || 1);

  // Milestones
  const msResults = MILESTONES.map(m => {
    let done = false;
    try { done = !!m.check(state); } catch (e) { done = false; }
    return { ...m, done };
  });
  const msDone = msResults.filter(m => m.done).length;
  const msPct = Math.round((msDone / msResults.length) * 100);

  const launchedCount = (state.products || []).filter(p => p.launched).length;

  modal.innerHTML = `
    <div class="profile-sheet">

      <div class="profile-hero">
        <button class="profile-hero-close" id="profile-close" aria-label="Close">✕</button>
        <div class="profile-hero-body">
          <div class="profile-hero-avatar">${_esc(initial)}</div>
          <div class="profile-hero-info">
            <div class="profile-hero-name">${_esc(companyName)}</div>
            <div class="profile-hero-tags">
              ${arch ? `<span class="profile-tag primary" style="background:${arch.color};border-color:${arch.color}">${_esc(arch.roleTag)}</span>` : ''}
              ${diff ? `<span class="profile-tag">${_esc(diff.name)}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="profile-hero-meta">
          <span>Founded ${_esc(foundedStr)}</span>
          <span>·</span>
          <span>Turn ${state.turn || 0}</span>
        </div>
      </div>

      <div class="profile-body">

        <div class="profile-section">
          <div class="profile-section-title">Live stats</div>
          <div class="profile-stat-grid">
            <div class="profile-stat-tile">
              <div class="pst-label">Cash</div>
              <div class="pst-value accent">${_money(state.uang || 0)}</div>
            </div>
            <div class="profile-stat-tile">
              <div class="pst-label">Market share</div>
              <div class="pst-value purple">${((state.marketShare || 0) * 100).toFixed(1)}%</div>
            </div>
            <div class="profile-stat-tile">
              <div class="pst-label">Revenue</div>
              <div class="pst-value good">${_money(state.totalRevenue || 0)}</div>
            </div>
            <div class="profile-stat-tile">
              <div class="pst-label">Engineers</div>
              <div class="pst-value">${(state.team || []).length}</div>
            </div>
            <div class="profile-stat-tile">
              <div class="pst-label">Products</div>
              <div class="pst-value">${launchedCount}</div>
            </div>
            <div class="profile-stat-tile">
              <div class="pst-label">Node</div>
              <div class="pst-value">${_esc(state.currentNode || '350nm')}</div>
            </div>
          </div>
        </div>

        <div class="profile-section">
          <div class="profile-section-title">Milestones · ${msDone} / ${msResults.length}</div>
          <div class="milestone-progress">
            <div class="mp-head">
              <span>Progress</span>
              <span>${msPct}%</span>
            </div>
            <div style="height:6px;background:var(--bg-3);border-radius:999px;overflow:hidden">
              <div class="mp-fill" style="width:${msPct}%"></div>
            </div>
          </div>
          <div class="profile-milestones mt-1">
            ${msResults.map(m => `
              <div class="milestone-row ${m.done ? 'done' : ''}">
                <div class="milestone-check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <div class="milestone-text">
                  <div>${_esc(m.label)}</div>
                  <div class="milestone-hint">${_esc(m.hint)}</div>
                </div>
                ${m.badge ? `<span class="milestone-badge">${_esc(m.badge)}</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <div class="profile-section">
          <div class="profile-section-title">Save &amp; data</div>
          <div class="profile-actions">
            <button class="profile-action" id="pf-save">
              <div class="pa-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>
              </div>
              <div class="pa-body">
                <div class="pa-title">Save now</div>
                <div class="pa-desc">Autosaves every 30 seconds. Manual save keeps the current moment.</div>
              </div>
              <div class="pa-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><path d="m9 18 6-6-6-6"/></svg></div>
            </button>

            <button class="profile-action" id="pf-export">
              <div class="pa-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              </div>
              <div class="pa-body">
                <div class="pa-title">Export save</div>
                <div class="pa-desc">Copy the entire save as text to backup or share.</div>
              </div>
              <div class="pa-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><path d="m9 18 6-6-6-6"/></svg></div>
            </button>

            <button class="profile-action" id="pf-import">
              <div class="pa-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              </div>
              <div class="pa-body">
                <div class="pa-title">Import save</div>
                <div class="pa-desc">Paste an exported save code to restore a company.</div>
              </div>
              <div class="pa-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><path d="m9 18 6-6-6-6"/></svg></div>
            </button>

            <button class="profile-action danger" id="pf-reset">
              <div class="pa-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </div>
              <div class="pa-body">
                <div class="pa-title">Reset company</div>
                <div class="pa-desc">Delete the save and start fresh from January 1995.</div>
              </div>
              <div class="pa-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><path d="m9 18 6-6-6-6"/></svg></div>
            </button>
          </div>
        </div>

        <div class="profile-section">
          <div class="profile-section-title">Settings</div>
          <div class="profile-settings">
            <div class="setting-row">
              <div class="setting-body">
                <div class="setting-label">Default speed</div>
                <div class="setting-desc">Speed applied when starting a new game.</div>
              </div>
              <div class="seg" id="seg-speed">
                <button data-speed="0" class="${(state._defaultSpeed || 0) === 0 ? 'active' : ''}">⏸</button>
                <button data-speed="1" class="${(state._defaultSpeed || 0) === 1 ? 'active' : ''}">1×</button>
                <button data-speed="2" class="${(state._defaultSpeed || 0) === 2 ? 'active' : ''}">2×</button>
                <button data-speed="4" class="${(state._defaultSpeed || 0) === 4 ? 'active' : ''}">4×</button>
              </div>
            </div>
            <div class="setting-row">
              <div class="setting-body">
                <div class="setting-label">Autosave</div>
                <div class="setting-desc">Save to browser every 30 seconds.</div>
              </div>
              <button class="switch ${state._autosave !== false ? 'on' : ''}" id="sw-autosave" aria-label="Toggle autosave"></button>
            </div>
            <div class="setting-row">
              <div class="setting-body">
                <div class="setting-label">Confetti on milestone</div>
                <div class="setting-desc">Show a little celebration when you unlock one.</div>
              </div>
              <button class="switch ${state._celebrate !== false ? 'on' : ''}" id="sw-celebrate" aria-label="Toggle celebration"></button>
            </div>
          </div>
        </div>

        <div class="profile-about">
          Founder Companies <strong>v2.0.0</strong><br>
          Turn-based semiconductor tycoon<br>
          <a href="https://github.com" target="_blank" rel="noopener">GitHub</a> · Built with vanilla JS
        </div>

      </div>
    </div>
  `;

  bindProfileEvents();
}

// ===== Event binding =====
function bindProfileEvents() {
  document.getElementById('profile-close')?.addEventListener('click', closeProfile);

  const modal = document.getElementById('profile-modal');
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeProfile();
  });

  document.getElementById('pf-save')?.addEventListener('click', () => {
    if (typeof saveGame === 'function') {
      saveGame();
      popCenterToast('Game saved');
    }
  });

  document.getElementById('pf-export')?.addEventListener('click', () => {
    try {
      const data = JSON.stringify(state);
      const b64 = btoa(unescape(encodeURIComponent(data)));
      if (navigator.clipboard) {
        navigator.clipboard.writeText(b64).then(
          () => popCenterToast('Save copied to clipboard'),
          () => prompt('Copy this save code:', b64)
        );
      } else {
        prompt('Copy this save code:', b64);
      }
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
  });

  document.getElementById('pf-import')?.addEventListener('click', () => {
    const code = prompt('Paste your save code here:');
    if (!code) return;
    try {
      const json = decodeURIComponent(escape(atob(code.trim())));
      const data = JSON.parse(json);
      if (!data || !data.version) throw new Error('Invalid save');
      state = data;
      if (typeof saveGame === 'function') saveGame(true);
      popCenterToast('Save imported');
      setTimeout(() => location.reload(), 700);
    } catch (e) {
      alert('Invalid save code.');
    }
  });

  document.getElementById('pf-reset')?.addEventListener('click', () => {
    const confirmed = confirm('Reset your company? All progress will be lost.');
    if (!confirmed) return;
    if (typeof resetGame === 'function') resetGame();
    if (typeof saveGame === 'function') saveGame(true);
    location.reload();
  });

  document.querySelectorAll('#seg-speed button').forEach(btn => {
    btn.addEventListener('click', () => {
      const sp = parseInt(btn.dataset.speed);
      state._defaultSpeed = sp;
      document.querySelectorAll('#seg-speed button').forEach(b => b.classList.toggle('active', b === btn));
      if (typeof saveGame === 'function') saveGame(true);
      popCenterToast('Default speed: ' + (sp === 0 ? 'Pause' : sp + '×'));
    });
  });

  document.getElementById('sw-autosave')?.addEventListener('click', (e) => {
    state._autosave = !(state._autosave !== false);
    e.currentTarget.classList.toggle('on', state._autosave !== false);
    if (typeof saveGame === 'function') saveGame(true);
    popCenterToast('Autosave ' + (state._autosave !== false ? 'on' : 'off'));
  });

  document.getElementById('sw-celebrate')?.addEventListener('click', (e) => {
    state._celebrate = !(state._celebrate !== false);
    e.currentTarget.classList.toggle('on', state._celebrate !== false);
    if (typeof saveGame === 'function') saveGame(true);
    popCenterToast('Celebration ' + (state._celebrate !== false ? 'on' : 'off'));
  });
}

// ===== Center toast =====
function popCenterToast(msg) {
  const el = document.createElement('div');
  el.className = 'toast-center';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 1400);
}

// ===== Avatar updater =====
function updateProfileAvatar() {
  const el = document.getElementById('profile-avatar');
  if (!el || !state) return;
  const arch = (typeof getArchetype === 'function' && state.archetype) ? getArchetype(state.archetype) : null;
  const name = state.companyName || (arch ? arch.name : 'F');
  el.textContent = (name || 'F').trim().charAt(0).toUpperCase();
}

// ===== Self-binding (independent from main.js) =====
function _bindProfileNow() {
  const btn = document.getElementById('btn-profile');
  if (!btn) {
    console.warn('[Profile] #btn-profile not found in DOM');
    return;
  }
  if (btn.dataset.bound === '1') return;   // avoid double-binding
  btn.dataset.bound = '1';
  btn.addEventListener('click', openProfile);
  console.log('[Profile] button bound');
}

document.addEventListener('DOMContentLoaded', () => {
  _bindProfileNow();
  updateProfileAvatar();
});

// ESC to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeProfile();
});

// Expose globals used by other files (safety)
window.openProfile = openProfile;
window.closeProfile = closeProfile;
