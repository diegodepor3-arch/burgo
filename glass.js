// GlassSurface sin React: cristal que refracta lo que pasa por detrás (backdrop-filter con un filtro SVG
// de desplazamiento por canales). Safari y Firefox no aplican filtros SVG en backdrop-filter: ahí queda esmerilado.
// ponytail: sin los modos WebGL (backdrop de una imagen concreta) ni shape (logo); el menú no los necesita.
(function () {
let n = 0;
const soportaSVG = () => {
  const ua = navigator.userAgent;
  if ((/Safari/.test(ua) && !/Chrome/.test(ua)) || /Firefox/.test(ua)) return false;
  const d = document.createElement('div');
  d.style.backdropFilter = 'url(#x)';
  return d.style.backdropFilter !== '';
};

window.GlassSurface = function GlassSurface(el, {
  borderRadius = 20, borderWidth = 0.07, brightness = 50, opacity = 0.93, blur = 11, displace = 0,
  backgroundOpacity = 0, saturation = 1, distortionScale = -180, redOffset = 0, greenOffset = 10, blueOffset = 20,
  xChannel = 'R', yChannel = 'G', mixBlendMode = 'difference',
} = {}) {
  const id = `glass-${++n}`;
  const svg = soportaSVG();
  el.classList.add('glass-surface', svg ? 'glass-surface--svg' : 'glass-surface--fallback');
  el.style.borderRadius = `${borderRadius}px`;
  el.style.setProperty('--glass-frost', backgroundOpacity);
  el.style.setProperty('--glass-saturation', saturation);
  el.style.setProperty('--filter-id', `url(#${id}-filtro)`);
  if (!svg) { el.insertAdjacentHTML('afterbegin', '<span class="glass-surface__sheen" aria-hidden="true"></span><span class="glass-surface__rim" aria-hidden="true"></span>'); return; }

  const canal = (c, k) => `<feDisplacementMap in="SourceGraphic" in2="map" scale="${distortionScale + k}" xChannelSelector="${xChannel}" yChannelSelector="${yChannel}" result="d${c}"/>
    <feColorMatrix in="d${c}" type="matrix" values="${c === 'r' ? '1 0 0 0 0 0 0 0 0 0 0 0 0 0 0' : c === 'g' ? '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0' : '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0'} 0 0 0 1 0" result="${c}"/>`;
  el.insertAdjacentHTML('afterbegin', `<svg class="glass-surface__filter" aria-hidden="true"><defs>
    <filter id="${id}-filtro" color-interpolation-filters="sRGB" x="0%" y="0%" width="100%" height="100%">
      <feImage x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map"/>
      ${canal('r', redOffset)}${canal('g', greenOffset)}${canal('b', blueOffset)}
      <feBlend in="r" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="b" mode="screen" result="output"/>
      <feGaussianBlur in="output" stdDeviation="${displace}"/>
    </filter></defs></svg>`);
  const feImage = el.querySelector('feImage');

  // Mapa de desplazamiento: degradados rojo (x) y azul (y) en los bordes y un centro gris que no mueve nada
  const mapa = () => {
    const w = el.offsetWidth || 400, h = el.offsetHeight || 200, borde = Math.min(w, h) * (borderWidth * 0.5);
    const s = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs>
      <linearGradient id="${id}-r" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient>
      <linearGradient id="${id}-b" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient>
      <filter id="${id}-s" filterUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${blur}"/></filter></defs>
      <rect width="${w}" height="${h}" fill="black"/>
      <rect width="${w}" height="${h}" rx="${borderRadius}" fill="url(#${id}-r)"/>
      <rect width="${w}" height="${h}" rx="${borderRadius}" fill="url(#${id}-b)" style="mix-blend-mode: ${mixBlendMode}"/>
      <rect x="${borde}" y="${borde}" width="${w - borde * 2}" height="${h - borde * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" filter="url(#${id}-s)"/></svg>`;
    feImage.setAttribute('href', `data:image/svg+xml,${encodeURIComponent(s)}`);
  };
  new ResizeObserver(mapa).observe(el);
  mapa();
};
})();
