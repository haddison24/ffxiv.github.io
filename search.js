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
      const alpha = (Math.sin(s.a) + 1) / 2;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(180,160,255,${alpha*0.7})`; ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  resize(); createStars(180); draw();
})();

let allJobs    = [];
let currentTerm = '';
let currentRole = 'all';
let currentPage = 0;
const PAGE_SIZE = 12;

const searchInput    = document.getElementById('search-input');
const resultsGrid    = document.getElementById('results-grid');
const resultsMeta    = document.getElementById('results-meta');
const paginationWrap = document.getElementById('pagination-wrap');
const errorEl        = document.getElementById('error-msg');

function setRole(pill, role) {
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  pill.classList.add('active');
  currentRole = role;
  currentPage = 0;
  if (currentTerm.trim()) {
    doAPISearch();
  } else {
    renderPage();
  }
}

async function init() {
  try {
    const rows = await fetchAllJobs();
    allJobs = rows.filter(isValidJob);
    renderPage();
  } catch (err) {
    showError(`Failed to load jobs: ${err.message}`);
  }
}
 
init();
 
function doSearch() {
  currentTerm = searchInput.value.trim();
  currentPage = 0;
  if (currentTerm) {
    doAPISearch();
  } else {
    renderPage();
  }
}

async function doAPISearch() {
  setLoading(true);
  errorEl.classList.add('d-none');
  try {
    const data = await searchJobs(currentTerm);
    let results = (data.results || []).filter(r => r.fields?.Name);
    if (currentRole !== 'all') {
      results = results.filter(r => classifyRole(r) === currentRole);
    }
    renderResults(results);
    resultsMeta.textContent = `${results.length} result${results.length !== 1 ? 's' : ''} for "${currentTerm}"`;
    paginationWrap.innerHTML = ''; 
  } catch (err) {
    showError(`Search failed: ${err.message}`);
  } finally {
    setLoading(false);
  }
}

function doReset() {
  searchInput.value = '';
  currentTerm = '';
  currentRole = 'all';
  currentPage = 0;
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  document.querySelector('[data-role="all"]').classList.add('active');
  errorEl.classList.add('d-none');
  renderPage();
}
 
function renderPage() {
  let filtered = allJobs;
 
  if (currentRole !== 'all') {
    filtered = filtered.filter(r => classifyRole(r) === currentRole);
  }
  const total = filtered.length;
  const start = currentPage * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);
 
  resultsGrid.innerHTML = '';
 
  if (slice.length === 0) {
    resultsGrid.innerHTML = `<div class="col-12 text-center py-5 text-secondary"><p class="fst-italic">No jobs found.</p></div>`;
    resultsMeta.textContent = '';
    paginationWrap.innerHTML = '';
    return;
  }
 
  for (const row of slice) {
    resultsGrid.appendChild(buildJobCard(row));
  }
  resultsMeta.textContent = `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, total)} of ${total} jobs`;
  renderPagination(total);
}
function renderResults(results) {
  resultsGrid.innerHTML = '';
  if (results.length === 0) {
    resultsGrid.innerHTML = `<div class="col-12 text-center py-5 text-secondary"><p class="fst-italic">No jobs match your search.</p></div>`;
    return;
  }
  for (const row of results) {
    resultsGrid.appendChild(buildJobCard(row));
  }
}
 
function renderPagination(total) {
  paginationWrap.innerHTML = '';
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return;
 
  const prev = document.createElement('button');
  prev.className = 'page-btn';
  prev.textContent = '← Prev';
  prev.disabled = currentPage === 0;
  prev.onclick = () => { currentPage--; renderPage(); window.scrollTo(0,0); };
 
  const info = document.createElement('span');
  info.style.cssText = 'font-family:var(--font-display);font-size:0.72rem;letter-spacing:0.08em;color:var(--text-muted);display:flex;align-items:center;padding:0 0.5rem;';
  info.textContent = `Page ${currentPage + 1} / ${totalPages}`;
 
  const next = document.createElement('button');
  next.className = 'page-btn';
  next.textContent = 'Next →';
  next.disabled = currentPage >= totalPages - 1;
  next.onclick = () => { currentPage++; renderPage(); window.scrollTo(0,0); };
 
  paginationWrap.append(prev, info, next);
}
 
function setLoading(on) {
  if (on) {
    resultsGrid.innerHTML = `<div class="col-12 text-center py-5 text-secondary"><div class="spinner-border spinner-border-sm mb-2" role="status"></div><p class="fst-italic">Searching…</p></div>`;
    resultsMeta.textContent = '';
  }
}
 
function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove('d-none');
  resultsGrid.innerHTML = '';
}
