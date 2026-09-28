// Group voice calls (you two + a visitor). Every phone connects directly to every other phone (WebRTC).
// Shared state:  /call = { id, by, ts, members: { [who]: joinedAt } }
// Signaling:     /callsig/{callId}/{from}_{to} = { offer, answer, ice: { [who]: {…candidates} } }
// The newest person to join always sends the offers, so two phones never offer to each other at once.
import { CONFIG } from './config.js?v=27';

export function createCall(store, me, ui) {
  const iceServers = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    ...(CONFIG.turn || []),
  ];
  let call = null, inCall = false, stream = null, muted = false, timeout = null, sigUnsub = null, declined = null;
  const peers = new Map();   // who → { pc, key, seen:Set, pending:[], audio }
  const now = () => store.now();

  const members = () => Object.keys(call?.members || {});
  function refresh() {
    if (!call) { if (inCall || peers.size) teardown(); return report(); }
    for (const who of [...peers.keys()]) if (!call.members[who]) dropPeer(who);   // someone left
    if (inCall && !call.members[me]) teardown();                                   // we were removed
    if (inCall) connectToNewPeople();
    report();
  }
  function report() {
    const m = members();
    if (inCall) return ui.set(m.length > 1 ? 'active' : 'calling', { members: m.filter(x => x !== me) });
    if (call && m.length && declined !== call.id) {
      const fresh = now() - call.ts < 45000 && m.length === 1;
      return ui.set(fresh ? 'incoming' : 'available', { by: call.by, members: m });
    }
    ui.set('idle', {});
  }

  const getMic = () => navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });

  async function start() {
    if (inCall) return;
    if (call && members().length) return join();
    if (!navigator.mediaDevices?.getUserMedia) return ui.error('Calls need the room to be opened over https.');
    try { stream = await getMic(); } catch { return ui.error('Please allow the microphone to make calls 🎙️'); }
    const id = now().toString(36) + Math.random().toString(36).slice(2, 7);
    inCall = true; declined = null;
    listenSig(id);
    await store.set('call', { id, by: me, ts: now(), members: { [me]: now() } });
    clearTimeout(timeout);
    timeout = setTimeout(() => { if (inCall && members().length <= 1) { ui.error('No answer 😴'); hangup(); } }, 45000);
  }
  async function join() {
    if (inCall || !call) return;
    if (!navigator.mediaDevices?.getUserMedia) return ui.error('Calls need the room to be opened over https.');
    try { stream = stream || await getMic(); } catch { return ui.error('Please allow the microphone to join the call 🎙️'); }
    inCall = true; declined = null;
    listenSig(call.id);
    await store.update('call/members', { [me]: now() });
    connectToNewPeople();
  }
  function decline() { declined = call?.id || null; report(); }

  // I send the offer to everyone who joined before me
  function connectToNewPeople() {
    if (!call || !stream) return;
    const mine = call.members[me];
    for (const [who, t] of Object.entries(call.members)) {
      if (who === me || peers.has(who)) continue;
      if (t < mine || (t === mine && who < me)) makePeer(who, true);
    }
  }
  function makePeer(who, offerer) {
    const id = call.id, key = offerer ? `${me}_${who}` : `${who}_${me}`;
    const pc = new RTCPeerConnection({ iceServers });
    const audio = document.createElement('audio');
    audio.autoplay = true; audio.setAttribute('playsinline', ''); document.body.append(audio);
    const p = { pc, key, seen: new Set(), pending: [], audio };
    peers.set(who, p);
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    pc.ontrack = e => { audio.srcObject = e.streams[0]; audio.play().catch(() => {}); };
    pc.onicecandidate = e => { if (e.candidate) store.push(`callsig/${id}/${key}/ice/${me}`, e.candidate.toJSON()); };
    const watch = s => {
      if (s === 'connected' || s === 'completed') { clearTimeout(timeout); report(); }
      if (s === 'failed') { ui.error('Couldn’t connect to someone on the call 😕 (see README → Calls)'); dropPeer(who); }
    };
    pc.onconnectionstatechange = () => watch(pc.connectionState);
    pc.oniceconnectionstatechange = () => watch(pc.iceConnectionState);
    if (offerer) pc.createOffer().then(o => pc.setLocalDescription(o).then(() => store.update(`callsig/${id}/${key}`, { offer: { type: o.type, sdp: o.sdp } }))).catch(e => console.warn(e));
    return p;
  }
  function listenSig(id) {
    sigUnsub?.();
    sigUnsub = store.on(`callsig/${id}`, all => {
      for (const [key, node] of Object.entries(all || {})) {
        const [from, to] = key.split('_');
        if (to === me && node.offer && !peers.has(from) && inCall && stream) {      // someone joined after me
          const p = makePeer(from, false);
          p.pc.setRemoteDescription(node.offer)
            .then(() => p.pc.createAnswer())
            .then(a => p.pc.setLocalDescription(a).then(() => { store.update(`callsig/${id}/${key}`, { answer: { type: a.type, sdp: a.sdp } }); flush(p); }))
            .catch(e => console.warn(e));
        }
        const peerId = from === me ? to : to === me ? from : null;
        const p = peerId && peers.get(peerId); if (!p) continue;
        if (from === me && node.answer && !p.pc.remoteDescription) p.pc.setRemoteDescription(node.answer).then(() => flush(p)).catch(e => console.warn(e));
        for (const [k, c] of Object.entries(node.ice?.[peerId] || {})) {
          if (p.seen.has(k)) continue;
          p.seen.add(k);
          if (p.pc.remoteDescription) p.pc.addIceCandidate(c).catch(() => {}); else p.pending.push(c);
        }
      }
    });
  }
  const flush = p => p.pending.splice(0).forEach(c => p.pc.addIceCandidate(c).catch(() => {}));
  function dropPeer(who) {
    const p = peers.get(who); if (!p) return;
    p.pc.close(); p.audio.srcObject = null; p.audio.remove();
    peers.delete(who);
    report();
  }

  function hangup() {
    const id = call?.id, left = members().filter(x => x !== me);
    teardown();
    if (!id) return;
    if (left.length === 0) { store.remove('call'); setTimeout(() => store.remove(`callsig/${id}`), 3000); }
    else store.remove(`call/members/${me}`);
  }
  function teardown() {
    clearTimeout(timeout);
    sigUnsub?.(); sigUnsub = null;
    for (const who of [...peers.keys()]) dropPeer(who);
    stream?.getTracks().forEach(t => t.stop()); stream = null;
    inCall = false; muted = false;
    report();
  }
  function mute() {
    const t = stream?.getAudioTracks()[0]; if (!t) return false;
    t.enabled = !t.enabled; muted = !t.enabled; return muted;
  }
  // People who went offline mid-call are taken off the call so no ghost call is left behind
  function prune(isOnline) {
    if (!call) return;
    const left = members().filter(who => who !== me && !isOnline(who) && now() - (call.members[who] || 0) > 20000);
    left.forEach(who => store.remove(`call/members/${who}`));
    if (!inCall && members().length && members().every(w => !isOnline(w) || left.includes(w))) store.remove('call');
  }

  store.on('call', c => { call = c && c.id && c.members ? c : null; refresh(); });   // subscribe last (it can fire right away)

  return { start, join, decline, hangup, mute, prune, get state() { return inCall ? (members().length > 1 ? 'active' : 'calling') : 'idle'; } };
}
