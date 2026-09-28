// Little synthesized sound effects (no audio files needed).
let ctx;
let ringTimer = null;

export function unlockAudio() {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {}
}

function tone(freq, dur, type = 'sine', vol = 0.15, when = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sfx = {
  ding() { tone(880, 0.15); tone(1320, 0.25, 'sine', 0.12, 0.12); },
  pop() { tone(520, 0.08, 'triangle', 0.2); tone(780, 0.08, 'triangle', 0.12, 0.05); },
  knock() { tone(170, 0.08, 'square', 0.1); tone(170, 0.08, 'square', 0.1, 0.18); tone(210, 0.1, 'square', 0.1, 0.36); },
  poke() { tone(300, 0.1, 'sawtooth', 0.08); tone(450, 0.12, 'sawtooth', 0.08, 0.1); },
  bonk() { tone(140, 0.18, 'square', 0.22); tone(90, 0.22, 'triangle', 0.25, 0.02); tone(1400, 0.06, 'square', 0.05, 0.12); tone(1100, 0.08, 'square', 0.05, 0.2); },
  whiff() { tone(900, 0.12, 'sawtooth', 0.04); tone(500, 0.16, 'sawtooth', 0.04, 0.06); },
  kick() { tone(220, 0.06, 'square', 0.12); tone(600, 0.25, 'sawtooth', 0.06, 0.02); tone(1200, 0.2, 'triangle', 0.05, 0.05); },
  splat() { tone(80, 0.3, 'square', 0.25); tone(60, 0.35, 'triangle', 0.3, 0.02); tone(300, 0.08, 'sawtooth', 0.08, 0.05); },
  power() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'square', 0.07, i * 0.07)); },
  chop() { tone(900, 0.04, 'square', 0.08); tone(300, 0.05, 'triangle', 0.1, 0.02); },
  clack() { tone(1500, 0.03, 'square', 0.07); tone(700, 0.05, 'square', 0.06, 0.03); },
  tick() { tone(1000, 0.05, 'sine', 0.1); },
  pour() { tone(420, 0.5, 'sine', 0.03); tone(460, 0.5, 'sine', 0.03, 0.05); },
  sizzle() { for (let i = 0; i < 5; i++) tone(2400 + Math.random() * 1600, 0.03, 'sawtooth', 0.012, i * 0.05); },
  munch() { tone(180, 0.06, 'square', 0.08); tone(140, 0.06, 'square', 0.07, 0.08); },
  yay() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.16, 'triangle', 0.12, i * 0.09)); },
  boom() { tone(90, 0.35, 'triangle', 0.12); for (let i = 0; i < 6; i++) tone(1800 + Math.random() * 1400, 0.05, 'square', 0.015, 0.12 + i * 0.05); },
  koel() { [0, 0.55, 1.1].forEach((w, i) => { tone(620 + i * 90, 0.12, 'sine', 0.09, w); tone(880 + i * 120, 0.28, 'sine', 0.1, w + 0.12); }); },
  swish() { tone(1200, 0.12, 'triangle', 0.06); tone(900, 0.12, 'triangle', 0.06, 0.06); },
  ring() { [0, 0.18, 0.5, 0.68].forEach((w, i) => tone(i % 2 ? 988 : 784, 0.16, 'sine', 0.22, w)); },
  ringback() { tone(440, 0.8, 'sine', 0.06); tone(480, 0.8, 'sine', 0.06); },
};

export function startRing(kind = 'ring') {
  stopRing();
  const play = () => {
    sfx[kind]();
    if (kind === 'ring') navigator.vibrate?.([300, 150, 300]);
  };
  play();
  ringTimer = setInterval(play, kind === 'ring' ? 1800 : 3000);
}

export function stopRing() {
  clearInterval(ringTimer);
  ringTimer = null;
}
