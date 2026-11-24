/* Beslutningstrær og ensembler. Inneholder en liten CART-implementasjon (to forklaringsvariabler). */

function impurity(c1, n, crit) {
  if (!n) return 0; const p = c1 / n;
  if (crit === 'entropy') return p <= 0 || p >= 1 ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
  return 1 - p * p - (1 - p) * (1 - p);
}
/* Bygger et klassifikasjonstre. X: [[x0, x1], ...], y: 0/1, w: valgfrie vekter. feats(): hvilke variabler som kan splittes på i en node. */
function cartBuild(X, y, o) {
  o = Object.assign({ maxDepth: 12, minSplit: 2, crit: 'gini', bounds: [0, 1, 0, 1], ids: null, feats: () => [0, 1] }, o);
  function node(ids, depth, b) {
    const n = ids.length, c1 = ids.reduce((s, i) => s + y[i], 0);
    const nd = { n, c1, depth, b, imp: impurity(c1, n, o.crit), leaf: true, cls: c1 * 2 > n ? 1 : 0 };
    if (depth >= o.maxDepth || n < o.minSplit || c1 === 0 || c1 === n) return nd;
    let best = null;
    for (const f of o.feats()) {
      const s = ids.slice().sort((a, c) => X[a][f] - X[c][f]); let l1 = 0;
      for (let k = 0; k < n - 1; k++) {
        l1 += y[s[k]]; const v1 = X[s[k]][f], v2 = X[s[k + 1]][f]; if (v1 === v2) continue;
        const nl = k + 1, nr = n - nl, wImp = (nl * impurity(l1, nl, o.crit) + nr * impurity(c1 - l1, nr, o.crit)) / n;
        if (!best || wImp < best.w - 1e-12) best = { w: wImp, f, t: (v1 + v2) / 2 };
      }
    }
    if (!best || best.w >= nd.imp - 1e-12) return nd;
    Object.assign(nd, { leaf: false, f: best.f, t: best.t });
    const bl = b.slice(), br = b.slice(); if (best.f === 0) { bl[1] = best.t; br[0] = best.t; } else { bl[3] = best.t; br[2] = best.t; }
    nd.L = node(ids.filter(i => X[i][best.f] <= best.t), depth + 1, bl);
    nd.R = node(ids.filter(i => X[i][best.f] > best.t), depth + 1, br);
    return nd;
  }
  return node(o.ids || range(X.length), 0, o.bounds);
}
function cartLeaf(nd, p, d = Infinity) { while (!nd.leaf && nd.depth < d) nd = p[nd.f] <= nd.t ? nd.L : nd.R; return nd; }
function cartLeaves(nd, d = Infinity) { return (nd.leaf || nd.depth >= d) ? [nd] : cartLeaves(nd.L, d).concat(cartLeaves(nd.R, d)); }
function regionGrid(g, plot, f, nx, ny, x0, x1, y0, y1) {
  const dx = (x1 - x0) / nx, dy = (y1 - y0) / ny, X = plot.x, Y = plot.y, w = X(x0 + dx) - X(x0), h = Y(y0) - Y(y0 + dy);
  g.setAttribute('shape-rendering', 'crispEdges');
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const v = f(x0 + (i + 0.5) * dx, y0 + (j + 0.5) * dy);
    S('rect', { x: X(x0 + i * dx), y: Y(y0 + (j + 1) * dy), width: w, height: h, class: v > 0.5 ? 'f-c1' : 'f-c0', 'fill-opacity': 0.06 + 0.16 * Math.abs(v - 0.5) * 2 }, g);
  }
}
/* Tegner et tre som noder og kanter. path: noder som skal fremheves. */
function drawTree(wrap, root, d, names, path, fmtT) {
  const leaves = cartLeaves(root, d), lw = 118, lh = 74, W = Math.max(560, leaves.length * lw + 20), depthMax = Math.max(...leaves.map(l => l.depth));
  const Hh = (depthMax + 1) * lh + 10, pos = new Map();
  leaves.forEach((l, i) => pos.set(l, [10 + lw * (i + 0.5), 0]));
  (function place(nd) { if (pos.has(nd)) { pos.get(nd)[1] = 8 + nd.depth * lh; return pos.get(nd); } const a = place(nd.L), b = place(nd.R); const p = [(a[0] + b[0]) / 2, 8 + nd.depth * lh]; pos.set(nd, p); return p; })(root);
  const svg = S('svg', { viewBox: `0 0 ${W} ${Hh}`, width: W, class: 'plot', style: 'max-width:none;margin:0 auto;width:' + W + 'px', role: 'img', 'aria-label': 'Beslutningstreet' });
  const on = new Set(path || []);
  for (const [nd, p] of pos) if (!(nd.leaf || nd.depth >= d)) for (const [ch, lab] of [[nd.L, 'ja'], [nd.R, 'nei']]) {
    const q = pos.get(ch); S('line', { x1: p[0], y1: p[1] + 40, x2: q[0], y2: q[1], class: on.has(ch) ? 's-acc' : 's-mut', 'stroke-width': on.has(ch) ? 3 : 1.3 }, svg);
    S('text', { x: (p[0] + q[0]) / 2 + (lab === 'ja' ? -8 : 8), y: (p[1] + 40 + q[1]) / 2 + 3, 'text-anchor': lab === 'ja' ? 'end' : 'start', text: lab, style: 'font-size:11px' }, svg);
  }
  for (const [nd, p] of pos) {
    const isLeaf = nd.leaf || nd.depth >= d, cls = nd.c1 * 2 > nd.n ? 1 : 0;
    S('rect', { x: p[0] - 54, y: p[1], width: 108, height: 40, rx: 7, class: isLeaf ? (cls ? 'f-c1' : 'f-c0') : 'f-surf', 'fill-opacity': isLeaf ? 0.22 : 1, stroke: 'currentColor', 'stroke-width': on.has(nd) ? 3 : 1.2, style: 'color:' + (on.has(nd) ? 'var(--accent)' : 'var(--muted)') }, svg);
    S('text', { x: p[0], y: p[1] + 16, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:12px;font-weight:600', text: isLeaf ? (cls ? names.c1 : names.c0) : `${names.f[nd.f]} ≤ ${fmtT(nd.t)}` }, svg);
    S('text', { x: p[0], y: p[1] + 32, 'text-anchor': 'middle', style: 'font-size:11px', text: `n = ${nd.n}  [${nd.n - nd.c1}, ${nd.c1}]` }, svg);
  }
  clear(wrap).append(svg);
}
function fit01(pts) { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), a = Math.min(...xs), b = Math.max(...xs), c = Math.min(...ys), d = Math.max(...ys); return pts.map(p => [0.03 + 0.94 * (p[0] - a) / (b - a), 0.03 + 0.94 * (p[1] - c) / (d - c), p[2]]); }
function synth2D(seed, n, flip) {
  const r = RNG(seed); return range(n, () => { const x = r(), y = r(); let c = y > 0.5 + 0.22 * Math.sin(2 * Math.PI * x) ? 1 : 0; if (r() < flip) c = 1 - c; return [x, y, c]; });
}

topic({
  id: 'beslutningstraer', data: [['mowers']], short: 'Beslutningstrær', lecture: 'F7', tags: ['Klassifikasjon', 'Prediksjon', 'Gini og entropi'],
  title: 'Beslutningstrær',
  path: ['Veiledet læring', 'Klassifikasjon og prediksjon'],
  lead: 'Et beslutningstre deler dataene i rektangler med enkle ja/nei-regler, én variabel om gangen. Hver splitt velges slik at gruppene blir så rene som mulig. Resultatet er regler som er lette å lese.',
  figs: [{
    title: 'Finn den beste første splitten',
    sub: 'Sitteklipperdataene: 24 husholdninger, 12 eiere og 12 ikke-eiere. Velg variabel og flytt splitten. Rent betyr at en gruppe bare har én klasse.',
    build(el) {
      const R = DATA.mowers, X = R.map(r => [r[0], r[1]]), y = R.map(r => r[2]);
      const nm = ['Income', 'Lot_Size'], dom = [[25, 120], [13, 25]];
      let f = 0, t = 59.7;
      const cand = f2 => { const v = [...new Set(X.map(p => p[f2]))].sort((a, b) => a - b); return v.slice(1).map((u, i) => +((u + v[i]) / 2).toFixed(2)); };
      const stats = (f2, t2) => { const L = y.filter((_, i) => X[i][f2] <= t2), Rr = y.filter((_, i) => X[i][f2] > t2); const l1 = sum(L), r1 = sum(Rr);
        const g = (c, n) => impurity(c, n, 'gini'), e = (c, n) => impurity(c, n, 'entropy');
        return { nl: L.length, l1, nr: Rr.length, r1, gl: g(l1, L.length), gr: g(r1, Rr.length), el: e(l1, L.length), er: e(r1, Rr.length), gw: (L.length * g(l1, L.length) + Rr.length * g(r1, Rr.length)) / 24, ew: (L.length * e(l1, L.length) + Rr.length * e(r1, Rr.length)) / 24 }; };
      const ctl = Controls(el);
      const sv = Seg(ctl, { label: 'Variabel', options: [[0, 'Income'], [1, 'Lot_Size']], value: f, onchange: v => { f = v; st.input.min = dom[f][0]; st.input.max = dom[f][1]; st.set(f ? 19 : 59.7, false); t = f ? 19 : 59.7; draw(); } });
      const st = Slider(ctl, { label: 'Splitt ved', min: 25, max: 120, step: 0.1, value: t, fmt: v => fx(v, 1), oninput: v => { t = v; draw(); } });
      Btn(ctl, 'Finn beste splitt (Gini)', () => { let best = null; for (const f2 of [0, 1]) for (const c of cand(f2)) { const s = stats(f2, c); if (!best || s.gw < best[0] - 1e-12) best = [s.gw, f2, c]; } sv.set(best[1], false); f = best[1]; st.input.min = dom[f][0]; st.input.max = dom[f][1]; st.set(best[2], false); t = best[2]; draw(); }, 'primary');
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const plot = new Plot(a, { w: 540, h: 400, x: dom[0], y: dom[1], xlab: 'Income (1000 $)', ylab: 'Lot_Size (1000 ft²)', label: 'Sitteklipperdataene med splittlinje' });
      const gS = plot.layer(), gP = plot.layer();
      R.forEach(r => S('circle', { cx: plot.x(r[0]), cy: plot.y(r[1]), r: 6, class: (r[2] ? 'f-c1' : 'f-c0') + ' s-surf', 'stroke-width': 1.5 }, gP));
      const tw = H('div', { class: 'tblwrap' }); b.append(tw);
      const p2 = new Plot(b, { w: 360, h: 190, m: { t: 10, r: 10, b: 40, l: 50 }, x: dom[0], y: [0.3, 0.5], ylab: 'Vektet Gini', xlab: 'Splittverdi', label: 'Vektet Gini mot splittverdi' });
      const gC = p2.layer(), mk = S('circle', { r: 6, class: 'f-hl s-ink' }, p2.gTop);
      function draw() {
        const s = stats(f, t), X0 = plot.x, Y0 = plot.y; clear(gS);
        const sideL = s.l1 * 2 > s.nl ? 'f-c1' : 'f-c0', sideR = s.r1 * 2 > s.nr ? 'f-c1' : 'f-c0';
        if (f === 0) { S('rect', { x: X0(25), y: Y0(25), width: X0(t) - X0(25), height: Y0(13) - Y0(25), class: sideL, 'fill-opacity': 0.12 }, gS); S('rect', { x: X0(t), y: Y0(25), width: X0(120) - X0(t), height: Y0(13) - Y0(25), class: sideR, 'fill-opacity': 0.12 }, gS); S('line', { x1: X0(t), x2: X0(t), y1: Y0(13), y2: Y0(25), class: 's-ink', 'stroke-width': 2.5 }, gS); }
        else { S('rect', { x: X0(25), y: Y0(t), width: X0(120) - X0(25), height: Y0(13) - Y0(t), class: sideL, 'fill-opacity': 0.12 }, gS); S('rect', { x: X0(25), y: Y0(25), width: X0(120) - X0(25), height: Y0(t) - Y0(25), class: sideR, 'fill-opacity': 0.12 }, gS); S('line', { x1: X0(25), x2: X0(120), y1: Y0(t), y2: Y0(t), class: 's-ink', 'stroke-width': 2.5 }, gS); }
        const row = (lab, n, c1, g, e) => H('tr', {}, H('td', { class: 'l' }, lab), H('td', {}, n), H('td', {}, n - c1), H('td', {}, c1), H('td', {}, fx(g, 3)), H('td', {}, fx(e, 3)));
        clear(tw).append(H('table', { class: 'tbl' }, H('tr', {}, H('th', { class: 'l' }, 'Gruppe'), H('th', {}, 'n'), H('th', {}, 'ikke-eier'), H('th', {}, 'eier'), H('th', {}, 'Gini'), H('th', {}, 'Entropi')),
          row('Før splitt', 24, 12, 0.5, 1), row(`${nm[f]} ≤ ${fx(t, 1)}`, s.nl, s.l1, s.gl, s.el), row(`${nm[f]} > ${fx(t, 1)}`, s.nr, s.r1, s.gr, s.er),
          H('tr', { class: 'on' }, H('td', { class: 'l' }, H('b', {}, 'Vektet etter splitt')), H('td', {}, ''), H('td', {}, ''), H('td', {}, ''), H('td', {}, H('b', {}, fx(s.gw, 3))), H('td', {}, H('b', {}, fx(s.ew, 3))))));
        p2.setDomain(dom[f], [0.3, 0.5]); clear(gC);
        const cs = cand(f).filter(c => c > dom[f][0] && c < dom[f][1]);
        S('path', { d: pathOf(cs.map(c => [p2.x(c), p2.y(Math.min(0.5, stats(f, c).gw))])), fill: 'none', class: 's-acc', 'stroke-width': 2 }, gC);
        cs.forEach(c => S('circle', { cx: p2.x(c), cy: p2.y(Math.min(0.5, stats(f, c).gw)), r: 2.5, class: 'f-acc' }, gC));
        mk.setAttribute('cx', p2.x(clamp(t, dom[f][0], dom[f][1]))); mk.setAttribute('cy', p2.y(Math.min(0.5, s.gw)));
      }
      draw();
    },
    tryit: ['Startverdien Income ≤ 59,7 er den første splitten et tre velger på disse dataene (den samme som i F7). Sjekk tallene: Gini 0,219 til venstre, 0,430 til høyre og 0,359 vektet.',
      'Trykk «Finn beste splitt». Income ≤ 59,7 og Income ≤ 78,0 gir nøyaktig samme vektede Gini. Algoritmen velger den første den finner.',
      'Vektet Gini er et snitt der hver gruppe teller etter antall punkter: (8 · 0,219 + 16 · 0,430) / 24.']
  }, {
    title: 'La treet vokse, og klassifiser et nytt punkt',
    sub: 'Rekursiv partisjonering: hver gruppe splittes videre med beste Gini-splitt. Klikk i plottet for å plassere en ny husholdning og følge veien ned i treet.',
    build(el) {
      const R = DATA.mowers, X = R.map(r => [r[0], r[1]]), y = R.map(r => r[2]);
      const root = cartBuild(X, y, { bounds: [25, 120, 13, 25] });
      let d = 2, q = [74, 19.2];
      const ctl = Controls(el);
      Slider(ctl, { label: 'Maks dybde', min: 0, max: 5, value: d, oninput: v => { d = v; draw(); } });
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const plot = new Plot(a, { w: 540, h: 400, x: [25, 120], y: [13, 25], xlab: 'Income (1000 $)', ylab: 'Lot_Size (1000 ft²)', label: 'Rektangler fra treet' });
      const gR = plot.layer(), gP = plot.layer(), gQ = plot.layer();
      R.forEach(r => S('circle', { cx: plot.x(r[0]), cy: plot.y(r[1]), r: 6, class: (r[2] ? 'f-c1' : 'f-c0') + ' s-surf', 'stroke-width': 1.5 }, gP));
      const qS = S('polygon', { class: 'f-hl s-ink' }, gQ);
      const tiles = Tiles(b, [['lv', 'Antall blader'], ['acc', 'Treffsikkerhet på treningsdata'], ['res', 'Ny husholdning']]);
      const tw = H('div', { style: 'overflow-x:auto;margin-top:10px' }); el.append(tw);
      clickMove(plot, p => { q = [clamp(p.x, 26, 119), clamp(p.y, 13.2, 24.8)]; draw(); });
      function draw() {
        clear(gR); const X0 = plot.x, Y0 = plot.y, leaves = cartLeaves(root, d);
        leaves.forEach(l => { const pur = Math.abs(l.c1 / l.n - 0.5) * 2; S('rect', { x: X0(l.b[0]), y: Y0(l.b[3]), width: X0(l.b[1]) - X0(l.b[0]), height: Y0(l.b[2]) - Y0(l.b[3]), class: (l.c1 * 2 > l.n ? 'f-c1' : 'f-c0') + ' s-ink', 'fill-opacity': 0.08 + 0.2 * pur, 'stroke-width': 1, 'stroke-opacity': 0.5 }, gR); });
        const path = []; let nd = root; while (true) { path.push(nd); if (nd.leaf || nd.depth >= d) break; nd = q[nd.f] <= nd.t ? nd.L : nd.R; }
        const lf = path[path.length - 1];
        S('rect', { x: X0(lf.b[0]), y: Y0(lf.b[3]), width: X0(lf.b[1]) - X0(lf.b[0]), height: Y0(lf.b[2]) - Y0(lf.b[3]), fill: 'none', class: 's-acc', 'stroke-width': 3 }, gR);
        qS.setAttribute('points', star(X0(q[0]), Y0(q[1]), 11, 5));
        tiles.set('lv', String(leaves.length));
        tiles.set('acc', fpct(X.filter((p, i) => (cartLeaf(root, p, d).c1 * 2 > cartLeaf(root, p, d).n ? 1 : 0) === y[i]).length / 24, 1));
        tiles.set('res', (lf.c1 * 2 > lf.n ? 'eier' : 'ikke-eier') + ` (p = ${fx(lf.c1 / lf.n, 2)})`, lf.c1 * 2 > lf.n ? 'good' : '');
        drawTree(tw, root, d, { f: ['Income', 'Lot_Size'], c0: 'ikke-eier', c1: 'eier' }, path, v => fx(v, 1));
      }
      draw();
    },
    tryit: ['Øk dybden én og én. Hver splitt deler et rektangel i to. Ved dybde 4 er alle blader rene, og treffsikkerheten på treningsdata er 100 %.',
      'Plasser stjerna og følg den uthevede veien ned i treet. Det er akkurat det du gjør når du klassifiserer en ny post for hånd.',
      'Tallene i boksene er [ikke-eier, eier]. Andelen eiere i bladet er propensiteten treet gir.']
  }, {
    title: 'Overtilpasning: hvor dypt bør treet være?',
    sub: '400 simulerte punkter der grensen er en bølge og 15 % av etikettene er tilfeldig snudd. Treet trenes på 240 punkter (fylte) og valideres på 160 (hule).',
    build(el) {
      const D = synth2D(21, 400, 0.15), tr = D.slice(0, 240), va = D.slice(240);
      const root = cartBuild(tr.map(p => [p[0], p[1]]), tr.map(p => p[2]), { maxDepth: 16 });
      const acc = (pts, d) => pts.filter(p => (cartLeaf(root, p, d).c1 * 2 > cartLeaf(root, p, d).n ? 1 : 0) === p[2]).length / pts.length;
      const curve = range(16, i => [i + 1, acc(tr, i + 1), acc(va, i + 1)]);
      let d = 3;
      const ctl = Controls(el);
      Slider(ctl, { label: 'Maks dybde', min: 1, max: 16, value: d, oninput: v => { d = v; draw(); } });
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const plot = new Plot(a, { w: 520, h: 420, x: [0, 1], y: [0, 1], xlab: 'x₁', ylab: 'x₂', label: 'Beslutningsområder for valgt dybde' });
      const gR = plot.layer(), gP = plot.layer();
      const p2 = new Plot(b, { w: 380, h: 260, x: [0, 17], y: [0.6, 1], xticks: [1, 4, 8, 12, 16], xlab: 'Maks dybde', ylab: 'Treffsikkerhet', label: 'Treffsikkerhet mot dybde' });
      for (const [k, cl] of [[1, 'c4'], [2, 'c0']]) { S('path', { d: pathOf(curve.map(c => [p2.x(c[0]), p2.y(c[k])])), fill: 'none', class: 's-' + cl, 'stroke-width': 2 }, p2.gData); curve.forEach(c => S('circle', { cx: p2.x(c[0]), cy: p2.y(c[k]), r: 2.5, class: 'f-' + cl }, p2.gData)); }
      const vl = S('line', { y1: p2.y(0.6), y2: p2.y(1), class: 's-ink', 'stroke-dasharray': '3 3' }, p2.gTop);
      const tiles = Tiles(b, [['tr', 'Trening'], ['va', 'Validering'], ['lv', 'Antall blader']]);
      b.append(H('p', { class: 'note', html: '<b style="color:var(--c4)">Trening</b> stiger mot 100 %. <b style="color:var(--c0)">Validering</b> topper seg og faller.' }));
      function draw() {
        clear(gR); clear(gP); const X0 = plot.x, Y0 = plot.y;
        cartLeaves(root, d).forEach(l => S('rect', { x: X0(l.b[0]), y: Y0(l.b[3]), width: X0(l.b[1]) - X0(l.b[0]), height: Y0(l.b[2]) - Y0(l.b[3]), class: l.c1 * 2 > l.n ? 'f-c1' : 'f-c0', 'fill-opacity': 0.22 }, gR));
        tr.forEach(p => S('circle', { cx: X0(p[0]), cy: Y0(p[1]), r: 3.6, class: p[2] ? 'f-c1' : 'f-c0' }, gP));
        va.forEach(p => S('circle', { cx: X0(p[0]), cy: Y0(p[1]), r: 3.6, fill: 'none', class: p[2] ? 's-c1' : 's-c0', 'stroke-width': 1.4 }, gP));
        vl.setAttribute('x1', p2.x(d)); vl.setAttribute('x2', p2.x(d));
        tiles.set('tr', fpct(curve[d - 1][1])); tiles.set('va', fpct(curve[d - 1][2]), curve[d - 1][2] === Math.max(...curve.map(c => c[2])) ? 'good' : ''); tiles.set('lv', String(cartLeaves(root, d).length));
      }
      draw();
    },
    tryit: ['Ved dybde 1–2 er treet for grovt til å følge bølgen.', 'Ved stor dybde lager treet små rektangler rundt enkeltpunkter som er snudd ved en tilfeldighet. Valideringen blir dårligere.', 'Maks dybde er en hyperparameter. Den velges ut fra valideringsdata, for eksempel med grid search.']
  }],
  body: `
<h2>Slik leser du et tre</h2>
<ul>
<li><b>Rotnoden</b> øverst inneholder alle treningsdataene. Hver <b>indre node</b> har en regel, for eksempel Income ≤ 59,7.</li>
<li>Er regelen sann, går du til venstre (ja). Ellers går du til høyre (nei).</li>
<li><b>Bladene</b> nederst gir klassen: flertallet av treningspunktene i bladet. Andelen i klasse 1 er propensiteten.</li>
<li>Hver vei fra rot til blad er en regel av typen <i>HVIS Income &gt; 59,7 OG Lot_Size &gt; 19,8 SÅ eier</i>.</li>
</ul>
<h2>Rekursiv partisjonering</h2>
<ol>
<li>Prøv alle mulige splitter: for hver variabel, alle midtpunkter mellom sorterte verdier.</li>
<li>Velg splitten som gir lavest vektet urenhet i de to nye gruppene.</li>
<li>Gjenta i hver gruppe til gruppene er rene eller en stoppregel slår inn.</li>
</ol>
<div class="formula">Gini = 1 − Σ <span class="v">p</span><sub><span class="v">k</span></sub>² &nbsp;&nbsp;&nbsp;&nbsp; Entropi = − Σ <span class="v">p</span><sub><span class="v">k</span></sub> log<sub>2</sub>(<span class="v">p</span><sub><span class="v">k</span></sub>)</div>
<p>Med to klasser er Gini høyst 0,5 og entropi høyst 1, begge når klassene er 50/50. Begge er 0 i en ren gruppe. Vektet urenhet etter en splitt er (<i>n</i><sub>V</sub> · urenhet<sub>V</sub> + <i>n</i><sub>H</sub> · urenhet<sub>H</sub>) / <i>n</i>.</p>
<h2>Regresjonstrær</h2>
<p>Når Y er et tall, predikerer et blad gjennomsnittet av Y i bladet. Urenheten måles med kvadrerte avvik fra gjennomsnittet (MSE), og splitten som reduserer den mest, velges. Prediksjonen blir en trappefunksjon.</p>
<h2>Overtilpasning og hyperparametre</h2>
<ul>
<li>Et fullt tre (alle blader rene) har 100 % treffsikkerhet på treningsdata, men lærer støy.</li>
<li>Begrens treet med <code>max_depth</code>, <code>min_samples_split</code>, <code>min_samples_leaf</code> eller <code>min_impurity_decrease</code>.</li>
<li><b>Grid search</b> prøver alle kombinasjoner i et rutenett av verdier. <b>Random search</b> prøver et tilfeldig utvalg av kombinasjoner og dekker store rom raskere.</li>
<li>Trær er <b>ustabile</b>: små endringer i dataene kan gi et helt annet tre. Det løser ensembler.</li>
</ul>
<div class="pros">
<div><h3>Styrker</h3><ul><li>Lette å forklare og bruke som regler</li><li>Trenger ikke skalering, og tåler uteliggere i X</li><li>Velger variabler automatisk og fanger interaksjoner</li></ul></div>
<div><h3>Svakheter</h3><ul><li>Ustabile og lett overtilpasset</li><li>Grenser bare parallelle med aksene</li><li>Ofte svakere enn ensembler på treffsikkerhet</li></ul></div>
</div>
<div class="pit"><b>Eksamensfelle: urenhet for hånd</b>Gruppe med 1 eier og 7 ikke-eiere: Gini = 1 − (1/8)² − (7/8)² = 0,219. Entropi = −(1/8 · log₂(1/8) + 7/8 · log₂(7/8)) = 0,544. Husk log med grunntall 2.</div>
<h2>Python</h2>
<pre><code># train_X, train_y: bankkundedataene (Universal Bank), Y = Personal Loan
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import GridSearchCV
from mlba import plotDecisionTree, classificationSummary

full_tree = DecisionTreeClassifier(random_state=1).fit(train_X, train_y)   # vokser til alle blader er rene

# hyperparametre å prøve: 4 · 3 · 3 = 36 kombinasjoner
param_grid = {'max_depth': [4, 6, 8, 10],
              'min_samples_split': [10, 20, 30],
              'min_impurity_decrease': [0, 0.0005, 0.001]}
# 5-fold CV for hver kombinasjon; n_jobs=-1 bruker alle prosessorkjernene
grid = GridSearchCV(DecisionTreeClassifier(random_state=1), param_grid, cv=5, n_jobs=-1)
grid.fit(train_X, train_y)
print(grid.best_score_, grid.best_params_)                   # beste CV-accuracy og innstillingene som ga den

# beste innstillinger, trent på nytt på hele treningssettet
best_tree = grid.best_estimator_
plotDecisionTree(best_tree, feature_names=list(train_X.columns))   # tegner treet
classificationSummary(y_true=valid_y, y_pred=best_tree.predict(valid_X))</code></pre>`
});

topic({
  id: 'ensembler', dataNote: 'Figurene bruker <b>simulerte data</b>: to halvmåneformede grupper med støy. Tallene i avsnittet «Resultater på bankkundedataene» lenger ned kommer fra <a href="#datasett-ub">Universal Bank-dataene</a>.', short: 'Ensembler', lecture: 'F7', tags: ['Klassifikasjon', 'Prediksjon', 'Random forest', 'Boosting'],
  title: 'Ensembler: bagging, random forest og boosting',
  path: ['Veiledet læring', 'Klassifikasjon og prediksjon'],
  lead: 'Ett tre er ustabilt. Mange trær som stemmer sammen, er stabile og treffer bedre. Bagging og random forest gjennomsnittet mange uavhengige trær. Boosting bygger trærne etter hverandre, og hvert nytt tre konsentrerer seg om feilene til de forrige.',
  figs: [{
    title: 'Bagging og random forest: mange trær stemmer',
    sub: 'Simulerte data. Hvert tre trenes på et bootstrap-utvalg (trukket med tilbakelegging) av 200 punkter. I random forest får hver splitt bare se én tilfeldig valgt variabel av de to.',
    build(el) {
      const all = fit01(moons(RNG(5), 600, 0.28)), tr = all.slice(0, 200), va = all.slice(200), Xt = tr.map(p => [p[0], p[1]]), yt = tr.map(p => p[2]);
      const forests = {};
      const build = kind => { const rr = RNG(kind === 'rf' ? 77 : 33); return range(60, () => { const ids = range(200, () => rr.int(200)); return cartBuild(Xt, yt, { ids, maxDepth: 12, feats: kind === 'rf' ? () => [rr.int(2)] : () => [0, 1] }); }); };
      const single = cartBuild(Xt, yt, { maxDepth: 12 });
      let kind = 'bag', B = 1;
      const vote = (T, b, p) => { let v = 0; for (let i = 0; i < b; i++) v += cartLeaf(T[i], p).cls; return v / b; };
      const curveOf = T => { const cum = va.map(() => 0); return range(60, i => { va.forEach((p, j) => { cum[j] += cartLeaf(T[i], p).cls; }); return va.filter((p, j) => (cum[j] / (i + 1) > 0.5 ? 1 : 0) === p[2]).length / va.length; }); };
      const ctl = Controls(el);
      Seg(ctl, { label: 'Metode', options: [['bag', 'Bagging'], ['rf', 'Random forest']], value: kind, onchange: v => { kind = v; draw(true); } });
      const sB = Slider(ctl, { label: 'Antall trær', min: 1, max: 60, value: B, oninput: v => { B = v; draw(); } });
      const small = H('div', { class: 'cols even', style: 'grid-template-columns:repeat(3,minmax(0,1fr))' }); el.append(small);
      const minis = range(3, i => { const w = H('div'); small.append(w); const p = new Plot(w, { w: 240, h: 190, m: { t: 18, r: 6, b: 8, l: 6 }, x: [0, 1], y: [0, 1], xticks: [], yticks: [], grid: false, label: 'Tre ' + (i + 1) }); S('text', { x: 8, y: 13, class: 'lbl', text: 'Tre ' + (i + 1) + ' alene', style: 'font-size:12px' }, p.gTop); return { p, g: p.layer() }; });
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const plot = new Plot(a, { w: 520, h: 420, m: { t: 28, r: 10, b: 10, l: 10 }, x: [0, 1], y: [0, 1], xticks: [], yticks: [], grid: false, label: 'Flertallsavstemning' });
      const title = S('text', { x: 12, y: 18, class: 'lbl', style: 'font-size:13px;font-weight:600' }, plot.gTop);
      const gR = plot.layer(), gP = plot.layer();
      const p2 = new Plot(b, { w: 380, h: 260, x: [0, 61], y: [0.84, 0.96], xticks: [1, 10, 20, 30, 40, 50, 60], xlab: 'Antall trær', ylab: 'Treffsikkerhet (validering)', label: 'Treffsikkerhet mot antall trær' });
      const gA = p2.layer(), mk2 = S('circle', { r: 6.5, class: 'f-hl s-ink' }, p2.gTop);
      const tiles = Tiles(b, [['e', 'Ensemble'], ['s', 'Ett fullt tre']]);
      b.append(H('p', { class: 'note', html: 'Stiplet linje: ett fullt tre trent på alle dataene.' }));
      let curve = null;
      function draw(full) {
        if (!forests[kind]) forests[kind] = build(kind);
        const T = forests[kind];
        if (full || !curve) {
          curve = curveOf(T); clear(gA);
          const s1 = va.filter(p => cartLeaf(single, p).cls === p[2]).length / va.length;
          S('line', { x1: p2.x(1), x2: p2.x(60), y1: p2.y(s1), y2: p2.y(s1), class: 's-mut', 'stroke-dasharray': '5 4' }, gA);
          S('path', { d: pathOf(curve.map((v, i) => [p2.x(i + 1), p2.y(clamp(v, 0.84, 0.96))])), fill: 'none', class: 's-acc', 'stroke-width': 2 }, gA);
          tiles.set('s', fpct(s1));
          minis.forEach((m, i) => { clear(m.g); regionGrid(m.g, m.p, (x, y) => cartLeaf(T[i], [x, y]).cls, 34, 26, 0, 1, 0, 1); tr.forEach(p => S('circle', { cx: m.p.x(p[0]), cy: m.p.y(p[1]), r: 1.8, class: p[2] ? 'f-c1' : 'f-c0' }, m.g)); });
        }
        clear(gR); clear(gP);
        regionGrid(gR, plot, (x, y) => vote(T, B, [x, y]), 56, 42, 0, 1, 0, 1);
        tr.forEach(p => S('circle', { cx: plot.x(p[0]), cy: plot.y(p[1]), r: 3.3, class: p[2] ? 'f-c1' : 'f-c0' }, gP));
        title.textContent = `Flertallet av ${B} ${B === 1 ? 'tre' : 'trær'}`;
        mk2.setAttribute('cx', p2.x(B)); mk2.setAttribute('cy', p2.y(clamp(curve[B - 1], 0.84, 0.96)));
        tiles.set('e', fpct(curve[B - 1]));
      }
      draw(true);
    },
    tryit: ['Se på de tre små trærne. Hvert av dem har kantete og ganske ulike grenser, fordi de har sett ulike bootstrap-utvalg.',
      'Dra antall trær fra 1 til 60. Flertallsgrensen blir jevnere, og treffsikkerheten stabiliserer seg over ett enkelt tre.',
      'Bytt til random forest. Trærne blir enda mer ulike hverandre, og det er nettopp det som gjør gjennomsnittet bedre.']
  }, {
    title: 'Boosting: neste tre retter opp feilene',
    sub: 'Simulerte data. AdaBoost med stubber (trær med én splitt) på 80 punkter. Punktstørrelsen viser vekten. Punkter som forrige modell bommet på, får større vekt og blir viktigere for neste stubbe.',
    build(el) {
      const P = fit01(moons(RNG(9), 80, 0.22)), ys = P.map(p => p[2] ? 1 : -1);
      const M = 40, stumps = [], W = []; let w = P.map(() => 1 / P.length);
      for (let m = 0; m < M; m++) {
        W.push(w.slice()); let best = null;
        for (const f of [0, 1]) { const s = range(P.length).sort((a, b) => P[a][f] - P[b][f]);
          for (let k = -1; k < P.length; k++) {
            const t = k < 0 ? -1 : k === P.length - 1 ? 2 : (P[s[k]][f] + P[s[k + 1]][f]) / 2;
            for (const pol of [1, -1]) { let e = 0; for (let i = 0; i < P.length; i++) { const h = (P[i][f] > t ? 1 : -1) * pol; if (h !== ys[i]) e += w[i]; } if (!best || e < best.e - 1e-12) best = { e, f, t, pol }; } } }
        const e = clamp(best.e, 1e-9, 1 - 1e-9), alpha = 0.5 * Math.log((1 - e) / e);
        stumps.push({ ...best, alpha });
        w = w.map((wi, i) => wi * Math.exp(-alpha * ys[i] * ((P[i][best.f] > best.t ? 1 : -1) * best.pol))); const sw = sum(w); w = w.map(v => v / sw);
      }
      const F = (p, m) => sum(stumps.slice(0, m).map(s => s.alpha * (p[s.f] > s.t ? 1 : -1) * s.pol));
      const errs = range(M, m => P.filter((p, i) => Math.sign(F(p, m + 1) || 1) !== ys[i]).length / P.length);
      let m = 1;
      const ctl = Controls(el);
      Slider(ctl, { label: 'Runde', min: 1, max: M, value: m, oninput: v => { m = v; draw(); } });
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const plot = new Plot(a, { w: 520, h: 420, m: { t: 10, r: 10, b: 10, l: 10 }, x: [0, 1], y: [0, 1], xticks: [], yticks: [], grid: false, label: 'Boosting runde for runde' });
      const gR = plot.layer(), gS = plot.layer(), gP = plot.layer();
      const p2 = new Plot(b, { w: 380, h: 240, x: [0, M + 1], y: [0, 0.4], xticks: [1, 10, 20, 30, 40], xlab: 'Runde', ylab: 'Feilrate (trening)', label: 'Feilrate mot runde' });
      S('path', { d: pathOf(errs.map((v, i) => [p2.x(i + 1), p2.y(Math.min(v, 0.4))])), fill: 'none', class: 's-acc', 'stroke-width': 2 }, p2.gData);
      const mk = S('circle', { r: 6.5, class: 'f-hl s-ink' }, p2.gTop);
      const tiles = Tiles(b, [['a', 'Vekt på stubben (α)'], ['e', 'Vektet feil for stubben'], ['t', 'Feilrate, samlet modell']]);
      b.append(H('p', { class: 'note', html: 'Den svarte streken er stubben fra runden du står på. Bakgrunnen er den vektede summen av alle stubbene til nå.' }));
      function draw() {
        clear(gR); clear(gS); clear(gP); const X0 = plot.x, Y0 = plot.y, s = stumps[m - 1], wm = W[m - 1], wmax = Math.max(...wm);
        regionGrid(gR, plot, (x, y) => sigmoid(2 * F([x, y], m)), 56, 42, 0, 1, 0, 1);
        if (s.f === 0) S('line', { x1: X0(s.t), x2: X0(s.t), y1: Y0(0), y2: Y0(1), class: 's-ink', 'stroke-width': 2.5 }, gS);
        else S('line', { x1: X0(0), x2: X0(1), y1: Y0(s.t), y2: Y0(s.t), class: 's-ink', 'stroke-width': 2.5 }, gS);
        P.forEach((p, i) => S('circle', { cx: X0(p[0]), cy: Y0(p[1]), r: 2 + 9 * Math.sqrt(wm[i] / wmax), class: (p[2] ? 'f-c1' : 'f-c0') + ' s-surf', 'stroke-width': 1, 'fill-opacity': 0.85 }, gP));
        mk.setAttribute('cx', p2.x(m)); mk.setAttribute('cy', p2.y(Math.min(errs[m - 1], 0.4)));
        tiles.set('a', fx(s.alpha, 3)); tiles.set('e', fx(s.e, 3)); tiles.set('t', fpct(errs[m - 1]));
      }
      draw();
    },
    tryit: ['Runde 1: alle punkter har lik vekt, og stubben er den beste enkle splitten.', 'Gå til runde 2–5. Punktene den forrige stubben bommet på, vokser. Den nye stubben prøver å få dem riktig.', 'Stubber med lav vektet feil får høy α og teller mer i den samlede avstemningen.']
  }],
  body: `
<h2>Hvorfor ensembler virker</h2>
<p>Hvis mange modeller gjør <i>ulike</i> feil, utligner feilene hverandre når vi tar gjennomsnittet eller lar dem stemme. Trær er ideelle byggeklosser: de er fleksible (lav bias), men ustabile (høy varians). Gjennomsnittet av mange trær beholder den lave biasen og kutter variansen.</p>
<h2>Bagging (bootstrap aggregating)</h2>
<ol>
<li>Trekk et bootstrap-utvalg: like mange rader som i treningsdataene, med tilbakelegging. Noen rader kommer med flere ganger, andre ikke i det hele tatt.</li>
<li>Tren et tre på utvalget.</li>
<li>Gjenta mange ganger.</li>
<li>Klassifikasjon: flertallsavstemning (eller snitt av propensitetene). Prediksjon: gjennomsnitt.</li>
</ol>
<h2>Random forest</h2>
<p>Som bagging, men i hver splitt får treet bare velge blant et tilfeldig utvalg av forklaringsvariablene (<code>max_features</code>). Da blir trærne mindre like, og gjennomsnittet blir bedre. Random forest gir også et mål på <b>variabelviktighet</b>: hvor mye hver variabel reduserer urenheten, summert over alle trærne.</p>
<h2>Boosting</h2>
<ol>
<li>Tilpass et tre.</li>
<li>Gi postene som ble feilklassifisert, høyere vekt (eller høyere sannsynlighet for å bli trukket i neste utvalg).</li>
<li>Tilpass et nytt tre til de vektede dataene.</li>
<li>Gjenta steg 2 og 3 mange ganger.</li>
<li>Kombiner trærne med vektet avstemning, der trær med lav feil teller mest.</li>
</ol>
<p><b>Gradient boosting</b> (<code>GradientBoostingClassifier</code>) bruker samme idé, men hvert nye tre tilpasses restfeilene til modellen så langt. Boosting reduserer først og fremst bias, og kan overtilpasse hvis det kjører for mange runder.</p>
<h2>Resultater på bankkundedataene</h2>
<p><a href="#datasett-ub">Universal Bank-dataene</a> har 5 000 bankkunder, og målet er å forutsi hvem som takker ja til et lånetilbud (9,6 % gjorde det). Med alle de 11 forklaringsvariablene og 60/40-oppdeling gir de tre modellene omtrent denne treffsikkerheten på valideringsdataene: beste enkelttre fra grid search 98,15 %, random forest med 500 trær 98,20 % og gradient boosting 98,35 %. Forskjellene er små her fordi ett tre allerede gjør det svært bra, men ensemblene er sjelden dårligere.</p>
<div class="pros">
<div><h3>Styrker</h3><ul><li>Blant de beste metodene på tabelldata</li><li>Robuste mot støy og uteliggere</li><li>Random forest er vanskelig å overtilpasse ved å legge til flere trær</li></ul></div>
<div><h3>Svakheter</h3><ul><li>Ingen enkle regler å lese, så de blir «svarte bokser» (se <a href="#shap">SHAP</a>)</li><li>Tregere å trene og bruke enn ett tre</li><li>Boosting har flere hyperparametre (læringsrate, antall runder)</li></ul></div>
</div>
<div class="pit"><b>Eksamensfelle: bagging og boosting</b>Bagging trener trærne uavhengig og parallelt, og reduserer varians. Boosting trener dem etter hverandre, der hvert tre avhenger av de forrige, og reduserer først og fremst bias.</div>
<h2>Python</h2>
<pre><code>from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

rf = RandomForestClassifier(n_estimators=500, random_state=1).fit(train_X, train_y)   # 500 trær
classificationSummary(y_true=valid_y, y_pred=rf.predict(valid_X))

# variabelviktighet: hvor mye hver variabel i snitt reduserer urenheten i trærne
importances = pd.DataFrame({'feature': train_X.columns, 'importance': rf.feature_importances_})
print(importances.sort_values('importance', ascending=False))   # viktigste først

boost = GradientBoostingClassifier().fit(train_X, train_y)   # standard: 100 små trær med dybde 3
classificationSummary(y_true=valid_y, y_pred=boost.predict(valid_X))</code></pre>`
});
