/* Regularisering: ridge, lasso og elastic net, med geometri, krymping, kryssvalidering, korrelerte variabler og logistisk regresjon */

function coefBars(svg, names, vals, ref, lo, hi, colOf, nameOf) {
  clear(svg); const W = 360, x0p = 118, x1p = 352, bx = v => x0p + (v - lo) / (hi - lo) * (x1p - x0p), z = bx(0), rowH = 26;
  svg.setAttribute('viewBox', `0 0 ${W} ${names.length * rowH + 14}`);
  S('line', { x1: z, x2: z, y1: 4, y2: names.length * rowH + 8, class: 's-ink' }, svg);
  names.forEach((n, j) => {
    const y = 8 + j * rowH, v = vals[j];
    S('text', { x: 2, y: y + 13, text: nameOf ? nameOf(n) : n, style: 'font-size:11.5px', class: 'lbl' }, svg);
    S('rect', { x: Math.min(z, bx(v)), y: y + 2, width: Math.max(0.5, Math.abs(bx(v) - z)), height: 15, class: 'f-' + colOf(j), 'fill-opacity': v === 0 ? 0 : 0.85, rx: 2 }, svg);
    if (ref) S('line', { x1: bx(ref[j]), x2: bx(ref[j]), y1: y, y2: y + 19, class: 's-ink', 'stroke-width': 1.5, 'stroke-opacity': 0.5 }, svg);
    if (v === 0) S('text', { x: z + 6, y: y + 13, text: '0', style: 'font-size:11px' }, svg);
  });
}

topic({
  id: 'regularisering', short: 'Ridge, lasso og elastic net', lecture: 'F5', tags: ['Prediksjon', 'Klassifikasjon', 'Ridge', 'Lasso', 'Elastic net'],
  data: [['toyota'], ['ub', ['Personal Loan', 'Income', 'CCAvg', 'Education', 'Family']]],
  title: 'Regularisering: ridge, lasso og elastic net',
  path: ['Veiledet læring', 'Prediksjon og klassifikasjon'],
  lead: 'Regularisering betyr at vi legger en straff for store koeffisienter oppå vanlig minste kvadrater. Modellen må da finne en balanse mellom å passe dataene og å holde koeffisientene små. Det gir litt mer bias, men mindre varians, og ofte bedre prediksjoner på nye data.',
  figs: [{
    title: 'Hvorfor lasso gir nuller: rute, sirkel og ellipser',
    sub: 'To koeffisienter, β₁ og β₂. Den svarte prikken er minste kvadraters løsning, og ellipsene rundt den er punkter med like stor SSE. Straffen fungerer som et budsjett: koeffisientene må ligge inni den fargede figuren. Løsningen (gul) er der en ellipse så vidt berører figuren. Dra den svarte prikken.',
    build(el) {
      let method = 'lasso', s = 1.2, rho = 0.3, b = [2.2, 0.5];
      const ctl = Controls(el);
      Seg(ctl, { label: 'Straff', options: [['ridge', 'Ridge (sirkel)'], ['lasso', 'Lasso (rute)'], ['enet', 'Elastic net']], value: method, onchange: v => { method = v; draw(); } });
      Slider(ctl, { label: 'Budsjett s', min: 0.2, max: 3, step: 0.05, value: s, fmt: v => fx(v, 2), oninput: v => { s = v; draw(); } });
      Slider(ctl, { label: 'Korrelasjon mellom x₁ og x₂', min: -0.8, max: 0.8, step: 0.05, value: rho, fmt: v => fx(v, 2), oninput: v => { rho = v; draw(); } });
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), c = H('div'); cols.append(a, c);
      const plot = new Plot(a, { w: 520, h: 508, x: [-3, 3], y: [-3, 3], xlab: 'β₁', ylab: 'β₂', label: 'Begrensningsområde og SSE-ellipser' });
      const gA = plot.layer(), gR = plot.layer(), gE = plot.clipLayer(), gS = plot.layer(), gP = plot.layer();
      const tiles = Tiles(c, [['ols', 'Minste kvadrater (b₁, b₂)'], ['reg', 'Med straff (β₁, β₂)'], ['z', 'Koeffisienter lik 0']]);
      c.append(H('p', { class: 'note', html: 'Mindre budsjett s betyr større straff λ. Ridge: β₁² + β₂² ≤ s². Lasso: |β₁| + |β₂| ≤ s. Elastic net blander de to og får både hjørner og runde kanter.' }));
      const Q = (p) => { const d0 = p[0] - b[0], d1 = p[1] - b[1]; return d0 * d0 + 2 * rho * d0 * d1 + d1 * d1; };
      const R = th => { const co = Math.abs(Math.cos(th)), si = Math.abs(Math.sin(th));
        if (method === 'ridge') return s; if (method === 'lasso') return s / (co + si);
        const aa = 0.5 * (co + si) / s, qq = 0.5 / (s * s); return (-aa + Math.sqrt(aa * aa + 4 * qq)) / (2 * qq); };
      const pen = p => method === 'ridge' ? (p[0] ** 2 + p[1] ** 2) / s ** 2 : method === 'lasso' ? (Math.abs(p[0]) + Math.abs(p[1])) / s : 0.5 * (Math.abs(p[0]) + Math.abs(p[1])) / s + 0.5 * (p[0] ** 2 + p[1] ** 2) / s ** 2;
      const move = p => { b = [clamp(p.x, -2.9, 2.9), clamp(p.y, -2.9, 2.9)]; draw(); };
      clickMove(plot, move);
      function draw() {
        const X = plot.x, Y = plot.y; clear(gA); clear(gR); clear(gE); clear(gS); clear(gP);
        S('line', { x1: X(-3), x2: X(3), y1: Y(0), y2: Y(0), class: 's-mut' }, gA); S('line', { x1: X(0), x2: X(0), y1: Y(-3), y2: Y(3), class: 's-mut' }, gA);
        const ths = range(721, i => i * Math.PI / 360), poly = ths.map(t => { const r = R(t); return [r * Math.cos(t), r * Math.sin(t)]; });
        S('path', { d: pathOf(poly.map(p => [X(p[0]), Y(p[1])])) + 'Z', class: 'f-acc s-acc', 'fill-opacity': 0.16, 'stroke-width': 2 }, gR);
        let best = b.slice();
        if (pen(b) > 1) { let bq = Infinity; for (const t of ths.concat([0, Math.PI / 2, Math.PI, 1.5 * Math.PI])) { const r = R(t), p = [r * Math.cos(t), r * Math.sin(t)], q = Q(p); if (q < bq) { bq = q; best = p; } } }
        const cs = Q(best), levels = cs > 1e-6 ? [0.2, 0.5, 1, 1.9, 3.2].map(f => f * cs) : [0.15, 0.5, 1.1, 2];
        levels.forEach((lv, i) => { const pts = range(181, k => { const ph = k * 2 * Math.PI / 180, u = [Math.cos(ph), Math.sin(ph)], uAu = u[0] * u[0] + 2 * rho * u[0] * u[1] + u[1] * u[1], t = Math.sqrt(lv / uAu); return [X(b[0] + t * u[0]), Y(b[1] + t * u[1])]; });
          S('path', { d: pathOf(pts) + 'Z', fill: 'none', class: cs > 1e-6 && i === 2 ? 's-ink' : 's-mut', 'stroke-width': cs > 1e-6 && i === 2 ? 2 : 1, 'stroke-opacity': cs > 1e-6 && i === 2 ? 0.9 : 0.6 }, gE); });
        if (cs > 1e-6) S('line', { x1: X(b[0]), y1: Y(b[1]), x2: X(best[0]), y2: Y(best[1]), class: 's-ink', 'stroke-dasharray': '4 3' }, gS);
        const op = S('circle', { cx: X(b[0]), cy: Y(b[1]), r: 7, class: 'f-ink' }, gP); draggable(plot, op, move);
        S('circle', { cx: X(best[0]), cy: Y(best[1]), r: 7.5, class: 'f-hl s-ink', 'stroke-width': 1.5 }, gP);
        const zero = best.filter(v => Math.abs(v) < 0.01).length;
        tiles.set('ols', `(${fx(b[0], 2)}, ${fx(b[1], 2)})`); tiles.set('reg', `(${fx(Math.abs(best[0]) < 0.01 ? 0 : best[0], 2)}, ${fx(Math.abs(best[1]) < 0.01 ? 0 : best[1], 2)})`);
        tiles.set('z', String(zero), zero ? 'hl' : '');
      }
      draw();
    },
    tryit: ['Med lasso treffer ellipsen ofte et hjørne av ruta. Et hjørne ligger på en akse, og der er den andre koeffisienten nøyaktig 0.', 'Bytt til ridge. Sirkelen har ingen hjørner, så ellipsen berører den nesten aldri akkurat på en akse. Begge koeffisientene blir mindre, men ingen blir 0.', 'Øk budsjettet s til prikken havner inni figuren. Da er straffen for svak til å bety noe, og løsningen er vanlig minste kvadrater.', 'Endre korrelasjonen. Ellipsene blir skrå, og lassoen kan bytte hvilken koeffisient den setter til 0.']
  }, {
    title: 'Hva straffen gjør med én koeffisient',
    sub: 'Når variablene er standardiserte og ukorrelerte, kan løsningene regnes ut direkte fra koeffisienten uten straff (b). Ridge deler på et tall, lasso trekker fra et tall og stopper på 0, og elastic net gjør begge deler.',
    build(el) {
      let lam = 0.8, b0 = 1.5;
      const ctl = Controls(el);
      Slider(ctl, { label: 'Straff λ', min: 0, max: 2, step: 0.05, value: lam, fmt: v => fx(v, 2), oninput: v => { lam = v; draw(); } });
      Slider(ctl, { label: 'Koeffisient uten straff b', min: -3, max: 3, step: 0.05, value: b0, fmt: v => fx(v, 2), oninput: v => { b0 = v; draw(); } });
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), c = H('div'); cols.append(a, c);
      const plot = new Plot(a, { w: 520, h: 400, x: [-3, 3], y: [-3, 3], xlab: 'Koeffisient uten straff (minste kvadrater)', ylab: 'Koeffisient med straff', label: 'Krymping av én koeffisient' });
      const g = plot.clipLayer(), gm = plot.layer();
      const tiles = Tiles(c, [['r', 'Ridge: b / (1 + λ)'], ['l', 'Lasso: b − λ, kuttet ved 0'], ['e', 'Elastic net (halvt om halvt)']]);
      c.append(H('p', { class: 'note', html: 'Linjer: <b style="color:var(--c4)">ridge</b>, <b style="color:var(--c0)">lasso</b>, <b style="color:var(--c2)">elastic net</b>. Stiplet: ingen straff. Det skraverte feltet er der lasso setter koeffisienten til 0.' }));
      const st = (v, t) => Math.sign(v) * Math.max(Math.abs(v) - t, 0);
      const f = { r: v => v / (1 + lam), l: v => st(v, lam), e: v => st(v, lam / 2) / (1 + lam / 2) };
      function draw() {
        clear(g); clear(gm); const X = plot.x, Y = plot.y, xs = range(241, i => -3 + i * 0.025);
        S('rect', { x: X(-lam), y: Y(3), width: X(lam) - X(-lam), height: Y(-3) - Y(3), class: 'f-c0', 'fill-opacity': 0.08 }, g);
        S('line', { x1: X(-3), y1: Y(-3), x2: X(3), y2: Y(3), class: 's-mut', 'stroke-dasharray': '5 4' }, g);
        for (const [k, cl] of [['r', 'c4'], ['l', 'c0'], ['e', 'c2']]) S('path', { d: pathOf(xs.map(x => [X(x), Y(f[k](x))])), fill: 'none', class: 's-' + cl, 'stroke-width': 2.6 }, g);
        S('line', { x1: X(b0), x2: X(b0), y1: Y(-3), y2: Y(3), class: 's-ink', 'stroke-dasharray': '3 3', 'stroke-opacity': 0.6 }, gm);
        for (const [k, cl] of [['r', 'c4'], ['l', 'c0'], ['e', 'c2']]) S('circle', { cx: X(b0), cy: Y(f[k](b0)), r: 6, class: 'f-' + cl + ' s-surf', 'stroke-width': 2 }, gm);
        tiles.set('r', fx(f.r(b0), 3)); tiles.set('l', fx(f.l(b0), 3), f.l(b0) === 0 ? 'hl' : ''); tiles.set('e', fx(f.e(b0), 3), f.e(b0) === 0 ? 'hl' : '');
      }
      draw();
    },
    tryit: ['Sett b = 0,5 og λ = 0,8. Lasso gir 0, mens ridge gir 0,28. Små koeffisienter forsvinner helt med lasso.', 'Sett b = 2,5. Ridge krymper store koeffisienter mye (i prosent av b), mens lasso trekker fra det samme faste beløpet λ uansett størrelse.', 'Med λ = 0 ligger alle linjene oppå den stiplede: ingen straff gir vanlig minste kvadrater.']
  }, {
    title: 'Velg λ med kryssvalidering: bruktbildataene',
    sub: 'De 11 forklaringsvariablene er standardisert, så koeffisientene er i euro per standardavvik. Øverst: hvordan koeffisientene krymper når straffen øker. Nederst: feilen i 5-fold kryssvalidering på treningsdataene, med ett standardavvik for gjennomsnittet som skygge.',
    build(el) {
      const P = { ridge: DATA.ridgePath, lasso: DATA.lassoPath, enet: DATA.enetPath }, names = DATA.toyotaCols, ols = DATA.olsStdCoef;
      const top = ols.map((v, i) => [Math.abs(v), i]).sort((p, q) => q[0] - p[0]).slice(0, 5).map(t => t[1]);
      const colOf = i => { const j = top.indexOf(i); return j < 0 ? 'mut' : 'c' + j; };
      const best = path => { const mi = path.reduce((bi, d, i) => d.cv < path[bi].cv ? i : bi, 0), thr = path[mi].cv + path[mi].se; let one = mi; path.forEach((d, i) => { if (d.a > path[mi].a && d.cv <= thr) one = i; }); return { mi, one }; };
      let mode = 'lasso', idx = best(P.lasso).one;
      const ctl = Controls(el);
      Seg(ctl, { label: 'Metode', options: [['ridge', 'Ridge'], ['lasso', 'Lasso'], ['enet', 'Elastic net (l1_ratio = 0,5)']], value: mode, onchange: v => { mode = v; sl.setMax(P[v].length - 1); idx = best(P[v]).one; sl.set(idx, false); draw(true); } });
      const afmt = i => { const d = P[mode][Math.min(i, P[mode].length - 1)]; return d.a < 0.01 ? d.a.toExponential(1).replace('-', '−') : fx(d.a, d.a < 10 ? 2 : 0); };
      const sl = Slider(ctl, { label: 'α (straff λ)', min: 0, max: P[mode].length - 1, value: idx, fmt: afmt, oninput: v => { idx = v; draw(); } });
      Btn(ctl, 'Minste CV-feil', () => sl.set(best(P[mode]).mi));
      Btn(ctl, '1-SE-regelen', () => sl.set(best(P[mode]).one), 'primary');
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const pl = new Plot(a, { w: 540, h: 330, x: [0, 1], y: [-2500, 1300], xlab: 'log₁₀(α)', ylab: 'Koeffisient (€ per std.avvik)', label: 'Koeffisientstier' });
      const gP = pl.layer(), gM = pl.layer();
      const bars = S('svg', { viewBox: '0 0 360 300', class: 'plot', role: 'img', 'aria-label': 'Koeffisienter ved valgt straff' }); b.append(bars);
      b.append(H('p', { class: 'note', html: 'Den tynne streken på hver søyle er koeffisienten uten straff.' }));
      const cv = new Plot(el, { w: 760, h: 250, x: [0, 1], y: [1300, 3800], xlab: 'log₁₀(α)', ylab: 'CV-RMSE (€)', label: 'Kryssvalideringsfeil mot straff' });
      const gC = cv.layer(), gCm = cv.layer();
      const tiles = Tiles(el, [['nz', 'Variabler ≠ 0'], ['cv', 'CV-RMSE ± SE'], ['va', 'RMSE på valideringssettet'], ['ols', 'RMSE uten straff']]);
      el.append(H('p', { class: 'note', html: '<b style="color:var(--good)">Grønn</b>: α med lavest CV-feil. <b style="color:var(--accent)">Blå</b>: 1-SE-regelen, den største α der CV-feilen er innenfor ett standardavvik fra den laveste. Merk at α i <code>Ridge</code> og α i <code>Lasso</code>/<code>ElasticNet</code> ikke er på samme skala i scikit-learn.' }));
      function draw(newMode) {
        const path = P[mode], lx = path.map(d => Math.log10(d.a)), { mi, one } = best(path);
        if (newMode || !pl._d) {
          pl.setDomain([Math.min(...lx), Math.max(...lx)], [-2500, 1300]); cv.setDomain([Math.min(...lx), Math.max(...lx)], [1300, 3800]); pl._d = 1; clear(gP); clear(gC);
          S('line', { x1: pl.x(lx[0]), x2: pl.x(lx[lx.length - 1]), y1: pl.y(0), y2: pl.y(0), class: 's-ink' }, gP);
          names.forEach((n, j) => S('path', { d: pathOf(path.map((d, i) => [pl.x(lx[i]), pl.y(d.coef[j])])), fill: 'none', class: 's-' + colOf(j), 'stroke-width': top.includes(j) ? 2.2 : 1.2, 'stroke-opacity': top.includes(j) ? 1 : 0.6 }, gP));
          S('path', { d: pathOf(path.map((d, i) => [cv.x(lx[i]), cv.y(d.cv + d.se)]).concat(path.slice().reverse().map((d, i) => [cv.x(lx[path.length - 1 - i]), cv.y(d.cv - d.se)]))) + 'Z', class: 'f-acc', 'fill-opacity': 0.14 }, gC);
          S('path', { d: pathOf(path.map((d, i) => [cv.x(lx[i]), cv.y(Math.min(d.cv, 3800))])), fill: 'none', class: 's-acc', 'stroke-width': 2 }, gC);
          S('circle', { cx: cv.x(lx[mi]), cy: cv.y(path[mi].cv), r: 6, class: 'f-good' }, gC);
          S('line', { x1: cv.x(lx[0]), x2: cv.x(lx[lx.length - 1]), y1: cv.y(path[mi].cv + path[mi].se), y2: cv.y(path[mi].cv + path[mi].se), class: 's-good', 'stroke-dasharray': '4 4', 'stroke-opacity': 0.7 }, gC);
          S('circle', { cx: cv.x(lx[one]), cy: cv.y(path[one].cv), r: 6, class: 'f-acc' }, gC);
        }
        clear(gM); clear(gCm); const d = path[idx];
        S('line', { x1: pl.x(lx[idx]), x2: pl.x(lx[idx]), y1: pl.y(-2500), y2: pl.y(1300), class: 's-ink', 'stroke-dasharray': '4 3' }, gM);
        S('line', { x1: cv.x(lx[idx]), x2: cv.x(lx[idx]), y1: cv.y(1300), y2: cv.y(3800), class: 's-ink', 'stroke-dasharray': '4 3' }, gCm);
        S('circle', { cx: cv.x(lx[idx]), cy: cv.y(Math.min(d.cv, 3800)), r: 7, class: 'f-hl s-ink' }, gCm);
        coefBars(bars, names, d.coef, ols, -2500, 1300, colOf, n => TOY_NAMES[n] || n);
        tiles.set('nz', d.coef.filter(v => v !== 0).length + ' av 11', d.coef.some(v => v === 0) ? 'hl' : '');
        tiles.set('cv', fint(d.cv) + ' ± ' + fint(d.se) + ' €'); tiles.set('va', fint(d.rmse) + ' €'); tiles.set('ols', fint(DATA.olsStdRMSE) + ' €');
      }
      draw(true);
    },
    tryit: ['Trykk «Minste CV-feil» for lasso. Det beste er nesten ingen straff: med 600 biler og bare 11 variabler er det lite å tjene på å krympe.', 'Trykk «1-SE-regelen». Lassoen beholder bare fire variabler, mens CV-feilen er nesten like lav. En enklere modell som er nesten like god, er ofte å foretrekke.', 'Bytt til ridge. Kurvene går mot null, men ingen blir nøyaktig null.', 'Elastic net beholder alle variablene mye lenger enn lasso, fordi ridge-delen krymper alt samtidig.']
  }, {
    title: 'Korrelerte variabler: lasso velger, ridge deler',
    sub: 'Simulerte data: 200 datapunkter der y = x₁ + x₂ + støy, og x₁ og x₂ er korrelerte. Begge variablene er like viktige. Se hvordan de tre metodene fordeler vekten mellom dem når straffen øker.',
    build(el) {
      let rho = 0.97, li = 30;
      const lams = range(61, i => Math.pow(10, -2.5 + i * 3.2 / 60));
      const ctl = Controls(el);
      Slider(ctl, { label: 'Korrelasjon ρ', min: 0, max: 0.99, step: 0.01, value: rho, fmt: v => fx(v, 2), oninput: v => { rho = v; compute(); draw(true); } });
      const sl = Slider(ctl, { label: 'Straff λ', min: 0, max: 60, value: li, fmt: i => fx(lams[i], lams[i] < 0.1 ? 3 : 2), oninput: v => { li = v; draw(); } });
      const row = H('div', { class: 'cols', style: 'grid-template-columns:repeat(auto-fit,minmax(220px,1fr))' }); el.append(row);
      const M = [['ridge', 'Ridge', 0], ['lasso', 'Lasso', 1], ['enet', 'Elastic net', 0.5]];
      const panels = M.map(([k, name]) => { const w = H('div'); row.append(w); const p = new Plot(w, { w: 260, h: 230, m: { t: 22, r: 8, b: 40, l: 40 }, x: [-2.5, 0.7], y: [-0.2, 1.6], xticks: [-2, -1, 0], xlab: 'log₁₀(λ)', label: name }); S('text', { x: 44, y: 14, class: 'lbl', text: name, style: 'font-size:13px;font-weight:600' }, p.gTop); return { p, g: p.layer(), m: p.layer() }; });
      const tiles = Tiles(el, M.map(([k, name]) => [k, name + ': β₁ / β₂']));
      el.append(H('p', { class: 'note', html: 'Linjer: <b style="color:var(--c1)">β₁</b> og <b style="color:var(--c4)">β₂</b>. Uten straff er begge omtrent 1.' }));
      let paths;
      function compute() {
        const r = RNG(77), n = 200, x1 = [], x2 = [], y = [];
        for (let i = 0; i < n; i++) { const z = r.n(), e = r.n(); x1.push(z); x2.push(rho * z + Math.sqrt(1 - rho * rho) * e); }
        const st = v => { const m = mean(v), s0 = Math.sqrt(mean(v.map(t => (t - m) ** 2))); return v.map(t => (t - m) / s0); };
        const Z1 = st(x1), Z2 = st(x2); for (let i = 0; i < n; i++) y.push(x1[i] + x2[i] + r.n()); const my = mean(y), yc = y.map(t => t - my);
        const g12 = mean(Z1.map((v, i) => v * Z2[i])), c1 = mean(Z1.map((v, i) => v * yc[i])), c2 = mean(Z2.map((v, i) => v * yc[i]));
        const stt = (v, t) => Math.sign(v) * Math.max(Math.abs(v) - t, 0);
        paths = M.map(([k, name, rr]) => { let b1 = 0, b2 = 0; return lams.slice().reverse().map(l => { for (let it = 0; it < 300; it++) { const o1 = b1, o2 = b2; b1 = stt(c1 - g12 * b2, l * rr) / (1 + l * (1 - rr)); b2 = stt(c2 - g12 * b1, l * rr) / (1 + l * (1 - rr)); if (Math.abs(b1 - o1) + Math.abs(b2 - o2) < 1e-10) break; } return [b1, b2]; }).reverse(); });
      }
      function draw() {
        panels.forEach((pn, k) => {
          const X = pn.p.x, Y = pn.p.y, P0 = paths[k]; clear(pn.g); clear(pn.m);
          S('line', { x1: X(-2.5), x2: X(0.7), y1: Y(0), y2: Y(0), class: 's-mut' }, pn.g);
          [0, 1].forEach(j => S('path', { d: pathOf(lams.map((l, i) => [X(Math.log10(l)), Y(clamp(P0[i][j], -0.2, 1.6))])), fill: 'none', class: j ? 's-c4' : 's-c1', 'stroke-width': 2.4, 'stroke-dasharray': j ? '6 3' : null }, pn.g));
          S('line', { x1: X(Math.log10(lams[li])), x2: X(Math.log10(lams[li])), y1: Y(-0.2), y2: Y(1.6), class: 's-ink', 'stroke-dasharray': '3 3' }, pn.m);
          tiles.set(M[k][0], fx(P0[li][0], 2) + ' / ' + fx(P0[li][1], 2));
        });
      }
      compute(); draw();
    },
    tryit: ['Med ρ = 0,97 deler ridge vekten mellom x₁ og x₂: når straffen øker, smelter de to kurvene sammen.', 'Lasso gjør det motsatte. Den ene koeffisienten holder seg oppe mens den andre krymper, og den andre blir null lenge før den første (fra λ ≈ 1,4). Hvilken som «vinner», avhenger av tilfeldigheter i dataene.', 'Elastic net oppfører seg som ridge her og holder de korrelerte variablene sammen, men kan fortsatt sette begge til null når straffen blir stor nok. Det er grunnen til at elastic net finnes.', 'Sett ρ = 0. Da behandles x₁ og x₂ omtrent likt av alle tre metodene, og lasso setter begge til null nesten samtidig.']
  }, {
    title: 'Regularisert logistisk regresjon: C = 1/λ',
    sub: 'Logistisk regresjon på bankkundedataene med alle 11 forklaringsvariablene standardisert. I scikit-learn styres straffen med C, som er det omvendte av λ: liten C betyr stor straff. Læreboka skriver C = 1e42 for å skru straffen av.',
    build(el) {
      const L = DATA.ubLogiPath, names = DATA.ubCols, nop = DATA.ubLogiNoPen;
      const top = nop.coef.map((v, i) => [Math.abs(v), i]).sort((p, q) => q[0] - p[0]).slice(0, 5).map(t => t[1]);
      const colOf = i => { const j = top.indexOf(i); return j < 0 ? 'mut' : 'c' + j; };
      const all = L.flatMap(d => d.l1.concat(d.l2)).concat(nop.coef), lo = Math.min(-0.5, ...all) - 0.1, hi = Math.max(...all) + 0.1;
      let pen = 'l1', idx = 12, noPen = false;
      const ctl = Controls(el);
      Seg(ctl, { label: 'Straff', options: [['l1', 'L1 (lasso)'], ['l2', 'L2 (ridge)']], value: pen, onchange: v => { pen = v; draw(); } });
      const sl = Slider(ctl, { label: 'C', min: 0, max: L.length - 1, value: idx, fmt: i => { const C = L[Math.min(i, L.length - 1)].C; return C < 0.1 ? String(C).replace('.', ',') : fx(C, 2).replace('.', ','); }, oninput: v => { idx = v; noPen = false; draw(); } });
      Btn(ctl, 'Ingen straff (C = 1e42)', () => { noPen = true; draw(); });
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const bars = S('svg', { viewBox: '0 0 360 300', class: 'plot', role: 'img', 'aria-label': 'Koeffisienter i logistisk regresjon' }); a.append(bars);
      a.append(H('p', { class: 'note', html: 'Koeffisientene er i logit per standardavvik. Den tynne streken er koeffisienten uten straff.' }));
      const pa = new Plot(b, { w: 380, h: 250, x: [-3, 1], y: [0.89, 0.96], xticks: [-3, -2, -1, 0, 1], xlab: 'log₁₀(C)', ylab: 'Nøyaktighet (validering)', label: 'Nøyaktighet mot C', yfmt: v => fx(100 * v, 0) + ' %' });
      for (const [k, cl] of [['l1acc', 'c0'], ['l2acc', 'c4']]) S('path', { d: pathOf(L.map(d => [pa.x(Math.log10(d.C)), pa.y(d[k])])), fill: 'none', class: 's-' + cl, 'stroke-width': 2.2 }, pa.gData);
      S('line', { x1: pa.x(-3), x2: pa.x(1), y1: pa.y(0.9035), y2: pa.y(0.9035), class: 's-mut', 'stroke-dasharray': '5 4' }, pa.gData);
      S('text', { x: pa.x(0.95), y: pa.y(0.9035) - 6, 'text-anchor': 'end', text: 'alltid «nei»: 90,35 %', style: 'font-size:11px' }, pa.gData);
      const mk = S('circle', { r: 7, class: 'f-hl s-ink' }, pa.gTop);
      const tiles = Tiles(b, [['c', 'C'], ['lam', 'λ = 1/C'], ['nz', 'Variabler ≠ 0'], ['acc', 'Nøyaktighet']]);
      b.append(H('p', { class: 'note', html: 'Linjer: <b style="color:var(--c0)">L1</b> og <b style="color:var(--c4)">L2</b>.' }));
      function draw() {
        const d = L[idx], coef = noPen ? nop.coef : d[pen], acc = noPen ? nop.acc : d[pen + 'acc'];
        coefBars(bars, names, coef, nop.coef, lo, hi, colOf);
        mk.setAttribute('cx', pa.x(noPen ? 1 : Math.log10(d.C))); mk.setAttribute('cy', pa.y(clamp(acc, 0.89, 0.96)));
        tiles.set('c', noPen ? '10⁴²' : String(d.C).replace('.', ',')); tiles.set('lam', noPen ? '≈ 0' : fx(1 / d.C, 1 / d.C < 10 ? 2 : 0));
        tiles.set('nz', coef.filter(v => v !== 0).length + ' av 11', coef.some(v => v === 0) ? 'hl' : ''); tiles.set('acc', fpct(acc, 2));
      }
      draw();
    },
    tryit: ['Velg L1 og dra C helt ned. Ved C = 0,001 er alle koeffisientene null, og modellen sier «nei» til alle. Det gir 90,35 % nøyaktighet, fordi bare 9,6 % takker ja.', 'Øk C gradvis med L1. Income kommer inn først, så CD Account, Education og CCAvg. Det er variablene lassoen anser som viktigst.', 'Trykk «Ingen straff». Det er dette læreboka gjør med C = 1e42: λ blir så liten at det i praksis er vanlig logistisk regresjon.']
  }],
  body: `
<h2>Hvorfor straffe store koeffisienter?</h2>
<p>Minste kvadrater velger koeffisientene som passer treningsdataene best. Med mange variabler, sterkt korrelerte variabler eller få datapunkter per variabel blir koeffisientene ustabile: små endringer i dataene gir store utslag. Regularisering trekker koeffisientene mot null. Det gir litt mer bias, men mye mindre varians, og bedre prediksjoner på nye data når variansen var problemet.</p>
<h2>De tre straffene</h2>
<div class="formula">Ridge (L2): minimer SSE + λ Σ β<sub>j</sub>²<br>Lasso (L1): minimer SSE + λ Σ |β<sub>j</sub>|<br>Elastic net: minimer SSE + λ [<span class="v">r</span> Σ |β<sub>j</sub>| + (1 − <span class="v">r</span>)/2 · Σ β<sub>j</sub>²]</div>
<ul>
<li><b>λ = 0</b> gir vanlig minste kvadrater. <b>Når λ blir svært stor</b>, går alle koeffisientene mot null, og modellen predikerer bare gjennomsnittet av Y.</li>
<li><b>Ridge</b> krymper alle koeffisientene, men setter ingen til null. Den deler vekten mellom korrelerte variabler.</li>
<li><b>Lasso</b> kan sette koeffisienter til nøyaktig null, og velger dermed variabler. Blant sterkt korrelerte variabler velger den gjerne én og dropper resten.</li>
<li><b>Elastic net</b> blander de to. <span class="v">r</span> (<code>l1_ratio</code>) styrer blandingen: 1 er lasso, 0 er ridge. Den velger variabler, men holder korrelerte variabler sammen.</li>
<li>Konstantleddet β<sub>0</sub> straffes ikke.</li>
</ul>
<h2>Praktisk oppskrift</h2>
<ol>
<li><b>Standardiser</b> forklaringsvariablene (z-score, tilpasset på treningsdataene). Ellers avhenger straffen av måleenheten: en koeffisient for kilometer ville vært billig, en for antall dører dyr.</li>
<li><b>Velg λ med kryssvalidering</b> (<code>RidgeCV</code>, <code>LassoCV</code>, <code>ElasticNetCV</code>). Enten λ med lavest CV-feil, eller med <b>1-SE-regelen</b>: den største λ der CV-feilen er innenfor ett standardavvik fra den laveste. Den gir en enklere modell som er omtrent like god.</li>
<li><b>Evaluer</b> den valgte modellen på valideringssettet eller et testsett som ikke ble brukt til å velge λ.</li>
</ol>
<h2>Variantene du bør kjenne</h2>
<div class="tblwrap"><table class="tbl">
<tr><th class="l">Variant</th><th class="l">Straff</th><th class="l">I scikit-learn</th><th class="l">Velger variabler?</th></tr>
<tr><td class="l">Ridge</td><td class="l">L2</td><td class="l"><code>Ridge(alpha=…)</code>, <code>RidgeCV</code></td><td class="l">Nei</td></tr>
<tr><td class="l">Lasso</td><td class="l">L1</td><td class="l"><code>Lasso(alpha=…)</code>, <code>LassoCV</code></td><td class="l">Ja</td></tr>
<tr><td class="l">Elastic net</td><td class="l">L1 + L2</td><td class="l"><code>ElasticNet(alpha=…, l1_ratio=…)</code>, <code>ElasticNetCV</code></td><td class="l">Ja, men beholder grupper av korrelerte variabler</td></tr>
<tr><td class="l">Regularisert logistisk regresjon</td><td class="l">L1, L2 eller begge</td><td class="l"><code>LogisticRegression(penalty='l1', C=…)</code>, der C = 1/λ</td><td class="l">Med L1: ja</td></tr>
<tr><td class="l">L2-regularisering i nevrale nettverk (weight decay)</td><td class="l">L2</td><td class="l">For eksempel <code>kernel_regularizer</code> i Keras</td><td class="l">Nei</td></tr>
</table></div>
<p>scikit-learn kaller straffen <code>alpha</code> i <code>Ridge</code>, <code>Lasso</code> og <code>ElasticNet</code>. I <code>Lasso</code> og <code>ElasticNet</code> er SSE delt på 2<i>n</i>, i <code>Ridge</code> ikke. Derfor kan ikke tallverdiene sammenlignes direkte mellom klassene. I <code>LogisticRegression</code> heter det <code>C</code>, og det virker motsatt vei: liten C er sterk straff. Standardverdien er <code>C=1.0</code> med L2-straff, så logistisk regresjon i scikit-learn er litt regularisert hvis du ikke endrer C.</p>
<div class="pros">
<div><h3>Styrker</h3><ul><li>Bedre prediksjoner når det er mange eller korrelerte variabler</li><li>Lasso og elastic net velger variabler automatisk</li><li>Fungerer også når det er flere variabler enn datapunkter</li></ul></div>
<div><h3>Svakheter</h3><ul><li>Koeffisientene er bevisst skjeve mot null og kan ikke tolkes som vanlige effekter</li><li>Krever standardisering og valg av λ</li><li>Lassoens valg blant korrelerte variabler kan være tilfeldig</li></ul></div>
</div>
<div class="pit"><b>Eksamensfelle: retningen på straffen</b>Større λ (<code>alpha</code>) betyr sterkere straff og enklere modell. Større C betyr <i>svakere</i> straff. Og det er lasso, ikke ridge, som kan gi koeffisienter lik 0.</div>
<div class="pit"><b>Eksamensfelle: hvorfor lasso gir nuller</b>Begrensningsområdet til lasso er en rute med hjørner på aksene. SSE-ellipsene treffer ofte et hjørne, og der er en koeffisient null. Sirkelen til ridge har ingen hjørner.</div>
<h2>Python</h2>
<pre><code>from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import RidgeCV, LassoCV, ElasticNetCV, LogisticRegression
import numpy as np

# train_X, train_y: bruktbildataene (Toyota Corolla), Y = Price
# standardiser først (straffen krever lik skala), så lasso der 5-fold CV velger alpha
lasso = make_pipeline(StandardScaler(), LassoCV(cv=5, random_state=1)).fit(train_X, train_y)
# lasso[-1] = siste steg i pipelinen, selve lassoen
print('valgt alpha:', lasso[-1].alpha_)
print(pd.Series(lasso[-1].coef_, index=train_X.columns))      # noen er 0

# ridge: prøv 50 alpha-verdier fra 0,1 til 10 000
ridge = make_pipeline(StandardScaler(), RidgeCV(alphas=np.logspace(-1, 4, 50))).fit(train_X, train_y)
# elastic net: CV velger både alpha og blandingen l1_ratio
enet = make_pipeline(StandardScaler(), ElasticNetCV(l1_ratio=[0.2, 0.5, 0.8], cv=5)).fit(train_X, train_y)

# logistisk regresjon med lasso-straff (C = 1/lambda, så liten C = sterk straff)
logit_l1 = make_pipeline(StandardScaler(),
                         LogisticRegression(penalty='l1', C=0.05, solver='liblinear')).fit(train_X, train_y)
# som i læreboka: i praksis ingen straff
logit_plain = LogisticRegression(penalty='l2', C=1e42, solver='liblinear')</code></pre>`
});
