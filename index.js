(function initStars() {
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars(n) {
    stars = [];
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.2,
        a: Math.random(),
        speed: Math.random() * 0.003 + 0.001,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      s.a += s.speed;
      const alpha = (Math.sin(s.a) + 1) / 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,160,255,${alpha * 0.7})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  resize();
  createStars(180);
  draw();
})();

async function init() {
  const containers = {
    tank:   document.getElementById('cards-tank'),
    healer: document.getElementById('cards-healer'),
    dps:    document.getElementById('cards-dps'),
    class:  document.getElementById('cards-class'),
  };

  const errorEl = document.getElementById('error-msg');

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove('d-none');
  }

  function showLoadingFor(containerId) {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = `<div class="col-12 text-center py-4 text-secondary"><div class="spinner-border spinner-border-sm mb-2" role="status"></div><p class="fst-italic">Loading…</p></div>`;
  }

  Object.values(containers).forEach(el => {
    if (el) el.innerHTML = `<div class="col-12 text-center py-4 text-secondary"><div class="spinner-border spinner-border-sm mb-2" role="status"></div><p class="fst-italic">Loading…</p></div>`;
  });

  try {
    const rows = await fetchAllJobs();
    const valid = rows.filter(isValidJob);

    
    const byRole = { tank: [], healer: [], dps: [], class: [] };
    for (const row of valid) {
      const role = classifyRole(row);
      if (byRole[role]) byRole[role].push(row);
    }

    
    for (const [role, items] of Object.entries(byRole)) {
      const el = containers[role];
      if (!el) continue;
      el.innerHTML = '';
      if (items.length === 0) {
        el.innerHTML = `<div class="col-12"><p class="text-muted fst-italic">None found.</p></div>`;
        continue;
      }
      for (const row of items) {
        el.appendChild(buildJobCard(row));
      }
    }

    
    const dpsCount     = byRole.dps.length;
    const supportCount = byRole.tank.length + byRole.healer.length;
    const totalJobs    = byRole.tank.length + byRole.healer.length + byRole.dps.length;

    animateCount('stat-total',   totalJobs);
    animateCount('stat-dps',     dpsCount);
    animateCount('stat-support', supportCount);

  } catch (err) {
    console.error(err);
    showError(`Failed to load jobs: ${err.message}. Make sure you have a network connection.`);
    Object.values(containers).forEach(el => { if (el) el.innerHTML = ''; });
  }
}

init();

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let cur = 0;
  const step = Math.ceil(target / 20);
  const timer = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur;
    if (cur >= target) clearInterval(timer);
  }, 40);
}
