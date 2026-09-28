// 🎬 The beach billboard: real movie posters (TMDB) from both of your countries.
// It changes every 30 minutes, the same on both phones.
import { CONFIG } from './config.js?v=25';

const SLOT_MS = 30 * 60000;
const CACHE_MS = 6 * 3600000;

// Time zone → country (enough to cover most people; anything else falls back by region)
const TZ_COUNTRY = {
  'Asia/Colombo': 'LK', 'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Qatar': 'QA', 'Asia/Kuwait': 'KW', 'Asia/Muscat': 'OM', 'Asia/Bahrain': 'BH',
  'Asia/Karachi': 'PK', 'Asia/Dhaka': 'BD', 'Asia/Kathmandu': 'NP', 'Indian/Maldives': 'MV', 'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Bangkok': 'TH', 'Asia/Jakarta': 'ID',
  'Asia/Manila': 'PH', 'Asia/Hong_Kong': 'HK', 'Asia/Shanghai': 'CN', 'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Taipei': 'TW', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Jerusalem': 'IL',
  'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Madrid': 'ES', 'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE',
  'Europe/Zurich': 'CH', 'Europe/Vienna': 'AT', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK', 'Europe/Helsinki': 'FI', 'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ',
  'Europe/Athens': 'GR', 'Europe/Istanbul': 'TR', 'Europe/Moscow': 'RU', 'Europe/Kyiv': 'UA', 'Europe/Kiev': 'UA', 'Europe/Lisbon': 'PT', 'Europe/Bucharest': 'RO', 'Europe/Budapest': 'HU',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA', 'America/Winnipeg': 'CA', 'America/Halifax': 'CA', 'America/Mexico_City': 'MX', 'America/Sao_Paulo': 'BR',
  'America/Argentina/Buenos_Aires': 'AR', 'America/Bogota': 'CO', 'America/Lima': 'PE', 'America/Santiago': 'CL', 'Pacific/Honolulu': 'US',
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU', 'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU', 'Pacific/Auckland': 'NZ',
  'Africa/Johannesburg': 'ZA', 'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE', 'Africa/Cairo': 'EG', 'Africa/Casablanca': 'MA',
};
export function countryOf(tz) {
  if (!tz) return null;
  if (TZ_COUNTRY[tz]) return TZ_COUNTRY[tz];
  if (tz.startsWith('America/')) return 'US';
  if (tz.startsWith('Europe/')) return 'GB';
  if (tz.startsWith('Australia/')) return 'AU';
  return null;
}
const COUNTRY_NAME = { LK: 'Sri Lanka', US: 'the USA', IN: 'India', GB: 'the UK', AU: 'Australia', CA: 'Canada', AE: 'the UAE', SG: 'Singapore', NZ: 'New Zealand', JP: 'Japan' };
const cname = c => COUNTRY_NAME[c] || c;

export function initBillboard(ctx) {
  const { $, esc } = ctx;
  let movies = [];          // [{ title, poster, date, overview, country }]
  let loading = false, lastKey = '', status = 'Loading movies…', retryAt = 0;

  const countries = () => [...new Set(['a', 'b'].map(id => countryOf(ctx.tzOf(id))).filter(Boolean))].sort();

  async function fetchJSON(url) { const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json(); }
  async function loadMovies() {
    const key = CONFIG.tmdb; if (!key || loading) return;
    const cs = countries().length ? countries() : ['US'];
    const ck = cs.join(',');
    try {
      const cached = JSON.parse(ctx.lsGet('ourroom:movies') || 'null');
      if (cached && cached.k === ck && cached.m?.length && Date.now() - cached.t < CACHE_MS) { movies = cached.m; lastKey = ck; status = `🎬 ${movies.length} movies from ${cs.map(cname).join(' & ')}`; render(); return; }
    } catch {}
    loading = true;
    try {
      const all = [];
      for (const c of cs) {
        const [up, now] = await Promise.all(['upcoming', 'now_playing'].map(kind =>
          fetchJSON(`https://api.themoviedb.org/3/movie/${kind}?api_key=${encodeURIComponent(key)}&region=${c}&language=en-US&page=1`).catch(e => { status = `🎬 Couldn’t reach TMDB (${e.message})`; return { results: [] }; })));
        const soon = (up.results || []).filter(m => m.poster_path && m.release_date && new Date(m.release_date) > Date.now() - 864e5);
        const pick = [...soon.slice(0, 8), ...(now.results || []).filter(m => m.poster_path).slice(0, 6)];
        for (const m of pick) if (!all.some(x => x.id === m.id && x.country === c)) all.push({ id: m.id, title: m.title, poster: `https://image.tmdb.org/t/p/w342${m.poster_path}`, date: m.release_date, overview: (m.overview || '').slice(0, 260), country: c, soon: soon.includes(m) });
      }
      movies = all; lastKey = ck;
      if (all.length) { ctx.lsSet('ourroom:movies', JSON.stringify({ k: ck, t: Date.now(), m: all })); status = `🎬 ${all.length} movies from ${cs.map(cname).join(' & ')}`; }
      else { retryAt = Date.now() + 10 * 60000; if (!status.includes('Couldn’t')) status = '🎬 TMDB had no movies for your countries right now'; }
    } catch (e) { status = `🎬 Couldn’t load movies (${e.message})`; retryAt = Date.now() + 10 * 60000; }
    finally { loading = false; render(); }
  }

  // Only movie posters on the board; a stable pick for each half hour (same list → same poster on both phones)
  function current() {
    if (!movies.length) return null;
    const slot = Math.floor(Date.now() / SLOT_MS);
    let h = 7; for (const c of String(slot)) h = (h * 31 + c.charCodeAt(0)) | 0;
    return { kind: 'movie', ...movies[Math.abs(h) % movies.length] };
  }
  function render() {
    const box = document.querySelector('.bb-screen'); if (!box) return;
    if (CONFIG.tmdb && (countries().join(',') !== lastKey || (!movies.length && Date.now() > retryAt))) loadMovies();
    const ad = current();
    if (!ad) { if (box.dataset.k !== 'none') { box.dataset.k = 'none'; box.innerHTML = '<div class="bb-food" style="--bb:#2b2d42"><span>🎬</span><b>Movies</b><small>coming soon…</small></div>'; } return; }
    const key = ad.kind + (ad.id || ad.name);
    if (box.dataset.k === key) return;
    box.dataset.k = key;
    box.innerHTML = `<img src="${esc(ad.poster)}" alt="${esc(ad.title)}"><b class="bb-tag">${ad.soon ? 'COMING SOON' : 'NOW SHOWING'}</b>`;
  }
  function details() {
    const ad = current();
    if (!ad) return ctx.showCard(`<div class="big">🎬</div><h2>Movies coming soon</h2><p class="muted">${esc(status)}</p><button class="btn ghost wide small" data-dismiss>Close</button>`, 'billboard');
    const d = ad.date ? new Date(ad.date).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      ctx.showCard(`<img class="bb-poster" src="${esc(ad.poster)}" alt=""><h2>${esc(ad.title)}</h2>
        <p class="muted">${ad.soon ? `🎬 In cinemas ${esc(d)}` : '🍿 Now showing'} in ${esc(cname(ad.country))}</p>
        ${ad.overview ? `<p style="text-align:left;font-size:14px">${esc(ad.overview)}</p>` : ''}
        <p class="muted" style="font-size:11px">${esc(status)} · Movie info from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        <button class="btn ghost wide small" data-dismiss>Close</button>`, 'billboard');
  }
  const sceneHTML = () => `<button class="bb-board" data-billboard aria-label="Billboard"><div class="bb-frame"><div class="bb-screen"></div></div><i class="bb-leg l"></i><i class="bb-leg r"></i><i class="bb-lamp l"></i><i class="bb-lamp r"></i></button>`;

  setInterval(() => { if (document.querySelector('.bb-screen')) render(); }, 60000);
  loadMovies();
  return { sceneHTML, render, route: d => ('billboard' in d ? (details(), true) : false), CLOSABLE: ['billboard'] };
}
