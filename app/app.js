// Leonida Trophy Guide: checklist saved in localStorage, export/import,
// filters by grade + kind, search, missable-only, and a spoiler setting
// that hides story trophy names/descriptions until they are earned.
const KEY = 'gta6-trophy-checklist';
const SPOILER_KEY = 'gta6-trophy-spoiler';
const cards = document.getElementById('cards');
const gradeEl = document.getElementById('grade');
const kindEl = document.getElementById('kind');
const searchEl = document.getElementById('search');
const missEl = document.getElementById('missable');
const spoilEl = document.getElementById('spoiler');
let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
spoilEl.checked = localStorage.getItem(SPOILER_KEY) === '1';
// Deep links: ?grade=silver&kind=activity, or #roadmap / #cards
const params = new URLSearchParams(location.search);
if (params.get('grade')) gradeEl.value = params.get('grade');
if (params.get('kind')) kindEl.value = params.get('kind');
if (params.get('q')) searchEl.value = params.get('q');
const doc = await (await fetch('data/trophies.json')).json();

function save() { localStorage.setItem(KEY, JSON.stringify([...earned])); }

function renderRoadmap() {
  const ol = document.getElementById('roadmap-list');
  ol.replaceChildren();
  for (const s of doc.roadmap || []) {
    const li = document.createElement('li');
    const b = document.createElement('strong'); b.textContent = s.title + ' — ';
    li.append(b, document.createTextNode(s.text));
    ol.append(li);
  }
}

function render() {
  const q = searchEl.value.trim().toLowerCase();
  const hideSpoilers = spoilEl.checked;
  let shown = 0;
  cards.replaceChildren();
  for (const t of doc.trophies) {
    if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) continue;
    if (kindEl.value !== 'all' && t.kind !== kindEl.value) continue;
    if (missEl.checked && !t.missable) continue;
    if (q && !t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) continue;
    shown++;
    const isEarned = earned.has(t.name);
    const hidden = hideSpoilers && t.story && !isEarned;
    const card = document.createElement('article');
    card.className = 'card' + (isEarned ? ' earned' : '');
    const head = document.createElement('div'); head.className = 'card-head';
    const box = document.createElement('input');
    box.type = 'checkbox'; box.checked = isEarned;
    box.setAttribute('aria-label', 'Earned: ' + (hidden ? 'story trophy' : t.name));
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name); else earned.delete(t.name);
      save(); render();
    });
    const title = document.createElement('h3');
    title.textContent = hidden ? 'Story trophy — hidden until earned' : t.name;
    head.append(box, title);
    const badges = document.createElement('p'); badges.className = 'badges';
    const g = document.createElement('span'); g.className = 'badge grade-' + t.grade; g.textContent = t.grade;
    badges.append(g);
    const k = document.createElement('span'); k.className = 'badge'; k.textContent = t.kind;
    badges.append(k);
    if (t.missable) { const m = document.createElement('span'); m.className = 'badge missable'; m.textContent = 'MISSABLE'; badges.append(m); }
    if (t.story && t.kind !== 'story') { const s = document.createElement('span'); s.className = 'badge'; s.textContent = 'story'; badges.append(s); }
    card.append(head, badges);
    if (hidden) {
      const p = document.createElement('p'); p.className = 'desc'; p.textContent = 'Spoiler hidden. Tick the box once you have earned it to reveal the guide.';
      card.append(p);
    } else {
      const desc = document.createElement('p'); desc.className = 'desc'; desc.textContent = t.description;
      const guide = document.createElement('p'); guide.className = 'guide'; guide.textContent = t.guide;
      const src = document.createElement('p'); src.className = 'sources'; src.textContent = 'Sources: ' + t.sources.join('; ');
      card.append(desc, guide, src);
    }
    cards.append(card);
  }
  document.getElementById('count').textContent = shown + ' of ' + doc.trophies.length + ' trophies shown';
  const total = doc.trophies.length;
  document.getElementById('progress').textContent = earned.size + ' of ' + total + ' earned';
  document.getElementById('pct').textContent = Math.round(earned.size / total * 100) + '%';
  document.getElementById('barfill').style.width = (earned.size / total * 100) + '%';
  const by = {};
  for (const t of doc.trophies) { by[t.grade] = by[t.grade] || [0, 0]; by[t.grade][1]++; if (earned.has(t.name)) by[t.grade][0]++; }
  document.getElementById('bygrade').textContent = ['platinum', 'gold', 'silver', 'bronze'].map(g => g + ' ' + (by[g] ? by[g][0] + '/' + by[g][1] : '0/0')).join('  ·  ');
}

document.getElementById('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify([...earned])], { type: 'application/json' }));
  a.download = 'trophy-progress.json'; a.click();
});
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0]; if (!file) return;
  earned = new Set(JSON.parse(await file.text())); save(); render();
});
document.getElementById('reset').addEventListener('click', () => { earned = new Set(); save(); render(); });
spoilEl.addEventListener('change', () => { localStorage.setItem(SPOILER_KEY, spoilEl.checked ? '1' : '0'); render(); });
for (const el of [gradeEl, kindEl, missEl]) el.addEventListener('change', render);
searchEl.addEventListener('input', render);
renderRoadmap();
render();
if (location.hash) { const el = document.querySelector(location.hash); if (el) el.scrollIntoView(); }
