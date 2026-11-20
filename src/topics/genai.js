/* Generativ KI: språkmodeller, temperatur, embeddings, RAG og finjustering */

topic({
  id: 'sprakmodeller', short: 'Språkmodeller', lecture: 'F11', tags: ['Generativ KI', 'Tokens', 'Embeddings', 'Temperatur'],
  title: 'Store språkmodeller og temperatur',
  path: ['Veiledet læring', 'Generativ KI'],
  lead: 'En stor språkmodell (LLM) er trent på én oppgave: å predikere neste token gitt teksten så langt. Svaret bygges ett token om gangen. Temperaturen styrer hvor tilfeldig hvert valg er.',
  figs: [{
    title: 'Fra prompt til svar i fem steg',
    sub: 'Trykk på et steg. Tallene er en forenklet illustrasjon; ekte modeller har tusenvis av dimensjoner og milliarder av parametre.',
    build(el) {
      const steps = ['Prompt', 'Tokens', 'Embeddings', 'Transformer', 'Svar'];
      const toks = ['Forkl', 'ar', ' bias', '–', 'var', 'ians', ' i', ' én', ' set', 'ning', '.'];
      let cur = 0;
      const row = H('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px', role: 'group', 'aria-label': 'Steg' }); el.append(row);
      const btns = steps.map((s, i) => { const b = H('button', { type: 'button', class: 'btn', 'aria-pressed': String(i === cur) }, (i + 1) + '. ' + s); b.addEventListener('click', () => { cur = i; draw(); }); return b; });
      btns.forEach((b, i) => { row.append(b); if (i < 4) row.append(H('span', { 'aria-hidden': 'true', style: 'color:var(--muted)' }, '→')); });
      const box = H('div', { style: 'min-height:220px' }); el.append(box);
      const r = RNG(4), emb = toks.map(() => range(6, () => r.n() * 0.6));
      const att = [0.03, 0.02, 0.31, 0.05, 0.12, 0.16, 0.02, 0.06, 0.07, 0.11, 0.05];
      function draw() {
        btns.forEach((b, i) => { b.setAttribute('aria-pressed', String(i === cur)); b.className = 'btn' + (i === cur ? ' primary' : ''); });
        clear(box);
        if (cur === 0) box.append(H('p', {}, 'Brukeren skriver en instruksjon med kontekst:'), H('div', { class: 'formula', style: 'font-family:var(--font-body)' }, '«Forklar bias–varians i én setning.»'),
          H('p', { class: 'mini' }, 'En god prompt sier hvilken rolle modellen har, hva oppgaven er, hvilken kontekst den skal bruke, og hvilket format svaret skal ha.'));
        if (cur === 1) box.append(H('p', {}, 'Teksten deles i tokens: hele ord, deler av ord eller tegn. Modellen jobber med token-ID-er, ikke bokstaver.'),
          H('div', { style: 'display:flex;flex-wrap:wrap;gap:4px' }, toks.map((t, i) => H('span', { style: `background:color-mix(in srgb,var(--c${i % 6}) 22%,transparent);border-radius:5px;padding:4px 7px;font-family:var(--font-mono);font-size:.9rem;white-space:pre` }, t, H('sub', { style: 'color:var(--muted);margin-left:4px' }, String(1000 + ((i * 7919) % 9000)))))),
          H('p', { class: 'mini' }, 'Oppdelingen her er laget for illustrasjon. Hver tokenizer deler litt ulikt, og norsk tekst blir ofte til flere tokens enn engelsk.'));
        if (cur === 2) { const t = H('table', { class: 'tbl' }, H('tr', {}, H('th', { class: 'l' }, 'Token'), range(6, j => H('th', {}, 'd' + (j + 1))), H('th', {}, '…')), toks.slice(0, 6).map((tk, i) => H('tr', {}, H('td', { class: 'l', style: 'font-family:var(--font-mono);white-space:pre' }, tk), emb[i].map(v => H('td', {}, fx(v, 2))), H('td', {}, '…'))));
          box.append(H('p', {}, 'Hvert token blir en vektor av tall (en embedding). Ord med lignende betydning får vektorer som ligger nær hverandre.'), H('div', { class: 'tblwrap' }, t), H('p', { class: 'mini' }, 'Se figuren lenger ned for hvordan nærhet mellom vektorer fungerer.')); }
        if (cur === 3) { const svg = S('svg', { viewBox: '0 0 760 150', class: 'plot', role: 'img', 'aria-label': 'Attention-vekter' });
          toks.forEach((t, i) => { const x = 20 + i * 66; S('rect', { x, y: 100 - att[i] * 280, width: 50, height: att[i] * 280, rx: 3, class: 'f-c2', 'fill-opacity': 0.75 }, svg); S('text', { x: x + 25, y: 118, 'text-anchor': 'middle', class: 'lbl', text: t.trim() || '␣', style: 'font-size:12px' }, svg); S('text', { x: x + 25, y: 95 - att[i] * 280, 'text-anchor': 'middle', text: fx(att[i], 2), style: 'font-size:11px' }, svg); });
          S('text', { x: 20, y: 142, text: 'Hvor mye det neste tokenet «ser på» hvert tidligere token (attention-vekter, summerer til 1)', style: 'font-size:11px' }, svg);
          box.append(H('p', {}, 'Transformeren regner ut hvordan hvert token henger sammen med de andre (attention), og gir til slutt en sannsynlighet for hvert mulig neste token.'), svg); }
        if (cur === 4) box.append(H('p', {}, 'Modellen velger ett token, legger det til teksten og gjentar hele runden. Svaret vokser ett token om gangen:'),
          H('div', { class: 'formula', style: 'font-family:var(--font-body)' }, 'En enkel modell bommer systematisk (bias)', H('span', { style: 'color:var(--accent)' }, ', mens'), H('span', { style: 'color:var(--muted)' }, ' …')),
          H('div', { class: 'pit' }, H('b', {}, 'Viktig'), 'Sannsynligheten for et token er ikke sannsynligheten for at påstanden er sann. Modellen kan skrive noe flytende og sikkert som er feil (hallusinasjon).'));
      }
      draw();
    }
  }, {
    title: 'Temperatur: hvor tilfeldig er neste token?',
    sub: 'Teksten så langt er «Den beste måten å forberede seg til eksamen på er å». Modellen gir en logit per kandidat. Softmax med temperatur T gjør dem om til sannsynligheter.',
    build(el) {
      const W = ['øve', 'løse', 'lese', 'sove', 'jobbe', 'spise', 'danse'], Z = [3.1, 2.5, 2.3, 1.3, 0.9, 0.1, -1.2];
      let T = 1, draws = [];
      const rng = RNG(2026);
      const ctl = Controls(el);
      Slider(ctl, { label: 'Temperatur T', min: 0.05, max: 2.5, step: 0.05, value: T, fmt: v => fx(v, 2), oninput: v => { T = v; draws = []; draw(); } });
      const sample = () => { const p = softmax(Z, T), u = rng(); let c = 0; for (let i = 0; i < p.length; i++) { c += p[i]; if (u <= c) return i; } return p.length - 1; };
      Btn(ctl, 'Trekk ett token', () => { draws.push(sample()); draw(); }, 'primary');
      Btn(ctl, 'Trekk 20', () => { for (let i = 0; i < 20; i++) draws.push(sample()); draw(); });
      Btn(ctl, 'Nullstill', () => { draws = []; draw(); });
      const svg = S('svg', { viewBox: '0 0 760 250', class: 'plot', role: 'img', 'aria-label': 'Sannsynlighet per kandidat' }); el.append(svg);
      const out = H('p', { class: 'mini' }); el.append(out);
      const tiles = Tiles(el, [['top', 'P(«øve»)'], ['n', 'Kandidater over 5 %'], ['d', 'Trekninger']]);
      function draw() {
        const p = softmax(Z, T), cnt = W.map((_, i) => draws.filter(d => d === i).length), mc = Math.max(1, ...cnt); clear(svg);
        W.forEach((w, i) => { const y = 8 + i * 34;
          S('text', { x: 0, y: y + 18, class: 'lbl', text: w, style: 'font-size:13px' }, svg);
          S('text', { x: 64, y: y + 18, text: 'logit ' + fx(Z[i], 1), style: 'font-size:11px' }, svg);
          S('rect', { x: 140, y, width: 420, height: 24, rx: 4, class: 'f-soft' }, svg);
          S('rect', { x: 140, y, width: 420 * p[i], height: 24, rx: 4, class: 'f-c2' }, svg);
          S('text', { x: 568, y: y + 17, class: 'lbl', text: fx(p[i], 3), style: 'font-size:12px' }, svg);
          if (draws.length) { S('rect', { x: 630, y: y + 4, width: 110 * cnt[i] / mc, height: 16, rx: 3, class: 'f-hl' }, svg); S('text', { x: 636 + 110 * cnt[i] / mc, y: y + 17, text: String(cnt[i]), style: 'font-size:11px' }, svg); }
        });
        S('text', { x: 630, y: 248, text: draws.length ? 'antall trukket' : '', style: 'font-size:11px' }, svg);
        out.textContent = draws.length ? 'Siste trekninger: … ' + draws.slice(-8).map(d => W[d]).join(', ') : 'Trykk «Trekk ett token» for å la modellen velge.';
        tiles.set('top', fx(p[0], 3)); tiles.set('n', String(p.filter(v => v > 0.05).length)); tiles.set('d', String(draws.length));
      }
      draw();
    },
    tryit: ['Lav temperatur (0,05–0,2): «øve» får nesten all sannsynlighet. Modellen svarer likt hver gang.', 'Høy temperatur (2+): sannsynlighetene jevnes ut, og også «danse» blir trukket av og til. Mer variasjon og kreativitet, men også mer tull.', 'Logitene endres aldri. Temperaturen påvirker bare hvordan de blir gjort om til sannsynligheter.']
  }, {
    title: 'Embeddings: ord som ligner, ligger nær hverandre',
    sub: 'Hvert ord er en vektor med 8 tall. Kartet viser de to første prinsipalkomponentene (PCA). Klikk på et ord for å se de nærmeste ordene målt med cosinuslikhet i alle 8 dimensjonene.',
    build(el) {
      const groups = [['aksje', 'rente', 'utbytte', 'obligasjon'], ['regn', 'snø', 'vind', 'sol'], ['modell', 'data', 'trening', 'validering'], ['katt', 'hund', 'hest', 'ku']];
      const r = RNG(31), cen = groups.map((_, k) => range(8, j => j === 0 ? 3 * Math.cos(Math.PI * k / 2 + 0.4) : j === 1 ? 3 * Math.sin(Math.PI * k / 2 + 0.4) : 0.8 * r.n())), words = [], V = [];
      groups.forEach((g, k) => g.forEach(w => { words.push([w, k]); V.push(cen[k].map(v => v + 0.5 * r.n())); }));
      const m = range(8, j => mean(V.map(v => v[j]))), C = V.map(v => v.map((x, j) => x - m[j]));
      const pc = []; for (let c = 0; c < 2; c++) { let u = range(8, j => Math.sin(j + 1 + c)); for (let it = 0; it < 200; it++) { let w2 = range(8, () => 0); for (const v of C) { const d = sum(v.map((x, j) => x * u[j])); w2 = w2.map((y, j) => y + d * v[j]); } for (const q of pc) { const d = sum(w2.map((x, j) => x * q[j])); w2 = w2.map((x, j) => x - d * q[j]); } const nrm = Math.hypot(...w2); u = w2.map(x => x / nrm); } pc.push(u); }
      const P2 = C.map(v => pc.map(u => sum(v.map((x, j) => x * u[j]))));
      const cos = (a, b) => sum(a.map((x, j) => x * b[j])) / (Math.hypot(...a) * Math.hypot(...b));
      const xs = P2.map(p => p[0]), ys = P2.map(p => p[1]), pad = 1.3;
      let sel = 8;
      const cols = H('div', { class: 'cols' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      const plot = new Plot(a, { w: 540, h: 400, m: { t: 10, r: 10, b: 36, l: 40 }, x: [Math.min(...xs) - pad, Math.max(...xs) + pad], y: [Math.min(...ys) - pad, Math.max(...ys) + pad], xlab: 'PC1', ylab: 'PC2', xticks: [], yticks: [], label: 'Ordkart' });
      const gL = plot.layer(), gW = plot.layer();
      const tw = H('div', { class: 'tblwrap' }); b.append(tw);
      function draw() {
        clear(gL); clear(gW); const X = plot.x, Y = plot.y;
        const nb = words.map((w, i) => [cos(V[sel], V[i]), i]).filter(t => t[1] !== sel).sort((p, q) => q[0] - p[0]);
        nb.slice(0, 4).forEach(([s, i]) => S('line', { x1: X(P2[sel][0]), y1: Y(P2[sel][1]), x2: X(P2[i][0]), y2: Y(P2[i][1]), class: 's-acc', 'stroke-width': 1 + 3 * Math.max(0, s), 'stroke-opacity': 0.6 }, gL));
        const pick = i => () => { sel = i; draw(); };
        words.forEach(([w, k], i) => { const c = S('circle', { cx: X(P2[i][0]), cy: Y(P2[i][1]), r: i === sel ? 8 : 6, class: 'f-c' + k + ' drag', stroke: i === sel ? 'currentColor' : null, style: 'color:var(--ink)', 'stroke-width': 2, tabindex: 0, role: 'button', 'aria-label': w }, gW);
          c.addEventListener('click', pick(i)); c.addEventListener('keydown', e => { if (e.key === 'Enter') pick(i)(); }); });
        placeLabels(gW, words.map(([w], i) => ({ x: X(P2[i][0]), y: Y(P2[i][1]), text: w, bold: i === sel })), 12.5).forEach((t, i) => { t.classList.add('drag'); t.addEventListener('click', pick(i)); });
        clear(tw).append(H('table', { class: 'tbl' }, H('tr', {}, H('th', { class: 'l' }, 'Nærmest «' + words[sel][0] + '»'), H('th', {}, 'Cosinuslikhet')), nb.slice(0, 6).map(([s, i]) => H('tr', {}, H('td', { class: 'l' }, words[i][0]), H('td', {}, fx(s, 3)))),
          H('tr', {}, H('td', { class: 'l' }, '… lengst unna: ' + words[nb[nb.length - 1][1]][0]), H('td', {}, fx(nb[nb.length - 1][0], 3)))));
      }
      draw();
      b.append(H('p', { class: 'note', html: 'Cosinuslikhet = 1 betyr samme retning, 0 betyr ingen sammenheng. Vektorene her er laget for illustrasjon; ekte embeddings lærer modellen fra enorme tekstmengder.' }));
    },
    tryit: ['Klikk «modell». Nærmeste naboer er de andre maskinlæringsordene.', 'Avstanden i kartet er bare en tilnærming. Tabellen bruker alle 8 dimensjonene, så rekkefølgen kan avvike litt fra det du ser.']
  }],
  body: `
<h2>Hva er generativ KI?</h2>
<p>Generativ KI lager nytt innhold: tekst, bilder, lyd eller kode. KI er det brede feltet, maskinlæring er metoder som lærer av data, dyp læring er maskinlæring med store nevrale nett, og generativ KI er dyp læring som produserer nytt innhold. De tidligere modellene i faget har titalls eller hundretalls parametre. De største språkmodellene har hundrevis av milliarder.</p>
<h2>Neste-token-prediksjon er veiledet læring</h2>
<p>Kjerneoppgaven er å predikere neste token gitt prompten og teksten så langt, som en avansert autofullføring. Fasiten (Y) er det faktiske neste tokenet i treningsteksten, så oppgaven er veiledet, men fasiten kommer gratis fra teksten selv.</p>
<h2>Fra prompt til svar</h2>
<ol>
<li><b>Prompt:</b> instruksjon og kontekst fra brukeren.</li>
<li><b>Tokens:</b> teksten deles i enheter (ord, orddeler, tegn) med en tokenizer.</li>
<li><b>Embeddings:</b> hvert token blir en tallvektor. Nære vektorer har lignende betydning.</li>
<li><b>Transformer:</b> attention finner sammenhenger mellom alle tokens i konteksten, og modellen gir en sannsynlighet for hvert mulig neste token.</li>
<li><b>Svar:</b> ett token velges og legges til, og prosessen gjentas til svaret er ferdig.</li>
</ol>
<h2>Temperatur</h2>
<div class="formula"><span class="v">p</span><sub><span class="v">i</span></sub> = e<sup><span class="v">z</span><sub><span class="v">i</span></sub>/<span class="v">T</span></sup> / Σ<sub><span class="v">j</span></sub> e<sup><span class="v">z</span><sub><span class="v">j</span></sub>/<span class="v">T</span></sup></div>
<ul>
<li><b>Lav temperatur:</b> det mest sannsynlige tokenet velges nesten alltid. Stabile, like svar. Bra for uthenting av fakta og faste formater.</li>
<li><b>Høy temperatur:</b> flere fortsettelser får en sjanse. Mer variasjon og kreativitet, men flere feil.</li>
</ul>
<h2>Bilder og flere typer input</h2>
<p><b>Multimodale modeller</b> tar inn tekst, bilder og lyd og kan beskrive, hente ut eller generere på tvers. Bildegeneratorer bruker ofte <b>diffusjon</b>: modellen lærer å fjerne støy, og lager et bilde ved å starte med ren støy og fjerne den steg for steg, styrt av teksten.</p>
<div class="pit"><b>Eksamensfelle</b>En høy token-sannsynlighet betyr at teksten er et typisk språklig valg, ikke at påstanden er sann. Det er grunnen til at modeller kan hallusinere med stor selvsikkerhet.</div>
<h2>Python</h2>
<pre><code>import numpy as np

def neste_token(logits, T=1.0, rng=np.random.default_rng(1)):
    p = np.exp(logits / T)
    p = p / p.sum()                       # softmax med temperatur
    return rng.choice(len(p), p=p)        # trekk ett token

ord = ['øve', 'løse', 'lese', 'sove']
logits = np.array([3.1, 2.5, 2.3, 1.3])
print([ord[neste_token(logits, T=0.1)] for _ in range(5)])   # nesten alltid 'øve'
print([ord[neste_token(logits, T=2.0)] for _ in range(5)])   # mer variasjon</code></pre>`
});

topic({
  id: 'rag', short: 'RAG og finjustering', lecture: 'F11', tags: ['Generativ KI', 'RAG', 'Etikk'],
  title: 'Prompting, RAG, finjustering og etikk',
  path: ['Veiledet læring', 'Generativ KI'],
  lead: 'En generell språkmodell kan tilpasses på tre måter: bedre instruksjoner (prompting), relevante kilder hentet inn til hvert spørsmål (RAG), eller videre trening av vektene (finjustering). Uansett må mennesker kontrollere det som kommer ut.',
  figs: [{
    title: 'RAG steg for steg',
    sub: 'Seks utdrag fra årsrapporten til et oppdiktet selskap, Fjordlys AS. Velg et spørsmål. Systemet henter de to mest like utdragene, legger dem i prompten og ber modellen svare bare fra dem.',
    build(el) {
      const DOC = [
        ['s. 4', 'Fjordlys AS leverer solcelleanlegg til bedrifter på Vestlandet og har 46 ansatte.'],
        ['s. 7', 'Omsetningen økte fra 210 til 245 millioner kroner, drevet av flere store anlegg.'],
        ['s. 7', 'Driftsresultatet falt fra 18 til 12 millioner kroner på grunn av høyere innkjøpspriser.'],
        ['s. 9', 'Selskapet investerte 30 millioner kroner i et nytt lager i Bergen.'],
        ['s. 12', 'Sykefraværet var 4,1 prosent, ned fra 5,3 prosent året før.'],
        ['s. 15', 'Styret foreslår et utbytte på 2 kroner per aksje.']];
      const Q = [
        ['Hvor mye falt driftsresultatet?', 'Driftsresultatet falt fra 18 til 12 millioner kroner, altså med 6 millioner (kilde: s. 7).', 'Driftsresultatet falt med rundt 10 prosent, til omtrent 16 millioner kroner.'],
        ['Hvor høyt var sykefraværet?', 'Sykefraværet var 4,1 prosent, ned fra 5,3 prosent (kilde: s. 12).', 'Sykefraværet var på 6,2 prosent, omtrent som i bransjen ellers.'],
        ['Hva foreslår styret i utbytte?', 'Styret foreslår 2 kroner per aksje (kilde: s. 15).', 'Styret foreslår et utbytte på 3,50 kroner per aksje.']];
      const STOP = new Set(['hva', 'hvor', 'i', 'på', 'av', 'til', 'og', 'fra', 'er', 'var', 'en', 'et', 'det', 'som', 'med', 'for', 'året', 'før', 'mye', 'høyt', 'ned', 'per']);
      const stem = w => w.replace(/(ene|ens|en|et|er|e)$/, '');
      const bag = s => { const m = new Map(); s.toLowerCase().replace(/[^a-zæøå0-9 ]/g, ' ').split(/\s+/).filter(w => w && !STOP.has(w)).map(stem).forEach(w => m.set(w, (m.get(w) || 0) + 1)); return m; };
      const cosB = (a, b) => { let d = 0; for (const [k, v] of a) if (b.has(k)) d += v * b.get(k); const na = Math.hypot(...a.values()), nb = Math.hypot(...b.values()); return na && nb ? d / (na * nb) : 0; };
      let qi = 0, rag = true;
      const ctl = Controls(el);
      Select(ctl, { label: 'Spørsmål', options: Q.map((q, i) => [String(i), q[0]]), value: '0', onchange: v => { qi = +v; draw(); } });
      Seg(ctl, { label: 'Modus', options: [[true, 'Med RAG'], [false, 'Uten RAG']], value: rag, onchange: v => { rag = v; draw(); } });
      const cols = H('div', { class: 'cols even' }); el.append(cols);
      const a = H('div'), b = H('div'); cols.append(a, b);
      function draw() {
        const qb = bag(Q[qi][0]), sc = DOC.map((d, i) => [cosB(qb, bag(d[1])), i]).sort((p, q) => q[0] - p[0]), top = new Set(sc.slice(0, 2).filter(t => t[0] > 0).map(t => t[1]));
        clear(a).append(H('p', { class: 'mini', style: 'margin-top:0' }, H('b', {}, '1. Hent: '), 'likhet mellom spørsmålet og hvert utdrag (ordtelling og cosinus):'),
          H('div', { class: 'tblwrap' }, H('table', { class: 'tbl' }, H('tr', {}, H('th', { class: 'l' }, 'Side'), H('th', { class: 'l' }, 'Utdrag'), H('th', {}, 'Likhet')),
            DOC.map((d, i) => H('tr', { class: rag && top.has(i) ? 'on' : '' }, H('td', { class: 'l', style: 'white-space:nowrap' }, d[0]), H('td', { class: 'l', style: 'white-space:normal;min-width:220px' }, d[1]), H('td', {}, fx(sc.find(t => t[1] === i)[0], 2)))))));
        const prompt = rag ? `Svar bare ut fra utdragene, og oppgi side.\nUtdrag: ${[...top].map(i => '«' + DOC[i][1] + '» (' + DOC[i][0] + ')').join(' ')}\nSpørsmål: ${Q[qi][0]}` : `Spørsmål: ${Q[qi][0]}`;
        clear(b).append(H('p', { class: 'mini', style: 'margin-top:0' }, H('b', {}, '2. Utvid prompten:')), H('pre', { style: 'white-space:pre-wrap' }, prompt),
          H('p', { class: 'mini' }, H('b', {}, '3. Generer:')),
          H('div', { class: rag ? 'formula' : 'pit', style: 'font-family:var(--font-body);font-size:1rem' }, rag ? Q[qi][1] : [H('b', {}, 'Selvsikkert, men oppdiktet'), Q[qi][2]]),
          H('p', { class: 'note' }, rag ? 'Svaret kan sjekkes mot kilden. Det gjør feil lettere å oppdage.' : 'Uten kildene vet ikke modellen noe om Fjordlys AS, men den skriver likevel et troverdig svar. Det er en hallusinasjon.'));
      }
      draw();
    },
    tryit: ['Bytt mellom spørsmålene og se hvilke utdrag som får høyest likhet. Ekte systemer bruker embeddings i stedet for ordtelling, men ideen er den samme.', 'Velg «Uten RAG». Svaret ser like sikkert ut, men tallene er funnet på.']
  }, {
    title: 'Hvilken tilpasning passer?',
    sub: 'Kryss av for det som gjelder oppgaven. De anbefalte metodene markeres. Ofte kombinerer man dem.',
    build(el) {
      const Qs = [['fresh', 'Svaret må bygge på egne, interne eller ferske dokumenter'], ['format', 'Du trenger et fast format, fagspråk eller stil i svært mange svar'], ['ex', 'Du har tusenvis av gode eksempler med fasit'], ['simple', 'Oppgaven kan beskrives med en tydelig instruksjon og noen eksempler']];
      const st = { fresh: true, format: false, ex: false, simple: true };
      const box = H('div', { style: 'display:grid;gap:6px;margin-bottom:12px' }); el.append(box);
      Qs.forEach(([k, t]) => { const id = uid('cb'), cb = H('input', { type: 'checkbox', id }); cb.checked = st[k]; cb.addEventListener('change', () => { st[k] = cb.checked; draw(); }); box.append(H('label', { for: id, style: 'display:flex;gap:8px;align-items:center;font-size:.95rem' }, cb, t)); });
      const cards = H('div', { class: 'pros' }); el.append(cards);
      const M = [['prompt', 'Prompting', 'Instruksjon og kontekst', 'Billig og raskt. Start alltid her.', 'Krev enhet, format og kildehenvisning i svaret.'],
        ['rag', 'RAG', 'Kildene som hentes inn til hvert spørsmål', 'Fersk og privat kunnskap uten ny trening. Svar kan spores til kilder.', 'Hent riktig årsrapport før modellen svarer.'],
        ['fine', 'Finjustering', 'Modellens vekter, gjennom videre trening', 'Lærer et fast format eller fagspråk. Krever mange eksempler, regnekraft og vedlikehold.', 'Tren på tusenvis av ferdig kodede tekster.']];
      function draw() {
        const rec = new Set(); if (st.simple) rec.add('prompt'); if (st.fresh) rec.add('rag'); if (st.format && st.ex) rec.add('fine'); if (!rec.size) rec.add('prompt');
        clear(cards).append(...M.map(([k, t, what, why, ex]) => H('div', { style: rec.has(k) ? 'border:2px solid var(--accent)' : 'opacity:.6' }, H('h3', {}, t + (rec.has(k) ? '  ✓' : '')), H('ul', {}, H('li', {}, H('b', {}, 'Endrer: '), what), H('li', {}, why), H('li', {}, H('i', {}, 'Eksempel: '), ex)))));
      }
      draw();
    }
  }],
  body: `
<h2>Generere eller hente ut?</h2>
<p>Språkmodeller kan <b>generere</b> ny tekst (utkast, oppsummeringer, kode) eller <b>hente ut</b> strukturert informasjon fra tekst (tall fra årsrapporter, kategorier fra kundemeldinger). Uthenting er nærmere klassisk maskinlæring: det finnes en fasit, og vi kan måle treffsikkerhet.</p>
<h2>Tre måter å tilpasse</h2>
<div class="tblwrap"><table class="tbl">
<tr><th class="l">Metode</th><th class="l">Det vi endrer</th><th class="l">Passer når</th></tr>
<tr><td class="l">Prompting</td><td class="l">Instruksjon og kontekst</td><td class="l">Oppgaven kan forklares tydelig. Alltid første steg.</td></tr>
<tr><td class="l">RAG (retrieval augmented generation)</td><td class="l">Kildene som hentes inn</td><td class="l">Svaret skal bygge på egne eller ferske dokumenter.</td></tr>
<tr><td class="l">Finjustering</td><td class="l">Modellens parametre, gjennom videre trening</td><td class="l">Et fast format eller fagspråk skal læres fra mange eksempler.</td></tr>
</table></div>
<h2>RAG i fire steg</h2>
<ol>
<li>Del dokumentene i utdrag og lag en embedding av hvert utdrag.</li>
<li>Lag en embedding av spørsmålet og hent de mest like utdragene.</li>
<li>Legg utdragene inn i prompten, med beskjed om å svare bare fra dem og oppgi kilde.</li>
<li>Modellen genererer et svar som kan sjekkes mot kildene.</li>
</ol>
<h2>Mål før du tolker</h2>
<p>Bruker du en språkmodell til å måle noe (for eksempel tone i årsrapporter), lag en menneskelig fasit på et utvalg og mål hvor ofte modellen treffer, akkurat som med en valideringsdel. Først når målingen er god nok, gir det mening å tolke tallene økonomisk.</p>
<h2>Etiske utfordringer</h2>
<ul>
<li><b>Hallusinasjon:</b> flytende og selvsikre svar som er feil. Et sikkert svar kan skjule en feil.</li>
<li><b>Desinformasjon og manipulasjon:</b> billig produksjon av troverdig falskt innhold.</li>
<li><b>Instrukser gjemt i dokumenter (prompt injection):</b> et dokument modellen leser, kan prøve å gi den nye ordre.</li>
<li><b>Opphavsrett og personvern:</b> hva modellen er trent på, og hva du laster opp.</li>
<li><b>Energiforbruk</b> ved trening og bruk.</li>
<li><b>Maktkonsentrasjon:</b> få selskaper kontrollerer de største modellene.</li>
<li><b>Menneskelig kontroll</b> trengs både når systemet bygges (testing, fasit) og når det brukes (sjekk av enkeltsvar).</li>
</ul>
<div class="pit"><b>Eksamensfelle</b>RAG gjør ikke modellen klokere. Den gir modellen bedre kilder å svare fra. Er feil utdrag hentet, kan svaret fortsatt bli feil, men nå med en kilde du kan sjekke.</div>`
});
