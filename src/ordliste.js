/* Ordliste: forkortelser og begreper. Første forekomst på hver side lenkes automatisk hit (linkTerms). */
/* Felt: id, t (begrep), f (fullt navn), d (forklaring), x (formel, HTML), p (sider), m (mønster for automatisk lenke), ci (ignorer store/små bokstaver), self (siden begrepet handler om) */
const GLOSSARY = [
  { id: 'adam', t: 'Adam', f: 'Adaptive Moment Estimation', d: 'En variant av gradient descent som tilpasser skrittlengden for hver vekt underveis. Standardvalget når man trener nevrale nettverk i Keras.', p: ['nevrale-nett'], m: 'Adam' },
  { id: 'adaboost', t: 'AdaBoost', f: 'Adaptive Boosting', d: 'Boosting med vekter: punkter som forrige modell bommet på, får større vekt i neste runde. Modellene stemmer med vekt etter hvor gode de var.', p: ['ensembler'], m: 'AdaBoost' },
  { id: 'aic', t: 'AIC', f: 'Akaike Information Criterion (Akaikes informasjonskriterium)', d: 'Mål for å sammenligne regresjonsmodeller på de samme dataene. Belønner god tilpasning (lav SSE) og straffer antall parametere. Lavere er bedre.', x: 'AIC = <i>n</i> · ln(SSE/<i>n</i>) + <i>n</i>(1 + ln 2π) + 2(<i>p</i> + 1)', p: ['variabelseleksjon'], m: 'AIC' },
  { id: 'aktivering', t: 'Aktiveringsfunksjon', f: 'Activation function', d: 'Funksjonen et nevron sender den vektede summen gjennom, for eksempel sigmoid, tanh eller ReLU. Det er den som gjør nettverket ikke-lineært.', p: ['nevrale-nett'], m: 'aktiveringsfunksjon\\p{L}*', ci: 1 },
  { id: 'attention', t: 'Attention', f: 'Oppmerksomhetsmekanisme', d: 'Delen av en transformer som regner ut hvor mye hvert token skal «se på» de andre tokenene i teksten. Vektene summerer til 1.', p: ['sprakmodeller'], m: 'attention', ci: 1 },
  { id: 'auc', t: 'AUC', f: 'Area Under the (ROC) Curve', d: 'Arealet under ROC-kurven. 1 er perfekt, 0,5 er tilfeldig gjetting. Kan leses som sannsynligheten for at en tilfeldig positiv får høyere propensitet enn en tilfeldig negativ.', p: ['evaluering-klassifikasjon'], m: 'AUC' },
  { id: 'bagging', t: 'Bagging', f: 'Bootstrap aggregating', d: 'Tren mange modeller på bootstrap-utvalg av treningsdataene og la dem stemme (klassifikasjon) eller ta gjennomsnittet (prediksjon). Reduserer varians.', p: ['ensembler'], m: 'bagging', ci: 1, self: 'ensembler' },
  { id: 'batch', t: 'Batch size', f: 'Batchstørrelse', d: 'Antall datapunkter som brukes til hver vektoppdatering når et nevralt nettverk trenes.', x: 'Oppdateringer per epoch = <i>n</i> / batch size', p: ['nevrale-nett'], m: 'batch size', ci: 1 },
  { id: 'bias', t: 'Bias', f: 'To betydninger', d: '1) I bias–varians: systematisk feil fordi modellen er for enkel. 2) I nevrale nettverk: konstantleddet b som legges til den vektede summen i et nevron.', p: ['bias-varians', 'nevrale-nett'] },
  { id: 'bic', t: 'BIC', f: 'Bayesian Information Criterion (bayesiansk informasjonskriterium)', d: 'Som AIC, men straffer hver parameter med ln(<i>n</i>) i stedet for 2. Foretrekker derfor enklere modeller enn AIC. Lavere er bedre.', x: 'BIC = <i>n</i> · ln(SSE/<i>n</i>) + <i>n</i>(1 + ln 2π) + ln(<i>n</i>) · (<i>p</i> + 1)', p: ['variabelseleksjon'], m: 'BIC' },
  { id: 'boosting', t: 'Boosting', f: '', d: 'Ensemble der modellene trenes etter hverandre, og hver ny modell konsentrerer seg om feilene til de forrige. Reduserer først og fremst bias.', p: ['ensembler'], m: 'boosting', ci: 1, self: 'ensembler' },
  { id: 'bootstrap', t: 'Bootstrap-utvalg', f: 'Bootstrap sample', d: 'Et utvalg på <i>n</i> rader trukket med tilbakelegging fra <i>n</i> rader. Noen rader kommer med flere ganger, andre ikke i det hele tatt.', p: ['ensembler'], m: 'bootstrap\\p{L}*', ci: 1 },
  { id: 'c-logistisk', t: 'C (i logistisk regresjon)', f: 'Inverse of regularization strength', d: 'Parameteren som styrer straffen i <code>LogisticRegression</code>. C = 1/λ, så liten C betyr sterk straff. Læreboka bruker C = 1e42 for å skru straffen av.', x: 'C = 1 / λ', p: ['regularisering', 'logistisk-regresjon'] },
  { id: 'cnn', t: 'CNN', f: 'Convolutional Neural Network (konvolusjonsnettverk)', d: 'Nevralt nettverk for bilder der små filtre glir over bildet og finner mønstre som kanter og former. Samme vekter brukes overalt i bildet.', x: 'Output-størrelse = (<i>W</i> − <i>F</i> + 2<i>P</i>) / <i>S</i> + 1 &nbsp; Parametere = (<i>F</i> · <i>F</i> · <i>C</i> + 1) · <i>K</i>', p: ['nevrale-nett'], m: 'CNN' },
  { id: 'cosinus', t: 'Cosinuslikhet', f: 'Cosine similarity', d: 'Likhet mellom to vektorer målt med vinkelen mellom dem. 1 betyr samme retning, 0 ingen sammenheng. Brukes for embeddings.', x: 'cos = <b>a</b> · <b>b</b> / (‖<b>a</b>‖ ‖<b>b</b>‖)', p: ['sprakmodeller', 'rag'], m: 'cosinuslikhet', ci: 1 },
  { id: 'coverage', t: 'Coverage', f: '', d: 'Andelen nye observasjoner der den sanne verdien havner inni prediksjonsintervallet. Et 90 %-intervall skal ha 90 % coverage.', p: ['konform'], m: 'coverage', ci: 1 },
  { id: 'dendrogram', t: 'Dendrogram', f: '', d: 'Trediagram som viser rekkefølgen og avstanden når klynger slås sammen i hierarkisk klyngeanalyse. Klipper du treet i en høyde, får du klyngene.', p: ['hierarkisk-klynging'], m: 'dendrogram\\p{L}*', ci: 1, self: 'hierarkisk-klynging' },
  { id: 'dummy', t: 'Dummyvariabel', f: 'Dummy variable / one-hot encoding', d: 'En 0/1-variabel som koder én kategori. En kategorisk variabel med <i>k</i> kategorier gir <i>k</i> − 1 dummyer i regresjon; den som faller bort, er referansekategorien.', p: ['dataforberedelse', 'lineaer-regresjon'], m: 'dummy\\p{L}*', ci: 1 },
  { id: 'elastic-net', t: 'Elastic net', f: '', d: 'Regularisering som blander lasso (L1) og ridge (L2). Kan sette koeffisienter til null, men holder grupper av korrelerte variabler sammen.', x: 'minimer SSE + λ [<i>r</i> Σ|β<sub>j</sub>| + (1 − <i>r</i>)/2 · Σβ<sub>j</sub>²]', p: ['regularisering'], m: 'elastic net', ci: 1, self: 'regularisering' },
  { id: 'embedding', t: 'Embedding', f: 'Vektorrepresentasjon', d: 'En tallvektor som representerer et token eller en tekst. Tekster med lignende betydning får vektorer som ligger nær hverandre.', p: ['sprakmodeller', 'rag'], m: 'embedding\\p{L}*', ci: 1 },
  { id: 'entropi', t: 'Entropi', f: 'Entropy', d: 'Mål på impurity i en gruppe i et desisjonstre. 0 når gruppen er ren, høyst 1 med to klasser i 50/50.', x: 'Entropi = − Σ <i>p<sub>k</sub></i> log<sub>2</sub>(<i>p<sub>k</sub></i>)', p: ['beslutningstraer'], m: 'entropi', ci: 1 },
  { id: 'epoch', t: 'Epoch', f: '', d: 'Én gjennomgang av alle treningsdataene når et nevralt nettverk trenes.', p: ['nevrale-nett'], m: 'epochs?', ci: 1 },
  { id: 'f1', t: 'F1', f: 'F1-score', d: 'Harmonisk gjennomsnitt av presisjon og dekning. Høy bare når begge er høye.', x: 'F1 = 2 · presisjon · dekning / (presisjon + dekning)', p: ['evaluering-klassifikasjon'], m: 'F1' },
  { id: 'feature-map', t: 'Feature map', f: '', d: 'Resultatet av å la ett filter gli over et bilde i et CNN. Hvert filter gir ett feature map.', p: ['nevrale-nett'], m: 'feature map\\p{L}*', ci: 1 },
  { id: 'fpr', t: 'FPR', f: 'False Positive Rate', d: 'Andelen faktisk negative som feilaktig klassifiseres som positive. x-aksen i ROC-kurven.', x: 'FPR = FP / (FP + TN) = 1 − spesifisitet', p: ['evaluering-klassifikasjon'], m: 'FPR' },
  { id: 'forklaringsvariabel', t: 'Forklaringsvariabel', f: 'X, predictor, feature', d: 'En variabel modellen bruker for å forklare eller predikere responsvariabelen. I Python ofte samlet i X.', p: ['lineaer-regresjon', 'variabelseleksjon', 'logistisk-regresjon', 'knn'], m: 'forklaringsvariab\\p{L}*', ci: 1 },
  { id: 'forvirringsmatrise', t: 'Forvirringsmatrise', f: 'Confusion matrix', d: 'Tabell med faktisk klasse i radene og predikert klasse i kolonnene. Cellene er TP, FP, TN og FN.', p: ['evaluering-klassifikasjon'], m: 'forvirringsmatris\\p{L}*', ci: 1 },
  { id: 'gini', t: 'Gini (impurity)', f: 'Gini impurity', d: 'Mål på impurity i en gruppe i et desisjonstre. 0 når gruppen er ren, høyst 0,5 med to klasser i 50/50.', x: 'Gini = 1 − Σ <i>p<sub>k</sub></i>²', p: ['beslutningstraer'], m: 'Gini' },
  { id: 'gradient-descent', t: 'Gradient descent', f: 'Gradientnedstigning', d: 'Optimeringsmetode som justerer vektene litt i motsatt retning av gradienten, steg for steg, til kostnaden slutter å falle.', x: '<i>w</i> ← <i>w</i> − η · ∂<i>L</i>/∂<i>w</i>', p: ['nevrale-nett'], m: 'gradient descent', ci: 1 },
  { id: 'hallusinasjon', t: 'Hallusinasjon', f: 'Hallucination', d: 'Når en språkmodell skriver noe flytende og selvsikkert som er feil eller oppdiktet.', p: ['sprakmodeller', 'rag'], m: 'hallusin\\p{L}*', ci: 1 },
  { id: 'hyperparameter', t: 'Hyperparameter', f: '', d: 'En innstilling vi velger før treningen, som k i k-NN, maks dybde i trær eller λ i lasso. Parametere (som koeffisienter og vekter) lærer modellen selv.', p: ['bias-varians', 'beslutningstraer', 'nevrale-nett'], m: 'hyperparamet\\p{L}*', ci: 1 },
  { id: 'inertia', t: 'Inertia', f: 'Within-cluster sum of squares', d: 'Summen av kvadrerte avstander fra hvert punkt til sentroiden i sin klynge. k-means prøver å gjøre den så liten som mulig.', x: 'Inertia = Σ<sub>klynger</sub> Σ<sub>punkter</sub> avstand²', p: ['k-means'], m: 'inertia', ci: 1 },
  { id: 'iqr', t: 'IQR', f: 'Interquartile range (interkvartilbredde)', d: 'Avstanden mellom første og tredje kvartil. Brukes i boksplot og i regelen for utstikkere.', x: 'IQR = Q3 − Q1 &nbsp; Utstikker: under Q1 − 1,5 · IQR eller over Q3 + 1,5 · IQR', p: ['dataforberedelse'], m: 'IQR' },
  { id: 'jaccard', t: 'Jaccard', f: 'Jaccard-koeffisient', d: 'Likhet mellom to binære vektorer som bare teller posisjoner der minst én av dem har 1. Passer når 1-ere er sjeldne.', x: 'Jaccard = <i>a</i> / (<i>a</i> + <i>b</i> + <i>c</i>)', p: ['hierarkisk-klynging'], m: 'Jaccard' },
  { id: 'justert-r2', t: 'Justert R²', f: 'Adjusted R²', d: 'R² med straff for antall forklaringsvariabler. Stiger bare hvis en ny variabel forbedrer modellen mer enn forventet ved ren tilfeldighet.', x: 'Justert R² = 1 − (1 − R²)(<i>n</i> − 1) / (<i>n</i> − <i>p</i> − 1)', p: ['variabelseleksjon'], m: 'justert R²', ci: 1 },
  { id: 'k-fold', t: 'k-fold kryssvalidering', f: 'k-fold cross-validation', d: 'Del dataene i k like store deler. Tren k ganger, hver gang med én del til validering, og snitt feilen.', p: ['bias-varians'], m: 'k-fold', ci: 1 },
  { id: 'k-means', t: 'k-means', f: '', d: 'Klyngemetode som veksler mellom å tildele hvert punkt til nærmeste sentroide og å flytte sentroidene til midten av punktene sine.', p: ['k-means'], m: 'k-means', self: 'k-means' },
  { id: 'knn', t: 'k-NN', f: 'k nearest neighbors (k-nærmeste naboer)', d: 'Klassifiserer eller predikerer et nytt punkt ut fra de k mest like punktene i treningsdataene.', p: ['knn'], m: 'k-NN', self: 'knn' },
  { id: 'konform', t: 'Conformal prediction', f: 'Split conformal', d: 'Metode som lager kalibrerte prediksjonsintervaller rundt prediksjonene fra hvilken som helst modell, ved hjelp av feilene på egne kalibreringsdata.', x: '<i>q̂</i> = den <i>k</i>-te minste feilen, <i>k</i> = ⌈(<i>n</i> + 1)(1 − α)⌉', p: ['konform'], m: 'conformal prediction', ci: 1, self: 'konform' },
  { id: 'cross-entropy', t: 'Cross-entropy', f: '', d: 'Kostnadsfunksjon for klassifikasjon. Blir stor når modellen gir lav sannsynlighet til riktig klasse.', x: 'Loss = − ln(sannsynligheten for riktig klasse)', p: ['nevrale-nett'], m: 'cross-entropy', ci: 1 },
  { id: 'lasso', t: 'Lasso', f: 'Least Absolute Shrinkage and Selection Operator', d: 'Regularisering med L1-straff. Krymper koeffisientene og kan sette noen til nøyaktig null, slik at den også velger variabler.', x: 'minimer SSE + λ Σ |β<sub>j</sub>|', p: ['regularisering', 'variabelseleksjon'], m: 'lasso', ci: 1, self: 'regularisering' },
  { id: 'lift', t: 'Lift', f: '', d: 'Hvor mange ganger høyere andelen positive er blant dem modellen velger ut, sammenlignet med å velge tilfeldig.', x: 'Lift = (andel positive blant de valgte) / (andel positive totalt)', p: ['evaluering-klassifikasjon'], m: 'lift', ci: 1 },
  { id: 'linkage', t: 'Linkage', f: '', d: 'Hvordan avstanden mellom to klynger måles i hierarkisk klyngeanalyse: single linkage (minimum avstand), complete linkage (maksimum avstand), average linkage (gjennomsnittlig avstand), sentroide-avstand eller Ward.', p: ['hierarkisk-klynging'], m: 'linkage', ci: 1 },
  { id: 'llm', t: 'LLM', f: 'Large Language Model (stor språkmodell)', d: 'Et svært stort nevralt nettverk (transformer) trent på å predikere neste token i enorme tekstmengder.', p: ['sprakmodeller', 'rag'], m: 'LLM' },
  { id: 'logit', t: 'Logit', f: 'Log-odds', d: 'Logaritmen av oddsen. Logistisk regresjon modellerer logit som en lineær funksjon av forklaringsvariablene.', x: 'logit = ln(<i>p</i> / (1 − <i>p</i>)) &nbsp; <i>p</i> = 1 / (1 + e<sup>−logit</sup>)', p: ['logistisk-regresjon'], m: 'logit', ci: 1 },
  { id: 'loocv', t: 'LOOCV', f: 'Leave-one-out cross-validation', d: 'Kryssvalidering der hvert datapunkt valideres alene, mens modellen trenes på alle de andre. Det er k-fold med k = n.', p: ['bias-varians', 'knn'], m: 'LOOCV' },
  { id: 'mae', t: 'MAE', f: 'Mean Absolute Error (gjennomsnittlig absoluttfeil)', d: 'Typisk størrelse på feilen, i samme enhet som Y.', x: 'MAE = (1/<i>n</i>) Σ |<i>y</i> − <i>ŷ</i>|', p: ['evaluering-prediksjon'], m: 'MAE' },
  { id: 'mape', t: 'MAPE', f: 'Mean Absolute Percentage Error', d: 'Typisk feil i prosent av den faktiske verdien. Kan ikke brukes når Y kan være 0.', x: 'MAPE = (100/<i>n</i>) Σ |<i>y</i> − <i>ŷ</i>| / |<i>y</i>|', p: ['evaluering-prediksjon'], m: 'MAPE' },
  { id: 'mapie', t: 'MAPIE', f: 'Model Agnostic Prediction Interval Estimator', d: 'Python-pakke for conformal prediction som legger intervaller rundt prediksjonene fra en scikit-learn-modell.', p: ['konform'], m: 'MAPIE' },
  { id: 'mdape', t: 'MdAPE', f: 'Median Absolute Percentage Error', d: 'Som MAPE, men medianen i stedet for gjennomsnittet. Påvirkes lite av enkeltstående store bom.', p: ['evaluering-prediksjon'], m: 'MdAPE' },
  { id: 'me', t: 'ME', f: 'Mean Error (gjennomsnittlig feil)', d: 'Viser om vi systematisk over- eller underpredikerer (bias). Med <i>e</i> = <i>y</i> − <i>ŷ</i> betyr positiv ME at modellen i snitt predikerer for lavt.', x: 'ME = (1/<i>n</i>) Σ (<i>y</i> − <i>ŷ</i>)', p: ['evaluering-prediksjon'], m: 'ME' },
  { id: 'mle', t: 'Maksimal likelihood', f: 'Maximum likelihood estimation (MLE)', d: 'Estimeringsmetode som velger parameterne som gjør de observerte dataene mest sannsynlige. Brukes i logistisk regresjon.', p: ['logistisk-regresjon'], m: 'maksimal likelihood', ci: 1 },
  { id: 'mlp', t: 'MLP', f: 'Multilayer perceptron', d: 'Nevralt nettverk med fullt koblede lag: input, ett eller flere skjulte lag og output.', p: ['nevrale-nett'], m: 'MLP' },
  { id: 'mpe', t: 'MPE', f: 'Mean Percentage Error', d: 'Som ME, men målt i prosent av den faktiske verdien.', x: 'MPE = (100/<i>n</i>) Σ (<i>y</i> − <i>ŷ</i>) / <i>y</i>', p: ['evaluering-prediksjon'], m: 'MPE' },
  { id: 'mse', t: 'MSE', f: 'Mean Squared Error', d: 'Gjennomsnittet av de kvadrerte feilene. Vanlig kostnadsfunksjon for regresjon. RMSE er kvadratroten av MSE.', x: 'MSE = SSE / <i>n</i>', p: ['nevrale-nett', 'beslutningstraer'], m: 'MSE' },
  { id: 'odds', t: 'Odds og oddsratio', f: 'Odds, odds ratio', d: 'Odds er sannsynligheten for at noe skjer delt på sannsynligheten for at det ikke skjer. I logistisk regresjon er e<sup>b</sup> oddsratioen: faktoren oddsen ganges med når <i>x</i> øker med én enhet.', x: 'odds = <i>p</i> / (1 − <i>p</i>) &nbsp; oddsratio = e<sup><i>b</i></sup>', p: ['logistisk-regresjon'], m: 'oddsratio\\p{L}*', ci: 1 },
  { id: 'ols', t: 'Minste kvadraters metode', f: 'Ordinary Least Squares (OLS)', d: 'Velger koeffisientene i lineær regresjon som gjør summen av kvadrerte residualer (SSE) minst mulig.', x: 'minimer SSE = Σ (<i>y</i> − <i>ŷ</i>)²', p: ['lineaer-regresjon'], m: 'minste kvadrater\\p{L}*', ci: 1 },
  { id: 'overtilpasning', t: 'Overtilpasning', f: 'Overfitting', d: 'Når modellen lærer støyen i treningsdataene. Treningsfeilen er lav, men feilen på nye data er høy.', p: ['bias-varians', 'beslutningstraer', 'nevrale-nett'], m: 'overtilpass\\p{L}*', ci: 1 },
  { id: 'pca', t: 'PCA', f: 'Principal Component Analysis (prinsipalkomponentanalyse)', d: 'Lager nye, ukorrelerte variabler (prinsipalkomponenter) som lineære kombinasjoner av de opprinnelige. Første komponent fanger mest varians.', p: ['pca'], m: 'PCA', self: 'pca' },
  { id: 'pooling', t: 'Pooling', f: 'For eksempel max pooling', d: 'Steg i et CNN som krymper bildet, for eksempel ved å beholde den største verdien i hvert 2 × 2-felt. Har ingen parametere.', p: ['nevrale-nett'], m: 'pooling', ci: 1 },
  { id: 'presisjon', t: 'Presisjon', f: 'Precision', d: 'Av dem modellen kaller positive, hvor stor andel er faktisk positive?', x: 'Presisjon = TP / (TP + FP)', p: ['evaluering-klassifikasjon'], m: 'presisjon\\p{L}*', ci: 1 },
  { id: 'propensitet', t: 'Propensitet', f: 'Propensity', d: 'Modellens anslåtte sannsynlighet for at et datapunkt tilhører klasse 1. En terskel gjør propensiteten om til en klasse.', p: ['evaluering-klassifikasjon', 'logistisk-regresjon', 'knn'], m: 'propensitet\\p{L}*', ci: 1 },
  { id: 'pve', t: 'PVE', f: 'Proportion of Variance Explained', d: 'Andelen av den totale variansen som én prinsipalkomponent forklarer. Summen over alle komponentene er 100 %.', p: ['pca'], m: 'PVE' },
  { id: 'r2', t: 'R²', f: 'Forklart varians (determinasjonskoeffisient)', d: 'Andelen av variasjonen i Y som modellen forklarer. 1 er perfekt, 0 er ikke bedre enn gjennomsnittet.', x: 'R² = 1 − SSE / SST', p: ['lineaer-regresjon', 'variabelseleksjon'], m: 'R²' },
  { id: 'rag', t: 'RAG', f: 'Retrieval-Augmented Generation', d: 'Henter relevante utdrag fra egne dokumenter og legger dem i prompten, slik at språkmodellen svarer ut fra kildene.', p: ['rag'], m: 'RAG', self: 'rag' },
  { id: 'random-forest', t: 'Random forest', f: '', d: 'Bagging med trær, der hver splitt bare får velge blant et tilfeldig utvalg av forklaringsvariablene. Gjør trærne mer ulike og gjennomsnittet bedre.', p: ['ensembler'], m: 'random forest', ci: 1, self: 'ensembler' },
  { id: 'regularisering', t: 'Regularisering', f: 'Krymping (shrinkage)', d: 'Å legge en straff for store koeffisienter oppå tilpasningen, for eksempel ridge, lasso eller elastic net. Gir litt mer bias og mindre varians.', p: ['regularisering'], m: 'regulariser\\p{L}*', ci: 1, self: 'regularisering' },
  { id: 'relu', t: 'ReLU', f: 'Rectified Linear Unit', d: 'Aktiveringsfunksjon som setter negative verdier til 0 og lar positive passere uendret.', x: 'ReLU(<i>z</i>) = max(0, <i>z</i>)', p: ['nevrale-nett'], m: 'ReLU' },
  { id: 'responsvariabel', t: 'Responsvariabel', f: 'Y, response, outcome', d: 'Variabelen vi vil predikere (numerisk Y) eller klassifisere (kategorisk Y). Finnes bare i veiledet læring.', p: ['lineaer-regresjon', 'logistisk-regresjon', 'evaluering-prediksjon', 'evaluering-klassifikasjon'], m: 'responsvariab\\p{L}*', ci: 1 },
  { id: 'ridge', t: 'Ridge', f: 'Ridge regression (L2-regularisering)', d: 'Regularisering med L2-straff. Krymper alle koeffisientene mot null, men setter ingen helt til null.', x: 'minimer SSE + λ Σ β<sub>j</sub>²', p: ['regularisering', 'variabelseleksjon'], m: 'ridge', ci: 1, self: 'regularisering' },
  { id: 'rmse', t: 'RMSE', f: 'Root Mean Squared Error', d: 'Kvadratroten av gjennomsnittlig kvadrert feil, i samme enhet som Y. Straffer store feil ekstra mye.', x: 'RMSE = √[(1/<i>n</i>) Σ (<i>y</i> − <i>ŷ</i>)²]', p: ['evaluering-prediksjon', 'bias-varians', 'lineaer-regresjon'], m: 'RMSE' },
  { id: 'roc', t: 'ROC-kurve', f: 'Receiver Operating Characteristic', d: 'Dekning (TPR) plottet mot 1 − spesifisitet for alle mulige terskler. Jo nærmere øvre venstre hjørne, desto bedre.', p: ['evaluering-klassifikasjon'], m: 'ROC' },
  { id: 'dekning', t: 'Dekning', f: 'Recall, sensitivitet, true positive rate (TPR)', d: 'Andelen av de faktisk positive som modellen finner.', x: 'Dekning = TP / (TP + FN)', p: ['evaluering-klassifikasjon'], m: 'dekning\\p{L}*', ci: 1 },
  { id: 'sgd', t: 'SGD', f: 'Stochastic Gradient Descent', d: 'Gradient descent der hver oppdatering bruker en liten tilfeldig del av dataene (en batch) i stedet for alle.', p: ['nevrale-nett'], m: 'SGD' },
  { id: 'shap', t: 'SHAP', f: 'SHapley Additive exPlanations', d: 'Forklarer en enkelt prediksjon ved å fordele avstanden fra gjennomsnittsprediksjonen på forklaringsvariablene, med Shapley-verdier.', x: 'E[<i>f</i>(<i>X</i>)] + Σ φ<sub><i>j</i></sub> = <i>f</i>(<i>x</i>)', p: ['shap'], m: 'SHAP', self: 'shap' },
  { id: 'shapley', t: 'Shapley-verdi', f: 'Shapley value', d: 'En spillers gjennomsnittlige marginale bidrag over alle rekkefølger spillerne kan bli med i. Summerer til gevinsten for hele fellesskapet.', p: ['shap'], m: 'Shapley\\p{L}*' },
  { id: 'softmax', t: 'Softmax', f: '', d: 'Gjør en vektor av tall (logits) om til sannsynligheter som summerer til 1. Brukes i output-laget ved flere klasser og i språkmodeller.', x: '<i>p<sub>i</sub></i> = e<sup><i>z<sub>i</sub></i>/<i>T</i></sup> / Σ<sub><i>j</i></sub> e<sup><i>z<sub>j</sub></i>/<i>T</i></sup> &nbsp; (<i>T</i> = temperatur, vanligvis 1)', p: ['nevrale-nett', 'sprakmodeller'], m: 'softmax', ci: 1 },
  { id: 'spesifisitet', t: 'Spesifisitet', f: 'Specificity, true negative rate', d: 'Andelen av de faktisk negative som modellen avviser riktig.', x: 'Spesifisitet = TN / (TN + FP)', p: ['evaluering-klassifikasjon'], m: 'spesifisitet', ci: 1 },
  { id: 'sse', t: 'SSE', f: 'Sum of Squared Errors (residualkvadratsum)', d: 'Summen av de kvadrerte residualene. Minste kvadraters metode gjør SSE så liten som mulig.', x: 'SSE = Σ (<i>y</i> − <i>ŷ</i>)²', p: ['lineaer-regresjon', 'variabelseleksjon', 'regularisering'], m: 'SSE' },
  { id: 'sst', t: 'SST', f: 'Total Sum of Squares', d: 'Total variasjon i Y rundt gjennomsnittet. Det er SSE for en modell som bare predikerer gjennomsnittet.', x: 'SST = Σ (<i>y</i> − <i>ȳ</i>)²', p: ['lineaer-regresjon'], m: 'SST' },
  { id: 'stride', t: 'Stride og padding', f: '', d: 'Stride er skrittlengden filteret flyttes med i et CNN. Padding er en kant av nuller rundt bildet, så output ikke krymper.', p: ['nevrale-nett'], m: 'stride', ci: 1 },
  { id: 'temperatur', t: 'Temperatur', f: 'Temperature', d: 'Parameter i softmax som styrer hvor tilfeldig en språkmodell velger neste token. Lav temperatur gir like svar, høy gir mer variasjon.', p: ['sprakmodeller'], m: 'temperatur\\p{L}*', ci: 1 },
  { id: 'terskel', t: 'Terskel', f: 'Cutoff, threshold', d: 'Grensen som gjør en propensitet om til en klasse. Med terskel 0,5 blir alt over 0,5 klassifisert som 1.', p: ['evaluering-klassifikasjon', 'logistisk-regresjon'], m: 'terskel\\p{L}*', ci: 1 },
  { id: 'token', t: 'Token', f: '', d: 'Enheten en språkmodell jobber med: et ord, en orddel eller et tegn. Teksten deles i tokens av en tokenizer.', p: ['sprakmodeller'], m: 'tokens?', ci: 1 },
  { id: 'tp', t: 'TP, FP, TN, FN', f: 'True/false positive, true/false negative', d: 'Cellene i forvirringsmatrisen: sann positiv, falsk positiv (falsk alarm), sann negativ og falsk negativ (oversett).', p: ['evaluering-klassifikasjon'], m: 'TP|FP|TN|FN' },
  { id: 'tpr', t: 'TPR', f: 'True Positive Rate', d: 'Det samme som dekning (også kalt sensitivitet eller recall). y-aksen i ROC-kurven.', x: 'TPR = TP / (TP + FN)', p: ['evaluering-klassifikasjon'], m: 'TPR' },
  { id: 'transfer', t: 'Transfer learning', f: 'Overføringslæring', d: 'Å gjenbruke et nettverk som er ferdig trent på en stor oppgave, og bare trene de siste lagene på sin egen oppgave.', p: ['nevrale-nett'], m: 'transfer learning', ci: 1 },
  { id: 'transformer', t: 'Transformer', f: '', d: 'Arkitekturen bak moderne språkmodeller. Bruker attention til å se på sammenhengen mellom alle tokens i teksten samtidig.', p: ['sprakmodeller'], m: 'transformer\\p{L}*', ci: 1 },
  { id: 'utstikker', t: 'Utstikker', f: 'Outlier', d: 'Et «ekstremt» datapunkt som skiller seg tydelig fra resten av dataene. Kan være en feil eller en ekte, sjelden verdi.', p: ['dataforberedelse'], m: 'utstikker\\p{L}*', ci: 1 },
  { id: 'vgg16', t: 'VGG16', f: '', d: 'Kjent CNN for bildegjenkjenning med 16 lag med vekter og 138 millioner parametere, trent på ImageNet. Mye brukt til transfer learning.', p: ['nevrale-nett'], m: 'VGG16' },
  { id: 'weight-decay', t: 'Weight decay', f: 'L2-regularisering', d: 'L2-straff på vektene i et nevralt nettverk. Samme idé som ridge.', p: ['nevrale-nett', 'regularisering'], m: 'weight decay', ci: 1 },
  { id: 'z-score', t: 'z-score', f: 'Standardisering, i forelesningene også kalt normalisering', d: 'Gjør en variabel om til antall standardavvik fra gjennomsnittet, slik at variabler på ulik skala blir sammenlignbare.', x: '<i>z</i> = (<i>x</i> − <i>x̄</i>) / <i>s</i>', p: ['dataforberedelse', 'knn', 'pca'], m: 'z-score', ci: 1 },
  { id: 'lambda', t: 'λ (lambda) og alpha', f: 'Straffeparameter', d: 'Hvor hardt store koeffisienter straffes i ridge, lasso og elastic net. I scikit-learn heter den <code>alpha</code>. Ikke å forveksle med α i conformal prediction, der α er andelen vi tillater å bomme.', p: ['regularisering'] },
  { id: '1se', t: '1-SE-regelen', f: 'One-standard-error rule', d: 'Velg den enkleste modellen (største straff) der kryssvalideringsfeilen er innenfor ett standardavvik fra den laveste. Gir enklere modeller som er omtrent like gode.', p: ['regularisering'], m: '1-SE-regel\\p{L}*', ci: 1 }
];
const GL = Object.fromEntries(GLOSSARY.map(g => [g.id, g]));
const firstSentence = s => { const t = s.replace(/<[^>]+>/g, ''); const i = t.indexOf('. '); return i > 0 ? t.slice(0, i + 1) : t; };
const isWordChar = ch => !!ch && /[\p{L}\p{N}]/u.test(ch);
function findTerm(text, g) {
  const re = new RegExp(g.m, 'gu' + (g.ci ? 'i' : '')); let mt;
  while ((mt = re.exec(text))) { if (!isWordChar(text[mt.index - 1]) && !isWordChar(text[mt.index + mt[0].length])) return [mt.index, mt[0].length]; if (re.lastIndex === mt.index) re.lastIndex++; }
  return null;
}
/* Lenker første forekomst av hvert begrep i den statiske teksten på en side til ordlisten */
function linkTerms(root, pageId) {
  const entries = GLOSSARY.filter(g => g.m && g.self !== pageId), done = new Set();
  const blocks = root.querySelectorAll('.lead, .viz .sub, .try li, .prose p, .prose li, .prose td, .pit, .dnote, .dcard > p');
  for (const el of blocks) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest('a, code, pre, button, h1, h2, h3, svg, .formula') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    for (let node of nodes) {
      while (node && node.nodeValue) {
        let best = null;
        for (const g of entries) { if (done.has(g.id)) continue; const f = findTerm(node.nodeValue, g); if (f && (!best || f[0] < best[1][0])) best = [g, f]; }
        if (!best) break;
        const [g, [i, len]] = best; done.add(g.id);
        const mid = node.splitText(i), rest = mid.splitText(len);
        const a = H('a', { class: 'term', href: '#ordliste-' + g.id, title: g.t + (g.f ? ' – ' + g.f : '') + ': ' + firstSentence(g.d) }, mid.nodeValue);
        mid.replaceWith(a); node = rest;
      }
    }
  }
}
let LAST_PAGE = null;
function renderGlossary(main, focus) {
  document.title = 'Ordliste · BBAN4001 visuelt';
  const back = LAST_PAGE && TOPICS[LAST_PAGE] ? H('a', { href: '#' + LAST_PAGE }, '← Tilbake til ' + TOPICS[LAST_PAGE].title) : null;
  main.append(H('nav', { class: 'crumbs', 'aria-label': 'Du er her' }, H('a', { href: '#' }, 'Metodetreet'), ' › Ordliste', back ? ['  ·  ', back] : null),
    H('header', { class: 'thead' }, H('h1', {}, 'Ordliste'), H('p', { class: 'lead' }, 'Forkortelser og begreper fra faget, med fullt navn, en kort forklaring og formel der det passer. På temasidene er første forekomst av hvert begrep lenket hit.')));
  const id = uid('q'), inp = H('input', { type: 'search', id, placeholder: 'Søk, for eksempel AIC eller dekning', class: 'glsearch', autocomplete: 'off' });
  const count = H('span', { class: 'mini' });
  main.append(H('div', { class: 'ctl', style: 'margin:14px 0 4px;gap:12px;flex-wrap:wrap' }, H('label', { for: id, class: 'sr' }, 'Søk i ordlisten'), inp, count));
  const list = H('div', { class: 'gllist' }); main.append(list);
  const sorted = GLOSSARY.slice().sort((a, b) => a.t.localeCompare(b.t, 'nb', { sensitivity: 'base' }));
  const items = sorted.map(g => {
    const el = H('div', { class: 'gl', id: 'gl-' + g.id },
      H('h2', {}, g.t, g.f ? H('span', { class: 'glfull' }, g.f) : null),
      H('p', { html: g.d }), g.x ? H('div', { class: 'formula', html: g.x }) : null,
      H('p', { class: 'mini', style: 'margin:4px 0 0' }, 'Brukes på: ', g.p.map((u, i) => [i ? ', ' : '', H('a', { href: '#' + u }, TOPICS[u] ? TOPICS[u].title : u)])));
    el._text = (g.t + ' ' + g.f + ' ' + g.d.replace(/<[^>]+>/g, '')).toLowerCase();
    list.append(el); return el;
  });
  const filter = () => { const q = inp.value.trim().toLowerCase(); let n = 0; items.forEach(el => { const on = !q || el._text.includes(q); el.style.display = on ? '' : 'none'; if (on) n++; }); count.textContent = n + ' av ' + items.length + ' begreper'; };
  inp.addEventListener('input', filter); filter();
  if (focus && GL[focus]) requestAnimationFrame(() => { const el = document.getElementById('gl-' + focus); if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 2400); } });
}
