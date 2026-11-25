/* Nevrale nettverk: parametere, nevron, softmax, gradient descent, trening i nettleseren, konvolusjon */

function NumIn(parent, o) {
  const id = uid('n'), inp = H('input', { type: 'number', id, value: o.value, min: o.min, max: o.max, step: o.step || 1 });
  inp.addEventListener('input', () => { const v = +inp.value; if (isFinite(v)) o.oninput(v); });
  parent.append(H('div', { class: 'ctl' }, H('label', { for: id }, o.label), inp)); return inp;
}
/* Tegner kurven der f(x, y) = 0 med marching squares på et nx × ny-rutenett i [0,1]², som én sti */
function zeroContour(g, plot, f, nx, ny, cls) {
  const V = range(nx + 1, i => range(ny + 1, j => f(i / nx, j / ny)));
  const X = u => plot.x(u).toFixed(1), Y = u => plot.y(u).toFixed(1), seg = [];
  const cut = (xa, ya, va, xb, yb, vb) => { const t = va / (va - vb); return [xa + t * (xb - xa), ya + t * (yb - ya)]; };
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const x0 = i / nx, x1 = (i + 1) / nx, y0 = j / ny, y1 = (j + 1) / ny;
    const a = V[i][j], b = V[i + 1][j], c = V[i + 1][j + 1], d = V[i][j + 1];
    const E = {};
    if ((a > 0) !== (b > 0)) E.bot = cut(x0, y0, a, x1, y0, b);
    if ((b > 0) !== (c > 0)) E.rgt = cut(x1, y0, b, x1, y1, c);
    if ((d > 0) !== (c > 0)) E.top = cut(x0, y1, d, x1, y1, c);
    if ((a > 0) !== (d > 0)) E.lft = cut(x0, y0, a, x0, y1, d);
    const k = Object.keys(E);
    const pairs = k.length === 2 ? [[E[k[0]], E[k[1]]]]
      : k.length === 4 ? (((a + b + c + d) > 0) === (a > 0) ? [[E.bot, E.rgt], [E.top, E.lft]] : [[E.bot, E.lft], [E.top, E.rgt]]) : [];
    for (const [p, q] of pairs) seg.push(`M${X(p[0])} ${Y(p[1])}L${X(q[0])} ${Y(q[1])}`);
  }
  if (seg.length) S('path', { d: seg.join(''), fill: 'none', class: cls || 's-ink', 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
}
const ACT = {
  sigmoid: { f: z => sigmoid(z), name: 'sigmoid', tex: '1 / (1 + e^(−z))' },
  tanh: { f: z => Math.tanh(z), name: 'tanh', tex: 'tanh(z)' },
  relu: { f: z => Math.max(0, z), name: 'ReLU', tex: 'max(0, z)' },
  lin: { f: z => z, name: 'lineær', tex: 'z' }
};

topic({
  id: 'nevrale-nett', dataNote: 'Figurene bruker små, oppdiktede eksempler og <b>simulerte data</b> (to halvmåner), slik at alt kan regnes ut direkte i nettleseren.', short: 'Nevrale nettverk', lecture: 'F9', tags: ['Klassifikasjon', 'Prediksjon', 'Dyplæring', 'CNN'],
  title: 'Nevrale nettverk og CNN',
  path: ['Veiledet læring', 'Klassifikasjon og prediksjon'],
  lead: 'Et nevralt nettverk er lag av enkle regneenheter. Hvert nevron tar en vektet sum av inputene, legger til en bias og sender resultatet gjennom en aktiveringsfunksjon. Vektene læres ved å gå nedover i kostnadsfunksjonen med gradient descent, og backpropagation regner ut retningen.',
  figs: [{
    title: 'Tell parameterne',
    sub: 'Hvert fullt koblet lag har n<sub>inn</sub> · n<sub>ut</sub> vekter og n<sub>ut</sub> biaser. Bygg et nettverk og se regnestykket lag for lag.',
    build(el) {
      let nin = 4, L = 1, hs = [6, 4, 3], nout = 3;
      const ctl = Controls(el);
      Slider(ctl, { label: 'Input', min: 1, max: 12, value: nin, oninput: v => { nin = v; draw(); } });
      Slider(ctl, { label: 'Skjulte lag', min: 0, max: 3, value: L, oninput: v => { L = v; draw(); } });
      const hsS = [0, 1, 2].map(i => Slider(ctl, { label: 'Nevroner i lag ' + (i + 1), min: 1, max: 12, value: hs[i], oninput: v => { hs[i] = v; draw(); } }));
      Slider(ctl, { label: 'Output', min: 1, max: 10, value: nout, oninput: v => { nout = v; draw(); } });
      const svgW = H('div', { style: 'overflow-x:auto' }); el.append(svgW);
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const tw = H('div', { class: 'tblwrap' }), tb = H('div'); cols.append(tw, tb);
      const tiles = Tiles(tb, [['tot', 'Parametere totalt'], ['w', 'Vekter'], ['b', 'Biaser']]);
      tb.append(H('p', { class: 'note', html: 'Til sammenligning har VGG16 138 357 544 parametere.' }));
      function draw() {
        hsS.forEach((s, i) => { s.el.style.display = i < L ? '' : 'none'; });
        const layers = [nin, ...hs.slice(0, L), nout], W = 760, mxN = Math.min(12, Math.max(...layers)), Hh = mxN * 22 + 70, svg = S('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'plot', role: 'img', 'aria-label': 'Nettverkstegning' });
        const xs = layers.map((_, i) => 60 + i * (W - 120) / (layers.length - 1)), pos = layers.map((n, i) => { const m = Math.min(n, 12); return range(m, j => [xs[i], 30 + (Hh - 60) / 2 + (j - (m - 1) / 2) * 22]); });
        for (let i = 0; i < layers.length - 1; i++) for (const a of pos[i]) for (const b of pos[i + 1]) S('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 's-mut', 'stroke-opacity': 0.35 }, svg);
        pos.forEach((ps, i) => { ps.forEach(p => S('circle', { cx: p[0], cy: p[1], r: 8, class: i === 0 ? 'f-c4' : i === layers.length - 1 ? 'f-c1' : 'f-c2', stroke: 'currentColor', style: 'color:var(--surface)', 'stroke-width': 1.5 }, svg));
          S('text', { x: xs[i], y: 16, 'text-anchor': 'middle', class: 'lbl', text: i === 0 ? 'Input' : i === layers.length - 1 ? 'Output' : 'Skjult ' + i, style: 'font-size:12px;font-weight:600' }, svg);
          S('text', { x: xs[i], y: Hh - 6, 'text-anchor': 'middle', text: layers[i] + ' nevroner', style: 'font-size:11px' }, svg); });
        clear(svgW).append(svg);
        let tw0 = 0, tb0 = 0;
        const rows = range(layers.length - 1, i => { const a = layers[i], b = layers[i + 1]; tw0 += a * b; tb0 += b; return H('tr', {}, H('td', { class: 'l' }, (i === 0 ? 'Input' : 'Skjult ' + i) + ' → ' + (i === layers.length - 2 ? 'output' : 'skjult ' + (i + 1))), H('td', {}, `${a} · ${b} = ${a * b}`), H('td', {}, b), H('td', {}, H('b', {}, a * b + b))); });
        clear(tw).append(H('table', { class: 'tbl' }, H('tr', {}, H('th', { class: 'l' }, 'Lag'), H('th', {}, 'Vekter'), H('th', {}, 'Biaser'), H('th', {}, 'Sum')), rows));
        tiles.set('tot', fint(tw0 + tb0), 'hl'); tiles.set('w', fint(tw0)); tiles.set('b', fint(tb0));
      }
      draw();
    },
    tryit: ['Lag nettverket 3 → 4 → 2. Du skal få (3 · 4 + 4) + (4 · 2 + 2) = 26 parametere.', 'Dobbelt så mange nevroner i et skjult lag gir omtrent dobbelt så mange vekter inn og ut av laget.', 'Input-laget har ingen parametere. Det er bare dataene.']
  }, {
    title: 'Ett nevron, regnet ut',
    sub: 'Et nevron regner z = w₁x₁ + w₂x₂ + b og sender z gjennom en aktiveringsfunksjon. Med sigmoid er ett nevron det samme som logistisk regresjon.',
    build(el) {
      const st = { x1: 1, x2: -0.5, w1: 0.8, w2: 1.2, b: 0.1, act: 'sigmoid' };
      const ctl = Controls(el);
      for (const [k, lab] of [['x1', 'x₁'], ['x2', 'x₂'], ['w1', 'w₁'], ['w2', 'w₂'], ['b', 'b']]) Slider(ctl, { label: lab, min: -2, max: 2, step: 0.1, value: st[k], fmt: v => fx(v, 1), oninput: v => { st[k] = v; draw(); } });
      Seg(ctl, { label: 'Aktivering', options: Object.keys(ACT).map(k => [k, ACT[k].name]), value: st.act, onchange: v => { st.act = v; draw(); } });
      const cols = H('div', { class: 'cols even' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const dia = S('svg', { viewBox: '0 0 380 230', class: 'plot', role: 'img', 'aria-label': 'Nevronet med tall' }); a.append(dia);
      const out = H('div', { class: 'formula', style: 'font-size:.98rem' }); a.append(out);
      const plot = new Plot(b, { w: 380, h: 280, x: [-6, 6], y: [-1.5, 6], xlab: 'z', ylab: 'f(z)', label: 'Aktiveringsfunksjonen' });
      const gC = plot.clipLayer(), mk = S('circle', { r: 7, class: 'f-hl s-ink' }, plot.gTop);
      function draw() {
        const z = st.w1 * st.x1 + st.w2 * st.x2 + st.b, A = ACT[st.act], av = A.f(z);
        clear(dia);
        const inpt = [[40, 60, 'x₁ = ' + fx(st.x1, 1)], [40, 170, 'x₂ = ' + fx(st.x2, 1)]];
        inpt.forEach(([x, y, t], i) => { S('line', { x1: x + 40, y1: y, x2: 190, y2: 115, class: 's-ink', 'stroke-width': 1 + 2 * Math.abs(i ? st.w2 : st.w1) }, dia); S('text', { x: 135, y: i ? 160 : 78, 'text-anchor': 'middle', class: 'lbl', text: 'w' + (i ? '₂' : '₁') + ' = ' + fx(i ? st.w2 : st.w1, 1), style: 'font-size:12px' }, dia); S('rect', { x: x - 34, y: y - 15, width: 80, height: 30, rx: 6, class: 'f-soft' }, dia); S('text', { x: x + 6, y: y + 5, 'text-anchor': 'middle', class: 'lbl', text: t, style: 'font-size:12px' }, dia); });
        S('circle', { cx: 215, cy: 115, r: 30, class: 'f-c2', 'fill-opacity': 0.2, stroke: 'currentColor', style: 'color:var(--c2)', 'stroke-width': 2 }, dia);
        S('text', { x: 215, y: 112, 'text-anchor': 'middle', class: 'lbl', text: 'Σ, ' + A.name, style: 'font-size:11px' }, dia);
        S('text', { x: 215, y: 127, 'text-anchor': 'middle', text: '+ b = ' + fx(st.b, 1), style: 'font-size:11px' }, dia);
        S('line', { x1: 245, y1: 115, x2: 300, y2: 115, class: 's-ink', 'stroke-width': 2 }, dia);
        S('text', { x: 336, y: 120, 'text-anchor': 'middle', class: 'lbl', text: fx(av, 3), style: 'font-size:15px;font-weight:600' }, dia);
        const pn = v => v < 0 ? '(' + fx(v, 1) + ')' : fx(v, 1);
        out.innerHTML = `z = ${pn(st.w1)} · ${pn(st.x1)} + ${pn(st.w2)} · ${pn(st.x2)} + ${pn(st.b)} = <b>${fx(z, 2)}</b><br>a = ${A.tex.replace('−z', z < 0 ? fx(-z, 2) : '−' + fx(z, 2)).replace('(z)', '(' + fx(z, 2) + ')').replace(/^z$/, fx(z, 2)).replace(', z)', ', ' + fx(z, 2) + ')')} = <b>${fx(av, 3)}</b>`;
        clear(gC); S('path', { d: pathOf(range(241, i => -6 + i * 0.05).map(t => [plot.x(t), plot.y(A.f(t))])), fill: 'none', class: 's-c2', 'stroke-width': 2.5 }, gC);
        mk.setAttribute('cx', plot.x(clamp(z, -6, 6))); mk.setAttribute('cy', plot.y(clamp(av, -1.5, 6)));
      }
      draw();
    },
    tryit: ['Bytt mellom aktiveringene med de samme tallene. Sigmoid klemmer alt til (0, 1), tanh til (−1, 1), og ReLU setter negative z til 0.', 'Uten en ikke-lineær aktivering (lineær) blir et helt nettverk med mange lag bare én stor lineær regresjon.']
  }, {
    title: 'Softmax og cross-entropy',
    sub: 'Output-laget for tre klasser gir tre tall (logits). Softmax gjør dem om til sannsynligheter som summerer til 1. Cross-entropy er −ln(sannsynligheten for riktig klasse).',
    build(el) {
      const z = [2, 1, -0.5]; let tr = 0;
      const ctl = Controls(el);
      z.forEach((v, i) => Slider(ctl, { label: 'z' + '₁₂₃'[i], min: -4, max: 4, step: 0.1, value: v, fmt: x => fx(x, 1), oninput: x => { z[i] = x; draw(); } }));
      Seg(ctl, { label: 'Riktig klasse', options: [[0, 'Katt'], [1, 'Hund'], [2, 'Fugl']], value: tr, onchange: v => { tr = v; draw(); } });
      const svg = S('svg', { viewBox: '0 0 760 170', class: 'plot', role: 'img', 'aria-label': 'Softmax-sannsynligheter' }); el.append(svg);
      const tiles = Tiles(el, [['s', 'Sum av e^z'], ['p', 'P(riktig klasse)'], ['ce', 'Cross-entropy −ln p']]);
      function draw() {
        const p = softmax(z), names = ['Katt', 'Hund', 'Fugl']; clear(svg);
        p.forEach((v, i) => { const y = 14 + i * 50;
          S('text', { x: 0, y: y + 22, class: 'lbl', text: names[i], style: 'font-size:13px;font-weight:' + (i === tr ? 700 : 400) }, svg);
          S('text', { x: 52, y: y + 22, text: `e^${fx(z[i], 1)} = ${fx(Math.exp(z[i]), 2)}`, style: 'font-size:12px' }, svg);
          S('rect', { x: 200, y, width: 480, height: 32, rx: 5, class: 'f-soft' }, svg);
          S('rect', { x: 200, y, width: 480 * v, height: 32, rx: 5, class: i === tr ? 'f-c1' : 'f-c4', 'fill-opacity': i === tr ? 1 : 0.55 }, svg);
          S('text', { x: 690, y: y + 22, class: 'lbl', text: fx(v, 3), style: 'font-size:13px' }, svg); });
        tiles.set('s', fx(sum(z.map(Math.exp)), 2)); tiles.set('p', fx(p[tr], 3)); tiles.set('ce', fx(-Math.log(p[tr]), 3), p[tr] < 0.2 ? 'bad' : p[tr] > 0.8 ? 'good' : '');
      }
      draw();
    },
    tryit: ['Øk logit for riktig klasse. Sannsynligheten nærmer seg 1 og cross-entropy nærmer seg 0.', 'Legg til samme tall på alle tre logits. Sannsynlighetene endres ikke. Det er bare forskjellene som teller.', 'Sett riktig klasse til en som modellen gir lav sannsynlighet. Cross-entropy blir stor. Det er dette treningen prøver å unngå.']
  }, {
    title: 'Gradient descent: skrittlengden avgjør',
    sub: 'En kostnadsfunksjon med én vekt w. Hvert steg går motsatt vei av stigningen: w ← w − η · L′(w). Learning rate η bestemmer skrittlengden.',
    build(el) {
      const Lf = w => 0.1 * w ** 4 - 0.75 * w * w + 0.3 * w + 1.6, dL = w => 0.4 * w ** 3 - 1.5 * w + 0.3;
      let eta = 0.1, w0 = 2.8, path = [w0];
      const ctl = Controls(el);
      Slider(ctl, { label: 'Learning rate η', min: 0.01, max: 1.2, step: 0.01, value: eta, fmt: v => fx(v, 2), oninput: v => { eta = v; path = [w0]; draw(); } });
      Slider(ctl, { label: 'Start w', min: -3, max: 3, step: 0.1, value: w0, fmt: v => fx(v, 1), oninput: v => { w0 = v; path = [w0]; draw(); } });
      const step = n => { for (let i = 0; i < n; i++) { const w = path[path.length - 1]; if (Math.abs(w) > 50) break; path.push(w - eta * dL(w)); } draw(); };
      Btn(ctl, 'Ett steg', () => step(1), 'primary'); Btn(ctl, '10 steg', () => step(10)); Btn(ctl, 'Nullstill', () => { path = [w0]; draw(); });
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const plot = new Plot(a, { w: 560, h: 340, x: [-3.2, 3.2], y: [-1, 4.5], xlab: 'w', ylab: 'Kostnad L(w)', label: 'Gradient descent på en kostnadsfunksjon' });
      S('path', { d: pathOf(range(321, i => -3.2 + i * 0.02).map(w => [plot.x(w), plot.y(Lf(w))])), fill: 'none', class: 's-ink', 'stroke-width': 2 }, plot.gData);
      const gP = plot.clipLayer();
      const tiles = Tiles(b, [['n', 'Steg'], ['w', 'w'], ['l', 'L(w)'], ['g', 'Stigning L′(w)'], ['s', 'Status']]);
      function draw() {
        clear(gP); const X = plot.x, Y = plot.y;
        for (let i = 1; i < path.length; i++) S('line', { x1: X(path[i - 1]), y1: Y(Lf(path[i - 1])), x2: X(path[i]), y2: Y(Lf(path[i])), class: 's-c0', 'stroke-width': 1.6, 'stroke-opacity': 0.8 }, gP);
        path.forEach((w, i) => S('circle', { cx: X(w), cy: Y(Lf(w)), r: i === path.length - 1 ? 7 : 4, class: i === path.length - 1 ? 'f-hl s-ink' : 'f-c0' }, gP));
        const w = path[path.length - 1], g = dL(w);
        tiles.set('n', String(path.length - 1)); tiles.set('w', fx(w, 3)); tiles.set('l', Math.abs(w) > 50 ? '∞' : fx(Lf(w), 3)); tiles.set('g', Math.abs(w) > 50 ? '–' : fx(g, 3));
        tiles.set('s', Math.abs(w) > 6 ? 'divergerer' : Math.abs(g) < 0.01 ? (Lf(w) < 0 ? 'globalt minimum' : 'lokalt minimum') : 'på vei', Math.abs(w) > 6 ? 'bad' : Math.abs(g) < 0.01 ? 'good' : '');
      }
      draw();
    },
    tryit: ['Med η = 0,1 fra w = 2,8 havner du i det lokale minimumet til høyre, ikke i det laveste punktet.', 'Prøv η = 0,01. Det går riktig vei, men svært sakte.', 'Prøv η = 0,8–1,2. Stegene blir så lange at w hopper frem og tilbake eller forsvinner ut av bildet.']
  }, {
    title: 'Tren et lite nettverk i nettleseren',
    sub: 'Simulerte data: 400 punkter, 200 til trening (fylte) og 200 til validering (hule). Vektene justeres bare ut fra treningspunktene. Nettverket har to input, ett skjult lag med valgfri aktivering og sigmoid ut, og trenes med mini-batch gradient descent. Den mørke linjen er klassifikasjonsgrensen, der nettverket gir p = 0,5.',
    build(el) {
      const all = fit01(moons(RNG(13), 400, 0.18)), tr = all.slice(0, 200), va = all.slice(200);
      const T = p => [2 * p[0] - 1, 2 * p[1] - 1, p[2]], trT = tr.map(T), vaT = va.map(T);
      let h = 6, lr = 0.5, bs = 32, act = 'relu', net, ep, ups, hist, running = false, raf = 0, rng;
      /* Den deriverte uttrykt ved aktiveringen a = f(z), brukt i backprop */
      const DACT = { relu: a => (a > 0 ? 1 : 0), sigmoid: a => a * (1 - a), tanh: a => 1 - a * a };
      function reset() { const r = RNG(100 + h); rng = RNG(7); net = { h, W1: range(h, () => [0.5 * r.n(), 0.5 * r.n()]), b1: range(h, () => 0.1 * r.n()), W2: range(h, () => 0.1 * r.n()), b2: 0 }; ep = 0; ups = 0; hist = []; }
      const fwd = x => { const f = ACT[act].f, a = new Array(net.h); let z = net.b2; for (let j = 0; j < net.h; j++) { a[j] = f(net.W1[j][0] * x[0] + net.W1[j][1] * x[1] + net.b1[j]); z += net.W2[j] * a[j]; } return { a, z, p: sigmoid(z) }; };
      const loss = D => mean(D.map(x => { const p = clamp(fwd(x).p, 1e-7, 1 - 1e-7); return -(x[2] * Math.log(p) + (1 - x[2]) * Math.log(1 - p)); }));
      const accu = D => D.filter(x => (fwd(x).p > 0.5 ? 1 : 0) === x[2]).length / D.length;
      function epoch() {
        const idx = rng.shuffle(range(trT.length)), df = DACT[act];
        for (let s = 0; s < idx.length; s += bs) {
          const B = idx.slice(s, s + bs), gW1 = range(net.h, () => [0, 0]), gb1 = new Array(net.h).fill(0), gW2 = new Array(net.h).fill(0); let gb2 = 0;
          for (const i of B) { const x = trT[i], { a, p } = fwd(x), d2 = p - x[2]; gb2 += d2;
            for (let j = 0; j < net.h; j++) { gW2[j] += d2 * a[j]; const d1 = d2 * net.W2[j] * df(a[j]); gW1[j][0] += d1 * x[0]; gW1[j][1] += d1 * x[1]; gb1[j] += d1; } }
          const m = B.length; net.b2 -= lr * gb2 / m;
          for (let j = 0; j < net.h; j++) { net.W2[j] -= lr * gW2[j] / m; net.W1[j][0] -= lr * gW1[j][0] / m; net.W1[j][1] -= lr * gW1[j][1] / m; net.b1[j] -= lr * gb1[j] / m; }
          ups++;
        }
        ep++; hist.push([ep, loss(trT), loss(vaT)]);
      }
      const ctl = Controls(el);
      Slider(ctl, { label: 'Skjulte nevroner', min: 1, max: 16, value: h, oninput: v => { h = v; stop(); reset(); draw(); } });
      Seg(ctl, { label: 'Aktivering', options: [['relu', 'ReLU'], ['sigmoid', 'sigmoid'], ['tanh', 'tanh']], value: act, onchange: v => { act = v; stop(); reset(); draw(); } });
      Seg(ctl, { label: 'Learning rate', options: [[0.05, '0,05'], [0.5, '0,5'], [3, '3']], value: lr, onchange: v => { lr = v; } });
      Seg(ctl, { label: 'Batch size', options: [[8, '8'], [32, '32'], [200, '200 (alle)']], value: bs, onchange: v => { bs = v; } });
      const ctl2 = Controls(el);
      const play = Btn(ctl2, 'Start trening', () => { running ? stop() : start(); }, 'primary');
      Btn(ctl2, 'Ett epoch', () => { stop(); epoch(); draw(); });
      Btn(ctl2, 'Nullstill', () => { stop(); reset(); draw(); });
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const plot = new Plot(a, { w: 520, h: 420, m: { t: 10, r: 10, b: 10, l: 10 }, x: [0, 1], y: [0, 1], xticks: [], yticks: [], grid: false, label: 'Klassifikasjonsgrensen til nettverket' });
      const gR = plot.layer(), gP = plot.layer(), gC = plot.layer();
      tr.forEach(p => S('circle', { cx: plot.x(p[0]), cy: plot.y(p[1]), r: 3.4, class: p[2] ? 'f-c1' : 'f-c0' }, gP));
      va.forEach(p => S('circle', { cx: plot.x(p[0]), cy: plot.y(p[1]), r: 3.4, fill: 'none', class: p[2] ? 's-c1' : 's-c0', 'stroke-width': 1.2 }, gP));
      const p2 = new Plot(b, { w: 380, h: 240, x: [0, 50], y: [0, 0.8], xlab: 'Epoch', ylab: 'Cost (cross-entropy)', label: 'Cost mot epoch' });
      const gL = p2.clipLayer();
      const tiles = Tiles(b, [['ep', 'Epochs'], ['up', 'Vektoppdateringer'], ['ta', 'Nøyaktighet trening'], ['va', 'Nøyaktighet validering']]);
      b.append(H('p', { class: 'note', html: 'Cost på <b style="color:var(--c4)">treningsdataene</b> og på <b style="color:var(--c0)">valideringssettet</b>. Én epoch = alle 200 treningspunkter én gang. Oppdateringer per epoch = 200 / batch size.' }));
      function start() { if (running) return; running = true; play.textContent = 'Pause'; const loop = () => { if (!running || !el.isConnected) { running = false; return; } const t0 = performance.now(); let n = 0; while (performance.now() - t0 < 14 && n < 8 && ep < 3000) { epoch(); n++; } draw(); if (ep >= 3000) stop(); else raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); }
      function stop() { running = false; cancelAnimationFrame(raf); play.textContent = 'Start trening'; }
      onLeave(stop);
      function draw() {
        clear(gR); regionGrid(gR, plot, (x, y) => fwd([2 * x - 1, 2 * y - 1]).p, 48, 38, 0, 1, 0, 1);
        clear(gC); zeroContour(gC, plot, (x, y) => fwd([2 * x - 1, 2 * y - 1]).z, 104, 84);
        const xm = Math.max(50, Math.ceil(ep / 50) * 50); if (xm !== p2.o.x[1]) p2.setDomain([0, xm], [0, 0.8]);
        clear(gL);
        if (hist.length > 1) for (const [k, cl] of [[1, 'c4'], [2, 'c0']]) S('path', { d: pathOf(hist.filter((_, i) => i % Math.max(1, Math.floor(hist.length / 300)) === 0 || i === hist.length - 1).map(r => [p2.x(r[0]), p2.y(Math.min(r[k], 0.8))])), fill: 'none', class: 's-' + cl, 'stroke-width': 2 }, gL);
        tiles.set('ep', String(ep)); tiles.set('up', fint(ups)); tiles.set('ta', fpct(accu(trT))); tiles.set('va', fpct(accu(vaT)));
      }
      reset(); draw();
    },
    tryit: ['Trykk «Start trening» med 6 nevroner. Grensen bøyer seg gradvis rundt de to halvmånene.', 'Prøv 1 skjult nevron. Da kan nettverket bare lage en rett grense, som logistisk regresjon. Det gjelder alle tre aktiveringene.', 'Velg 3 nevroner og bytt aktivering. Med ReLU blir grensen noen få rette biter med skarpe knekker, og med tanh blir bøyene myke. Sigmoid kommer dit også, men trenger mange flere epochs, fordi den deriverte aldri er større enn 0,25.','Sammenlign batch size 8 og 200. Med 8 blir det 25 oppdateringer per epoch, så nettverket lærer på færre epochs, men hver epoch tar lengre tid.', 'Learning rate 3 gir urolige hopp. 0,05 gir trege, men jevne kurver.']
  }, {
    title: 'Konvolusjon: et filter som glir over bildet',
    sub: 'Et 8 × 8 gråtonebilde av sifferet 7 og et 3 × 3-filter. I hver posisjon ganges filteret med pikslene under, og summen blir én verdi i feature map-et.',
    build(el) {
      const IMG = [[0, 0, 0, 0, 0, 0, 0, 0], [0, 9, 9, 9, 9, 9, 9, 0], [0, 9, 9, 9, 9, 9, 9, 0], [0, 0, 0, 0, 9, 9, 0, 0], [0, 0, 0, 9, 9, 0, 0, 0], [0, 0, 9, 9, 0, 0, 0, 0], [0, 0, 9, 9, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0]];
      const FIL = { vert: [[1, 0, -1], [1, 0, -1], [1, 0, -1]], hor: [[1, 1, 1], [0, 0, 0], [-1, -1, -1]], sharp: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], blur: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] };
      let fn = 'vert', stride = 1, pad = 0, pos = 0;
      const ctl = Controls(el);
      Seg(ctl, { label: 'Filter', options: [['vert', 'Loddrett kant'], ['hor', 'Vannrett kant'], ['sharp', 'Skarphet'], ['blur', 'Uskarp (sum)']], value: fn, onchange: v => { fn = v; draw(); } });
      Seg(ctl, { label: 'Stride', options: [[1, '1'], [2, '2']], value: stride, onchange: v => { stride = v; pos = 0; ps.set(0, false); draw(); } });
      Seg(ctl, { label: 'Padding', options: [[0, '0'], [1, '1']], value: pad, onchange: v => { pad = v; pos = 0; ps.set(0, false); draw(); } });
      const ps = Slider(ctl, { label: 'Posisjon', min: 0, max: 35, value: 0, fmt: v => String(v + 1), oninput: v => { pos = v; draw(); } });
      Btn(ctl, 'Hele bildet', () => { ps.set(+ps.input.max); });
      const svg = S('svg', { viewBox: '0 0 760 300', class: 'plot', role: 'img', 'aria-label': 'Konvolusjon steg for steg' }); el.append(svg);
      const res = H('p', { class: 'mini' }); el.append(res);
      function draw() {
        const N = 8 + 2 * pad, src = range(N, i => range(N, j => { const a = i - pad, b = j - pad; return a >= 0 && a < 8 && b >= 0 && b < 8 ? IMG[a][b] : 0; }));
        const on = Math.floor((N - 3) / stride) + 1, tot = on * on; ps.input.max = tot - 1; if (pos > tot - 1) { pos = tot - 1; ps.set(pos, false); }
        const F = FIL[fn], out = range(on, i => range(on, j => { let s = 0; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) s += F[a][b] * src[i * stride + a][j * stride + b]; return s; }));
        const mx = Math.max(1, ...out.flat().map(Math.abs)), ci = Math.floor(pos / on), cj = pos % on;
        clear(svg); const c = 26, ox = 10, oy = 26;
        S('text', { x: ox, y: 16, class: 'lbl', text: `Input ${N} × ${N}` + (pad ? ' (med nullkant)' : ''), style: 'font-size:12px;font-weight:600' }, svg);
        src.forEach((row, i) => row.forEach((v, j) => { const isPad = pad && (i === 0 || j === 0 || i === N - 1 || j === N - 1); S('rect', { x: ox + j * c, y: oy + i * c, width: c - 1, height: c - 1, class: isPad ? 'f-line' : 'f-ink', 'fill-opacity': isPad ? 0.5 : 0.08 + 0.85 * v / 9 }, svg); }));
        S('rect', { x: ox + cj * stride * c - 1, y: oy + ci * stride * c - 1, width: 3 * c + 1, height: 3 * c + 1, fill: 'none', class: 's-hl', 'stroke-width': 3.5 }, svg);
        const fx0 = ox + N * c + 40;
        S('text', { x: fx0, y: 16, class: 'lbl', text: 'Filter 3 × 3', style: 'font-size:12px;font-weight:600' }, svg);
        F.forEach((row, a) => row.forEach((w, b) => { S('rect', { x: fx0 + b * 34, y: oy + a * 34, width: 32, height: 32, rx: 4, class: w > 0 ? 'f-c1' : w < 0 ? 'f-c0' : 'f-soft', 'fill-opacity': w ? 0.25 : 1 }, svg); S('text', { x: fx0 + b * 34 + 16, y: oy + a * 34 + 21, 'text-anchor': 'middle', class: 'lbl', text: String(w).replace('-', '−'), style: 'font-size:13px' }, svg); }));
        const gx = fx0 + 3 * 34 + 40;
        S('text', { x: gx, y: 16, class: 'lbl', text: `Feature map ${on} × ${on}`, style: 'font-size:12px;font-weight:600' }, svg);
        const cc = Math.min(26, 230 / on);
        out.forEach((row, i) => row.forEach((v, j) => { const k = i * on + j, done = k <= pos; S('rect', { x: gx + j * cc, y: oy + i * cc, width: cc - 1, height: cc - 1, class: !done ? 'f-soft' : v >= 0 ? 'f-c1' : 'f-c0', 'fill-opacity': done ? 0.15 + 0.85 * Math.abs(v) / mx : 1, stroke: k === pos ? 'currentColor' : null, style: k === pos ? 'color:var(--hl)' : null, 'stroke-width': 3 }, svg); }));
        const prods = []; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { const w = F[a][b], p = src[ci * stride + a][cj * stride + b]; if (w && p) prods.push(`${w}·${p}`.replace(/-/g, '−')); }
        res.innerHTML = `Posisjon ${pos + 1} av ${tot}: ${prods.length ? prods.join(' + ') : 'alle produkter er 0'} = <b>${String(out[ci][cj]).replace('-', '−')}</b>. Output-størrelse: (${8} − 3 + 2·${pad}) / ${stride} + 1 = ${on}.`;
      }
      draw();
    },
    tryit: ['Velg «Loddrett kant» og trykk «Hele bildet». Store positive og negative verdier dukker opp der bildet går fra mørkt til lyst sidelengs.', 'Bytt til «Vannrett kant». Nå er det overkanten og den skrå streken som lyser.', 'Prøv stride 2: feature map-et krymper fra 6 × 6 til 3 × 3. Med padding 1 blir det 8 × 8 igjen ved stride 1.']
  }, {
    title: 'Regn ut et konvolusjonslag',
    sub: 'Output-størrelse = (W − F + 2P) / S + 1. Parametere = (F · F · C + 1) · K: hvert av de K filtrene har F · F · C vekter og én bias.',
    build(el) {
      const st = { W: 224, C: 3, F: 3, S: 1, P: 1, K: 64 };
      const ctl = Controls(el);
      for (const [k, lab, mn, mx] of [['W', 'Input bredde W', 1, 1000], ['C', 'Kanaler C', 1, 512], ['F', 'Filter F', 1, 11], ['S', 'Stride S', 1, 4], ['P', 'Padding P', 0, 5], ['K', 'Antall filtre K', 1, 512]])
        NumIn(ctl, { label: lab, value: st[k], min: mn, max: mx, oninput: v => { st[k] = v; draw(); } });
      const tiles = Tiles(el, [['o', 'Output'], ['p', 'Parametere i laget'], ['f', 'Utregning']]);
      function draw() {
        const o = (st.W - st.F + 2 * st.P) / st.S + 1, ok = Number.isInteger(o) && o > 0;
        tiles.set('o', ok ? `${o} × ${o} × ${st.K}` : 'går ikke opp', ok ? 'hl' : 'bad');
        tiles.set('p', fint((st.F * st.F * st.C + 1) * st.K));
        tiles.set('f', `(${st.W} − ${st.F} + 2·${st.P}) / ${st.S} + 1 = ${fx(o, 2).replace('.00', '')}`);
      }
      draw();
    },
    tryit: ['Startverdiene er første lag i VGG16: 224 × 224 × 64 og 1 792 parametere.', 'Sett W = 32, F = 5, S = 1, P = 0 og K = 10. Output blir 28 × 28 × 10.', 'Max pooling 2 × 2 med stride 2 er F = 2, S = 2, P = 0 uten parametere: 224 blir 112.']
  }],
  body: `
<h2>Fra nevron til nettverk</h2>
<p>Ett nevron regner <i>a</i> = <i>f</i>(w<sub>1</sub>x<sub>1</sub> + … + w<sub>p</sub>x<sub>p</sub> + b). Uten aktiveringsfunksjonen er det lineær regresjon. Med sigmoid er det logistisk regresjon. Et <b>multilayer perceptron (MLP)</b> setter mange nevroner i lag: input, ett eller flere skjulte lag, og output. Det er de ikke-lineære aktiveringene i de skjulte lagene som lar nettverket lære krumme sammenhenger.</p>
<ul>
<li><b>Parametere</b> lærer modellen selv: alle vekter og biaser. Fullt koblet lag: n<sub>inn</sub> · n<sub>ut</sub> + n<sub>ut</sub>.</li>
<li><b>Hyperparametere</b> velger vi: antall lag og nevroner, aktivering, learning rate, batch size, antall epochs.</li>
</ul>
<h2>Output-lag og kostnadsfunksjon hører sammen</h2>
<div class="tblwrap"><table class="tbl">
<tr><th class="l">Oppgave</th><th class="l">Output-lag</th><th class="l">Kostnadsfunksjon</th></tr>
<tr><td class="l">Regresjon (tall)</td><td class="l">1 nevron, lineær</td><td class="l">MSE</td></tr>
<tr><td class="l">To klasser</td><td class="l">1 nevron, sigmoid</td><td class="l">Binær cross-entropy</td></tr>
<tr><td class="l">Flere klasser</td><td class="l">1 nevron per klasse, softmax</td><td class="l">Kategorisk cross-entropy</td></tr>
</table></div>
<h2>Trening</h2>
<ol>
<li><b>Forward propagation:</b> send en batch gjennom nettverket og få prediksjoner.</li>
<li><b>Cost:</b> mål hvor feil prediksjonene er med kostnadsfunksjonen.</li>
<li><b>Backpropagation:</b> bruk kjerneregelen bakover gjennom lagene for å finne hvor mye hver vekt bidro til feilen (gradienten).</li>
<li><b>Gradient descent:</b> juster hver vekt litt motsatt vei av gradienten: w ← w − η · ∂L/∂w.</li>
<li>Gjenta for alle batcher (én epoch), og så for mange epochs.</li>
</ol>
<div class="formula">Oppdateringer per epoch = <span class="v">n</span> / batch size &nbsp;&nbsp;&nbsp;&nbsp; Totalt = epochs · <span class="v">n</span> / batch size</div>
<p>Learning rate er den viktigste hyperparameteren: for liten gir treg læring, for stor gir hopp og divergens. Optimizere som SGD med momentum, RMSprop og Adam er smartere varianter av gradient descent.</p>
<h2>Overtilpasning</h2>
<p>Store nettverk kan pugge treningsdataene. Følg cost på valideringssettet: når den snur og stiger mens cost på treningsdataene faller, begynner nettverket å pugge. Tiltak: stopp tidlig (early stopping), dropout, L2-regularisering (weight decay), flere data eller data augmentation.</p>
<h2>Konvolusjonsnettverk (CNN) for bilder</h2>
<ul>
<li>Et bilde er en tabell med tall: høyde × bredde × kanaler (3 for RGB). En MLP ville trengt enormt mange vekter og mister naboskapet mellom piksler.</li>
<li><b>Konvolusjon:</b> små filtre (for eksempel 3 × 3) glir over bildet. Samme vekter brukes overalt, og hvert filter gir ett <b>feature map</b>. Tidlige lag finner kanter, senere lag former og objekter.</li>
<li><b>Stride</b> er skrittlengden, <b>padding</b> er en kant av nuller. Output = (W − F + 2P) / S + 1.</li>
<li><b>Pooling</b> (for eksempel 2 × 2 max pooling) krymper bildet og beholder de sterkeste signalene. Ingen parametere.</li>
<li>Et typisk CNN: flere blokker med konvolusjon og pooling, så fullt koblede lag og softmax til slutt.</li>
</ul>
<h2>VGG16 og transfer learning</h2>
<p>VGG16 har 16 lag med vekter (13 konvolusjonslag og 3 fullt koblede), bare 3 × 3-filtre, og 138 millioner parametere trent på ImageNet med 1000 klasser. Med <b>transfer learning</b> gjenbruker vi konvolusjonsdelen som ferdig trent «ryggrad», fryser vektene og trener bare et nytt output-lag for vår egen oppgave. Det krever langt færre bilder enn å trene fra bunnen.</p>
<div class="pit"><b>Eksamensfelle: tell parametere</b>3 input, ett skjult lag med 4 nevroner og 2 output: (3 · 4 + 4) + (4 · 2 + 2) = 26. Glem ikke biasene, og husk at input-laget ikke har parametere.</div>
<div class="pit"><b>Eksamensfelle: iterasjoner</b>50 000 bilder, batch size 250 og 10 epochs gir 50 000 / 250 = 200 oppdateringer per epoch, altså 2 000 totalt.</div>
<h2>Python</h2>
<pre><code>from sklearn.neural_network import MLPClassifier               # scikit-learn, som i læreboka
# ett skjult lag med 6 nevroner, sigmoid-aktivering ('logistic'), optimeringsmetoden lbfgs
clf = MLPClassifier(hidden_layer_sizes=(6,), activation='logistic', solver='lbfgs', random_state=1)
clf.fit(train_X, train_y)

from tensorflow import keras                                    # Keras (TensorFlow)
model = keras.Sequential([                                      # lagene kobles etter hverandre
    keras.layers.Input(shape=(4,)),                             # 4 features inn
    keras.layers.Dense(6, activation='relu'),                   # skjult lag: 6 nevroner med ReLU
    keras.layers.Dense(3, activation='softmax')])               # 3 klasser ut, softmax gir sannsynligheter
# adam = gradient descent med tilpasset steglengde; loss = cross-entropy (y må være one-hot)
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
# de siste 20 % av radene holdes av til validering
model.fit(X, y, epochs=20, batch_size=32, validation_split=0.2)

# ferdig trent VGG16 uten de fullt koblede lagene på toppen (include_top=False)
base = keras.applications.VGG16(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
base.trainable = False                                          # transfer learning: frys ryggraden</code></pre>`
});
