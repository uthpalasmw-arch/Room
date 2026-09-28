// 🎬 The beach billboard: real movie posters (TMDB) from both of your countries.
// It changes every 30 minutes, the same on both phones.
import { CONFIG } from './config.js?v=27';

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
const flag = c => String.fromCodePoint(...[...c].map(ch => 0x1F1A5 + ch.charCodeAt(0)));

// Real, well-known cinemas you can pick for each city (the board can't know showtimes —
// the Showtimes button searches the web for the real ones)
export const CINEMAS = {
  LK: { city: 'Colombo', list: [['scope-ccc', 'Scope Cinemas', 'Colombo City Centre', 'Scope'], ['pvr-ogf', 'PVR Cinemas', 'One Galle Face Mall', 'PVR'], ['liberty', 'Liberty by Scope', 'Kollupitiya', 'Liberty'], ['majestic', 'Majestic Cineplex', 'Majestic City, Bambalapitiya', 'Majestic'], ['savoy', 'Savoy 3D', 'Wellawatte', 'Savoy']] },
  US: { city: 'Houston', list: [['amc-studio30', 'AMC Studio 30', 'Houston', 'AMC 30'], ['regal-marqe', 'Regal Edwards Marq’E', 'Houston', 'Regal'], ['cinemark-memorial', 'Cinemark Memorial City', 'Houston', 'Cinemark'], ['amc-willowbrook', 'AMC Willowbrook 24', 'Houston', 'AMC 24'], ['alamo-mason', 'Alamo Drafthouse Mason Park', 'Katy', 'Alamo']] },
};

export function initBillboard(ctx) {
  const { $, esc } = ctx;
  let movies = [];          // [{ title, poster, date, overview, country }]
  let picks = {};   // chosen cinema per country (shared)
  const cinemaOf = c => { const cs = CINEMAS[c]; return cs && (cs.list.find(x => x[0] === picks[c]) || cs.list[0]); };
  const dateText = (ad, c, short) => {
    const d = ad.dates?.[c];
    if (!d) return ad.country === c && !ad.soon ? (short ? 'NOW' : 'now showing') : (short ? 'TBA' : 'date TBA');
    const dt = new Date(d + 'T12:00:00');
    if (dt <= Date.now()) return short ? 'NOW' : 'now showing';
    return short ? dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'in cinemas ' + dt.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };
  let loading = false, lastKey = '', status = 'Loading movies…', retryAt = 0;

  const countries = () => [...new Set(['a', 'b'].map(id => countryOf(ctx.tzOf(id))).filter(Boolean))].sort();

  async function fetchJSON(url) { const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json(); }
  async function loadMovies() {
    const key = CONFIG.tmdb; if (!key || loading) return;
    const cs = countries().length ? countries() : ['US'];
    const ck = cs.join(',');
    try {
      const cached = JSON.parse(ctx.lsGet('ourroom:movies') || 'null');
      if (cached && cached.k === ck && cached.v === 2 && cached.m?.length && Date.now() - cached.t < CACHE_MS) { movies = cached.m; lastKey = ck; status = `🎬 ${movies.length} movies from ${cs.map(cname).join(' & ')}`; render(); return; }
    } catch {}
    loading = true;
    try {
      const all = [];
      const seen = new Map();
      for (const c of cs) {
        const [up, now] = await Promise.all(['upcoming', 'now_playing'].map(kind =>
          fetchJSON(`https://api.themoviedb.org/3/movie/${kind}?api_key=${encodeURIComponent(key)}&region=${c}&language=en-US&page=1`).catch(e => { status = `🎬 Couldn’t reach TMDB (${e.message})`; return { results: [] }; })));
        const soon = (up.results || []).filter(m => m.poster_path && m.release_date && new Date(m.release_date) > Date.now() - 864e5);
        const pick = [...soon.slice(0, 8), ...(now.results || []).filter(m => m.poster_path).slice(0, 6)];
        for (const m of pick) {
          if (seen.has(m.id)) continue;
          const mv = { id: m.id, title: m.title, poster: `https://image.tmdb.org/t/p/w342${m.poster_path}`, date: m.release_date, overview: (m.overview || '').slice(0, 260), country: c, soon: soon.includes(m), dates: {} };
          seen.set(m.id, mv); all.push(mv);
        }
      }
      // The real cinema release date in each of your countries
      for (let i = 0; i < all.length; i += 6) {
        await Promise.all(all.slice(i, i + 6).map(async mv => {
          try {
            const rd = await fetchJSON(`https://api.themoviedb.org/3/movie/${mv.id}/release_dates?api_key=${encodeURIComponent(key)}`);
            for (const c of cs) {
              const r = (rd.results || []).find(x => x.iso_3166_1 === c);
              const th = r?.release_dates?.filter(x => x.type === 3 || x.type === 2).sort((a, b) => a.release_date.localeCompare(b.release_date))[0];
              if (th) mv.dates[c] = th.release_date.slice(0, 10);
            }
          } catch {}
        }));
      }
      movies = all; lastKey = ck;
      if (all.length) { ctx.lsSet('ourroom:movies', JSON.stringify({ k: ck, v: 2, t: Date.now(), m: all })); status = `🎬 ${all.length} movies from ${cs.map(cname).join(' & ')}`; }
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
    const key = ad.kind + (ad.id || ad.name) + JSON.stringify(picks) + countries().join();
    if (box.dataset.k === key) return;
    box.dataset.k = key;
    box.innerHTML = `<img src="${esc(ad.poster)}" alt="${esc(ad.title)}"><div class="bb-strip">${countries().map(c => `<span>${flag(c)} <b>${esc(cinemaOf(c)?.[3] || c)}</b> ${esc(dateText(ad, c, true))}</span>`).join('')}</div>`;
  }
  function details() {
    const ad = current();
    if (!ad) return ctx.showCard(`<div class="big">🎬</div><h2>Movies coming soon</h2><p class="muted">${esc(status)}</p><button class="btn ghost wide small" data-dismiss>Close</button>`, 'billboard');
    ctx.showCard(`<img class="bb-poster" src="${esc(ad.poster)}" alt=""><h2>${esc(ad.title)}</h2>
      ${ad.overview ? `<p style="text-align:left;font-size:14px">${esc(ad.overview)}</p>` : ''}
      <div class="bb-cines">${countries().map(c => {
        const cin = cinemaOf(c), q = cin ? `${cin[1]} ${cin[2]}` : '';
        return `<div class="bb-cine"><b>${flag(c)} ${esc(cname(c))} · ${esc(dateText(ad, c))}</b>
          ${cin ? `<span>🎦 ${esc(cin[1])} — ${esc(cin[2])}</span>
          <div class="row"><a class="btn ghost small" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}">📍 Map</a>
          <a class="btn ghost small" target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent(`${ad.title} showtimes ${q}`)}">🎟️ Showtimes</a>
          <button class="btn ghost small" data-bb-cinema="${c}">🔁 Change</button></div>` : ''}</div>`;
      }).join('')}</div>
      <p class="muted" style="font-size:11px">${esc(status)} · Showtimes aren’t guaranteed — tap 🎟️ to check. This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      <button class="btn ghost wide small" data-dismiss>Close</button>`, 'billboard');
  }
  // 🔁 Pick your cinema (shared by both of you)
  function pickCinema(c) {
    const cs = CINEMAS[c]; if (!cs) return;
    const cur = cinemaOf(c)?.[0];
    ctx.showCard(`<h2>🎦 Your cinema in ${esc(cs.city)}</h2>
      <div class="room-pick">${cs.list.map(([id, n, where]) => `<button data-bb-cinema-set="${c}:${id}"><span>${id === cur ? '✅' : '🎦'}</span><div>${esc(n)}<small>${esc(where)}</small></div></button>`).join('')}</div>
      <button class="btn ghost wide small" style="margin-top:10px" data-billboard>← Back</button>`, 'billboard');
  }
  const sceneHTML = () => `<button class="bb-board" data-billboard aria-label="Billboard"><div class="bb-frame"><div class="bb-screen"></div></div><i class="bb-leg l"></i><i class="bb-leg r"></i><i class="bb-lamp l"></i><i class="bb-lamp r"></i></button>`;

  setInterval(() => { if (document.querySelector('.bb-screen')) render(); }, 60000);
  loadMovies();
  function route(d) {
    if ('billboard' in d) { details(); return true; }
    if (d.bbCinema) { pickCinema(d.bbCinema); return true; }
    if (d.bbCinemaSet) { const [c, id] = d.bbCinemaSet.split(':'); ctx.store.update('billboard/cinemas', { [c]: id }); picks = { ...picks, [c]: id }; details(); return true; }
    return false;
  }
  function onData(v) { picks = v?.cinemas || {}; render(); }
  return { sceneHTML, render, route, onData, CLOSABLE: ['billboard'] };
}
