// ShinyText sin React: un brillo que cruza el texto (degradado recortado al texto, background-clip: text).
// Uso: ShinyText(elemento, { color, shineColor, speed, ... }). Se para cuando el título no está en pantalla.
// ponytail: solo los modos "loop" y "view"; sin followPointer, pauseOnHover ni glow (no se usan en la web).
(function () {
const EASINGS = { linear: (t) => t, smooth: (t) => 0.5 - Math.cos(Math.PI * t) / 2,
  snappy: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2) };
const FALLOFF = [0, 0.2, 0.4, 0.6, 0.8, 1];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
let pintor = null;
const rgba = (valor) => {
  pintor = pintor || document.createElement('canvas').getContext('2d');
  pintor.fillStyle = '#000000';
  pintor.fillStyle = valor;
  const r = String(pintor.fillStyle);
  if (r.startsWith('#')) return [1, 3, 5].map((i) => parseInt(r.slice(i, i + 2), 16)).concat(1);
  const p = r.match(/[\d.]+/g).map(Number);
  return [p[0], p[1], p[2], p[3] ?? 1];
};
// mezcla en luz lineal (gamma 2.2), como el original
const mezcla = (a, b, t) => {
  const c = (x, y) => Math.round(((x / 255) ** 2.2 * (1 - t) + (y / 255) ** 2.2 * t) ** (1 / 2.2) * 255);
  return `rgba(${c(a[0], b[0])}, ${c(a[1], b[1])}, ${c(a[2], b[2])}, ${Math.round((a[3] * (1 - t) + b[3] * t) * 1000) / 1000})`;
};

window.ShinyText = function ShinyText(el, {
  color = '#b5b5b5', shineColor = '#ffffff', speed = 2, delay = 0, angle = 120, shineWidth = 40, softness = 0.8,
  bands = 1, direction = 'left', easing = 'smooth', trigger = 'loop', yoyo = false, disabled = false,
} = {}) {
  if (el.dataset.shiny) return;
  el.dataset.shiny = '';
  el.classList.add('shiny-text');
  const base = rgba(color), brillo = rgba(shineColor);
  const plano = `linear-gradient(${color}, ${color})`;
  el.style.backgroundImage = plano;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (disabled || reduce) return;
  speed = Math.max(0.1, speed); shineWidth = clamp(shineWidth, 2, 200); softness = clamp(softness, 0, 1); bands = clamp(Math.round(bands), 1, 3);
  const sign = direction === 'right' ? 1 : -1, ease = EASINGS[easing] || EASINGS.smooth;
  const extent = shineWidth / 2 + (bands - 1) * shineWidth * 1.3 + 2;
  const entrada = sign > 0 ? -extent : 100 + extent, salida = sign > 0 ? 100 + extent : -extent;

  const degradado = (pos) => {
    const half = shineWidth / 2, core = half * (1 - softness), fade = half - core, stops = [];
    for (let b = 0; b < bands; b++) {
      const centro = pos - sign * b * shineWidth * 1.3, fuerza = 1 - b * 0.28;
      for (const lado of [-1, 1]) for (const f of FALLOFF) stops.push([centro + lado * (core + fade * (1 - f)), f * f * (3 - 2 * f) * fuerza]);
    }
    stops.sort((a, b) => a[0] - b[0]);
    return `linear-gradient(${angle}deg, ${mezcla(base, brillo, 0)} 0%, ${stops.map(([at, t]) => `${mezcla(base, brillo, t)} ${at.toFixed(2)}%`).join(', ')}, ${mezcla(base, brillo, 0)} 100%)`;
  };

  let raf = 0, timer = 0, visible = false, visto = false, flip = false, desde = entrada, hasta = salida, inicio = 0;
  const barrido = (a, b) => { desde = a; hasta = b; inicio = performance.now(); };
  const tick = (now) => {
    raf = 0;
    const t = clamp((now - inicio) / (speed * 1000), 0, 1);
    el.style.backgroundImage = degradado(desde + (hasta - desde) * ease(t));
    if (t < 1) { raf = requestAnimationFrame(tick); return; }
    el.style.backgroundImage = plano;
    if (trigger !== 'loop') return;
    timer = setTimeout(() => {
      if (!visible || !el.isConnected) return;
      if (yoyo) { flip = !flip; barrido(flip ? salida : entrada, flip ? entrada : salida); } else barrido(entrada, salida);
      raf = requestAnimationFrame(tick);
    }, delay * 1000);
  };
  const obs = new IntersectionObserver((es) => {
    visible = es.some((e) => e.isIntersecting);
    if (!el.isConnected) { obs.disconnect(); cancelAnimationFrame(raf); clearTimeout(timer); return; }
    if (!visible || raf) return;
    if (trigger === 'view' && visto) return;
    visto = true;
    clearTimeout(timer);
    barrido(entrada, salida);
    raf = requestAnimationFrame(tick);
  });
  obs.observe(el);
};
})();
