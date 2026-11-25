# BBAN4001 visuelt

**Siden:** https://morttra.github.io/ds-visual/

Et klikkbart metodetre for pensum i BBAN4001 Data Science. Hver metode har en egen side med interaktive figurer øverst og en skriftlig forklaring under: kort fortalt, hvordan metoden virker, formler, hyperparametere, styrker og svakheter, typiske eksamensfeller og Python-kode i lærebokas stil.

Siden skal kunne leses uten forelesningene og uten datasettene:

- Øverst på hver temaside forklarer et «Om dataene»-kort hva datasettet er, hva en rad er, hva vi prøver å forutsi og hva variablene betyr, med eksempelrader.
- [Datasettene](https://morttra.github.io/ds-visual/#datasett) samler alle de sju datasettene på én side.
- Fagordene følger forelesningene, for eksempel desisjonstre, utstikker, dekning, subset selection og conformal prediction. Der læreboka eller andre kilder bruker et annet ord, står det i ordlisten.
- [Ordlisten](https://morttra.github.io/ds-visual/#ordliste) forklarer over 90 forkortelser og begreper, med formel der det passer. Første gang en forkortelse som AIC eller RMSE står på en temaside, lenkes den til ordlisten, og det fulle navnet vises når du holder musepekeren over.

Uoffisiell studiehjelp, ikke laget av faglærer. Sjekk alltid mot forelesningene og læreboka.

## Sidene

Enkeltsider kan deles direkte med lenkene under.

| Tema | Lenke | Forelesning |
|---|---|---|
| Preprosessering og skalering | [`#dataforberedelse`](https://morttra.github.io/ds-visual/#dataforberedelse) | F2–F3 |
| Prinsipalkomponentanalyse (PCA) | [`#pca`](https://morttra.github.io/ds-visual/#pca) | F3 |
| Partisjonering og bias–varians | [`#bias-varians`](https://morttra.github.io/ds-visual/#bias-varians) | F4 |
| Evaluering av prediksjon | [`#evaluering-prediksjon`](https://morttra.github.io/ds-visual/#evaluering-prediksjon) | F4 |
| Evaluering av klassifikasjon | [`#evaluering-klassifikasjon`](https://morttra.github.io/ds-visual/#evaluering-klassifikasjon) | F4 |
| Multippel lineær regresjon | [`#lineaer-regresjon`](https://morttra.github.io/ds-visual/#lineaer-regresjon) | F5 |
| Subset selection: exhaustive search, forward og backward | [`#variabelseleksjon`](https://morttra.github.io/ds-visual/#variabelseleksjon) | F5 |
| Regularisering: ridge, lasso og elastic net | [`#regularisering`](https://morttra.github.io/ds-visual/#regularisering) | F5 |
| Logistisk regresjon | [`#logistisk-regresjon`](https://morttra.github.io/ds-visual/#logistisk-regresjon) | F5 |
| k-nærmeste naboer (k-NN) | [`#knn`](https://morttra.github.io/ds-visual/#knn) | F6 |
| Naiv Bayes | [`#naiv-bayes`](https://morttra.github.io/ds-visual/#naiv-bayes) | F6 |
| Desisjonstrær | [`#beslutningstraer`](https://morttra.github.io/ds-visual/#beslutningstraer) | F7 |
| Ensembler: bagging, random forest og boosting | [`#ensembler`](https://morttra.github.io/ds-visual/#ensembler) | F7 |
| Forklarbar KI med SHAP | [`#shap`](https://morttra.github.io/ds-visual/#shap) | F8 |
| Usikkerhetskvantifisering med conformal prediction | [`#konform`](https://morttra.github.io/ds-visual/#konform) | F8 |
| Nevrale nettverk og CNN | [`#nevrale-nett`](https://morttra.github.io/ds-visual/#nevrale-nett) | F9 |
| Hierarkisk klyngeanalyse | [`#hierarkisk-klynging`](https://morttra.github.io/ds-visual/#hierarkisk-klynging) | F10 |
| k-means klyngeanalyse | [`#k-means`](https://morttra.github.io/ds-visual/#k-means) | F10 |
| Store språkmodeller og temperatur | [`#sprakmodeller`](https://morttra.github.io/ds-visual/#sprakmodeller) | F11 |
| Prompting, RAG, finjustering og etikk | [`#rag`](https://morttra.github.io/ds-visual/#rag) | F11 |
| Datasettene | [`#datasett`](https://morttra.github.io/ds-visual/#datasett) | – |
| Ordliste | [`#ordliste`](https://morttra.github.io/ds-visual/#ordliste) | – |

Ett enkelt datasett eller begrep kan også lenkes direkte, for eksempel [`#datasett-toyota`](https://morttra.github.io/ds-visual/#datasett-toyota) eller [`#ordliste-aic`](https://morttra.github.io/ds-visual/#ordliste-aic).

## Oppdatere siden

1. Endre filene i `src/`.
2. Bygg `index.html` på nytt:

   ```
   python3 tools/build.py
   ```

3. Commit og push. GitHub Pages oppdaterer siden etter et par minutter:

   ```
   git add -A
   git commit -m "Beskriv endringen"
   git push
   ```

## Lag din egen kopi

Trykk **Fork** på GitHub. Gå så til **Settings → Pages** i din kopi, velg **Source: Deploy from a branch**, branch `main` og mappen `/ (root)`, og trykk **Save**. Siden kommer på `https://BRUKERNAVN.github.io/ds-visual/`. GitHub Pages er gratis for offentlige repoer.

## Innhold

| Fil eller mappe | Hva |
|---|---|
| `index.html` | Hele siden i én fil, bygget fra `src/`. Kan også åpnes rett i nettleseren uten server. |
| `src/styles.css` | Utseende, med lyst og mørkt tema. |
| `src/lib.js` | Hjelpefunksjoner: SVG-plott, glidebrytere, tilfeldige tall, lineær algebra. |
| `src/app.js` | Metodetreet på forsiden, sidemalen og navigasjonen. |
| `src/datasets.js` | Beskrivelsene av datasettene: «Om dataene»-kortene og siden `#datasett`. |
| `src/ordliste.js` | Ordlisten, siden `#ordliste` og de automatiske lenkene fra temasidene. |
| `src/data.js` | Forhåndsberegnede data og resultater fra lærebokas datasett. |
| `src/topics/*.js` | Ett eller flere temaer per fil, med figurer og tekst. |
| `tools/build.py` | Setter sammen `src/` til `index.html`. |
| `tools/precompute.py` | Lager `src/data.js` fra lærebokas datasett. |

## Endre eller legge til et tema

Hvert tema registreres med `topic({ ... })` i en fil i `src/topics/`:

- `id`: navnet i adressen (`#id`). Bruk små bokstaver, tall og bindestrek.
- `title`, `lead`, `lecture`, `tags`, `path`: overskrift, ingress, forelesning og plassering i treet.
- `data`: datasettene siden bruker, for eksempel `[['toyota'], ['ub', ['Personal Loan', 'Income']]]`. Det andre elementet velger hvilke variabler kortet viser. Beskrivelsene ligger i `src/datasets.js`.
- `dataNote`: en kort merknad når siden bruker simulerte eller oppdiktede data.
- `figs`: liste med figurer. Hver figur har `title`, `sub`, `build(el)` som tegner figuren, og `tryit` med forslag til hva man kan prøve.
- `body`: den skriftlige forklaringen som HTML.

Legg `id` inn i `ORDER` og i `TREE_LEAVES` i `src/app.js`, legg filen til i `topics` i `tools/build.py` hvis den er ny, og bygg på nytt.

Et nytt begrep i ordlisten legges til i `GLOSSARY` i `src/ordliste.js`. Feltet `m` er mønsteret som gjør at begrepet lenkes automatisk på temasidene. `ci: 1` gjør søket uavhengig av store og små bokstaver.

Skal dataene beregnes på nytt (krever `pip install mlba scikit-learn pandas numpy`):

```
python3 tools/precompute.py
python3 tools/build.py
```

## Kilder og forbehold

- Datasettene (Riding Mowers, Universal Bank, Toyota Corolla, Cereals, Utilities og terskeleksempelet) kommer fra Python-pakken `mlba` som følger læreboka: Shmueli, G., Bruce, P. C., Gedeck, P., Yahav, I. og Patel, N. R., *Machine Learning for Business Analytics: Concepts, Techniques and Applications in Python*, Wiley.
- Noen figurer bruker simulerte data. Det står i figurteksten.
- Teksten er skrevet med egne ord. Ingen lysbilder eller eksamensløsninger er kopiert.
- Laget med hjelp av Claude.
