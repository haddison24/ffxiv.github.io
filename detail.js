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

async function init() {
  const root   = document.getElementById('detail-root');
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');

  if (!id) {
    root.innerHTML = `<div class="alert alert-danger mt-4">No job ID provided. <a href="search.html">Go back to search.</a></div>`;
    return;
  }

  try {
    const job = await fetchJobById(id);
    document.title = `${job.fields?.Name || 'Job'} — XIV Job Compendium`;
    root.innerHTML = '';
    root.appendChild(renderDetail(job));
  } catch (err) {
    root.innerHTML = `<div class="alert alert-danger mt-4">Failed to load job: ${err.message}</div>`;
  }
}

init();

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

    <!-- Back link -->
    <a href="search.html" class="back-link d-inline-flex align-items-center gap-2 mb-4">← Back to Search</a>

    <!-- Hero card -->
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

    <!-- Base Stats -->
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

    <!-- Details -->
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

    <!-- Stat Bars -->
    ${stats.length > 0 ? `
    <p class="section-heading">Stat Distribution</p>
    <div class="surface-card border rounded-3 p-4 mb-4">
      ${buildStatBars(stats)}
    </div>
    ` : ''}
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
