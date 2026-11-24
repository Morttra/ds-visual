/* Legges oppå en trent modell: SHAP og konform prediksjon */

topic({
  id: 'shap', data: [['toyota']], short: 'SHAP', lecture: 'F8', tags: ['Forklarbar KI', 'Modellagnostisk', 'Shapley-verdier'],
  title: 'Forklarbar KI med SHAP',
  path: ['Legges oppå en trent modell'],
  lead: 'SHAP forklarer én enkelt prediksjon ved å fordele avstanden mellom prediksjonen og gjennomsnittsprediksjonen på forklaringsvariablene. Fordelingen bygger på Shapley-verdier fra spillteori: hver variabels gjennomsnittlige marginale bidrag.',
  figs: [{
    title: 'Shapley-verdier: rettferdig fordeling av en gevinst',
    sub: 'Tre konsulenter, Ada, Bo og Cleo, kan ta et oppdrag alene eller sammen. Tallene er hva hver koalisjon kan tjene (i 1000 kr). Endre tallene og se fordelingen.',
    build(el) {
      const P = ['A', 'B', 'C'], N = { A: 'Ada', B: 'Bo', C: 'Cleo' };
      const v = { '': 0, A: 60, B: 40, C: 20, AB: 120, AC: 90, BC: 70, ABC: 160 };
      const key = set => P.filter(p => set.includes(p)).join('');
      const ctl = Controls(el);
      for (const k of ['A', 'B', 'C', 'AB', 'AC', 'BC', 'ABC']) NumIn(ctl, { label: 'v(' + k.split('').map(c => N[c]).join(' + ') + ')', value: v[k], min: -1000, max: 10000, oninput: x => { v[k] = x; draw(); } });
      const tw = H('div', { class: 'tblwrap' }); el.append(tw);
      const tiles = Tiles(el, [['A', 'Shapley Ada'], ['B', 'Shapley Bo'], ['C', 'Shapley Cleo'], ['s', 'Sum = v(alle)']]);
      const orders = [['A', 'B', 'C'], ['A', 'C', 'B'], ['B', 'A', 'C'], ['B', 'C', 'A'], ['C', 'A', 'B'], ['C', 'B', 'A']];
      function draw() {
        const rows = orders.map(o => { const mc = {}; let cur = []; for (const p of o) { const before = v[key(cur)]; cur = cur.concat([p]); mc[p] = v[key(cur)] - before; } return [o, mc]; });
        const sh = Object.fromEntries(P.map(p => [p, mean(rows.map(r => r[1][p]))]));
        clear(tw).append(H('table', { class: 'tbl' }, H('tr', {}, H('th', { class: 'l' }, 'Rekkefølge de blir med i'), P.map(p => H('th', {}, 'Bidrag ' + N[p]))),
          rows.map(([o, mc]) => H('tr', {}, H('td', { class: 'l' }, o.map(p => N[p]).join(' → ')), P.map(p => H('td', {}, fx(mc[p], 0))))),
          H('tr', { class: 'on' }, H('th', { class: 'l' }, 'Snitt = Shapley-verdi'), P.map(p => H('th', {}, fx(sh[p], 1))))));
        P.forEach(p => tiles.set(p, fx(sh[p], 1))); tiles.set('s', fx(sh.A + sh.B + sh.C, 1) + ' = ' + fx(v.ABC, 0), 'good');
      }
      draw();
    },
    tryit: ['Les en rad: i rekkefølgen Bo → Ada → Cleo bidrar Ada med v(Ada + Bo) − v(Bo) = 120 − 40 = 80.', 'Shapley-verdiene summerer alltid til hva alle tre tjener sammen. Det kalles effektivitet.', 'Gjør Cleo verdiløs: sett v(Cleo) = 0, v(Ada + Cleo) = 60, v(Bo + Cleo) = 40 og v(Ada + Bo + Cleo) = 120. Da får Cleo 0. En spiller som aldri bidrar, får ingenting.']
  }, {
    title: 'Waterfall: hvorfor fikk denne bilen denne prisen?',
    sub: 'En lineær regresjonsmodell for bruktbilpris, trent på 600 biler og brukt på biler fra valideringsdataene som den ikke har sett. For en lineær modell er SHAP-verdien φ = b · (x − gjennomsnitt av x).',
    build(el) {
      const s = DATA.shapLinear; let ci = 0;
      const ctl = Controls(el);
      Seg(ctl, { label: 'Bil', options: s.cars.map((c, i) => [i, 'Bil ' + (i + 1)]), value: ci, onchange: v => { ci = v; draw(); } });
      const svg = S('svg', { viewBox: '0 0 760 420', class: 'plot', role: 'img', 'aria-label': 'Waterfall-plott' }); el.append(svg);
      const tiles = Tiles(el, [['b', 'E[f(X)]: snittprediksjon'], ['p', 'f(x): prediksjon for bilen'], ['a', 'Faktisk pris']]);
      function draw() {
        const c = s.cars[ci], items = s.cols.map((n, j) => [n, c.phi[j], c.x[j]]).sort((p, q) => Math.abs(q[1]) - Math.abs(p[1]));
        const top = items.slice(0, 8), rest = items.slice(8), restSum = sum(rest.map(r => r[1]));
        const rows = top.concat([[rest.length + ' andre variabler', restSum, null]]);
        let cum = s.base; const segs = rows.map(r => { const a = cum; cum += r[1]; return [r, a, cum]; });
        const vals = [s.base, c.pred].concat(segs.flatMap(t => [t[1], t[2]])), lo = Math.min(...vals) - 600, hi = Math.max(...vals) + 600;
        const X = lin(lo, hi, 250, 740); clear(svg);
        S('line', { x1: X(c.pred), x2: X(c.pred), y1: 22, y2: 392, class: 's-ink', 'stroke-width': 2 }, svg);
        niceTicks(lo, hi, 6).forEach(t => { S('line', { x1: X(t), x2: X(t), y1: 30, y2: 392, class: 's-line' }, svg); S('text', { x: X(t), y: 410, 'text-anchor': 'middle', text: fint(t), style: 'font-size:11px' }, svg); });
        S('line', { x1: X(s.base), x2: X(s.base), y1: 22, y2: 392, class: 's-mut', 'stroke-dasharray': '4 4' }, svg);
        S('text', { x: X(s.base), y: 16, 'text-anchor': 'middle', text: 'E[f(X)] = ' + fint(s.base), style: 'font-size:11px' }, svg);
        segs.forEach(([r, a, b], i) => { const y = 34 + i * 38, pos = r[1] >= 0;
          S('text', { x: 240, y: y + 18, 'text-anchor': 'end', class: 'lbl', text: (TOY_NAMES[r[0]] || r[0]) + (r[2] != null ? ' = ' + (r[0] === 'KM' ? fint(r[2]) : fx(r[2], 0)) : ''), style: 'font-size:12px' }, svg);
          S('rect', { x: Math.min(X(a), X(b)), y, width: Math.max(1.5, Math.abs(X(b) - X(a))), height: 26, rx: 3, class: pos ? 'f-c1' : 'f-c0', 'fill-opacity': 0.85 }, svg);
          S('text', { x: pos ? Math.max(X(a), X(b)) + 5 : Math.min(X(a), X(b)) - 5, y: y + 18, 'text-anchor': pos ? 'start' : 'end', class: 'lbl halo', text: (pos ? '+' : '') + fint(r[1]), style: 'font-size:11.5px' }, svg);
          if (i < segs.length - 1) S('line', { x1: X(b), x2: X(b), y1: y + 26, y2: y + 38, class: 's-mut' }, svg); });
        S('text', { x: X(c.pred) + 4, y: 28, class: 'lbl halo', text: 'f(x) = ' + fint(c.pred), style: 'font-size:11.5px;font-weight:600' }, svg);
        tiles.set('b', fint(s.base) + ' €'); tiles.set('p', fint(c.pred) + ' €', 'hl'); tiles.set('a', fint(c.actual) + ' €');
      }
      draw();
      el.append(H('p', { class: 'note', html: 'Søylene starter i snittprediksjonen og legges på etter hverandre. <b style="color:var(--c1)">Grønne</b> drar prisen opp, <b style="color:var(--c0)">oransje</b> drar den ned. Summen ender nøyaktig i prediksjonen.' }));
    },
    tryit: ['Bytt mellom bilene. Alder er nesten alltid den største søylen: eldre enn snittet trekker ned, nyere trekker opp.', 'Legg merke til at en variabel med verdi nær gjennomsnittet får en kort søyle, uansett hvor stor koeffisienten er.']
  }],
  body: `
<h2>Hvorfor forklarbar KI?</h2>
<p>Ensembler og nevrale nett treffer godt, men er «svarte bokser». Når en modell avgjør lån, forsikring eller ansettelser, må vi kunne forklare beslutningen, oppdage skjevheter og stole på at modellen bruker fornuftige signaler.</p>
<ul>
<li><b>Global forklaring:</b> hvordan modellen oppfører seg generelt (variabelviktighet, partial dependence plot).</li>
<li><b>Lokal forklaring:</b> hvorfor akkurat denne observasjonen fikk akkurat denne prediksjonen (SHAP-waterfall).</li>
<li><b>Modellspesifikk</b> forklaring virker for én modelltype (koeffisienter, trestruktur). <b>Modellagnostisk</b> forklaring, som SHAP, virker for alle modeller.</li>
</ul>
<h2>Shapley-verdier</h2>
<p>I spillteori fordeler Shapley-verdien gevinsten fra et samarbeid. Hver spiller får sitt <b>gjennomsnittlige marginale bidrag</b> over alle rekkefølger spillerne kan bli med i.</p>
<div class="formula">φ<sub><span class="v">i</span></sub> = Σ<sub><span class="v">S</span> ⊆ <span class="v">N</span> \\ {<span class="v">i</span>}</sub> |<span class="v">S</span>|! (<span class="v">n</span> − |<span class="v">S</span>| − 1)! / <span class="v">n</span>! · [<span class="v">v</span>(<span class="v">S</span> ∪ {<span class="v">i</span>}) − <span class="v">v</span>(<span class="v">S</span>)]</div>
<p>Med tre spillere er vektene 1/3 for den tomme koalisjonen, 1/6 for hver av de to koalisjonene med én annen spiller, og 1/3 for koalisjonen med begge de andre. Det gir samme svar som snittet over de seks rekkefølgene.</p>
<h2>Fra spill til modell</h2>
<ul>
<li>Spillerne er forklaringsvariablene. «Gevinsten» er prediksjonen for én observasjon minus snittprediksjonen.</li>
<li><b>Lokal nøyaktighet:</b> E[f(X)] + Σ φ<sub>j</sub> = f(x). Waterfall-plottet viser nettopp denne summen.</li>
<li>For en lineær modell er φ<sub>j</sub> = b<sub>j</sub> (x<sub>j</sub> − x̄<sub>j</sub>). For andre modeller estimerer <code>shap</code> verdiene, for eksempel med spesialiserte metoder for trær.</li>
<li><b>Beeswarm-plott</b> viser SHAP-verdiene for alle observasjoner: én rad per variabel, punktene farget etter variabelens verdi. Det gir et globalt bilde bygget av lokale forklaringer.</li>
</ul>
<div class="pit"><b>Eksamensfelle</b>SHAP forklarer <i>modellen</i>, ikke virkeligheten. En stor SHAP-verdi betyr at modellen bruker variabelen mye, ikke at variabelen forårsaker utfallet.</div>
<h2>Python</h2>
<pre><code>import shap

X100 = shap.utils.sample(X_train, 100)                     # 100 tilfeldige bakgrunnsrader
explainer = shap.Explainer(model.predict, X100)            # trenger bare predict-funksjonen: modellagnostisk
shap_values = explainer(X_valid)                           # én SHAP-verdi per rad og variabel

shap.plots.waterfall(shap_values[0])                       # lokal forklaring, én observasjon
shap.plots.beeswarm(shap_values)                           # global oversikt
shap.plots.scatter(shap_values[:, 'Age_08_04'])            # SHAP mot verdien til én variabel (her bilens alder)

explainer_rf = shap.TreeExplainer(rf_model)                # rask, eksakt variant som bruker trestrukturen
shap_values_rf = explainer_rf(X_valid)</code></pre>`
});

topic({
  id: 'konform', dataNote: 'Figuren bruker <b>simulerte data</b>: en kjent kurve pluss normalfordelt støy, slik at vi kan trekke så mange nye kalibrerings- og testpunkter vi vil.', short: 'Konform prediksjon', lecture: 'F8', tags: ['Usikkerhet', 'Modellagnostisk', 'Prediksjonsintervall'],
  title: 'Usikkerhet med konform prediksjon',
  path: ['Legges oppå en trent modell'],
  lead: 'En prediksjon uten usikkerhet sier ikke hvor mye vi kan stole på den. Konform prediksjon legger et kalibrert intervall rundt prediksjonene fra en hvilken som helst modell. Split conformal bruker feilene på et eget kalibreringssett til å bestemme hvor bredt intervallet må være.',
  figs: [{
    title: 'Split conformal: fra kalibreringsfeil til intervall',
    sub: 'Simulerte data. En modell (blå kurve) er trent på egne treningsdata. Feilene på kalibreringssettet sorteres, og q̂ er den k-te minste, der k = ⌈(n + 1)(1 − α)⌉. Intervallet ŷ ± q̂ testes på 400 nye punkter.',
    build(el) {
      const f = x => 2 + 1.2 * Math.sin(1.6 * x) + 0.25 * x, noise = 0.45;
      const gen = (seed, n) => { const r = RNG(seed); return range(n, () => { const x = 6 * r(); return [x, f(x) + noise * r.n()]; }); };
      const tr = gen(1, 60), b = polyfit(tr.map(p => p[0] / 3 - 1), tr.map(p => p[1]), 5), yh = x => polyval(b, x / 3 - 1);
      const test = gen(999, 400), testErr = test.map(p => Math.abs(p[1] - yh(p[0])));
      let n = 19, cov = 0.9, seed = 5;
      const qhat = (scores, a) => { const s = scores.slice().sort((p, q) => p - q), k = Math.ceil((s.length + 1) * a); return { k, q: k <= s.length ? s[k - 1] : Infinity, s }; };
      const ctl = Controls(el);
      Slider(ctl, { label: 'Kalibreringspunkter n', min: 5, max: 200, value: n, oninput: v => { n = v; draw(); } });
      Slider(ctl, { label: 'Ønsket dekning 1 − α', min: 0.5, max: 0.99, step: 0.01, value: cov, fmt: v => fpct(v, 0), oninput: v => { cov = v; draw(); } });
      Btn(ctl, 'Nytt kalibreringssett', () => { seed++; draw(); }, 'primary');
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), c = H('div'); cols.append(a, c);
      const plot = new Plot(a, { w: 560, h: 380, x: [0, 6], y: [-0.5, 5.5], xlab: 'x', ylab: 'y', label: 'Prediksjonsintervall på testdata' });
      const gB = plot.clipLayer(), gT = plot.layer(), gC = plot.layer();
      const strip = new Plot(c, { w: 380, h: 170, m: { t: 10, r: 12, b: 40, l: 12 }, x: [0, 2], y: [0, 1], yticks: [], xlab: 'Kalibreringsfeil |y − ŷ| (sortert)', label: 'Sorterte kalibreringsfeil' });
      const gS = strip.layer();
      const tiles = Tiles(c, [['k', 'k = ⌈(n + 1)(1 − α)⌉'], ['q', 'q̂ (feilgrense)'], ['w', 'Intervallbredde 2q̂'], ['tc', 'Dekning på disse testdataene'], ['avg', 'Forventet dekning k / (n + 1)']]);
      function draw() {
        const cal = gen(seed * 31, n), sc = cal.map(p => Math.abs(p[1] - yh(p[0]))), { k, q, s } = qhat(sc, cov);
        const X = plot.x, Y = plot.y, xs = range(121, i => i / 20);
        clear(gB); clear(gT); clear(gC);
        if (isFinite(q)) S('path', { d: pathOf(xs.map(x => [X(x), Y(yh(x) + q)]).concat(xs.slice().reverse().map(x => [X(x), Y(yh(x) - q)]))) + 'Z', class: 'f-acc', 'fill-opacity': 0.14 }, gB);
        S('path', { d: pathOf(xs.map(x => [X(x), Y(yh(x))])), fill: 'none', class: 's-acc', 'stroke-width': 2.5 }, gB);
        test.forEach((p, i) => S('circle', { cx: X(p[0]), cy: Y(p[1]), r: 2.4, class: testErr[i] <= q ? 'f-mut' : 'f-bad', 'fill-opacity': testErr[i] <= q ? 0.45 : 0.9 }, gT));
        cal.forEach(p => S('circle', { cx: X(p[0]), cy: Y(p[1]), r: 4.5, class: 'f-hl s-ink', 'stroke-width': 1 }, gC));
        clear(gS); const SX = strip.x, SY = strip.y, cnt = {};
        s.forEach((v, i) => { const bin = Math.round(Math.min(v, 1.98) * 25); cnt[bin] = (cnt[bin] || 0) + 1; S('circle', { cx: SX(Math.min(v, 1.98)), cy: SY(0.06 + 0.075 * (cnt[bin] - 1)), r: 3.6, class: i < k ? 'f-acc' : 'f-mut', 'fill-opacity': i === k - 1 ? 1 : 0.6, stroke: i === k - 1 ? 'currentColor' : null, style: 'color:var(--ink)', 'stroke-width': 2 }, gS); });
        if (isFinite(q)) { S('line', { x1: SX(Math.min(q, 1.98)), x2: SX(Math.min(q, 1.98)), y1: SY(0), y2: SY(1), class: 's-ink', 'stroke-dasharray': '4 3' }, gS); S('text', { x: SX(Math.min(q, 1.98)) + 4, y: SY(0.9), class: 'lbl', text: 'q̂', style: 'font-size:13px' }, gS); }
        const tc = testErr.filter(e => e <= q).length / testErr.length;
        tiles.set('k', k > n ? `${k} > n` : `${k} av ${n}`, k > n ? 'bad' : '');
        tiles.set('q', isFinite(q) ? fx(q, 3) : '∞'); tiles.set('w', isFinite(q) ? fx(2 * q, 3) : '∞');
        tiles.set('tc', fpct(tc)); tiles.set('avg', k > n ? '100 % (∞)' : fpct(k / (n + 1)), 'good');
      }
      draw();
      el.append(H('p', { class: 'note', html: 'Gule punkter er kalibreringssettet. Røde testpunkter havner utenfor intervallet.' }));
    },
    tryit: ['Med n = 19 og 90 % dekning blir k = ⌈20 · 0,9⌉ = 18: q̂ er den nest største av 19 feil.', 'Trykk «Nytt kalibreringssett» flere ganger. Dekningen på testdataene hopper rundt 90 %. Garantien gjelder i snitt: forventet dekning er k / (n + 1), som aldri er under 1 − α.', 'Sett n = 5 og 90 %. Da blir k = 6 &gt; n, og intervallet blir uendelig bredt: for få kalibreringspunkter til å garantere ønsket dekning.', 'Øk dekningen til 99 %. Intervallet blir mye bredere. God dekning er lett å få; smale intervaller (skarphet) er det vanskelige.']
  }],
  body: `
<h2>To typer usikkerhet</h2>
<ul>
<li><b>Aleatorisk usikkerhet</b> er tilfeldig variasjon i dataene selv: to like biler selges til ulik pris. Den forsvinner ikke med mer data.</li>
<li><b>Epistemisk usikkerhet</b> skyldes at modellen vet for lite: få data i et område eller feil modellform. Den kan reduseres med mer data og bedre modeller.</li>
</ul>
<h2>Godt intervall: dekning og skarphet</h2>
<p>Et 90 %-intervall er <b>kalibrert</b> når det inneholder den sanne verdien for 90 % av nye observasjoner (dekning, coverage). Blant intervaller med riktig dekning vil vi ha de smaleste (<b>skarphet</b>). Et uendelig bredt intervall har 100 % dekning, men er ubrukelig.</p>
<h2>Split conformal steg for steg</h2>
<ol>
<li>Del dataene i tre: trening, kalibrering og test. Kalibreringsdataene skal ikke brukes til å trene modellen.</li>
<li>Tren modellen på treningsdataene, med vanlig modellvalg.</li>
<li>Prediker kalibreringsdataene og regn ut en nonconformity score, for eksempel absoluttfeilen |y − ŷ|.</li>
<li>Finn feilgrensen q̂: sorter de n scorene og ta den k-te minste, der k = ⌈(n + 1)(1 − α)⌉.</li>
<li>Lag intervallet [ŷ − q̂, ŷ + q̂] for nye observasjoner.</li>
</ol>
<div class="formula">Garanti: P(<span class="v">y</span><sub>ny</sub> ∈ [<span class="v">ŷ</span> − <span class="v">q̂</span>, <span class="v">ŷ</span> + <span class="v">q̂</span>]) ≥ 1 − α</div>
<p>Garantien holder når nye observasjoner kommer fra samme fordeling som kalibreringsdataene (exchangeability), og den gjelder i snitt over mange nye observasjoner, ikke for hver enkelt. Med absoluttfeil blir intervallet like bredt overalt. Mer avanserte varianter, som conformalized quantile regression, gir bredde som varierer.</p>
<div class="pros">
<div><h3>Styrker</h3><ul><li>Modellagnostisk: en «wrapper» rundt hvilken som helst trent modell</li><li>Garantert dekning med få antakelser</li><li>Du velger selv dekningsgraden</li></ul></div>
<div><h3>Svakheter</h3><ul><li>Krever egne kalibreringsdata</li><li>Garantien er i snitt, ikke for hver gruppe</li><li>Med enkel score er bredden lik for alle</li></ul></div>
</div>
<div class="pit"><b>Eksamensfelle: finn q̂ for hånd</b>n = 9 kalibreringsfeil og 80 % dekning: k = ⌈10 · 0,8⌉ = 8, så q̂ er den 8. minste feilen. Husk +1 i formelen og å runde opp.</div>
<h2>Python</h2>
<pre><code>from mapie.regression import SplitConformalRegressor
from mapie.utils import train_conformalize_test_split
from mapie.metrics.regression import regression_coverage_score

# tre deler: 60 % trening, 20 % kalibrering, 20 % test
(X_train, X_cal, X_test, y_train, y_cal, y_test) = train_conformalize_test_split(
    X, y, train_size=0.6, conformalize_size=0.2, test_size=0.2, random_state=1)

rf_model = RandomForestRegressor(random_state=1).fit(X_train, y_train)   # trent bare på treningsdelen

# 90 % intervaller; prefit=True betyr at modellen allerede er trent
mapie_model = SplitConformalRegressor(estimator=rf_model, confidence_level=0.90, prefit=True)
mapie_model.conformalize(X_cal, y_cal)                    # feil på kalibreringsdata gir intervallbredden
y_pred, y_interval = mapie_model.predict_interval(X_test)   # punktprediksjon og intervall
print(regression_coverage_score(y_test, y_interval))      # andel testpunkter innenfor, bør være ca. 0,90</code></pre>`
});
