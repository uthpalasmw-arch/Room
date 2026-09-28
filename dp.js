// 📷 Profile picture: pick a photo, drag/pinch it inside a circle, get back a small square JPEG (data URL).

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const V = 260;      // crop window size on screen (px)
const OUT = 256;    // saved picture size (px)

async function loadImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    // Big phone photos: shrink first so cropping stays smooth
    const k = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  } finally { URL.revokeObjectURL(url); }
}

// Resolves with the cropped picture, or null if cancelled
export async function cropPhoto(file, { $, showCard, hideOverlay, toast }) {
  let src;
  try { src = await loadImage(file); }
  catch { toast('Couldn’t open that photo 😕 Try another one.'); return null; }
  const w = src.width, h = src.height, min = Math.max(V / w, V / h);
  let s = min, ox = (V - w * s) / 2, oy = (V - h * s) / 2;

  showCard(`<h2>Crop your photo</h2><p class="muted">Drag to move · pinch or slide to zoom</p>
    <div class="dp-crop" id="dp-crop"><canvas id="dp-canvas" width="${V * 2}" height="${V * 2}"></canvas><div class="dp-ring"></div></div>
    <input type="range" class="dp-zoom" id="dp-zoom" min="1" max="4" step="0.01" value="1" aria-label="Zoom">
    <div class="row" style="justify-content:center;margin-top:12px"><button class="btn ghost" id="dp-cancel">Cancel</button><button class="btn" id="dp-use">Use photo ✨</button></div>`, 'crop');

  const cv = $('#dp-canvas'), g = cv.getContext('2d'), box = $('#dp-crop'), zoom = $('#dp-zoom');
  const fit = () => { ox = clamp(ox, V - w * s, 0); oy = clamp(oy, V - h * s, 0); };
  const draw = () => { g.fillStyle = '#eee'; g.fillRect(0, 0, V * 2, V * 2); g.drawImage(src, ox * 2, oy * 2, w * s * 2, h * s * 2); };
  const zoomTo = (ns, cx = V / 2, cy = V / 2) => {
    ns = clamp(ns, min, min * 4);
    ox = cx - (cx - ox) * ns / s; oy = cy - (cy - oy) * ns / s; s = ns;
    fit(); draw(); zoom.value = s / min;
  };
  draw();

  const ptrs = new Map();
  let pinch = null;
  box.addEventListener('pointerdown', e => { box.setPointerCapture?.(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); pinch = null; });
  box.addEventListener('pointermove', e => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    const r = box.getBoundingClientRect(), k = V / r.width;
    if (ptrs.size === 1) { ox += (e.clientX - p.x) * k; oy += (e.clientY - p.y) * k; fit(); draw(); }
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      const cx = ((a.x + b.x) / 2 - r.left) * k, cy = ((a.y + b.y) / 2 - r.top) * k;
      if (pinch) zoomTo(s * d / pinch, cx, cy);
      pinch = d;
    }
  });
  const up = e => { ptrs.delete(e.pointerId); pinch = null; };
  box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
  box.addEventListener('wheel', e => { e.preventDefault(); zoomTo(s * (e.deltaY < 0 ? 1.08 : 1 / 1.08)); }, { passive: false });
  zoom.addEventListener('input', () => zoomTo(min * +zoom.value));

  return new Promise(resolve => {
    $('#dp-cancel').onclick = () => { hideOverlay(); resolve(null); };
    $('#dp-use').onclick = () => {
      const out = document.createElement('canvas');
      out.width = out.height = OUT;
      out.getContext('2d').drawImage(src, -ox / s, -oy / s, V / s, V / s, 0, 0, OUT, OUT);
      hideOverlay();
      resolve(out.toDataURL('image/jpeg', 0.8));
    };
  });
}
