// 🏡 Outside: the front yard (and later the beach and woods), travel rules, one shared sky, walking together.

import { today, isActive, isChristmasDay, skyExtras } from './seasons.js?v=24';

export const INDOOR = ['living', 'bedroom', 'kitchen', 'garden'];
export const OUTDOOR = ['yard', 'beach', 'woods'];
const PLACE_NAME = { yard: 'front yard', beach: 'beach', woods: 'woods' };
const WALK_MS = 1600;

// Where you can go from each place. Outside you must come home through the front door first.
function linksFrom(rm) {
  if (rm === 'yard') return ['living', 'woods', 'beach'];
  if (rm === 'woods' || rm === 'beach') return ['yard'];
  return rm === 'living' ? [...INDOOR, 'yard'] : INDOOR;
}

// Time of day for a time zone → dawn / day / sunset / night
function localHour(tz) {
  try {
    const p = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: 'numeric', hourCycle: 'h23', timeZone: tz }).formatToParts(new Date());
    return +p.find(x => x.type === 'hour').value + +p.find(x => x.type === 'minute').value / 60;
  } catch { const d = new Date(); return d.getHours() + d.getMinutes() / 60; }
}
const phaseOf = h => h >= 5 && h < 7 ? 'dawn' : h >= 7 && h < 17 ? 'day' : h >= 17 && h < 19.3 ? 'sunset' : 'night';
const PHASE_LABEL = { dawn: '🌄 Sunrise', day: '☀️ Daytime', sunset: '🌅 Sunset', night: '🌙 Night' };

const YARD = `
  <div class="os-hills"><i class="h1"></i><i class="h2"></i><i class="h3"></i></div>
  <div class="os-sun"></div><div class="os-moon"></div><div class="os-stars"></div>
  <div class="ys-house">
    <div class="ys-chimney"><i class="ys-smoke s1"></i><i class="ys-smoke s2"></i></div>
    <div class="ys-garage"><div class="ys-groof"></div><div class="ys-gwall"><div class="ys-gdoor"></div><div class="ys-glamp"></div></div></div>
    <div class="ys-roof"><div class="ys-attic"></div></div><div class="ys-fascia"></div>
    <div class="ys-body">
      <div class="ys-band"></div>
      <div class="ys-win up w1"><span class="ys-face"></span><i class="sh l"></i><i class="sh r"></i></div>
      <div class="ys-win up mid"><span class="ys-face"></span></div>
      <div class="ys-win up w4"><span class="ys-face"></span><i class="sh l"></i><i class="sh r"></i></div>
      <div class="ys-win dn w2"><span class="ys-face"></span><i class="sh l"></i><i class="sh r"></i><b class="ys-box"></b></div>
      <div class="ys-win dn w3"><span class="ys-face"></span><i class="sh l"></i><i class="sh r"></i><b class="ys-box"></b></div>
      <div class="ys-porch"><div class="ys-proof"></div><i class="ys-col l"></i><i class="ys-col r"></i><i class="ys-lamp l"></i><i class="ys-lamp r"></i></div>
      <button class="ys-door" data-go="living" aria-label="Go inside"><i class="ys-glass"></i><i class="ys-knob"></i><span class="ys-sign-home">🏠 Home</span></button>
      <div class="ys-num">12</div>
      <div class="ys-base"></div>
    </div>
    <div class="ys-steps"><i></i><i></i><i></i></div><div class="ys-mat"></div>
    <div class="ys-bush b1"></div><div class="ys-bush b2"></div><div class="ys-bush b3"></div><div class="ys-bush b4"></div>
  </div>
  <div class="ys-path"></div>
  <i class="ys-plight" style="left:calc(90 * var(--u));top:70%"></i><i class="ys-plight" style="left:calc(110 * var(--u));top:70%"></i>
  <i class="ys-plight" style="left:calc(87 * var(--u));top:84%"></i><i class="ys-plight" style="left:calc(113 * var(--u));top:84%"></i>
  <div class="ys-fence l"></div><div class="ys-fence r"></div>

  <button class="os-sign l" data-go="woods"><b>← 🌲 Woods</b><i></i></button>
  <button class="os-sign r" data-go="beach"><b>Beach 🏖️ →</b><i></i></button>`;

const BEACH = `
  <div class="os-sun"></div><div class="os-moon"></div><div class="os-stars"></div>
  <div class="bs-sea"><i class="bs-glint"></i>
    <div class="bs-life"><span class="bs-ship">🚢</span><span class="bs-boat">⛵</span><span class="bs-whale"><i></i>🐋</span>
      <span class="bs-dolph"><b>🐬</b><b>🐬</b><b>🐬</b></span></div></div>
  <div class="bs-shore"><i class="w1"></i><i class="w2"></i></div>
  <div class="bs-gulls"><span><i></i><i></i></span><span><i></i><i></i></span><span><i></i><i></i></span></div>
  <div class="bs-palm p1"><i class="trunk"></i><b>🌴</b></div><div class="bs-palm p2"><i class="trunk"></i><b>🌴</b></div>
  <button class="bs-crab c1" data-crab="1">🦀</button><button class="bs-crab c2" data-crab="2">🦀</button>
  <div class="bs-shells"></div>
  <div class="bs-pier"><i class="post p1"></i><i class="post p2"></i><i class="post p3"></i></div>
  <button class="os-sign l" data-go="yard"><b>← 🏡 Home</b><i></i></button>
  <button class="bs-photo" data-photo-spot style="left:calc(134 * var(--u))" aria-label="Photo spot"><b>📸</b><span>Photo spot</span></button>`;

const WOODS = `
  <div class="os-sun"></div><div class="os-moon"></div><div class="os-stars"></div>
  <div class="ws-far"></div><div class="ws-mid"></div>
  <div class="ws-stream"><i></i></div>
  ${[[4, 30, 1.25], [26, 34, 1], [52, 29, 1.1], [150, 30, 1.2], [176, 33, 1], [196, 29, 1.3]].map(([x, b, s]) => `<div class="ws-tree" style="left:calc(${x} * var(--u));bottom:${b}%;--ts:${s}"><i class="tk"></i><b>🌲</b></div>`).join('')}
  <div class="ws-flies">${Array.from({ length: 14 }, (_, i) => `<i style="left:calc(${(7 + i * 13.5) % 196} * var(--u));top:${55 + (i * 37) % 38}%;animation-delay:-${(i * 0.7).toFixed(1)}s"></i>`).join('')}</div>
  <div class="ws-animals"></div>
  <button class="bs-photo" data-photo-spot style="left:calc(20 * var(--u));top:calc(66% - 16 * var(--u))" aria-label="Photo spot"><b>📸</b><span>Photo spot</span></button>
  <button class="os-sign r" data-go="yard"><b>Home 🏡 →</b><i></i></button>`;

// Woodland animals: [emoji, when they're about, home zone x1-x2, y1-y2 (%), size]
const ANIMALS = {
  deer: ['🦌', ['dawn', 'day', 'sunset'], [60, 140], [66, 80], 13],
  rabbit1: ['🐇', ['dawn', 'day', 'sunset'], [20, 90], [72, 95], 7],
  rabbit2: ['🐇', ['day', 'sunset'], [110, 185], [74, 95], 6.5],
  squirrel: ['🐿️', ['dawn', 'day'], [140, 190], [68, 84], 6],
  fox: ['🦊', ['dawn', 'sunset', 'night'], [30, 170], [70, 92], 9],
  hedgehog: ['🦔', ['sunset', 'night'], [40, 160], [82, 96], 6],
  owl: ['🦉', ['night', 'dawn'], [150, 150], [34, 34], 7],
  bird1: ['🐦', ['dawn', 'day'], [26, 26], [30, 30], 5],
  bird2: ['🐦', ['day', 'sunset'], [176, 176], [33, 33], 5],
};
const REACT = { deer: 'The deer looks up at you… then trots away 🦌', rabbit1: 'Boing! The rabbit hops off 🐇', rabbit2: 'Boing! The rabbit hops off 🐇',
  squirrel: 'The squirrel scurries up a tree 🐿️🌲', fox: 'The fox tilts its head at you 🦊', hedgehog: 'The hedgehog curls into a ball 🦔',
  owl: 'Hoo-hoo! 🦉', bird1: 'Tweet! The bird flutters away 🐦', bird2: 'Tweet! The bird flutters away 🐦' };

// 🌦️ Weather is picked from the clock, so both phones get the same showers at the same time.
// Every 2-hour window may hold one shower (≈3 a day): 20–40 min of rain, sometimes a 15–25 min storm
// in the middle, sometimes a 15-minute rainbow afterwards. In winter the showers fall as snow.
const MIN = 60000, WIN = 120 * MIN;
function showerIn(k) {
  const d = new Date(k * WIN), m = d.getMonth() + 1, winter = m === 12 || m <= 2;
  const xmasWin = (m === 12 && d.getDate() >= 10) || (m === 1 && d.getDate() <= 2);
  const chance = winter ? (xmasWin ? 0.5 : 0.32) : 0.25;
  if (rnd('sh' + k) >= chance) return null;
  const dur = (20 + rnd('sd' + k) * 20) * MIN, start = k * WIN + rnd('so' + k) * (WIN - dur - 16 * MIN);
  const storm = !winter && rnd('st' + k) < 0.35, sDur = Math.min(dur * 0.7, (15 + rnd('sl' + k) * 10) * MIN), sStart = start + (dur - sDur) / 2;
  return { start, end: start + dur, snow: winter, storm, sStart, sEnd: sStart + sDur, bow: !winter && rnd('bw' + k) < 0.5 };
}
export function weatherAt(t = Date.now()) {
  if (isActive('christmas') && isChristmasDay()) return 'snow';
  const k = Math.floor(t / WIN);
  for (const w of [showerIn(k), showerIn(k - 1)]) {
    if (!w) continue;
    if (t >= w.start && t < w.end) return w.snow ? 'snow' : w.storm && t >= w.sStart && t < w.sEnd ? 'storm' : 'rain';
    if (w.bow && t >= w.end && t < w.end + 15 * MIN) return 'rainbow';
  }
  return 'clear';
}
// Rain (or a storm) stops fires, kites and surfing
export const isWet = (t = Date.now()) => ['rain', 'storm'].includes(weatherAt(t));

const SHELLS = ['🐚', '🐚', '🦪', '🐚', '🪸', '🐚'];
const dayKey = () => new Date().toISOString().slice(0, 10);
// A new batch of shells washes up with every tide (every 4 hours, same for both phones)
const tideKey = () => { const d = new Date(); return d.toISOString().slice(0, 10) + 't' + Math.floor(d.getUTCHours() / 4); };
function rnd(seed) { let h = 2166136261; for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; }

export function initOutside(ctx) {
  const { $, esc, store } = ctx;
  let shared = null;        // { tz, by, ts } — whose clock the sky follows while anyone is outside
  let walkSeen = 0, walking = false;

  const isOut = rm => OUTDOOR.includes(rm);
  const here = () => ctx.view();
  const otherOut = () => ctx.isOnline(ctx.other()) && isOut(ctx.roomOf(ctx.other()));
  const skyTz = () => shared?.tz || ctx.myTz();

  function sceneHTML(rm) {
    const html = rm === 'yard' ? YARD : rm === 'beach' ? BEACH : rm === 'woods' ? WOODS : '';
    return html ? html + skyExtras(rm) + '<div class="wx-bolt"></div><div class="wx-flash"></div><div class="wx-rain"></div><div class="wx-snow"></div><div class="wx-rainbow"></div>' : '';
  }

  // ── 🌲 Woods: animals wander their patch (same plan on both phones), shy of people ──
  const spooked = {};
  function animalsTick() {
    const box = document.querySelector('.ws-animals'); if (!box) return;
    const ph = phaseOf(localHour(skyTz())), slot = Math.floor(Date.now() / 7000), day = dayKey();
    const people = ctx.peopleHere();
    for (const [id, [e, when, [x1, x2], [y1, y2], size]] of Object.entries(ANIMALS)) {
      let el = box.querySelector(`[data-animal="${id}"]`);
      const out = when.includes(ph) && !(spooked[id] > Date.now() && ['squirrel', 'bird1', 'bird2'].includes(id));
      if (!el) {
        el = document.createElement('button');
        el.className = 'ws-animal'; el.dataset.animal = id; el.textContent = e;
        el.style.fontSize = `calc(${size} * var(--u))`;
        box.append(el);
      }
      el.classList.toggle('gone', !out);
      if (!out) continue;
      let x = x1 + rnd(day + id + 'x' + slot) * (x2 - x1), y = y1 + rnd(day + id + 'y' + slot) * (y2 - y1);
      // Fed it? Then it trots after whoever fed it for a while
      const fol = ctx.follower?.(id);
      if (fol && x1 !== x2) { x = Math.max(8, Math.min(192, fol.x + 9)); y = Math.min(96, Math.max(60, fol.y + 1)); }
      // Shy: keep away from people (and run further if you just startled them)
      else for (const p of people) {
        const dx = x - p.x, dist = Math.hypot(dx, (y - p.y) * 1.2);
        const need = spooked[id] > Date.now() ? 45 : 20;
        if (x1 !== x2 && dist < need) x = Math.max(8, Math.min(192, x + (dx >= 0 ? 1 : -1) * (need - dist + 10)));
      }
      const px = el._x ?? x;
      el.classList.toggle('flip', x > px + .5 ? true : x < px - .5 ? false : el.classList.contains('flip'));
      el._x = x;
      el.style.left = `calc(${x.toFixed(1)} * var(--u))`; el.style.top = y.toFixed(1) + '%';
    }
  }
  function tapAnimal(el) {
    const id = el.dataset.animal; if (!id) return;
    spooked[id] = Date.now() + 9000;
    el.classList.remove('react'); void el.offsetWidth; el.classList.add('react', 'react-' + id.replace(/\d/, ''));
    setTimeout(() => el.classList.remove('react', 'react-' + id.replace(/\d/, '')), 1400);
    ctx.sfx.pop();
    if (ctx.onAnimal) ctx.onAnimal(id); else ctx.toast(REACT[id], 2200);
    setTimeout(animalsTick, 500);
  }

  // ── 🌦️ Weather ──
  let lastWx = null;
  function applyWeather() {
    const st = $('#stage'), out = isOut(here());
    const wx = out ? weatherAt() : 'clear';
    st.classList.toggle('wx-rainy', wx === 'rain' || wx === 'storm');
    st.classList.toggle('wx-storm', wx === 'storm');
    st.classList.toggle('wx-snowy', wx === 'snow');
    st.classList.toggle('wx-bow', wx === 'rainbow' && phaseOf(localHour(skyTz())) !== 'night');
    if (out && wx !== lastWx && lastWx !== null && ['rain', 'storm'].includes(wx) && !['rain', 'storm'].includes(lastWx)) ctx.onRainStart?.();
    if (out && wx !== lastWx && lastWx !== null) ctx.toast(wx === 'storm' ? '⛈️ A thunderstorm is rolling in!' : wx === 'rain' ? '🌧️ It’s starting to rain!' : wx === 'snow' ? '❄️ It’s snowing!' : wx === 'rainbow' ? '🌈 The rain stopped — look, a rainbow!' : '☀️ The sky is clearing up', 3000);
    lastWx = out ? wx : null;
    return wx;
  }

  // ── 🏖️ Beach: seashells to collect (new ones every day), crabs, sandcastles, photo spot ──
  let beachData = {};
  function onBeach(v) { beachData = v || {}; renderShells(); }
  function renderShells() {
    const box = document.querySelector('.bs-shells'); if (!box) return;
    const day = tideKey(), taken = beachData.shells?.[day] || {};
    box.innerHTML = SHELLS.map((e, i) => taken[i] ? '' : `<button class="bs-shell" data-shell="${i}" style="left:calc(${(12 + rnd(day + 'x' + i) * 176).toFixed(1)} * var(--u));top:${(70 + rnd(day + 'y' + i) * 25).toFixed(1)}%">${e}</button>`).join('');
  }
  async function pickShell(i) {
    const day = tideKey();
    const ok = await store.transact(`beach/shells/${day}/${i}`, cur => cur ? undefined : ctx.me());
    if (!ok) return;
    let n = 0;
    await store.transact(`beach/count/${ctx.me()}`, c => (n = (c || 0) + 1));
    ctx.sfx.pop();
    ctx.toast(`${SHELLS[i]} Found a shell! It’s in your shell jar at home 🫙 (you’ve found ${n})`, 2500);
    if (n % 10 === 0) ctx.logAct('shells', `has collected ${n} seashells at the beach 🐚`);
  }
  function crab(el) {
    if (el.classList.contains('hide')) return;
    el.classList.add('hide'); ctx.sfx.swish();
    setTimeout(() => el.classList.remove('hide'), 5000);
  }
  function buildCastle() {
    const it = ctx.pickSpot();
    ctx.addScenery({ t: 'emoji', v: '🏰', tide: true, x: it.x, y: it.y, s: .9 });
    ctx.sfx.yay();
    ctx.logAct('castle', 'built a sandcastle at the beach 🏰 (the tide takes it tomorrow)');
  }
  // ⚡ Lightning & thunder during storms — on the same seconds for both phones
  function lightning() {
    if (!isOut(here()) || document.hidden || !$('#stage').classList.contains('wx-storm')) return;
    const t = Math.floor(Date.now() / 1000), w = Math.floor(t / 7);
    if (t % 7 !== 0 || rnd('flash' + w) > 0.6) return;
    const flash = document.querySelector('.wx-flash'), bolt = document.querySelector('.wx-bolt');
    if (bolt) {
      const x = 15 + rnd('bx' + w) * 170;
      let pts = '', y = 0, xx = 20;
      for (let i = 0; i < 7; i++) { pts += `${xx},${y} `; y += 14 + rnd('by' + w + i) * 6; xx = 20 + (rnd('bz' + w + i) - .5) * 26; }
      bolt.style.left = `calc(${x.toFixed(0)} * var(--u))`;
      bolt.innerHTML = `<svg viewBox="0 0 40 110" preserveAspectRatio="none"><polyline points="${pts}" /></svg>`;
      bolt.classList.remove('on'); void bolt.offsetWidth; bolt.classList.add('on');
    }
    if (flash) { flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on'); }
    setTimeout(() => ctx.sfx.thunder?.(), 900 + rnd('td' + w) * 900);
  }

  // 🚢 Life out at sea — the same schedule on both phones, so you spot the dolphins together
  const SEA_LIFE = {
    ship: { cycle: 9 * 60, dur: 110, chance: .7, from: 215, to: -35 },
    boat: { cycle: 6 * 60, dur: 150, chance: .6, from: -25, to: 220 },
    dolph: { cycle: 3 * 60, dur: 9, chance: .45 },
    whale: { cycle: 15 * 60, dur: 8, chance: .35 },
  };
  const seenLife = {};
  function seaTick() {
    const box = document.querySelector('.bs-life'); if (!box) return;
    const t = Date.now() / 1000;
    for (const [k, c] of Object.entries(SEA_LIFE)) {
      const el = box.querySelector('.bs-' + k); if (!el) continue;
      const cyc = Math.floor(t / c.cycle), start = cyc * c.cycle + rnd(k + 'o' + cyc) * (c.cycle - c.dur);
      const on = rnd(k + 'c' + cyc) < c.chance && t >= start && t < start + c.dur;
      el.classList.toggle('on', on);
      if (!on) continue;
      const f = (t - start) / c.dur;
      if (c.from != null) el.style.left = `calc(${(c.from + (c.to - c.from) * f).toFixed(2)} * var(--u))`;
      else if (!el._placed || el._cyc !== cyc) { el.style.left = `calc(${(25 + rnd(k + 'x' + cyc) * 150).toFixed(1)} * var(--u))`; el._cyc = cyc; el._placed = true; }
      if ((k === 'dolph' || k === 'whale') && seenLife[k] !== cyc) { seenLife[k] = cyc; ctx.toast(k === 'dolph' ? '🐬 Look — dolphins jumping out at sea!' : '🐋 A whale! Did you see it spout?', 3000); }
    }
  }

  // 📸 A real snapshot of this moment (people, things, weather, sky) — falls back to a drawn postcard
  let snapLib = null;
  async function photoSpot() {
    ctx.toast('📸 Say cheese!', 1200);
    ctx.hideOverlay();
    await new Promise(r => setTimeout(r, 350));
    try {
      snapLib ??= await import('https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/+esm');
      const st = $('#stage');
      const hide = new Set(['sky-chip', 'act-chip', 'fest-btns', 'vm-float', 'gift-hint', 'fade', 'tvctl', 'ytwrap', 'emotebar', 'itembar', 'power-timer']);
      const opts = { pixelRatio: Math.min(1.5, devicePixelRatio || 1), skipFonts: true, backgroundColor: '#1f1540',
        filter: n => !(n.id && hide.has(n.id)) && !(n.classList && (n.classList.contains('zoombar') || n.classList.contains('pan-hint') || n.classList.contains('bs-photo'))) };
      await snapLib.toCanvas(st, opts);                 // first pass warms up images (Safari needs it)
      const shot = await snapLib.toCanvas(st, opts);
      if (!shot.width || shot.width < 50) throw new Error('empty');
      const c = document.createElement('canvas'), bar = Math.round(shot.width * .09);
      c.width = shot.width; c.height = shot.height + bar;
      const g = c.getContext('2d');
      g.drawImage(shot, 0, 0);
      g.fillStyle = '#fff'; g.fillRect(0, shot.height, c.width, bar);
      g.fillStyle = '#2a2140'; g.textAlign = 'center'; g.font = `600 ${Math.round(bar * .4)}px Fredoka, sans-serif`;
      const people = ['a', 'b'].filter(id => ctx.joined(id) && (id === ctx.me() || (ctx.isOnline(id) && ctx.roomOf(id) === here())));
      g.fillText(`${ctx.roomName(here())} · ${people.map(id => ctx.called(id)).join(' & ')} · ${new Date().toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}`, c.width / 2, shot.height + bar * .62);
      showPhoto(c.toDataURL('image/jpeg', 0.82));
    } catch (e) {
      console.warn('snapshot failed, drawing a postcard instead', e);
      postcard();
    }
  }
  function showPhoto(url) {
    ctx.showCard(`<h2>📸 Say cheese!</h2><img class="bs-postcard" src="${url}" alt="Photo of this moment">
      <div class="row" style="justify-content:center;margin-top:12px;flex-wrap:wrap"><a class="btn ghost small" href="${url}" download="our-room-photo.jpg">💾 Save</a>
      <button class="btn small" data-photo-hang>🖼️ Hang it at home</button></div>
      <button class="btn ghost wide small" style="margin-top:8px" data-dismiss>Close</button>`, 'postcard');
    lastPhoto = url;
    ctx.sfx.pop();
  }
  // The old drawn postcard, used if the real snapshot isn't possible on this phone
  async function postcard() {
    const ph = phaseOf(localHour(skyTz()));
    const people = ['a', 'b'].filter(id => ctx.joined(id) && (id === ctx.me() || (ctx.isOnline(id) && ctx.roomOf(id) === here())));
    const c = document.createElement('canvas'); c.width = 720; c.height = 540;
    const g = c.getContext('2d');
    const sky = { dawn: ['#6a5acd', '#ff9eb5', '#ffd29d'], day: ['#4aa8ff', '#8fd3ff', '#bfe8ff'], sunset: ['#5b3a9c', '#ff6f91', '#ffc371'], night: ['#0b0a2e', '#1b1760', '#2a2270'] }[ph];
    let gr = g.createLinearGradient(0, 0, 0, 300); sky.forEach((col, i) => gr.addColorStop(i / 2, col)); g.fillStyle = gr; g.fillRect(0, 0, 720, 300);
    if (ph === 'night') { g.fillStyle = '#fff'; for (let i = 0; i < 60; i++) g.fillRect(rnd('s' + i) * 720, rnd('t' + i) * 260, 2, 2); }
    const sunY = ph === 'day' ? 90 : ph === 'night' ? 80 : 250;
    g.fillStyle = ph === 'night' ? '#fff8d6' : ph === 'day' ? '#ffd23f' : '#ff9f43';
    g.beginPath(); g.arc(ph === 'dawn' ? 180 : 470, sunY, ph === 'night' ? 34 : 46, 0, Math.PI * 2); g.fill();
    g.fillStyle = ph === 'night' ? '#1c2f6b' : ph === 'day' ? '#1e90ff' : '#6b4fa0'; g.fillRect(0, 280, 720, 110);
    g.fillStyle = 'rgba(255,255,255,.5)'; for (let x = 0; x < 720; x += 60) g.fillRect(x + 10, 300 + (x % 120) / 6, 34, 3);
    g.fillStyle = ph === 'night' ? '#b8a57a' : '#f4d9a0'; g.fillRect(0, 390, 720, 150);
    g.font = '90px serif'; g.textAlign = 'center'; g.fillText('🌴', 70, 400); g.fillText('🌴', 660, 410);
    const faces = await Promise.all(people.map(id => ctx.faceImage(id)));
    people.forEach((id, i) => {
      const x = people.length === 1 ? 360 : 290 + i * 140, y = 430;
      g.fillStyle = ctx.color(id); g.beginPath(); g.arc(x, y, 58, 0, Math.PI * 2); g.fill();
      const f = faces[i];
      if (f instanceof HTMLImageElement) { g.save(); g.beginPath(); g.arc(x, y, 52, 0, Math.PI * 2); g.clip(); g.drawImage(f, x - 52, y - 52, 104, 104); g.restore(); }
      else { g.font = '70px serif'; g.fillText(f, x, y + 25); }
    });
    if (people.length === 2) { g.font = '48px serif'; g.fillText('💕', 360, 370); }
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 500, 720, 40);
    g.fillStyle = '#fff'; g.font = '600 24px Fredoka, sans-serif';
    g.fillText(`🏖️ ${people.map(id => ctx.called(id)).join(' & ')} · ${new Date().toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}`, 360, 528);
    showPhoto(c.toDataURL('image/jpeg', 0.82));
  }
  let lastPhoto = null;

  // ── Sky ───────────────────────────────────────────────────
  function applySky() {
    const st = $('#stage'), out = isOut(here());
    const ph = out ? phaseOf(localHour(skyTz())) : null;
    ['dawn', 'day', 'sunset', 'night'].forEach(p => st.classList.toggle('sky-' + p, p === ph));
    st.classList.toggle('outside', out);
    let chip = $('#sky-chip');
    if (!out) { if (chip) chip.hidden = true; applyWeather(); return; }
    if (!chip) { chip = document.createElement('div'); chip.id = 'sky-chip'; st.append(chip); }
    chip.hidden = false;
    const who = shared?.by ? `${ctx.called(shared.by)}’s time` : 'your time';
    const wx = applyWeather();
    const xmas = isActive('christmas') && isChristmasDay() ? ' · 🎄 Merry Christmas!' : '';
    chip.textContent = `${PHASE_LABEL[ph]}${wx === 'storm' ? ' · ⛈️ Storm' : wx === 'rain' ? ' · 🌧️ Rain' : wx === 'snow' ? ' · ❄️ Snow' : wx === 'rainbow' ? ' · 🌈' : ''}${xmas} · ${ctx.clock(skyTz())} · ${who}`;
    animalsTick();
    windows();
    renderShells();
  }
  // Faces of whoever is home inside show up in the windows
  function windows() {
    const wins = document.querySelectorAll('.ys-win .ys-face'); if (!wins.length) return;
    const inside = ['a', 'b'].filter(id => ctx.joined(id) && (id === ctx.me() ? !isOut(here()) : ctx.isOnline(id) && !isOut(ctx.roomOf(id))));
    wins.forEach((w, i) => { const id = inside[i === 0 ? 0 : i === 3 ? 1 : -1]; w.innerHTML = id ? ctx.faceHTML(id) : ''; w.parentElement.classList.toggle('occ', !!id); });
  }
  function onShared(v) { shared = v && v.tz ? v : null; applySky(); }

  // ── Travelling ────────────────────────────────────────────
  function canGo(from, to) { return from === to || linksFrom(from).includes(to); }
  function neighbours(from = here()) { return linksFrom(from).filter(r => r !== from); }
  function blockedMsg(to) {
    if (isOut(here()) && INDOOR.includes(to)) return '🏡 Walk back home first — the front door is in the front yard';
    if (!isOut(here()) && isOut(to)) return '🚪 Go outside through the front door in the living room';
    return 'You can’t get there from here';
  }
  // Called by the app right after arriving somewhere
  function arrived(from, to) {
    if (!isOut(from) && isOut(to) && !otherOut()) store.set('outside', { tz: ctx.myTz(), by: ctx.me(), ts: store.now() });
    if (isOut(from) && !isOut(to) && !otherOut()) store.remove('outside');
    applySky();
  }

  async function travel(to, { together = null, asked = false } = {}) {
    if (walking) return;
    if (!ctx.exists(to)) return ctx.toast(`🚧 The ${PLACE_NAME[to] || to} is still being built — coming soon!`);
    if (!canGo(here(), to)) return ctx.toast(blockedMsg(to));
    // Partner right here? Offer to go together
    if (!asked && together === null && ctx.isOnline(ctx.other()) && ctx.roomOf(ctx.other()) === here() && ctx.joined(ctx.other()) && !ctx.isVisitor()) {
      return ctx.showCard(`<div class="big">🤝</div><h2>Walk together?</h2><p class="muted">Take <b>${esc(ctx.called(ctx.other()))}</b> with you to the ${esc(ctx.roomName(to).toLowerCase())}?</p>
        <div class="row" style="justify-content:center;margin-top:12px"><button class="btn ghost" data-walk-alone="${to}">🚶 Just me</button><button class="btn" data-walk-together="${to}">🤝 Together</button></div>`, 'walkask');
    }
    if (together) store.set('walk', { from: ctx.me(), to, at: here(), ts: store.now() });
    walking = true;
    try {
      if (isOut(here()) && isOut(to)) {
        ctx.showCard(`<div class="big walk-anim">🚶</div><h2>Walking to the ${esc(PLACE_NAME[to] || to)}…</h2>${together ? `<p class="muted">with ${esc(ctx.called(ctx.other()))} 🤝</p>` : ''}`, 'walking');
        await new Promise(r => setTimeout(r, WALK_MS));
        ctx.hideOverlay();
      }
      await ctx.goRoom(to);
    } finally { walking = false; }
  }

  // Your partner asked you to walk with them
  function onWalk(v) {
    if (!v || v.from === ctx.me() || v.ts === walkSeen) return;
    walkSeen = v.ts;
    if (store.now() - v.ts > 20000 || v.at !== here()) return;
    ctx.showCard(`<div class="big">🤝</div><h2>${esc(ctx.called(v.from))} is going to the ${esc(ctx.roomName(v.to).toLowerCase())}</h2>
      <p class="muted">Come along?</p>
      <div class="row" style="justify-content:center;margin-top:12px"><button class="btn ghost" data-dismiss>Stay here</button><button class="btn" data-walk-join="${v.to}">🚶 Let’s go!</button></div>`, 'walkask');
  }

  function route(d, t) {
    if (d.crab) { crab(t); return true; }
    if (d.animal) { tapAnimal(t); return true; }
    if (d.go) { ctx.hideOverlay(); travel(d.go); return true; }
    if (d.walkAlone) { ctx.hideOverlay(); travel(d.walkAlone, { together: false }); return true; }
    if (d.walkTogether) { ctx.hideOverlay(); travel(d.walkTogether, { together: true }); return true; }
    if (d.walkJoin) { ctx.hideOverlay(); travel(d.walkJoin, { asked: true }); return true; }
    if (d.shell) { pickShell(+d.shell); return true; }
    if ('photoSpot' in d) { photoSpot(); return true; }
    if ('photoHang' in d) { if (lastPhoto) ctx.hangPhoto(lastPhoto); ctx.hideOverlay(); return true; }
    return false;
  }

  setInterval(() => { if (isOut(here())) applySky(); }, 60000);
  setInterval(() => { if (here() === 'beach') renderShells(); }, 5 * 60000);
  setInterval(() => { if (here() === 'woods' && !document.hidden) animalsTick(); }, 3500);
  setInterval(() => { if (here() === 'beach' && !document.hidden) seaTick(); }, 1000);
  setInterval(lightning, 1000);

  const skyHour = () => localHour(skyTz());
  return { skyHour, onBeach, crab, buildCastle, sceneHTML, applySky, windows, onShared, onWalk, canGo, neighbours, blockedMsg, arrived, travel, route, isOut, CLOSABLE: ['walkask', 'postcard'] };
}
