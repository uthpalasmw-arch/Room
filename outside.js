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

export function initOutside(ctx) {
  const { $, esc, store } = ctx;
  let shared = null;        // { tz, by, ts } — whose clock the sky follows while anyone is outside
  let walkSeen = 0, walking = false;

  const isOut = rm => OUTDOOR.includes(rm);
  const here = () => ctx.view();
  const otherOut = () => ctx.isOnline(ctx.other()) && isOut(ctx.roomOf(ctx.other()));
  const skyTz = () => shared?.tz || ctx.myTz();

  function sceneHTML(rm) { return rm === 'yard' ? YARD : ''; }

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

  function route(d) {
    if (d.go) { ctx.hideOverlay(); travel(d.go); return true; }
    if (d.walkAlone) { ctx.hideOverlay(); travel(d.walkAlone, { together: false }); return true; }
    if (d.walkTogether) { ctx.hideOverlay(); travel(d.walkTogether, { together: true }); return true; }
    if (d.walkJoin) { ctx.hideOverlay(); travel(d.walkJoin, { asked: true }); return true; }
    return false;
  }

  setInterval(() => { if (isOut(here())) applySky(); }, 60000);

  return { sceneHTML, applySky, windows, onShared, onWalk, canGo, neighbours, blockedMsg, arrived, travel, route, isOut, CLOSABLE: ['walkask'] };
}
