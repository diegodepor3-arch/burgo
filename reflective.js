// ReflectiveCard sin React: placa de metal cepillado pintada en WebGL2 que se inclina con el puntero y brilla.
// Uso: ReflectiveCard(div.reflective-card, { tint, metalness, ... }). El contenido HTML va dentro de .reflective-card__content.
// ponytail: sin reflejo de vídeo ni webcam (videoSrc/webcam): la placa refleja el estudio de luces del shader.
(function () {
const VIEW_DISTANCE = 900, OVERSCAN = 1.2;
const VERTEX = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() { vUv = aPosition * 0.5 + 0.5; gl_Position = vec4(aPosition, 0.0, 1.0); }`;

const PLATE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uEnv;
uniform vec2 uEnvSize;
uniform vec2 uSize;
uniform float uRadius;
uniform float uScale;
uniform mat3 uRotate;
uniform float uCapture;
uniform float uBlur;
uniform float uRough;
uniform float uMetal;
uniform vec3 uTint;
uniform float uGray;
uniform float uWarp;
uniform float uWarpScale;
uniform float uShine;
uniform float uBevel;
uniform float uGlare;
uniform vec2 uPointer;
uniform float uTheme;
const float VIEW = ${VIEW_DISTANCE.toFixed(1)};
const float OVERSCAN = ${OVERSCAN.toFixed(2)};
const float CONTENT = 46.0;
float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash2(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.103, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0; }
vec3 gradientNoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  vec2 ga = hash2(i); vec2 gb = hash2(i + vec2(1.0, 0.0)); vec2 gc = hash2(i + vec2(0.0, 1.0)); vec2 gd = hash2(i + vec2(1.0, 1.0));
  float va = dot(ga, f); float vb = dot(gb, f - vec2(1.0, 0.0)); float vc = dot(gc, f - vec2(0.0, 1.0)); float vd = dot(gd, f - vec2(1.0, 1.0));
  float k = va - vb - vc + vd;
  float value = va + u.x * (vb - va) + u.y * (vc - va) + u.x * u.y * k;
  vec2 slope = ga + u.x * (gb - ga) + u.y * (gc - ga) + u.x * u.y * (ga - gb - gc + gd) + du * (u.yx * k + vec2(vb, vc) - va);
  return vec3(value, slope);
}
float valueNoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float erf(float x) { float x2 = x * x; return sign(x) * sqrt(1.0 - exp(-x2 * (1.2732395 + 0.147 * x2) / (1.0 + 0.147 * x2))); }
float band(float x, float halfWidth, float sigma) { float s = 1.4142136 * max(sigma, 0.0001); return 0.5 * (erf((x + halfWidth) / s) - erf((x - halfWidth) / s)); }
float strip(vec2 q, vec2 center, vec2 dir, float halfWidth, vec2 sigma) { vec2 normal = vec2(-dir.y, dir.x); return band(dot(q - center, normal), halfWidth, length(sigma * normal)); }
const vec2 SWEEP = vec2(0.5, 0.86);
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
float softbox(vec2 q, vec2 sigma) {
  float key = strip(q, vec2(-0.1, -0.16), normalize(SWEEP), 0.022, sigma + 0.018);
  float top = band(q.y + 0.6, 0.12, sigma.y + 0.05);
  float side = band(q.x - 0.46, 0.05, sigma.x + 0.05);
  return key + top * 0.8 + side * 0.35;
}
float room(vec2 q, vec2 sigma) {
  float fall = smoothstep(-0.55, 0.5, q.y);
  float flag = strip(q, vec2(0.24, -0.02), normalize(SWEEP), 0.09, sigma + 0.08);
  return mix(0.85, 0.12, fall) * (1.0 - 0.6 * flag);
}
vec3 toLinear(vec3 c) { return pow(max(c, 0.0), vec3(2.2)); }
void main() {
  vec2 p = vec2(vUv.x - 0.5, 0.5 - vUv.y) * uSize;
  vec2 halfSize = uSize * 0.5;
  float r = min(uRadius, min(halfSize.x, halfSize.y));
  vec2 corner = abs(p) - halfSize + r;
  vec2 side = vec2(p.x >= 0.0 ? 1.0 : -1.0, p.y >= 0.0 ? 1.0 : -1.0);
  float d; vec2 outward;
  if (corner.x > 0.0 && corner.y > 0.0) { d = length(corner) - r; outward = normalize(corner) * side; }
  else if (corner.x > corner.y) { d = corner.x - r; outward = vec2(side.x, 0.0); }
  else { d = corner.y - r; outward = vec2(0.0, side.y); }
  float coverage = clamp(0.5 - d * uScale, 0.0, 1.0);
  float chamferWidth = min(uBevel, max(r, 1.0));
  float chamfer = chamferWidth > 0.01 ? 1.0 - smoothstep(0.0, chamferWidth, -d) : 0.0;
  vec2 slope = outward * chamfer;
  vec2 wp = p / (220.0 * uWarpScale);
  vec3 w1 = gradientNoise(wp);
  vec3 w2 = gradientNoise(wp * 2.07 + 13.7);
  vec2 ripple = (w1.yz + w2.yz * 0.5) * uWarp;
  slope += ripple * 0.008;
  float grain = valueNoise(vec2(p.x * 0.008, p.y * 0.55)) * 0.45 + valueNoise(vec2(p.x * 0.019 + 3.7, p.y * 0.23)) * 0.35 + valueNoise(vec2(p.x * 0.004 + 9.2, p.y * 0.09)) * 0.2;
  float brush = uRough * uRough;
  slope.y += (grain - 0.5) * brush * 0.004;
  vec3 normal = uRotate * normalize(vec3(slope, 1.0));
  vec3 position = uRotate * vec3(p, 0.0);
  vec3 view = normalize(position - vec3(0.0, 0.0, VIEW));
  vec3 bounce = reflect(view, normal);
  vec2 q = bounce.xy / max(bounce.z, 0.2);
  vec2 footprint = fwidth(q);
  vec2 sigma = sqrt(vec2(uBlur / VIEW) * vec2(uBlur / VIEW) + footprint * footprint * 0.5);
  sigma += vec2(0.004, 0.05) * uRough;
  vec3 scene = vec3(room(q, sigma));
  scene *= 1.0 + (grain - 0.5) * brush * 0.3;
  vec2 toPointer = (uPointer - p) / (120.0 + uBlur * 4.0);
  vec2 spread = toPointer * vec2(1.0, 1.0 / (1.0 + 2.5 * uRough));
  float reach = dot(spread, spread);
  float glint = max(1.0 + 3.0 * dot(slope, toPointer), 0.0);
  float glare = (exp(-reach * 1.6) + exp(-reach * 0.35) * 0.15) * glint * uGlare * (1.0 + 0.8 * (grain - 0.5) * brush);
  float highlight = (softbox(q, sigma) * uShine + glare) * mix(0.4, 1.0, uMetal);
  vec3 dark = vec3(0.005, 0.005, 0.006) + uTint * (scene * 0.05 * uMetal + highlight * 0.36);
  vec3 light = uTint * (vec3(0.83, 0.83, 0.85) * (1.0 - 0.45 * uMetal * (1.0 - clamp(scene, 0.0, 1.0))) + highlight * 0.35);
  vec3 color = mix(dark, light, uTheme);
  color = min(color, 0.7) + 0.3 * (1.0 - exp(-max(color - 0.7, 0.0) / 0.3));
  color = pow(clamp(color, 0.0, 1.0), vec3(1.0 / 2.2));
  color += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  color = clamp(color, 0.0, 1.0);
  fragColor = vec4(color * coverage, coverage);
}`;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const parseColor = (value) => {
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(value).trim());
  if (!hex) return [1, 1, 1];
  const full = hex[1].length === 3 ? hex[1].replace(/./g, (d) => d + d) : hex[1];
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
};

function placa(canvas) {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
  const vs = sh(gl.VERTEX_SHADER, VERTEX), fs = sh(gl.FRAGMENT_SHADER, PLATE);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, 'aPosition');
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  const u = {};
  for (let i = 0; i < gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS); i++) { const info = gl.getActiveUniform(prog, i); u[info.name] = gl.getUniformLocation(prog, info.name); }
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const env = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, env);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  const rot = new Float32Array(9);
  return ({ width, height, rotateX, rotateY, glare, pointerX, pointerY, s }) => {
    const cx = Math.cos(rotateX), sx = Math.sin(rotateX), cy = Math.cos(rotateY), sy = Math.sin(rotateY);
    rot.set([cy, sx * sy, -cx * sy, 0, cx, sx, sy, -sx * cy, cx * cy]);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, env);
    gl.uniform1i(u.uEnv, 0); gl.uniform2f(u.uEnvSize, 1, 1);
    gl.uniform2f(u.uSize, width, height); gl.uniform1f(u.uRadius, s.radius);
    gl.uniform1f(u.uScale, canvas.width / Math.max(1, width)); gl.uniformMatrix3fv(u.uRotate, false, rot);
    gl.uniform1f(u.uCapture, 0); gl.uniform1f(u.uBlur, s.blurStrength); gl.uniform1f(u.uRough, s.roughness);
    gl.uniform1f(u.uMetal, s.metalness); gl.uniform3fv(u.uTint, s.tint); gl.uniform1f(u.uGray, s.grayscale);
    gl.uniform1f(u.uWarp, s.warp); gl.uniform1f(u.uWarpScale, s.warpScale); gl.uniform1f(u.uShine, s.shine);
    gl.uniform1f(u.uBevel, s.bevel); gl.uniform1f(u.uGlare, glare); gl.uniform2f(u.uPointer, pointerX, pointerY);
    gl.uniform1f(u.uTheme, s.theme);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}

window.ReflectiveCard = function ReflectiveCard(root, {
  theme = 'dark', tint = '#ffffff', metalness = 1, roughness = 0.3, blurStrength = 6, grayscale = 1, warp = 0.6, warpScale = 1,
  shine = 1, bevel = 3, glare = 0.5, enableTilt = true, tiltStrength = 12, intro = true, radius = 24,
} = {}) {
  if (root.dataset.rc) return;
  root.dataset.rc = '';
  const s = { tint: parseColor(tint).map((c) => c ** 2.2), metalness: clamp(metalness, 0, 1), roughness: clamp(roughness, 0, 1),
    blurStrength: clamp(blurStrength, 0, 40), grayscale: clamp(grayscale, 0, 1), warp: clamp(warp, 0, 2), warpScale: clamp(warpScale, 0.2, 4),
    shine: clamp(shine, 0, 3), bevel: clamp(bevel, 0, 16), glare: clamp(glare, 0, 1), radius: Math.max(0, radius), theme: theme === 'light' ? 1 : 0 };
  root.classList.add(`reflective-card--${theme === 'light' ? 'light' : 'dark'}`);
  root.style.setProperty('--rc-radius', `${s.radius}px`);
  const body = root.querySelector('.reflective-card__body');
  const canvas = body.querySelector('canvas') || body.insertAdjacentElement('afterbegin', Object.assign(document.createElement('canvas'), { className: 'reflective-card__canvas' }));
  canvas.setAttribute('aria-hidden', 'true');
  const pintar = placa(canvas);
  if (!pintar) root.classList.add('reflective-card--sin-webgl');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const x = { p: 0, v: 0, target: 0 }, y = { p: 0, v: 0, target: 0 }, light = { p: 0, target: 0 }, pointer = { x: 0, y: 0 };
  const size = { width: body.offsetWidth, height: body.offsetHeight };
  let presence = 1, presenceStart = 0, slowUntil = 0, touchId = null, raf = 0, last = 0, visible = true;

  const write = () => {
    const angle = enableTilt && !reduced ? tiltStrength : 0, eased = 1 - (1 - presence) ** 3;
    root.style.setProperty('--rc-rotate-x', `${(y.p * angle).toFixed(3)}deg`);
    root.style.setProperty('--rc-rotate-y', `${(-x.p * angle).toFixed(3)}deg`);
    root.style.setProperty('--rc-presence', eased.toFixed(4));
    root.style.setProperty('--rc-lift', `${((1 - eased) * 14).toFixed(2)}px`);
  };
  const resize = () => {
    size.width = body.offsetWidth; size.height = body.offsetHeight;
    const k = Math.min(devicePixelRatio || 1, 2), w = Math.max(1, Math.round(size.width * k)), h = Math.max(1, Math.round(size.height * k));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  };
  const frame = (now) => {
    raf = 0;
    if (!root.isConnected) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    const slow = now < slowUntil, stiffness = slow ? 24 : 120, damping = slow ? 9 : 16;
    const steps = Math.max(1, Math.ceil(dt * 120)), h = dt / steps;
    for (let i = 0; i < steps; i++) for (const a of [x, y]) { a.v += (stiffness * (a.target - a.p) - damping * a.v) * h; a.p += a.v * h; }
    light.p += (light.target - light.p) * (1 - Math.exp(-dt / (light.target > light.p ? 0.18 : slow ? 0.9 : 0.45)));
    if (presence < 1) presence = clamp((now - presenceStart) / 650, 0, 1);
    const moving = Math.abs(x.target - x.p) > 0.0005 || Math.abs(y.target - y.p) > 0.0005 || Math.abs(x.v) > 0.0005 || Math.abs(y.v) > 0.0005
      || Math.abs(light.target - light.p) > 0.002 || presence < 1;
    if (!moving) { x.p = x.target; y.p = y.target; x.v = y.v = 0; light.p = light.target; }
    write();
    const angle = (enableTilt && !reduced ? tiltStrength : 0) * (Math.PI / 180);
    pintar?.({ width: size.width, height: size.height, rotateX: y.p * angle, rotateY: -x.p * angle, glare: s.glare * light.p, pointerX: pointer.x, pointerY: pointer.y, s });
    if (moving && visible) raf = requestAnimationFrame(frame);
  };
  const wake = () => { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const aim = (nx, ny, on = true) => { x.target = clamp(nx, -1, 1); y.target = clamp(ny, -1, 1); light.target = on ? 1 : 0; slowUntil = 0; wake(); };
  const aimAt = (e) => {
    const r = root.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    pointer.x = nx * size.width * 0.5; pointer.y = ny * size.height * 0.5;
    aim(nx, ny);
  };
  const release = () => aim(0, 0, false);
  root.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') aimAt(e); });
  root.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.pointerId === touchId) aimAt(e); });
  root.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') release(); });
  root.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { touchId = e.pointerId; aimAt(e); } });
  const up = (e) => { if (e.pointerId === touchId) { touchId = null; release(); } };
  root.addEventListener('pointerup', up);
  root.addEventListener('pointercancel', up);
  new ResizeObserver(() => { resize(); last = 0; frame(performance.now()); }).observe(body);
  // la entrada empieza cuando la tarjeta aparece en pantalla
  let primera = intro && !reduced;
  if (primera) { root.style.setProperty('--rc-presence', '0'); root.style.setProperty('--rc-lift', '14px'); }
  new IntersectionObserver((es) => {
    visible = es.some((e) => e.isIntersecting);
    if (visible && primera) {
      primera = false;
      x.p = 0.62; y.p = -0.55; light.p = 1;
      pointer.x = 0.62 * size.width * 0.5; pointer.y = -0.55 * size.height * 0.5;
      presence = 0; presenceStart = performance.now(); slowUntil = presenceStart + 1400;
    }
    wake();
  }).observe(root);
  resize();
  write();
  wake();
};
})();
