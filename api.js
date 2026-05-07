const BASE = 'https://v2.xivapi.com';

async function fetchAllJobs() {
  const fields = 'Name,Abbreviation,ClassJobParent,JobIndex,LimitBreak1,BAttackPower,BHealingPower,BMagicDefense,BStrength,BMind,BDexterity,BIntelligence,BVitality,RowId';
  const url = `${BASE}/api/sheet/ClassJob?fields=${encodeURIComponent(fields)}&limit=50`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.rows || [];
}

async function fetchJobById(id) {
  const fields = 'Name,Abbreviation,ClassJobParent,JobIndex,LimitBreak1,BAttackPower,BHealingPower,BMagicDefense,BStrength,BMind,BDexterity,BIntelligence,BVitality,RowId';
  const url = `${BASE}/api/sheet/ClassJob/${id}?fields=${encodeURIComponent(fields)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function searchJobs(term, cursor = null) {
  const fields = 'Name,Abbreviation,ClassJobParent,JobIndex,BAttackPower,BHealingPower,BStrength,BMind';
  let url = `${BASE}/api/search?sheets=ClassJob&fields=${encodeURIComponent(fields)}&limit=12`;

  if (term && term.trim()) {
    url += `&query=${encodeURIComponent(`Name~"${term.trim()}"`)}`
  }
  if (cursor) {
    url += `&cursor=${encodeURIComponent(cursor)}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json(); 
}

function iconUrl(iconPath) {
  if (!iconPath) return null;
  
  return `${BASE}/api/asset?path=${encodeURIComponent(iconPath)}&format=png`;
}

function classifyRole(job) {
  const name = (job.fields?.Name || '').toLowerCase();
  const abbr = (job.fields?.Abbreviation || '').toUpperCase();

  const tanks   = ['PLD','WAR','DRK','GNB','GLA','MRD'];
  const healers = ['WHM','SCH','AST','SGE','CNJ'];
  const jobs    = ['PLD','WAR','DRK','GNB','WHM','SCH','AST','SGE',
                   'MNK','DRG','NIN','SAM','RPR','VPR',
                   'BRD','MCH','DNC',
                   'BLM','SMN','RDM','PCT','BLU'];

  if (tanks.includes(abbr))   return 'tank';
  if (healers.includes(abbr)) return 'healer';
  if (jobs.includes(abbr))    return 'dps';

  
  return 'class';
}

function isValidJob(row) {
  return row.fields?.Name && row.fields.Name.trim() !== '' && row.fields.Name !== 'Adventurer';
}

function buildJobCard(row) {
  const fields = row.fields || {};
  const name  = fields.Name || 'Unknown';
  const abbr  = fields.Abbreviation || '';
  const role  = classifyRole(row);
  const id    = row.row_id;

  const col = document.createElement('div');
  col.className = 'col-6 col-sm-4 col-md-3 col-lg-2';

  const link = document.createElement('a');
  link.href      = `detail.html?id=${id}`;
  link.className = 'job-card h-100 d-flex flex-column align-items-center';

  
  const iconPath = fields.ClassJobParent?.icon || fields.icon || null;
  let iconHtml;
  if (iconPath) {
    iconHtml = `<img src="${iconUrl(iconPath)}" alt="${name}" class="job-card-icon" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                <div class="job-card-icon-placeholder" style="display:none">⚔</div>`;
  } else {
    iconHtml = `<div class="job-card-icon-placeholder">⚔</div>`;
  }

  link.innerHTML = `
    ${iconHtml}
    <div class="job-card-abbr">${abbr}</div>
    <div class="job-card-name">${name}</div>
    <div class="small fst-italic text-secondary mt-1">${capitalize(role)}</div>
  `;

  col.appendChild(link);
  return col;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
