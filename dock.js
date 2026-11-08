// Dock sin React: iconos que crecen al acercar el puntero (muelle), botan al pulsarlos y enseñan su nombre.
// Convierte los <a>/<button> hijos de `root` en elementos del dock: cada uno necesita data-icono="id-del-symbol"
// y su texto, que pasa a ser la etiqueta. data-badge="n" pinta un globo; [aria-current] lleva el punto.
// ponytail: sin los menús contextuales de clic largo; el menú de Equipos ya tiene su desplegable.
(function () {
const HOP = 0.4, HOP_TIME = 0.38;

window.Dock = function Dock(root, {
  position = 'bottom', baseItemSize = 50, magnification = 70, distance = 200, gap = 10, roundness = 0.5,
  spring = { mass: 0.1, stiffness: 150, damping: 12 }, bounce = true,
} = {}) {
  const vertical = position === 'left' || position === 'right';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('dock', `dock--${position}`);
  root.setAttribute('role', 'toolbar');
  root.style.setProperty('--dock-base', `${baseItemSize}px`);
  root.style.setProperty('--dock-gap', `${gap}px`);
  root.style.setProperty('--dock-round', roundness);

  const items = [...root.children].filter((el) => el.matches('a, button, .dock-separator'));
  for (const el of items) {
    if (el.classList.contains('dock-separator')) continue;
    const texto = el.textContent.trim();
    el.classList.add('dock-item');
    el.setAttribute('aria-label', el.getAttribute('aria-label') || texto);
    el.innerHTML = `<span class="dock-tile"><span class="dock-face"><svg aria-hidden="true"><use href="#${el.dataset.icono}"/></svg></span>${el.dataset.badge ? `<span class="dock-badge">${el.dataset.badge}</span>` : ''}</span>
      <span class="dock-dot" aria-hidden="true"></span><span class="dock-label" aria-hidden="true">${texto}</span>`;
  }

  const estado = new Map();
  const st = (el) => estado.get(el) || (estado.set(el, { size: baseItemSize, v: 0, lift: 0, rise: 0, launch: 0, gravity: 0, hopping: false, drawn: '' }), estado.get(el));
  const pointer = { x: 0, y: 0, inside: false };
  let focused = null, raf = 0, last = 0;

  const tick = (now) => {
    raf = 0;
    const dt = Math.min(1 / 30, Math.max(0.001, (now - last) / 1000));
    last = now;
    const k = spring.stiffness / spring.mass, c = spring.damping / spring.mass;
    const steps = Math.max(1, Math.ceil(dt * 240)), h = dt / steps;
    let moving = false;
    for (const el of items) {
      if (!el.classList.contains('dock-item')) continue;
      const s = st(el);
      // centro del elemento en reposo (sin agrandar) para no perseguir su propio crecimiento
      const r = el.getBoundingClientRect();
      const centro = vertical ? r.top + r.height / 2 : r.left + r.width / 2;
      const foco = pointer.inside ? (vertical ? pointer.y : pointer.x) : focused === el ? centro : null;
      const reach = foco === null ? 1 : Math.abs(foco - centro) / distance;
      const target = baseItemSize + (magnification - baseItemSize) * (reach < 1 ? Math.cos((reach * Math.PI) / 2) ** 2 : 0);
      if (reduce) { s.size = target; s.v = 0; } else {
        for (let i = 0; i < steps; i++) {
          s.v = (s.v + h * k * (target - s.size)) / (1 + h * c + h * h * k);
          s.size += s.v * h;
          if (!s.hopping) continue;
          s.rise -= s.gravity * h;
          s.lift += s.rise * h;
          if (s.lift > 0) continue;
          s.lift = 0;
          s.rise *= -0.36;
          if (s.rise < s.launch * 0.2) { s.rise = 0; s.hopping = false; }
        }
      }
      if (Math.abs(s.v) < 0.01 && Math.abs(target - s.size) < 0.01) { s.size = target; s.v = 0; } else moving = true;
      if (s.hopping) moving = true;
      const size = Math.max(1, s.size), drawn = `${size.toFixed(2)} ${s.lift.toFixed(2)}`;
      if (drawn === s.drawn) continue;
      s.drawn = drawn;
      const lift = position === 'bottom' || position === 'right' ? -s.lift : s.lift;
      el.style.width = el.style.height = `${size}px`;
      el.firstElementChild.style.transform = `translate(${vertical ? `${lift}px, 0` : `0, ${lift}px`}) scale(${size / baseItemSize})`;
    }
    if (moving) raf = requestAnimationFrame(tick);
  };
  const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };

  const hop = (el) => {
    if (reduce || !bounce) return;
    const s = st(el);
    if (s.hopping) return;
    s.gravity = (8 * s.size * HOP) / (HOP_TIME * HOP_TIME);
    s.launch = s.rise = (s.gravity * HOP_TIME) / 2;
    s.hopping = true;
    wake();
  };
  const mover = (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.inside = true; wake(); };
  root.addEventListener('pointermove', mover);
  root.addEventListener('pointerdown', mover);
  root.addEventListener('pointerleave', () => { pointer.inside = false; wake(); });
  root.addEventListener('pointercancel', () => { pointer.inside = false; wake(); });
  for (const el of items) {
    if (!el.classList.contains('dock-item')) continue;
    el.addEventListener('click', () => hop(el));
    el.addEventListener('focus', () => { if (el.matches(':focus-visible')) { focused = el; wake(); } });
    el.addEventListener('blur', () => { focused = null; wake(); });
  }
  // flechas para moverse entre elementos
  root.addEventListener('keydown', (e) => {
    const lista = items.filter((x) => x.classList.contains('dock-item')), i = lista.indexOf(document.activeElement);
    const [atras, alante] = vertical ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight'];
    const sig = e.key === atras ? lista[(i - 1 + lista.length) % lista.length] : e.key === alante ? lista[(i + 1) % lista.length]
      : e.key === 'Home' ? lista[0] : e.key === 'End' ? lista.at(-1) : null;
    if (i >= 0 && sig) { e.preventDefault(); sig.focus(); }
  });
  wake();
  return { setBadge(el, n) { const b = el.querySelector('.dock-badge'); if (b) b.textContent = n; } };
};
})();
