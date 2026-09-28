// 🎣 Fishing: cast from the pier (beach) or the stream bank (woods), wait for the bobber to dip, tap to reel in.
// Catches can go home (the fridge's "Your catch" shelf → cook them), back into the water, or to the pet.

const SEA = [
  ['🐟', 'Fish', 40, 20, 45], ['🐠', 'Tropical fish', 14, 10, 25], ['🦐', 'Prawns', 10, 8, 15], ['🦀', 'Crab', 8, 12, 25],
  ['🦑', 'Squid', 8, 20, 40], ['🐡', 'Pufferfish', 6, 15, 30], ['🐙', 'Octopus', 3, 40, 90], ['👢', 'Old boot', 6, 0, 0], ['🥫', 'Rusty can', 5, 0, 0],
];
const STREAM = [
  ['🐟', 'Trout', 40, 18, 40], ['🐟', 'Carp', 20, 25, 60], ['🦐', 'River prawns', 12, 6, 12], ['🐸', 'Frog', 6, 0, 0], ['🍂', 'Soggy leaves', 8, 0, 0], ['👢', 'Old boot', 5, 0, 0],
];
const JUNK = new Set(['👢', '🥫', '🍂', '🐸']);

function pick(table) {
  const total = table.reduce((s, r) => s + r[2], 0);
  let r = Math.random() * total;
  for (const row of table) { r -= row[2]; if (r <= 0) return row; }
  return table[0];
}

export function initFishing(ctx) {
  const { $, esc, sfx, store } = ctx;
  let st = null;   // { where, phase: 'wait'|'bite'|'reel'|'done', timers }
  let best = null, catchCount = 0;

  function onBest(v) { best = v || null; }
  function onCatch(v) { catchCount = Object.keys(v || {}).length; }

  function clear() { if (st) { st.timers.forEach(clearTimeout); } }
  function start(where) {
    clear();
    st = { where, phase: 'wait', timers: [] };
    ctx.setFishing(true);
    card(`<div class="fs-water"><i class="fs-line"></i><b class="fs-bob" id="fs-bob"></b><span class="fs-ripple"></span></div>
      <p class="muted" id="fs-msg">Waiting for a bite… 🤫</p>
      <button class="btn wide fs-reel" data-fish="reel">🎣 Reel in!</button>
      <button class="btn ghost wide small" data-fish="stop">Done fishing</button>`);
    sfx.swish();
    st.timers.push(setTimeout(bite, 2500 + Math.random() * 7500));
  }
  function card(html) { ctx.showCard(`<div class="fs-card"><h2>🎣 Fishing ${st?.where === 'stream' ? 'in the stream' : 'off the pier'}</h2>${html}</div>`, 'fishing'); }
  function bite() {
    if (!st || st.phase !== 'wait') return;
    st.phase = 'bite';
    $('#fs-bob')?.classList.add('bite'); $('.fs-reel')?.classList.add('now');
    const m = $('#fs-msg'); if (m) m.innerHTML = '<b class="fs-now">A bite! TAP NOW! 💦</b>';
    sfx.pop(); navigator.vibrate?.(120);
    st.timers.push(setTimeout(() => { if (st?.phase === 'bite') { st.phase = 'wait'; $('#fs-bob')?.classList.remove('bite'); $('.fs-reel')?.classList.remove('now'); gotAway('Too slow — it got away! 🐟💨'); } }, 1200));
  }
  function gotAway(msg) {
    const m = $('#fs-msg'); if (m) m.textContent = msg;
    sfx.whiff();
    clear(); st.timers = [setTimeout(() => { if (st && st.phase === 'wait') { const mm = $('#fs-msg'); if (mm) mm.textContent = 'Casting again… waiting for a bite 🤫'; st.timers.push(setTimeout(bite, 2500 + Math.random() * 7500)); } }, 1600)];
  }
  function reel() {
    if (!st) return;
    if (st.phase === 'wait') return gotAway('Too early — you scared it off 😅');
    if (st.phase !== 'bite') return;
    st.phase = 'reel'; clear(); st.timers = [];
    $('#fs-bob')?.classList.add('reel');
    const m = $('#fs-msg'); if (m) m.textContent = 'Reeling in… 🎣';
    sfx.swish();
    st.timers.push(setTimeout(landed, 900));
  }
  function landed() {
    const [e, n, , a, b] = pick(st.where === 'stream' ? STREAM : SEA);
    const cm = b ? Math.round(a + Math.random() * (b - a)) : 0;
    const junk = JUNK.has(e);
    const record = !junk && cm && (!best || cm > best.cm);
    st.phase = 'done'; st.fish = { e, n, cm, where: st.where };
    if (record) store.set('fishing/best', { by: ctx.me(), e, n, cm, ts: store.now() });
    if (!junk) ctx.logAct('fish', `caught a ${n.toLowerCase()} ${e}${cm ? ` (${cm} cm)` : ''} ${st.where === 'stream' ? 'in the stream' : 'at the beach'}!`);
    sfx[junk ? 'whiff' : 'yay']();
    card(`<div class="fs-catch">${e}</div><h3>${junk ? `Oops… ${esc(n.toLowerCase())}!` : `You caught ${/^[AEIOU]/.test(n) ? 'an' : 'a'} ${esc(n.toLowerCase())}!`}</h3>
      ${cm ? `<p class="muted">${cm} cm${record ? ' · <b class="fs-rec">🏆 New record!</b>' : best ? ` · record: ${best.cm} cm by ${esc(ctx.called(best.by))}` : ''}</p>` : '<p class="muted">Not exactly dinner 😂</p>'}
      <div class="stack">
        ${junk ? '<button class="btn wide" data-fish="bin">🗑️ Bin it</button>' : `<button class="btn wide" data-fish="home">🏠 Take it home</button>
        <button class="btn ghost wide" data-fish="free">🌊 Throw it back</button>
        ${ctx.hasPet() ? `<button class="btn ghost wide" data-fish="pet">🐾 Give it to ${esc(ctx.petName())}</button>` : ''}`}
      </div>`);
  }
  function after(how) {
    const f = st?.fish; if (!f) return;
    if (how === 'home') {
      store.push('catch', { e: f.e, n: f.n, cm: f.cm, where: f.where, by: ctx.me(), ts: store.now() });
      ctx.toast(`🧊 ${esc(f.n)} is in the fridge — cook it in the kitchen! 🍳`, 3500);
    } else if (how === 'free') ctx.toast(`${f.e} Splash! It swims away happily 💙`, 2500);
    else if (how === 'pet') ctx.giveFishToPet(f);
    sfx.pop();
    again();
  }
  function again() {
    card(`<p class="muted">Cast again?</p><button class="btn wide" data-fish="cast">🎣 Cast again</button><button class="btn ghost wide small" data-fish="stop">Done fishing</button>`);
    st.phase = 'idle'; st.fish = null;
  }
  function stop() { clear(); st = null; ctx.setFishing(false); ctx.hideOverlay(); }

  function route(d) {
    if (!d.fish) return false;
    const k = d.fish;
    if (k === 'start-sea') { const x = d.fx ? +d.fx : 154, y = d.fy ? +d.fy + 1 : 57; ctx.walkTo(x, y, y < 64).then(() => start('sea')); }
    else if (k === 'start-stream') ctx.walkTo(d.fx ? +d.fx : 100, d.fy ? Math.max(62, +d.fy + 1) : 63, false).then(() => start('stream'));
    else if (k === 'reel') reel();
    else if (k === 'cast') start(st?.where || 'sea');
    else if (k === 'home' || k === 'free' || k === 'pet') after(k);
    else if (k === 'bin') { ctx.toast('♻️ Binned. The beach thanks you 🌊', 2000); again(); }
    else if (k === 'stop') stop();
    return true;
  }
  return { route, onBest, onCatch, closed: () => { if (st) { clear(); st = null; ctx.setFishing(false); } }, CLOSABLE: ['fishing'] };
}
