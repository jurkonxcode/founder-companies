// js/ui/menu.js
// Menu controller: screen navigation, archetype selection, game boot.

// ===== Screen navigation =====
function showMenuScreen(name) {
  const current = document.querySelector('.menu-screen.active');
  const next = document.querySelector(`.menu-screen[data-screen="${name}"]`);
  if (!next || current === next) return;

  if (current) {
    current.classList.add('leaving');
    setTimeout(() => {
      current.classList.remove('active', 'leaving');
      next.classList.add('active');
      next.scrollTop = 0;
    }, 200);
  } else {
    next.classList.add('active');
  }
}

// ===== Archetype icons =====
function archIcon(name) {
  const icons = {
    'chip-default': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></svg>',
    'chip-bolt':    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="5" width="14" height="14" rx="2"/><path d="m13 8-3 4h4l-3 4"/></svg>',
    'chip-factory': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="8" width="16" height="12" rx="1"/><path d="M4 12h16M8 8V4M16 8V4M9 16h1M14 16h1"/></svg>',
    'chip-network': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/><path d="M10 7h4M7 10v4M17 10v4M10 17h4"/></svg>',
    'chip-gpu':     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12v0M18 12v0"/></svg>',
    'chip-atom':    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/></svg>',
    'chip-phone':   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>',
    'chip-laptop':  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="5" width="16" height="11" rx="1"/><path d="M2 19h20"/></svg>',
  };
  return icons[name] || icons['chip-default'];
}

// ===== Render archetype cards =====
function renderArchetypeCards() {
  const grid = document.getElementById('company-grid');
  if (!grid) return;

  grid.innerHTML = ARCHETYPES.map(a => `
    <div class="company-card"
         data-arch="${a.id}"
         style="--comp-color:${a.color}; --comp-soft:${a.colorSoft}">
      <div class="comp-top">
        <div class="comp-icon">${archIcon(a.icon)}</div>
        <div class="comp-tags">
          <span class="comp-tag">${a.roleTag}</span>
          <span class="comp-tag sub">${a.subTag}</span>
        </div>
      </div>
      <div class="comp-name">${escapeHtml(a.name)}</div>
      <div class="comp-tagline">${escapeHtml(a.tagline)}</div>
      <div class="comp-desc">${escapeHtml(a.desc)}</div>
      <span class="comp-cta">
        Tap for details
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </span>
    </div>
  `).join('');

  grid.querySelectorAll('[data-arch]').forEach(card => {
    card.addEventListener('click', () => {
      openArchetypeModal(card.dataset.arch);
    });
  });
}

// ===== Archetype detail modal =====
let modalDifficulty = 'normal';

function openArchetypeModal(id) {
  const arch = getArchetype(id);
  if (!arch) return;
  modalDifficulty = 'normal';
  renderArchetypeModal(arch);
}

function renderArchetypeModal(arch) {
  const modal = document.getElementById('menu-modal');
  const diff = getDifficulty(modalDifficulty);

  modal.innerHTML = `
    <div class="menu-modal-card"
         style="--comp-color:${arch.color}; --comp-soft:${arch.colorSoft}">
      <div class="modal-accent"></div>
      <div class="modal-inner">

        <button class="modal-close-btn" id="modal-close" style="
          position:absolute; top:16px; right:16px;
          width:36px; height:36px; border-radius:50%;
          background:var(--menu-bg-2); border:none;
          color:var(--menu-text-dim); font-size:16px;
          cursor:pointer; display:grid; place-items:center;
        ">✕</button>

        <div style="text-align:center; margin-bottom:20px;">
          <div class="modal-icon" style="
            width:72px; height:72px; margin:0 auto 16px;
            border-radius:20px;
            background:${arch.colorSoft};
            color:${arch.color};
            display:grid; place-items:center;
          ">
            <div style="width:36px;height:36px;">${archIcon(arch.icon)}</div>
          </div>
          <div class="modal-section-label" style="margin:0 0 6px; text-align:center;">
            ${arch.roleTag}
          </div>
          <div class="modal-title" style="
            font-family:var(--font-serif);
            font-size:32px; font-weight:700;
            letter-spacing:-0.02em; line-height:1.1;
            margin-bottom:10px;
          ">${escapeHtml(arch.name)}</div>
          <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
            <span class="comp-tag" style="
              background:${arch.colorSoft};
              color:${arch.color};
              font-size:11px; font-weight:700;
              letter-spacing:0.08em; text-transform:uppercase;
              padding:5px 12px; border-radius:999px;
            ">${arch.roleTag}</span>
            <span class="comp-tag" style="
              background:var(--menu-bg-2);
              color:var(--menu-text-soft);
              font-size:11px; font-weight:700;
              letter-spacing:0.08em; text-transform:uppercase;
              padding:5px 12px; border-radius:999px;
            ">${arch.subTag}</span>
          </div>
        </div>

        <div class="modal-desc" style="margin-bottom:20px;">
          ${escapeHtml(arch.longDesc)}
        </div>

        <div style="
          padding:14px 16px;
          background:${arch.colorSoft};
          border-left:3px solid ${arch.color};
          border-radius:8px;
          margin-bottom:22px;
        ">
          <div style="
            font-size:10px; font-weight:700;
            letter-spacing:0.14em; text-transform:uppercase;
            color:${arch.color}; margin-bottom:6px;
          ">Good for</div>
          <div style="
            font-size:13.5px; line-height:1.5;
            color:var(--menu-text);
          ">${escapeHtml(arch.goodFor)}</div>
        </div>

        <div class="modal-section-label">Starting perks</div>
        <div class="bonus-list" style="margin-bottom:22px;">
          ${arch.perkDetails.map(([k, v]) => `
            <div class="bonus-row" style="
              display:flex; align-items:center; gap:10px;
              padding:11px 14px;
              background:var(--menu-bg-2);
              border-radius:10px;
              font-size:13px;
            ">
              <span style="
                width:18px; height:18px; border-radius:50%;
                background:${arch.color};
                color:white; flex-shrink:0;
                display:grid; place-items:center;
                font-size:11px; font-weight:700;
              ">✓</span>
              <span style="flex:1; color:var(--menu-text-dim);">${escapeHtml(k)}</span>
              <span style="
                font-family:var(--font-mono);
                font-weight:600; color:var(--menu-text);
                text-align:right;
              ">${escapeHtml(v)}</span>
            </div>
          `).join('')}
        </div>

        <div class="modal-section-label">Difficulty</div>
        <div id="diff-tabs" style="
          display:grid; grid-template-columns:1fr 1fr 1fr;
          gap:0; margin-bottom:14px;
          background:var(--menu-bg-2);
          border-radius:12px; padding:4px;
        ">
          ${DIFFICULTIES.map(d => `
            <button class="diff-tab" data-diff="${d.id}" style="
              padding:10px 8px; border:none; cursor:pointer;
              border-radius:9px;
              font-size:13px; font-weight:600;
              transition: all 0.15s;
              background:${d.id === modalDifficulty ? arch.color : 'transparent'};
              color:${d.id === modalDifficulty ? 'white' : 'var(--menu-text-dim)'};
            ">${d.name}</button>
          `).join('')}
        </div>

        <div id="diff-desc" style="
          font-size:13px; line-height:1.55;
          color:var(--menu-text);
          margin-bottom:10px;
        ">${escapeHtml(diff.desc)}</div>

        <div style="
          font-size:11.5px; line-height:1.5;
          color:var(--menu-text-soft);
          font-style:italic;
          margin-bottom:22px;
        ">Sets how quickly and broadly rival companies answer your products.</div>

        <div class="modal-section-label">Name your company</div>
        <input id="company-name-input" type="text" maxlength="32"
               value="${escapeHtml(arch.name)}"
               placeholder="Enter company name..."
               style="
                 width:100%; padding:14px 16px;
                 background:var(--menu-bg-2);
                 border:1.5px solid transparent;
                 border-radius:12px;
                 font-family:var(--font-serif);
                 font-size:18px; font-weight:600;
                 color:var(--menu-text);
                 margin-bottom:22px;
                 transition: border-color 0.15s;
                 outline:none;
               ">

        <button id="modal-start-btn" class="modal-btn primary" style="
          width:100%; padding:16px;
          border:none; border-radius:14px;
          background:${arch.color};
          color:white;
          font-size:15px; font-weight:700;
          cursor:pointer;
          transition: all 0.15s;
        ">
          Start as <span id="cta-name">${escapeHtml(arch.name)}</span> →
        </button>

      </div>
    </div>
  `;

  modal.classList.add('active');
  bindArchetypeModal(arch);
}

function bindArchetypeModal(arch) {
  const modal = document.getElementById('menu-modal');
  const closeBtn = document.getElementById('modal-close');
  const input = document.getElementById('company-name-input');
  const ctaName = document.getElementById('cta-name');
  const startBtn = document.getElementById('modal-start-btn');

  // Close
  closeBtn.addEventListener('click', closeArchetypeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeArchetypeModal();
  });

  // Difficulty tabs
  document.querySelectorAll('.diff-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      modalDifficulty = tab.dataset.diff;
      renderArchetypeModal(arch);
    });
  });

  // Company name input
  input.addEventListener('input', () => {
    const val = input.value.trim() || arch.name;
    ctaName.textContent = val;
  });
  input.addEventListener('focus', () => {
    input.style.borderColor = arch.color;
  });
  input.addEventListener('blur', () => {
    input.style.borderColor = 'transparent';
  });

  // Start button
  startBtn.addEventListener('click', () => {
    const customName = (input.value || '').trim() || arch.name;
    const difficulty = modalDifficulty;
    closeArchetypeModal();
    startNewGame(arch.id, { difficulty, companyName: customName });
  });

  // ESC key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeArchetypeModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

function closeArchetypeModal() {
  const modal = document.getElementById('menu-modal');
  modal.classList.remove('active');
  modal.innerHTML = '';
}

// ===== Start new game =====
function startNewGame(archId, options = {}) {
  const arch = getArchetype(archId);
  if (!arch) return;

  const difficulty = options.difficulty || 'normal';
  const companyName = (options.companyName || arch.name).trim();

  // Initialize state via state.js
  initStateWithArchetype(arch, options);

  // Set extended fields that state.js doesn't know about
  state.difficulty = difficulty;
  state.companyName = companyName;
  state.archId = archId;

  // Log setup info
  addLog(`Difficulty: ${getDifficulty(difficulty).name}.`, 'info');
  if (companyName !== arch.name) {
    addLog(`Company renamed to "${companyName}".`, 'info');
  }

  // Hide menu
  const menuEl = document.getElementById('menu');
  menuEl.classList.add('hidden');
  setTimeout(() => { menuEl.style.display = 'none'; }, 400);

  // Show app
  document.getElementById('app').classList.remove('pre-game');

  // Boot game
  bootGame();
}

// ===== Init menu =====
function initMenu() {
  const hasSave = !!localStorage.getItem(SAVE_KEY);
  const continueCard = document.getElementById('menu-continue');

  if (hasSave) {
    continueCard.style.display = 'flex';
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      const data = JSON.parse(raw);
      const compName = data.companyName || 'Founder Semiconductor';
      const diffName = data.difficulty ? getDifficulty(data.difficulty).name : 'Normal';
      document.getElementById('continue-meta').innerHTML = `
        <span><strong>${compName}</strong></span>
        <span>${diffName} · Turn ${data.turn || 0}</span>
        <span>Cash: <strong>${formatMoneyShort(data.uang || 0)}</strong></span>
        <span>Share: <strong>${((data.marketShare || 0) * 100).toFixed(1)}%</strong></span>
      `;
    } catch (e) {
      document.getElementById('continue-meta').textContent = 'Save found';
    }
  }

  // Continue
  continueCard?.addEventListener('click', () => {
    if (!hasSave) return;
    const menuEl = document.getElementById('menu');
    menuEl.classList.add('hidden');
    setTimeout(() => { menuEl.style.display = 'none'; }, 400);
    document.getElementById('app').classList.remove('pre-game');
    loadAndBootGame();
  });

  // New game action cards
  document.querySelectorAll('.menu-card[data-action="new-game"]').forEach(c => {
    c.addEventListener('click', () => showMenuScreen('mode'));
  });

  // Mode cards
  document.querySelectorAll('.mode-card').forEach(c => {
    c.addEventListener('click', () => {
      const mode = c.dataset.mode;
      if (mode === 'standard') {
        startNewGame('founder', { difficulty: 'normal' });
      } else if (mode === 'freeplay') {
        showMenuScreen('company');
      }
    });
  });

  // Back buttons
  document.querySelectorAll('[data-back]').forEach(b => {
    b.addEventListener('click', () => showMenuScreen(b.dataset.back));
  });

  // Help button
  document.getElementById('menu-help-btn')?.addEventListener('click', () => {
    alert(
      'Each archetype has unique bonuses that affect chip performance, ' +
      'research cost, and RP gain. Pick one that matches your playstyle.\n\n' +
      '• Founder — balanced, beginner friendly\n' +
      '• Vertex — fast CPUs\n' +
      '• Helix — cheap node research\n' +
      '• Nexus — platform & OS\n' +
      '• Orion — superior GPUs\n' +
      '• Quantum — fast research, expensive hardware\n' +
      '• Aurora — efficient mobile\n' +
      '• Titan — vertical integration\n\n' +
      'Difficulty scales how aggressively rivals respond to your launches.'
    );
  });

  // Load button
  document.getElementById('menu-load-btn')?.addEventListener('click', () => {
    if (!hasSave) { alert('No save found.'); return; }
    const menuEl = document.getElementById('menu');
    menuEl.classList.add('hidden');
    setTimeout(() => { menuEl.style.display = 'none'; }, 400);
    document.getElementById('app').classList.remove('pre-game');
    loadAndBootGame();
  });

  // Render cards
  renderArchetypeCards();

  // Global ESC for modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeArchetypeModal();
  });
                                 }
