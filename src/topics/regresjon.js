/* Prediksjon og logistisk regresjon: lineær regresjon, variabelvalg og regularisering, logistisk regresjon */

const TOY_NAMES = { Age_08_04: 'Alder (mnd)', KM: 'Kilometer', HP: 'Hestekrefter', Met_Color: 'Metallic', Automatic: 'Automat', CC: 'Motor (cc)', Doors: 'Dører', Quarterly_Tax: 'Avgift', Weight: 'Vekt (kg)', Fuel_Type_Diesel: 'Diesel', Fuel_Type_Petrol: 'Bensin' };
const fcoef = b => Math.abs(b) < 1 ? fx(b, 4) : fx(b, 2);

topic({
  id: 'lineaer-regresjon', short: 'Lineær regresjon', lecture: 'F5', tags: ['Prediksjon', 'Numerisk Y'],
  title: 'Multippel lineær regresjon',
  path: ['Veiledet læring', 'Prediksjon'],
  lead: 'Lineær regresjon modellerer Y som et konstantledd pluss en vektet sum av forklaringsvariablene. Vektene (koeffisientene) velges slik at summen av kvadrerte residualer blir minst mulig.',
  figs: [{
    title: 'Minste kvadraters metode, bokstavelig talt',
    sub: '30 Toyota Corolla fra treningsdataene: alder mot pris. Hver rute er en kvadrert residual. Minste kvadraters linje er linjen som gjør det samlede arealet av rutene minst mulig.',
    build(el) {
      const L = DATA.toyotaLSQ, xs = L.map(r => r[0]), ys = L.map(r => r[1]);
      const xm = mean(xs), ym = mean(ys);
      const b1o = sum(xs.map((x, i) => (x - xm) * (ys[i] - ym))) / sum(xs.map(x => (x - xm) ** 2)), b0o = ym - b1o * xm;
      const sst = sum(ys.map(y => (y - ym) ** 2)), sseOf = (a, b) => sum(ys.map((y, i) => (y - a - b * xs[i]) ** 2));
      let b0 = 17000, b1 = -60, sq = true;
      const ctl = Controls(el);
      const s0 = Slider(ctl, { label: 'Konstantledd b₀', min: 5000, max: 35000, step: 50, value: b0, fmt: v => fint(v) + ' €', oninput: v => { b0 = v; draw(); } });
      const s1 = Slider(ctl, { label: 'Stigning b₁', min: -450, max: 100, step: 1, value: b1, fmt: v => fint(v) + ' €/mnd', oninput: v => { b1 = v; draw(); } });
      Btn(ctl, 'Minste kvadrater', () => { s0.set(Math.round(b0o / 50) * 50, false); s1.set(Math.round(b1o), false); b0 = b0o; b1 = b1o; draw(); }, 'primary');
      Seg(ctl, { label: 'Kvadrater', options: [[true, 'Vis'], [false, 'Skjul']], value: sq, onchange: v => { sq = v; draw(); } });
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const plot = new Plot(a, { w: 560, h: 400, x: [0, 80], y: [0, 36000], xlab: 'Alder (måneder)', ylab: 'Pris (€)', label: 'Pris mot alder med regresjonslinje' });
      const gS = plot.clipLayer(), gL = plot.clipLayer(), gP = plot.layer();
      const tiles = Tiles(b, [['sse', 'SSE (sum av e²)'], ['min', 'Minste mulige SSE'], ['rmse', 'RMSE'], ['r2', 'R²']]);
      b.append(H('p', { class: 'note', html: 'R² = 1 − SSE / SST, der SST er SSE for en flat linje i snittet. R² kan bli negativ for en linje som er dårligere enn snittet.' }));
      const sseMin = sseOf(b0o, b1o);
      function draw() {
        clear(gS); clear(gL); clear(gP); const X = plot.x, Y = plot.y, xr = plot.o.w - plot.o.m.r;
        S('line', { x1: X(0), y1: Y(b0), x2: X(80), y2: Y(b0 + 80 * b1), class: 's-acc', 'stroke-width': 2.5 }, gL);
        xs.forEach((x, i) => {
          const yh = b0 + b1 * x, side = Math.abs(Y(ys[i]) - Y(yh));
          if (sq && side > 0.5) { const left = X(x) + side > xr; S('rect', { x: left ? X(x) - side : X(x), y: Math.min(Y(ys[i]), Y(yh)), width: side, height: side, class: 'f-c0 s-c0', 'fill-opacity': 0.13, 'stroke-opacity': 0.5 }, gS); }
          S('line', { x1: X(x), x2: X(x), y1: Y(ys[i]), y2: Y(yh), class: 's-c0', 'stroke-width': 1.5 }, gL);
          S('circle', { cx: X(x), cy: Y(ys[i]), r: 4.5, class: 'f-ink' }, gP);
        });
        const sse = sseOf(b0, b1);
        tiles.set('sse', fx(sse / 1e6, 1) + ' mill.', sse <= sseMin * 1.0005 ? 'good' : '');
        tiles.set('min', fx(sseMin / 1e6, 1) + ' mill.');
        tiles.set('rmse', fint(Math.sqrt(sse / xs.length)) + ' €');
        tiles.set('r2', fx(1 - sse / sst, 3));
      }
      draw();
    },
    tryit: ['Juster b₀ og b₁ for hånd og prøv å få SSE så lav som mulig. Trykk så «Minste kvadrater» og sammenlign.',
      'Store rester gir svært store ruter. Derfor trekkes linjen mot punkter som ligger langt unna.',
      'Med minste kvadraters linje blir b₁ omtrent −244 €/mnd i dette utvalget. I modellen med alle variablene (neste figur) er alderskoeffisienten bare −139, fordi kilometer og de andre variablene tar over noe av effekten.']
  }, {
    title: 'Regn ut en prediksjon fra koeffisientene',
    sub: 'Modellen med alle 11 variablene, tilpasset på treningsdataene (600 biler). Prediksjonen er konstantleddet pluss summen av bidragene b · x. Motor, dører, metallic og avgift holdes faste.',
    build(el) {
      const s = DATA.shapLinear, b = s.coef, b0 = s.base - sum(b.map((v, i) => v * s.means[i]));
      const st = { Age_08_04: 48, KM: 60000, HP: 110, Weight: 1080, fuel: 'Petrol', Automatic: 0 };
      const fixed = { Met_Color: 1, CC: 1600, Doors: 5, Quarterly_Tax: 85 };
      const ctl = Controls(el);
      Slider(ctl, { label: 'Alder', min: 1, max: 80, value: st.Age_08_04, fmt: v => v + ' mnd', oninput: v => { st.Age_08_04 = v; draw(); } });
      Slider(ctl, { label: 'Kilometer', min: 0, max: 250000, step: 5000, value: st.KM, fmt: fint, oninput: v => { st.KM = v; draw(); } });
      Slider(ctl, { label: 'Hestekrefter', min: 69, max: 192, value: st.HP, oninput: v => { st.HP = v; draw(); } });
      Slider(ctl, { label: 'Vekt', min: 1000, max: 1615, step: 5, value: st.Weight, fmt: v => v + ' kg', oninput: v => { st.Weight = v; draw(); } });
      Seg(ctl, { label: 'Drivstoff', options: [['CNG', 'CNG'], ['Diesel', 'Diesel'], ['Petrol', 'Bensin']], value: st.fuel, onchange: v => { st.fuel = v; draw(); } });
      Seg(ctl, { label: 'Automat', options: [[0, 'Nei'], [1, 'Ja']], value: 0, onchange: v => { st.Automatic = v; draw(); } });
      const tw = H('div', { class: 'tblwrap' }); el.append(tw);
      function draw() {
        const xv = { ...fixed, Age_08_04: st.Age_08_04, KM: st.KM, HP: st.HP, Weight: st.Weight, Automatic: st.Automatic, Fuel_Type_Diesel: st.fuel === 'Diesel' ? 1 : 0, Fuel_Type_Petrol: st.fuel === 'Petrol' ? 1 : 0 };
        const rows = s.cols.map((c, i) => [c, b[i], xv[c], b[i] * xv[c]]);
        const yhat = b0 + sum(rows.map(r => r[3]));
        clear(tw).append(H('table', { class: 'tbl' },
          H('tr', {}, H('th', { class: 'l' }, 'Variabel'), H('th', {}, 'Koeffisient b'), H('th', {}, 'Verdi x'), H('th', {}, 'Bidrag b · x')),
          H('tr', {}, H('td', { class: 'l' }, 'Konstantledd'), H('td', {}, fx(b0, 2)), H('td', {}, ''), H('td', {}, fint(b0))),
          rows.map(r => H('tr', { class: ['Age_08_04', 'KM', 'HP', 'Weight', 'Automatic', 'Fuel_Type_Diesel', 'Fuel_Type_Petrol'].includes(r[0]) ? 'on' : '' }, H('td', { class: 'l' }, r[0]), H('td', {}, fcoef(r[1])), H('td', {}, r[0] === 'KM' ? fint(r[2]) : fx(r[2], 0)), H('td', {}, fint(r[3])))),
          H('tr', {}, H('th', { class: 'l' }, 'Prediksjon ŷ'), H('th', {}), H('th', {}), H('th', {}, fint(yhat) + ' €'))));
      }
      draw();
    },
    tryit: ['Øk alderen med én måned. Prediksjonen faller med 139 €, uansett hvilke verdier de andre variablene har. Det er «alt annet likt».',
      'Bytt fra CNG til diesel. Prediksjonen øker med koeffisienten til dieseldummyen, fordi CNG er referansekategorien.',
      'Legg merke til at KM har en liten koeffisient (−0,017), men stort bidrag, fordi verdiene er store. Størrelsen på b sier ikke hvor viktig en variabel er.']
  }],
  body: `
<h2>Modellen</h2>
<div class="formula"><span class="v">Y</span> = β<sub>0</sub> + β<sub>1</sub><span class="v">x</span><sub>1</sub> + β<sub>2</sub><span class="v">x</span><sub>2</sub> + … + β<sub><span class="v">p</span></sub><span class="v">x</span><sub><span class="v">p</span></sub> + ε</div>
<p>Koeffisientene estimeres med <b>minste kvadraters metode</b>: velg b<sub>0</sub>, …, b<sub>p</sub> som minimerer SSE = Σ(<i>y</i> − <i>ŷ</i>)². Prediksjonen for en ny observasjon er <i>ŷ</i> = b<sub>0</sub> + b<sub>1</sub><i>x</i><sub>1</sub> + … + b<sub>p</sub><i>x</i><sub>p</sub>.</p>
<h2>Tolkning av koeffisientene</h2>
<ul>
<li>b<sub>j</sub> er endringen i predikert Y når <i>x</i><sub>j</sub> øker med én enhet <b>og alle andre variabler holdes fast</b>.</li>
<li>For en dummy er b<sub>j</sub> forskjellen fra referansekategorien. I Toyota-modellen er CNG referanse, så b for diesel er forskjellen mellom en dieselbil og en ellers lik CNG-bil.</li>
<li>Størrelsen på b avhenger av enheten. Vil du sammenligne viktighet, standardiser variablene først.</li>
</ul>
<h2>Forklaring eller prediksjon?</h2>
<p>Når målet er <b>forklaring</b> (statistikk), bryr vi oss om forutsetningene, standardfeil og p-verdier, og vi bruker hele datasettet. Når målet er <b>prediksjon</b> (data science), er det viktigste hvor godt modellen treffer nye data. Da partisjonerer vi og evaluerer på valideringsdataene.</p>
<p>Forutsetningene for klassisk inferens er linearitet, uavhengige feil, konstant varians og normalfordelte feil. For prediksjon er det nok at modellen gir lav valideringsfeil, men brudd kan likevel gi dårligere prediksjoner.</p>
<div class="pros">
<div><h3>Styrker</h3><ul><li>Rask og lett å tolke</li><li>Fungerer godt med få observasjoner</li><li>Gir både prediksjon og effekt per variabel</li></ul></div>
<div><h3>Svakheter</h3><ul><li>Fanger bare lineære sammenhenger, med mindre du lager nye variabler (x², interaksjoner)</li><li>Sensitiv for uteliggere og sterkt korrelerte variabler (multikollinearitet)</li><li>Dårlig til å ekstrapolere utenfor dataområdet</li></ul></div>
</div>
<div class="pit"><b>Eksamensfelle: R² på treningsdata</b>R² øker alltid når du legger til en variabel, også når variabelen er ren støy. Sammenlign modeller med justert R², AIC eller RMSE på valideringsdata.</div>
<h2>Python</h2>
<pre><code>from sklearn.linear_model import LinearRegression
from mlba import regressionSummary

predictors = ['Age_08_04', 'KM', 'Fuel_Type', 'HP', 'Met_Color', 'Automatic',
              'CC', 'Doors', 'Quarterly_Tax', 'Weight']
X = pd.get_dummies(car_df[predictors], drop_first=True)
y = car_df['Price']
train_X, valid_X, train_y, valid_y = train_test_split(X, y, test_size=0.4, random_state=1)

car_lm = LinearRegression().fit(train_X, train_y)
print(pd.DataFrame({'Predictor': X.columns, 'coefficient': car_lm.coef_}))
print('intercept', car_lm.intercept_)
regressionSummary(y_true=valid_y, y_pred=car_lm.predict(valid_X))</code></pre>`
});

topic({
  id: 'variabelseleksjon', short: 'Variabelvalg og regularisering', lecture: 'F5', tags: ['Prediksjon', 'Subset selection', 'Ridge', 'Lasso'],
  title: 'Variabelvalg, ridge og lasso',
  path: ['Veiledet læring', 'Prediksjon'],
  lead: 'Flere forklaringsvariabler er ikke alltid bedre. Vi kan velge ut et delsett av variablene, eller beholde alle og krympe koeffisientene mot null med ridge eller lasso.',
  figs: [{
    title: 'Uttømmende søk på Toyota Corolla',
    sub: 'Alle 2 047 modeller med 1–11 av variablene er tilpasset på treningsdataene. For hver modellstørrelse vises den beste. Justert R² skal være høy, AIC skal være lav.',
    build(el) {
      const E = DATA.toyotaExhaustive; let k = 9;
      const ctl = Controls(el);
      Slider(ctl, { label: 'Antall variabler', min: 1, max: 11, value: k, oninput: v => { k = v; draw(); } });
      const cols = H('div', { class: 'cols even' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const p1 = new Plot(a, { w: 380, h: 260, x: [0.5, 11.5], y: [0.75, 0.87], xticks: range(11, i => i + 1), xlab: 'Antall variabler', ylab: 'Justert R²', label: 'Beste justerte R² per modellstørrelse' });
      const p2 = new Plot(b, { w: 380, h: 260, x: [0.5, 11.5], y: [10380, 10700], xticks: range(11, i => i + 1), xlab: 'Antall variabler', ylab: 'AIC', label: 'AIC for beste modell per størrelse' });
      const g1 = p1.layer(), g2 = p2.layer();
      const list = H('div', { style: 'margin-top:8px' }); el.append(list);
      const bestA = E.reduce((bi, e, i) => e.adjr2 > E[bi].adjr2 ? i : bi, 0), bestC = E.reduce((bi, e, i) => e.aic < E[bi].aic ? i : bi, 0);
      function draw() {
        for (const [pl, g, key, best] of [[p1, g1, 'adjr2', bestA], [p2, g2, 'aic', bestC]]) {
          clear(g);
          S('path', { d: pathOf(E.map(e => [pl.x(e.k), pl.y(e[key])])), fill: 'none', class: 's-acc', 'stroke-width': 2 }, g);
          E.forEach((e, i) => S('circle', { cx: pl.x(e.k), cy: pl.y(e[key]), r: e.k === k ? 7 : 4, class: i === best ? 'f-good' : 'f-acc', stroke: e.k === k ? 'currentColor' : null, 'stroke-width': 2, style: e.k === k ? 'color:var(--ink)' : null }, g));
        }
        const e = E[k - 1], all = DATA.toyotaCols;
        clear(list).append(H('p', { class: 'mini', style: 'margin:0 0 6px' }, `Beste modell med ${k} variabler: justert R² = ${fx(e.adjr2, 4)}, AIC = ${fx(e.aic, 1)}`),
          H('div', { style: 'display:flex;flex-wrap:wrap;gap:6px' }, all.map(c => H('span', { class: 'pill', style: e.vars.includes(c) ? 'border-color:var(--accent);color:var(--ink);background:var(--soft)' : 'opacity:.45;text-decoration:line-through' }, c))));
      }
      draw();
      const fw = DATA.toyotaForward.map(r => r[0]), bw = DATA.toyotaBackward.map(r => r[0]);
      el.append(H('div', { class: 'cols even', style: 'margin-top:14px' },
        H('div', { class: 'mini' }, H('b', {}, 'Forward selection'), ' legger til én og én variabel så lenge AIC faller: ', fw.join(' → '), '. Stopper med ', String(fw.length), ' variabler.'),
        H('div', { class: 'mini' }, H('b', {}, 'Backward elimination'), ' starter med alle 11 og fjerner: ', bw.join(', '), '. Ender også med ', String(DATA.toyotaBackwardKept.length), ' variabler.')));
    },
    tryit: ['Fra 1 til 4 variabler stiger justert R² kraftig. Etter rundt 6 variabler skjer nesten ingenting.',
      'Den beste modellen målt med både justert R² og AIC har 9 variabler (grønt punkt). Doors og Met_Color faller ut.',
      'Her kommer forward, backward og uttømmende søk til samme modell. Det er ikke garantert generelt.']
  }, {
    title: 'Hvor mange modeller må vi prøve?',
    sub: 'Uttømmende søk prøver alle delmengder av p variabler. Forward og backward prøver høyst 1 + p(p + 1)/2 modeller.',
    build(el) {
      let p = 11;
      const ctl = Controls(el);
      Slider(ctl, { label: 'Antall kandidatvariabler p', min: 1, max: 40, value: p, oninput: v => { p = v; draw(); } });
      const plot = new Plot(el, { w: 760, h: 250, x: [1, 40], y: [0, 12.5], yticks: [0, 3, 6, 9, 12], yfmt: v => ({ 0: '1', 3: '1 000', 6: '1 mill.', 9: '1 mrd.', 12: '10¹²' })[v], xlab: 'p', ylab: 'Antall modeller (log)', label: 'Antall modeller mot p' });
      const g = plot.layer();
      const tiles = Tiles(el, [['ex', 'Uttømmende: 2^p'], ['st', 'Forward/backward: maks 1 + p(p+1)/2'], ['t', 'Tid ved 1 ms per modell (uttømmende)']]);
      const ps = range(40, i => i + 1);
      S('path', { d: pathOf(ps.map(q => [plot.x(q), plot.y(Math.min(12.5, q * Math.log10(2)))])), fill: 'none', class: 's-c0', 'stroke-width': 2.5 }, plot.gData);
      S('path', { d: pathOf(ps.map(q => [plot.x(q), plot.y(Math.log10(1 + q * (q + 1) / 2))])), fill: 'none', class: 's-c1', 'stroke-width': 2.5 }, plot.gData);
      function draw() {
        clear(g); const ex = Math.pow(2, p), st = 1 + p * (p + 1) / 2;
        for (const [v, cl] of [[ex, 'f-c0'], [st, 'f-c1']]) { const ly = Math.log10(v); if (ly <= 12.5) S('circle', { cx: plot.x(p), cy: plot.y(ly), r: 6, class: cl }, g); }
        S('line', { x1: plot.x(p), x2: plot.x(p), y1: plot.y(0), y2: plot.y(12.5), class: 's-ink', 'stroke-dasharray': '3 3' }, g);
        tiles.set('ex', fint(ex)); tiles.set('st', fint(st));
        const sec = ex / 1000; tiles.set('t', sec < 60 ? fx(sec, 1) + ' sek' : sec < 3600 ? fx(sec / 60, 1) + ' min' : sec < 86400 * 2 ? fx(sec / 3600, 1) + ' timer' : sec < 3.15e7 * 2 ? fint(sec / 86400) + ' døgn' : fint(sec / 3.15e7) + ' år');
      }
      draw();
      el.append(H('p', { class: 'note', html: '<b style="color:var(--c0)">Uttømmende søk</b> dobles for hver ny variabel. <b style="color:var(--c1)">Forward og backward</b> vokser bare kvadratisk.' }));
    }
  }, {
    title: 'Ridge og lasso krymper koeffisientene',
    sub: 'Koeffisientene for de 11 standardiserte variablene i Toyota-modellen når straffen λ øker (i scikit-learn heter den alpha). Lasso setter koeffisienter til nøyaktig null. Ridge krymper alle, men ingen blir null.',
    build(el) {
      const P = { lasso: DATA.lassoPath, ridge: DATA.ridgePath }, names = DATA.toyotaCols, ols = DATA.olsStdCoef;
      const top = ols.map((v, i) => [Math.abs(v), i]).sort((a, b) => b[0] - a[0]).slice(0, 5).map(t => t[1]);
      const colOf = i => { const j = top.indexOf(i); return j < 0 ? 'mut' : 'c' + j; };
      let mode = 'lasso', idx = 16;
      const ctl = Controls(el);
      Seg(ctl, { label: 'Metode', options: [['lasso', 'Lasso'], ['ridge', 'Ridge']], value: mode, onchange: v => { mode = v; sl.setMax(P[v].length - 1); idx = Math.min(idx, P[v].length - 1); sl.set(idx, false); draw(true); } });
      const sl = Slider(ctl, { label: 'Straff λ', min: 0, max: P[mode].length - 1, value: idx, fmt: i => fx(P[mode][Math.min(i, P[mode].length - 1)].a, P[mode][Math.min(i, P[mode].length - 1)].a < 10 ? 2 : 0), oninput: v => { idx = v; draw(); } });
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const pl = new Plot(a, { w: 540, h: 360, x: [0, 1], y: [-2500, 1300], xlab: 'log₁₀(λ)', ylab: 'Koeffisient (€ per standardavvik)', label: 'Koeffisientstier' });
      const gP = pl.layer(), gM = pl.layer();
      const bars = S('svg', { viewBox: '0 0 360 300', class: 'plot', role: 'img', 'aria-label': 'Koeffisienter ved valgt straff' }); b.append(bars);
      const tiles = Tiles(b, [['nz', 'Variabler ≠ 0'], ['rm', 'RMSE validering'], ['ols', 'RMSE uten straff']]);
      function draw(newMode) {
        const path = P[mode], lx = path.map(d => Math.log10(d.a));
        if (newMode || !pl._d) { pl.setDomain([Math.min(...lx), Math.max(...lx)], [-2500, 1300]); pl._d = 1; clear(gP);
          S('line', { x1: pl.x(lx[0]), x2: pl.x(lx[lx.length - 1]), y1: pl.y(0), y2: pl.y(0), class: 's-ink', 'stroke-width': 1 }, gP);
          names.forEach((n, j) => S('path', { d: pathOf(path.map((d, i) => [pl.x(lx[i]), pl.y(d.coef[j])])), fill: 'none', class: 's-' + colOf(j), 'stroke-width': top.includes(j) ? 2.2 : 1.2, 'stroke-opacity': top.includes(j) ? 1 : 0.6 }, gP)); }
        clear(gM); const d = path[idx];
        S('line', { x1: pl.x(lx[idx]), x2: pl.x(lx[idx]), y1: pl.y(-2500), y2: pl.y(1300), class: 's-ink', 'stroke-dasharray': '4 3' }, gM);
        clear(bars); const bx = v => 273 + v * 0.0632, x0 = bx(0);
        S('line', { x1: x0, x2: x0, y1: 4, y2: 292, class: 's-ink' }, bars);
        names.forEach((n, j) => {
          const y = 8 + j * 26, v = d.coef[j];
          S('text', { x: 4, y: y + 13, text: TOY_NAMES[n] || n, style: 'font-size:11.5px', class: 'lbl' }, bars);
          S('rect', { x: Math.min(x0, bx(v)), y: y + 2, width: Math.max(0.5, Math.abs(bx(v) - x0)), height: 15, class: 'f-' + colOf(j), 'fill-opacity': v === 0 ? 0 : 0.85, rx: 2 }, bars);
          S('line', { x1: bx(ols[j]), x2: bx(ols[j]), y1: y, y2: y + 19, class: 's-ink', 'stroke-width': 1.5, 'stroke-opacity': 0.5 }, bars);
          if (v === 0) S('text', { x: x0 + 6, y: y + 13, text: '0', style: 'font-size:11px' }, bars);
        });
        tiles.set('nz', String(d.coef.filter(v => v !== 0).length) + ' av 11', mode === 'lasso' && d.coef.some(v => v === 0) ? 'hl' : '');
        tiles.set('rm', fint(d.rmse) + ' €', d.rmse > DATA.olsStdRMSE * 1.1 ? 'bad' : ''); tiles.set('ols', fint(DATA.olsStdRMSE) + ' €');
      }
      draw(true);
      b.append(H('p', { class: 'note', html: 'Den tynne streken på hver søyle er koeffisienten uten straff (vanlig regresjon).' }));
    },
    tryit: ['Dra λ i lasso fra venstre mot høyre. Se hvilke variabler som blir null først. Det er de lassoen anser som minst nyttige.',
      'Bytt til ridge og gjør det samme. Koeffisientene nærmer seg null, men ingen blir nøyaktig null.',
      'Følg RMSE på validering. Litt straff koster nesten ingenting, men for mye straff gjør modellen for enkel (bias).']
  }],
  body: `
<h2>Hvorfor velge bort variabler?</h2>
<ul>
<li>Færre variabler er billigere å samle inn og enklere å forklare.</li>
<li>Variabler som nesten bare bidrar med støy, øker variansen i prediksjonene.</li>
<li>Sterkt korrelerte variabler (multikollinearitet) gir ustabile koeffisienter.</li>
</ul>
<h2>Delmengdeseleksjon (subset selection)</h2>
<ul>
<li><b>Uttømmende søk:</b> prøv alle 2<sup>p</sup> − 1 kombinasjoner og velg den beste etter justert R², AIC eller valideringsfeil. Garantert best, men umulig for store p.</li>
<li><b>Forward selection:</b> start uten variabler. Legg til den som forbedrer modellen mest, til ingen forbedrer den. Høyst 1 + p(p + 1)/2 modeller.</li>
<li><b>Backward elimination:</b> start med alle. Fjern den minst nyttige, til fjerning gjør modellen dårligere.</li>
<li><b>Stepwise:</b> som forward, men en variabel som er lagt til, kan fjernes igjen senere.</li>
</ul>
<div class="formula">Justert R² = 1 − (1 − R²) · (<span class="v">n</span> − 1) / (<span class="v">n</span> − <span class="v">p</span> − 1)</div>
<p>Justert R² og AIC straffer antall variabler. Vanlig R² gjør det ikke og stiger alltid med flere variabler.</p>
<h2>Regularisering (krymping)</h2>
<div class="formula">Ridge: minimer SSE + λ Σ β<sub>j</sub>² &nbsp;&nbsp;&nbsp;&nbsp; Lasso: minimer SSE + λ Σ |β<sub>j</sub>|</div>
<ul>
<li>Straffen gjør store koeffisienter dyre. Modellen blir enklere og mindre følsom for støy: litt mer bias, mindre varians.</li>
<li><b>Lasso</b> kan sette koeffisienter til nøyaktig null, så den gjør variabelvalg automatisk.</li>
<li><b>Ridge</b> krymper alle koeffisienter, men beholder alle variablene. Den fungerer godt når mange variabler er korrelerte.</li>
<li>Variablene må standardiseres først. Ellers avhenger straffen av måleenheten.</li>
<li>λ er en hyperparameter som velges med validering eller kryssvalidering (<code>LassoCV</code>, <code>RidgeCV</code>).</li>
</ul>
<div class="pit"><b>Eksamensfelle</b>Lasso velger variabler fordi straffen bruker absoluttverdi. Kvadratstraffen i ridge gjør aldri en koeffisient nøyaktig null. Husk også at konstantleddet ikke straffes.</div>
<h2>Python</h2>
<pre><code>from mlba import exhaustive_search, forward_selection, backward_elimination, AIC_score
from sklearn.linear_model import LinearRegression, Lasso, Ridge, LassoCV

def train_model(variables):
    return LinearRegression().fit(train_X[variables], train_y)

def score_model(model, variables):
    return AIC_score(y_true=train_y, y_pred=model.predict(train_X[variables]), model=model)

best_model, best_variables = forward_selection(train_X.columns, train_model, score_model)

scaler = StandardScaler().fit(train_X)
lasso = Lasso(alpha=100).fit(scaler.transform(train_X), train_y)
print(lasso.coef_)                                      # noen blir 0
lasso_cv = LassoCV(cv=5).fit(scaler.transform(train_X), train_y)
print('beste alpha:', lasso_cv.alpha_)</code></pre>`
});

topic({
  id: 'logistisk-regresjon', short: 'Logistisk regresjon', lecture: 'F5', tags: ['Klassifikasjon', 'Kategorisk Y'],
  title: 'Logistisk regresjon',
  path: ['Veiledet læring', 'Klassifikasjon'],
  lead: 'Logistisk regresjon modellerer logit, altså logaritmen av oddsen, som en lineær funksjon av forklaringsvariablene. Logit gjøres om til en sannsynlighet mellom 0 og 1, og en terskel gjør sannsynligheten om til en klasse.',
  figs: [{
    title: 'Fra rett linje til S-kurve',
    sub: 'Alle 5 000 kundene i Universal Bank: inntekt mot om de takket ja til personlån. Punktene er andelen ja i hvert inntektsintervall på 10 000 $. Store punkter har mange kunder.',
    build(el) {
      const U = DATA.ubIncome, bins = {};
      U.forEach(([x, n, y]) => { const k = Math.floor(x / 10) * 10 + 5; bins[k] = bins[k] || [0, 0]; bins[k][0] += n; bins[k][1] += y; });
      const B = Object.entries(bins).map(([k, v]) => [+k, v[0], v[1]]);
      const N = sum(U.map(r => r[1])), Sx = sum(U.map(r => r[0] * r[1])), Sy = sum(U.map(r => r[2])), Sxx = sum(U.map(r => r[0] ** 2 * r[1])), Sxy = sum(U.map(r => r[0] * r[2]));
      const olsB = (N * Sxy - Sx * Sy) / (N * Sxx - Sx * Sx), olsA = (Sy - olsB * Sx) / N;
      const ll = (a, b) => sum(U.map(([x, n, y]) => { const p = clamp(sigmoid(a + b * x), 1e-12, 1 - 1e-12); return y * Math.log(p) + (n - y) * Math.log(1 - p); }));
      function mle() { let a = 0, b = 0; for (let it = 0; it < 40; it++) { let g0 = 0, g1 = 0, h00 = 0, h01 = 0, h11 = 0; for (const [x0, n, y] of U) { const x = x0 / 100, p = sigmoid(a + b * x), w = n * p * (1 - p); g0 += y - n * p; g1 += (y - n * p) * x; h00 += w; h01 += w * x; h11 += w * x * x; } const det = h00 * h11 - h01 * h01; a += (h11 * g0 - h01 * g1) / det; b += (h00 * g1 - h01 * g0) / det; } return [a, b / 100]; }
      let b0 = -4, b1 = 0.02, x0 = 100, logit = false, ols = false;
      const ctl = Controls(el);
      const s0 = Slider(ctl, { label: 'b₀', min: -10, max: 0, step: 0.01, value: b0, fmt: v => fx(v, 2), oninput: v => { b0 = v; draw(); } });
      const s1 = Slider(ctl, { label: 'b₁', min: 0, max: 0.08, step: 0.0005, value: b1, fmt: v => fx(v, 4), oninput: v => { b1 = v; draw(); } });
      Btn(ctl, 'Maksimer likelihood', () => { const [a, b] = mle(); s0.set(+a.toFixed(2), false); s1.set(+b.toFixed(4), false); b0 = a; b1 = b; draw(); }, 'primary');
      const ctl2 = Controls(el);
      Slider(ctl2, { label: 'Inntekt for ny kunde', min: 10, max: 220, value: x0, fmt: v => v + ' 000 $', oninput: v => { x0 = v; draw(); } });
      Seg(ctl2, { label: 'y-akse', options: [[false, 'Sannsynlighet'], [true, 'Logit']], value: logit, onchange: v => { logit = v; draw(true); } });
      Seg(ctl2, { label: 'Rett linje (lineær regresjon)', options: [[false, 'Av'], [true, 'På']], value: ols, onchange: v => { ols = v; draw(); } });
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const plot = new Plot(a, { w: 560, h: 380, x: [0, 230], y: [-0.05, 1.05], xlab: 'Inntekt (1000 $)', ylab: 'P(ja til lån)', label: 'Andel som tar lån mot inntekt, med logistisk kurve' });
      const gC = plot.clipLayer(), gD = plot.layer(), gM = plot.layer();
      const tiles = Tiles(b, [['ll', 'Log-likelihood'], ['or', 'e^b₁ (oddsratio per 1000 $)'], ['lg', 'Logit for ny kunde'], ['od', 'Odds for ny kunde'], ['p', 'Sannsynlighet'], ['cl', 'Klasse (terskel 0,5)']]);
      b.append(H('p', { class: 'note', html: 'Logit = b₀ + b₁ · inntekt. Odds = e<sup>logit</sup>. Sannsynlighet = odds / (1 + odds).' }));
      const xsC = range(231, i => i);
      function draw(newAxis) {
        if (newAxis) { plot.o.ylab = logit ? 'Logit = ln(odds)' : 'P(ja til lån)'; plot.setDomain(null, logit ? [-8, 5] : [-0.05, 1.05]); }
        clear(gC); clear(gD); clear(gM); const X = plot.x, Y = plot.y;
        const f = x => logit ? b0 + b1 * x : sigmoid(b0 + b1 * x);
        if (ols && !logit) S('line', { x1: X(0), y1: Y(olsA), x2: X(230), y2: Y(olsA + 230 * olsB), class: 's-c0', 'stroke-width': 2, 'stroke-dasharray': '6 4' }, gC);
        if (!logit) S('line', { x1: X(0), x2: X(230), y1: Y(0.5), y2: Y(0.5), class: 's-mut', 'stroke-dasharray': '2 4' }, gC);
        S('path', { d: pathOf(xsC.map(x => [X(x), Y(f(x))])), fill: 'none', class: 's-acc', 'stroke-width': 2.8 }, gC);
        B.forEach(([x, n, y]) => { const pr = y / n, v = logit ? Math.log((y + 0.5) / (n - y + 0.5)) : pr; S('circle', { cx: X(x), cy: Y(v), r: 2.5 + Math.sqrt(n) / 3.2, class: 'f-c1', 'fill-opacity': 0.5, stroke: 'currentColor', style: 'color:var(--c1)' }, gD); });
        const v0 = f(x0); S('line', { x1: X(x0), x2: X(x0), y1: Y(logit ? -8 : 0), y2: Y(v0), class: 's-ink', 'stroke-dasharray': '3 3' }, gM);
        S('circle', { cx: X(x0), cy: Y(v0), r: 6.5, class: 'f-hl s-ink', 'stroke-width': 1.5 }, gM);
        const lg = b0 + b1 * x0, p = sigmoid(lg);
        tiles.set('ll', fx(ll(b0, b1), 1)); tiles.set('or', fx(Math.exp(b1), 4)); tiles.set('lg', fx(lg, 3)); tiles.set('od', fx(Math.exp(lg), 3)); tiles.set('p', fx(p, 3));
        tiles.set('cl', p > 0.5 ? 'ja (1)' : 'nei (0)', p > 0.5 ? 'good' : '');
      }
      draw();
    },
    tryit: ['Trykk «Maksimer likelihood». Log-likelihood stiger fra −1108,9 til −1008,1, som er det høyeste den kan bli. Logistisk regresjon bruker maksimal likelihood, ikke minste kvadrater.',
      'Bytt y-aksen til logit. Da blir kurven en rett linje. Det er derfor modellen kalles lineær i logit.',
      'Slå på den rette linjen. Lineær regresjon gir negative «sannsynligheter» for alle med inntekt under 44 000 $, og en rett linje kan ikke bøye av slik andelen gjør.']
  }, {
    title: 'Sannsynlighet, odds og logit',
    sub: 'Tre måter å uttrykke det samme på. Dra i sannsynligheten og se hvordan odds og logit følger med.',
    build(el) {
      let p = 0.2;
      const ctl = Controls(el);
      Slider(ctl, { label: 'Sannsynlighet p', min: 0.01, max: 0.99, step: 0.01, value: p, fmt: v => v.toFixed(2), oninput: v => { p = v; draw(); } });
      const cols = H('div', { class: 'cols even' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const po = new Plot(a, { w: 380, h: 260, x: [0, 1], y: [0, 20], xlab: 'p', ylab: 'Odds = p / (1 − p)', label: 'Odds som funksjon av p' });
      const pl = new Plot(b, { w: 380, h: 260, x: [0, 1], y: [-5, 5], xlab: 'p', ylab: 'Logit = ln(odds)', label: 'Logit som funksjon av p' });
      const ps = range(197, i => 0.01 + i * 0.005);
      const c1 = po.clipLayer(), c2 = pl.clipLayer();
      S('path', { d: pathOf(ps.map(q => [po.x(q), po.y(q / (1 - q))])), fill: 'none', class: 's-acc', 'stroke-width': 2.5 }, c1);
      S('path', { d: pathOf(ps.map(q => [pl.x(q), pl.y(Math.log(q / (1 - q)))])), fill: 'none', class: 's-acc', 'stroke-width': 2.5 }, c2);
      const m1 = S('circle', { r: 6.5, class: 'f-hl s-ink' }, po.gTop), m2 = S('circle', { r: 6.5, class: 'f-hl s-ink' }, pl.gTop);
      const tiles = Tiles(el, [['p', 'p'], ['o', 'Odds'], ['l', 'Logit'], ['t', 'Lest som']]);
      function draw() {
        const o = p / (1 - p), l = Math.log(o);
        m1.setAttribute('cx', po.x(p)); m1.setAttribute('cy', po.y(Math.min(o, 20))); m2.setAttribute('cx', pl.x(p)); m2.setAttribute('cy', pl.y(l));
        tiles.set('p', fx(p, 2)); tiles.set('o', fx(o, 3)); tiles.set('l', fx(l, 3));
        tiles.set('t', o >= 1 ? fx(o, 1) + ' mot 1 for' : '1 mot ' + fx(1 / o, 1) + ' for');
      }
      draw();
    },
    tryit: ['Sett p = 0,5. Da er odds = 1 og logit = 0.', 'Odds går fra 0 til uendelig. Logit går fra minus til pluss uendelig, og passer derfor til en lineær modell.']
  }],
  body: `
<h2>Modellen</h2>
<div class="formula">logit = ln(odds) = β<sub>0</sub> + β<sub>1</sub><span class="v">x</span><sub>1</sub> + … + β<sub><span class="v">p</span></sub><span class="v">x</span><sub><span class="v">p</span></sub><br>odds = <span class="v">p</span> / (1 − <span class="v">p</span>) = e<sup>logit</sup> &nbsp;&nbsp;&nbsp;&nbsp; <span class="v">p</span> = 1 / (1 + e<sup>−logit</sup>)</div>
<p>Koeffisientene estimeres med <b>maksimal likelihood</b>: velg β-ene som gjør de observerte utfallene mest sannsynlige. Det finnes ingen formel som med minste kvadrater, så programmet løser det numerisk.</p>
<h2>Tolkning</h2>
<ul>
<li>Fortegnet til b<sub>j</sub> gir retningen: positiv b øker sannsynligheten for klasse 1.</li>
<li>e<sup>b<sub>j</sub></sup> er <b>oddsratioen</b>: når <i>x</i><sub>j</sub> øker med én enhet og resten holdes fast, multipliseres oddsen med e<sup>b<sub>j</sub></sup>. Med b<sub>1</sub> = 0,037 per 1000 $ øker oddsen med 3,8 % per 1000 $ i inntekt.</li>
<li>Effekten på <i>sannsynligheten</i> er ikke konstant. Den er størst der kurven er brattest, rundt p = 0,5.</li>
<li>For en dummy er e<sup>b</sup> forholdet mellom oddsen i kategorien og oddsen i referansekategorien.</li>
</ul>
<h2>Fra sannsynlighet til klasse</h2>
<p>Modellen gir en propensitet <i>p</i>. Med terskel 0,5 blir <i>p</i> &gt; 0,5 klassifisert som 1. Terskelen kan flyttes etter hva feilene koster. Se <a href="#evaluering-klassifikasjon">evaluering av klassifikasjon</a>.</p>
<div class="pros">
<div><h3>Styrker</h3><ul><li>Gir sannsynligheter, ikke bare klasser</li><li>Koeffisientene kan tolkes som oddsratioer</li><li>Rask, og fungerer bra med få data</li></ul></div>
<div><h3>Svakheter</h3><ul><li>Lineær beslutningsgrense i X</li><li>Krever dummyer og omforming for ikke-lineære mønstre</li><li>Sensitiv for sterkt korrelerte variabler</li></ul></div>
</div>
<div class="pit"><b>Eksamensfelle: odds er ikke sannsynlighet</b>Odds = 3 betyr p = 0,75, ikke 3 %. Og e<sup>b</sup> = 1,5 betyr at <i>oddsen</i> øker med 50 %, ikke sannsynligheten.</div>
<div class="pit"><b>Eksamensfelle: regn baklengs</b>Får du en logit, regn odds = e<sup>logit</sup> og så p = odds / (1 + odds). Logit = 0 gir alltid p = 0,5.</div>
<h2>Python</h2>
<pre><code>from sklearn.linear_model import LogisticRegression

logit_reg = LogisticRegression(penalty='l2', C=1e42, solver='liblinear')   # nesten ingen straff
logit_reg.fit(train_X, train_y)
print('intercept', logit_reg.intercept_[0])
print(pd.DataFrame({'coeff': logit_reg.coef_[0]}, index=X.columns))

prob = logit_reg.predict_proba(valid_X)[:, 1]        # propensitet for klasse 1
pred = logit_reg.predict(valid_X)                     # klasse med terskel 0,5
classificationSummary(y_true=valid_y, y_pred=pred)</code></pre>`
});
