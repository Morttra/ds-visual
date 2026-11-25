/* k-NN og naiv Bayes */

topic({
  id: 'knn', data: [['mowers'], ['toyota', ['Price', 'Age_08_04']]], short: 'k-NN', lecture: 'F6', tags: ['Klassifikasjon', 'Prediksjon', 'Avstander'],
  title: 'k-nærmeste naboer (k-NN)',
  path: ['Veiledet læring', 'Klassifikasjon og prediksjon'],
  lead: 'k-NN finner de k treningspunktene som ligner mest på et nytt punkt og lar dem stemme. For en numerisk responsvariabel tar vi gjennomsnittet av naboenes Y. Det finnes ingen modell å tilpasse; hele treningssettet er modellen.',
  figs: [{
    title: 'Naboene stemmer',
    sub: 'Sitteklipperdataene: 24 husholdninger, 12 eiere og 12 ikke-eiere. Avstandene regnes på standardiserte variabler (z-score), men aksene viser vanlige enheter. Klikk eller dra for å flytte den nye husholdningen.',
    build(el) {
      const R = DATA.mowers, I = R.map(r => r[0]), L = R.map(r => r[1]), mI = mean(I), sI = sd(I), mL = mean(L), sL = sd(L);
      const Z = R.map(r => [(r[0] - mI) / sI, (r[1] - mL) / sL, r[2]]);
      const zq = (i, l) => [(i - mI) / sI, (l - mL) / sL];
      let k = 3, q = [60, 20], regions = true;
      const vote = (z, kk, skip) => { const d = Z.map((p, j) => [j === skip ? 1e9 : dist2(p, z), j]).sort((a, b) => a[0] - b[0]).slice(0, kk); return { nb: d, share: d.filter(t => Z[t[1]][2]).length / kk }; };
      const loo = range(12, j => { const kk = 2 * j + 1; return Z.filter((p, i) => (vote(p, kk, i).share > 0.5 ? 1 : 0) === p[2]).length / 24; });
      const ctl = Controls(el);
      Slider(ctl, { label: 'k', min: 1, max: 23, step: 2, value: k, oninput: v => { k = v; draw(true); } });
      Seg(ctl, { label: 'Beslutningsområder', options: [[true, 'Vis'], [false, 'Skjul']], value: regions, onchange: v => { regions = v; draw(true); } });
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const plot = new Plot(a, { w: 560, h: 430, x: [25, 120], y: [13, 25], xlab: 'Income (1000 $)', ylab: 'Lot_Size (1000 ft²)', label: 'k-NN med beslutningsområder' });
      const gR = plot.layer(), gN = plot.layer(), gP = plot.layer(), gQ = plot.layer();
      gR.setAttribute('shape-rendering', 'crispEdges');
      const tiles = Tiles(b, [['sh', 'Andel eiere blant naboene'], ['cl', 'Klasse (terskel 0,5)']]);
      const p2 = new Plot(b, { w: 340, h: 200, m: { t: 10, r: 10, b: 40, l: 46 }, x: [0, 24], y: [0, 1], xticks: [1, 5, 9, 13, 17, 21, 23], xlab: 'k', ylab: 'LOOCV-nøyaktighet', label: 'Nøyaktighet mot k' });
      S('path', { d: pathOf(loo.map((v, j) => [p2.x(2 * j + 1), p2.y(v)])), fill: 'none', class: 's-acc', 'stroke-width': 2 }, p2.gData);
      loo.forEach((v, j) => S('circle', { cx: p2.x(2 * j + 1), cy: p2.y(v), r: 3, class: 'f-acc' }, p2.gData));
      const kMark = S('circle', { r: 7, class: 'f-hl s-ink' }, p2.gTop);
      b.append(H('p', { class: 'note', html: 'LOOCV: hver husholdning klassifiseres av de 23 andre. Det viser hvilken k som generaliserer best.' }));
      const qS = S('polygon', { class: 'f-hl s-ink', 'stroke-width': 1.2 }, gQ);
      const move = p => { q = [clamp(p.x, 26, 119), clamp(p.y, 13.2, 24.8)]; draw(false); };
      draggable(plot, qS, move); clickMove(plot, move);
      function draw(full) {
        const X = plot.x, Y = plot.y;
        if (full !== false) {
          clear(gR);
          if (regions) { const nx = 64, ny = 44, dx = 95 / nx, dy = 12 / ny;
            for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const xi = 25 + (i + 0.5) * dx, yj = 13 + (j + 0.5) * dy, s = vote(zq(xi, yj), k).share;
              S('rect', { x: X(25 + i * dx), y: Y(13 + (j + 1) * dy), width: X(25 + dx) - X(25), height: Y(13) - Y(13 + dy), class: s > 0.5 ? 'f-c1' : 'f-c0', 'fill-opacity': 0.13 }, gR); } }
          clear(gP); R.forEach(r => S('circle', { cx: X(r[0]), cy: Y(r[1]), r: 6, class: (r[2] ? 'f-c1' : 'f-c0') + ' s-surf', 'stroke-width': 1.5 }, gP));
          kMark.setAttribute('cx', p2.x(k)); kMark.setAttribute('cy', p2.y(loo[(k - 1) / 2]));
        }
        const z = zq(q[0], q[1]), v = vote(z, k);
        clear(gN);
        const rr = v.nb[k - 1][0];
        S('ellipse', { cx: X(q[0]), cy: Y(q[1]), rx: Math.abs(X(q[0] + rr * sI) - X(q[0])), ry: Math.abs(Y(q[1] + rr * sL) - Y(q[1])), fill: 'none', class: 's-ink', 'stroke-dasharray': '4 4', 'stroke-opacity': 0.6 }, gN);
        v.nb.forEach(t => { const r = R[t[1]]; S('line', { x1: X(q[0]), y1: Y(q[1]), x2: X(r[0]), y2: Y(r[1]), class: 's-ink', 'stroke-width': 1.3 }, gN); S('circle', { cx: X(r[0]), cy: Y(r[1]), r: 9, fill: 'none', class: 's-ink', 'stroke-width': 1.5 }, gN); });
        qS.setAttribute('points', star(X(q[0]), Y(q[1]), 11, 5));
        tiles.set('sh', fx(v.share, 2) + ` (${Math.round(v.share * k)} av ${k})`);
        tiles.set('cl', v.share > 0.5 ? 'eier' : 'ikke-eier', v.share > 0.5 ? 'good' : '');
      }
      draw(true);
    },
    tryit: ['Sett k = 1. Beslutningsområdene blir små øyer rundt enkeltpunkter: lav bias, høy varians.',
      'Sett k = 23. Nesten hele planet får samme farge. Se også LOOCV: med k = 23 stemmer alle de 23 andre, og der er motsatt klasse alltid i flertall (12 mot 11). Alle blir feilklassifisert.',
      'Andelen eiere blant naboene er k-NN sin propensitet. Den kan brukes med en annen terskel enn 0,5, akkurat som i logistisk regresjon.']
  }, {
    title: 'k-NN for tall: gjennomsnittet av naboene',
    sub: '30 bruktbiler fra treningsdataene, med alder i måneder og pris i euro. Prediksjonen for en alder er gjennomsnittsprisen til de k bilene som har nærmest alder. Klikk i figuren for å velge en alder.',
    build(el) {
      const D = DATA.toyotaLSQ; let k = 5, q = 40;
      const pred = (x, kk, skip) => mean(D.map((d, i) => [i === skip ? 1e9 : Math.abs(d[0] - x) + i * 1e-6, d[1]]).sort((a, b) => a[0] - b[0]).slice(0, kk).map(t => t[1]));
      const ctl = Controls(el);
      Slider(ctl, { label: 'k', min: 1, max: 29, value: k, oninput: v => { k = v; draw(); } });
      const plot = new Plot(el, { w: 760, h: 320, x: [0, 80], y: [0, 36000], xlab: 'Alder (måneder)', ylab: 'Pris (€)', label: 'k-NN-prediksjon av pris' });
      const gC = plot.clipLayer(), gN = plot.layer(), gP = plot.layer();
      const tiles = Tiles(el, [['p', 'Prediksjon for valgt alder'], ['loo', 'RMSE (LOOCV)']]);
      clickMove(plot, p => { q = clamp(Math.round(p.x), 1, 79); draw(); });
      function draw() {
        clear(gC); clear(gN); clear(gP); const X = plot.x, Y = plot.y;
        S('path', { d: pathOf(range(321, i => i / 4).map(x => [X(x), Y(pred(x, k))])), fill: 'none', class: 's-acc', 'stroke-width': 2.5 }, gC);
        const nb = D.map((d, i) => [Math.abs(d[0] - q) + i * 1e-6, i]).sort((a, b) => a[0] - b[0]).slice(0, k).map(t => t[1]);
        D.forEach((d, i) => S('circle', { cx: X(d[0]), cy: Y(d[1]), r: nb.includes(i) ? 6.5 : 4.5, class: nb.includes(i) ? 'f-hl s-ink' : 'f-ink' }, gP));
        const yq = pred(q, k);
        S('line', { x1: X(q), x2: X(q), y1: Y(0), y2: Y(yq), class: 's-ink', 'stroke-dasharray': '3 3' }, gN);
        S('circle', { cx: X(q), cy: Y(yq), r: 7, class: 'f-acc s-surf', 'stroke-width': 2 }, gN);
        tiles.set('p', fint(yq) + ' €');
        tiles.set('loo', fint(Math.sqrt(mean(D.map((d, i) => (d[1] - pred(d[0], k, i)) ** 2)))) + ' €');
      }
      draw();
    },
    tryit: ['k = 1 gir en trappekurve som treffer hvert punkt. k = 29 gir nesten en flat linje i snittet.', 'Se etter k der RMSE (LOOCV) er lavest. Det er samme avveining mellom bias og varians som for klassifikasjon.']
  }],
  body: `
<h2>Algoritmen</h2>
<ol>
<li>Standardiser forklaringsvariablene (med snitt og standardavvik fra treningsdataene).</li>
<li>Regn avstanden fra det nye punktet til alle punkter i treningsdataene, vanligvis euklidsk avstand.</li>
<li>Finn de k nærmeste.</li>
<li><b>Klassifikasjon:</b> andelen naboer i klasse 1 er propensiteten. Flertallet bestemmer klassen (terskel 0,5). <b>Prediksjon:</b> bruk gjennomsnittet av naboenes Y, eventuelt vektet med avstand.</li>
</ol>
<div class="formula">Euklidsk avstand: <span class="v">d</span>(<span class="v">x</span>, <span class="v">u</span>) = √[(<span class="v">x</span><sub>1</sub> − <span class="v">u</span><sub>1</sub>)² + (<span class="v">x</span><sub>2</sub> − <span class="v">u</span><sub>2</sub>)² + … + (<span class="v">x</span><sub><span class="v">p</span></sub> − <span class="v">u</span><sub><span class="v">p</span></sub>)²]</div>
<h2>Valg av k</h2>
<ul>
<li>Liten k: fleksibel modell som følger støy. Lav bias, høy varians.</li>
<li>Stor k: glatt modell som overser lokale mønstre. Høy bias, lav varians. k = n gir alltid den største klassen, som er den naive benchmarken.</li>
<li>Velg k med lavest feil på valideringssettet eller med kryssvalidering. Bruk et oddetall ved to klasser, så unngår du uavgjort.</li>
</ul>
<div class="pros">
<div><h3>Styrker</h3><ul><li>Enkel idé, ingen antakelser om formen på sammenhengen</li><li>Fanger kompliserte, lokale mønstre når det er nok data</li><li>Samme metode for klassifikasjon og prediksjon</li></ul></div>
<div><h3>Svakheter</h3><ul><li>Treg prediksjon: avstanden til alle treningspunkter må regnes ut</li><li>Dimensjonenes forbannelse: med mange variabler blir alle punkter «langt unna»</li><li>Krever skalering, og gir ingen tolkbare koeffisienter</li></ul></div>
</div>
<div class="pit"><b>Eksamensfelle: glemt standardisering</b>Uten skalering bestemmer variabelen med størst tall avstanden. I sitteklipperdataene ville inntekt (33–110) dominert helt over tomtestørrelse (14–24). Se figuren på <a href="#dataforberedelse">preprosessering</a>.</div>
<div class="pit"><b>Eksamensfelle: regn for hånd</b>Typisk oppgave: gitt standardiserte verdier, regn avstanden til noen punkter, finn de k nærmeste og stem. Husk kvadratroten, og husk at rangeringen ikke endres om du dropper den.</div>
<h2>Python</h2>
<pre><code>from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score

predictors = ['Income', 'Lot_Size']
scaler = StandardScaler().fit(train_df[predictors])          # snitt og standardavvik fra treningsdata
train_X = scaler.transform(train_df[predictors])            # z-score, så begge variablene teller likt
valid_X = scaler.transform(valid_df[predictors])            # med treningens snitt og standardavvik

results = []
for k in range(1, 15):                                       # prøv k = 1 til 14
    knn = KNeighborsClassifier(n_neighbors=k).fit(train_X, train_df['Ownership'])   # tren med k naboer
    results.append({'k': k, 'accuracy': accuracy_score(valid_df['Ownership'], knn.predict(valid_X))})
print(pd.DataFrame(results))                                 # accuracy på validering per k; velg den beste

new_household = pd.DataFrame([{'Income': 60, 'Lot_Size': 20}])   # ny husholdning som skal klassifiseres
knn = KNeighborsClassifier(n_neighbors=4).fit(train_X, train_df['Ownership'])   # valgt k = 4
print(knn.predict(scaler.transform(new_household)))         # skaler på samme måte før prediksjon
# avstand til og radnummer for de 4 nærmeste
distances, indices = knn.kneighbors(scaler.transform(new_household))</code></pre>`
});

topic({
  id: 'naiv-bayes', data: [['fraud']], short: 'Naiv Bayes', lecture: 'F6', tags: ['Klassifikasjon', 'Kategoriske X'],
  title: 'Naiv Bayes',
  path: ['Veiledet læring', 'Klassifikasjon'],
  lead: 'Bayes-klassifikatoren regner ut sannsynligheten for hver klasse gitt verdiene til forklaringsvariablene. Den naive varianten antar at variablene er uavhengige innad i hver klasse, og kan derfor bruke alle dataene.',
  figs: [{
    title: 'Komplett og naiv Bayes, steg for steg',
    sub: 'Revisjonseksempelet: 10 selskaper med tidligere anklager (ja/nei) og størrelse (liten/stor). Velg et nytt selskap og se hvilke rader hver metode bruker.',
    build(el) {
      const C = [['ja', 'liten', 'ærlig'], ['nei', 'liten', 'ærlig'], ['nei', 'stor', 'ærlig'], ['nei', 'stor', 'ærlig'], ['nei', 'liten', 'ærlig'], ['nei', 'liten', 'ærlig'], ['ja', 'liten', 'svindel'], ['ja', 'stor', 'svindel'], ['nei', 'stor', 'svindel'], ['ja', 'stor', 'svindel']];
      let a = 'ja', s = 'liten', mode = 'naiv';
      const ctl = Controls(el);
      Seg(ctl, { label: 'Tidligere anklager', options: [['ja', 'Ja'], ['nei', 'Nei']], value: a, onchange: v => { a = v; draw(); } });
      Seg(ctl, { label: 'Størrelse', options: [['liten', 'Liten'], ['stor', 'Stor']], value: s, onchange: v => { s = v; draw(); } });
      Seg(ctl, { label: 'Vis', options: [['komplett', 'Komplett Bayes'], ['naiv', 'Naiv Bayes']], value: mode, onchange: v => { mode = v; draw(); } });
      const cols = H('div', { class: 'cols even' }); el.append(cols);
      const left = H('div', { class: 'tblwrap' }), right = H('div'); cols.append(left, right);
      const calc = H('div'); right.append(calc);
      const bars = S('svg', { viewBox: '0 0 380 120', class: 'plot', role: 'img', 'aria-label': 'P(svindel) med komplett og naiv Bayes' }); right.append(bars);
      const frac = (x, y) => `${x}/${y}`;
      function draw() {
        const isF = r => r[2] === 'svindel', nF = C.filter(isF).length, nT = 10 - nF;
        const match = C.filter(r => r[0] === a && r[1] === s), mF = match.filter(isF).length;
        const exact = match.length ? mF / match.length : null;
        const aF = C.filter(r => isF(r) && r[0] === a).length, sF = C.filter(r => isF(r) && r[1] === s).length;
        const aT = C.filter(r => !isF(r) && r[0] === a).length, sT = C.filter(r => !isF(r) && r[1] === s).length;
        const numF = nF / 10 * aF / nF * sF / nF, numT = nT / 10 * aT / nT * sT / nT, naive = numF / (numF + numT);
        clear(left).append(H('table', { class: 'tbl' }, H('tr', {}, H('th', {}, '#'), H('th', { class: 'l' }, 'Anklager'), H('th', { class: 'l' }, 'Størrelse'), H('th', { class: 'l' }, 'Utfall')),
          C.map((r, i) => {
            const both = r[0] === a && r[1] === s;
            const ca = mode === 'naiv' && r[0] === a, cs = mode === 'naiv' && r[1] === s;
            return H('tr', { class: mode === 'komplett' && both ? 'on' : '' }, H('td', {}, i + 1), H('td', { class: 'l' + (ca ? ' hit' : '') }, r[0]), H('td', { class: 'l' + (cs ? ' hit' : '') }, r[1]), H('td', { class: 'l', style: isF(r) ? 'color:var(--c0);font-weight:600' : '' }, r[2]));
          })));
        if (mode === 'komplett') {
          calc.innerHTML = `<p class="mini" style="margin-top:0">Komplett Bayes bruker bare rader med <b>nøyaktig samme kombinasjon</b> (markert gult): ${match.length} rader, ${mF} av dem svindel.</p>
          <div class="formula" style="font-size:1rem">P(svindel | ${a}, ${s}) = ${frac(mF, match.length)} = ${fx(exact, 3)}</div>`;
        } else {
          calc.innerHTML = `<p class="mini" style="margin-top:0">Naiv Bayes teller hver variabel for seg innad i hver klasse (markert blått), og ganger sammen.</p>
          <div class="formula" style="font-size:.95rem">svindel: P(svindel) · P(${a} | svindel) · P(${s} | svindel) = ${frac(nF, 10)} · ${frac(aF, nF)} · ${frac(sF, nF)} = ${fx(numF, 4)}<br>
          ærlig: P(ærlig) · P(${a} | ærlig) · P(${s} | ærlig) = ${frac(nT, 10)} · ${frac(aT, nT)} · ${frac(sT, nT)} = ${fx(numT, 4)}<br>
          P(svindel | ${a}, ${s}) = ${fx(numF, 4)} / (${fx(numF, 4)} + ${fx(numT, 4)}) = <b>${fx(naive, 3)}</b></div>`;
        }
        clear(bars);
        [['Komplett', exact], ['Naiv', naive]].forEach(([lab, v], i) => {
          const y = 14 + i * 50, w = 260;
          S('text', { x: 0, y: y + 17, text: lab, class: 'lbl', style: 'font-size:12px' }, bars);
          S('rect', { x: 78, y, width: w, height: 24, rx: 4, class: 'f-soft' }, bars);
          S('rect', { x: 78, y, width: w * v, height: 24, rx: 4, class: 'f-c0', 'fill-opacity': mode.startsWith(lab.toLowerCase().slice(0, 4)) ? 1 : 0.45 }, bars);
          S('line', { x1: 78 + w * 0.5, x2: 78 + w * 0.5, y1: y - 3, y2: y + 27, class: 's-ink', 'stroke-dasharray': '3 3' }, bars);
          S('text', { x: 78 + w + 6, y: y + 17, text: fx(v, 3), class: 'lbl', style: 'font-size:12px' }, bars);
        });
        S('text', { x: 78, y: 112, text: 'P(svindel). Stiplet strek = terskel 0,5', style: 'font-size:11px' }, bars);
      }
      draw();
    },
    tryit: ['Start med ja + liten. Komplett Bayes gir 0,5 fra bare to rader. Naiv Bayes bruker alle ti radene og gir 0,53.',
      'Velg nei + liten. Komplett Bayes sier 0, fordi ingen av de tre matchende radene er svindel. Naiv Bayes sier 0,07: lav, men ikke umulig.',
      'Tenk deg 20 variabler. Da finnes det nesten aldri en rad med nøyaktig samme kombinasjon, og komplett Bayes kan ikke brukes. Derfor er den naive varianten den praktiske.']
  }],
  body: `
<h2>Bayes regel</h2>
<div class="formula">P(<span class="v">C</span> | <span class="v">x</span><sub>1</sub>, …, <span class="v">x</span><sub><span class="v">p</span></sub>) = P(<span class="v">x</span><sub>1</sub>, …, <span class="v">x</span><sub><span class="v">p</span></sub> | <span class="v">C</span>) · P(<span class="v">C</span>) / P(<span class="v">x</span><sub>1</sub>, …, <span class="v">x</span><sub><span class="v">p</span></sub>)</div>
<p><b>Komplett (eksakt) Bayes</b> finner alle treningsrader med nøyaktig samme verdier som det nye punktet, og bruker andelen i hver klasse. Med mange variabler finnes det sjelden slike rader.</p>
<h2>Den naive antakelsen</h2>
<p>Anta at forklaringsvariablene er uavhengige gitt klassen. Da kan sannsynligheten for kombinasjonen skrives som et produkt:</p>
<div class="formula">P(<span class="v">C</span> | <span class="v">x</span>) ∝ P(<span class="v">C</span>) · P(<span class="v">x</span><sub>1</sub> | <span class="v">C</span>) · P(<span class="v">x</span><sub>2</sub> | <span class="v">C</span>) · … · P(<span class="v">x</span><sub><span class="v">p</span></sub> | <span class="v">C</span>)</div>
<ol>
<li>For hver klasse: regn andelen av treningsdataene i klassen (priorsannsynligheten).</li>
<li>For hver variabel og klasse: regn andelen rader i klassen som har verdien til det nye punktet.</li>
<li>Gang sammen per klasse.</li>
<li>Normaliser: del hvert produkt på summen av produktene for alle klassene.</li>
</ol>
<p>Antakelsen holder sjelden helt, men rangeringen av hvem som mest sannsynlig er i klasse 1 blir ofte god. Sannsynlighetene i seg selv kan være dårlig kalibrert.</p>
<h2>Praktiske detaljer</h2>
<ul>
<li><b>Numeriske variabler</b> må deles inn i intervaller (binning), eller man bruker en fordeling (Gaussisk naiv Bayes).</li>
<li><b>Nullproblemet:</b> har en verdi aldri forekommet i en klasse, blir hele produktet null. Laplace-glatting legger til en liten konstant (<code>alpha</code> i scikit-learn) i alle tellinger.</li>
</ul>
<div class="pros">
<div><h3>Styrker</h3><ul><li>Svært rask, også med store datasett og mange variabler</li><li>Håndterer kategoriske variabler naturlig</li><li>Fungerer godt til rangering og som en enkel startmodell</li></ul></div>
<div><h3>Svakheter</h3><ul><li>Uavhengighetsantakelsen er sjelden sann</li><li>Sannsynlighetene er ofte for ekstreme</li><li>Trenger mye data for sjeldne kategorier</li></ul></div>
</div>
<div class="pit"><b>Eksamensfelle: glemt normalisering</b>Produktene P(C) · Π P(x|C) er ikke sannsynligheter før du deler på summen over klassene. I eksemplet blir 0,075 og 0,067 til 0,53 og 0,47.</div>
<h2>Python</h2>
<pre><code>from sklearn.naive_bayes import MultinomialNB

# Lærebokas eksempel: 2 201 flyavganger fra Washington DC-området til New York.
# Y = 'Flight Status' (delayed eller ontime). Alle forklaringsvariablene er kategoriske.
predictors = ['DAY_WEEK', 'CRS_DEP_TIME', 'ORIGIN', 'DEST', 'CARRIER']
X = pd.get_dummies(delays_df[predictors])            # alle kategorier som 0/1
y = delays_df['Flight Status']
train_X, valid_X, train_y, valid_y = train_test_split(X, y, test_size=0.40, random_state=1)   # 60/40

# alpha: litt glatting, så ingen sannsynlighet blir 0
delays_nb = MultinomialNB(alpha=0.01).fit(train_X, train_y)
pred_prob = delays_nb.predict_proba(valid_X)          # sannsynlighet per klasse
classificationSummary(y_true=valid_y, y_pred=delays_nb.predict(valid_X))   # forvirringsmatrise og accuracy</code></pre>`
});
