// 🏡 Outside: the front yard (and later the beach and woods), travel rules, one shared sky, walking together.

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
    <div class="ys-chimney"></div><div class="ys-roof"></div>
    <div class="ys-body">
      <div class="ys-win w1"><span class="ys-face"></span></div><div class="ys-win w2"><span class="ys-face"></span></div>
      <div class="ys-win w3"><span class="ys-face"></span></div><div class="ys-win w4"><span class="ys-face"></span></div>
      <button class="ys-door" data-go="living" aria-label="Go inside"><i></i><span class="ys-sign-home">🏠 Home</span></button>
    </div>
  </div>
  <div class="ys-path"></div>
  <div class="ys-fence l"></div><div class="ys-fence r"></div>
  <button class="os-sign l" data-go="woods"><b>← 🌲 Woods</b><i></i></button>
  <button class="os-sign r" data-go="beach"><b>Beach 🏖️ →</b><i></i></button>`;

const BEACH = `
  <div class="os-sun"></div><div class="os-moon"></div><div class="os-stars"></div>
  <div class="bs-sea"><i class="bs-glint"></i></div>
  <div class="bs-shore"><i class="w1"></i><i class="w2"></i></div>
  <div class="bs-gulls"><span>🕊️</span><span>🕊️</span></div>
  <div class="bs-palm p1"><i class="trunk"></i><b>🌴</b></div><div class="bs-palm p2"><i class="trunk"></i><b>🌴</b></div>
  <button class="bs-crab c1" data-crab="1">🦀</button><button class="bs-crab c2" data-crab="2">🦀</button>
  <div class="bs-shells"></div>
  <button class="os-sign l" data-go="yard"><b>← 🏡 Home</b><i></i></button>
  <button class="bs-photo" data-photo-spot aria-label="Photo spot"><b>📸</b><span>Photo spot</span></button>`;

const SHELLS = ['🐚', '🐚', '🦪', '🐚', '🪸', '🐚'];
const dayKey = () => new Date().toISOString().slice(0, 10);
function rnd(seed) { let h = 2166136261; for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; }

export function initOutside(ctx) {
  const { $, esc, store } = ctx;
  let shared = null;        // { tz, by, ts } — whose clock the sky follows while anyone is outside
  let walkSeen = 0, walking = false;

  const isOut = rm => OUTDOOR.includes(rm);
  const here = () => ctx.view();
  const otherOut = () => ctx.isOnline(ctx.other()) && isOut(ctx.roomOf(ctx.other()));
  const skyTz = () => shared?.tz || ctx.myTz();

  function sceneHTML(rm) { return rm === 'yard' ? YARD : rm === 'beach' ? BEACH : ''; }

  // ── 🏖️ Beach: seashells to collect (new ones every day), crabs, sandcastles, photo spot ──
  let beachData = {};
  function onBeach(v) { beachData = v || {}; renderShells(); }
  function renderShells() {
    const box = document.querySelector('.bs-shells'); if (!box) return;
    const day = dayKey(), taken = beachData.shells?.[day] || {};
    box.innerHTML = SHELLS.map((e, i) => taken[i] ? '' : `<button class="bs-shell" data-shell="${i}" style="left:calc(${(12 + rnd(day + 'x' + i) * 176).toFixed(1)} * var(--u));top:${(70 + rnd(day + 'y' + i) * 25).toFixed(1)}%">${e}</button>`).join('');
  }
  async function pickShell(i) {
    const day = dayKey();
    const ok = await store.transact(`beach/shells/${day}/${i}`, cur => cur ? undefined : ctx.me());
    if (!ok) return;
    let n = 0;
    await store.transact(`beach/count/${ctx.me()}`, c => (n = (c || 0) + 1));
    ctx.sfx.pop();
    ctx.toast(`${SHELLS[i]} Found a shell! You have <b>${n}</b> ${n === 1 ? 'shell' : 'shells'} 🌊`, 2500);
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
  // 📸 A little postcard of the two of you at this spot
  async function photoSpot() {
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
    const url = c.toDataURL('image/jpeg', 0.82);
    ctx.showCard(`<h2>📸 Say cheese!</h2><img class="bs-postcard" src="${url}" alt="Beach photo">
      <div class="row" style="justify-content:center;margin-top:12px;flex-wrap:wrap"><a class="btn ghost small" href="${url}" download="our-beach-photo.jpg">💾 Save</a>
      <button class="btn small" data-photo-hang>🖼️ Hang it at home</button></div>
      <button class="btn ghost wide small" style="margin-top:8px" data-dismiss>Close</button>`, 'postcard');
    lastPhoto = url;
    ctx.sfx.pop();
  }
  let lastPhoto = null;

  // ── Sky ───────────────────────────────────────────────────
  function applySky() {
    const st = $('#stage'), out = isOut(here());
    const ph = out ? phaseOf(localHour(skyTz())) : null;
    ['dawn', 'day', 'sunset', 'night'].forEach(p => st.classList.toggle('sky-' + p, p === ph));
    st.classList.toggle('outside', out);
    let chip = $('#sky-chip');
    if (!out) { if (chip) chip.hidden = true; return; }
    if (!chip) { chip = document.createElement('div'); chip.id = 'sky-chip'; st.append(chip); }
    chip.hidden = false;
    const who = shared?.by ? `${ctx.called(shared.by)}’s time` : 'your time';
    chip.textContent = `${PHASE_LABEL[ph]} · ${ctx.clock(skyTz())} · ${who}`;
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

  return { onBeach, crab, buildCastle, sceneHTML, applySky, windows, onShared, onWalk, canGo, neighbours, blockedMsg, arrived, travel, route, isOut, CLOSABLE: ['walkask', 'postcard'] };
}
