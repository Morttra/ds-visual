/* Felles hjelpefunksjoner: DOM, SVG-plott, kontroller, tall og tilfeldige data. */
const NS = 'http://www.w3.org/2000/svg';
let _uid = 0;
const uid = p => (p || 'id') + (++_uid);

function H(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    e.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return e;
}
function S(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null) continue;
    if (k === 'text') e.textContent = v; else e.setAttribute(k, v);
  }
  if (parent) parent.appendChild(e);
  return e;
}
const clear = el => { while (el.firstChild) el.removeChild(el.firstChild); return el; };

/* Tall */
function fx(v, d = 2) {
  if (v == null || !isFinite(v)) return '–';
  const s = (Math.abs(v) < 0.5 * Math.pow(10, -d) ? 0 : v).toFixed(d);
  return s.replace('-', '−');
}
const fint = v => (v == null || !isFinite(v)) ? '–' : Math.round(v).toLocaleString('nb-NO').replace('-', '−');
const fpct = (v, d = 1) => fx(100 * v, d) + ' %';
const sum = a => a.reduce((s, v) => s + v, 0);
const mean = a => sum(a) / a.length;
const sd = (a, ddof = 1) => { const m = mean(a); return Math.sqrt(sum(a.map(v => (v - m) ** 2)) / (a.length - ddof)); };
const sigmoid = z => 1 / (1 + Math.exp(-z));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const range = (n, f = i => i) => Array.from({ length: n }, (_, i) => f(i));
function softmax(z, T = 1) { const m = Math.max(...z.map(v => v / T)); const e = z.map(v => Math.exp(v / T - m)); const s = sum(e); return e.map(v => v / s); }
function quantile(sorted, q) { const p = (sorted.length - 1) * q, i = Math.floor(p), f = p - i; return sorted[i] + (sorted[Math.min(i + 1, sorted.length - 1)] - sorted[i]) * f; }
const dist2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/* Seedet tilfeldighet (mulberry32) slik at figurene er like hver gang */
function RNG(seed) {
  let a = seed >>> 0;
  const r = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  r.n = () => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
  r.int = n => Math.floor(r() * n);
  r.pick = arr => arr[Math.floor(r() * arr.length)];
  r.shuffle = arr => { const a2 = arr.slice(); for (let i = a2.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a2[i], a2[j]] = [a2[j], a2[i]]; } return a2; };
  return r;
}
function blobs(rng, centers, n, s) { const out = []; centers.forEach((c, k) => { for (let i = 0; i < n; i++) out.push([c[0] + s * rng.n(), c[1] + s * rng.n(), k]); }); return out; }
function moons(rng, n, noise) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const k = i % 2, t = Math.PI * rng();
    const x = k ? 1 - Math.cos(t) : Math.cos(t), y = k ? 0.5 - Math.sin(t) : Math.sin(t);
    out.push([x + noise * rng.n(), y + noise * rng.n(), k]);
  }
  return out;
}

/* Skalaer og akser */
function lin(d0, d1, r0, r1) { const f = v => r0 + (v - d0) / (d1 - d0) * (r1 - r0); f.inv = p => d0 + (p - r0) / (r1 - r0) * (d1 - d0); f.d = [d0, d1]; return f; }
function niceTicks(a, b, n = 5) {
  const span = b - a; if (!(span > 0)) return [a];
  const s0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(s0))), err = s0 / mag;
  const step = (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1) * mag;
  const t = []; for (let v = Math.ceil(a / step - 1e-9) * step; v <= b + 1e-9 * step; v += step) t.push(+v.toFixed(10));
  return t;
}
const tickFmt = v => Math.abs(v) >= 10000 ? fint(v) : (Number.isInteger(+v.toFixed(6)) ? String(Math.round(v)).replace('-', '−') : String(+v.toFixed(3)).replace('-', '−'));

class Plot {
  constructor(parent, o) {
    this.o = o = Object.assign({ w: 640, h: 380, m: { t: 14, r: 16, b: 48, l: 58 }, x: [0, 1], y: [0, 1], xlab: '', ylab: '', grid: true, xticks: null, yticks: null, xfmt: tickFmt, yfmt: tickFmt, nx: 6, ny: 5, label: '' }, o);
    o.m = Object.assign({ t: 14, r: 16, b: 48, l: 58 }, o.m);
    this.svg = S('svg', { viewBox: `0 0 ${o.w} ${o.h}`, class: 'plot', role: 'img', 'aria-label': o.label || o.ylab + ' mot ' + o.xlab }, parent);
    this.gGrid = S('g', { class: 'grid' }, this.svg);
    this.gBack = S('g', {}, this.svg);
    this.gAxis = S('g', { class: 'axis' }, this.svg);
    this.gData = S('g', {}, this.svg);
    this.gTop = S('g', {}, this.svg);
    this.setDomain(o.x, o.y);
  }
  setDomain(x, y) {
    const o = this.o; o.x = x || o.x; o.y = y || o.y;
    this.x = lin(o.x[0], o.x[1], o.m.l, o.w - o.m.r);
    this.y = lin(o.y[0], o.y[1], o.h - o.m.b, o.m.t);
    this.drawAxes();
  }
  drawAxes() {
    const o = this.o, X = this.x, Y = this.y; clear(this.gGrid); clear(this.gAxis);
    const xt = o.xticks || niceTicks(o.x[0], o.x[1], o.nx), yt = o.yticks || niceTicks(o.y[0], o.y[1], o.ny);
    const x0 = o.m.l, x1 = o.w - o.m.r, y0 = o.h - o.m.b, y1 = o.m.t;
    for (const t of xt) {
      if (t < Math.min(...o.x) - 1e-9 || t > Math.max(...o.x) + 1e-9) continue;
      if (o.grid) S('line', { x1: X(t), x2: X(t), y1: y0, y2: y1 }, this.gGrid);
      S('text', { x: X(t), y: y0 + 17, 'text-anchor': 'middle', text: o.xfmt(t) }, this.gAxis);
    }
    for (const t of yt) {
      if (t < Math.min(...o.y) - 1e-9 || t > Math.max(...o.y) + 1e-9) continue;
      if (o.grid) S('line', { x1: x0, x2: x1, y1: Y(t), y2: Y(t) }, this.gGrid);
      S('text', { x: x0 - 8, y: Y(t) + 4, 'text-anchor': 'end', text: o.yfmt(t) }, this.gAxis);
    }
    S('line', { x1: x0, x2: x1, y1: y0, y2: y0 }, this.gAxis);
    S('line', { x1: x0, x2: x0, y1: y0, y2: y1 }, this.gAxis);
    if (o.xlab) S('text', { x: (x0 + x1) / 2, y: o.h - 8, 'text-anchor': 'middle', class: 'lbl', text: o.xlab }, this.gAxis);
    if (o.ylab) S('text', { x: 0, y: 0, transform: `translate(15 ${(y0 + y1) / 2}) rotate(-90)`, 'text-anchor': 'middle', class: 'lbl', text: o.ylab }, this.gAxis);
  }
  layer(parent) { return S('g', {}, parent || this.gData); }
  pt(evt) {
    const p = this.svg.createSVGPoint(); p.x = evt.clientX; p.y = evt.clientY;
    const ctm = this.svg.getScreenCTM(); const q = ctm ? p.matrixTransform(ctm.inverse()) : { x: 0, y: 0 };
    return { px: q.x, py: q.y, x: this.x.inv(q.x), y: this.y.inv(q.y) };
  }
  inside(p) { const o = this.o; return p.px >= o.m.l && p.px <= o.w - o.m.r && p.py >= o.m.t && p.py <= o.h - o.m.b; }
  clip() { return [Math.min(...this.o.x), Math.max(...this.o.x), Math.min(...this.o.y), Math.max(...this.o.y)]; }
}
/* Gjør et SVG-element flyttbart; onmove får punktet i dataenheter */
function draggable(plot, el, onmove) {
  el.classList.add('drag');
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation(); el.setPointerCapture(e.pointerId);
    const mv = ev => onmove(plot.pt(ev));
    const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  });
}
/* Klikk eller dra i bakgrunnen flytter et punkt */
function clickMove(plot, onmove) {
  const svg = plot.svg; let on = false;
  svg.addEventListener('pointerdown', e => { const p = plot.pt(e); if (!plot.inside(p)) return; on = true; svg.setPointerCapture(e.pointerId); onmove(p); });
  svg.addEventListener('pointermove', e => { if (on) { const p = plot.pt(e); if (plot.inside(p)) onmove(p); } });
  const stop = () => { on = false; };
  svg.addEventListener('pointerup', stop); svg.addEventListener('pointercancel', stop);
}
function pathOf(pts) { return pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join(''); }

/* Kontroller */
function Controls(parent) { const c = H('div', { class: 'controls' }); parent.append(c); return c; }
function Slider(parent, o) {
  const id = uid('s'), fmt = o.fmt || (v => String(v));
  const inp = H('input', { type: 'range', id, min: o.min, max: o.max, step: o.step || 1, value: o.value });
  const out = H('output', { for: id }, fmt(+o.value));
  const wrap = H('div', { class: 'ctl' }, H('label', { for: id }, o.label), inp, out);
  inp.addEventListener('input', () => { out.textContent = fmt(+inp.value); o.oninput && o.oninput(+inp.value); });
  parent.append(wrap);
  return { el: wrap, input: inp, get value() { return +inp.value; }, set(v, fire = true) { inp.value = v; out.textContent = fmt(+inp.value); if (fire && o.oninput) o.oninput(+inp.value); }, setMax(m) { inp.max = m; } };
}
function Seg(parent, o) {
  const wrap = H('div', { class: 'ctl' }); if (o.label) wrap.append(H('span', { class: 'ctl-lab' }, o.label));
  const g = H('div', { class: 'seg', role: 'group', 'aria-label': o.label || 'Valg' });
  let cur = o.value;
  const btns = o.options.map(([v, t]) => { const b = H('button', { type: 'button', 'aria-pressed': String(v === cur) }, t); b._v = v; b.addEventListener('click', () => api.set(v)); return b; });
  g.append(...btns); wrap.append(g); parent.append(wrap);
  const api = { el: wrap, get value() { return cur; }, set(v, fire = true) { cur = v; btns.forEach(b => b.setAttribute('aria-pressed', String(b._v === v))); if (fire && o.onchange) o.onchange(v); } };
  return api;
}
function Select(parent, o) {
  const id = uid('sel'); const sel = H('select', { id }, o.options.map(([v, t]) => H('option', { value: v }, t)));
  sel.value = o.value; sel.addEventListener('change', () => o.onchange && o.onchange(sel.value));
  parent.append(H('div', { class: 'ctl' }, H('label', { for: id }, o.label), sel));
  return sel;
}
function Btn(parent, label, onclick, cls) { const b = H('button', { type: 'button', class: 'btn ' + (cls || '') }, label); b.addEventListener('click', onclick); parent.append(b); return b; }
function Tiles(parent, defs) {
  const g = H('div', { class: 'tiles' }); const map = {};
  for (const [k, l] of defs) { const v = H('div', { class: 'tile-v' }, '–'); g.append(H('div', { class: 'tile' }, H('div', { class: 'tile-l' }, l), v)); map[k] = v; }
  parent.append(g);
  return { el: g, set(k, val, cls) { map[k].textContent = val; map[k].className = 'tile-v' + (cls ? ' ' + cls : ''); } };
}
/* Liten forvirringsmatrise (rader = faktisk, kolonner = predikert), samme rekkefølge som classificationSummary */
function ConfMat(parent, names) {
  const n = names || ['0', '1'];
  const cell = (k) => H('div', { class: 'c', id: uid('cm') }, H('b', {}, '0'), H('span', {}, k));
  const c = { TN: cell('TN'), FP: cell('FP'), FN: cell('FN'), TP: cell('TP') };
  const g = H('div', { class: 'cm' }, H('div'), H('div', { class: 'h' }, 'pred. ' + n[0]), H('div', { class: 'h' }, 'pred. ' + n[1]),
    H('div', { class: 'r' }, 'faktisk ' + n[0]), c.TN, c.FP, H('div', { class: 'r' }, 'faktisk ' + n[1]), c.FN, c.TP);
  parent.append(H('div', { class: 'mini', style: 'margin-bottom:4px' }, 'Forvirringsmatrise'), g);
  return { set(v) { for (const k of ['TN', 'FP', 'FN', 'TP']) { c[k].firstChild.textContent = v[k]; c[k].className = 'c' + ((k === 'FP' || k === 'FN') && v[k] > 0 ? ' err' : ''); } } };
}
/* Opprydding når man bytter side (animasjoner o.l.) */
const CLEANUP = [];
const onLeave = f => CLEANUP.push(f);
/* Lineær algebra: løs Ax = b med Gauss-eliminasjon (delvis pivotering) */
function solveLin(A, b) {
  const n = b.length, M = A.map((row, i) => row.slice().concat([b[i]]));
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c] || 1e-12;
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / d; if (!f) continue; for (let j = c; j <= n; j++) M[r][j] -= f * M[c][j]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let j = r + 1; j < n; j++) s -= M[r][j] * x[j]; x[r] = s / (M[r][r] || 1e-12); }
  return x;
}
/* Minste kvadrater for designmatrise X (rader) og y, med valgfri ridge-straff lam (ikke på konstantleddet) */
function lstsq(X, y, lam = 0) {
  const p = X[0].length, A = range(p, () => new Array(p).fill(0)), b = new Array(p).fill(0);
  for (let i = 0; i < X.length; i++) { const r = X[i]; for (let a = 0; a < p; a++) { b[a] += r[a] * y[i]; for (let c = 0; c < p; c++) A[a][c] += r[a] * r[c]; } }
  for (let a = 1; a < p; a++) A[a][a] += lam;
  A[0][0] += lam * 1e-6;
  return solveLin(A, b);
}
function polyfit(xs, ys, deg, lam = 1e-9) { return lstsq(xs.map(x => range(deg + 1, j => Math.pow(x, j))), ys, lam); }
function polyval(b, x) { let s = 0, pw = 1; for (const c of b) { s += c * pw; pw *= x; } return s; }
function median(a) { const s = a.slice().sort((p, q) => p - q); return quantile(s, 0.5); }
function star(cx, cy, R, r) { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; pts.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1)); } return pts.join(' '); }
Plot.prototype.clipLayer = function () {
  const id = uid('clip'), o = this.o;
  const defs = this.svg.querySelector('defs') || S('defs', {}, this.svg);
  const cp = S('clipPath', { id }, defs);
  S('rect', { x: o.m.l, y: o.m.t, width: o.w - o.m.l - o.m.r, height: o.h - o.m.t - o.m.b }, cp);
  return S('g', { 'clip-path': `url(#${id})` }, this.gData);
};
/* Plasserer punktetiketter uten at de overlapper hverandre (grådig, fire kandidatposisjoner) */
function placeLabels(g, items, fs = 11.5) {
  const boxes = [], out = [];
  for (const it of items) {
    const w = it.text.length * fs * 0.56, h = fs + 2;
    const cands = [[8, -5, 'start'], [8, 13, 'start'], [-8, -5, 'end'], [-8, 13, 'end'], [0, -11, 'middle'], [0, 21, 'middle']];
    let pick = cands[0];
    for (const c of cands) {
      const x0 = c[2] === 'start' ? it.x + c[0] : c[2] === 'end' ? it.x + c[0] - w : it.x - w / 2, y0 = it.y + c[1] - fs;
      if (!boxes.some(b => x0 < b[0] + b[2] && x0 + w > b[0] && y0 < b[1] + b[3] && y0 + h > b[1])) { pick = c; boxes.push([x0, y0, w, h]); break; }
    }
    out.push(S('text', { x: it.x + pick[0], y: it.y + pick[1], 'text-anchor': pick[2], class: 'lbl halo', text: it.text, style: `font-size:${fs}px;font-weight:${it.bold ? 700 : 400}` }, g));
  }
  return out;
}
