// 🎉 Festivals & seasons: date windows, a temporary decoration pack per festival (auto-removed afterwards),
// and extra touches outside (bats, snow, Santa, lanterns, fireworks, koel calls…).

// ?fest=halloween|christmas|xmasday|newyear|slny|vesak previews a festival (demo/testing only)
const FORCE = new URLSearchParams(location.search).get('fest');
const FORCE_DATE = { halloween: [10, 31], christmas: [12, 20], xmasday: [12, 25], newyear: [12, 31], slny: [4, 14], vesak: [5, 1] };

// Vesak follows the full moon, so its dates are listed per year (Sri Lanka's Vesak Poya)
const VESAK = { 2026: [5, 1], 2027: [5, 20], 2028: [5, 8], 2029: [5, 27], 2030: [5, 16], 2031: [5, 6], 2032: [5, 24] };

export function today() {
  const d = new Date();
  if (FORCE && FORCE_DATE[FORCE]) { const [m, day] = FORCE_DATE[FORCE]; d.setMonth(m - 1, day); }
  return d;
}
const md = d => (d.getMonth() + 1) * 100 + d.getDate();   // e.g. 1031
function inRange(d, a, b) { const x = md(d); return a <= b ? x >= a && x <= b : x >= a || x <= b; }

export const EVENTS = {
  halloween: { name: 'Halloween', icon: '🎃', hello: '🎃 Happy Halloween! Tap the 🎃 button for spooky decorations', when: d => inRange(d, 1020, 1101) },
  christmas: { name: 'Christmas', icon: '🎄', hello: '🎄 It’s Christmas season! Tap 🎄 for festive decorations', when: d => inRange(d, 1210, 102) },
  newyear: { name: 'New Year', icon: '🎆', hello: '🎆 Happy New Year! Fireworks light up the sky outside tonight', when: d => inRange(d, 1231, 101) },
  slny: { name: 'Sinhala & Tamil New Year', icon: '🪔', hello: '🌞 සුභ අලුත් අවුරුද්දක් වේවා! Happy Sinhala & Tamil New Year — tap 🪔 for Avurudu decorations', when: d => inRange(d, 410, 417) },
  vesak: {
    name: 'Vesak', icon: '🏮', hello: '🏮 Happy Vesak! Tap 🏮 for lanterns and lamps — look at the sky tonight',
    when: d => { const v = VESAK[d.getFullYear()]; if (!v) return false; const c = new Date(d.getFullYear(), v[0] - 1, v[1]); return Math.abs(d - c) <= 4 * 864e5; },
  },
};
export function activeEvents(d = today()) {
  const list = Object.keys(EVENTS).filter(id => EVENTS[id].when(d));
  if (FORCE && !list.includes(FORCE === 'xmasday' ? 'christmas' : FORCE)) list.push(FORCE === 'xmasday' ? 'christmas' : FORCE);
  return list;
}
export const isActive = id => activeEvents().includes(id);
export const isChristmasDay = (d = today()) => md(d) === 1225 || FORCE === 'xmasday';

// ── Decoration packs ────────────────────────────────────────
// CSS-drawn festival pieces (added to the app's furniture list, hidden from the normal Furniture tab)
export const SEASON_FURN = {
  jackolantern: { label: 'Jack-o’-lantern', icon: '🎃', c: '#ff7a00', season: 'halloween', html: '<div class="jl-stem"></div><div class="jl-body"><i class="e l"></i><i class="e r"></i><i class="m"></i></div>' },
  xmastree: { label: 'Christmas tree', icon: '🎄', c: '#1f8a4c', season: 'christmas', html: '<div class="xt-trunk"></div><div class="xt-t t3"></div><div class="xt-t t2"></div><div class="xt-t t1"></div><div class="xt-star">★</div>'
    + Array.from({ length: 12 }, (_, i) => `<i class="xt-b" style="left:${[42, 56, 34, 62, 48, 28, 70, 38, 58, 22, 50, 76][i]}%;top:${[26, 32, 44, 46, 52, 60, 62, 70, 74, 78, 82, 80][i]}%;animation-delay:${(i % 4) * .35}s;background:${['#ff4d6d', '#ffd60a', '#4f8cff', '#fff'][i % 4]}"></i>`).join('') },
  kudu: { label: 'Vesak lantern', icon: '🏮', c: '#ffd60a', season: 'vesak', html: '<div class="kd-string"></div><div class="kd-body"><i></i></div><div class="kd-tails"><i></i><i></i><i></i><i></i><i></i></div>' },
  pahana: { label: 'Oil lamp (pahana)', icon: '🪔', c: '#c8875a', season: 'slny', html: '<div class="ph-flame"></div><div class="ph-cup"></div><div class="ph-stand"></div>' },
  pahana2: { label: 'Clay lamp', icon: '🪔', c: '#b5651d', season: 'vesak', html: '<div class="ph-flame"></div><div class="ph-cup"></div>' },
  avurudu: { label: 'Avurudu table', icon: '🍚', c: '#ffffff', season: 'slny', html: '<div class="av-cloth"></div><div class="av-plate p1"><i class="kb"></i><i class="kb"></i><i class="kb"></i></div><div class="av-plate p2"><i class="kv"></i><i class="kv"></i><i class="kv"></i></div><div class="av-plate p3"><i class="kk"></i><i class="kk"></i></div><div class="av-banana">🍌</div>' },
  raban: { label: 'Raban drum', icon: '🥁', c: '#c0392b', season: 'slny', html: '<div class="rb-side"></div><div class="rb-top"></div>' },
};
export const PACKS = {
  halloween: [['f', 'jackolantern'], ['e', '👻'], ['e', '🕸️'], ['e', '🦇'], ['e', '🕷️'], ['e', '💀'], ['e', '🍬'], ['e', '🧙'], ['e', '🕯️'], ['e', '🧪'], ['e', '⚰️'], ['t', 'Happy Halloween! 🎃']],
  christmas: [['f', 'xmastree'], ['e', '🎁'], ['e', '🧦'], ['e', '⛄'], ['e', '🔔'], ['e', '🍭'], ['e', '🎅'], ['e', '🦌'], ['e', '❄️'], ['e', '🌟'], ['e', '🍪'], ['e', '🥛'], ['t', 'Merry Christmas! 🎄']],
  newyear: [['e', '🎉'], ['e', '🎊'], ['e', '🥳'], ['e', '🍾'], ['e', '🥂'], ['e', '🎆'], ['e', '🎈'], ['t', `Happy New Year ${today().getMonth() === 11 ? today().getFullYear() + 1 : today().getFullYear()}! 🎆`]],
  slny: [['f', 'avurudu'], ['f', 'pahana'], ['f', 'raban'], ['e', '🏺'], ['e', '🥥'], ['e', '🍌'], ['e', '🌺'], ['e', '🪷'], ['t', 'සුභ අලුත් අවුරුද්දක් 🌞']],
  vesak: [['f', 'kudu'], ['f', 'pahana2'], ['e', '🪷'], ['e', '🏮'], ['e', '🕯️'], ['e', '🌸'], ['t', 'Happy Vesak 🪷']],
};

// Extra outdoor touches while a festival is on
export function skyExtras(rm) {
  const ev = activeEvents(), out = [];
  if (ev.includes('halloween')) out.push(`<div class="fx-bats">${Array.from({ length: 7 }, (_, i) => `<span style="top:${6 + (i * 13) % 34}%;animation-delay:-${i * 2.3}s;animation-duration:${11 + (i % 3) * 4}s">🦇</span>`).join('')}</div><div class="fx-fog"></div>`);
  if (ev.includes('christmas')) {
    out.push('<div class="fx-sleigh"><span>🛷🦌🦌</span></div>');
    if (isChristmasDay()) out.push('<div class="fx-star"><b>✦</b></div>');
    if (rm === 'yard') out.push('<div class="fx-roofbulbs">' + Array.from({ length: 16 }, (_, i) => `<i style="animation-delay:${(i % 4) * .4}s;background:${['#ff4d6d', '#ffd60a', '#4f8cff', '#2ecc71'][i % 4]}"></i>`).join('') + '</div><div class="fx-wreath">🎀</div>');
  }
  if (ev.includes('vesak')) {
    out.push(`<div class="fx-lanterns">${Array.from({ length: 8 }, (_, i) => `<span style="left:calc(${10 + i * 24} * var(--u));animation-delay:-${i * 3}s">🏮</span>`).join('')}</div>`);
    if (rm === 'yard') out.push('<div class="fx-porchkudu"><i></i><i></i></div>');
  }
  if (ev.includes('slny')) out.push(`<div class="fx-petals">${Array.from({ length: 10 }, (_, i) => `<span style="left:calc(${8 + i * 19} * var(--u));animation-delay:-${i * 1.3}s">🌺</span>`).join('')}</div>`);
  if (ev.includes('newyear')) out.push('<div class="fx-fireworks"></div>');
  return out.join('');
}

export function initSeasons(ctx) {
  const { $, esc } = ctx;
  let shown = '';
  const greeted = new Set();

  // The temporary festival button (top-right of the room)
  function refresh() {
    const ev = activeEvents();
    const st = $('#stage');
    Object.keys(EVENTS).forEach(id => st.classList.toggle('ev-' + id, ev.includes(id)));
    st.classList.toggle('ev-xmasday', isChristmasDay() && ev.includes('christmas'));
    const packs = ev.filter(id => PACKS[id]);
    let wrap = $('#fest-btns');
    if (!wrap) { wrap = document.createElement('div'); wrap.id = 'fest-btns'; st.append(wrap); }
    const key = packs.join();
    if (key !== shown) {
      wrap.innerHTML = packs.map(id => `<button class="fest-btn" data-fest="${id}" aria-label="${EVENTS[id].name} decorations">${EVENTS[id].icon}</button>`).join('');
      shown = key;
    }
    for (const id of ev) if (!greeted.has(id) && ctx.lsGet(`ourroom:fest:${id}:${today().getFullYear()}`) !== '1') {
      greeted.add(id); ctx.lsSet(`ourroom:fest:${id}:${today().getFullYear()}`, '1');
      setTimeout(() => ctx.toast(EVENTS[id].hello, 6000), 1800);
    }
  }
  function openPack(id) {
    const items = PACKS[id]; if (!items) return;
    ctx.showCard(`<div class="big">${EVENTS[id].icon}</div><h2>${esc(EVENTS[id].name)} decorations</h2>
      <p class="muted">Only for the festival — they tidy themselves away when it’s over ✨</p>
      <div class="fest-grid">${items.map(([t, v], i) => {
        const icon = t === 'f' ? SEASON_FURN[v].icon : t === 't' ? '🔤' : v;
        const label = t === 'f' ? SEASON_FURN[v].label : t === 't' ? v : '';
        return `<button data-fest-add="${id}:${i}"><span>${icon}</span>${label ? `<small>${esc(label)}</small>` : ''}</button>`;
      }).join('')}</div>
      <button class="btn ghost wide small" style="margin-top:12px" data-dismiss>Close</button>`, 'fest');
  }
  function add(ref) {
    const [id, i] = ref.split(':'), it = PACKS[id]?.[+i];
    if (!it) return;
    if (ctx.wild()) return ctx.toast('🌿 Put festival decorations at home or in the front yard');
    ctx.hideOverlay();
    const [t, v] = it, x = ctx.centerX() + (Math.random() - .5) * 20;
    if (t === 'f') ctx.addItem({ t: 'furn', k: v, c: SEASON_FURN[v].c, x, y: v === 'kudu' ? 34 : 80, season: id });
    else if (t === 't') ctx.addItem({ t: 'text', v, c: '#ffffff', x, y: 22, season: id });
    else ctx.addItem({ t: 'emoji', v, x, y: 70 + Math.random() * 18, season: id });
    ctx.sfx.pop();
  }

  // 🎆 Fireworks outside on New Year's Eve night (in the shared sky's time)
  function fireworks() {
    const box = document.querySelector('.fx-fireworks'); if (!box || document.hidden) return;
    const h = ctx.skyHour();
    const party = isActive('newyear') && (h >= 20 || h < 3);
    if (!party) return;
    const burst = document.createElement('div');
    const col = ['#ff4d6d', '#ffd60a', '#4f8cff', '#2ecc71', '#c77dff', '#ff9f1c'][Math.floor(Math.random() * 6)];
    burst.className = 'fw-burst';
    burst.style.left = `calc(${20 + Math.random() * 160} * var(--u))`; burst.style.top = (6 + Math.random() * 26) + '%';
    burst.style.setProperty('--fw', col);
    burst.innerHTML = Array.from({ length: 12 }, (_, i) => `<i style="--a:${i * 30}deg"></i>`).join('');
    box.append(burst);
    ctx.sfx.boom?.();
    setTimeout(() => burst.remove(), 1600);
  }
  // 🐦 The koel's call around Avurudu
  function koel() { if (isActive('slny') && ctx.outside() && !document.hidden) ctx.sfx.koel?.(); }

  setInterval(refresh, 60000);
  setInterval(fireworks, 700);
  setInterval(koel, 35000);

  function route(d) {
    if (d.fest) { openPack(d.fest); return true; }
    if (d.festAdd) { add(d.festAdd); return true; }
    return false;
  }
  return { refresh, route, CLOSABLE: ['fest'] };
}
