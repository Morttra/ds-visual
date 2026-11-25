/* Beskrivelser av datasettene, slik at siden gir mening uten forelesningene. Vises som «Om dataene»-kort og på siden #datasett. */

const FUEL = { CNG: 'CNG', Diesel: 'Diesel', Petrol: 'Petrol' };
const DATASETS = {
  toyota: {
    name: 'Bruktbiler (Toyota Corolla)', file: 'ToyotaCorolla.csv',
    what: 'Annonser for brukte Toyota Corolla som var til salgs i Nederland sensommeren 2004.',
    row: 'én bil',
    goal: 'Predikere salgsprisen (Price) ut fra alder, kjørelengde og utstyr.',
    size: 'Hele datasettet har 1 436 biler. Som i læreboka bruker vi de første 1 000: 600 til trening og 400 til validering. Prisene går fra 4 350 til 32 500 euro, og bilene er 1–68 måneder gamle.',
    vars: [['Price', 'Salgspris i euro', 1], ['Age_08_04', 'Alder i måneder per august 2004'], ['KM', 'Kjørte kilometer'], ['Fuel_Type', 'Drivstoff: Petrol (bensin), Diesel eller CNG (naturgass)'], ['HP', 'Hestekrefter'], ['Met_Color', 'Metallic lakk: 1 = ja, 0 = nei'], ['Automatic', 'Automatgir: 1 = ja, 0 = nei'], ['CC', 'Motorvolum i kubikkcentimeter'], ['Doors', 'Antall dører'], ['Quarterly_Tax', 'Veiavgift per kvartal i euro'], ['Weight', 'Vekt i kg']],
    rows() {
      const s = DATA.shapLinear, ix = c => s.cols.indexOf(c);
      return s.cars.slice(0, 3).map(c => ({ Price: c.actual, Fuel_Type: c.x[ix('Fuel_Type_Diesel')] ? 'Diesel' : c.x[ix('Fuel_Type_Petrol')] ? 'Petrol' : 'CNG', ...Object.fromEntries(s.cols.filter(n => !n.startsWith('Fuel')).map(n => [n, c.x[ix(n)]])) }));
    },
    used: ['dataforberedelse', 'lineaer-regresjon', 'variabelseleksjon', 'knn', 'shap']
  },
  mowers: {
    name: 'Sitteklippere (Riding Mowers)', file: 'RidingMowers.csv',
    what: 'En produsent av sitteklippere (gressklippere man sitter på) vil finne ut hvilke husholdninger som sannsynligvis kjøper en. I et pilotutvalg i én by ble 12 husholdninger som eier en sitteklipper og 12 som ikke gjør det, registrert.',
    row: 'én husholdning',
    goal: 'Klassifisere husholdninger som eier eller ikke-eier (Ownership) ut fra inntekt og tomtestørrelse.',
    size: '24 husholdninger og 2 forklaringsvariabler. Inntekten går fra 33 til 110 tusen dollar, tomtene fra 14 til 24 tusen kvadratfot.',
    vars: [['Ownership', 'Owner (eier) eller Nonowner (ikke-eier)', 1], ['Income', 'Husholdningens inntekt i tusen dollar'], ['Lot_Size', 'Tomtestørrelse i tusen kvadratfot (1 000 ft² er omtrent 93 m²)']],
    rows() { return [0, 5, 12, 21].map(i => { const r = DATA.mowers[i]; return { Ownership: r[2] ? 'Owner' : 'Nonowner', Income: r[0], Lot_Size: r[1] }; }); },
    used: ['dataforberedelse', 'knn', 'beslutningstraer']
  },
  owner: {
    name: 'Ferdige propensiteter for 24 husholdninger', file: 'ownerExample.csv',
    what: 'En klassifikasjonsmodell har allerede regnet ut sannsynligheten (propensiteten) for at hver av 24 husholdninger eier en sitteklipper. Vi vet også hvem som faktisk er eiere. Ingen modell trenes her; dataene brukes til å vise hva som skjer når vi flytter terskelen som gjør en sannsynlighet om til en klasse.',
    row: 'én husholdning: modellens propensitet og faktisk klasse',
    goal: 'Evaluere prediksjoner som allerede finnes.',
    size: '24 husholdninger: 12 eiere og 12 ikke-eiere.',
    vars: [['Class', 'Faktisk klasse: owner (eier) eller nonowner (ikke-eier)', 1], ['Probability', 'Modellens propensitet for eier, mellom 0 og 1']],
    rows() { return [0, 7, 12, 15].map(i => ({ Class: DATA.owner[i][1] ? 'owner' : 'nonowner', Probability: DATA.owner[i][0] })); },
    note: 'I profittberegningen antar vi at hver eier vi kontakter gir 100 kr i fortjeneste, og at hver ikke-eier vi kontakter koster 200 kr. Det er tenkte tall (de samme som i F4).',
    used: ['evaluering-klassifikasjon']
  },
  ub: {
    name: 'Bankkunder (Universal Bank)', file: 'UniversalBank.csv',
    what: 'En bank har 5 000 kunder som har innskudd i banken, men ikke personlån. Banken vil få flere av dem til å låne. Året før sendte banken et lånetilbud til kundene, og 480 av de 5 000 (9,6 %) takket ja.',
    row: 'én kunde',
    goal: 'Forutsi hvem som takker ja til lånetilbudet (Personal Loan), så neste kampanje kan rettes mot dem.',
    size: '5 000 kunder og 11 forklaringsvariabler (ID og postnummer er tatt ut).',
    vars: [['Personal Loan', 'Takket ja til lånetilbudet: 1 = ja, 0 = nei', 1], ['Age', 'Alder i år'], ['Experience', 'Antall år med arbeidserfaring'], ['Income', 'Årsinntekt i tusen dollar'], ['Family', 'Antall personer i husholdningen'], ['CCAvg', 'Kredittkortbruk per måned, i tusen dollar'], ['Education', 'Utdanning: 1 = bachelor, 2 = master, 3 = profesjons- eller doktorgrad'], ['Mortgage', 'Boliglån i tusen dollar (0 = ingen)'], ['Securities Account', 'Har verdipapirkonto i banken: 1 = ja'], ['CD Account', 'Har fastrenteinnskudd (CD) i banken: 1 = ja'], ['Online', 'Bruker nettbank: 1 = ja'], ['CreditCard', 'Har kredittkort fra banken: 1 = ja']],
    rows() { const S0 = DATA.ubSample; return S0.data.map(r => Object.fromEntries(S0.columns.map((c, j) => [c, r[j]]))); },
    used: ['logistisk-regresjon', 'ensembler']
  },
  fraud: {
    name: 'Revisjonseksempelet (svindel)', file: null,
    what: 'Revisorer har gått gjennom regnskapene til 10 selskaper. For hvert selskap vet vi om det har hatt rettslige problemer tidligere, om det er lite eller stort, og om regnskapet viste seg å være svindel eller ærlig. Eksempelet er så lite at det kan regnes for hånd.',
    row: 'ett selskap',
    goal: 'Anslå sannsynligheten for svindel hos et nytt selskap ut fra de to kategoriske variablene.',
    size: '10 selskaper: 4 med svindel og 6 ærlige. Hele tabellen står i figuren under.',
    vars: [['Utfall', 'svindel eller ærlig', 1], ['Tidligere anklager', 'Har selskapet hatt rettslige problemer før? ja eller nei'], ['Størrelse', 'liten eller stor']],
    rows() { return [['ja', 'liten', 'ærlig'], ['nei', 'liten', 'ærlig'], ['ja', 'stor', 'svindel']].map(r => ({ 'Tidligere anklager': r[0], 'Størrelse': r[1], 'Utfall': r[2] })); },
    used: ['naiv-bayes']
  },
  cereals: {
    name: 'Frokostblandinger (Cereals)', file: 'Cereals.csv',
    what: '77 amerikanske frokostblandinger med næringsinnhold per porsjon, plassering i butikken og en samlet karakter (rating).',
    row: 'én frokostblanding',
    goal: 'Ingen Y. Vi bruker PCA til å finne hovedmønstrene i tallvariablene.',
    size: '77 blandinger og 13 tallvariabler. Tre blandinger mangler en verdi, så PCA på alle variablene bruker 74.',
    vars: [['calories', 'Kalorier per porsjon'], ['protein', 'Protein i gram'], ['fat', 'Fett i gram'], ['sodium', 'Natrium i milligram'], ['fiber', 'Kostfiber i gram'], ['carbo', 'Komplekse karbohydrater i gram'], ['sugars', 'Sukker i gram'], ['potass', 'Kalium i milligram'], ['vitamins', 'Vitaminer og mineraler i prosent av anbefalt dagsinntak: 0, 25 eller 100'], ['shelf', 'Hylle i butikken: 1, 2 eller 3, talt fra gulvet'], ['weight', 'Vekt per porsjon i unser (1 unse er omtrent 28 g)'], ['cups', 'Kopper per porsjon'], ['rating', 'Samlet karakter for blandingen, på en skala opp til 100']],
    rows() { const S0 = DATA.cerealSample; return S0.data.slice(0, 3).map(r => Object.fromEntries(S0.columns.map((c, j) => [c, r[j]]))); },
    lead: 'name',
    used: ['pca']
  },
  utilities: {
    name: 'Kraftselskaper (Utilities)', file: 'Utilities.csv',
    what: '22 amerikanske kraftselskaper beskrevet med åtte nøkkeltall om økonomi, kostnader og drift. Tanken i læreboka er å gruppere selskaper med lignende profil, slik at man kan lage en detaljert kostnadsmodell for ett «typisk» selskap per gruppe i stedet for for alle 22.',
    row: 'ett selskap',
    goal: 'Ingen Y. Vi bruker klyngeanalyse til å finne grupper av like selskaper.',
    size: '22 selskaper og 8 variabler. Figurene bruker Sales og Fuel_Cost, slik at alt kan vises i to dimensjoner.',
    vars: [['Sales', 'Årlig strømsalg (kWh)'], ['Fuel_Cost', 'Brenselkostnad i cent per kWh'], ['Fixed_charge', 'Rentedekningsgrad: inntekt delt på gjeld'], ['RoR', 'Avkastning på kapitalen i prosent'], ['Cost', 'Kostnad per kW installert kapasitet'], ['Load_factor', 'Årlig utnyttelse av kapasiteten i prosent'], ['Demand_growth', 'Vekst i toppetterspørsel fra året før, i prosent'], ['Nuclear', 'Andel kjernekraft i prosent']],
    rows() { const S0 = DATA.utilSample; return S0.data.slice(0, 3).map(r => Object.fromEntries(S0.columns.map((c, j) => [c, typeof r[j] === 'string' ? r[j].trim() : r[j]]))); },
    lead: 'Company',
    used: ['hierarkisk-klynging', 'k-means']
  }
};

const fcell = v => typeof v === 'number' ? (Number.isInteger(v) ? (Math.abs(v) >= 10000 ? fint(v) : String(v)) : String(+v.toFixed(3))) : String(v);
function dataCard(id, o = {}) {
  const D = DATASETS[id], vars = o.vars ? D.vars.filter(v => o.vars.includes(v[0])) : D.vars;
  const cols = (D.lead ? [D.lead] : []).concat(vars.map(v => v[0]));
  const rows = D.rows();
  const card = H('section', { class: 'dcard', 'aria-label': 'Om dataene: ' + D.name, id: o.full ? 'ds-' + id : null },
    H('div', { class: 'eb' }, o.full ? 'Datasett' : 'Om dataene på denne siden'),
    H('h2', {}, D.name),
    H('p', {}, D.what, ' ', H('b', {}, 'Én rad er ' + D.row + '. '), H('b', {}, 'Mål: '), D.goal),
    H('div', { class: 'dvars' }, vars.map(v => H('div', {}, H('code', {}, v[0]), v[2] ? H('span', { class: 'ytag', title: 'Responsvariabelen: den vi vil predikere eller klassifisere' }, 'Y') : null, H('span', {}, v[1])))),
    H('div', { class: 'mini', style: 'margin:10px 0 4px' }, 'Eksempelrader'),
    H('div', { class: 'tblwrap' }, H('table', { class: 'tbl dtbl' }, H('tr', {}, cols.map(c => H('th', { class: typeof rows[0][c] === 'string' ? 'l' : '' }, c))),
      rows.map(r => H('tr', {}, cols.map(c => H('td', { class: typeof r[c] === 'string' ? 'l' : '' }, fcell(r[c]))))))),
    H('p', { class: 'mini', style: 'margin:8px 0 0' }, D.size, D.note ? ' ' + D.note : '', ' ',
      o.full ? null : H('a', { href: '#datasett-' + id }, (o.vars && o.vars.length < D.vars.length ? 'Alle variablene og mer om datasettet' : 'Mer om datasettet') + ' →')));
  if (o.full) card.append(H('div', { class: 'mini', style: 'margin-top:8px' }, 'Brukes på: ', D.used.map((u, i) => [i ? ', ' : '', H('a', { href: '#' + u }, TOPICS[u] ? TOPICS[u].title : u)])),
    D.file ? H('div', { class: 'mini' }, 'I Python: ', H('code', {}, `mlba.load_data('${D.file}')`)) : null);
  return card;
}
function renderDatasets(main, focus) {
  document.title = 'Datasettene · BBAN4001 visuelt';
  main.append(H('nav', { class: 'crumbs', 'aria-label': 'Du er her' }, H('a', { href: '#' }, 'Metodetreet'), ' › Datasettene'),
    H('header', { class: 'thead' }, H('h1', {}, 'Datasettene'),
      H('p', { class: 'lead' }, 'Eksemplene bygger på datasett fra læreboka, Shmueli mfl., som følger med Python-pakken mlba. Du trenger ikke dataene for å bruke siden, men her ser du hva hvert datasett inneholder, hva en rad er, og hva vi prøver å forutsi.'),
      H('p', { class: 'mini' }, 'Noen figurer bruker simulerte eller tenkte data i stedet. Det står da i figurteksten.')));
  for (const id of Object.keys(DATASETS)) main.append(dataCard(id, { full: true }));
  main.append(H('div', { class: 'prose' }, H('h2', {}, 'Last inn et datasett selv'), H('pre', {}, H('code', {}, "import mlba\ncar_df = mlba.load_data('ToyotaCorolla.csv')\ncar_df = car_df.iloc[0:1000]          # de første 1 000 bilene, som i læreboka\nprint(car_df.shape)\ncar_df.head()"))));
  if (focus && DATASETS[focus]) requestAnimationFrame(() => { const el = document.getElementById('ds-' + focus); if (el) el.scrollIntoView({ block: 'start' }); });
}
