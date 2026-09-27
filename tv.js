// 📺 Watch YouTube together. The shared state lives at /tv:
//   { vid, playing, pos (seconds at time `at`), at (server time), by, ts }
// The video plays *inside* the TV in the living room (or on a big screen).
// Sound carries to every room; one mute button works everywhere.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const fmt = s => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = String(s % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; };
export const parseYouTube = s => (String(s).match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/) || String(s).trim().match(/^([A-Za-z0-9_-]{11})$/))?.[1] || null;

// The player is laid out at this size (YouTube needs ≥200px) and scaled to fit the TV screen.
const PW = 320, PH = 200;

export function initTV(ctx) {
  const { $, esc, store, sfx } = ctx;
  let cur = null, player = null, apiReady = null, loadedVid = null;
  let big = false, ctlOpen = false, ctlTimer = null, blockedTimer = null, first = true;
  let vol = +(ctx.lsGet('ourroom:tvvol') || 70), muted = false;
  const wrap = $('#ytwrap'), ctl = $('#tvctl'), strip = $('#tvstrip'), stage = $('#stage');

  function loadAPI() {
    if (apiReady) return apiReady;
    apiReady = new Promise(res => {
      if (window.YT?.Player) return res();
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); res(); };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.append(s);
    });
    return apiReady;
  }
  const target = () => !cur ? 0 : cur.pos + (cur.playing ? Math.max(0, store.now() - cur.at) / 1000 : 0);
  const canUse = () => player && typeof player.getCurrentTime === 'function';
  const now = () => store.now();

  // ── Where the video sits: inside the TV, big screen, or hidden (sound only) ──
  function place() {
    requestAnimationFrame(place);
    if (!cur) { wrap.hidden = true; return; }
    wrap.hidden = false;
    if (big) { wrap.className = 'big'; wrap.style.transform = ''; return; }
    const scr = ctx.tvScreen();
    const sr = stage.getBoundingClientRect();
    if (!scr) { wrap.className = 'away'; wrap.style.transform = ''; return; }
    const r = scr.getBoundingClientRect();
    wrap.className = 'on-tv';
    wrap.style.transform = `translate(${r.left - sr.left}px, ${r.top - sr.top}px) scale(${r.width / PW}, ${r.height / PH})`;
  }
  requestAnimationFrame(place);

  // ── Picking a video ────────────────────────────────────────
  function open() {
    ctx.showCard(`<div class="cook-head"><span class="dish">📺</span><div><b>Watch together</b><small>YouTube on the TV, in sync on both phones</small></div><button class="x" data-dismiss aria-label="Close">✕</button></div>
      <h4 style="margin-top:14px">${cur ? 'Play a different video' : 'Paste a YouTube link'}</h4>
      <div class="linkbox"><input class="field" id="tv-url" placeholder="https://youtu.be/…" inputmode="url" autocomplete="off"><button class="btn small" data-tv="start">▶️ Play</button></div>
      <p class="hint">In the YouTube app: tap <b>Share</b> → <b>Copy link</b>, then paste it here.</p>
      ${cur ? '<button class="btn ghost wide small" data-tv="clear" style="margin-top:8px">⏏️ Clear the video (for both)</button>' : ''}
      <button class="btn ghost wide small" data-tv="channel" style="margin-top:8px">📺 Just change the cartoon channel</button>`, 'tv');
    setTimeout(() => $('#tv-url')?.focus(), 100);
  }
  function start() {
    const vid = parseYouTube($('#tv-url')?.value || '');
    if (!vid) return ctx.toast('Hmm, that doesn’t look like a YouTube link 🤔');
    muted = false;
    const t = now();
    store.set('tv', { vid, playing: true, pos: 0, at: t, by: ctx.me(), ts: t });
    store.push('log', { by: ctx.me(), text: 'put a video on the TV 📺 — come watch!', ts: t });
    ctx.hideOverlay();
    ensurePlayer();
  }

  // ── Player & sync ──────────────────────────────────────────
  async function ensurePlayer() {
    if (!cur) return;
    await loadAPI();
    if (!cur) return;
    if (!player) {
      loadedVid = cur.vid;
      player = new window.YT.Player('yt-frame', {
        width: PW, height: PH, videoId: cur.vid,
        playerVars: { controls: 0, playsinline: 1, rel: 0, modestbranding: 1, disablekb: 1, fs: 0, iv_load_policy: 3, start: Math.floor(target()), mute: muted ? 1 : 0 },
        events: {
          onReady: () => { applyVolume(); sync(true); },
          onStateChange: onState,
          onError: e => ctx.toast(e.data === 101 || e.data === 150 ? 'This video can’t be played outside YouTube 😕 Try another one.' : 'That video couldn’t be loaded 😕', 5000),
        },
      });
    } else if (loadedVid !== cur.vid && canUse()) {
      loadedVid = cur.vid;
      player.loadVideoById({ videoId: cur.vid, startSeconds: target() });
      if (!cur.playing) setTimeout(() => canUse() && player.pauseVideo(), 500);
    }
  }
  function sync(force) {
    if (!cur || !canUse()) return;
    if (loadedVid !== cur.vid) return ensurePlayer();
    const want = target();
    if (force || Math.abs(player.getCurrentTime() - want) > 1.6) player.seekTo(want, true);
    const st = player.getPlayerState();
    if (cur.playing && st !== 1 && st !== 3) {
      player.playVideo();
      clearTimeout(blockedTimer);
      blockedTimer = setTimeout(() => {       // a phone may block playback until a tap
        const s = canUse() ? player.getPlayerState() : -1;
        $('.tv-tap', wrap).hidden = !(cur?.playing && s !== 1 && s !== 3);
      }, 2000);
    }
    if (!cur.playing && st === 1) player.pauseVideo();
    renderUI();
  }
  function onState(e) {
    if (e.data === 1) $('.tv-tap', wrap).hidden = true;
    if (e.data === 0 && cur?.playing) store.update('tv', { playing: false, pos: player.getDuration?.() || cur.pos, at: now() });
    renderUI();
  }
  function applyVolume() {
    if (!canUse()) return;
    player.setVolume(vol);
    if (muted) player.mute(); else player.unMute();
    $('.tv-unmute', wrap).hidden = !muted;
    renderUI();
  }

  // ── Controls UI ────────────────────────────────────────────
  function showCtl(on = true) {
    ctlOpen = on;
    clearTimeout(ctlTimer);
    if (on && !big) ctlTimer = setTimeout(() => showCtl(false), 6000);
    renderUI();
  }
  function renderUI() {
    strip.hidden = !cur;
    ctl.hidden = !cur || !(ctlOpen || big);
    if (!cur) return;
    const title = canUse() ? player.getVideoData?.()?.title : '';
    const t = canUse() ? player.getCurrentTime() : target(), d = canUse() ? player.getDuration() : 0;
    strip.innerHTML = `<button class="grow" data-tv="ctl">🎬 ${esc(title || 'Video on the TV')}</button>
      <button data-tv="toggle" aria-label="Play or pause">${cur.playing ? '⏸' : '▶️'}</button>
      <button data-tv="mute" aria-label="Mute everywhere">${muted ? '🔇' : '🔊'}</button>
      <button data-tv="big" aria-label="Big screen">${big ? '📺' : '⛶'}</button>`;
    ctl.innerHTML = `<button data-tv="back" aria-label="Back 10 seconds">⏪</button>
      <button data-tv="toggle" class="main" aria-label="Play or pause">${cur.playing ? '⏸' : '▶️'}</button>
      <button data-tv="fwd" aria-label="Forward 10 seconds">⏩</button>
      <span class="tv-time">${d ? `${fmt(t)} / ${fmt(d)}` : fmt(t)}</span>
      <button data-tv="voldown" aria-label="Volume down">🔉</button>
      <button data-tv="mute" class="tv-vol" aria-label="Mute">${muted ? '🔇' : `${vol}%`}</button>
      <button data-tv="volup" aria-label="Volume up">🔊</button>
      <button data-tv="big" class="wide" aria-label="${big ? 'Back to TV' : 'Big screen'}">${big ? '📺 Back to TV' : '⛶ Big screen'}</button>
      <button data-tv="pick" aria-label="Another video">🔗</button>
      <button data-tv="clear" aria-label="Clear the video">⏏️</button>`;
  }
  setInterval(() => { if (cur) { sync(); } }, 3000);
  setInterval(() => { if (cur && (ctlOpen || big)) renderUI(); }, 1000);

  function act(what) {
    if (what === 'start') return start();
    if (what === 'pick') return open();
    if (what === 'channel') { ctx.hideOverlay(); return ctx.changeChannel(); }
    if (what === 'ctl') return showCtl(!ctlOpen);
    if (what === 'big') { big = !big; showCtl(true); return; }
    if (what === 'clear') { store.remove('tv'); ctx.hideOverlay(); big = false; return; }
    if (what === 'kick') { if (canUse()) { player.playVideo(); applyVolume(); } $('.tv-tap', wrap).hidden = true; return; }
    if (what === 'unmute') { muted = false; applyVolume(); if (canUse() && cur?.playing) player.playVideo(); return; }
    if (what === 'mute') { muted = !muted; applyVolume(); return; }
    if (what === 'volup' || what === 'voldown') {
      if (IOS) return ctx.toast('🔊 On iPhone, use the volume buttons on the side of your phone', 3500);
      vol = clamp(vol + (what === 'volup' ? 10 : -10), 0, 100); muted = false;
      ctx.lsSet('ourroom:tvvol', String(vol)); applyVolume(); sfx.tick(); return;
    }
    if (!cur || !canUse()) return;
    showCtl(true);
    const t = player.getCurrentTime();
    if (what === 'toggle') {
      const playing = !cur.playing;
      if (playing) player.playVideo(); else player.pauseVideo();   // right away (this is the tap)
      store.update('tv', { playing, pos: t, at: now(), by: ctx.me() });
    }
    if (what === 'back' || what === 'fwd') {
      const pos = clamp(t + (what === 'fwd' ? 10 : -10), 0, player.getDuration() || 1e6);
      player.seekTo(pos, true);
      store.update('tv', { pos, at: now() });
    }
    setTimeout(renderUI, 150);
  }

  // Tapping the TV: open controls if a video is on, otherwise pick one
  function tapTV() { if (cur) showCtl(!ctlOpen); else open(); }

  function onTv(v) {
    const was = cur;
    cur = v && v.vid ? v : null;
    if (!cur) {
      if (was) ctx.toast('📺 The video was cleared');
      big = false; ctlOpen = false;
      if (canUse()) player.stopVideo();
      renderUI(); ctx.onChange?.();
      return;
    }
    // Walking in while your partner is already watching → start muted, tap to unmute
    const someoneElse = cur.by !== ctx.me();
    if ((first && cur.playing && someoneElse) || (was?.vid !== cur.vid && someoneElse)) {
      muted = true;
      if (was?.vid !== cur.vid && now() - cur.ts < 60000) { sfx.ding(); ctx.toast(`📺 <b>${esc(ctx.called(cur.by))}</b> put a video on the TV 🍿`, 4500); }
    }
    first = false;
    ensurePlayer().then(() => sync(was?.vid !== cur.vid));
    applyVolume();
    renderUI(); ctx.onChange?.();
  }

  // Nobody left watching → pause. Called when this phone leaves, and when it arrives.
  function pauseIfAlone() {
    if (!cur?.playing || ctx.otherOnline()) return;
    const pos = canUse() ? player.getCurrentTime() : target();
    store.update('tv', { playing: false, pos, at: now() });
    if (canUse()) player.pauseVideo();
  }

  return { open, act, tapTV, onTv, pauseIfAlone, active: () => !!cur };
}
