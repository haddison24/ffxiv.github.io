(function initStars() {
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  let stars = [];
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  function createStars(n) {
    stars = [];
    for (let i = 0; i < n; i++) {
      stars.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height,
                   r: Math.random()*1.2+0.2, a: Math.random(), speed: Math.random()*0.003+0.001 });
    }
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      s.a += s.speed;
      const alpha = (Math.sin(s.a)+1)/2;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(180,160,255,${alpha*0.7})`; ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  resize(); createStars(180); draw();
})();

const ROLE_STYLES = {
  tank:   { color: '#38bdf8', label: 'Tank' },
  healer: { color: '#4ade80', label: 'Healer' },
  dps:    { color: '#f87171', label: 'DPS' },
  class:  { color: '#c084fc', label: 'Base Class' },
};

async function fetchJobActions(classJobIndex) {
  const fields = 'Name,Description,ActionTransient.Description,ActionCategory,Icon,ClassJobLevel';
  const url = `https://v2.xivapi.com/api/search?sheets=Action&query=ClassJob=${classJobIndex}+IsPlayerAction=true&fields=${encodeURIComponent(fields)}&limit=20`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return (data.results || []).filter(r => r.fields?.Name && r.fields.Name.trim() !== '');
}

async function init() {
  const root   = document.getElementById('detail-root');
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');

  if (id === null || id === undefined) {
    root.innerHTML = `<div class="alert alert-danger mt-4">No job ID provided. <a href="search.html">Go back to search.</a></div>`;
    return;
  }

  try {
    const job = await fetchJobById(id);
    document.title = `${job.fields?.Name || 'Job'} — XIV Job Compendium`;
    root.innerHTML = '';

    const wrap = renderDetail(job);
    root.appendChild(wrap);

    const jobIndex = job.fields?.JobIndex ?? job.row_id;
    loadActions(jobIndex, wrap);

  } catch (err) {
    root.innerHTML = `<div class="alert alert-danger mt-4">Failed to load job: ${err.message}</div>`;
  }
}

init();

async function loadActions(jobIndex, wrap) {
  const actionsSection = wrap.querySelector('#actions-section');
  const actionsGrid    = wrap.querySelector('#actions-grid');
  if (!actionsSection || !actionsGrid) return;

  try {
    const actions = await fetchJobActions(jobIndex);

    if (actions.length === 0) {
      actionsSection.innerHTML = '';
      return;
    }

    actionsGrid.innerHTML = '';
    actionsSection.querySelector('p.section-heading').style.display = 'block';

    for (const action of actions) {
      const f     = action.fields || {};
      const name  = f.Name || 'Unknown';
      const desc  = f['ActionTransient.Description'] || f.Description || 'No description available.';
      const level = f.ClassJobLevel || '?';
      const icon  = f.Icon ? iconUrl(f.Icon) : null;

      const col = document.createElement('div');
      col.className = 'col-12 col-md-6';
      col.innerHTML = `
        <div class="surface-card border rounded-3 p-3 h-100 d-flex gap-3 align-items-start">
          ${icon
            ? `<img src="${icon}" alt="${name}" width="40" height="40" style="flex-shrink:0;filter:drop-shadow(0 0 6px rgba(139,111,255,0.4))" onerror="this.style.display='none'">`
            : `<div style="width:40px;height:40px;flex-shrink:0;background:#181a38;border-radius:6px;display:flex;align-items:center;justify-content:center">⚔</div>`
          }
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="fw-semibold" style="font-family:var(--font-display)">${name}</span>
              <span class="badge rounded-pill" style="background:#181a38;color:#8884aa;font-size:0.65rem">Lv ${level}</span>
            </div>
            <p class="small text-secondary mb-0" style="line-height:1.5">${desc}</p>
          </div>
        </div>
      `;
      actionsGrid.appendChild(col);
    }

  } catch (err) {
    if (actionsSection) {
      actionsSection.innerHTML = `<p class="text-secondary small fst-italic">Could not load abilities.</p>`;
    }
  }
}

function renderDetail(job) {
  const f     = job.fields || {};
  const name  = f.Name  || 'Unknown Job';
  const abbr  = f.Abbreviation || '—';
  const role  = classifyRole(job);
  const style = ROLE_STYLES[role] || ROLE_STYLES.class;
  const rowId = job.row_id;

  const stats = [
    { label: 'Strength',     value: f.BStrength     || 0 },
    { label: 'Dexterity',    value: f.BDexterity    || 0 },
    { label: 'Vitality',     value: f.BVitality     || 0 },
    { label: 'Intelligence', value: f.BIntelligence || 0 },
    { label: 'Mind',         value: f.BMind         || 0 },
    { label: 'Atk Power',    value: f.BAttackPower  || 0 },
    { label: 'Healing',      value: f.BHealingPower || 0 },
    { label: 'Mag Defense',  value: f.BMagicDefense || 0 },
  ].filter(s => s.value > 0);

  const iconPath = f.ClassJobParent?.icon || null;
  const iconHtml = iconPath
    ? `<img src="${iconUrl(iconPath)}" alt="${name}" class="detail-icon"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div style="display:none;font-size:2.5rem">⚔</div>`
    : `<div style="font-size:2.5rem">⚔</div>`;

  const roleDesc = {
    tank:   `${name} stands at the frontlines, absorbing punishment and protecting the party.`,
    healer: `${name} sustains the party through battle, weaving healing and support magic.`,
    dps:    `${name} brings powerful offensive abilities to destroy enemies swiftly.`,
    class:  `${name} is a foundational class that can advance into a specialized job.`,
  }[role] || `${name} serves a unique role in Eorzea's battle system.`;

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <a href="search.html" class="back-link d-inline-flex align-items-center gap-2 mb-4">← Back to Search</a>

    <div class="surface-card border rounded-3 p-4 mb-4 d-flex align-items-center gap-4 flex-wrap">
      <div class="detail-icon-wrap">
        ${iconHtml}
      </div>
      <div>
        <p class="text-uppercase small letter-wide mb-1" style="color:#c084fc">${abbr}</p>
        <h1 class="fw-bold mb-2 gold-text">${name}</h1>
        <span class="badge rounded-pill border px-3 py-2 mb-3 d-inline-block"
              style="color:${style.color};border-color:${style.color}!important;background:${style.color}18">
          ${style.label}
        </span>
        <p class="fst-italic text-secondary mb-0">${roleDesc}</p>
      </div>
    </div>

    ${stats.length > 0 ? `
    <p class="section-heading">Base Stats</p>
    <div class="row g-3 mb-4">
      ${stats.map(s => `
        <div class="col-6 col-sm-4 col-md-3">
          <div class="surface-card border rounded-3 p-3 text-center">
            <div class="fs-2 fw-bold accent-text">${s.value}</div>
            <div class="text-uppercase small text-secondary letter-wide">${s.label}</div>
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <p class="section-heading">Details</p>
    <div class="row g-3 mb-4">
      <div class="col-6 col-md-3">
        <div class="surface-card border rounded-3 p-3">
          <div class="text-uppercase small text-secondary letter-wide mb-1">Abbreviation</div>
          <div>${abbr}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="surface-card border rounded-3 p-3">
          <div class="text-uppercase small text-secondary letter-wide mb-1">Role</div>
          <div style="color:${style.color}">${style.label}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="surface-card border rounded-3 p-3">
          <div class="text-uppercase small text-secondary letter-wide mb-1">Job Index</div>
          <div>${f.JobIndex !== undefined ? f.JobIndex : '—'}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="surface-card border rounded-3 p-3">
          <div class="text-uppercase small text-secondary letter-wide mb-1">Row ID</div>
          <div>${rowId}</div>
        </div>
      </div>
    </div>

    ${stats.length > 0 ? `
    <p class="section-heading">Stat Distribution</p>
    <div class="surface-card border rounded-3 p-4 mb-4">
      ${buildStatBars(stats)}
    </div>
    ` : ''}

    <div id="actions-section">
      <p class="section-heading">Abilities</p>
      <div class="row g-3 mb-4" id="actions-grid">
        <div class="col-12 text-center py-3 text-secondary">
          <div class="spinner-border spinner-border-sm mb-2" role="status"></div>
          <p class="fst-italic small">Loading abilities…</p>
        </div>
      </div>
    </div>
  `;

  return wrap;
}

function buildStatBars(stats) {
  const max = Math.max(...stats.map(s => s.value));
  return stats.map(s => {
    const pct = max > 0 ? (s.value / max) * 100 : 0;
    return `
      <div class="mb-3">
        <div class="d-flex justify-content-between mb-1">
          <span class="text-uppercase small text-secondary letter-wide">${s.label}</span>
          <span class="small fw-semibold accent-text">${s.value}</span>
        </div>
        <div class="progress" style="height:6px;background:#0d0e1e">
          <div class="progress-bar" role="progressbar"
               style="width:${pct}%;background:linear-gradient(90deg,#8b6fff,#c084fc)"
               aria-valuenow="${s.value}" aria-valuemin="0" aria-valuemax="${max}">
          </div>
        </div>
      </div>
    `;
  }).join('');
}
