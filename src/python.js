/* Les Python-koden: syntaksen og funksjonene som går igjen i faget, med egne eksempler på lærebokas datasett.
   Kodeblokker skrives med PY(String.raw`...`), output med OUT(...). Teksten escapes her, så < og > kan stå som de er.
   Output er ekte: tools-skriptet kjørte eksemplene med pandas 3.0 og scikit-learn 1.9. */
const PYK_ESC = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const PYK_TRIM = s => s.replace(/^\s*\n/, '').replace(/\s+$/, '');
const PY = s => `<pre><code>${PYK_ESC(PYK_TRIM(s))}</code></pre>`;
const OUT = (s, note) => `<pre class="out"${note ? ` data-note="${note}"` : ''}><samp>${PYK_ESC(PYK_TRIM(s))}</samp></pre>`;
const PYNOTE = (title, html) => `<div class="pit"><b>${title}</b>${html}</div>`;
const QA = (q, a) => `<details class="qa"><summary>${q}</summary><div>${a}</div></details>`;

/* Lenker fra temasidene til riktig del av denne siden */
const PY_LINKS = {
  'dataforberedelse': [['endre', 'Endre data med pandas: dummyvariabler, binning og manglende verdier'], ['skaler', 'Skalering og Pipeline']],
  'pca': [['klynger', 'PCA i scikit-learn']],
  'bias-varians': [['cv', 'Kryssvalidering og GridSearchCV']],
  'evaluering-prediksjon': [['mlba', 'regressionSummary og lift chart']],
  'evaluering-klassifikasjon': [['mlba', 'classificationSummary og lift chart'], ['proba', 'predict_proba og annen terskel']],
  'lineaer-regresjon': [['fit', 'fit, predict og koeffisienter']],
  'variabelseleksjon': [['modeller', 'SequentialFeatureSelector og ExhaustiveFeatureSelector']],
  'regularisering': [['modeller', 'Lasso, Ridge, LassoCV og RidgeCV']],
  'logistisk-regresjon': [['proba', 'predict_proba og terskel'], ['modeller', 'LogisticRegression og C']],
  'knn': [['skaler', 'Skalering og Pipeline'], ['cv', 'Velg k med GridSearchCV']],
  'naiv-bayes': [['oppsummere', 'crosstab og pivot_table'], ['modeller', 'MultinomialNB']],
  'beslutningstraer': [['modeller', 'Innstillingene for trær'], ['proba', 'feature_importances_']],
  'ensembler': [['modeller', 'Bagging, random forest og AdaBoost']],
  'shap': [['forklaring', 'SHAP i Python']],
  'konform': [['forklaring', 'Conformal prediction i Python']],
  'nevrale-nett': [['keras', 'Keras og MLPClassifier']],
  'hierarkisk-klynging': [['klynger', 'linkage, fcluster og dendrogram']],
  'k-means': [['klynger', 'KMeans og sentroidene']],
};

const PY_SECTIONS = [
  ['lese', 'Slik leser du kode'], ['syntaks', 'Grunnleggende syntaks'], ['pandas', 'Tabeller med pandas'], ['numpy', 'Arrays'],
  ['sklearn', 'scikit-learn'], ['modeller', 'Modellene'], ['mlba', 'mlba'], ['klynger', 'Klynger og PCA'],
  ['keras', 'Keras'], ['forklaring', 'SHAP og conformal'], ['output', 'Lese output'], ['feller', 'Vanlige feller'], ['test', 'Test deg selv'],
];

const PY_HTML = () => `
<section class="ovsec" id="py-lese">
<h2>Slik leser du en kodeblokk</h2>
<p>Les ovenfra og ned. For hver linje: hva får navnet til venstre for <code>=</code>, og hvilke data brukes til høyre? Nesten all modellkode følger de samme seks stegene. Det er stort sett bare linjen som lager modellen, som bytter navn fra metode til metode:</p>
${PY(String.raw`
# 1. Les inn dataene og se på dem
car_df = mlba.load_data('ToyotaCorolla.csv')
car_df.head()

# 2. Velg forklaringsvariabler og responsvariabel, og lag dummyvariabler
predictors = ['Age_08_04', 'KM', 'HP', 'Fuel_Type']
X = pd.get_dummies(car_df[predictors], drop_first=True)
y = car_df['Price']

# 3. Del i treningsdata (60 %) og valideringsdata (40 %)
train_X, valid_X, train_y, valid_y = train_test_split(X, y, test_size=0.4, random_state=1)

# 4. Lag modellen og tren den på treningsdataene
reg = LinearRegression()
reg.fit(train_X, train_y)

# 5. Prediker for data modellen ikke har sett
pred = reg.predict(valid_X)

# 6. Mål hvor godt den traff
regressionSummary(y_true=valid_y, y_pred=pred)
`)}
<p>Valideringssettet heter ofte <code>valid_X</code> eller <code>holdout_X</code> i koden. Det er det samme. Tre spørsmål avslører de fleste feil:</p>
<ol>
<li><b>Hvilke data får <code>fit</code>?</b> Modellen skal trenes på treningsdata. Får den hele datasettet, sier tallene fra valideringssettet ikke lenger noe ærlig om nye data.</li>
<li><b>Er variablene skalert?</b> k-NN, nevrale nettverk og klyngeanalyse bruker avstander eller vekter og trenger skalerte data. Trær og vanlig lineær regresjon gjør ikke det.</li>
<li><b>Hvilket sett kommer tallene fra?</b> Feilen på treningsdata er nesten alltid lavest. Stor avstand til valideringsfeilen betyr overtilpasning.</li>
</ol>
</section>

<section class="ovsec" id="py-syntaks">
<h2>Grunnleggende syntaks</h2>
<div class="tblwrap"><table class="tbl ovtbl">
<tr><th class="l">Syntaks</th><th class="l">Betyr</th></tr>
<tr><td class="l"><code>x = 5</code></td><td class="l">Lagrer en verdi under navnet <code>x</code>. Ett likhetstegn lagrer, to (<code>==</code>) sammenligner.</td></tr>
<tr><td class="l"><code>import pandas as pd</code><br><code>from sklearn.tree import DecisionTreeClassifier</code></td><td class="l">Henter en pakke under et kortnavn, eller én bestemt funksjon eller klasse fra en pakke. Etterpå skrives <code>pd.read_csv(...)</code> og <code>DecisionTreeClassifier(...)</code>.</td></tr>
<tr><td class="l"><code>f(a, b)</code><br><code>f(X, y, test_size=0.4)</code></td><td class="l">Funksjonskall. Argumenter gis etter plass (<code>X, y</code>) eller med navn (<code>test_size=0.4</code>). Navngitte argumenter kan stå i hvilken som helst rekkefølge.</td></tr>
<tr><td class="l"><code>df.head()</code><br><code>df.shape</code></td><td class="l">Punktum betyr «tilhører». Med parentes er det en metode som gjør noe, uten parentes en egenskap som bare leses.</td></tr>
<tr><td class="l"><code>df.drop(columns=['ID']).head()</code></td><td class="l">Kjeding: resultatet av første metode sendes videre til neste, fra venstre mot høyre.</td></tr>
<tr><td class="l"><code>[1, 2, 3]</code></td><td class="l">Liste. Kan endres.</td></tr>
<tr><td class="l"><code>(861, 5)</code></td><td class="l">Tuppel. Som en liste, men kan ikke endres. <code>.shape</code> gir en tuppel.</td></tr>
<tr><td class="l"><code>{'max_depth': [3, 5], 'cv': 5}</code></td><td class="l">Ordbok (dictionary): nøkkel og verdi. <code>d['max_depth']</code> gir <code>[3, 5]</code>.</td></tr>
<tr><td class="l"><code>a, b = 1, 2</code></td><td class="l">Utpakking: flere navn får hver sin verdi. Slik får <code>train_test_split</code> lagt fire resultater i fire navn.</td></tr>
<tr><td class="l"><code>x[0]</code>, <code>x[-1]</code>, <code>x[1:4]</code>, <code>x[:3]</code></td><td class="l">Indeksering. Python teller fra 0. <code>[-1]</code> er det siste. <code>[1:4]</code> gir plass 1, 2 og 3: sluttpunktet er ikke med.</td></tr>
<tr><td class="l"><code>for k in range(1, 6):</code><br><code>&nbsp;&nbsp;&nbsp;&nbsp;model = ...</code></td><td class="l">Løkke. Det innrykkede gjentas for k = 1, 2, 3, 4, 5. <code>range(1, 6)</code> stopper før 6.</td></tr>
<tr><td class="l"><code>if p > 0.5:</code> … <code>else:</code> …</td><td class="l">Betingelse. Innrykket viser hva som hører til.</td></tr>
<tr><td class="l"><code>[1 if p > 0.5 else 0 for p in probs]</code></td><td class="l">Listebygger (list comprehension): går gjennom <code>probs</code> og lager en ny liste med 1 eller 0 for hvert element.</td></tr>
<tr><td class="l"><code>def logistic(z):</code><br><code>&nbsp;&nbsp;&nbsp;&nbsp;return 1 / (1 + np.exp(-z))</code></td><td class="l">Egen funksjon. <code>lambda x: x / sum(x)</code> er en kort funksjon uten navn.</td></tr>
<tr><td class="l"><code>f'RMSE: {rmse:.2f}'</code></td><td class="l">f-streng: verdien i krøllparentesen settes inn i teksten. <code>:.2f</code> gir to desimaler, <code>:.1%</code> prosent med én desimal, <code>:,</code> tusenskille.</td></tr>
<tr><td class="l"><code># kommentar</code></td><td class="l">Alt etter <code>#</code> på linjen er kommentar og kjøres ikke.</td></tr>
<tr><td class="l"><code>1_000</code>, <code>1e-3</code>, <code>10**5</code></td><td class="l">Tall. Understrek gjør store tall lettere å lese (1 000). <code>1e-3</code> er 0,001. <code>**</code> er potens.</td></tr>
<tr><td class="l"><code>True</code>, <code>False</code>, <code>None</code></td><td class="l">Sann, usann og «ingen verdi».</td></tr>
<tr><td class="l"><code>and</code>, <code>or</code>, <code>not</code><br><code>&amp;</code>, <code>|</code>, <code>~</code></td><td class="l">Og, eller, ikke. De første brukes på enkeltverdier, de siste på hele kolonner i pandas. Med <code>&amp;</code> og <code>|</code> må hver betingelse stå i parentes.</td></tr>
<tr><td class="l"><code>print(x)</code></td><td class="l">Skriver ut. I Jupyter vises også verdien av siste linje i en celle uten <code>print</code>.</td></tr>
</table></div>
${PY(String.raw`
probs = [0.2, 0.7, 0.5, 0.9]
[1 if p > 0.5 else 0 for p in probs]       # 0.5 er ikke over 0.5, så den blir 0
`)}
${OUT(`[0, 1, 0, 1]`)}
${PY(String.raw`
list(range(1, 6))
`)}
${OUT(`[1, 2, 3, 4, 5]`)}
${PY(String.raw`
x = 0.12345
print(f'{x:.2f}  {x:.1%}  {1234567:,}')
`)}
${OUT(`0.12  12.3%  1,234,567`)}
</section>

<section class="ovsec" id="py-pandas">
<h2>Tabeller med pandas</h2>
<p>En <b>DataFrame</b> er en tabell med rader og kolonner. En <b>Series</b> er én kolonne. Radene har en <b>indeks</b>, som er 0, 1, 2 … med mindre noe annet er valgt. Eksemplene bruker lærebokas Toyota-data: 1 436 bruktbiler med pris og egenskaper.</p>
<h3 id="py-se">Se på dataene</h3>
${PY(String.raw`
car_df = mlba.load_data('ToyotaCorolla.csv')
car_df.shape                    # (antall rader, antall kolonner)
`)}
${OUT(`(1436, 39)`)}
${PY(String.raw`
car_df[['Price', 'Age_08_04', 'KM', 'Fuel_Type']].head(3)     # tre første rader av fire kolonner
`)}
${OUT(`   Price  Age_08_04     KM Fuel_Type
0  13500         23  46986    Diesel
1  13750         23  72937    Diesel
2  13950         24  41711    Diesel`)}
${PY(String.raw`
car_df['Fuel_Type'].value_counts()           # antall av hver verdi, størst først
`)}
${OUT(`Fuel_Type
Petrol    1264
Diesel     155
CNG         17
Name: count, dtype: int64`)}
<p>Linjen nederst gir navnet og datatypen til resultatet. <code>value_counts(normalize=True)</code> gir andeler i stedet for antall.</p>
${PY(String.raw`
car_df[['Price', 'Age_08_04', 'KM']].describe().round(1)
`)}
${OUT(`         Price  Age_08_04        KM
count   1436.0     1436.0    1436.0
mean   10730.8       55.9   68533.3
std     3627.0       18.6   37506.4
min     4350.0        1.0       1.0
25%     8450.0       44.0   43000.0
50%     9900.0       61.0   63389.5
75%    11950.0       70.0   87020.8
max    32500.0       80.0  243000.0`)}
<p><code>count</code> er antall verdier som ikke mangler. Er den lavere enn antall rader, mangler det data. 25 %, 50 % og 75 % er kvartilene, og 50 % er medianen. Sammenlign <code>max</code> med 75 % for å se etter utstikkere: KM har 75 % på 87 021 og maks på 243 000.</p>
${PY(String.raw`
car_df[['Price', 'Fuel_Type', 'Automatic']].dtypes
`)}
${OUT(`Price        int64
Fuel_Type      str
Automatic    int64
dtype: object`)}
<p><code>int64</code> er heltall, <code>float64</code> desimaltall og <code>str</code> tekst. Eldre versjoner av pandas skriver <code>object</code> for tekst. <code>bool</code> er sann/usann, og <code>category</code> er en kategorisk variabel.</p>

<h3 id="py-velge">Velge rader og kolonner</h3>
${PY(String.raw`
type(car_df['Price']), type(car_df[['Price']])
`)}
${OUT(`(<class 'pandas.Series'>, <class 'pandas.DataFrame'>)`)}
<p>Én hakeparentes gir en Series, doble gir en DataFrame. Den indre hakeparentesen er en liste med kolonnenavn, så <code>car_df[['Price', 'KM']]</code> gir to kolonner.</p>
${PY(String.raw`
car_df.iloc[0:3, 2:5]         # iloc: etter plass. Rad 0–2, kolonne 2–4 (sluttpunktet er ikke med)
`)}
${OUT(`   Price  Age_08_04  Mfg_Month
0  13500         23         10
1  13750         23         10
2  13950         24          9`)}
${PY(String.raw`
# loc: etter navn eller betingelse. Rader der prisen er over 30 000, to kolonner
car_df.loc[car_df['Price'] > 30000, ['Model', 'Price']]
`)}
${OUT(`                                            Model  Price
109  TOYOTA Corolla VERSO 2.0 D4D SOL (7) BNS MPV  32500
110      TOYOTA Corolla VERSO 2.0 D4D SOL (7) MPV  31000
111      TOYOTA Corolla VERSO 2.0 D4D SOL (7) MPV  31275`)}
<p><code>car_df['Price'] > 30000</code> lager en kolonne med sant og usant, og bare radene med sant blir med. Tallene til venstre (109, 110, 111) er indeksen: radenes opprinnelige nummer.</p>
${PY(String.raw`
# To betingelser: & betyr og, | betyr eller. Hver betingelse i egen parentes
car_df[(car_df['Fuel_Type'] == 'Diesel') & (car_df['Age_08_04'] < 24)].shape
`)}
${OUT(`(25, 39)`)}
<p>25 dieselbiler er yngre enn 24 måneder. Andre måter å velge rader på: <code>df.head(5)</code>, <code>df.sample(10)</code> (tilfeldige rader), <code>df.iloc[:1000]</code> (de første 1 000) og <code>df.loc[80, 'CC']</code> (én celle).</p>

<h3 id="py-endre">Endre data</h3>
${PY(String.raw`
# Eksempler, hver linje for seg
car_df['Age_years'] = car_df['Age_08_04'] / 12                  # ny kolonne regnet ut fra en annen
car_df = car_df.drop(columns=['Id', 'Model'])                     # fjern kolonner
car_df = car_df.rename(columns={'Age_08_04': 'Age'})              # nytt navn: {'gammelt': 'nytt'}
car_df['Fuel_Type'] = car_df['Fuel_Type'].astype('category')      # gjør om til kategorisk
car_df['Met_Color'] = car_df['Met_Color'].map({1: 'Yes', 0: 'No'})   # bytt verdier etter en tabell
car_df = car_df.dropna()                                          # fjern rader som mangler en verdi
car_df['KM'] = car_df['KM'].fillna(car_df['KM'].median())         # eller fyll inn manglende verdier
car_df.loc[80, 'CC'] = 1600                                       # rett én verdi (rad 80, kolonne CC)
`)}
${PYNOTE('Husk å lagre resultatet', `Nesten alle metoder i pandas lager en <i>ny</i> tabell og lar den gamle være. Linjen <code>car_df.drop(columns=['Id'])</code> alene endrer ingenting. Resultatet må lagres: <code>car_df = car_df.drop(...)</code>. Det samme gjelder <code>astype</code>, <code>rename</code>, <code>dropna</code> og <code>fillna</code>. Unntaket er når det står <code>inplace=True</code>.`)}
${PY(String.raw`
X = pd.get_dummies(car_df[['Age_08_04', 'KM', 'Fuel_Type']], drop_first=True)
X.head(3)
`)}
${OUT(`   Age_08_04     KM  Fuel_Type_Diesel  Fuel_Type_Petrol
0         23  46986              True             False
1         23  72937              True             False
2         24  41711              True             False`)}
<p><code>get_dummies</code> lager én 0/1-kolonne per kategori, men bare for tekst- og category-kolonner. Tall blir stående. Fuel_Type har tre verdier (CNG, Diesel, Petrol). Med <code>drop_first=True</code> droppes den første i alfabetet, CNG, som blir referansekategorien: en bil med False i begge kolonnene går på CNG. True og False regnes som 1 og 0.</p>
<p>Uten <code>drop_first</code> blir det tre kolonner. I regresjon gir det multikollinearitet (de tre summerer alltid til 1). For k-NN og klyngeanalyse er det vanlig å beholde alle, så alle kategoriene blir like langt fra hverandre. Vil du lage dummyer av en kolonne med tall, for eksempel ukedag 1–7, må den først gjøres om med <code>astype('category')</code>.</p>
${PY(String.raw`
# Del prisen i tre like brede intervaller (binning)
car_df['Price_cat'] = pd.cut(car_df['Price'], bins=3, labels=['lav', 'middels', 'høy'])
car_df['Price_cat'].value_counts()
`)}
${OUT(`Price_cat
lav        1224
middels     203
høy           9
Name: count, dtype: int64`)}
<p><code>pd.cut</code> lager intervaller som er like brede, så de fleste bilene havner i det laveste. <code>pd.qcut</code> lager intervaller med like mange i hver. Med <code>labels=False</code> blir intervallene nummerert 0, 1, 2 …</p>
<p><b><code>axis</code>:</b> <code>axis=0</code> virker nedover radene (én verdi per kolonne), <code>axis=1</code> bortover kolonnene (én verdi per rad). <code>df.dropna(axis=0)</code> fjerner rader, <code>df.dropna(axis=1)</code> fjerner kolonner som mangler verdier.</p>

<h3 id="py-oppsummere">Oppsummere</h3>
${PY(String.raw`
car_df.groupby('Fuel_Type')['Price'].mean().round(0)      # snittpris per drivstofftype
`)}
${OUT(`Fuel_Type
CNG        9421.0
Diesel    11295.0
Petrol    10679.0
Name: Price, dtype: float64`)}
<p><code>groupby</code> deler radene i grupper etter verdien i en kolonne, regner ut noe for hver gruppe og setter svarene sammen. I klyngeanalyse er <code>df.groupby(memb).mean()</code> sentroidene: snittet av hver variabel i hver klynge.</p>
${PY(String.raw`
pd.crosstab(car_df['Fuel_Type'], car_df['Automatic'])     # antall for hver kombinasjon
`)}
${OUT(`Automatic     0   1
Fuel_Type          
CNG          16   1
Diesel      155   0
Petrol     1185  79`)}
<p>Ingen dieselbiler har automatgir. <code>pd.pivot_table(df, index='Fuel_Type', columns='Automatic', values='Price', aggfunc='mean')</code> gir samme oppsett, men med snittpris i cellene. Med <code>aggfunc=len</code> blir det antall.</p>
${PY(String.raw`
car_df[['Price', 'Age_08_04', 'KM', 'HP']].corr().round(2)   # korrelasjon mellom alle par
`)}
${OUT(`           Price  Age_08_04    KM    HP
Price       1.00      -0.88 -0.57  0.31
Age_08_04  -0.88       1.00  0.51 -0.16
KM         -0.57       0.51  1.00 -0.33
HP          0.31      -0.16 -0.33  1.00`)}
<p>Diagonalen er alltid 1. Pris og alder har korrelasjon −0,88: eldre biler er billigere. Tabellen er symmetrisk, så hvert par står to ganger.</p>
${PY(String.raw`
car_df.sort_values('Price', ascending=False)[['Model', 'Price']].head(3)   # dyreste først
`)}
${OUT(`                                            Model  Price
109  TOYOTA Corolla VERSO 2.0 D4D SOL (7) BNS MPV  32500
111      TOYOTA Corolla VERSO 2.0 D4D SOL (7) MPV  31275
110      TOYOTA Corolla VERSO 2.0 D4D SOL (7) MPV  31000`)}
</section>

<section class="ovsec" id="py-numpy">
<h2>Arrays fra numpy</h2>
<p>scikit-learn returnerer ofte numpy-arrays i stedet for tabeller. De skrives ut som <code>array([...])</code> og har ingen kolonnenavn.</p>
${PY(String.raw`
a = np.array([[0.9, 0.1], [0.3, 0.7], [0.6, 0.4]])
print(a.shape)       # (rader, kolonner)
print(a[:, 1])       # alle rader, kolonne 1
print(a[0])          # rad 0
`)}
${OUT(`(3, 2)
[0.1 0.7 0.4]
[0.9 0.1]`)}
<p><code>[:, 1]</code> leses «alle rader, kolonne 1». Det er slik propensiteten hentes ut av <code>predict_proba</code>. Ellers brukes <code>np.mean</code>, <code>np.sqrt</code>, <code>np.exp</code> og <code>np.log</code> til utregninger, <code>np.argsort</code> gir rekkefølgen som sorterer en array, og <code>np.random.default_rng(1)</code> lager tilfeldige tall.</p>
</section>

<section class="ovsec" id="py-sklearn">
<h2>Mønsteret i scikit-learn</h2>
<p>Alle modellene i scikit-learn brukes på samme måte:</p>
<ol>
<li><b>Lag modellen</b> og velg hyperparametere: <code>tree = DecisionTreeClassifier(max_depth=3)</code>. Ingenting er lært ennå.</li>
<li><b>Tren</b> med <code>tree.fit(train_X, train_y)</code>. Nå lærer modellen parameterne fra dataene.</li>
<li><b>Bruk</b> modellen med <code>tree.predict(...)</code> og <code>tree.predict_proba(...)</code>.</li>
<li><b>Les av</b> det modellen har lært. Slike attributter slutter alltid med understrek: <code>coef_</code>, <code>intercept_</code>, <code>feature_importances_</code>, <code>best_params_</code>.</li>
</ol>
<h3 id="py-split">Dele dataene</h3>
${PY(String.raw`
predictors = ['Age_08_04', 'KM', 'HP', 'Fuel_Type']
X = pd.get_dummies(car_df[predictors], drop_first=True)
y = car_df['Price']
train_X, valid_X, train_y, valid_y = train_test_split(X, y, test_size=0.4, random_state=1)
train_X.shape, valid_X.shape
`)}
${OUT(`((861, 5), (575, 5))`)}
<ul>
<li>Rekkefølgen ut er alltid X-trening, X-validering, y-trening, y-validering.</li>
<li><code>test_size=0.4</code> gir 40 % til validering og 60 % til trening: 575 og 861 av 1 436 biler.</li>
<li><code>random_state=1</code> gjør at delingen blir lik hver gang. Et annet tall gir en annen tilfeldig deling og litt andre resultater.</li>
<li>Fem kolonner: tre tallvariabler og to dummyer for Fuel_Type.</li>
<li>For klassifikasjon med skjev fordeling brukes ofte <code>stratify=y</code>, så andelen i hver klasse blir lik i begge settene.</li>
</ul>
<h3 id="py-fit">Trene, lese av og predikere</h3>
${PY(String.raw`
reg = LinearRegression()
reg.fit(train_X, train_y)
print('intercept', reg.intercept_)
print(pd.DataFrame({'Predictor': X.columns, 'coefficient': reg.coef_}))
`)}
${OUT(`intercept 12904.615933237632
          Predictor  coefficient
0         Age_08_04  -140.041052
1                KM    -0.020025
2                HP    61.403541
3  Fuel_Type_Diesel  2844.675206
4  Fuel_Type_Petrol   551.987546`)}
<p><code>pd.DataFrame({...})</code> setter kolonnenavnene og koeffisientene ved siden av hverandre, så de blir lette å lese. En måned eldre bil er 140 euro billigere, og diesel er 2 845 euro dyrere enn CNG, når de andre variablene holdes like.</p>
${PY(String.raw`
reg.predict(valid_X[:3])          # prediksjon for de tre første bilene i valideringssettet
`)}
${OUT(`array([11895.50133536, 11190.80035615, 14443.21843628])`)}
<p>For en ny bil lages en tabell med <i>de samme kolonnene i samme rekkefølge</i> som <code>train_X</code>, for eksempel <code>pd.DataFrame([{'Age_08_04': 40, 'KM': 60000, 'HP': 110, 'Fuel_Type_Diesel': False, 'Fuel_Type_Petrol': True}])</code>, og den sendes til <code>predict</code>.</p>

<h3 id="py-proba">Klasser, sannsynligheter og terskel</h3>
<p>Universal Bank: 5 000 kunder, og 480 tok imot et lånetilbud.</p>
${PY(String.raw`
bank_df = mlba.load_data('UniversalBank.csv')
bank_df = bank_df.drop(columns=['ID', 'ZIP Code'])
X = bank_df.drop(columns=['Personal Loan'])       # alt unntatt responsvariabelen
y = bank_df['Personal Loan']
train_X, valid_X, train_y, valid_y = train_test_split(X, y, test_size=0.4, random_state=1)

tree = DecisionTreeClassifier(max_depth=3, random_state=1)
tree.fit(train_X, train_y)
tree.predict(valid_X.iloc[24:28])         # klasse for fire kunder
`)}
${OUT(`array([0, 0, 0, 1])`)}
${PY(String.raw`
tree.predict_proba(valid_X.iloc[24:28]).round(3)
`)}
${OUT(`array([[0.823, 0.177],
       [1.   , 0.   ],
       [1.   , 0.   ],
       [0.   , 1.   ]])`)}
${PY(String.raw`
tree.classes_             # rekkefølgen på kolonnene i predict_proba
`)}
${OUT(`array([0, 1])`)}
<ul>
<li><code>predict_proba</code> gir én kolonne per klasse, i rekkefølgen i <code>classes_</code>. Kolonne 1 er sannsynligheten for klasse 1, altså propensiteten. Hver rad summerer til 1.</li>
<li><code>predict</code> velger klassen med høyest sannsynlighet. Med to klasser er det det samme som terskel 0,5. Første kunde har 0,177 og blir 0, siste har 1,0 og blir 1.</li>
<li>Et tre gir sannsynligheten som andelen klasse 1 i terminalnoden kunden havner i. Derfor går de samme tallene igjen.</li>
</ul>
${PY(String.raw`
prob = tree.predict_proba(valid_X)[:, 1]         # propensiteten for alle i valideringssettet
pred_03 = (prob > 0.3).astype(int)               # terskel 0,3: True/False blir 1/0
classificationSummary(y_true=valid_y, y_pred=pred_03)
`)}
${OUT(`Confusion Matrix (Accuracy 0.9790)

       Prediction
Actual    0    1
     0 1789   18
     1   24  169`)}
<p>Med terskel 0,5 fant treet 158 av 193 som tok lånet (se <a href="#python-mlba">mlba</a> under). Med terskel 0,3 finner det 169, men 18 i stedet for 5 blir feilaktig spådd å ta lånet. Lavere terskel gir høyere dekning og lavere spesifisitet.</p>
${PY(String.raw`
importance = pd.Series(tree.feature_importances_, index=train_X.columns)
importance.sort_values(ascending=False).head(4).round(3)
`)}
${OUT(`Income       0.396
Education    0.392
Family       0.164
CCAvg        0.032
dtype: float64`)}
<p>Feature importance summerer til 1. Inntekt og utdanning står for nesten 80 % av hvor mye splittene i treet reduserte impurity.</p>

<h3 id="py-skaler">Skalering og Pipeline</h3>
${PY(String.raw`
scaler = StandardScaler()
scaler.fit(train_X)                          # lærer snitt og standardavvik fra treningsdataene
train_X_z = scaler.transform(train_X)        # z-score med treningens tall
valid_X_z = scaler.transform(valid_X)        # samme tall brukes på valideringsdataene
# fit_transform(train_X) gjør fit og transform i én linje
`)}
<p>Snitt og standardavvik skal komme fra treningsdataene, også når valideringsdata og nye observasjoner skaleres. <code>MinMaxScaler()</code> skalerer til [0, 1] på samme måte og brukes mye før nevrale nettverk. En <code>Pipeline</code> kjeder skalering og modell, så det ikke kan gå galt:</p>
${PY(String.raw`
knn = Pipeline([
    ('scaler', StandardScaler()),                       # steg 1, med navnet 'scaler'
    ('knn', KNeighborsClassifier(n_neighbors=5)),       # steg 2, med navnet 'knn'
])
knn.fit(train_X, train_y)                # skalerer med treningens tall, så trener k-NN
knn['scaler'].mean_[:3].round(2)         # hent et steg med navnet: snittet av de tre første kolonnene
`)}
${OUT(`array([45.58, 20.34, 73.76])`)}
<p><code>knn.predict(valid_X)</code> skalerer valideringsdataene med de samme tallene før naboene letes opp. Et argument inne i et steg endres med stegnavnet, to understreker og argumentnavnet: <code>knn.set_params(knn__n_neighbors=3)</code>.</p>

<h3 id="py-cv">Kryssvalidering og søk etter hyperparametere</h3>
${PY(String.raw`
scores = cross_val_score(knn, train_X, train_y, cv=5, scoring='accuracy')   # 5-fold kryssvalidering
print(scores.round(3))           # én nøyaktighet per fold
print(scores.mean().round(3))    # snittet er anslaget
`)}
${OUT(`[0.96  0.95  0.955 0.962 0.965]
0.958`)}
${PY(String.raw`
grid = GridSearchCV(knn, {'knn__n_neighbors': [1, 3, 5, 7, 9]}, cv=5, scoring='accuracy')
grid.fit(train_X, train_y)        # 5 verdier av k, hver med 5-fold CV: 25 modeller
print(grid.best_params_)
print(round(grid.best_score_, 3))
`)}
${OUT(`{'knn__n_neighbors': 3}
0.96`)}
<ul>
<li><code>best_params_</code> er den beste kombinasjonen, <code>best_score_</code> snittscoren i kryssvalideringen for den, og <code>best_estimator_</code> modellen med de beste innstillingene trent på alle treningsdataene.</li>
<li>Med flere hyperparametere prøver <code>GridSearchCV</code> alle kombinasjoner: 4 verdier av én og 5 av en annen gir 20 kombinasjoner. <code>RandomizedSearchCV(..., n_iter=50)</code> prøver 50 tilfeldige.</li>
<li><code>cross_validate</code> gjør det samme som <code>cross_val_score</code>, men gir en ordbok med flere mål og tidsbruk: <code>scores['test_score']</code>.</li>
<li><code>cv=5</code> gir 5 folder. <code>KFold(n_splits=5, shuffle=True, random_state=1)</code> gjør det samme med stokking.</li>
</ul>
${PY(String.raw`
# For prediksjon: feilmål oppgis som negative tall
scores = cross_val_score(reg, train_X, train_y, cv=5, scoring='neg_root_mean_squared_error')
scores
`)}
${OUT(`array([-1376.52504902, -1867.48030847, -1412.89113597, -1643.37698659,
       -1252.95138791])`, 'med Toyota-modellen over')}
<p>scikit-learn maksimerer alltid scoren, så feil som RMSE gis med minus foran: høyest (nærmest 0) er best. RMSE i kryssvalideringen er altså snittet av 1 377, 1 867, 1 413, 1 643 og 1 253 euro. Derfor står det ofte <code>-scores.mean()</code> eller <code>-grid.best_score_</code> i koden.</p>
</section>

<section class="ovsec" id="py-modeller">
<h2>Modellene og argumentene deres</h2>
<p>Argumentene i parentesen er hyperparametere: valg du gjør før treningen. Attributtene med understrek er det modellen har lært.</p>
<div class="tblwrap"><table class="tbl ovtbl">
<tr><th class="l">Modell</th><th class="l">Viktigste argumenter</th><th class="l">Nyttige attributter</th></tr>
<tr><td class="l"><code>LinearRegression()</code></td><td class="l">Ingen å velge.</td><td class="l"><code>coef_</code>, <code>intercept_</code></td></tr>
<tr><td class="l"><code>Lasso(alpha=1)</code>, <code>Ridge(alpha=1)</code></td><td class="l"><code>alpha</code> er straffen λ. Større alpha gir mindre koeffisienter. Lasso kan sette dem til 0.</td><td class="l"><code>coef_</code></td></tr>
<tr><td class="l"><code>LassoCV(cv=5)</code>, <code>RidgeCV(alphas=[...])</code></td><td class="l">Velger alpha selv med kryssvalidering blant verdiene i <code>alphas</code>.</td><td class="l"><code>alpha_</code> (valgt straff), <code>coef_</code></td></tr>
<tr><td class="l"><code>LogisticRegression(C=1.0, penalty='l2', solver='liblinear', max_iter=1000)</code></td><td class="l">scikit-learn straffer koeffisientene som standard. <code>C</code> er 1/straff: stor C (for eksempel <code>1e42</code> eller <code>np.inf</code>) eller <code>penalty=None</code> gir vanlig logistisk regresjon. Nyere versjoner gir en FutureWarning for <code>penalty</code>, men koden virker.</td><td class="l"><code>coef_[0]</code>, <code>intercept_[0]</code> (lagret som arrays, derfor <code>[0]</code>), <code>classes_</code></td></tr>
<tr><td class="l"><code>KNeighborsClassifier(n_neighbors=5)</code>, <code>KNeighborsRegressor</code></td><td class="l"><code>n_neighbors</code> er k. <code>weights='distance'</code> gir nærmere naboer mer vekt.</td><td class="l"><code>kneighbors(X)</code> gir avstand til og radnummer for naboene</td></tr>
<tr><td class="l"><code>MultinomialNB(alpha=1)</code>, <code>GaussianNB()</code></td><td class="l">Naiv Bayes. <code>alpha</code> er Laplace-glatting, så ingen sannsynlighet blir 0. Gaussian er for numeriske variabler.</td><td class="l"><code>predict_proba</code></td></tr>
<tr><td class="l"><code>DecisionTreeClassifier(max_depth=5, min_samples_split=20, min_samples_leaf=10, min_impurity_decrease=0.001, random_state=1)</code>, <code>DecisionTreeRegressor</code></td><td class="l"><code>max_depth</code>: maks antall nivåer. <code>min_samples_split</code>: en node må ha minst så mange observasjoner for å deles. <code>min_samples_leaf</code>: minst så mange i hver terminalnode. <code>min_impurity_decrease</code>: en splitt må redusere impurity minst så mye. Uten noen av dem vokser treet til alle terminalnodene er rene.</td><td class="l"><code>feature_importances_</code>, <code>get_n_leaves()</code>, <code>get_depth()</code></td></tr>
<tr><td class="l"><code>RandomForestClassifier(n_estimators=500, max_features='sqrt')</code>, <code>RandomForestRegressor</code></td><td class="l"><code>n_estimators</code>: antall trær. <code>max_features</code>: hvor mange variabler som trekkes ved hver splitt.</td><td class="l"><code>feature_importances_</code>, <code>estimators_</code> (trærne)</td></tr>
<tr><td class="l"><code>BaggingClassifier(estimator, n_estimators=100, max_samples=0.8)</code></td><td class="l">Bagging: hvert tre trenes på et bootstrap-utvalg. <code>max_samples=0.8</code> gir 80 % av radene, <code>max_features</code> en andel av kolonnene.</td><td class="l"><code>estimators_</code></td></tr>
<tr><td class="l"><code>AdaBoostClassifier(estimator, n_estimators=100, learning_rate=1.0)</code></td><td class="l">Boosting: trærne trenes etter hverandre. Lavere <code>learning_rate</code> gjør hvert tre mindre viktig.</td><td class="l"><code>estimator_weights_</code></td></tr>
<tr><td class="l"><code>MLPClassifier(hidden_layer_sizes=(5,), activation='logistic', solver='lbfgs', max_iter=1000)</code>, <code>MLPRegressor</code></td><td class="l">Nevralt nettverk. <code>(5,)</code> er ett skjult lag med 5 nevroner, <code>(10, 5)</code> to lag med 10 og 5. <code>logistic</code> er sigmoid, <code>relu</code> er ReLU. <code>solver</code> er metoden som finner vektene, og <code>max_iter</code> antall runder den får.</td><td class="l"><code>coefs_</code> (vektene), <code>intercepts_</code> (bias), <code>n_iter_</code></td></tr>
<tr><td class="l"><code>KMeans(n_clusters=4, n_init=10, random_state=0)</code></td><td class="l"><code>n_clusters</code> er k. <code>n_init</code> er antall starter med ulike tilfeldige sentroider; den beste beholdes.</td><td class="l"><code>labels_</code>, <code>cluster_centers_</code>, <code>inertia_</code></td></tr>
<tr><td class="l"><code>PCA(n_components=3)</code></td><td class="l">Antall prinsipalkomponenter som beholdes.</td><td class="l"><code>explained_variance_ratio_</code>, <code>components_</code></td></tr>
<tr><td class="l"><code>linkage(X, method='complete', metric='euclidean')</code></td><td class="l">Hierarkisk klyngeanalyse (pakken scipy). <code>method</code> er <code>single</code>, <code>complete</code>, <code>average</code>, <code>centroid</code> eller <code>ward</code>.</td><td class="l">Resultatet brukes i <code>dendrogram(Z)</code> og <code>fcluster(Z, ...)</code></td></tr>
<tr><td class="l"><code>SequentialFeatureSelector(model, k_features=(1, 10), forward=True, floating=False, scoring=..., cv=5)</code></td><td class="l">Variabelvalg (pakken mlxtend). <code>forward=True</code> er forward selection, <code>False</code> backward elimination. <code>floating=True</code> gjør det stepwise: variabler kan både legges til og fjernes.</td><td class="l"><code>k_feature_names_</code>, <code>k_score_</code>, <code>subsets_</code></td></tr>
<tr><td class="l"><code>ExhaustiveFeatureSelector(model, min_features=1, max_features=10, scoring=..., cv=5)</code></td><td class="l">Exhaustive search: prøver alle kombinasjoner av variabler.</td><td class="l"><code>best_feature_names_</code>, <code>best_score_</code></td></tr>
</table></div>
<p><code>random_state</code> finnes på alle modeller med tilfeldighet i seg (trær, skoger, nevrale nettverk, k-means). Det gjør at resultatet blir likt hver gang koden kjøres. <code>n_jobs=-1</code> betyr «bruk alle prosessorkjernene» og endrer ikke resultatet.</p>
</section>

<section class="ovsec" id="py-mlba">
<h2>Hjelpefunksjonene fra mlba</h2>
<p>Pakken <code>mlba</code> følger med læreboka. I versjon 2 må argumentene gis med navn: <code>y_true=</code> og <code>y_pred=</code>.</p>
${PY(String.raw`
classificationSummary(y_true=valid_y, y_pred=tree.predict(valid_X))      # treet fra Universal Bank
`)}
${OUT(`Confusion Matrix (Accuracy 0.9800)

       Prediction
Actual    0    1
     0 1802    5
     1   35  158`)}
<p>Radene er faktisk klasse og kolonnene predikert klasse. TN = 1 802, FP = 5, FN = 35 og TP = 158. Nøyaktighet = (1 802 + 158) / 2 000 = 0,98. Dekning = 158 / (35 + 158) = 0,82. Spesifisitet = 1 802 / (1 802 + 5) = 0,997. Naiv benchmark (alle får nei) gir 1 807 / 2 000 = 0,90.</p>
${PY(String.raw`
regressionSummary(y_true=valid_y, y_pred=reg.predict(valid_X))           # Toyota-regresjonen
`)}
${OUT(`
Regression statistics

Mean Error (ME) : 19.9363
Root Mean Squared Error (RMSE) : 1466.6555
Mean Absolute Error (MAE) : 1131.4152
Mean Percentage Error (MPE) : -1.0267
Mean Absolute Percentage Error (MAPE) : 11.4033`)}
<ul>
<li>Alle målene bygger på feilen e = faktisk − predikert.</li>
<li><b>ME</b> er snittet av feilene. Nær 0 betyr at modellen ikke bommer systematisk. Positiv ME betyr at den i snitt predikerer for lavt.</li>
<li><b>RMSE</b> og <b>MAE</b> er typisk feil i samme enhet som Y, her euro. RMSE straffer store bom hardere, så den er alltid minst like stor som MAE.</li>
<li><b>MPE</b> og <b>MAPE</b> er det samme i prosent av faktisk verdi. MAPE 11,4 betyr at prediksjonen i snitt bommer med 11 %.</li>
<li><code>mlba.regressionMetrics</code> og <code>mlba.classificationMetrics</code> regner ut de samme tallene, men returnerer dem så de kan settes i en tabell i stedet for å skrives ut.</li>
</ul>
${PY(String.raw`
result = pd.DataFrame({'actual': valid_y, 'prob': tree.predict_proba(valid_X)[:, 1]})
gainsChart(result, ranking='prob', actual='actual')     # lift chart: kumulativt antall 1-ere
liftChart(result, ranking='prob', actual='actual')      # decile chart: lift for hver tidel
`)}
<p>Begge sorterer radene etter <code>ranking</code>-kolonnen, med høyest propensitet først. <code>gainsChart</code> tegner lift chart: hvor mange av klasse 1 vi har funnet når vi har gått gjennom en gitt andel av listen. <code>liftChart</code> tegner decile chart: for hver tidel, andelen klasse 1 delt på andelen i hele datasettet. Navnet er forvirrende, men <code>liftChart</code> tegner altså stolpediagrammet. For prediksjon brukes <code>gainsChart(..., type='regression')</code>, og da er det summen av Y som akkumuleres.</p>
<p>Andre funksjoner: <code>mlba.load_data('Fil.csv')</code> leser et av lærebokas datasett, <code>mlba.AIC_score</code> og <code>mlba.BIC_score</code> gir AIC og BIC, og <code>mlba.plotDecisionTree</code> tegner et tre.</p>
</section>

<section class="ovsec" id="py-klynger">
<h2>Klyngeanalyse og PCA</h2>
<p>Lærebokas Utilities-data: 22 kraftselskaper med 8 numeriske variabler. Selskapsnavnet gjøres til indeks, så det ikke er med i avstandene.</p>
${PY(String.raw`
util_df = mlba.load_data('Utilities.csv').set_index('Company')     # navnet blir radnavn
util_norm = (util_df - util_df.mean()) / util_df.std()             # z-score for hver kolonne
Z = linkage(util_norm, method='average', metric='euclidean')       # alle sammenslåingene
memb = fcluster(Z, 4, criterion='maxclust')                         # kutt slik at det blir 4 klynger
memb
`)}
${OUT(`array([3, 3, 3, 3, 4, 3, 2, 1, 3, 3, 1, 2, 3, 3, 2, 1, 2, 3, 3, 3, 2, 3],
      dtype=int32)`)}
<p><code>memb</code> har ett klyngenummer per selskap, i samme rekkefølge som radene, og nummereringen starter på 1. <code>dendrogram(Z, labels=util_norm.index)</code> tegner treet. <code>fcluster(Z, 3.5, criterion='distance')</code> kutter i høyde 3,5 i stedet for ved et bestemt antall klynger.</p>
${PY(String.raw`
km = KMeans(n_clusters=4, random_state=0, n_init=10).fit(util_norm)
print(km.labels_)                 # klyngenummer per selskap, fra 0
print(round(km.inertia_, 2))      # sum av kvadrerte avstander til egen sentroide
`)}
${OUT(`[3 2 3 2 2 3 1 0 3 2 0 1 2 3 1 0 1 3 3 2 1 2]
80.65`)}
<p>Klyngenumrene er bare etiketter. Klynge 0 i k-means svarer ikke til klynge 1 i den hierarkiske, og et annet <code>random_state</code> kan bytte om numrene. <code>inertia_</code> blir lavere jo flere klynger; i et albueplot ser vi etter knekken.</p>
${PY(String.raw`
util_df.groupby(km.labels_)[['Sales', 'Fuel_Cost', 'Nuclear']].mean().round(1)   # sentroider i vanlige enheter
`)}
${OUT(`     Sales  Fuel_Cost  Nuclear
0  15504.7        0.6      0.0
1   6525.6        1.8      1.8
2   6546.4        1.1     33.2
3  10163.1        0.9      3.2`)}
<p>Slik beskrives klyngene: klynge 0 selger mest, klynge 2 har mye kjernekraft. <code>km.cluster_centers_</code> gir de samme sentroidene, men i z-score.</p>
${PY(String.raw`
pca = PCA(n_components=3)
scores = pca.fit_transform(util_norm)          # verdien på hver komponent for hvert selskap
print(scores.shape)
print(pca.explained_variance_ratio_.round(3))  # andel av variansen per komponent
`)}
${OUT(`(22, 3)
[0.272 0.238 0.165]`)}
${PY(String.raw`
# components_ har én rad per komponent; .T snur den så variablene blir rader
pd.DataFrame(pca.components_.T, index=util_norm.columns, columns=['PC1', 'PC2', 'PC3']).round(2).head(4)
`)}
${OUT(`               PC1   PC2   PC3
Fixed_charge  0.45 -0.23  0.07
RoR           0.57 -0.10  0.07
Cost         -0.35  0.16  0.47
Load_factor  -0.29 -0.41 -0.14`)}
<p>De tre første komponentene forklarer 27,2 + 23,8 + 16,5 = 67,5 % av variansen. Tallene i den siste tabellen er ladningene: hvor mye hver variabel teller i komponenten. Store tall med samme fortegn betyr variabler som trekker i samme retning. PCA skal gjøres på standardiserte data, ellers dominerer variabelen med størst tall.</p>
</section>

<section class="ovsec" id="py-keras">
<h2>Nevrale nettverk i Keras</h2>
<p>Et lite nettverk for to klasser med 8 forklaringsvariabler:</p>
${PY(String.raw`
import keras
from keras import layers

model = keras.Sequential([
    keras.Input(shape=(8,)),                    # 8 forklaringsvariabler inn
    layers.Dense(16, activation='relu'),        # skjult lag med 16 nevroner
    layers.Dropout(0.3),                        # slår av 30 % av nevronene tilfeldig under trening
    layers.Dense(1, activation='sigmoid'),      # output: sannsynlighet for klasse 1
])
model.compile(optimizer=keras.optimizers.Adam(learning_rate=0.001),
              loss='binary_crossentropy',       # cost-funksjonen
              metrics=['accuracy'])
model.summary()                                 # lagene og antall parametere
history = model.fit(train_X, train_y, epochs=20, batch_size=32, validation_split=0.2)
prob = model.predict(valid_X)
`)}
<ul>
<li><b>Antall parametere</b> i et Dense-lag er (antall inn + 1) · antall nevroner, der +1 er biasen. Her: (8 + 1) · 16 = 144 og (16 + 1) · 1 = 17, til sammen 161. Dropout har ingen parametere.</li>
<li><b>Output-laget</b> avgjør hva nettverket predikerer: 1 nevron med sigmoid for to klasser, k nevroner med softmax for k klasser, og 1 nevron uten aktivering for et tall.</li>
<li><b>loss</b> er cost-funksjonen: <code>binary_crossentropy</code> for to klasser, <code>categorical_crossentropy</code> for flere klasser når fasiten er one-hot-kodet, <code>sparse_categorical_crossentropy</code> når fasiten er heltall (0, 1, 2 …), og <code>mse</code> for tall.</li>
<li><b>epochs=20</b>: hele treningssettet brukes 20 ganger. <b>batch_size=32</b>: vektene oppdateres etter hver bunke på 32 observasjoner, altså n/32 ganger per epoch. <b>validation_split=0.2</b>: 20 % av treningsdataene holdes av for å følge valideringsfeilen underveis.</li>
<li><b>learning_rate</b> er skrittlengden i gradient descent.</li>
</ul>
<p>Mange modeller skrives i stedet lag for lag med navnet <code>x</code>: <code>inputs = keras.Input(...)</code>, så <code>x = layers.Dense(64, activation='relu')(inputs)</code>, <code>outputs = layers.Dense(5, activation='softmax')(x)</code> og til slutt <code>model = keras.Model(inputs, outputs)</code>. Parentesen bak laget, <code>(x)</code>, betyr «send x gjennom dette laget». Ved transfer learning hentes en ferdig trent modell (for eksempel med <code>include_top=False</code>, uten de gamle output-lagene), og <code>base.trainable = False</code> fryser vektene, så bare de nye lagene trenes.</p>
<p>I scikit-learn gjør <code>MLPClassifier</code> og <code>MLPRegressor</code> det samme med færre valg (se tabellen over modellene). Der må X skaleres først, gjerne med <code>MinMaxScaler</code> i en Pipeline.</p>
</section>

<section class="ovsec" id="py-forklaring">
<h2>SHAP og conformal prediction</h2>
${PY(String.raw`
explainer = shap.Explainer(model.predict, train_X.sample(100, random_state=1))   # modell og bakgrunnsdata
shap_values = explainer(valid_X)          # én SHAP-verdi per observasjon og variabel
shap_values.shape                         # (antall observasjoner, antall variabler)

shap.plots.waterfall(shap_values[0])      # lokal forklaring av observasjon 0
shap.plots.beeswarm(shap_values)          # global: alle observasjonene, alle variablene
shap.plots.bar(shap_values)               # global: snittet av |SHAP| per variabel
shap.plots.scatter(shap_values[:, 'KM'])  # én variabel: verdi mot SHAP-verdi
`)}
<ul>
<li>Med <code>model.predict</code> og bakgrunnsdata virker SHAP på alle modeller. For trær kan modellen gis direkte (<code>shap.Explainer(rf_model)</code>), og da går det mye raskere.</li>
<li><code>shap_values[0]</code> er rad 0, <code>shap_values[:, 'KM']</code> er kolonnen KM: samme logikk som indeksering i numpy.</li>
<li><code>shap_values[0].base_values</code> er snittprediksjonen E[f(X)]. Snittet pluss summen av <code>shap_values[0].values</code> er lik modellens prediksjon for observasjon 0.</li>
</ul>
${PY(String.raw`
from mapie.regression import SplitConformalRegressor

model.fit(X_train, y_train)                             # 1. tren på treningsdata
cp = SplitConformalRegressor(estimator=model, confidence_level=0.90, prefit=True)
cp.conformalize(X_cal, y_cal)                           # 2. mål feilene på kalibreringsdata
y_pred, y_int = cp.predict_interval(X_test)             # 3. prediksjon og intervall for nye data
lower, upper = y_int[:, 0, 0], y_int[:, 1, 0]           # [alle rader, nedre/øvre, første nivå]
coverage = ((y_test >= lower) & (y_test <= upper)).mean()   # andel innenfor intervallet
`)}
<ul>
<li>Dataene deles i tre: trening, kalibrering og test. Kalibreringen må gjøres på data modellen ikke er trent på.</li>
<li><code>prefit=True</code> betyr at modellen allerede er trent.</li>
<li><code>y_int</code> har tre dimensjoner: rad, nedre eller øvre grense, og hvilket konfidensnivå. Gis flere nivåer, for eksempel <code>confidence_level=[0.8, 0.9]</code>, er det siste tallet 0 for 80 % og 1 for 90 %.</li>
<li><code>(y_test >= lower) & (y_test <= upper)</code> gir sant der den faktiske verdien er innenfor. Snittet av sant/usant er andelen sant, altså coverage.</li>
</ul>
</section>

<section class="ovsec" id="py-output">
<h2>Lese output</h2>
<div class="tblwrap"><table class="tbl ovtbl">
<tr><th class="l">Ser du</th><th class="l">Betyr det</th></tr>
<tr><td class="l"><code>(1436, 39)</code></td><td class="l">En tuppel, ofte fra <code>.shape</code>: 1 436 rader og 39 kolonner.</td></tr>
<tr><td class="l"><code>array([0, 1, 1, 0])</code></td><td class="l">En numpy-array, for eksempel fra <code>predict</code>. Ingen kolonnenavn.</td></tr>
<tr><td class="l"><code>array([[0.82, 0.18], [1. , 0. ]])</code></td><td class="l">En array med rader og kolonner, for eksempel fra <code>predict_proba</code>. <code>1.</code> betyr 1,0.</td></tr>
<tr><td class="l"><code>Name: count, dtype: int64</code></td><td class="l">Under en Series: navnet og datatypen.</td></tr>
<tr><td class="l"><code>NaN</code>, <code>&lt;NA&gt;</code>, <code>None</code></td><td class="l">Verdien mangler.</td></tr>
<tr><td class="l"><code>1.2e-05</code>, <code>3.4e+04</code></td><td class="l">Vitenskapelig notasjon: 0,000012 og 34 000.</td></tr>
<tr><td class="l"><code>-5.247542e-16</code></td><td class="l">Praktisk talt 0. Avrundingsfeil i datamaskinen.</td></tr>
<tr><td class="l"><code>...</code> midt i en tabell, eller <code>[1436 rows x 39 columns]</code></td><td class="l">pandas viser ikke alle radene eller kolonnene.</td></tr>
<tr><td class="l"><code>True</code> / <code>False</code> i en dummykolonne</td><td class="l">1 og 0.</td></tr>
<tr><td class="l">Negative tall fra <code>cross_val_score</code></td><td class="l">Et feilmål med <code>neg_</code> i navnet. Fjern minus.</td></tr>
<tr><td class="l"><code>FutureWarning</code>, <code>UserWarning</code></td><td class="l">En advarsel, ikke en feil. Koden kjørte.</td></tr>
<tr><td class="l"><code>ConvergenceWarning</code></td><td class="l">Optimeringen nådde <code>max_iter</code> før den var ferdig. Modellen finnes, men kan være dårligere enn den kunne vært.</td></tr>
<tr><td class="l"><code>KeyError: 'Pris'</code></td><td class="l">En feil: kolonnen eller nøkkelen finnes ikke. Koden stoppet.</td></tr>
<tr><td class="l"><code>&lt;Axes: ...&gt;</code></td><td class="l">Et plottobjekt fra matplotlib. Selve plottet vises under.</td></tr>
</table></div>
</section>

<section class="ovsec" id="py-feller">
<h2>Vanlige feller</h2>
<ol>
<li><b>Resultatet lagres ikke.</b> <code>df.drop(columns=['ID'])</code> eller <code>df['x'].astype('category')</code> alene endrer ingenting.</li>
<li><b>Modellen trenes på hele datasettet.</b> Da er valideringstallene for optimistiske, fordi modellen har sett dataene.</li>
<li><b>Skaleringen tilpasses feil data.</b> <code>fit</code> og <code>fit_transform</code> skal bare brukes på treningsdataene. <code>scaler.fit_transform(valid_X)</code> regner ut nytt snitt og standardavvik fra valideringsdataene.</li>
<li><b>Hyperparametere velges på valideringssettet.</b> Da er valideringsfeilen ikke lenger et ærlig anslag. Velg med kryssvalidering på treningsdata, og bruk valideringssettet til slutt.</li>
<li><b>predict bruker terskel 0,5.</b> Vil du ha en annen terskel, må du gå via <code>predict_proba</code>.</li>
<li><b>Feil kolonne fra predict_proba.</b> Kolonnene følger <code>classes_</code>. Er klassene tekst, for eksempel <code>['delayed', 'ontime']</code>, står de alfabetisk.</li>
<li><b>Ikke skalert før avstander.</b> Uten skalering bestemmer variabelen med størst tall avstanden i k-NN og klyngeanalyse.</li>
<li><b>Nye data med andre kolonner.</b> Ved prediksjon må nye data ha de samme dummykolonnene i samme rekkefølge som treningsdataene.</li>
<li><b>Feil navn i plot.</b> Fjernes kolonner, må navnelisten i for eksempel <code>plot_tree(tree, feature_names=...)</code> komme fra de nye dataene. Ellers står feil variabelnavn i plottet.</li>
<li><b>Sluttpunkter.</b> <code>range(1, 6)</code> stopper på 5, og <code>iloc[0:3]</code> gir 3 rader. Men <code>loc[0:3]</code> bruker radnavn og tar med sluttpunktet: 4 rader.</li>
</ol>
</section>

<section class="ovsec" id="py-test">
<h2>Test deg selv</h2>
<p>Trykk på et spørsmål for å se svaret.</p>
${QA('<code>train_X, valid_X, train_y, valid_y = train_test_split(X, y, test_size=0.3, random_state=1)</code>. Hvor stor andel brukes til trening?', '70 %. <code>test_size</code> er andelen som går til valideringssettet.')}
${QA('Hva er forskjellen på <code>df["Price"]</code> og <code>df[["Price"]]</code>?', 'Den første gir en Series (én kolonne), den andre en DataFrame med én kolonne. Den indre hakeparentesen er en liste med kolonnenavn.')}
${QA('Hva gir <code>[1 if p > 0.5 else 0 for p in [0.2, 0.5, 0.8]]</code>?', '<code>[0, 0, 1]</code>. 0,5 er ikke <i>over</i> 0,5.')}
${QA('Hva betyr <code>model.predict_proba(valid_X)[:, 1]</code>?', 'Sannsynligheten for klasse 1 (den andre klassen i <code>model.classes_</code>) for alle radene i valideringssettet. <code>:</code> betyr alle rader, <code>1</code> betyr kolonne 1.')}
${QA('Fuel_Type har verdiene CNG, Diesel og Petrol. Hvor mange kolonner lager <code>pd.get_dummies(df[["Fuel_Type"]], drop_first=True)</code>, og hva er referansekategorien?', 'To kolonner, Fuel_Type_Diesel og Fuel_Type_Petrol. CNG er referansekategorien, fordi den kommer først alfabetisk.')}
${QA('Koden inneholder linjen <code>car_df.dropna()</code> alene. Hva skjer med <code>car_df</code>?', 'Ingenting. Resultatet lagres ikke. Det skal stå <code>car_df = car_df.dropna()</code>.')}
${QA('<code>cross_val_score(reg, X, y, cv=5, scoring="neg_root_mean_squared_error")</code> gir <code>[-1200, -1300, -1100, -1250, -1150]</code>. Hva er RMSE i kryssvalideringen?', '1 200, snittet av de fem tallene uten minus. Fem tall fordi <code>cv=5</code> gir fem folder.')}
${QA('Hva betyr <code>MLPClassifier(hidden_layer_sizes=(10, 5))</code>?', 'Et nevralt nettverk med to skjulte lag: 10 nevroner i det første og 5 i det andre.')}
${QA('Hvor mange parametere har <code>layers.Dense(4)</code> når det får 3 verdier inn?', '(3 + 1) · 4 = 16: 12 vekter og 4 bias.')}
${QA('Hva er galt her? <code>scaler.fit_transform(train_X)</code>, og så <code>scaler.fit_transform(valid_X)</code>.', 'Valideringsdataene skal skaleres med snittet og standardavviket fra treningsdataene. Riktig er <code>scaler.transform(valid_X)</code>.')}
${QA('<code>GridSearchCV(tree, {"max_depth": [3, 5, 7], "min_samples_leaf": [5, 10]}, cv=5)</code>. Hvor mange trær trenes i søket?', '3 · 2 = 6 kombinasjoner, hver med 5 folder: 30 trær. I tillegg trenes vinneren én gang til på alle treningsdataene.')}
${QA('Hva skriver <code>print(f"{0.0846:.1%}")</code> ut?', '<code>8.5%</code>.')}
${QA('<code>fcluster(Z, 3, criterion="maxclust")</code> og <code>KMeans(n_clusters=3).fit(X).labels_</code>. Hvilke klyngenumre kan de gi?', 'fcluster gir 1, 2 og 3. KMeans gir 0, 1 og 2. Numrene er bare etiketter, så klynge 1 i den ene trenger ikke svare til klynge 1 i den andre.')}
${QA('Hva gir <code>df.groupby("Fuel_Type")["Price"].mean()</code>?', 'Snittprisen for hver drivstofftype: én rad per verdi av Fuel_Type.')}
</section>
`;

function renderPython(main, focus) {
  document.title = 'Les Python-koden · BBAN4001 visuelt';
  main.append(H('nav', { class: 'crumbs', 'aria-label': 'Du er her' }, H('a', { href: '#' }, 'Metodetreet'), ' › Les Python-koden'),
    H('header', { class: 'thead' }, H('h1', {}, 'Les Python-koden'),
      H('p', { class: 'lead' }, 'På eksamen skal du ikke skrive kode, men du må kunne lese den og tolke output. Her er syntaksen og funksjonene som går igjen i faget, forklart med egne eksempler på lærebokas datasett. All output er ekte.'),
      H('div', { class: 'pills' }, H('span', { class: 'pill f' }, 'Hele faget'), H('span', { class: 'pill' }, 'pandas'), H('span', { class: 'pill' }, 'scikit-learn'), H('span', { class: 'pill' }, 'Tolke output'))));
  main.append(H('nav', { class: 'chips ovtoc', 'aria-label': 'Innhold på siden' }, PY_SECTIONS.map(([id, t]) => H('a', { class: 'chip', href: '#python-' + id }, t))));
  const art = H('article', { class: 'prose ovprose', html: PY_HTML() });
  // Hardt mellomrom i tall som 1 436, så de ikke deles over to linjer (ikke i kode og output)
  const tw = document.createTreeWalker(art, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest('pre, code') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  for (let n; (n = tw.nextNode());) n.nodeValue = n.nodeValue.replace(/(\d) (?=\d{3}(?!\d))/g, '$1 ');
  main.append(art);
  main.append(H('nav', { class: 'pager', 'aria-label': 'Tilbake' }, H('a', { href: '#' }, H('small', {}, '←'), 'Metodetreet'), H('a', { href: '#python', style: 'text-align:right' }, H('small', {}, '↑'), 'Til toppen av siden')));
  if (focus) requestAnimationFrame(() => { const el = document.getElementById('py-' + focus); if (el) el.scrollIntoView({ block: 'start' }); });
}

/* Lenkeboks nederst på temasidene */
function pyLinks(id) {
  const L = PY_LINKS[id];
  if (!L) return null;
  return H('p', { class: 'dnote ovlinks' }, H('b', {}, 'Python-koden: '), L.map(([a, t], i) => [i ? ' · ' : '', H('a', { href: '#python-' + a }, t)]));
}
