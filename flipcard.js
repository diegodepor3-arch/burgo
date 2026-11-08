// FlipCard sin React ni motion: carta que se da la vuelta al hacer clic o al arrastrarla, con inclinación y brillo.
// HTML: <div class="flip-card"><span class="flip-card__shadow"></span><div class="flip-card__rotor">
//   <div class="flip-card__face flip-card__face--front">…<span class="flip-card__glare"></span></div>
//   <div class="flip-card__face flip-card__face--back">…<span class="flip-card__glare"></span></div></div></div>
// Uso: FlipCard(elemento, { axis, tiltMax, ... }). Los enlaces de la cara visible funcionan sin girar la carta.
(function () {
const SLOP = { fine: 4, coarse: 8 };
const FLING = 0.16;
const HISTORY_MS = 90;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const snap = (deg) => Math.round(deg / 180) * 180;
const isBack = (deg) => Math.abs(Math.round(deg / 180)) % 2 === 1;

// Muelle amortiguado (como los springs de motion): se integra en pasos pequeños hasta quedarse quieto
function muelle(x, { stiffness, damping, mass = 1 }) {
  return { x, v: 0, to: x, k: stiffness, c: damping, m: mass, restDelta: 0.01,
    set(to, v) { this.to = to; if (v != null) this.v = v; },
    jump(x) { this.x = this.to = x; this.v = 0; },
    step(dt) {
      for (let t = 0; t < dt; t += 1 / 240) {
        const h = Math.min(1 / 240, dt - t);
        this.v += ((-this.k * (this.x - this.to) - this.c * this.v) / this.m) * h;
        this.x += this.v * h;
      }
      const quieto = Math.abs(this.x - this.to) < this.restDelta && Math.abs(this.v) < this.restDelta * 10;
      if (quieto) { this.x = this.to; this.v = 0; }
      return !quieto;
    } };
}

window.FlipCard = function FlipCard(root, {
  axis = 'y', flipOnClick = true, draggable = true, dragDistance = 0, tilt = true, tiltMax = 12,
  glareOpacity = 0.22, hoverScale = 1.03, perspective = 1100, stiffness = 170, damping = 20,
  shadowOpacity = 0.45, onFlipChange,
} = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rotor = root.querySelector('.flip-card__rotor');
  const front = root.querySelector('.flip-card__face--front');
  const back = root.querySelector('.flip-card__face--back');
  const shadowEl = root.querySelector('.flip-card__shadow');
  root.dataset.axis = axis;
  root.setAttribute('role', 'button');
  root.tabIndex = 0;
  root.style.setProperty('--fc-glare', glareOpacity);
  if (draggable && !reduce) root.dataset.draggable = '';

  let shown = false;
  const turn = muelle(0, { stiffness, damping });
  turn.restDelta = 0.05;
  const tiltX = muelle(0, { stiffness: 240, damping: 24, mass: 0.6 });
  const tiltY = muelle(0, { stiffness: 240, damping: 24, mass: 0.6 });
  const lift = muelle(1, { stiffness: 320, damping: 26 });
  const sheen = muelle(0, { stiffness: 320, damping: 26 });
  lift.restDelta = sheen.restDelta = 0.001;
  let gx = 50, gy = 50, grip = null, raf = 0, last = 0, turnFree = true;

  const pintar = () => {
    const t = turn.x;
    rotor.style.transform = axis === 'x'
      ? `perspective(${perspective}px) scale(${lift.x}) rotateY(${tiltY.x}deg) rotateX(${t + tiltX.x}deg)`
      : `perspective(${perspective}px) scale(${lift.x}) rotateX(${tiltX.x}deg) rotateY(${t + tiltY.x}deg)`;
    rotor.style.setProperty('--fc-gx', `${gx}%`);
    rotor.style.setProperty('--fc-gy', `${gy}%`);
    rotor.style.setProperty('--fc-sheen', sheen.x);
    if (shadowEl) {
      const f = Math.abs(Math.cos((t * Math.PI) / 180));
      shadowEl.style.transform = axis === 'x' ? `scaleY(${0.08 + 0.92 * f})` : `scaleX(${0.08 + 0.92 * f})`;
      shadowEl.style.opacity = (0.1 + 0.9 * f * f) * shadowOpacity;
    }
  };
  const frame = (now) => {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    let moving = false;
    if (turnFree) moving = turn.step(dt) || moving;
    for (const m of [tiltX, tiltY, lift, sheen]) moving = m.step(dt) || moving;
    pintar();
    if (moving || grip) raf = requestAnimationFrame(frame);
    else last = 0;
  };
  const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };

  const caras = () => {
    root.setAttribute('aria-pressed', shown);
    front.inert = shown; back.inert = !shown;
    front.setAttribute('aria-hidden', shown); back.setAttribute('aria-hidden', !shown);
  };
  const settle = (to, velocity, instant) => {
    turnFree = true;
    if (instant || reduce) turn.jump(to); else turn.set(to, velocity);
    if (reduce) root.dataset.fade = isBack(to) ? 'back' : 'front';
    const next = isBack(to);
    if (next !== shown) { shown = next; caras(); onFlipChange?.(next); }
    wake();
  };
  const flip = (instant) => {
    const base = snap(turn.to);
    settle(isBack(base) ? base - 180 : base + 180, 0, instant);
  };
  const rest = () => { tiltX.set(0); tiltY.set(0); sheen.set(0); lift.set(1); wake(); };

  root.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || grip || e.target.closest('a')) return;
    try { root.setPointerCapture(e.pointerId); } catch {}
    grip = { id: e.pointerId, x: e.clientX, y: e.clientY, base: turn.x, moved: false,
      slop: e.pointerType === 'touch' ? SLOP.coarse : SLOP.fine, hist: [] };
    if (!reduce) lift.set(hoverScale);
    wake();
  });
  root.addEventListener('pointermove', (e) => {
    const g = grip;
    if (g && g.id === e.pointerId) {
      const d = axis === 'x' ? e.clientY - g.y : e.clientX - g.x;
      if (!g.moved) {
        if (Math.abs(d) < g.slop || !draggable || reduce) return;
        g.moved = true;
        turnFree = false;
        root.dataset.dragging = '';
        tiltX.set(0); tiltY.set(0); sheen.set(0);
      }
      const r = root.getBoundingClientRect();
      const span = dragDistance > 0 ? dragDistance : axis === 'x' ? r.height : r.width;
      const deg = g.base + (axis === 'x' ? -1 : 1) * (d / span) * 180;
      turn.x = turn.to = deg;
      turn.v = 0;
      const now = performance.now();
      g.hist.push({ t: now, v: deg });
      while (g.hist.length > 2 && now - g.hist[0].t > HISTORY_MS) g.hist.shift();
      wake();
      return;
    }
    if (!tilt || reduce || e.pointerType === 'touch') return;
    const r = root.getBoundingClientRect();
    const px = clamp((e.clientX - r.left) / r.width, 0, 1);
    const py = clamp((e.clientY - r.top) / r.height, 0, 1);
    tiltX.set((0.5 - py) * 2 * tiltMax);
    tiltY.set((px - 0.5) * 2 * tiltMax);
    gx = px * 100; gy = py * 100;
    sheen.set(1);
    wake();
  });
  const release = (e, cancelled) => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    grip = null;
    try { if (root.hasPointerCapture(e.pointerId)) root.releasePointerCapture(e.pointerId); } catch {}
    delete root.dataset.dragging;
    if (e.pointerType === 'touch' || !root.matches(':hover')) rest();
    if (!g.moved) {
      if (!cancelled && flipOnClick) flip(false);
      else settle(turn.to, 0, false);
      return;
    }
    const here = turn.x;
    let velocity = 0;
    const a = g.hist[0], b = g.hist[g.hist.length - 1];
    if (!cancelled && a && b && b.t > a.t && performance.now() - b.t < 60) velocity = ((b.v - a.v) / (b.t - a.t)) * 1000;
    const to = cancelled ? snap(g.base) : clamp(snap(here + velocity * FLING), snap(here) - 180, snap(here) + 180);
    settle(to, velocity, false);
  };
  root.addEventListener('pointerup', (e) => release(e, false));
  root.addEventListener('pointercancel', (e) => release(e, true));
  root.addEventListener('lostpointercapture', (e) => release(e, true));
  root.addEventListener('pointerenter', (e) => { if (!reduce && e.pointerType !== 'touch') { lift.set(hoverScale); wake(); } });
  root.addEventListener('pointerleave', () => { if (!grip) rest(); });
  root.addEventListener('keydown', (e) => {
    if (e.target !== root || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    if (!e.repeat) flip(true);
  });
  root.addEventListener('dragstart', (e) => e.preventDefault());
  caras();
  pintar();
};
})();
