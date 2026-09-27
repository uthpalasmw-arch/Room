// 📺 Watch YouTube together. The shared state lives at /tv:
//   { vid, playing, pos (seconds at time `at`), at (server time), by, ts }
// Every phone plays its own YouTube player and keeps it in sync with that state.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const fmt = s => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = String(s % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; };
export const parseYouTube = s => (String(s).match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/) || String(s).trim().match(/^([A-Za-z0-9_-]{11})$/))?.[1] || null;

export function initTV(ctx) {
  const { $, esc, store, sfx } = ctx;
  let cur = null, player = null, apiReady = null, joined = false, loadedVid = null;
  let vol = +(ctx.lsGet('ourroom:tvvol') || 70), muted = false, blockedTimer = null, uiTimer = null;
  const box = $('#tvbox');

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

  // ── The picker (paste a link) ──────────────────────────────
  function open() {
    const active = cur?.vid;
    ctx.showCard(`<div class="cook-head"><span class="dish">📺</span><div><b>Watch together</b><small>YouTube, in sync on both phones</small></div><button class="x" data-dismiss aria-label="Close">✕</button></div>
      ${active ? `<div class="status ok" style="margin-top:12px">🎬 A video is on the TV right now</div>
        <div class="stack"><button class="btn wide" data-tv="join">🍿 Watch it</button><button class="btn ghost wide" data-tv="stop">⏹ Turn it off for both</button></div>
        <h4>Or play something else</h4>` : '<h4 style="margin-top:14px">Paste a YouTube link</h4>'}
      <div class="linkbox"><input class="field" id="tv-url" placeholder="https://youtu.be/…" inputmode="url" autocomplete="off"><button class="btn small" data-tv="start">▶️ Play</button></div>
      <p class="hint">In the YouTube app: tap <b>Share</b> → <b>Copy link</b>, then paste it here. Both of you will see it — pause, skip and volume are yours to control.</p>
      <button class="btn ghost wide small" data-tv="channel" style="margin-top:8px">📺 Just change the cartoon channel</button>`, 'tv');
    setTimeout(() => $('#tv-url')?.focus(), 100);
  }
  function start() {
    const vid = parseYouTube($('#tv-url')?.value || '');
    if (!vid) return ctx.toast('Hmm, that doesn’t look like a YouTube link 🤔');
    const now = store.now();
    store.set('tv', { vid, playing: true, pos: 0, at: now, by: ctx.me(), ts: now });
    store.push('log', { by: ctx.me(), text: 'started a video on the TV 📺 — come watch!', ts: now });
    ctx.hideOverlay();
    join(true);
  }

  // ── Player ─────────────────────────────────────────────────
  async function ensurePlayer() {
    if (!cur) return;
    await loadAPI();
    if (!cur) return;
    if (!player) {
      loadedVid = cur.vid;
      player = new window.YT.Player('yt-frame', {
        videoId: cur.vid,
        playerVars: { controls: 0, playsinline: 1, rel: 0, modestbranding: 1, disablekb: 1, fs: 0, iv_load_policy: 3, start: Math.floor(target()) },
        events: {
          onReady: () => { applyVolume(); sync(true); },
          onStateChange: onState,
          onError: e => {
            const msg = e.data === 101 || e.data === 150 ? 'This video can’t be played outside YouTube 😕 Try another one.' : 'That video couldn’t be loaded 😕';
            ctx.toast(msg, 5000);
          },
        },
      });
    } else if (loadedVid !== cur.vid && canUse()) {
      loadedVid = cur.vid;
      player.loadVideoById({ videoId: cur.vid, startSeconds: target() });
      if (!cur.playing) setTimeout(() => player.pauseVideo(), 400);
    }
  }
  function sync(force) {
    if (!joined || !cur || !canUse()) return;
    if (loadedVid !== cur.vid) return ensurePlayer();
    const want = target(), have = player.getCurrentTime();
    if (force || Math.abs(have - want) > 1.6) player.seekTo(want, true);
    const st = player.getPlayerState();
    if (cur.playing && st !== 1 && st !== 3) {
      player.playVideo();
      clearTimeout(blockedTimer);
      blockedTimer = setTimeout(() => {   // phones may block sound-autoplay → ask for one tap
        const s = canUse() ? player.getPlayerState() : -1;
        $('.tv-tap', box).hidden = !(cur?.playing && s !== 1 && s !== 3);
      }, 1800);
    }
    if (!cur.playing && st === 1) player.pauseVideo();
    renderUI();
  }
  function onState(e) {
    if (e.data === 1) $('.tv-tap', box).hidden = true;
    if (e.data === 0 && cur?.playing) store.update('tv', { playing: false, pos: player.getDuration?.() || cur.pos, at: store.now() });
    renderUI();
  }
  function applyVolume() {
    if (!canUse()) return;
    player.setVolume(vol);
    if (muted) player.mute(); else player.unMute();
    renderUI();
  }

  // ── UI ─────────────────────────────────────────────────────
  function join(fromTap) {
    joined = true;
    box.hidden = false;
    box.classList.add('open');
    $('#tvstrip').hidden = true;
    ensurePlayer().then(() => sync(true));
    if (fromTap && canUse() && cur?.playing) player.playVideo();   // counts as a tap → sound allowed
    clearInterval(uiTimer);
    uiTimer = setInterval(() => { sync(); }, 3000);
    ctx.onChange?.();
    if (!ctx.lsGet('ourroom:tvsofa')) { ctx.lsSet('ourroom:tvsofa', '1'); ctx.toast('🛋️ Tip: tap the sofa to sit and watch together!', 4500); }
  }
  function leave() {
    joined = false;
    box.hidden = true; box.classList.remove('open');
    if (canUse()) player.pauseVideo();
    clearInterval(uiTimer);
    renderStrip();
    ctx.onChange?.();
  }
  function renderStrip() {
    const strip = $('#tvstrip');
    strip.hidden = !cur || joined;
    if (!cur) return;
    strip.innerHTML = `<span>📺</span><span class="grow">${cur.by === ctx.me() ? 'Your video is still on' : `${esc(ctx.called(cur.by))} is playing a video`}</span><button data-tv="join">🍿 Watch</button>`;
  }
  function renderUI() {
    if (!joined) return;
    const playing = cur?.playing;
    $('[data-tv="toggle"]', box).textContent = playing ? '⏸' : '▶️';
    const t = canUse() ? player.getCurrentTime() : target(), d = canUse() ? player.getDuration() : 0;
    $('.tv-time', box).textContent = d ? `${fmt(t)} / ${fmt(d)}` : fmt(t);
    $('.tv-vol', box).textContent = muted ? '🔇' : `${vol}%`;
    const title = canUse() ? player.getVideoData?.()?.title : '';
    $('.tv-title', box).textContent = title ? `🎬 ${title}` : '🎬 Loading…';
  }

  // ── Controls (shared for both of you, except volume) ───────
  function act(what) {
    if (what === 'start') return start();
    if (what === 'join') { ctx.hideOverlay(); return join(true); }
    if (what === 'min') return leave();
    if (what === 'stop') { store.remove('tv'); ctx.hideOverlay(); return; }
    if (what === 'channel') { ctx.hideOverlay(); return ctx.changeChannel(); }
    if (what === 'kick') { if (canUse()) { player.playVideo(); applyVolume(); } $('.tv-tap', box).hidden = true; return; }
    if (what === 'volup' || what === 'voldown') {
      if (IOS) return ctx.toast('🔊 On iPhone, use the volume buttons on the side of your phone', 3500);
      vol = clamp(vol + (what === 'volup' ? 10 : -10), 0, 100); muted = false;
      ctx.lsSet('ourroom:tvvol', String(vol)); applyVolume(); sfx.tick(); return;
    }
    if (what === 'mute') { muted = !muted; applyVolume(); return; }
    if (!cur || !canUse()) return;
    const now = store.now(), t = player.getCurrentTime();
    if (what === 'toggle') {
      const playing = !cur.playing;
      if (playing) player.playVideo(); else player.pauseVideo();   // do it right away (this is the tap)
      store.update('tv', { playing, pos: t, at: now, by: ctx.me() });
    }
    if (what === 'back' || what === 'fwd') {
      const pos = clamp(t + (what === 'fwd' ? 10 : -10), 0, player.getDuration() || 1e6);
      player.seekTo(pos, true);
      store.update('tv', { pos, at: now });
    }
    setTimeout(renderUI, 150);
  }

  function onTv(v) {
    const wasVid = cur?.vid;
    cur = v && v.vid ? v : null;
    if (!cur) {
      if (joined) ctx.toast('📺 The TV was turned off');
      joined = false; box.hidden = true; box.classList.remove('open'); clearInterval(uiTimer);
      if (canUse()) player.stopVideo();
      renderStrip(); ctx.onChange?.();
      return;
    }
    if (!joined && cur.vid !== wasVid && cur.by !== ctx.me() && store.now() - cur.ts < 60000) {
      sfx.ding();
      ctx.toast(`📺 <b>${esc(ctx.called(cur.by))}</b> put a video on the TV — tap 🍿 Watch!`, 5000);
    }
    renderStrip();
    if (joined) sync(cur.vid !== wasVid);
    ctx.onChange?.();
  }

  return { open, act, onTv, active: () => !!cur, joined: () => joined };
}
