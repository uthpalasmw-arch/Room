// Voice calls: WebRTC audio, phone-to-phone. The room database is used
// only to exchange the connection details ("signaling").
import { CONFIG } from './config.js';

export function createCall(store, me, other, ui) {
  const iceServers = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    ...(CONFIG.turn || []),
  ];
  const audio = document.getElementById('remote-audio');
  let state = 'idle', pc = null, stream = null, id = null, offer = null;
  let unsubIce = null, seenIce = new Set(), pendingIce = [], timeout = null;

  const setState = s => { if (s === state) return; state = s; ui.set(s); };

  store.on('call', c => onCall(c).catch(err => { console.error(err); ui.error('Call problem: ' + err.message); hangup(); }));

  async function onCall(c) {
    if (!c || c.state === 'ended' || c.state === 'declined') {
      if (state !== 'idle' && (!c || c.id === id)) {
        if (c?.state === 'declined' && state === 'calling') ui.error('They can’t talk right now 🙈');
        teardown();
      }
      return;
    }
    if (c.state === 'ringing' && c.to === me) {
      if (store.now() - c.ts > 60000) return;          // stale
      if (state === 'calling' && c.id !== id) teardown(); // both called at once: take theirs
      if (state === 'idle') { id = c.id; offer = c.offer; setState('incoming'); }
      return;
    }
    if (c.state === 'active' && c.id === id && c.from === me && state === 'calling' && c.answer && pc) {
      clearTimeout(timeout);
      setState('connecting');
      await pc.setRemoteDescription(c.answer);
      flushIce();
    }
  }

  const getMic = () => navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false,
  });

  function makePc() {
    pc = new RTCPeerConnection({ iceServers });
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    pc.ontrack = e => { audio.srcObject = e.streams[0]; audio.play().catch(() => {}); };
    pc.onicecandidate = e => { if (e.candidate) store.push(`callIce/${id}/${me}`, e.candidate.toJSON()); };
    const watch = s => {
      if (s === 'connected' || s === 'completed') setState('active');
      if (s === 'failed') { ui.error('The call couldn’t connect 😕 One of your networks may need a relay — see README → Calls.'); hangup(); }
    };
    pc.onconnectionstatechange = () => pc && watch(pc.connectionState);
    pc.oniceconnectionstatechange = () => pc && watch(pc.iceConnectionState);
    unsubIce = store.on(`callIce/${id}/${other}`, v => {
      for (const [k, c] of Object.entries(v || {})) {
        if (seenIce.has(k)) continue;
        seenIce.add(k);
        if (pc?.remoteDescription) pc.addIceCandidate(c).catch(() => {});
        else pendingIce.push(c);
      }
    });
  }

  const flushIce = () => pendingIce.splice(0).forEach(c => pc?.addIceCandidate(c).catch(() => {}));

  async function start() {
    if (state !== 'idle') return;
    if (!navigator.mediaDevices?.getUserMedia) { ui.error('Calls need the room to be opened over https.'); return; }
    id = store.now().toString(36) + Math.random().toString(36).slice(2, 8);
    setState('calling');
    try { stream = await getMic(); }
    catch { teardown(); ui.error('Please allow the microphone to make calls 🎙️'); return; }
    makePc();
    const o = await pc.createOffer();
    await pc.setLocalDescription(o);
    await store.set('call', { id, from: me, to: other, state: 'ringing', offer: { type: o.type, sdp: o.sdp }, ts: store.now() });
    timeout = setTimeout(() => { if (state === 'calling') { ui.error('No answer 😴'); hangup(); } }, 45000);
  }

  async function accept() {
    if (state !== 'incoming') return;
    setState('connecting');
    try { stream = await getMic(); }
    catch { ui.error('Please allow the microphone to answer calls 🎙️'); decline(); return; }
    makePc();
    await pc.setRemoteDescription(offer);
    flushIce();
    const a = await pc.createAnswer();
    await pc.setLocalDescription(a);
    await store.update('call', { state: 'active', answer: { type: a.type, sdp: a.sdp } });
  }

  function decline() {
    if (id) store.update('call', { state: 'declined' });
    teardown();
  }

  function hangup() {
    const old = id;
    if (old) store.update('call', { state: 'ended' });
    teardown();
    if (old) setTimeout(() => store.remove(`callIce/${old}`), 3000);
  }

  function mute() {
    const t = stream?.getAudioTracks()[0];
    if (!t) return false;
    t.enabled = !t.enabled;
    return !t.enabled;
  }

  function teardown() {
    clearTimeout(timeout);
    unsubIce?.(); unsubIce = null;
    pc?.close(); pc = null;
    stream?.getTracks().forEach(t => t.stop()); stream = null;
    audio.srcObject = null;
    id = null; offer = null; seenIce = new Set(); pendingIce = [];
    setState('idle');
  }

  return { start, accept, decline, hangup, mute, get state() { return state; } };
}
