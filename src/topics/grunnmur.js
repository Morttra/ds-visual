/* Grunnmur: dataforberedelse, bias–varians, evaluering av prediksjon og klassifikasjon */

topic({
  id: 'dataforberedelse', data: [['mowers'], ['toyota', ['Price', 'Fuel_Type']]], short: 'Dataforberedelse', lecture: 'F2–F3', tags: ['Grunnmur', 'Brukes før alle modeller'],
  title: 'Dataforberedelse og skalering',
  path: ['Grunnmur'],
  lead: 'Før vi modellerer, må dataene i riktig form. Kategorier blir til dummyvariabler, manglende verdier og uteliggere må håndteres, og variabler på ulik skala gjøres sammenlignbare.',
  figs: [{
    title: 'Skalering endrer hvem som er nærmest',
    sub: 'De 24 husholdningene i sitteklipperdataene og en ny husholdning (stjerna) med inntekt 60 og tomt 20. Ringen markerer alt som ligger like nær som den k-te naboen. Med k = 3 bestemmer de tre nærmeste naboene om den nye husholdningen klassifiseres som eier. Dra stjerna for å flytte den.',
    build(el) {
      const raw = DATA.mowers, I = raw.map(r => r[0]), L = raw.map(r => r[1]);
      const mI = mean(I), sI = sd(I), mL = mean(L), sL = sd(L);
      const nI = Math.min(...I), xI = Math.max(...I), nL = Math.min(...L), xL = Math.max(...L);
      const T = {
        raw: { f: (i, l) => [i, l], inv: (a, b) => [a, b], xl: 'Income (1000 $)', yl: 'Lot_Size (1000 ft²)', d: 1 },
        z: { f: (i, l) => [(i - mI) / sI, (l - mL) / sL], inv: (a, b) => [a * sI + mI, b * sL + mL], xl: 'Income (z-score)', yl: 'Lot_Size (z-score)', d: 2 },
        mm: { f: (i, l) => [(i - nI) / (xI - nI), (l - nL) / (xL - nL)], inv: (a, b) => [a * (xI - nI) + nI, b * (xL - nL) + nL], xl: 'Income (min–maks)', yl: 'Lot_Size (min–maks)', d: 2 }
      };
      let mode = 'raw', k = 3, q = [60, 20];
      const ctl = Controls(el);
      Seg(ctl, { label: 'Skala', options: [['raw', 'Rådata'], ['z', 'z-score'], ['mm', 'Min–maks']], value: mode, onchange: v => { mode = v; draw(true); } });
      Slider(ctl, { label: 'Antall naboer k', min: 1, max: 9, value: 3, oninput: v => { k = v; draw(); } });
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const left = H('div'), right = H('div'); cols.append(left, right);
      const plot = new Plot(left, { w: 560, h: 430, label: 'Spredningsplott av husholdningene med ny husholdning og nærmeste naboer' });
      const gRing = plot.layer(), gLines = plot.layer(), gPts = plot.layer(), gQ = plot.layer();
      const tiles = Tiles(right, [['pred', 'Klasse ved flertall'], ['share', 'Andel av avstanden fra Income']]);
      const tw = H('div', { class: 'tblwrap', style: 'margin-top:10px' }); right.append(tw);
      right.append(H('p', { class: 'note', html: 'Farge: <b style="color:var(--c1)">eier</b> og <b style="color:var(--c0)">ikke-eier</b>. Andelen fra Income er snittet av Δx²/(Δx²+Δy²) over alle 24 punkter.' }));
      const qStar = S('polygon', { class: 'f-hl s-ink', 'stroke-width': 1.2 }, gQ);
      draggable(plot, qStar, p => { const t = T[mode]; const r0 = t.inv(p.x, p.y); q = [clamp(r0[0], 25, 120), clamp(r0[1], 12, 26)]; draw(); });
      clickMove(plot, p => { const t = T[mode]; const r0 = t.inv(p.x, p.y); q = [clamp(r0[0], 25, 120), clamp(r0[1], 12, 26)]; draw(); });
      function draw(newDomain) {
        const t = T[mode], P = raw.map(r => t.f(r[0], r[1])), Q = t.f(q[0], q[1]);
        if (newDomain || !plot._init) {
          const xs = P.map(p => p[0]), ys = P.map(p => p[1]), pad = (a, b) => { const d = (b - a) * 0.1; return [a - d, b + d]; };
          plot.o.xlab = t.xl; plot.o.ylab = t.yl; plot.setDomain(pad(Math.min(...xs), Math.max(...xs)), pad(Math.min(...ys), Math.max(...ys))); plot._init = true;
        }
        const D = P.map((p, i) => ({ i, d: dist2(p, Q), dx: p[0] - Q[0], dy: p[1] - Q[1] })).sort((a, b) => a.d - b.d);
        const nb = D.slice(0, k), r = nb[k - 1].d;
        clear(gRing); clear(gLines); clear(gPts);
        const X = plot.x, Y = plot.y;
        S('ellipse', { cx: X(Q[0]), cy: Y(Q[1]), rx: Math.abs(X(Q[0] + r) - X(Q[0])), ry: Math.abs(Y(Q[1] + r) - Y(Q[1])), class: 'f-soft s-acc', 'stroke-dasharray': '5 4', 'stroke-width': 1.5, 'fill-opacity': 0.6 }, gRing);
        for (const n of nb) S('line', { x1: X(Q[0]), y1: Y(Q[1]), x2: X(P[n.i][0]), y2: Y(P[n.i][1]), class: 's-ink', 'stroke-width': 1.2, 'stroke-opacity': 0.7 }, gLines);
        const isNb = new Set(nb.map(n => n.i));
        raw.forEach((rw, i) => S('circle', { cx: X(P[i][0]), cy: Y(P[i][1]), r: isNb.has(i) ? 7 : 5.5, class: (rw[2] ? 'f-c1' : 'f-c0') + (isNb.has(i) ? ' s-ink' : ''), 'stroke-width': 2 }, gPts));
        qStar.setAttribute('points', star(X(Q[0]), Y(Q[1]), 11, 5));
        const owners = nb.filter(n => raw[n.i][2]).length;
        tiles.set('pred', (owners * 2 > k ? 'eier' : owners * 2 < k ? 'ikke-eier' : 'uavgjort') + ` (${owners} av ${k})`);
        const sh = mean(D.map(n => n.dx * n.dx / (n.dx * n.dx + n.dy * n.dy + 1e-12)));
        tiles.set('share', fpct(sh, 0), sh > 0.8 ? 'bad' : '');
        clear(tw).append(H('table', { class: 'tbl' }, H('tr', {}, H('th', {}, '#'), H('th', {}, 'Income'), H('th', {}, 'Lot_Size'), H('th', { class: 'l' }, 'Klasse'), H('th', {}, 'Avstand')),
          nb.map((n, j) => H('tr', {}, H('td', {}, j + 1), H('td', {}, fx(raw[n.i][0], 1)), H('td', {}, fx(raw[n.i][1], 1)), H('td', { class: 'l' }, raw[n.i][2] ? 'eier' : 'ikke-eier'), H('td', {}, fx(n.d, t.d))))));
      }
      draw(true);
    },
    tryit: ['Se på rådata: ringen blir høy og smal. Én enhet tomt teller like mye som én enhet inntekt, selv om tomtene bare varierer fra 14 til 24.',
      'Bytt til z-score. Nå bidrar begge variablene omtrent like mye, og naboene blir andre husholdninger.',
      'Sammenlign z-score og min–maks. De gir nesten samme naboer, men min–maks er følsom for ett ekstremt punkt.']
  }, {
    title: 'Uteliggere med 1,5 · IQR-regelen',
    sub: 'Kjørelengde for 20 tenkte bruktbiler (oppdiktede tall). Boksen går fra Q1 til Q3, og grensene ligger 1,5 · IQR utenfor boksen. Flytt den siste bilen og se når den blir en uteligger.',
    build(el) {
      const base = [18, 25, 31, 36, 40, 44, 47, 51, 55, 58, 62, 66, 71, 75, 80, 86, 93, 101, 112];
      let extra = 190;
      const ctl = Controls(el);
      Slider(ctl, { label: 'Kjørelengde for bil nr. 20', min: 0, max: 260, step: 1, value: extra, fmt: v => v + ' tkm', oninput: v => { extra = v; draw(); } });
      const plot = new Plot(el, { w: 760, h: 210, m: { t: 10, b: 44, l: 20, r: 20 }, x: [0, 270], y: [0, 1], yticks: [], xlab: 'Kjørelengde (1000 km)', grid: true, label: 'Boksplott av kjørelengde' });
      const g = plot.layer();
      const tiles = Tiles(el, [['q1', 'Q1'], ['md', 'Median'], ['q3', 'Q3'], ['iqr', 'IQR = Q3 − Q1'], ['lo', 'Nedre grense'], ['hi', 'Øvre grense'], ['n', 'Uteliggere']]);
      const jit = base.map((_, i) => 0.18 + 0.12 * ((i * 7) % 5) / 4);
      function draw() {
        const all = base.concat([extra]), s = all.slice().sort((a, b) => a - b);
        const q1 = quantile(s, 0.25), md = quantile(s, 0.5), q3 = quantile(s, 0.75), iqr = q3 - q1, lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr;
        const inside = s.filter(v => v >= lo && v <= hi), wl = Math.min(...inside), wh = Math.max(...inside);
        clear(g); const X = plot.x, Y = plot.y, yb = Y(0.72);
        for (const v of [lo, hi]) { if (v < 0 || v > 270) continue; S('line', { x1: X(v), x2: X(v), y1: Y(1), y2: Y(0), class: 's-bad', 'stroke-dasharray': '4 4' }, g); S('text', { x: X(v) + (v === lo ? 6 : -6), y: Y(1) + 14, 'text-anchor': v === lo ? 'start' : 'end', class: 'f-bad', text: v === lo ? 'Q1 − 1,5·IQR' : 'Q3 + 1,5·IQR', style: 'font-size:11px' }, g); }
        S('line', { x1: X(wl), x2: X(wh), y1: yb, y2: yb, class: 's-ink', 'stroke-width': 1.5 }, g);
        S('rect', { x: X(q1), y: yb - 18, width: X(q3) - X(q1), height: 36, class: 'f-soft s-ink', 'stroke-width': 1.5, rx: 3 }, g);
        S('line', { x1: X(md), x2: X(md), y1: yb - 18, y2: yb + 18, class: 's-acc', 'stroke-width': 3 }, g);
        for (const v of [wl, wh]) S('line', { x1: X(v), x2: X(v), y1: yb - 9, y2: yb + 9, class: 's-ink', 'stroke-width': 1.5 }, g);
        all.forEach((v, i) => { const out = v < lo || v > hi; S('circle', { cx: X(v), cy: Y(i < base.length ? jit[i] : 0.3), r: i === base.length ? 7 : 5, class: out ? 'f-bad' : (i === base.length ? 'f-hl s-ink' : 'f-mut'), 'stroke-width': 1.2, 'fill-opacity': i === base.length ? 1 : 0.75 }, g); });
        tiles.set('q1', fx(q1, 1)); tiles.set('md', fx(md, 1)); tiles.set('q3', fx(q3, 1)); tiles.set('iqr', fx(iqr, 1));
        tiles.set('lo', fx(lo, 1)); tiles.set('hi', fx(hi, 1));
        const n = all.filter(v => v < lo || v > hi).length; tiles.set('n', String(n), n ? 'bad' : '');
      }
      draw();
    },
    tryit: ['Dra bil nr. 20 sakte oppover. Legg merke til at Q1 og Q3 nesten ikke flytter seg: kvartiler er robuste mot ett ekstremt punkt.',
      'Finn verdien der bilen akkurat blir en uteligger. Sjekk at den er lik Q3 + 1,5 · IQR.']
  }, {
    title: 'Kategorier blir til dummyvariabler',
    sub: 'Drivstofftypen i bruktbildataene har tre kategorier: Petrol (bensin), Diesel og CNG (naturgass). <code>pd.get_dummies</code> lager én 0/1-kolonne per kategori. Med <code>drop_first=True</code> forsvinner den første (CNG), som da blir referansekategori.',
    build(el) {
      const cars = ['Petrol', 'Diesel', 'Petrol', 'CNG', 'Petrol', 'Diesel'];
      let drop = true;
      const ctl = Controls(el);
      Seg(ctl, { label: 'drop_first', options: [[true, 'True'], [false, 'False']], value: drop, onchange: v => { drop = v; draw(); } });
      const out = H('div', { class: 'cols even' }); el.append(out);
      const tw = H('div', { class: 'tblwrap' }), code = H('pre', {}); out.append(tw, H('div', {}, code, H('p', { class: 'note', id: uid('n') })));
      function draw() {
        const cats = ['CNG', 'Diesel', 'Petrol'].filter((c, i) => !(drop && i === 0));
        clear(tw).append(H('table', { class: 'tbl' }, H('tr', {}, H('th', { class: 'l' }, 'Fuel_Type'), cats.map(c => H('th', {}, 'Fuel_Type_' + c))),
          cars.map(v => H('tr', {}, H('td', { class: 'l' }, v), cats.map(c => H('td', { class: v === c ? 'hit' : '' }, v === c ? 1 : 0))))));
        code.textContent = "# car_df = bruktbildataene (Toyota Corolla)\nX = pd.get_dummies(car_df[['Fuel_Type']],\n                   drop_first=" + (drop ? 'True' : 'False') + ")";
        code.nextSibling.textContent = drop
          ? 'To kolonner holder: en CNG-bil har 0 i begge. Dette er riktig i lineær og logistisk regresjon.'
          : 'Tre kolonner summerer alltid til 1 i hver rad. I regresjon med konstantledd blir de da perfekt kollineære (dummyfella).';
      }
      draw();
    }
  }],
  body: `
<h2>Kort fortalt</h2>
<p>Steget «utforsk, vask og preprosesser» i dataanalyseprosessen tar ofte mer tid enn selve modelleringen. Målet er at hver variabel har en form modellen kan bruke, uten at vi lekker informasjon fra valideringsdataene inn i treningen.</p>
<h2>Variabeltyper</h2>
<ul>
<li><b>Numeriske:</b> kontinuerlige (inntekt, pris) eller heltall (antall barn).</li>
<li><b>Kategoriske:</b> nominale uten rekkefølge (drivstoff, region) eller ordinale med rekkefølge (utdanningsnivå 1, 2, 3).</li>
<li><b>Binære</b> 0/1-variabler er et spesialtilfelle og kan brukes direkte.</li>
</ul>
<h2>Dummyvariabler</h2>
<p>En kategorisk variabel med <i>k</i> kategorier blir til <i>k</i> − 1 dummyvariabler i regresjonsmodeller. Kategorien som faller bort, er referansen. Koeffisienten til en dummy måler forskjellen fra referansekategorien når de andre variablene holdes fast. Metoder uten konstantledd, som k-NN og trær, kan bruke alle <i>k</i>.</p>
<p>Har en variabel mange kategorier, kan sjeldne kategorier slås sammen før man lager dummyer. Et alternativ er å erstatte kategorien med snittet av Y i kategorien (mean-encoding). Da må snittet beregnes på treningsdataene.</p>
<h2>Manglende verdier</h2>
<ul>
<li><b>Fjern rader:</b> enkelt, men du kan miste mye data hvis mange variabler har litt mangler.</li>
<li><b>Imputer:</b> erstatt med median eller gjennomsnitt (numerisk), eller den vanligste kategorien. Beregn erstatningsverdien på treningsdataene.</li>
<li><b>Tenk på hvorfor det mangler.</b> Mangler som henger sammen med Y, kan selv være informative. Da kan en egen indikatorvariabel hjelpe.</li>
</ul>
<h2>Uteliggere</h2>
<p>Regelen i boksplottet: en verdi er uteligger hvis den ligger under Q1 − 1,5 · IQR eller over Q3 + 1,5 · IQR, der IQR = Q3 − Q1. En annen tommelfingerregel er |z| &gt; 3. En uteligger er et flagg, ikke en dom. Sjekk om verdien er en registreringsfeil (rett eller fjern) eller en ekte, sjelden observasjon (behold, og vurder en robust metode).</p>
<h2>Skalering</h2>
<div class="formula">z-score: <span class="v">z</span> = (<span class="v">x</span> − <span class="v">x̄</span>) / <span class="v">s</span> &nbsp;&nbsp;&nbsp; min–maks: <span class="v">x</span>* = (<span class="v">x</span> − min) / (maks − min)</div>
<p>Skalering trengs for alle metoder som bruker <b>avstander eller like store straffer</b> på tvers av variabler: k-NN, klynging, PCA, nevrale nett, og ridge og lasso. Trær trenger det ikke, fordi en splitt bare bryr seg om rekkefølgen av verdiene. Vanlig lineær regresjon gir samme prediksjoner med og uten skalering. Bare tallene på koeffisientene endres.</p>
<div class="pit"><b>Eksamensfelle: lekkasje</b>Gjennomsnitt, standardavvik, min og maks skal beregnes på <i>treningsdataene</i> og så brukes på valideringsdataene. Skalerer du med hele datasettet, har valideringsdataene påvirket modellen.</div>
<div class="pit"><b>Eksamensfelle: z-score i pandas og scikit-learn</b><code>df.std()</code> i pandas deler på <i>n</i> − 1, mens <code>StandardScaler</code> deler på <i>n</i>. Tallene blir litt forskjellige, men tolkningen er den samme.</div>
<h2>Python</h2>
<pre><code>import pandas as pd
from sklearn.preprocessing import StandardScaler

X = pd.get_dummies(df[predictors], drop_first=True)   # kategorier blir 0/1-kolonner, k − 1 dummyer
train_X, valid_X = ...                                  # partisjoner først, før alt annet

train_X = train_X.fillna(train_X.median())             # fyll manglende verdier med treningsmedianen
valid_X = valid_X.fillna(train_X.median())             # validering fylles også med treningsmedianen

scaler = StandardScaler().fit(train_X)                  # lærer snitt og standardavvik, kun fra treningsdata
train_Z = scaler.transform(train_X)                     # z-score: (x − snitt) / standardavvik
valid_Z = scaler.transform(valid_X)                     # samme snitt og standardavvik som treningen

q1, q3 = df['KM'].quantile([0.25, 0.75])                # 1. og 3. kvartil (1,5 · IQR-regelen)
iqr = q3 - q1                                           # kvartilbredden
uteliggere = df[(df['KM'] &lt; q1 - 1.5*iqr) | (df['KM'] &gt; q3 + 1.5*iqr)]   # rader utenfor grensene</code></pre>`
});

topic({
  id: 'bias-varians', dataNote: 'Figurene på denne siden bruker <b>simulerte data</b>. Vi har laget dataene selv fra en kjent kurve pluss tilfeldig støy, så vi vet hva den sanne sammenhengen er.', short: 'Bias–varians', lecture: 'F4', tags: ['Grunnmur', 'Partisjonering', 'Kryssvalidering'],
  title: 'Partisjonering og bias–varians',
  path: ['Grunnmur'],
  lead: 'En modell skal fungere på nye data, ikke bare på dataene den er trent på. Derfor holder vi data utenfor treningen og finner kompleksiteten som gir lavest feil på disse dataene.',
  figs: [{
    title: 'Fra undertilpasset til overtilpasset',
    sub: 'Simulerte data: et polynom tilpasses de 20 treningspunktene (fylte). Valideringspunktene (hule) er med bare for å måle feil. Den stiplede kurven er sannheten vi ikke kjenner.',
    build(el) {
      const f = x => 0.9 * Math.sin(2 * Math.PI * x) + 0.4 * x;
      const sample = s => { const r = RNG(s); const mk = () => range(20, () => { const x = r(); return [x, f(x) + 0.33 * r.n()]; }); return { tr: mk(), va: mk() }; };
      let seed = 3, deg = 3, many = false, D = sample(seed);
      const fit = (tr, d) => polyfit(tr.map(p => 2 * p[0] - 1), tr.map(p => p[1]), d);
      const pv = (b, x) => polyval(b, 2 * x - 1);
      const rmse = (b, pts) => Math.sqrt(mean(pts.map(p => (p[1] - pv(b, p[0])) ** 2)));
      const ctl = Controls(el);
      Slider(ctl, { label: 'Polynomgrad', min: 0, max: 12, value: deg, oninput: v => { deg = v; draw(); } });
      Seg(ctl, { label: 'Vis', options: [[false, 'Ett utvalg'], [true, '8 utvalg']], value: many, onchange: v => { many = v; draw(); } });
      Btn(ctl, 'Trekk nye data', () => { seed++; D = sample(seed); draw(); });
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const p1 = new Plot(a, { w: 560, h: 380, x: [0, 1], y: [-2, 2.2], xlab: 'x', ylab: 'y', label: 'Data og tilpasset polynom' });
      const gT = p1.layer(), gC = p1.clipLayer(), gP = p1.layer();
      const p2 = new Plot(b, { w: 400, h: 300, x: [0, 12], y: [0, 1.2], xlab: 'Polynomgrad', ylab: 'RMSE', label: 'Trenings- og valideringsfeil mot polynomgrad', nx: 6 });
      const gE = p2.clipLayer(), gM = p2.layer();
      const tiles = Tiles(b, [['tr', 'RMSE trening'], ['va', 'RMSE validering']]);
      b.append(H('p', { class: 'note', html: '<b style="color:var(--c4)">Trening</b> faller hele veien. <b style="color:var(--c0)">Validering</b> har et bunnpunkt.' }));
      const xsC = range(161, i => i / 160);
      function draw() {
        clear(gT); clear(gC); clear(gP); clear(gE); clear(gM);
        const X = p1.x, Y = p1.y;
        S('path', { d: pathOf(xsC.map(x => [X(x), Y(f(x))])), fill: 'none', class: 's-mut', 'stroke-dasharray': '5 5', 'stroke-width': 1.5 }, gT);
        if (many) {
          const fits = range(8, i => fit(sample(1000 + seed * 13 + i).tr, deg));
          fits.forEach(bb => S('path', { d: pathOf(xsC.map(x => [X(x), Y(pv(bb, x))])), fill: 'none', class: 's-acc', 'stroke-width': 1, 'stroke-opacity': 0.45 }, gC));
          S('path', { d: pathOf(xsC.map(x => [X(x), Y(mean(fits.map(bb => pv(bb, x))))])), fill: 'none', class: 's-ink', 'stroke-width': 2.5 }, gC);
        } else {
          const bb = fit(D.tr, deg);
          S('path', { d: pathOf(xsC.map(x => [X(x), Y(pv(bb, x))])), fill: 'none', class: 's-acc', 'stroke-width': 2.5 }, gC);
          D.va.forEach(p => S('circle', { cx: X(p[0]), cy: Y(p[1]), r: 4.5, fill: 'none', class: 's-c0', 'stroke-width': 1.6 }, gP));
          D.tr.forEach(p => S('circle', { cx: X(p[0]), cy: Y(p[1]), r: 4.5, class: 'f-c4' }, gP));
        }
        const E = range(13, d => { const bb = fit(D.tr, d); return [rmse(bb, D.tr), rmse(bb, D.va)]; });
        const X2 = p2.x, Y2 = p2.y;
        S('path', { d: pathOf(E.map((e, d) => [X2(d), Y2(e[0])])), fill: 'none', class: 's-c4', 'stroke-width': 2 }, gE);
        S('path', { d: pathOf(E.map((e, d) => [X2(d), Y2(e[1])])), fill: 'none', class: 's-c0', 'stroke-width': 2 }, gE);
        E.forEach((e, d) => { S('circle', { cx: X2(d), cy: Y2(Math.min(e[1], 1.25)), r: 3, class: 'f-c0' }, gE); S('circle', { cx: X2(d), cy: Y2(e[0]), r: 3, class: 'f-c4' }, gE); });
        S('line', { x1: X2(deg), x2: X2(deg), y1: Y2(0), y2: Y2(1.2), class: 's-ink', 'stroke-dasharray': '3 3' }, gM);
        const best = E.reduce((bi, e, d) => e[1] < E[bi][1] ? d : bi, 0);
        S('text', { x: X2(best), y: Y2(E[best][1]) + 18, 'text-anchor': 'middle', class: 'lbl', text: 'lavest', style: 'font-size:11px' }, gM);
        tiles.set('tr', fx(E[deg][0], 3)); tiles.set('va', fx(E[deg][1], 3), deg === best ? 'good' : '');
      }
      draw();
    },
    tryit: ['Grad 0 og 1 er for enkle: begge feilene er høye. Det er høy bias.',
      'Gå til grad 10–12. Treningsfeilen blir svært lav, mens valideringsfeilen øker. Modellen har lært støyen.',
      'Velg «8 utvalg». Ved høy grad spriker kurvene fra ulike treningssett. Det er varians. Den tykke kurven er snittet av dem.']
  }, {
    title: 'Valideringssett, k-fold og tidsrekker',
    sub: 'Hver rad er én runde. 20 observasjoner er fordelt på trening og validering. Til slutt snitter vi feilen over rundene.',
    build(el) {
      const n = 20; let mode = 'kfold', k = 5;
      const ctl = Controls(el);
      Seg(ctl, { label: 'Metode', options: [['hold', 'Valideringssett'], ['kfold', 'k-fold'], ['loo', 'LOOCV'], ['ts', 'Tidsrekke']], value: mode, onchange: v => { mode = v; draw(); } });
      const ks = Slider(ctl, { label: 'k', min: 2, max: 10, value: k, oninput: v => { k = v; draw(); } });
      const svgWrap = H('div', { style: 'overflow-x:auto' }); el.append(svgWrap);
      const tiles = Tiles(el, [['m', 'Modeller som trenes'], ['v', 'Validering per runde'], ['u', 'Hver observasjon valideres']]);
      function folds() {
        if (mode === 'hold') return [range(n, i => i >= 12 ? 'v' : 't')];
        if (mode === 'loo') return range(n, r => range(n, i => i === r ? 'v' : 't'));
        if (mode === 'kfold') { const sizes = range(k, j => Math.floor(n / k) + (j < n % k ? 1 : 0)); let s0 = 0; return sizes.map(sz => { const a = s0; s0 += sz; return range(n, i => i >= a && i < a + sz ? 'v' : 't'); }); }
        const ts = Math.floor(n / (k + 1)), first = n - k * ts;
        return range(k, j => range(n, i => i < first + j * ts ? 't' : i < first + (j + 1) * ts ? 'v' : '-'));
      }
      function draw() {
        ks.el.style.visibility = (mode === 'kfold' || mode === 'ts') ? 'visible' : 'hidden';
        const F = folds(), cw = 30, ch = 16, gap = 4, lw = 70, h = F.length * (ch + gap) + 30;
        const svg = S('svg', { viewBox: `0 0 ${lw + n * cw + 10} ${h}`, class: 'plot', role: 'img', 'aria-label': 'Oppdeling av data i runder' });
        F.forEach((row, r) => {
          S('text', { x: lw - 10, y: 24 + r * (ch + gap) + ch - 3, 'text-anchor': 'end', text: 'Runde ' + (r + 1), style: 'font-size:11px' }, svg);
          row.forEach((c, i) => S('rect', { x: lw + i * cw + 1, y: 24 + r * (ch + gap), width: cw - 3, height: ch, rx: 3, class: c === 'v' ? 'f-c0' : c === 't' ? 'f-c4' : 'f-line', 'fill-opacity': c === 't' ? 0.55 : 1 }, svg));
        });
        range(n, i => S('text', { x: lw + i * cw + cw / 2 - 1, y: 14, 'text-anchor': 'middle', text: i + 1, style: 'font-size:10px' }, svg));
        clear(svgWrap).append(svg);
        const vs = F.map(r => r.filter(c => c === 'v').length);
        tiles.set('m', String(F.length) + (mode === 'loo' ? ' (= n)' : ''));
        tiles.set('v', mode === 'kfold' ? (Math.min(...vs) === Math.max(...vs) ? vs[0] : Math.min(...vs) + '–' + Math.max(...vs)) : String(vs[0]));
        tiles.set('u', mode === 'hold' ? 'kun de 8' : mode === 'ts' ? 'bare fremtiden' : 'nøyaktig én gang');
      }
      draw();
      el.append(H('p', { class: 'note', html: '<b style="color:var(--c4)">Blå</b> = trening, <b style="color:var(--c0)">oransje</b> = validering, grå = ikke brukt i runden (fremtiden i en tidsrekke).' }));
    },
    tryit: ['Sammenlign valideringssett og k-fold: med k-fold blir alle observasjonene brukt til validering én gang, så anslaget blir mer stabilt.',
      'LOOCV er k-fold med k = n. Det gir mange modeller å trene, men nesten all data i hver runde.',
      'I en tidsrekke trener vi aldri på fremtiden. Valideringsblokken ligger alltid etter treningsdataene.']
  }],
  body: `
<h2>Kort fortalt</h2>
<p>Treningsfeilen er et for optimistisk mål, fordi modellen har sett disse dataene. Feilen på nye data er det som teller. Derfor deler vi dataene: modellen trenes på én del og måles på en annen.</p>
<h2>Bias og varians</h2>
<ul>
<li><b>Bias:</b> modellen er for enkel til å fange mønsteret (rett linje gjennom en kurve). Feilen er høy både på trening og validering. Det kalles undertilpasning.</li>
<li><b>Varians:</b> modellen er så fleksibel at den følger støyen i akkurat dette treningssettet. Et annet treningssett ville gitt en helt annen modell. Treningsfeilen er lav og valideringsfeilen høy. Det kalles overtilpasning.</li>
</ul>
<div class="formula">Forventet feil på nye data = bias² + varians + irreduserbar støy</div>
<p>Kompleksiteten styres av hyperparametre: polynomgrad, k i k-NN, maks dybde i trær, λ i ridge og lasso, antall nevroner og epoker. Vi velger verdien med lavest valideringsfeil.</p>
<h2>Partisjonering</h2>
<ul>
<li><b>To deler (for eksempel 60/40):</b> trening og validering. Valideringssettet brukes til å sammenligne modeller og velge hyperparametre.</li>
<li><b>Tre deler (for eksempel 50/30/20):</b> når valideringssettet brukes mye til valg, blir det også litt «brukt opp». En urørt testdel gir et ærlig anslag på slutten.</li>
<li><b>Ulempe med ett valideringssett:</b> resultatet avhenger av hvilke rader som havnet hvor, og modellen trenes på færre data.</li>
</ul>
<h2>Kryssvalidering</h2>
<ul>
<li><b>k-fold:</b> del dataene i k like store deler. Tren k ganger, hver gang med én del til validering. Snitt feilen. Vanlig er k = 5 eller 10.</li>
<li><b>LOOCV</b> (leave-one-out): k = n. Lite bias, men mange modeller å trene og et ustabilt anslag.</li>
<li><b>Tidsrekker:</b> rekkefølgen må bevares. Tren på fortiden og valider på perioden rett etter (rullerende eller voksende vindu).</li>
<li><b>Hyperparametre:</b> kryssvalidering per kandidatverdi, for eksempel med <code>GridSearchCV</code>.</li>
</ul>
<div class="pit"><b>Eksamensfelle</b>«Modellen har 99 % treffsikkerhet på treningsdata» sier lite. Spør alltid: målt på hvilke data? Og ble disse dataene brukt til å velge modellen?</div>
<h2>Python</h2>
<pre><code>from sklearn.model_selection import train_test_split, cross_val_score, TimeSeriesSplit

# 60 % trening, 40 % validering; random_state gir samme tilfeldige deling hver gang
train_X, valid_X, train_y, valid_y = train_test_split(X, y, test_size=0.4, random_state=1)

# 5-fold CV: trener 5 ganger, hver gang med en ny femtedel holdt utenfor som validering
scores = cross_val_score(model, X, y, cv=5, scoring='neg_root_mean_squared_error')
print('RMSE per fold:', -scores, 'snitt:', -scores.mean())   # minus fordi sklearn gir negativ RMSE

tscv = TimeSeriesSplit(n_splits=5)          # 5 delinger der valideringen alltid ligger etter treningen i tid
for train_idx, valid_idx in tscv.split(X):  # radnumrene til trening og validering i hver deling
    ...</code></pre>`
});

topic({
  id: 'evaluering-prediksjon', dataNote: 'Figuren bruker <b>tenkte tall</b>: tolv oppdiktede bruktbiler med faktisk og predikert pris.', short: 'Prediksjonsmål', lecture: 'F4', tags: ['Grunnmur', 'Numerisk Y'],
  title: 'Evaluering av prediksjon',
  path: ['Grunnmur'],
  lead: 'Når Y er et tall, måler vi hvor langt prediksjonene bommer. Ulike mål straffer ulike typer bom, og fortegnet forteller om modellen bommer systematisk.',
  figs: [{
    title: 'Hva straffer hvilket mål?',
    sub: 'Tolv tenkte bruktbiler med faktisk pris (fylt) og predikert pris (hul). Feilen er e = y − ŷ, faktisk minus predikert, som i læreboka.',
    build(el) {
      const r = RNG(11), ys = range(12, () => Math.round(7000 + 15000 * r())), base = ys.map(y => y + Math.round(1100 * r.n()));
      let bias = 0, big = false;
      const ctl = Controls(el);
      Slider(ctl, { label: 'Legg til skjevhet', min: -3000, max: 3000, step: 100, value: 0, fmt: v => (v > 0 ? '+' : '') + fint(v) + ' €', oninput: v => { bias = v; draw(); } });
      Seg(ctl, { label: 'Én stor bom', options: [[false, 'Av'], [true, 'På']], value: big, onchange: v => { big = v; draw(); } });
      const plot = new Plot(el, { w: 760, h: 300, x: [0.3, 12.7], y: [0, 30000], xticks: range(12, i => i + 1), xlab: 'Bil nr.', ylab: 'Pris (€)', label: 'Faktisk og predikert pris per bil' });
      const g = plot.layer();
      const tiles = Tiles(el, [['me', 'ME'], ['mpe', 'MPE'], ['mae', 'MAE'], ['mape', 'MAPE'], ['mdape', 'MdAPE'], ['rmse', 'RMSE'], ['w10', 'Innenfor ±10 %']]);
      function draw() {
        const pr = base.map((p, i) => p + bias + (big && i === 4 ? 9000 : 0)), e = ys.map((y, i) => y - pr[i]);
        clear(g); const X = plot.x, Y = plot.y;
        ys.forEach((y, i) => {
          S('line', { x1: X(i + 1), x2: X(i + 1), y1: Y(y), y2: Y(pr[i]), class: e[i] > 0 ? 's-c4' : 's-c0', 'stroke-width': 3, 'stroke-opacity': 0.75 }, g);
          S('circle', { cx: X(i + 1), cy: Y(y), r: 5.5, class: 'f-ink' }, g);
          S('circle', { cx: X(i + 1), cy: Y(pr[i]), r: 5.5, class: 'f-surf s-ink', 'stroke-width': 2 }, g);
        });
        const ape = e.map((v, i) => Math.abs(v) / ys[i]);
        tiles.set('me', fint(mean(e)) + ' €', Math.abs(mean(e)) > 800 ? 'bad' : '');
        tiles.set('mpe', fx(100 * mean(e.map((v, i) => v / ys[i])), 1) + ' %');
        tiles.set('mae', fint(mean(e.map(Math.abs))) + ' €');
        tiles.set('mape', fx(100 * mean(ape), 1) + ' %');
        tiles.set('mdape', fx(100 * median(ape), 1) + ' %');
        tiles.set('rmse', fint(Math.sqrt(mean(e.map(v => v * v)))) + ' €');
        tiles.set('w10', ape.filter(v => v <= 0.1).length + ' av 12');
      }
      draw();
      el.append(H('p', { class: 'note', html: 'Strek <b style="color:var(--c4)">blå</b> når modellen predikerer for lavt (e &gt; 0), <b style="color:var(--c0)">oransje</b> når den predikerer for høyt (e &lt; 0).' }));
    },
    tryit: ['Dra skjevheten til +2000 €. MAE og RMSE øker, og ME blir −2000: modellen predikerer i snitt for høyt.',
      'Slå på «Én stor bom». RMSE hopper mye mer enn MAE fordi feilene kvadreres. MdAPE endrer seg nesten ikke.',
      'Finn en skjevhet der ME er nær 0 men MAE er stor. Da bommer modellen begge veier, uten systematisk skjevhet.']
  }],
  body: `
<h2>Kort fortalt</h2>
<p>For hver observasjon i valideringsdataene har vi en faktisk verdi <i>y</i> og en prediksjon <i>ŷ</i>. Feilen er <i>e</i> = <i>y</i> − <i>ŷ</i>. Prediksjonsmålene oppsummerer alle feilene i ett tall. Sammenlign alltid mot en <b>naiv benchmark</b>: å predikere gjennomsnittet ȳ av treningsdataene for alle.</p>
<h2>Målene</h2>
<div class="tblwrap"><table class="tbl">
<tr><th class="l">Mål</th><th class="l">Formel</th><th class="l">Forteller</th></tr>
<tr><td class="l">ME</td><td class="l">snitt av e</td><td class="l">Systematisk skjevhet. Positiv: predikerer for lavt.</td></tr>
<tr><td class="l">MPE</td><td class="l">snitt av 100 · e / y</td><td class="l">Skjevhet i prosent.</td></tr>
<tr><td class="l">MAE</td><td class="l">snitt av |e|</td><td class="l">Typisk størrelse på feilen, i Y-enheter.</td></tr>
<tr><td class="l">MAPE</td><td class="l">snitt av 100 · |e / y|</td><td class="l">Typisk feil i prosent. Ubrukelig når y kan være 0.</td></tr>
<tr><td class="l">MdAPE</td><td class="l">median av 100 · |e / y|</td><td class="l">Som MAPE, men robust mot enkeltbom.</td></tr>
<tr><td class="l">RMSE</td><td class="l">√(snitt av e²)</td><td class="l">Straffer store feil ekstra. Samme enhet som Y.</td></tr>
</table></div>
<p>RMSE ≥ MAE alltid. Er RMSE mye større enn MAE, finnes det noen få store bom.</p>
<div class="pit"><b>Eksamensfelle: fortegnet</b>Læreboka og <code>regressionSummary</code> bruker e = y − ŷ. Da betyr negativ ME at modellen predikerer for høyt i snitt. Sjekk alltid hvilken definisjon oppgaven bruker.</div>
<div class="pit"><b>Eksamensfelle: trening eller validering?</b>Sammenlign målene på valideringsdata. Er RMSE på trening mye lavere enn på validering, er modellen trolig overtilpasset.</div>
<h2>Python</h2>
<pre><code>from mlba import regressionSummary

regressionSummary(y_true=train_y, y_pred=model.predict(train_X))   # feilmål (RMSE, MAE …) på trening
regressionSummary(y_true=valid_y, y_pred=model.predict(valid_X))   # og på validering

# naiv benchmark: predikér snittet av treningsdataene
import numpy as np
regressionSummary(y_true=valid_y, y_pred=np.full(len(valid_y), train_y.mean()))   # samme tall for alle</code></pre>`
});

topic({
  id: 'evaluering-klassifikasjon', data: [['owner']], short: 'Klassifikasjonsmål', lecture: 'F4', tags: ['Grunnmur', 'Kategorisk Y'],
  title: 'Evaluering av klassifikasjon',
  path: ['Grunnmur'],
  lead: 'En klassifikasjonsmodell gir en sannsynlighet (propensitet). Terskelen gjør den om til en klasse. Forvirringsmatrisen, ROC-kurven og lift-kurven viser hva vi tjener og taper på valget.',
  figs: [{
    title: 'Terskel, forvirringsmatrise, ROC og lift',
    sub: 'De 24 husholdningene med ferdig utregnede propensiteter, sortert fra høyest til lavest. Alt med p &gt; terskel klassifiseres som eier. Tenk deg at vi bare kontakter dem modellen kaller eiere.',
    build(el) {
      const D = DATA.owner, P = 12, N = 12, TPk = [0], FPk = [0];
      D.forEach((d, i) => { TPk.push(TPk[i] + d[1]); FPk.push(FPk[i] + 1 - d[1]); });
      let c = 0.5;
      const ctl = Controls(el);
      const sl = Slider(ctl, { label: 'Terskel', min: 0, max: 1, step: 0.001, value: c, fmt: v => v.toFixed(3), oninput: v => { c = v; draw(); } });
      [['0.25', 0.25], ['0.50', 0.5], ['0.75', 0.75]].forEach(([t, v]) => Btn(ctl, t, () => sl.set(v)));
      Btn(ctl, 'Høyest profitt', () => { let bk = 0, bv = -1e9; for (let k = 0; k <= 24; k++) { const v = 100 * TPk[k] - 200 * FPk[k]; if (v > bv) { bv = v; bk = k; } } sl.set(+(((bk ? D[bk - 1][0] : 1) + (bk < 24 ? D[bk][0] : 0)) / 2).toFixed(3)); });
      const strip = S('svg', { viewBox: '0 0 760 92', class: 'plot', role: 'img', 'aria-label': 'Datapunktene sortert etter propensitet med terskellinje' }); el.append(strip);
      const X0 = 10, W = 740 / 24;
      const shade = S('rect', { x: X0, y: 18, height: 46, width: 0, rx: 4, class: 'f-soft s-acc', 'stroke-width': 1 }, strip);
      const lab = D.map((d, i) => { const x = X0 + i * W; S('rect', { x: x + 3, y: 24, width: W - 6, height: 34, rx: 4, class: d[1] ? 'f-c1' : 'f-c0' }, strip); S('text', { x: x + W / 2, y: 80, 'text-anchor': 'middle', text: d[0].toFixed(3).slice(1), style: 'font-size:11px' }, strip); return S('text', { x: x + W / 2, y: 12, 'text-anchor': 'middle', style: 'font-size:11px;font-weight:600' }, strip); });
      const line = S('line', { y1: 15, y2: 67, class: 's-ink', 'stroke-width': 2.5 }, strip);
      el.append(H('p', { class: 'note', html: 'Farge = faktisk klasse: <b style="color:var(--c1)">eier</b> eller <b style="color:var(--c0)">ikke-eier</b>. Feltet til venstre for streken klassifiseres som eier. Røde etiketter er feilklassifisert.' }));
      const cols = H('div', { class: 'cols even', style: 'margin-top:12px' }); el.append(cols);
      const cmBox = H('div'), tBox = H('div'); cols.append(cmBox, tBox);
      const cm = ConfMat(cmBox, ['ikke-eier', 'eier']);
      const tiles = Tiles(tBox, [['acc', 'Nøyaktighet'], ['sens', 'Sensitivitet'], ['spec', 'Spesifisitet'], ['prec', 'Presisjon'], ['f1', 'F1'], ['prof', 'Netto profitt']]);
      tBox.append(H('p', { class: 'note', html: 'Profitten bygger på tenkte tall: hver eier vi kontakter gir 100 kr i fortjeneste, og hver ikke-eier vi kontakter koster 200 kr.' }));
      const ch = H('div', { class: 'cols even', style: 'margin-top:8px' }); el.append(ch);
      const a = H('div'), b = H('div'); ch.append(a, b);
      const roc = new Plot(a, { w: 360, h: 300, x: [0, 1], y: [0, 1], xlab: '1 − spesifisitet', ylab: 'Sensitivitet', label: 'ROC-kurve', nx: 4, ny: 4 });
      const gain = new Plot(b, { w: 360, h: 300, x: [0, 24], y: [0, 12], xlab: 'Antall kontaktet (sortert)', ylab: 'Kumulativt antall eiere', label: 'Kumulativ gevinst (lift)', xticks: [0, 6, 12, 18, 24], yticks: [0, 4, 8, 12] });
      for (const [pl, xs, ys, xm, ym] of [[roc, FPk.map(v => v / N), TPk.map(v => v / P), 1, 1], [gain, range(25), TPk, 24, 12]]) {
        S('line', { x1: pl.x(0), y1: pl.y(0), x2: pl.x(xm), y2: pl.y(ym), class: 's-mut', 'stroke-dasharray': '4 4' }, pl.gData);
        S('path', { d: pathOf(xs.map((x, i) => [pl.x(x), pl.y(ys[i])])), fill: 'none', class: 's-c2', 'stroke-width': 2.5 }, pl.gData);
      }
      const auc = (() => { let s = 0; D.forEach(p => { if (p[1]) D.forEach(q => { if (!q[1] && p[0] > q[0]) s++; }); }); return s / (P * N); })();
      S('text', { x: roc.x(0.96), y: roc.y(0.08), 'text-anchor': 'end', class: 'lbl', text: 'AUC = ' + fx(auc, 3) }, roc.gTop);
      const d1 = S('circle', { r: 7, class: 'f-c2 s-surf', 'stroke-width': 2.5 }, roc.gTop), d2 = S('circle', { r: 7, class: 'f-c2 s-surf', 'stroke-width': 2.5 }, gain.gTop);
      const liftT = S('text', { x: gain.x(23), y: gain.y(1), 'text-anchor': 'end', class: 'lbl' }, gain.gTop);
      function draw() {
        const k = D.filter(d => d[0] > c).length, TP = TPk[k], FP = FPk[k], FN = P - TP, TN = N - FP;
        shade.setAttribute('width', k * W); line.setAttribute('x1', X0 + k * W); line.setAttribute('x2', X0 + k * W);
        D.forEach((d, i) => { const l = i < k ? (d[1] ? 'TP' : 'FP') : (d[1] ? 'FN' : 'TN'); lab[i].textContent = l; lab[i].setAttribute('class', l === 'FP' || l === 'FN' ? 'f-bad' : ''); });
        cm.set({ TP, FP, FN, TN });
        const prec = TP + FP ? TP / (TP + FP) : null, sens = TP / P;
        tiles.set('acc', fx((TP + TN) / 24, 3)); tiles.set('sens', fx(sens, 3)); tiles.set('spec', fx(TN / N, 3));
        tiles.set('prec', prec == null ? '–' : fx(prec, 3)); tiles.set('f1', prec ? fx(2 * prec * sens / (prec + sens), 3) : '–');
        const pf = 100 * TP - 200 * FP; tiles.set('prof', fint(pf), pf >= 800 ? 'good' : pf < 0 ? 'bad' : '');
        d1.setAttribute('cx', roc.x(FP / N)); d1.setAttribute('cy', roc.y(TP / P));
        d2.setAttribute('cx', gain.x(k)); d2.setAttribute('cy', gain.y(TP));
        liftT.textContent = k ? 'lift = ' + fx(TP / k / (P / 24), 2) : 'lift = –';
      }
      draw();
    },
    tryit: ['Trykk 0.25, 0.50 og 0.75 og sammenlign tre vanlige terskler. Nøyaktigheten blir 0.792, 0.875 og 0.750.',
      'Følg punktene på ROC- og lift-kurven mens du drar. Begge kurvene er alle mulige terskler tegnet etter hverandre.',
      'Trykk «Høyest profitt». Nøyaktigheten er den samme som ved 0.5, men profitten stiger fra 700 til 800: én dyr falsk positiv byttes mot én billigere falsk negativ.']
  }, {
    title: 'Når den interessante klassen er sjelden',
    sub: 'En kampanje sendes til 1000 kunder. Modellen fanger 80 % av dem som svarer (sensitivitet) og avviser 98 % av dem som ikke svarer (spesifisitet). En naiv modell sier at ingen svarer.',
    build(el) {
      let pos = 10;
      const ctl = Controls(el);
      Slider(ctl, { label: 'Antall som svarer av 1000', min: 2, max: 300, value: pos, oninput: v => { pos = v; draw(); } });
      const cols = H('div', { class: 'cols even' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const cm = ConfMat(a, ['0', '1']);
      const tiles = Tiles(b, [['accM', 'Nøyaktighet, modellen'], ['accN', 'Nøyaktighet, naiv'], ['prec', 'Presisjon, modellen'], ['lift', 'Lift i gruppen modellen velger']]);
      function draw() {
        const neg = 1000 - pos, TP = Math.round(0.8 * pos), FN = pos - TP, FP = Math.round(0.02 * neg), TN = neg - FP;
        cm.set({ TP, FP, FN, TN });
        const am = (TP + TN) / 1000, an = neg / 1000;
        tiles.set('accM', fpct(am), am < an ? 'bad' : 'good'); tiles.set('accN', fpct(an));
        tiles.set('prec', TP + FP ? fpct(TP / (TP + FP)) : '–');
        tiles.set('lift', TP + FP ? fx((TP / (TP + FP)) / (pos / 1000), 1) + '×' : '–');
      }
      draw();
    },
    tryit: ['Med 10 som svarer er den naive modellen «bedre» målt i nøyaktighet (99 % mot 97,8 %). Likevel finner den ingen kunder.',
      'Øk antall som svarer. Når klassen blir vanligere, slår modellen den naive, og presisjonen stiger.',
      'Lift sier hvor mange ganger høyere svarandelen er i gruppen modellen velger, sammenlignet med å trekke tilfeldig.']
  }],
  body: `
<h2>Forvirringsmatrisen</h2>
<p>Rader er faktisk klasse og kolonner er predikert klasse, i samme rekkefølge som <code>classificationSummary</code> skriver ut. Positiv klasse (1) er klassen vi er mest interessert i å finne: eier, svindel, kunde som svarer.</p>
<div class="tblwrap"><table class="tbl">
<tr><th class="l">Mål</th><th class="l">Formel</th><th class="l">Spør</th></tr>
<tr><td class="l">Nøyaktighet</td><td class="l">(TP + TN) / n</td><td class="l">Hvor stor andel er riktig? Feilrate = 1 − nøyaktighet.</td></tr>
<tr><td class="l">Sensitivitet (recall, TPR)</td><td class="l">TP / (TP + FN)</td><td class="l">Hvor mange av de positive finner vi?</td></tr>
<tr><td class="l">Spesifisitet</td><td class="l">TN / (TN + FP)</td><td class="l">Hvor mange av de negative avviser vi riktig?</td></tr>
<tr><td class="l">Presisjon</td><td class="l">TP / (TP + FP)</td><td class="l">Hvor mange av dem vi kaller positive, er positive?</td></tr>
<tr><td class="l">F1</td><td class="l">2 · presisjon · sensitivitet / (presisjon + sensitivitet)</td><td class="l">Balanse mellom de to.</td></tr>
<tr><td class="l">FPR</td><td class="l">FP / (FP + TN) = 1 − spesifisitet</td><td class="l">x-aksen i ROC-kurven.</td></tr>
</table></div>
<h2>Terskelen</h2>
<p>Standard terskel er 0,5, men den er et valg. Lavere terskel gir flere predikerte positive: sensitiviteten øker og spesifisiteten faller. Velg terskel ut fra hva feilene koster. Er det dyrt å gå glipp av en positiv (for eksempel svindel), velg lav terskel.</p>
<h2>ROC, AUC og lift</h2>
<ul>
<li><b>ROC-kurven</b> tegner sensitivitet mot 1 − spesifisitet for alle terskler. Diagonalen er tilfeldig gjetting. <b>AUC</b> er arealet under kurven: 1 er perfekt, 0,5 er tilfeldig. AUC er også sannsynligheten for at en tilfeldig positiv får høyere propensitet enn en tilfeldig negativ.</li>
<li><b>Kumulativ gevinst (lift chart):</b> sorter etter propensitet, gå nedover listen og tell positive. Jo høyere over diagonalen, desto bedre. Lift = andel positive i det utvalgte ÷ andel positive totalt.</li>
<li><b>Desil-diagram:</b> lift for hver tidel av den sorterte listen. Første søyle viser hvor mye bedre de 10 % «beste» er enn snittet.</li>
<li>ROC og AUC oppsummerer modellen over alle terskler. Lift er mer konkret når vi bare kan kontakte de øverste på listen.</li>
</ul>
<h2>Kostnader, nytte og sjeldne klasser</h2>
<p>Gi hver celle i forvirringsmatrisen en verdi (nytte av TP, kostnad av FP og så videre) og velg terskelen som gir høyest forventet profitt. Lift-kurven kan tegnes med profitt på y-aksen i stedet for antall.</p>
<p>Når den positive klassen er sjelden, kan <b>oversampling</b> hjelpe: tren modellen på et utvalg der den sjeldne klassen er overrepresentert. Evaluer på data med den opprinnelige fordelingen, ellers blir målene for optimistiske.</p>
<div class="pit"><b>Eksamensfelle: nøyaktighet med skjeve klasser</b>Med 1 % positive får en modell som alltid sier «negativ» 99 % nøyaktighet. Bruk sensitivitet, presisjon, lift eller profitt i stedet.</div>
<h2>Python</h2>
<pre><code>from mlba import classificationSummary, gainsChart, liftChart
from sklearn.metrics import roc_curve, auc

prob = model.predict_proba(valid_X)[:, 1]                # kolonne 1 = sannsynlighet for klasse 1
pred = [1 if p &gt; 0.5 else 0 for p in prob]              # klasse 1 hvis p &gt; 0,5; bytt terskel her
classificationSummary(y_true=valid_y, y_pred=pred, class_names=['0', '1'])   # forvirringsmatrise og accuracy

fpr, tpr, _ = roc_curve(valid_y, prob)                   # FPR og TPR for alle mulige terskler
print('AUC:', auc(fpr, tpr))                             # arealet under ROC-kurven

df = pd.DataFrame({'actual': valid_y, 'prob': prob})     # fasit og sannsynlighet side om side
gainsChart(df, ranking='prob', actual='actual')          # sortert etter prob: kumulativt antall 1-ere
liftChart(df, ranking='prob', actual='actual')           # lift per tidel (desil-diagram)

df['profit'] = df['actual'].apply(lambda x: 100 if x == 1 else -200)   # en 1-er gir +100, en 0 koster 200
gainsChart(df, ranking='prob', actual='profit', type='regression')   # kumulativ gevinst i kroner</code></pre>`
});
