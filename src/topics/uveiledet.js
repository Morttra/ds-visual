/* Uveiledet læring: hierarkisk klyngeanalyse, k-means og PCA */

const LINK = { single: 'Single (min)', complete: 'Complete (maks)', average: 'Average (snitt)', centroid: 'Sentroide' };
function clusterDist(A, B, P, link) {
  if (link === 'centroid') { const ca = [mean(A.map(i => P[i][0])), mean(A.map(i => P[i][1]))], cb = [mean(B.map(i => P[i][0])), mean(B.map(i => P[i][1]))]; return dist2(ca, cb); }
  const ds = []; for (const i of A) for (const j of B) ds.push(dist2(P[i], P[j]));
  return link === 'single' ? Math.min(...ds) : link === 'complete' ? Math.max(...ds) : mean(ds);
}
function hclust(P, link) {
  let cl = P.map((_, i) => ({ id: i, m: [i] })); const merges = []; let next = P.length;
  while (cl.length > 1) {
    let best = null;
    for (let a = 0; a < cl.length; a++) for (let b = a + 1; b < cl.length; b++) { const d = clusterDist(cl[a].m, cl[b].m, P, link); if (!best || d < best.d - 1e-12) best = { a, b, d }; }
    const A = cl[best.a], B = cl[best.b], C = { id: next++, m: A.m.concat(B.m), L: A, R: B, d: best.d };
    merges.push(C); cl = cl.filter((_, i) => i !== best.a && i !== best.b).concat([C]);
  }
  return merges;
}
function clustersAt(n, merges, steps) { let cl = range(n, i => ({ id: i, m: [i] })); for (const C of merges.slice(0, steps)) cl = cl.filter(c => c.id !== C.L.id && c.id !== C.R.id).concat([C]); return cl; }
function leafOrder(root) { return root.L ? leafOrder(root.L).concat(leafOrder(root.R)) : [root.id]; }
function drawDendro(svg, n, merges, steps, names, colorOf, cut) {
  clear(svg); const W = +svg.getAttribute('data-w'), Hh = +svg.getAttribute('data-h');
  const root = merges[merges.length - 1], order = leafOrder(root), maxD = Math.max(...merges.map(m => m.d)) * 1.08;
  const x = id => 44 + order.indexOf(id) * (W - 110) / Math.max(1, n - 1), y = d => Hh - 74 - d / maxD * (Hh - 96);
  S('line', { x1: 32, x2: 32, y1: y(0), y2: y(maxD), class: 's-mut' }, svg);
  niceTicks(0, maxD, 4).forEach(t => { S('text', { x: 28, y: y(t) + 4, 'text-anchor': 'end', text: tickFmt(t), style: 'font-size:11px' }, svg); S('line', { x1: 32, x2: W - 10, y1: y(t), y2: y(t), class: 's-line' }, svg); });
  const pos = new Map(); range(n, i => pos.set(i, [x(i), y(0)]));
  merges.forEach((C, k) => { const a = pos.get(C.L.id), b = pos.get(C.R.id), yy = y(C.d), done = k < steps; pos.set(C.id, [(a[0] + b[0]) / 2, yy]);
    S('path', { d: `M${a[0]} ${a[1]}V${yy}H${b[0]}V${b[1]}`, fill: 'none', class: done ? 's-ink' : 's-line', 'stroke-width': done ? 2 : 1.2, 'stroke-dasharray': done ? null : '3 3' }, svg); });
  range(n, i => S('text', { x: 0, y: 0, transform: `translate(${x(i) + 3} ${y(0) + 9}) rotate(40)`, class: 'lbl', text: names[i], style: 'font-size:11px;' + (colorOf ? 'fill:' + colorOf(i) : '') }, svg));
  if (cut != null) { S('line', { x1: 32, x2: W - 10, y1: y(cut), y2: y(cut), class: 's-bad', 'stroke-width': 2, 'stroke-dasharray': '6 4' }, svg); S('text', { x: W - 12, y: y(cut) - 6, 'text-anchor': 'end', class: 'f-bad', text: 'kutt', style: 'font-size:11px' }, svg); }
}
function zUtilities() {
  const U = DATA.utilities, S0 = U.map(u => u[1]), F0 = U.map(u => u[2]), ms = mean(S0), ss = sd(S0), mf = mean(F0), sf = sd(F0);
  return U.map(u => ({ name: u[0].trim(), p: [(u[1] - ms) / ss, (u[2] - mf) / sf] }));
}

topic({
  id: 'hierarkisk-klynging', data: [['utilities']], short: 'Hierarkisk klyngeanalyse', lecture: 'F10', tags: ['Uveiledet', 'Avstandsmatrise', 'Dendrogram'],
  title: 'Hierarkisk klyngeanalyse',
  path: ['Uveiledet læring', 'Klyngeanalyse og PCA'],
  lead: 'Hierarkisk klyngeanalyse starter med hvert punkt som sin egen klynge, og slår sammen de to nærmeste klyngene igjen og igjen. Resultatet er et dendrogram som viser hele historien. Hvordan vi måler avstand mellom klynger (linkage), kan gi helt ulike svar.',
  figs: [{
    title: 'Steg for steg med avstandsmatrise',
    sub: 'Sju av de 22 kraftselskapene, beskrevet med årlig strømsalg (Sales) og brenselkostnad (Fuel_Cost), begge normalisert som z-score over alle 22 selskapene. Den laveste avstanden i matrisen (markert) slås sammen i neste steg.',
    build(el) {
      const all = zUtilities(), pick = ['Nevada', 'Puget', 'Idaho', 'NY', 'San Diego', 'New England', 'Madison'], U = pick.map(n => all.find(u => u.name === n)), P = U.map(u => u.p), names = U.map(u => u.name);
      let link = 'single', step = 0, merges = hclust(P, link);
      const ctl = Controls(el);
      Seg(ctl, { label: 'Linkage', options: Object.entries(LINK), value: link, onchange: v => { link = v; merges = hclust(P, link); draw(); } });
      const ss = Slider(ctl, { label: 'Sammenslåinger', min: 0, max: 6, value: 0, oninput: v => { step = v; draw(); } });
      Btn(ctl, 'Neste', () => ss.set(Math.min(6, step + 1)), 'primary');
      const cols = H('div', { class: 'cols even' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const plot = new Plot(a, { w: 400, h: 330, x: [-2, 3], y: [-2, 2.3], xlab: 'Sales (z)', ylab: 'Fuel_Cost (z)', label: 'Selskapene og klyngene' });
      const gC = plot.layer(), gP = plot.layer();
      const tw = H('div', { class: 'tblwrap' }), info = H('p', { class: 'mini' }); b.append(info, tw);
      const dsvg = S('svg', { viewBox: '0 0 760 260', 'data-w': 760, 'data-h': 260, class: 'plot', role: 'img', 'aria-label': 'Dendrogram' }); el.append(dsvg);
      const colOf = c => 'var(--c' + (c % 6) + ')';
      function draw() {
        const cl = clustersAt(P.length, merges, step), cid = new Map(); cl.forEach((c, k) => c.m.forEach(i => cid.set(i, k)));
        clear(gC); clear(gP); const X = plot.x, Y = plot.y;
        cl.forEach((c, k) => { if (c.m.length > 1) for (const i of c.m) for (const j of c.m) if (i < j) S('line', { x1: X(P[i][0]), y1: Y(P[i][1]), x2: X(P[j][0]), y2: Y(P[j][1]), stroke: colOf(k), 'stroke-width': 6, 'stroke-opacity': 0.25, 'stroke-linecap': 'round' }, gC); });
        P.forEach((p, i) => S('circle', { cx: X(p[0]), cy: Y(p[1]), r: 6, fill: colOf(cid.get(i)) }, gP));
        placeLabels(gP, P.map((p, i) => ({ x: X(p[0]), y: Y(p[1]), text: names[i] })));
        const lab = c => c.m.map(i => names[i]).join(' + ');
        let mn = null; for (let i = 0; i < cl.length; i++) for (let j = i + 1; j < cl.length; j++) { const d = clusterDist(cl[i].m, cl[j].m, P, link); if (!mn || d < mn[0] - 1e-12) mn = [d, i, j]; }
        clear(tw).append(H('table', { class: 'tbl', style: 'font-size:.8rem' }, H('tr', {}, H('th', {}), cl.map(c => H('th', { style: 'white-space:normal;max-width:90px' }, lab(c)))),
          cl.map((c, i) => H('tr', {}, H('th', { class: 'l', style: 'white-space:normal;max-width:110px' }, lab(c)), cl.map((c2, j) => { const d = i === j ? 0 : clusterDist(c.m, c2.m, P, link); return H('td', { class: mn && ((i === mn[1] && j === mn[2]) || (i === mn[2] && j === mn[1])) ? 'hit' : '' }, i === j ? '0' : fx(d, 2)); })))));
        info.textContent = mn ? `Neste: ${lab(cl[mn[1]])} slås sammen med ${lab(cl[mn[2]])} ved avstand ${fx(mn[0], 2)}.` : 'Alle selskapene er i én klynge.';
        drawDendro(dsvg, P.length, merges, step, names, null, null);
      }
      draw();
    },
    tryit: ['Trykk «Neste» fire ganger med single linkage. San Diego og New England slås sammen først (0,13), så Nevada og Puget (0,49).', 'Gå til steg 5 og bytt mellom single og complete linkage. Madison havner hos Idaho-gruppa med single linkage, men hos NY-gruppa med complete.', 'Se på tallene i matrisen etter en sammenslåing: med single linkage er avstanden til den nye klyngen minimum av de to gamle avstandene, med complete er den maksimum.']
  }, {
    title: 'Klipp dendrogrammet',
    sub: 'Alle 22 selskapene. Der du klipper treet, bestemmer hvor mange klynger du får. Klynger som slås sammen høyt oppe, er langt fra hverandre.',
    build(el) {
      const U = zUtilities(), P = U.map(u => u.p), names = U.map(u => u.name);
      let link = 'average', merges = hclust(P, link), cut = 1.6;
      const ctl = Controls(el);
      Seg(ctl, { label: 'Linkage', options: Object.entries(LINK), value: link, onchange: v => { link = v; merges = hclust(P, link); cs.setMax(Math.ceil(Math.max(...merges.map(m => m.d)) * 10) / 10); draw(); } });
      const cs = Slider(ctl, { label: 'Klipp ved høyde', min: 0, max: Math.ceil(Math.max(...merges.map(m => m.d)) * 10) / 10, step: 0.05, value: cut, fmt: v => fx(v, 2), oninput: v => { cut = v; draw(); } });
      const tiles = Tiles(ctl, [['k', 'Antall klynger']]); tiles.el.style.minWidth = '160px';
      const dsvg = S('svg', { viewBox: '0 0 760 320', 'data-w': 760, 'data-h': 320, class: 'plot', role: 'img', 'aria-label': 'Dendrogram for alle 22 selskapene' }); el.append(dsvg);
      const plot = new Plot(el, { w: 760, h: 320, x: [-2, 3], y: [-1.8, 2.2], xlab: 'Sales (z)', ylab: 'Fuel_Cost (z)', label: 'Selskapene farget etter klynge' });
      const gP = plot.layer();
      function draw() {
        const steps = merges.filter(m => m.d <= cut).length, cl = clustersAt(P.length, merges, steps), cid = new Map();
        cl.sort((p, q) => Math.min(...p.m) - Math.min(...q.m)).forEach((c, k) => c.m.forEach(i => cid.set(i, k)));
        const col = i => cl.length > 8 ? 'var(--muted)' : 'var(--c' + (cid.get(i) % 6) + ')';
        drawDendro(dsvg, P.length, merges, steps, names, col, cut);
        clear(gP); P.forEach((p, i) => S('circle', { cx: plot.x(p[0]), cy: plot.y(p[1]), r: 6, style: 'fill:' + col(i) }, gP));
        placeLabels(gP, P.map((p, i) => ({ x: plot.x(p[0]), y: plot.y(p[1]), text: names[i] })), 11);
        tiles.set('k', String(cl.length));
      }
      draw();
    },
    tryit: ['Dra klippehøyden ned og se klyngene dele seg. Hvert hopp i antall skjer der linjen krysser en vannrett strek i dendrogrammet.', 'Sammenlign single og complete linkage. Single linkage lager gjerne lange kjeder, complete gir mer kompakte grupper.']
  }, {
    title: 'Likhet for binære variabler',
    sub: 'To kunder og åtte ja/nei-variabler (har kjøpt produktet eller ikke). Trykk på en rute for å endre den.',
    build(el) {
      const prods = ['Brød', 'Melk', 'Kaffe', 'Ost', 'Vin', 'Bleier', 'Sushi', 'Kaviar'], A = [1, 1, 1, 0, 0, 0, 0, 0], B = [1, 0, 1, 0, 0, 1, 0, 0];
      const grid = H('div', { class: 'tblwrap' }); el.append(grid);
      const tiles = Tiles(el, [['a', 'a: begge 1'], ['bc', 'b + c: ulike'], ['d', 'd: begge 0'], ['m', 'Matching (a + d) / p'], ['j', 'Jaccard a / (a + b + c)']]);
      function draw() {
        const btn = (arr, i) => { const b = H('button', { type: 'button', class: 'btn' + (arr[i] ? ' primary' : ''), style: 'min-width:2.6em', 'aria-pressed': String(!!arr[i]) }, arr[i] ? '1' : '0'); b.addEventListener('click', () => { arr[i] = 1 - arr[i]; draw(); }); return b; };
        clear(grid).append(H('table', { class: 'tbl' }, H('tr', {}, H('th', {}), prods.map(p => H('th', {}, p))), H('tr', {}, H('th', { class: 'l' }, 'Kunde 1'), prods.map((_, i) => H('td', {}, btn(A, i)))), H('tr', {}, H('th', { class: 'l' }, 'Kunde 2'), prods.map((_, i) => H('td', {}, btn(B, i))))));
        const a = sum(A.map((v, i) => v && B[i] ? 1 : 0)), d = sum(A.map((v, i) => !v && !B[i] ? 1 : 0)), bc = 8 - a - d;
        tiles.set('a', String(a)); tiles.set('bc', String(bc)); tiles.set('d', String(d)); tiles.set('m', fx((a + d) / 8, 3)); tiles.set('j', a + bc ? fx(a / (a + bc), 3) : '–');
      }
      draw();
    },
    tryit: ['Med startverdiene er matching 0,75 men Jaccard bare 0,5. Matching teller med alle produktene ingen av dem kjøpte.', 'Når 1-ere er sjeldne (få kjøp av mange produkter), sier felles 0-ere lite. Da er Jaccard det riktige målet.']
  }],
  body: `
<h2>Avstand mellom punkter</h2>
<ul>
<li><b>Euklidsk:</b> √Σ(x<sub>j</sub> − u<sub>j</sub>)². Den vanlige, «rett linje».</li>
<li><b>Manhattan:</b> Σ|x<sub>j</sub> − u<sub>j</sub>|. Summen av avstandene langs hver akse, mindre følsom for én stor forskjell.</li>
<li><b>Normaliser først</b> (z-score). Ellers bestemmer variabelen med størst tall alt. I kraftselskapdataene er Sales tall i tusener, mens Fuel_Cost ligger rundt 1.</li>
<li><b>Binære variabler:</b> matching-koeffisient (a + d) / p eller Jaccard a / (a + b + c), der a = begge 1, d = begge 0 og b + c = ulike.</li>
</ul>
<h2>Avstand mellom klynger (linkage)</h2>
<div class="tblwrap"><table class="tbl">
<tr><th class="l">Linkage</th><th class="l">Avstand mellom klynge A og B</th><th class="l">Typisk resultat</th></tr>
<tr><td class="l">Single linkage</td><td class="l">Minste avstand mellom et punkt i A og et i B</td><td class="l">Lange, kjedeaktige klynger</td></tr>
<tr><td class="l">Complete linkage</td><td class="l">Største avstand mellom et punkt i A og et i B</td><td class="l">Kompakte klynger av lik størrelse</td></tr>
<tr><td class="l">Average linkage</td><td class="l">Snitt av alle avstander mellom A og B</td><td class="l">Et kompromiss</td></tr>
<tr><td class="l">Sentroide (centroid)</td><td class="l">Avstand mellom gjennomsnittspunktene i A og B</td><td class="l">Intuitivt, men kan gi inversjoner</td></tr>
<tr><td class="l">Ward</td><td class="l">Økningen i variasjon innad i klyngene ved sammenslåing</td><td class="l">Kompakte klynger, ligner k-means</td></tr>
</table></div>
<h2>Algoritmen</h2>
<ol>
<li>Start med n klynger, én per punkt, og regn ut avstandsmatrisen.</li>
<li>Slå sammen de to klyngene med minst avstand.</li>
<li>Oppdater avstandsmatrisen med valgt linkage.</li>
<li>Gjenta til alt er én klynge. Dendrogrammet viser rekkefølgen og avstandene.</li>
</ol>
<div class="pros">
<div><h3>Styrker</h3><ul><li>Trenger ikke velge antall klynger på forhånd</li><li>Dendrogrammet viser struktur på alle nivåer</li><li>Fungerer med alle avstandsmål</li></ul></div>
<div><h3>Svakheter</h3><ul><li>Tregt for store datasett (avstandsmatrisen er n × n)</li><li>En sammenslåing kan aldri angres</li><li>Følsom for utstikkere og valg av linkage</li></ul></div>
</div>
<div class="pit"><b>Eksamensfelle: oppdater matrisen riktig</b>Etter at A og B er slått sammen, er avstanden fra AB til C: min(d(A,C), d(B,C)) med single linkage, maks(d(A,C), d(B,C)) med complete linkage. Med average må du snitte over alle punktparene, ikke bare de to tallene.</div>
<h2>Python</h2>
<pre><code>from scipy.cluster.hierarchy import linkage, dendrogram, fcluster
from sklearn.metrics import pairwise

utilities_df_norm = (utilities_df - utilities_df.mean()) / utilities_df.std()   # z-score per kolonne
# avstand mellom alle par av selskaper
d_norm = pairwise.pairwise_distances(utilities_df_norm, metric='euclidean')

# slår sammen de to nærmeste klyngene steg for steg; method kan også være 'complete', 'average', 'centroid', 'ward'
Z = linkage(utilities_df_norm, method='single')
# tegn treet; klynger under høyde 2,75 får egen farge
dendrogram(Z, labels=utilities_df_norm.index, color_threshold=2.75)
memb = fcluster(Z, 6, criterion='maxclust')             # kutt treet så det blir 6 klynger</code></pre>`
});

topic({
  id: 'k-means', dataNote: 'Figuren bruker <b>simulerte data</b>: 180 punkter trukket rundt fire sentre. Python-koden nederst bruker <a href="#datasett-utilities">kraftselskapdataene</a>, som i læreboka.', short: 'k-means', lecture: 'F10', tags: ['Uveiledet', 'Klyngeanalyse'],
  title: 'k-means klyngeanalyse',
  path: ['Uveiledet læring', 'Klyngeanalyse og PCA'],
  lead: 'k-means deler dataene i k klynger ved å veksle mellom to steg: tildel hvert punkt til nærmeste sentroide, og flytt hver sentroide til gjennomsnittet av punktene sine. Det gjentas til ingenting endrer seg.',
  figs: [{
    title: 'k-means steg for steg',
    sub: '180 simulerte punkter fra fire grupper. Sentroidene starter i tilfeldige datapunkter. Trykk «Ett steg» for å se tildeling og oppdatering hver for seg.',
    build(el) {
      const D = blobs(RNG(8), [[0.25, 0.72], [0.72, 0.78], [0.3, 0.25], [0.76, 0.3]], 45, 0.085).map(p => [clamp(p[0], 0.02, 0.98), clamp(p[1], 0.02, 0.98)]);
      let k = 4, seed = 1, C, asg, phase, it, trail, done;
      const inertia = (cs, as) => sum(D.map((p, i) => dist2(p, cs[as[i]]) ** 2));
      const assign = cs => D.map(p => { let b = 0; cs.forEach((c, j) => { if (dist2(p, c) < dist2(p, cs[b])) b = j; }); return b; });
      const update = (cs, as) => cs.map((c, j) => { const m = D.filter((_, i) => as[i] === j); return m.length ? [mean(m.map(p => p[0])), mean(m.map(p => p[1]))] : c; });
      const runFull = (kk, s) => { const r = RNG(s); let cs = r.shuffle(range(D.length)).slice(0, kk).map(i => D[i].slice()), as = assign(cs); for (let t = 0; t < 100; t++) { cs = update(cs, as); const n2 = assign(cs); if (n2.every((v, i) => v === as[i])) break; as = n2; } return inertia(cs, as); };
      const elbow = range(8, j => Math.min(...range(10, s => runFull(j + 1, 500 + s))));
      function reset() { const r = RNG(seed * 97 + k); C = r.shuffle(range(D.length)).slice(0, k).map(i => D[i].slice()); asg = null; phase = 'assign'; it = 0; trail = C.map(c => [c.slice()]); done = false; }
      function stepOnce() { if (done) return; if (phase === 'assign') { const n2 = assign(C); if (asg && n2.every((v, i) => v === asg[i])) { done = true; } asg = n2; phase = 'update'; } else { C = update(C, asg); C.forEach((c, j) => trail[j].push(c.slice())); phase = 'assign'; it++; } }
      const ctl = Controls(el);
      Slider(ctl, { label: 'k', min: 1, max: 8, value: k, oninput: v => { k = v; reset(); draw(); } });
      Btn(ctl, 'Ett steg', () => { stepOnce(); draw(); }, 'primary');
      Btn(ctl, 'Kjør til slutt', () => { let g = 0; while (!done && g++ < 400) stepOnce(); draw(); });
      Btn(ctl, 'Ny tilfeldig start', () => { seed++; reset(); draw(); });
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const plot = new Plot(a, { w: 520, h: 420, m: { t: 10, r: 10, b: 10, l: 10 }, x: [0, 1], y: [0, 1], xticks: [], yticks: [], grid: false, label: 'k-means' });
      const gL = plot.layer(), gP = plot.layer(), gC = plot.layer();
      const tiles = Tiles(b, [['ph', 'Neste steg'], ['it', 'Iterasjoner'], ['in', 'Inertia (sum av kvadrerte avstander)']]);
      const p2 = new Plot(b, { w: 360, h: 220, x: [0.5, 8.5], y: [0, Math.max(...elbow) * 1.05], xticks: range(8, i => i + 1), xlab: 'k', ylab: 'Inertia (beste av 10)', label: 'Albueplot', yfmt: v => fx(v, 1) });
      S('path', { d: pathOf(elbow.map((v, j) => [p2.x(j + 1), p2.y(v)])), fill: 'none', class: 's-acc', 'stroke-width': 2 }, p2.gData);
      elbow.forEach((v, j) => S('circle', { cx: p2.x(j + 1), cy: p2.y(v), r: 3.5, class: 'f-acc' }, p2.gData));
      const mk = S('circle', { r: 7, fill: 'none', class: 's-hl', 'stroke-width': 3 }, p2.gTop);
      b.append(H('p', { class: 'note', html: 'Albueplottet: inertia faller alltid når k øker. Vi ser etter knekken der gevinsten flater ut, her ved k = 4.' }));
      function draw() {
        clear(gL); clear(gP); clear(gC); const X = plot.x, Y = plot.y;
        if (asg) D.forEach((p, i) => S('line', { x1: X(p[0]), y1: Y(p[1]), x2: X(C[asg[i]][0]), y2: Y(C[asg[i]][1]), class: 's-c' + (asg[i] % 6), 'stroke-opacity': 0.18 }, gL));
        D.forEach((p, i) => S('circle', { cx: X(p[0]), cy: Y(p[1]), r: 4, class: asg ? 'f-c' + (asg[i] % 6) : 'f-mut', 'fill-opacity': 0.85 }, gP));
        trail.forEach((tr, j) => { if (tr.length > 1) S('path', { d: pathOf(tr.map(c => [X(c[0]), Y(c[1])])), fill: 'none', class: 's-ink', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, gC); });
        C.forEach((c, j) => { S('rect', { x: X(c[0]) - 8, y: Y(c[1]) - 8, width: 16, height: 16, transform: `rotate(45 ${X(c[0])} ${Y(c[1])})`, class: 'f-c' + (j % 6) + ' s-ink', 'stroke-width': 2 }, gC); });
        tiles.set('ph', done ? 'ferdig: ingen endring' : phase === 'assign' ? 'tildel punkter' : 'flytt sentroider', done ? 'good' : '');
        tiles.set('it', String(it)); tiles.set('in', asg ? fx(inertia(C, asg), 2) : '–');
        mk.setAttribute('cx', p2.x(k)); mk.setAttribute('cy', p2.y(elbow[k - 1]));
      }
      reset(); draw();
    },
    tryit: ['Trykk «Ett steg» flere ganger. Først farges punktene etter nærmeste sentroide, så flytter sentroidene seg til midten av fargen sin.', 'Trykk «Ny tilfeldig start» noen ganger med k = 4. Av og til havner to sentroider i samme gruppe: k-means finner et lokalt minimum. Derfor kjører man flere starter (n_init) og beholder den med lavest inertia.', 'Prøv k = 8. Algoritmen deler gruppene opp likevel. k-means finner alltid k klynger, også når dataene ikke har så mange.']
  }],
  body: `
<h2>Algoritmen</h2>
<ol>
<li>Velg k og plasser k startsentroider (for eksempel k tilfeldige datapunkter).</li>
<li><b>Tildel:</b> hvert punkt går til klyngen med nærmeste sentroide.</li>
<li><b>Oppdater:</b> hver sentroide flyttes til gjennomsnittet av punktene i klyngen.</li>
<li>Gjenta steg 2 og 3 til ingen punkter bytter klynge.</li>
</ol>
<div class="formula">Inertia = Σ<sub>klynger</sub> Σ<sub>punkter i klyngen</sub> (avstand til sentroiden)²</div>
<p>Hvert steg kan bare redusere inertia, så algoritmen stopper alltid. Men den finner et <b>lokalt</b> minimum som avhenger av startpunktene.</p>
<h2>Valg av k</h2>
<ul>
<li><b>Albueplot:</b> inertia mot k. Velg k der kurven knekker og videre økning gir lite.</li>
<li><b>Domenekunnskap:</b> hvor mange segmenter kan markedsavdelingen faktisk bruke?</li>
<li><b>Tolkbarhet:</b> se på sentroidene (gjennomsnittsprofilene) og sjekk at klyngene gir mening.</li>
</ul>
<h2>k-means eller hierarkisk?</h2>
<div class="pros">
<div><h3>k-means</h3><ul><li>Raskt, også for store datasett</li><li>Må velge k på forhånd</li><li>Gir runde, like store klynger</li><li>Resultatet avhenger av startpunktene</li></ul></div>
<div><h3>Hierarkisk</h3><ul><li>Tregt for store datasett</li><li>Trenger ikke k på forhånd</li><li>Dendrogram viser struktur på alle nivåer</li><li>Samme resultat hver gang</li></ul></div>
</div>
<div class="pit"><b>Eksamensfelle</b>Normaliser variablene før k-means, akkurat som i k-NN og hierarkisk klyngeanalyse. Og husk at k-means ikke er k-NN: k-means er uveiledet klyngeanalyse, k-NN er veiledet klassifikasjon.</div>
<h2>Python</h2>
<pre><code># utilities_df_norm: kraftselskapdataene, normalisert som z-score
from sklearn.cluster import KMeans

# n_init=10: 10 starter, beste beholdes
kmeans = KMeans(n_clusters=6, random_state=0, n_init=10).fit(utilities_df_norm)
memb = pd.Series(kmeans.labels_, index=utilities_df_norm.index)                   # klyngenummer per selskap
centroids = pd.DataFrame(kmeans.cluster_centers_, columns=utilities_df_norm.columns)   # snittet i hver klynge
print(kmeans.inertia_)                                 # summen av kvadrerte avstander til eget senter

# inertia for k = 1 til 9
inertia = [KMeans(n_clusters=k, random_state=0, n_init=10).fit(utilities_df_norm).inertia_ for k in range(1, 10)]
plt.plot(range(1, 10), inertia, marker='o')           # albueplott: velg k der kurven flater ut</code></pre>`
});

topic({
  id: 'pca', data: [['cereals']], short: 'PCA', lecture: 'F3', tags: ['Uveiledet', 'Dimensjonsreduksjon'],
  title: 'Prinsipalkomponentanalyse (PCA)',
  path: ['Uveiledet læring', 'Klyngeanalyse og PCA'],
  lead: 'PCA lager nye variabler, prinsipalkomponenter, som er lineære kombinasjoner av de opprinnelige. Første komponent fanger mest mulig av variansen, den neste mest av resten, og alle er ukorrelerte. Med noen få komponenter kan vi ofte beholde det meste av informasjonen.',
  figs: [{
    title: 'Finn retningen med mest varians',
    sub: '77 frokostblandinger: kalorier og rating. Drei linja gjennom gjennomsnittspunktet. Variansen langs linja er variansen til projeksjonene (de små strekene).',
    build(el) {
      const Cc = DATA.cereals, raw = Cc.map(c => [c[1], c[2]]);
      const mx = mean(raw.map(p => p[0])), my = mean(raw.map(p => p[1])), sx = sd(raw.map(p => p[0])), sy = sd(raw.map(p => p[1]));
      let std = false, ang = 90;
      const data = () => std ? raw.map(p => [(p[0] - mx) / sx, (p[1] - my) / sy]) : raw.map(p => [p[0] - mx, p[1] - my]);
      const cov = D => { const n = D.length - 1; return [sum(D.map(p => p[0] * p[0])) / n, sum(D.map(p => p[0] * p[1])) / n, sum(D.map(p => p[1] * p[1])) / n]; };
      const pc1Angle = D => { const [a, b, c] = cov(D); let t = 0.5 * Math.atan2(2 * b, a - c) * 180 / Math.PI; return ((t % 180) + 180) % 180; };
      const ctl = Controls(el);
      Seg(ctl, { label: 'Data', options: [[false, 'Rådata (sentrert)'], [true, 'Standardisert']], value: std, onchange: v => { std = v; draw(true); } });
      const sa = Slider(ctl, { label: 'Vinkel', min: 0, max: 179.5, step: 0.5, value: ang, fmt: v => fx(v, 1) + '°', oninput: v => { ang = v; draw(); } });
      Btn(ctl, 'Finn PC1', () => sa.set(Math.round(pc1Angle(data()) * 2) / 2), 'primary');
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const plot = new Plot(a, { w: 520, h: 440, x: [-1, 1], y: [-1, 1], label: 'Projeksjon på en retning' });
      const gL = plot.clipLayer(), gP = plot.layer();
      const tiles = Tiles(b, [['v', 'Varians langs linja'], ['p', 'Andel av total varians'], ['w', 'Ladninger (calories, rating)']]);
      const bar = S('svg', { viewBox: '0 0 360 60', class: 'plot', role: 'img', 'aria-label': 'Andel varians' }); b.append(bar);
      b.append(H('p', { class: 'note', html: 'Linja med størst varians er PC1. Ladningene er komponentene i retningsvektoren, og fortegnet kan snus uten at noe endres.' }));
      function draw(newDom) {
        const D = data();
        if (newDom || !plot._d) { const s = std ? 4.4 : 64, ratio = (440 - 60) / (520 - 70); plot.o.xlab = std ? 'calories (z)' : 'calories − snitt'; plot.o.ylab = std ? 'rating (z)' : 'rating − snitt'; plot.setDomain([-s, s], [-s * ratio, s * ratio]); plot._d = 1; }
        const th = ang * Math.PI / 180, u = [Math.cos(th), Math.sin(th)], X = plot.x, Y = plot.y, L = 400;
        clear(gL); clear(gP);
        S('line', { x1: X(-L * u[0]), y1: Y(-L * u[1]), x2: X(L * u[0]), y2: Y(L * u[1]), class: 's-acc', 'stroke-width': 2.5 }, gL);
        const proj = D.map(p => p[0] * u[0] + p[1] * u[1]);
        D.forEach((p, i) => { const q = [proj[i] * u[0], proj[i] * u[1]]; S('line', { x1: X(p[0]), y1: Y(p[1]), x2: X(q[0]), y2: Y(q[1]), class: 's-c0', 'stroke-opacity': 0.45 }, gL); S('circle', { cx: X(q[0]), cy: Y(q[1]), r: 2.2, class: 'f-acc' }, gL); });
        D.forEach(p => S('circle', { cx: X(p[0]), cy: Y(p[1]), r: 4, class: 'f-ink', 'fill-opacity': 0.75 }, gP));
        const [ca, cb, cc] = cov(D), tot = ca + cc, v = sum(proj.map(t => t * t)) / (D.length - 1);
        tiles.set('v', fx(v, std ? 3 : 1)); tiles.set('p', fpct(v / tot), Math.abs(((ang - pc1Angle(D)) + 540) % 180) < 0.6 || Math.abs(((ang - pc1Angle(D)) + 540) % 180 - 180) < 0.6 ? 'good' : '');
        tiles.set('w', `(${fx(u[0], 3)}, ${fx(u[1], 3)})`);
        clear(bar); S('rect', { x: 0, y: 14, width: 360, height: 22, rx: 4, class: 'f-soft' }, bar); S('rect', { x: 0, y: 14, width: 360 * v / tot, height: 22, rx: 4, class: 'f-acc' }, bar);
        S('text', { x: 0, y: 54, text: '0 %', style: 'font-size:11px' }, bar); S('text', { x: 360, y: 54, 'text-anchor': 'end', text: '100 % av total varians', style: 'font-size:11px' }, bar);
      }
      draw(true);
    },
    tryit: ['Trykk «Finn PC1» på rådata. Ladningene blir omtrent (−0,85, 0,53) for (calories, rating), som i læreboka, og retningen fanger 86 % av variansen. Fortegnet kan like gjerne være snudd.', 'Drei linja 90° fra PC1. Da får du PC2, som fanger resten (14 %).', 'Bytt til standardisert. Med to standardiserte variabler blir ladningene alltid ±0,707: begge teller like mye, og bare korrelasjonen avgjør hvor mye PC1 fanger.']
  }, {
    title: 'Hvor mange komponenter trenger vi?',
    sub: 'PCA på alle 13 tallvariablene i frokostblandingsdataene (standardisert, 74 rader uten manglende verdier). Søylene er andelen varians hver komponent forklarer (PVE). Linja er kumulativ andel.',
    build(el) {
      const pve = DATA.cerealPVE; let m = 3;
      const ctl = Controls(el);
      Slider(ctl, { label: 'Antall komponenter', min: 1, max: 13, value: m, oninput: v => { m = v; draw(); } });
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const plot = new Plot(a, { w: 540, h: 300, x: [0.4, 13.6], y: [0, 1], xticks: range(13, i => i + 1), yfmt: v => Math.round(v * 100) + ' %', xlab: 'Komponent', ylab: 'Andel varians', label: 'Albueplot for PCA' });
      const g = plot.layer();
      const tiles = Tiles(b, [['c', 'Kumulativ andel'], ['r', 'Variabler redusert fra 13 til']]);
      const tw = H('div', { class: 'tblwrap', style: 'margin-top:10px' }); b.append(tw);
      tw.append(H('table', { class: 'tbl' }, H('tr', {}, H('th', { class: 'l' }, 'Største ladninger i PC1'), H('th', {}, 'Ladning')), DATA.cerealPC1.slice(0, 6).map(([c, w]) => H('tr', {}, H('td', { class: 'l' }, c), H('td', {}, fx(w, 3))))));
      function draw() {
        clear(g); const X = plot.x, Y = plot.y; let c = 0; const cum = pve.map(v => (c += v));
        pve.forEach((v, i) => S('rect', { x: X(i + 1) - 14, y: Y(v), width: 28, height: Y(0) - Y(v), rx: 3, class: i < m ? 'f-acc' : 'f-line' }, g));
        S('path', { d: pathOf(cum.map((v, i) => [X(i + 1), Y(v)])), fill: 'none', class: 's-ink', 'stroke-width': 2 }, g);
        cum.forEach((v, i) => S('circle', { cx: X(i + 1), cy: Y(v), r: i === m - 1 ? 6 : 3, class: i === m - 1 ? 'f-hl s-ink' : 'f-ink' }, g));
        tiles.set('c', fpct(cum[m - 1])); tiles.set('r', String(m));
      }
      draw();
    },
    tryit: ['De tre første komponentene forklarer omtrent 67 %. Albuen ligger rundt komponent 3–4.', 'Ladningene i PC1 viser hva komponenten «handler om»: fiber, rating, kalium og protein drar én vei, kalorier den andre. Det ligner en sunnhetsakse.']
  }],
  body: `
<h2>Kort fortalt</h2>
<p>Med mange korrelerte variabler bærer flere av dem nesten den samme informasjonen. PCA roterer koordinatsystemet slik at den første aksen peker dit dataene varierer mest. Hver komponent er en lineær kombinasjon:</p>
<div class="formula"><span class="v">Z</span><sub>1</sub> = <span class="v">a</span><sub>11</sub><span class="v">x</span><sub>1</sub> + <span class="v">a</span><sub>12</sub><span class="v">x</span><sub>2</sub> + … + <span class="v">a</span><sub>1<span class="v">p</span></sub><span class="v">x</span><sub><span class="v">p</span></sub>, &nbsp;&nbsp; der <span class="v">a</span><sub>11</sub>² + … + <span class="v">a</span><sub>1<span class="v">p</span></sub>² = 1</div>
<ul>
<li><b>Ladningene (loadings)</b> sier hvor mye hver variabel bidrar til komponenten.</li>
<li><b>Scores</b> er verdiene til hvert datapunkt på de nye komponentene.</li>
<li><b>PVE</b> (proportion of variance explained) er andelen av total varians hver komponent fanger. Summen av alle er 100 %.</li>
<li>Komponentene er ukorrelerte med hverandre.</li>
</ul>
<h2>Standardiser eller ikke?</h2>
<p>PCA på rådata domineres av variablene med størst varians, altså de med størst tall. I Cereals har natrium (sodium) og kalium (potass) verdier i hundretall, mens fett er 0–5. Når variablene har ulike enheter, standardiser dem først. Da tilsvarer PCA en analyse av korrelasjonsmatrisen.</p>
<h2>Bruk i data science</h2>
<ul>
<li><b>Dimensjonsreduksjon:</b> bruk de første komponentene som forklaringsvariabler i en modell (for eksempel regresjon eller k-NN).</li>
<li><b>Visualisering:</b> plott de to første komponentene for å se grupper og utstikkere.</li>
<li><b>Velg antall:</b> albueplot, eller nok komponenter til å forklare for eksempel 80–90 % av variansen.</li>
<li>Ulempen er tolkning: en komponent er en blanding av mange variabler.</li>
</ul>
<div class="pit"><b>Eksamensfelle</b>PCA bruker ikke Y. Den er uveiledet, så komponentene med mest varians er ikke nødvendigvis de som predikerer Y best.</div>
<h2>Python</h2>
<pre><code>from sklearn.decomposition import PCA
from sklearn import preprocessing

pcs = PCA(n_components=2).fit(cereals_df[['calories', 'rating']])   # PCA på to variabler, uskalert
print(pcs.components_)                        # ladningene (loadings)
print(pcs.explained_variance_ratio_)          # PVE

# alle numeriske kolonner (fra kolonne 3), uten rader med manglende verdier, standardisert
pcs = PCA().fit(preprocessing.scale(cereals_df.iloc[:, 3:].dropna(axis=0)))
pcsSummary = pd.DataFrame({'Standard deviation': np.sqrt(pcs.explained_variance_),   # tabellen fra læreboka
                           'Proportion of variance': pcs.explained_variance_ratio_,
                           'Cumulative proportion': np.cumsum(pcs.explained_variance_ratio_)})
# hver frokostblanding på komponentene
scores = pcs.transform(preprocessing.scale(cereals_df.iloc[:, 3:].dropna(axis=0)))</code></pre>`
});
