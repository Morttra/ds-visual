/* Sider, metodetre og ruting. Temaene registrerer seg med topic({...}). */
const TOPICS = {};
function topic(t) { TOPICS[t.id] = t; }

const ORDER = ['dataforberedelse', 'pca', 'bias-varians', 'evaluering-prediksjon', 'evaluering-klassifikasjon',
  'lineaer-regresjon', 'variabelseleksjon', 'logistisk-regresjon', 'knn', 'naiv-bayes', 'beslutningstraer', 'ensembler',
  'shap', 'konform', 'nevrale-nett', 'hierarkisk-klynging', 'k-means', 'sprakmodeller', 'rag'];

const TREE_LEAVES = {
  klass: { title: 'Klassifikasjon', note: 'Y er kategorisk: eier eller ikke-eier, svindel eller ærlig.', color: 'var(--c1)',
    chips: [['logistisk-regresjon', 'Logistisk regresjon'], ['knn', 'k-nærmeste naboer'], ['naiv-bayes', 'Naiv Bayes'], ['beslutningstraer', 'Klassifikasjonstrær'], ['ensembler', 'Random forest og boosting'], ['nevrale-nett', 'Nevrale nett og CNN']] },
  pred: { title: 'Prediksjon', note: 'Y er et tall: pris, salg, boligverdi.', color: 'var(--c4)',
    chips: [['lineaer-regresjon', 'Lineær regresjon'], ['variabelseleksjon', 'Variabelvalg, ridge og lasso'], ['knn', 'k-NN for tall'], ['beslutningstraer', 'Regresjonstrær'], ['ensembler', 'Ensembler'], ['nevrale-nett', 'Nevrale nett']] },
  gen: { title: 'Generativ KI', note: 'Y er neste ord eller bildebit. Modellen lager nytt innhold.', color: 'var(--c2)',
    chips: [['sprakmodeller', 'Språkmodeller og temperatur'], ['rag', 'RAG, finjustering og etikk']] },
  uvel: { title: 'Klynger og PCA', note: 'Ingen Y. Vi ser etter grupper og mønstre i X.', color: 'var(--c0)',
    chips: [['hierarkisk-klynging', 'Hierarkisk klynging'], ['k-means', 'k-means'], ['pca', 'PCA (prinsipalkomponenter)']] }
};

function chip(id, label) {
  const t = TOPICS[id];
  return H('a', { class: 'chip', href: '#' + id }, label || (t && t.short) || id, t ? H('i', {}, t.lecture) : null);
}
function leaf(key) {
  const L = TREE_LEAVES[key];
  return H('div', { class: 'leaf', style: '--lc:' + L.color }, H('h3', {}, L.title), H('p', {}, L.note), H('div', { class: 'chips' }, L.chips.map(([id, lab]) => chip(id, lab))));
}

function renderHome(main) {
  document.title = 'BBAN4001 visuelt';
  main.append(
    H('section', { class: 'hero' },
      H('h1', {}, 'Pensum i Data Science, som et tre du kan klikke i'),
      H('p', {}, 'Treet starter med ett spørsmål: har vi en fasit å lære fra? Svaret leder deg til riktig familie av metoder. Trykk på en metode for å se den i aksjon. Hver side har figurer du kan dra i, og en skriftlig forklaring under.')),
    H('div', { class: 'tree', role: 'navigation', 'aria-label': 'Metodetreet' },
      H('ul', {}, H('li', {},
        H('div', { class: 'q' }, 'Har vi en fasit (Y) å lære fra?'),
        H('ul', {},
          H('li', {}, H('div', { class: 'branch' }, 'Ja ', H('small', {}, '· veiledet læring')),
            H('ul', {}, H('li', {}, H('div', { class: 'q' }, 'Hva slags Y?'),
              H('ul', {}, H('li', {}, leaf('klass')), H('li', {}, leaf('pred')), H('li', {}, leaf('gen')))))),
          H('li', {}, H('div', { class: 'branch' }, 'Nei ', H('small', {}, '· ikke-veiledet læring')),
            H('ul', {}, H('li', {}, H('div', { class: 'q' }, 'Hva vil vi finne?'),
              H('ul', {}, H('li', {}, leaf('uvel')))))))))),
    H('div', { class: 'bands' },
      H('section', { class: 'band' }, H('h2', {}, 'Legges oppå en ferdig trent modell'),
        H('p', {}, 'Virker sammen med nesten alle modellene over: forklar hvorfor modellen svarte som den gjorde, og hvor sikker den er.'),
        H('div', { class: 'chips' }, chip('shap', 'Forklarbar KI med SHAP'), chip('konform', 'Usikkerhet med konform prediksjon'))),
      H('section', { class: 'band' }, H('h2', {}, 'Grunnmuren under alle metodene'),
        H('p', {}, 'Ikke modeller, men stegene som avgjør om en modell er god. Dette går igjen på hver eksamen.'),
        H('div', { class: 'chips' }, chip('dataforberedelse', 'Dataforberedelse og skalering'), chip('bias-varians', 'Partisjonering og bias–varians'),
          chip('evaluering-prediksjon', 'Evaluering av prediksjon'), chip('evaluering-klassifikasjon', 'Evaluering av klassifikasjon')))),
    H('div', { class: 'howto' },
      H('div', {}, H('b', {}, 'Les treet ovenfra'), 'Har vi en fasit Y, og hva slags Y er det? Svarene forteller hvilken familie en metode hører til.'),
      H('div', {}, H('b', {}, 'Lek med figurene'), 'Dra i glidebrytere og punkter. Under hver figur står det hva du kan prøve og se etter.'),
      H('div', {}, H('b', {}, 'Les forklaringen etterpå'), 'Formler, hyperparametre, styrker og svakheter, typiske eksamensfeller og Python-kode i lærebokas stil.'))
  );
}

function renderTopic(main, t) {
  document.title = t.title + ' · BBAN4001 visuelt';
  main.append(H('nav', { class: 'crumbs', 'aria-label': 'Du er her' }, H('a', { href: '#' }, 'Metodetreet'), ' › ', t.path.join(' › ')));
  main.append(H('header', { class: 'thead' }, H('h1', {}, t.title), H('p', { class: 'lead' }, t.lead),
    H('div', { class: 'pills' }, H('span', { class: 'pill f' }, 'Forelesning ' + t.lecture), (t.tags || []).map(x => H('span', { class: 'pill' }, x)))));
  for (const f of t.figs || []) {
    const fig = H('figure', { class: 'viz', style: 'margin-inline:0' });
    fig.append(H('h2', {}, f.title));
    if (f.sub) fig.append(H('p', { class: 'sub', html: f.sub }));
    const body = H('div'); fig.append(body);
    main.append(fig);
    try { f.build(body); } catch (e) { console.error(e); body.append(H('p', { class: 'note' }, 'Figuren kunne ikke vises: ' + e.message)); }
    if (f.tryit) fig.append(H('div', { class: 'try' }, H('strong', {}, 'Prøv dette'), H('ul', {}, f.tryit.map(x => H('li', { html: x })))));
  }
  main.append(H('article', { class: 'prose', html: t.body }));
  const i = ORDER.indexOf(t.id), prev = TOPICS[ORDER[i - 1]], next = TOPICS[ORDER[i + 1]];
  main.append(H('nav', { class: 'pager', 'aria-label': 'Forrige og neste tema' },
    prev ? H('a', { href: '#' + prev.id }, H('small', {}, '← Forrige i forelesningsrekkefølge'), prev.title) : H('a', { href: '#' }, H('small', {}, '←'), 'Metodetreet'),
    next ? H('a', { href: '#' + next.id, style: 'text-align:right' }, H('small', {}, 'Neste i forelesningsrekkefølge →'), next.title) : H('a', { href: '#', style: 'text-align:right' }, H('small', {}, '→'), 'Metodetreet')));
}

function route() {
  while (CLEANUP.length) { try { CLEANUP.pop()(); } catch (e) { } }
  const main = clear(document.getElementById('main'));
  const id = decodeURIComponent(location.hash.slice(1));
  const t = TOPICS[id];
  if (t) renderTopic(main, t); else renderHome(main);
  window.scrollTo(0, 0);
}
