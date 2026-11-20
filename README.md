# BBAN4001 visuelt

Et klikkbart metodetre for pensum i BBAN4001 Data Science. Hver metode har en egen side med interaktive figurer øverst og en skriftlig forklaring under: kort fortalt, hvordan metoden virker, formler, hyperparametre, styrker og svakheter, typiske eksamensfeller og Python-kode i lærebokas stil.

Uoffisiell studiehjelp, ikke laget av faglærer. Sjekk alltid mot forelesningene og læreboka.

## Publiser med GitHub Pages

1. Lag et nytt, offentlig repository på GitHub, for eksempel `bban4001-visuelt`. Gratis GitHub Pages krever et offentlig repo.
2. Last opp innholdet i denne mappen. Enten dra filene inn med «Add file → Upload files» på GitHub, eller bruk Git:

   ```
   git init
   git add .
   git commit -m "Første versjon"
   git branch -M main
   git remote add origin https://github.com/BRUKERNAVN/bban4001-visuelt.git
   git push -u origin main
   ```

3. Gå til **Settings → Pages** i repoet.
4. Under **Build and deployment** velger du **Source: Deploy from a branch**, branch `main` og mappen `/ (root)`. Trykk **Save**.
5. Etter et par minutter ligger siden på `https://BRUKERNAVN.github.io/bban4001-visuelt/`.

Enkeltsider kan deles direkte, for eksempel `.../bban4001-visuelt/#knn` eller `#beslutningstraer`.

## Innhold

| Fil eller mappe | Hva |
|---|---|
| `index.html` | Hele siden i én fil. Kan også åpnes rett i nettleseren uten server. |
| `src/styles.css` | Utseende, med lyst og mørkt tema. |
| `src/lib.js` | Hjelpefunksjoner: SVG-plott, glidebrytere, tilfeldige tall, lineær algebra. |
| `src/app.js` | Metodetreet på forsiden, sidemalen og navigasjonen. |
| `src/data.js` | Forhåndsberegnede data fra lærebokas datasett. |
| `src/topics/*.js` | Ett eller flere temaer per fil, med figurer og tekst. |
| `tools/build.py` | Setter sammen `src/` til `index.html`. |
| `tools/precompute.py` | Lager `src/data.js` fra lærebokas datasett. |

## Endre eller legge til et tema

Hvert tema registreres med `topic({ ... })` i en fil i `src/topics/`:

- `id`: navnet i adressen (`#id`). Bruk små bokstaver, tall og bindestrek.
- `title`, `lead`, `lecture`, `tags`, `path`: overskrift, ingress, forelesning og plassering i treet.
- `figs`: liste med figurer. Hver figur har `title`, `sub`, `build(el)` som tegner figuren, og `tryit` med forslag til hva man kan prøve.
- `body`: den skriftlige forklaringen som HTML.

Legg `id` inn i `ORDER` og i `TREE_LEAVES` i `src/app.js`, og bygg på nytt:

```
python3 tools/build.py
```

Skal dataene beregnes på nytt (krever `pip install mlba scikit-learn pandas numpy`):

```
python3 tools/precompute.py
python3 tools/build.py
```

## Kilder og forbehold

- Datasettene (Riding Mowers, Universal Bank, Toyota Corolla, Cereals, Utilities og terskeleksemplet) kommer fra Python-pakken `mlba` som følger læreboka: Shmueli, G., Bruce, P. C., Gedeck, P., Yahav, I. og Patel, N. R., *Machine Learning for Business Analytics: Concepts, Techniques and Applications in Python*, Wiley.
- Noen figurer bruker simulerte data. Det står i figurteksten.
- Teksten er skrevet med egne ord. Ingen lysbilder eller eksamensløsninger er kopiert.
- Laget med hjelp av Claude.
# ds-visual
