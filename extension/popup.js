'use strict';
// ═══════════════════════════════════════════════════════════════════════════
// ApplyTrack — popup.js  v1.1.0
// New: JSON backup/restore · Duplicate detection · Follow-up reminders
//      Timestamped activity log · Date validation · Storage quota warnings
// ═══════════════════════════════════════════════════════════════════════════

const STAGES = [
  { id: 'Applied',      color: 'var(--accent)', label: 'Applied'      },
  { id: 'Interviewing', color: 'var(--blue)',   label: 'Interviewing' },
  { id: 'Offer',        color: 'var(--green)',  label: 'Offer'        },
  { id: 'Rejected',     color: 'var(--red)',    label: 'Rejected'     },
  { id: 'Ghosted',      color: 'var(--slate)',  label: 'Ghosted'      },
];

const IS_EXTENSION = typeof chrome !== 'undefined' && !!chrome.storage?.local;

// ── Storage ───────────────────────────────────────────────────────────────────
const Store = {
  async get(key) {
    if (IS_EXTENSION) {
      return new Promise(r => chrome.storage.local.get([key], d => r(d[key] ?? null)));
    }
    try { return JSON.parse(localStorage.getItem('at_' + key)); } catch { return null; }
  },
  async set(key, value) {
    if (IS_EXTENSION) {
      return new Promise(r => chrome.storage.local.set({ [key]: value }, r));
    }
    localStorage.setItem('at_' + key, JSON.stringify(value));
  },
};

// ── App State ─────────────────────────────────────────────────────────────────
const S = {
  jobs: [], view: 'dashboard', editId: null,
  theme: 'dark', filter: '', prefill: null,
};

// ── Sample Data (demo/preview mode only) ──────────────────────────────────────
const SAMPLE = [
  { id:'s1', company:'Stripe',    role:'Backend Engineer',          url:'https://stripe.com/jobs/listing/backend-engineer/5123456', dateApplied:'2026-05-12', status:'Interviewing', notes:'Phone screen with Sarah.', visaSponsor:'yes',     timeline:[{ts:'2026-05-12T09:00:00.000Z',text:'Applied via company website'},{ts:'2026-05-14T14:23:00.000Z',text:'Recruiter Sarah reached out — phone screen booked May 19'}] },
  { id:'s2', company:'Google',    role:'Software Engineer III',     url:'https://careers.google.com/jobs/results/1234567/',         dateApplied:'2026-05-10', status:'Applied',      notes:'Applied via referral from Alex.', visaSponsor:'yes', timeline:[] },
  { id:'s3', company:'Airbnb',    role:'Senior Frontend Engineer',  url:'https://careers.airbnb.com/positions/5938201/',           dateApplied:'2026-05-09', status:'Applied',      notes:'', visaSponsor:'yes', timeline:[] },
  { id:'s4', company:'Figma',     role:'Product Engineer',          url:'https://www.figma.com/careers/job/5123456/',              dateApplied:'2026-05-06', status:'Offer',        notes:'Base $195k + equity.', visaSponsor:'yes', timeline:[{ts:'2026-05-06T08:00:00.000Z',text:'Applied'},{ts:'2026-05-09T16:00:00.000Z',text:'Technical screen w/ Eng team'},{ts:'2026-05-13T11:30:00.000Z',text:'Offer received! $195k + 0.05% equity'}] },
  { id:'s5', company:'Vercel',    role:'DX Engineer',               url:'https://vercel.com/careers/dx-engineer',                 dateApplied:'2026-05-11', status:'Interviewing', notes:'Virtual onsite next Tuesday.', visaSponsor:'unknown', timeline:[] },
  { id:'s6', company:'Brex',      role:'Infrastructure Engineer',   url:'https://www.brex.com/careers/opening/5123456',           dateApplied:'2026-05-03', status:'Rejected',     notes:'Rejected after take-home.', visaSponsor:'yes', timeline:[] },
  { id:'s7', company:'Netflix',   role:'Senior SWE — Platform',     url:'https://jobs.netflix.com/jobs/333',                      dateApplied:'2026-04-30', status:'Ghosted',      notes:'No response after 2 weeks.', visaSponsor:'yes', timeline:[] },
  { id:'s8', company:'Anthropic', role:'Full Stack Engineer',       url:'https://boards.greenhouse.io/anthropic/jobs/4020308008', dateApplied:'2026-05-14', status:'Applied',      notes:'', visaSponsor:'yes', timeline:[] },
  { id:'s9', company:'Linear',    role:'Software Engineer',         url:'https://linear.app/careers/engineering',                dateApplied:'2026-05-13', status:'Applied',      notes:'Dream company.', visaSponsor:'unknown', timeline:[] },
];

// ── Timeline Migration ────────────────────────────────────────────────────────
// Converts legacy `notes` string → first timeline entry for existing users.
function migrateTimeline(job) {
  if (job.timeline !== undefined) return false;
  job.timeline = [];
  if (job.notes?.trim()) {
    job.timeline.push({
      ts: (job.dateApplied ? job.dateApplied + 'T12:00:00.000Z' : new Date().toISOString()),
      text: job.notes.trim(),
    });
  }
  return true;
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  S.theme = (await Store.get('theme')) || 'dark';
  document.documentElement.setAttribute('data-theme', S.theme);

  let jobs = await Store.get('jobs');
  if (!jobs) {
    jobs = IS_EXTENSION ? [] : SAMPLE;
  }
  const anyMigrated = jobs.some(j => migrateTimeline(j));
  S.jobs = jobs;
  if (anyMigrated) await Store.set('jobs', S.jobs);

  if (IS_EXTENSION && chrome.tabs && chrome.scripting) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        const res = await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
        const data = res?.[0]?.result;
        if (data?.company || data?.role) { S.prefill = data; S.view = 'add'; }
      }
    } catch (_) { /* tab may not support scripting */ }
  }

  render();
  initTweaks();
  document.dispatchEvent(new CustomEvent('applytrackready'));
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  if (!app) return;
  const demoBanner = IS_EXTENSION ? '' : `<div class="demo-banner">DEMO MODE — sample data loaded</div>`;
  if (S.view === 'add' || S.view === 'edit') {
    app.innerHTML = demoBanner + renderFormView();
  } else if (S.view === 'settings') {
    app.innerHTML = demoBanner + renderSettingsView();
  } else {
    app.innerHTML = demoBanner + renderDashboardView();
  }
  bind();
}

function renderDashboardView() {
  const counts = Object.fromEntries(STAGES.map(s => [s.id, 0]));
  S.jobs.forEach(j => { if (counts[j.status] !== undefined) counts[j.status]++; });
  const filtered = S.filter
    ? S.jobs.filter(j => (j.company + j.role).toLowerCase().includes(S.filter.toLowerCase()))
    : S.jobs;
  if (!S.jobs.length) return renderEmptyState();
  return `
<header class="header">
  <div class="header-left"><div class="logo"><div class="logo-mark">${icoLogo()}</div><span class="logo-text">ApplyTrack</span></div></div>
  <div class="header-actions">
    <button class="icon-btn" id="themeToggle" title="Toggle theme">${S.theme==='dark'?icoSun():icoMoon()}</button>
    <button class="icon-btn" id="settingsBtn" title="Settings">${icoGear()}</button>
  </div>
</header>
<div class="stats-bar">
  ${STAGES.map(s => `<div class="stat-item" style="--stage-color:${s.color}"><span class="stat-count">${counts[s.id]}</span><span class="stat-label">${s.label}</span></div>`).join('')}
</div>
<div class="toolbar">
  <div class="search-wrap">
    <svg class="search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    <input class="search-input" id="searchInput" type="text" placeholder="Search…" value="${esc(S.filter)}">
    ${S.filter ? `<button class="clear-btn" id="clearSearch">✕</button>` : ''}
  </div>
  <button class="btn-add" id="addJobBtn">
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg>
    Add Job
  </button>
</div>
<div class="kanban-scroll"><div class="kanban" id="kanban">
  ${STAGES.map(st => renderCol(st, filtered)).join('')}
</div></div>
<footer class="footer">
  <button class="btn-export" id="exportBtn">
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 9.5v2h9v-2M6.5 2v6.5M4 6l2.5 2.5L9 6" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></svg>
    Export CSV
  </button>
  <span class="footer-count">${S.jobs.length} job${S.jobs.length!==1?'s':''} tracked</span>
</footer>`;
}

function renderEmptyState() {
  return `
<header class="header">
  <div class="header-left"><div class="logo"><div class="logo-mark">${icoLogo()}</div><span class="logo-text">ApplyTrack</span></div></div>
  <div class="header-actions">
    <button class="icon-btn" id="themeToggle">${S.theme==='dark'?icoSun():icoMoon()}</button>
    <button class="icon-btn" id="settingsBtn">${icoGear()}</button>
  </div>
</header>
<div class="empty-dashboard">
  <div class="empty-icon"><svg width="26" height="26" viewBox="0 0 26 26" fill="none"><rect x="3" y="6" width="20" height="17" rx="3" stroke="currentColor" stroke-width="1.7"/><path d="M8 3v4M18 3v4M3 11h20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M8.5 16l2.5 2 5-4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
  <p class="empty-title">No applications yet</p>
  <p class="empty-sub">Open a job listing, then click the ApplyTrack icon to save it. Or add manually.</p>
  <button class="btn-empty-add" id="addJobBtn">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg>
    Add your first job
  </button>
</div>`;
}

function renderCol(stage, jobs) {
  const list = jobs.filter(j => j.status === stage.id);
  return `
<div class="column" data-stage="${stage.id}">
  <div class="column-header">
    <div class="column-title"><span class="column-dot" style="background:${stage.color}"></span>${stage.label}</div>
    <span class="column-count">${list.length}</span>
  </div>
  <div class="column-body" data-stage="${stage.id}">
    ${list.length ? list.map(j => renderCard(j)).join('') : '<div class="empty-column">Empty</div>'}
  </div>
</div>`;
}

function renderCard(j) {
  const d = daysSince(j.dateApplied);
  const age = d === 0 ? 'Today' : d === 1 ? '1d ago' : `${d}d ago`;
  const lastEntry = j.timeline?.length ? j.timeline[j.timeline.length - 1] : null;
  const hasReminder = j.reminderDays && j.reminderSet;
  return `
<div class="card" data-id="${j.id}" draggable="true">
  <div class="card-top">
    <span class="card-company">${esc(j.company)}</span>
    ${renderBadge(j.visaSponsor)}
  </div>
  <div class="card-role">${esc(j.role)}</div>
  ${lastEntry ? `<div class="card-last-entry">${esc(lastEntry.text)}</div>` : ''}
  <div class="card-bottom">
    <span class="card-days">${age}${hasReminder ? ' · <span class="card-reminder-dot" title="Reminder set">⏰</span>' : ''}</span>
    <div class="card-actions">
      <select class="move-select" data-id="${j.id}" title="Move stage">
        ${STAGES.map(s=>`<option value="${s.id}"${s.id===j.status?' selected':''}>${s.label}</option>`).join('')}
      </select>
      <button class="btn-edit-card" data-id="${j.id}" title="Edit">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M7.5 1.5l2 2L3.5 9.5H1.5V7.5L7.5 1.5Z" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/></svg>
      </button>
    </div>
  </div>
</div>`;
}

function renderBadge(v) {
  if (v==='yes')  return `<span class="badge badge-sponsor">✓ Sponsors H1B</span>`;
  if (v==='no')   return `<span class="badge badge-no-sponsor">✗ No Sponsorship</span>`;
  return `<span class="badge badge-unknown">? Unknown</span>`;
}

function renderTimelineEntries(job) {
  if (!job.timeline?.length) {
    return `<div class="timeline-empty">No entries yet — log updates as they happen.</div>`;
  }
  return job.timeline.slice().reverse().map(e => `
<div class="timeline-entry">
  <span class="timeline-ts">${fmtTs(e.ts)}</span>
  <span class="timeline-text">${esc(e.text)}</span>
</div>`).join('');
}

function renderFormView() {
  const isEdit = S.view === 'edit';
  const j = isEdit ? S.jobs.find(x => x.id === S.editId) : null;
  const p = S.prefill || {};
  const company     = isEdit ? j.company      : (p.company || '');
  const role        = isEdit ? j.role         : (p.role    || '');
  const url         = isEdit ? j.url          : (p.url     || '');
  const status      = isEdit ? j.status       : 'Applied';
  const notes       = isEdit ? j.notes        : '';
  const date        = isEdit ? j.dateApplied  : today();
  const sponsor     = isEdit ? j.visaSponsor  : detectSponsor(company);
  const reminder    = isEdit ? (j.reminderDays || '') : '';
  const autoDetected = !isEdit && (p.company || p.role);

  return `
<header class="header">
  <div class="header-left">
    <button class="back-btn" id="backBtn">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <span class="header-title">${isEdit ? 'Edit Application' : 'Save Application'}</span>
  </div>
  ${isEdit ? `<button class="btn-delete" id="deleteBtn" data-id="${j.id}">Delete</button>` : ''}
</header>
${autoDetected ? `<div class="auto-detect-banner"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" stroke-width="1.3"/><path d="M6.5 4v3l1.5 1.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>Auto-detected from page</div>` : ''}
<div class="form-scroll">
  <form class="form" id="jobForm" autocomplete="off">
    <div class="field-group">
      <div class="field">
        <label class="label">Company</label>
        <input class="input" type="text" name="company" value="${esc(company)}" placeholder="e.g. Stripe" required id="companyInput">
      </div>
      <div class="field">
        <label class="label">Role</label>
        <input class="input" type="text" name="role" value="${esc(role)}" placeholder="e.g. SWE" required>
      </div>
    </div>
    <div class="field">
      <label class="label">Job URL</label>
      <input class="input" type="url" name="url" value="${esc(url)}" placeholder="https://…">
    </div>
    <div class="field-group">
      <div class="field">
        <label class="label">Status</label>
        <select class="input select" name="status">
          ${STAGES.map(s=>`<option value="${s.id}"${s.id===status?' selected':''}>${s.label}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label class="label">Date Applied</label>
        <input class="input" type="date" name="dateApplied" value="${date}" id="dateInput">
        <span class="field-error" id="dateError"></span>
      </div>
    </div>
    <div class="field">
      <label class="label">Visa Sponsorship</label>
      <div class="sponsor-toggle" id="sponsorToggle" data-value="${sponsor}">
        <button type="button" class="sponsor-btn${sponsor==='yes'?' active':''}" data-val="yes"><span class="sponsor-dot green"></span>Sponsors</button>
        <button type="button" class="sponsor-btn${sponsor==='unknown'?' active':''}" data-val="unknown"><span class="sponsor-dot gray"></span>Unknown</button>
        <button type="button" class="sponsor-btn${sponsor==='no'?' active':''}" data-val="no"><span class="sponsor-dot red"></span>Doesn't</button>
      </div>
      ${(!isEdit && detectSponsor(company)==='yes' && company) ? `<p class="field-hint">✓ Known H1B sponsor auto-detected</p>` : ''}
    </div>
    <div class="field">
      <label class="label">Notes</label>
      <textarea class="input textarea" name="notes" rows="2" placeholder="Recruiter name, salary range, impressions…">${esc(notes)}</textarea>
    </div>
    <div class="field">
      <label class="label">Follow-up reminder <span class="label-sub">days from today (optional)</span></label>
      <input class="input" type="number" name="reminderDays" min="1" max="90" placeholder="e.g. 7" value="${esc(String(reminder))}">
    </div>
    ${isEdit ? `
    <div class="field">
      <label class="label">Activity Log <span class="label-sub">${j.timeline?.length||0} entries</span></label>
      <div class="timeline-add-row">
        <input class="input timeline-input" id="timelineInput" type="text" placeholder="e.g. Phone screen scheduled for May 20">
        <button type="button" class="btn-log" id="logEntryBtn">Log</button>
      </div>
      <div class="timeline" id="timelineList">${renderTimelineEntries(j)}</div>
    </div>` : ''}
    <button type="submit" class="btn-primary">${isEdit ? 'Update Application' : 'Save Application'}</button>
  </form>
</div>`;
}

function renderSettingsView() {
  return `
<header class="header">
  <div class="header-left">
    <button class="back-btn" id="backBtn">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <span class="header-title">Settings</span>
  </div>
</header>
<div class="settings-body">
  <div class="settings-section">
    <div class="settings-label">Appearance</div>
    <div class="theme-options">
      <button class="theme-opt${S.theme==='dark'?' active':''}" data-theme="dark">
        <div class="theme-preview dark-preview"></div><span>Dark</span>
      </button>
      <button class="theme-opt${S.theme==='light'?' active':''}" data-theme="light">
        <div class="theme-preview light-preview"></div><span>Light</span>
      </button>
    </div>
  </div>
  <div class="settings-section">
    <div class="settings-label">Backup &amp; Restore</div>
    <div class="settings-btn-pair">
      <button class="settings-btn accent" id="exportJsonBtn">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 9.5v2h9v-2M6.5 2v6.5M4 6l2.5 2.5L9 6" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Export JSON
      </button>
      <button class="settings-btn" id="importJsonBtn">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 9.5v2h9v-2M6.5 9V2.5M4 5l2.5-2.5L9 5" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Import JSON
      </button>
    </div>
    <input type="file" id="importFileInput" accept=".json" style="display:none">
    <p class="settings-hint">JSON backup preserves all data including timeline logs. Restore if you reinstall Chrome or switch devices.</p>
  </div>
  <div class="settings-section">
    <div class="settings-label">Data</div>
    <button class="settings-btn" id="exportCsvBtn">Export CSV spreadsheet</button>
    <button class="settings-btn danger" id="clearDataBtn">Clear all applications</button>
  </div>
  <div class="settings-section">
    <div class="settings-label">About</div>
    <div class="settings-info">
      <div class="settings-info-row"><span>Version</span><span>1.1.0</span></div>
      <div class="settings-info-row"><span>Jobs tracked</span><span>${S.jobs.length}</span></div>
      <div class="settings-info-row"><span>Storage</span><span>${IS_EXTENSION ? 'chrome.storage.local' : 'localStorage'}</span></div>
    </div>
  </div>
</div>`;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function icoLogo() { return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
function icoMoon() { return `<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M12.5 9A6 6 0 015.5 2a6 6 0 000 11 6 6 0 007-4z" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
function icoSun()  { return `<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2.8" stroke="currentColor" stroke-width="1.35"/><path d="M7.5 1.5v1.3M7.5 12.2v1.3M1.5 7.5h1.3M12.2 7.5h1.3M3.4 3.4l.9.9M10.7 10.7l.9.9M3.4 11.6l.9-.9M10.7 4.3l.9-.9" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/></svg>`; }
function icoGear() { return `<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2.2" stroke="currentColor" stroke-width="1.35"/><path d="M7.5 1.5v1M7.5 12.5v1M1.5 7.5h1M12.5 7.5h1M3.1 3.1l.7.7M11.2 11.2l.7.7M3.1 11.9l.7-.7M11.2 3.8l.7-.7" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/></svg>`; }

// ── Event Binding ─────────────────────────────────────────────────────────────
function bind() {
  el('themeToggle')?.addEventListener('click', toggleTheme);
  el('settingsBtn')?.addEventListener('click', () => { S.view = 'settings'; render(); });
  el('backBtn')?.addEventListener('click', () => { S.view = 'dashboard'; S.editId = null; S.prefill = null; render(); });
  el('addJobBtn')?.addEventListener('click', () => { S.view = 'add'; S.prefill = null; render(); });
  el('searchInput')?.addEventListener('input', e => { S.filter = e.target.value; refreshKanban(); });
  el('clearSearch')?.addEventListener('click', () => { S.filter = ''; render(); });
  el('exportBtn')?.addEventListener('click', exportCSV);
  el('exportCsvBtn')?.addEventListener('click', exportCSV);
  el('jobForm')?.addEventListener('submit', submitForm);

  // Sponsor toggle
  qsa('.sponsor-btn').forEach(b => b.addEventListener('click', () => {
    const v = b.dataset.val;
    el('sponsorToggle').dataset.value = v;
    qsa('.sponsor-btn').forEach(x => x.classList.toggle('active', x.dataset.val === v));
  }));

  // Company → auto-detect sponsor
  el('companyInput')?.addEventListener('input', e => {
    const v = detectSponsor(e.target.value);
    const t = el('sponsorToggle'); if (!t) return;
    t.dataset.value = v;
    qsa('.sponsor-btn').forEach(b => b.classList.toggle('active', b.dataset.val === v));
  });

  // Date validation — inline feedback
  el('dateInput')?.addEventListener('change', e => {
    const r = validateDate(e.target.value);
    const errEl = el('dateError');
    if (errEl) errEl.textContent = r.ok ? '' : r.msg;
  });

  // Delete
  el('deleteBtn')?.addEventListener('click', async e => {
    if (!confirm('Delete this application?')) return;
    if (IS_EXTENSION && chrome.alarms) chrome.alarms.clear(`remind_${e.target.dataset.id}`);
    S.jobs = S.jobs.filter(j => j.id !== e.target.dataset.id);
    await Store.set('jobs', S.jobs);
    S.view = 'dashboard'; S.editId = null; render();
  });

  // Theme options (settings)
  qsa('.theme-opt').forEach(b => b.addEventListener('click', async () => {
    S.theme = b.dataset.theme;
    document.documentElement.setAttribute('data-theme', S.theme);
    await Store.set('theme', S.theme);
    render();
  }));

  // Clear data
  el('clearDataBtn')?.addEventListener('click', async () => {
    if (!confirm('Delete ALL tracked applications? This cannot be undone.')) return;
    S.jobs = []; await Store.set('jobs', []); S.view = 'dashboard'; render();
  });

  // JSON export / import
  el('exportJsonBtn')?.addEventListener('click', exportJSON);
  el('importJsonBtn')?.addEventListener('click', () => el('importFileInput')?.click());
  el('importFileInput')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) importJSON(file);
    e.target.value = '';
  });

  // Activity log entry
  el('logEntryBtn')?.addEventListener('click', async () => {
    const input = el('timelineInput');
    const text = input?.value.trim();
    if (!text) { input?.focus(); return; }
    const job = S.jobs.find(j => j.id === S.editId); if (!job) return;
    if (!job.timeline) job.timeline = [];
    job.timeline.push({ ts: new Date().toISOString(), text });
    input.value = '';
    await Store.set('jobs', S.jobs);
    const list = el('timelineList');
    if (list) list.innerHTML = renderTimelineEntries(job);
    const lbl = list?.closest('.field')?.querySelector('.label-sub');
    if (lbl) lbl.textContent = `${job.timeline.length} entries`;
  });

  // Kanban — delegated on #kanban so listeners survive refreshKanban()'s innerHTML swap
  const kanbanEl = el('kanban');
  if (kanbanEl) {
    let dragId = null;
    kanbanEl.addEventListener('click', e => {
      const btn = e.target.closest('.btn-edit-card');
      if (btn) { e.stopPropagation(); S.editId = btn.dataset.id; S.view = 'edit'; render(); return; }
      const card = e.target.closest('.card');
      if (card) { S.editId = card.dataset.id; S.view = 'edit'; render(); }
    });
    kanbanEl.addEventListener('change', async e => {
      const sel = e.target.closest('.move-select');
      if (sel) { e.stopPropagation(); await moveJob(sel.dataset.id, sel.value); }
    });
    kanbanEl.addEventListener('dragstart', e => {
      const card = e.target.closest('.card'); if (!card) return;
      dragId = card.dataset.id; card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    kanbanEl.addEventListener('dragend', e => {
      const card = e.target.closest('.card');
      if (card) card.classList.remove('dragging');
      qsa('.column-body').forEach(b => b.classList.remove('drag-over'));
      dragId = null;
    });
    kanbanEl.addEventListener('dragover', e => {
      const col = e.target.closest('.column-body');
      if (col) { e.preventDefault(); col.classList.add('drag-over'); }
    });
    kanbanEl.addEventListener('dragleave', e => {
      const col = e.target.closest('.column-body');
      if (col && !col.contains(e.relatedTarget)) col.classList.remove('drag-over');
    });
    kanbanEl.addEventListener('drop', async e => {
      e.preventDefault();
      const col = e.target.closest('.column-body');
      if (col) { col.classList.remove('drag-over'); if (dragId) await moveJob(dragId, col.dataset.stage); }
    });
  }
}

// ── Kanban Partial Refresh ────────────────────────────────────────────────────
function refreshKanban() {
  const kb = el('kanban'); if (!kb) return;
  const filtered = S.filter
    ? S.jobs.filter(j => (j.company+j.role).toLowerCase().includes(S.filter.toLowerCase()))
    : S.jobs;
  kb.innerHTML = STAGES.map(s => renderCol(s, filtered)).join('');
}

// ── Actions ───────────────────────────────────────────────────────────────────
async function submitForm(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const sponsor = el('sponsorToggle')?.dataset.value || 'unknown';
  const isEdit = S.view === 'edit';
  const origJob = isEdit ? S.jobs.find(j => j.id === S.editId) : null;

  const data = {
    company:      fd.get('company').trim(),
    role:         fd.get('role').trim(),
    url:          fd.get('url').trim(),
    status:       fd.get('status'),
    dateApplied:  fd.get('dateApplied'),
    notes:        fd.get('notes').trim(),
    visaSponsor:  sponsor,
    reminderDays: parseInt(fd.get('reminderDays')) || null,
  };

  // Date validation
  const dateCheck = validateDate(data.dateApplied);
  if (!dateCheck.ok) {
    const errEl = el('dateError');
    if (errEl) { errEl.textContent = dateCheck.msg; el('dateInput')?.focus(); return; }
  }

  // Duplicate detection (new jobs or company/role change)
  const companyChanged = !origJob || origJob.company !== data.company || origJob.role !== data.role;
  if (companyChanged) {
    const dup = checkDuplicate(data.company, data.role, S.editId);
    if (dup && !confirm(`You already have an application to ${dup.company} for "${dup.role}" (${dup.status}, ${dup.dateApplied}).\n\nSave anyway?`)) return;
  }

  // Storage quota check (new jobs only)
  if (!isEdit) {
    const quota = await checkStorageQuota();
    if (!quota.ok) {
      alert(`Storage is ${quota.pct}% full (${quota.usedKB} KB used).\n\nExport a JSON backup from Settings and clear some old applications before adding more.`);
      return;
    }
  }

  // Save
  if (isEdit && S.editId) {
    S.jobs = S.jobs.map(j => j.id === S.editId
      ? { ...j, ...data, timeline: j.timeline || [] }
      : j
    );
  } else {
    S.jobs.unshift({ id: uid(), ...data, timeline: [] });
  }
  await Store.set('jobs', S.jobs);

  // Reminder setup
  const savedId = isEdit ? S.editId : S.jobs[0].id;
  if (data.reminderDays) {
    setReminder(savedId, data.reminderDays, data.company, data.role);
    S.jobs = S.jobs.map(j => j.id === savedId ? { ...j, reminderSet: new Date().toISOString() } : j);
    await Store.set('jobs', S.jobs);
  } else if (isEdit && IS_EXTENSION && chrome.alarms) {
    chrome.alarms.clear(`remind_${savedId}`);
    S.jobs = S.jobs.map(j => j.id === savedId ? { ...j, reminderSet: null } : j);
    await Store.set('jobs', S.jobs);
  }

  S.view = 'dashboard'; S.editId = null; S.prefill = null; render();
}

async function moveJob(id, stage) {
  S.jobs = S.jobs.map(j => j.id === id ? { ...j, status: stage } : j);
  await Store.set('jobs', S.jobs);
  refreshKanban();
}

async function toggleTheme() {
  S.theme = S.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', S.theme);
  await Store.set('theme', S.theme);
  const btn = el('themeToggle'); if (btn) btn.innerHTML = S.theme==='dark' ? icoSun() : icoMoon();
}

// ── Export / Import ───────────────────────────────────────────────────────────
function exportCSV() {
  const hdr = ['Company','Role','Status','Date Applied','Visa Sponsor','URL','Notes'];
  const rows = S.jobs.map(j => [j.company,j.role,j.status,j.dateApplied,j.visaSponsor,j.url,j.notes].map(csv));
  const blob = new Blob([[hdr, ...rows].map(r => r.join(',')).join('\n')], { type: 'text/csv' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `applytrack-${today()}.csv` });
  a.click(); URL.revokeObjectURL(a.href);
}

function exportJSON() {
  const payload = { version: '1.1.0', exportedAt: new Date().toISOString(), count: S.jobs.length, jobs: S.jobs };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `applytrack-backup-${today()}.json`,
  });
  a.click(); URL.revokeObjectURL(a.href);
}

async function importJSON(file) {
  try {
    const text = await file.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { throw new Error('File is not valid JSON.'); }

    // Support bare array or {version, jobs} envelope
    const imported = Array.isArray(parsed) ? parsed : (parsed?.jobs ?? null);
    if (!Array.isArray(imported)) throw new Error('Expected a jobs array or an ApplyTrack backup file.');

    const valid = imported.filter(j => j.id && j.company && j.role);
    if (!valid.length) throw new Error('No valid job entries found in this file.');

    const merge = confirm(
      `Found ${valid.length} job${valid.length !== 1 ? 's' : ''} in backup.\n\n` +
      `OK — Merge with your ${S.jobs.length} existing job${S.jobs.length !== 1 ? 's' : ''}\n` +
      `Cancel — Replace all existing data`
    );

    if (merge) {
      const existingIds = new Set(S.jobs.map(j => j.id));
      const added = valid.filter(j => !existingIds.has(j.id));
      S.jobs = [...S.jobs, ...added];
      if (!added.length) { alert('All imported jobs already exist — nothing new was added.'); return; }
    } else {
      if (!confirm(`This will permanently replace all ${S.jobs.length} existing application${S.jobs.length !== 1 ? 's' : ''}. Continue?`)) return;
      S.jobs = valid;
    }

    S.jobs.forEach(j => migrateTimeline(j));
    await Store.set('jobs', S.jobs);
    S.view = 'dashboard';
    render();
  } catch (err) {
    alert(`Import failed: ${err.message}`);
  }
}

// ── Validation & Helpers ──────────────────────────────────────────────────────
function checkDuplicate(company, role, editId) {
  return S.jobs.find(j =>
    j.id !== editId &&
    j.company.toLowerCase().trim() === company.toLowerCase().trim() &&
    j.role.toLowerCase().trim()    === role.toLowerCase().trim()
  ) || null;
}

function validateDate(dateStr) {
  if (!dateStr) return { ok: true };
  const year = new Date(dateStr).getFullYear();
  if (isNaN(year))  return { ok: false, msg: 'Invalid date.' };
  if (year < 2000)  return { ok: false, msg: `Year ${year}? Looks like a typo — did you mean a recent date?` };
  if (year > new Date().getFullYear() + 1) return { ok: false, msg: `Year ${year} is more than a year in the future.` };
  return { ok: true };
}

async function checkStorageQuota() {
  if (!IS_EXTENSION || !chrome.storage?.local?.getBytesInUse) return { ok: true, pct: 0 };
  return new Promise(resolve => {
    chrome.storage.local.getBytesInUse(null, used => {
      const MAX = 10 * 1024 * 1024; // 10 MB chrome.storage.local limit
      const pct = Math.round((used / MAX) * 100);
      resolve({ ok: pct < 80, pct, usedKB: Math.round(used / 1024) });
    });
  });
}

function setReminder(jobId, days, company, role) {
  if (!IS_EXTENSION || !chrome.alarms) return;
  const name = `remind_${jobId}`;
  chrome.alarms.clear(name, () => {
    chrome.alarms.create(name, { delayInMinutes: days * 24 * 60 });
    Store.get('reminders').then(existing => {
      const reminders = existing || {};
      reminders[name] = { company, role, days };
      Store.set('reminders', reminders);
    });
  });
}

// ── Tweaks (EDITMODE protocol) ────────────────────────────────────────────────
function initTweaks() {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{"theme":"dark","accent":"purple","view":"dashboard"}/*EDITMODE-END*/;
  let tweaks = { ...TWEAK_DEFAULTS };

  const ACCENTS = {
    purple: { main:'#7C5BF5', dim:'rgba(124,91,245,0.14)',  bright:'#A88BFA' },
    blue:   { main:'#2563EB', dim:'rgba(37,99,235,0.14)',   bright:'#60A5FA' },
    teal:   { main:'#0D9488', dim:'rgba(13,148,136,0.14)',  bright:'#2DD4BF' },
    rose:   { main:'#E11D48', dim:'rgba(225,29,72,0.14)',   bright:'#FB7185' },
  };

  function applyTweaks() {
    const a = ACCENTS[tweaks.accent] || ACCENTS.purple;
    const r = document.documentElement;
    r.style.setProperty('--accent',        a.main);
    r.style.setProperty('--accent-dim',    a.dim);
    r.style.setProperty('--accent-bright', a.bright);
    if (tweaks.theme !== S.theme) {
      S.theme = tweaks.theme; r.setAttribute('data-theme', S.theme); render();
    }
    if (tweaks.view && tweaks.view !== S.view) {
      S.view = tweaks.view;
      S.prefill = tweaks.view === 'add' ? {company:'Stripe',role:'Backend Engineer',url:'https://stripe.com/jobs'} : null;
      render();
    }
  }

  window.addEventListener('message', e => {
    if (e.data?.type === '__activate_edit_mode')   showTweaksPanel(tweaks, applyTweaks);
    if (e.data?.type === '__deactivate_edit_mode')  hideTweaksPanel();
    if (e.data?.type === '__edit_mode_set_keys') { Object.assign(tweaks, e.data.edits); applyTweaks(); }
  });
  window.parent.postMessage({ type: '__edit_mode_available' }, window.parent.origin || '*');
}

function showTweaksPanel(tweaks, applyTweaks) {
  let p = el('tweaksPanel');
  if (p) { p.classList.add('visible'); return; }
  p = document.createElement('div');
  p.id = 'tweaksPanel'; p.className = 'tweaks-panel visible';
  p.innerHTML = `
<div class="tweaks-title">Tweaks</div>
<div class="tweak-row"><div class="tweak-label">Theme</div><div class="tweak-options">
  <button class="tweak-opt${tweaks.theme==='dark'?' active':''}" data-k="theme" data-v="dark">Dark</button>
  <button class="tweak-opt${tweaks.theme==='light'?' active':''}" data-k="theme" data-v="light">Light</button>
</div></div>
<div class="tweak-row"><div class="tweak-label">Accent</div><div class="tweak-swatches">
  <div class="tweak-swatch${tweaks.accent==='purple'?' active':''}" style="background:#7C5BF5" data-k="accent" data-v="purple"></div>
  <div class="tweak-swatch${tweaks.accent==='blue'?' active':''}" style="background:#2563EB" data-k="accent" data-v="blue"></div>
  <div class="tweak-swatch${tweaks.accent==='teal'?' active':''}" style="background:#0D9488" data-k="accent" data-v="teal"></div>
  <div class="tweak-swatch${tweaks.accent==='rose'?' active':''}" style="background:#E11D48" data-k="accent" data-v="rose"></div>
</div></div>
<div class="tweak-row"><div class="tweak-label">View</div><div class="tweak-options">
  <button class="tweak-opt${tweaks.view==='dashboard'?' active':''}" data-k="view" data-v="dashboard">Board</button>
  <button class="tweak-opt${tweaks.view==='add'?' active':''}" data-k="view" data-v="add">Add Form</button>
  <button class="tweak-opt${tweaks.view==='settings'?' active':''}" data-k="view" data-v="settings">Settings</button>
</div></div>`;
  p.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => {
    const edits = { [b.dataset.k]: b.dataset.v };
    Object.assign(tweaks, edits);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, window.parent.origin || '*');
    applyTweaks();
    p.querySelectorAll(`[data-k="${b.dataset.k}"]`).forEach(x => x.classList.toggle('active', x === b));
  }));
  document.body.appendChild(p);
}

function hideTweaksPanel() { el('tweaksPanel')?.classList.remove('visible'); }

// ── Utils ─────────────────────────────────────────────────────────────────────
function detectSponsor(company) {
  if (!company) return 'unknown';
  const n = company.toLowerCase().trim();
  for (const s of H1B_SPONSORS) { if (n.includes(s) || s.includes(n)) return 'yes'; }
  return 'unknown';
}
function fmtTs(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' +
         d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function daysSince(d) { return Math.max(0, Math.floor((Date.now() - new Date(d)) / 86400000)); }
function today()      { return new Date().toISOString().slice(0, 10); }
function uid()        { return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 9); }
function esc(s)       { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function csv(v)       { return `"${String(v||'').replace(/"/g,'""')}"`; }
function el(id)       { return document.getElementById(id); }
function qsa(sel)     { return document.querySelectorAll(sel); }

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
