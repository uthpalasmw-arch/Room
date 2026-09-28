// 📼 Answering machine: record a 15-second voice message; it waits until the other person listens, then it's gone.
// One message at a time, stored at /vmail as a small data URL.

const MAX_MS = 15000;
const MAX_BYTES = 450000;
const TYPES = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];

export function initVmail(ctx) {
  const { $, esc, sfx, store } = ctx;
  let V = null, init = false, lastTs = 0;
  let rec = null;       // current recording session
  let take = null;      // { blob, url, dur } recorded but not sent yet
  let player = null;
  let machineRm = null;   // which room the answering machine is in

  const me = () => ctx.me(), other = () => ctx.other();
  const secs = ms => Math.max(1, Math.round((ms || 0) / 1000));
  const forMe = () => V && V.by !== me();

  function onData(v) {
    const prev = V;
    V = v && v.d ? v : null;
    if (!init) {
      init = true; lastTs = V?.ts || 0;
      if (forMe() && !ctx.isVisitor()) setTimeout(() => ctx.toast(`📼 <b>${esc(ctx.called(V.by))}</b> left you a voice message — tap the answering machine to listen`, 6000), 2500);
    } else if (V && V.ts !== lastTs) {
      lastTs = V.ts;
      if (forMe()) sfx.ding();   // the activity log already pops up “left you a voice message”
    }
    if (!V && prev) lastTs = 0;
    decorateAll();
    locate();
    if (ctx.overlayMode() === 'vmail' && !rec && !take && !player) open();
  }

  // 🔴 Big red alert at the top + a dot on the door when the machine is in another room
  async function locate() {
    if (V && forMe()) machineRm = await ctx.findMachine();
    refresh();
  }
  function refresh() {
    const on = !!V && forMe() && !ctx.isVisitor();
    let f = $('#vm-float');
    if (on && !f) {
      f = document.createElement('button');
      f.id = 'vm-float'; f.dataset.vm = 'go';
      f.innerHTML = '<b>1</b>📼 New voice message';
      $('#stage').append(f);
    }
    if (f) f.hidden = !on;
    $('#door')?.classList.toggle('vm-dot', on && !!machineRm && machineRm !== ctx.view());
  }
  function goToMachine() {
    if (!machineRm) return ctx.toast('📼 Add an answering machine (Decorate → Furniture) to listen');
    if (machineRm !== ctx.view()) return ctx.goRoom(machineRm).then(() => setTimeout(() => { ctx.focusMachine(); open(); }, 500));
    ctx.focusMachine(); open();
  }
  const waitingIn = () => (V && forMe() ? machineRm : null);

  // The machine's little screen + light
  function decorate(el) {
    const n = V ? 1 : 0;
    el.classList.toggle('vm-new', !!V && forMe());
    el.classList.toggle('vm-sent', !!V && !forMe());
    const scr = $('.vm-count', el); if (scr) scr.textContent = n;
  }
  const decorateAll = () => document.querySelectorAll('.item[data-kind="furn:vmail"]').forEach(decorate);

  // ── Cards ─────────────────────────────────────────────────
  function card(html) { ctx.showCard(`<div class="vm-card"><div class="vm-hero">📼</div>${html}</div>`, 'vmail'); }
  function open() {
    stopPlayer();
    if (ctx.isVisitor()) return card(`<h2>Answering machine</h2><p class="muted">This one’s just for the hosts 💕</p><button class="btn ghost wide" data-dismiss>OK</button>`);
    if (V && forMe()) {
      return card(`<h2>1 new message</h2><p class="muted">From <b>${esc(ctx.called(V.by))}</b> · ${secs(V.dur)} s · ${esc(ctx.ago(V.ts))}</p>
        <div class="vm-prog"><i id="vm-bar"></i></div>
        <button class="btn wide" data-vm="play">▶️ Play</button>
        <p class="muted vm-small">It disappears once you’ve heard it all.</p>
        <button class="btn ghost wide small" data-dismiss>Later</button>`);
    }
    if (V) {
      return card(`<h2>Message sent 💌</h2><p class="muted">Waiting for <b>${esc(ctx.called(other()))}</b> to listen · ${secs(V.dur)} s · ${esc(ctx.ago(V.ts))}</p>
        <div class="vm-prog"><i id="vm-bar"></i></div>
        <div class="row vm-row"><button class="btn ghost small" data-vm="replay">▶️ Listen</button><button class="btn ghost small" data-vm="redo">🔁 Record again</button><button class="btn ghost small" data-vm="delete">🗑️ Delete</button></div>
        <button class="btn ghost wide small" data-dismiss>Close</button>`);
    }
    recorderCard();
  }
  function recorderCard() {
    card(`<h2>Leave a voice message</h2><p class="muted">For <b>${esc(ctx.called(other()))}</b> · up to 15 seconds</p>
      <div class="vm-rec" id="vm-rec"><canvas id="vm-wave" width="240" height="60"></canvas></div>
      <button class="vm-mic" id="vm-mic" aria-label="Record"><span>🎙️</span></button>
      <p class="muted vm-small" id="vm-hint">Hold to record · or tap to start and tap to stop</p>
      <button class="btn ghost wide small" data-vm="cancel">Cancel</button>`);
    const mic = $('#vm-mic');
    let downAt = 0, toggled = false;
    mic.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (rec) { if (toggled) stopRec(); return; }
      downAt = Date.now(); toggled = false;
      startRec();
    });
    mic.addEventListener('pointerup', () => {
      if (!rec || toggled) return;
      if (Date.now() - downAt < 450) { toggled = true; $('#vm-hint').textContent = 'Recording… tap again to stop'; }
      else stopRec();
    });
    mic.addEventListener('contextmenu', e => e.preventDefault());
  }
  function reviewCard() {
    card(`<h2>How does it sound?</h2><p class="muted">${secs(take.dur)} seconds</p>
      <div class="vm-prog"><i id="vm-bar"></i></div>
      <div class="row vm-row"><button class="btn ghost small" data-vm="preview">▶️ Listen</button><button class="btn ghost small" data-vm="again">🔁 Again</button></div>
      <button class="btn wide" data-vm="send">✅ Send to ${esc(ctx.called(other()))}</button>
      <button class="btn ghost wide small" data-vm="cancel">Cancel</button>`);
  }

  // ── Recording ─────────────────────────────────────────────
  async function startRec() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return ctx.toast('This phone can’t record here 😕');
    const session = rec = { chunks: [], t0: 0 };
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch { rec = null; return ctx.toast('🎙️ Please allow the microphone to record a message'); }
    if (rec !== session) { stream.getTracks().forEach(t => t.stop()); return; }   // released before the mic opened
    const mimeType = TYPES.find(t => MediaRecorder.isTypeSupported?.(t));
    const mr = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 32000 });
    Object.assign(session, { stream, mr, t0: Date.now() });
    mr.ondataavailable = e => e.data?.size && session.chunks.push(e.data);
    mr.onstop = () => finishRec(session);
    mr.start(250);
    sfx.pop();
    $('#vm-rec')?.classList.add('on'); $('#vm-mic')?.classList.add('on');
    wave(session);
    session.timer = setInterval(() => {
      const left = MAX_MS - (Date.now() - session.t0);
      const h = $('#vm-hint'); if (h) h.textContent = `🔴 ${Math.ceil(Math.max(0, left) / 1000)} s left`;
      $('#vm-mic')?.style.setProperty('--p', Math.min(1, (Date.now() - session.t0) / MAX_MS));
      if (left <= 0) stopRec();
    }, 100);
  }
  function wave(session) {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const an = ac.createAnalyser(); an.fftSize = 256;
      ac.createMediaStreamSource(session.stream).connect(an);
      const data = new Uint8Array(an.frequencyBinCount);
      session.ac = ac;
      const draw = () => {
        const cv = $('#vm-wave'); if (!cv || rec !== session) return;
        an.getByteTimeDomainData(data);
        const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
        g.fillStyle = '#ff4d6d';
        for (let i = 0; i < 40; i++) {
          const v = Math.abs(data[Math.floor(i * data.length / 40)] - 128) / 128;
          const h = Math.max(3, v * cv.height * 2.2);
          g.fillRect(i * 6 + 1, (cv.height - h) / 2, 4, h);
        }
        requestAnimationFrame(draw);
      };
      draw();
    } catch {}
  }
  function stopRec(cancel = false) {
    const s = rec; if (!s) return;
    rec = null; s.cancel = cancel;
    clearInterval(s.timer);
    if (s.mr && s.mr.state !== 'inactive') s.mr.stop();
    else if (!s.mr) ctx.toast('Hold a little longer to record 🎙️', 1800);
    s.stream?.getTracks().forEach(t => t.stop());
    s.ac?.close?.();
  }
  function finishRec(s) {
    if (s.cancel) return;
    const dur = Math.min(MAX_MS, Date.now() - s.t0);
    if (dur < 700 || !s.chunks.length) { ctx.toast('That was too short — try again 🎙️', 2000); return recorderCard(); }
    const blob = new Blob(s.chunks, { type: s.mr.mimeType || s.chunks[0].type || 'audio/mp4' });
    if (take?.url) URL.revokeObjectURL(take.url);
    take = { blob, url: URL.createObjectURL(blob), dur };
    reviewCard();
  }
  const toDataURL = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
  async function send() {
    if (!take) return;
    if (take.blob.size > MAX_BYTES) return ctx.toast('That recording is too big 😕 Try a shorter one.');
    const d = await toDataURL(take.blob), now = store.now();
    const ok = await store.transact('vmail', cur => (cur && cur.d && cur.by !== me()) ? undefined : { by: me(), d, mime: take.blob.type, dur: take.dur, ts: now });
    if (!ok) { ctx.toast(`📼 ${esc(ctx.called(other()))} just left you a message — listen to it first!`); discard(); return open(); }
    store.push('log', { by: me(), text: 'left you a voice message 📼', ts: now });
    discard(); ctx.hideOverlay(); sfx.yay();
    ctx.toast(`📼 Sent! It’ll wait for ${esc(ctx.called(other()))} 💌`);
  }
  function discard() { stopPlayer(); if (take?.url) URL.revokeObjectURL(take.url); take = null; }

  // ── Playing ───────────────────────────────────────────────
  function stopPlayer() { if (player) { player.onended = null; player.pause(); player = null; } }
  function play(src, { onDone } = {}) {
    stopPlayer();
    const a = player = new Audio(src);
    a.ontimeupdate = () => { const b = $('#vm-bar'); if (b && a.duration && isFinite(a.duration)) b.style.width = (a.currentTime / a.duration * 100) + '%'; };
    a.onended = () => { const b = $('#vm-bar'); if (b) b.style.width = '100%'; player = null; onDone?.(); };
    a.onerror = () => { player = null; ctx.toast('😕 This phone couldn’t play that message. Tell Claude so it can be fixed!', 6000); };
    a.play().catch(() => ctx.toast('Tap ▶️ again to play 🔊'));
  }
  function playNew() {
    if (!V || !forMe()) return;
    const msg = V;
    $('[data-vm="play"]')?.setAttribute('disabled', '');
    play(msg.d, {
      onDone: () => {
        store.transact('vmail', cur => (cur && cur.ts === msg.ts) ? null : undefined);
        store.push('log', { by: me(), text: 'listened to your voice message 💕', ts: store.now() });
        card(`<h2>That’s all 💕</h2><p class="muted">The message is cleared. Want to reply?</p>
          <button class="btn wide" data-vm="reply">🎙️ Record a reply</button><button class="btn ghost wide small" data-dismiss>Close</button>`);
      },
    });
  }

  function route(d) {
    if (!d.vm) return false;
    const k = d.vm;
    if (k === 'go') goToMachine();
    else if (k === 'play') playNew();
    else if (k === 'replay' && V) play(V.d);
    else if (k === 'preview' && take) play(take.url);
    else if (k === 'redo' || k === 'reply' || k === 'again') { discard(); recorderCard(); }
    else if (k === 'delete') { if (confirm('Delete your voice message?')) { store.transact('vmail', cur => (cur && cur.by === me()) ? null : undefined); ctx.hideOverlay(); } }
    else if (k === 'send') send();
    else if (k === 'cancel') { stopRec(true); discard(); ctx.hideOverlay(); }
    return true;
  }
  // Closing the card any other way stops the mic and playback
  function closed() { if (rec) stopRec(true); discard(); }

  return { onData, decorate, open, route, closed, refresh: locate, waitingIn, CLOSABLE: ['vmail'] };
}
