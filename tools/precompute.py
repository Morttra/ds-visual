"""Forhåndsberegner data fra lærebokas datasett (mlba) og skriver src/data.js."""
import json, itertools, warnings
import numpy as np, pandas as pd
import mlba
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")
out = {}
r = lambda v, d=4: float(round(float(v), d))

# 1. Riding Mowers
m = mlba.load_data('RidingMowers.csv')
out['mowers'] = [[r(a.Income, 1), r(a.Lot_Size, 1), 1 if a.Ownership == 'Owner' else 0] for a in m.itertuples()]

# 2. Terskeleksempelet (ownerExample)
o = mlba.load_data('ownerExample.csv').sort_values('Probability', ascending=False)
out['owner'] = [[r(a.Probability), 1 if a.Class == 'owner' else 0] for a in o.itertuples()]

# 3. Cereals: kalorier og rating + PVE for alle numeriske, standardisert
c = mlba.load_data('Cereals.csv')
out['cereals'] = [[a.name, int(a.calories), r(a.rating, 2)] for a in c.itertuples()]
num = c.select_dtypes('number').dropna()
z = (num - num.mean()) / num.std()
U, S, Vt = np.linalg.svd(z.values, full_matrices=False)
var = S**2 / (len(z) - 1)
out['cerealPVE'] = [r(v) for v in var / var.sum()]
out['cerealPC1'] = sorted([[col, r(w, 3)] for col, w in zip(num.columns, Vt[0])], key=lambda t: -abs(t[1]))
out['cerealN'] = int(len(z))

# 4. Utilities: Sales og Fuel_Cost
u = mlba.load_data('Utilities.csv')
out['utilities'] = [[a.Company, int(a.Sales), r(a.Fuel_Cost, 3)] for a in u.itertuples()]

# 5. Toyota Corolla (som i læreboka: første 1000 rader, 60/40, random_state=1)
t = mlba.load_data('ToyotaCorolla.csv').iloc[0:1000]
preds = ['Age_08_04', 'KM', 'Fuel_Type', 'HP', 'Met_Color', 'Automatic', 'CC', 'Doors', 'Quarterly_Tax', 'Weight']
X = pd.get_dummies(t[preds], drop_first=True).astype(float)
y = t['Price'].astype(float)
Xtr, Xva, ytr, yva = train_test_split(X, y, test_size=0.4, random_state=1)
cols = list(X.columns)
out['toyotaCols'] = cols

# 5a. Lite utvalg for minste kvadrater (alder mot pris)
rs = np.random.RandomState(7)
idx = rs.choice(len(Xtr), 30, replace=False)
out['toyotaLSQ'] = [[int(Xtr.iloc[i]['Age_08_04']), int(ytr.iloc[i])] for i in idx]

# 5b. Uttømmende søk, forward og backward (AIC som i læreboka)
def fit(vs):
    lm = LinearRegression().fit(Xtr[vs], ytr)
    return lm
def aic(vs):
    lm = fit(vs)
    return mlba.AIC_score(y_true=ytr, y_pred=lm.predict(Xtr[vs]), model=lm)
best = {}
for k in range(1, len(cols) + 1):
    bestk = None
    for vs in itertools.combinations(cols, k):
        vs = list(vs)
        lm = fit(vs)
        pred = lm.predict(Xtr[vs])
        r2 = 1 - ((ytr - pred)**2).sum() / ((ytr - ytr.mean())**2).sum()
        if bestk is None or r2 > bestk[0]:
            bestk = (r2, vs, lm, pred)
    r2, vs, lm, pred = bestk
    best[k] = dict(k=k, vars=vs, r2=r(r2), adjr2=r(mlba.adjusted_r2_score(y_true=ytr, y_pred=pred, model=lm)),
                   aic=r(mlba.AIC_score(y_true=ytr, y_pred=pred, model=lm), 1))
out['toyotaExhaustive'] = [best[k] for k in sorted(best)]
out['toyotaNModels'] = 2**len(cols) - 1

# Forward: start tomt, legg til variabelen som gir lavest AIC, stopp når ingen forbedrer
def score_empty():
    pred = np.full(len(ytr), ytr.mean())
    return mlba.AIC_score(y_true=ytr, y_pred=pred, df=1)
cur, path, cur_aic = [], [], score_empty()
while True:
    cands = [(aic(cur + [v]), v) for v in cols if v not in cur]
    if not cands: break
    a, v = min(cands)
    if a >= cur_aic: break
    cur, cur_aic = cur + [v], a
    path.append([v, r(a, 1)])
out['toyotaForward'] = path
cur, bpath = list(cols), []
cur_aic = aic(cur)
while len(cur) > 1:
    cands = [(aic([w for w in cur if w != v]), v) for v in cur]
    a, v = min(cands)
    if a >= cur_aic: break
    cur, cur_aic = [w for w in cur if w != v], a
    bpath.append([v, r(a, 1)])
out['toyotaBackward'] = bpath
out['toyotaBackwardKept'] = cur

# 5c. Ridge- og lasso-stier på standardiserte forklaringsvariabler
sc = StandardScaler().fit(Xtr)
Ztr, Zva = sc.transform(Xtr), sc.transform(Xva)
la = np.logspace(0, 3.6, 37)
ra = np.logspace(-1, 4.6, 39)
def path_of(Model, alphas):
    res = []
    for a in alphas:
        mdl = Model(alpha=a, max_iter=200000).fit(Ztr, ytr) if Model is Lasso else Model(alpha=a).fit(Ztr, ytr)
        rmse = float(np.sqrt(((yva - mdl.predict(Zva))**2).mean()))
        res.append(dict(a=r(a, 3), coef=[r(v, 1) for v in mdl.coef_], rmse=r(rmse, 1)))
    return res
out['lassoPath'] = path_of(Lasso, la)
out['ridgePath'] = path_of(Ridge, ra)
ols = LinearRegression().fit(Ztr, ytr)
out['olsStdCoef'] = [r(v, 1) for v in ols.coef_]
out['olsStdRMSE'] = r(np.sqrt(((yva - ols.predict(Zva))**2).mean()), 1)

# 5d. Lineær modell for SHAP-waterfall (uskalerte variabler)
lm = LinearRegression().fit(Xtr, ytr)
means = Xtr.mean()
base = float(lm.predict(Xtr).mean())
cars = []
for i in [3, 11, 25, 40, 77, 120]:
    x = Xva.iloc[i]
    phi = [r(b * (x[c_] - means[c_]), 1) for b, c_ in zip(lm.coef_, cols)]
    cars.append(dict(x=[r(x[c_], 2) for c_ in cols], pred=r(lm.predict(Xva.iloc[[i]])[0], 1), actual=int(yva.iloc[i]), phi=phi))
out['shapLinear'] = dict(cols=cols, coef=[r(b, 6) for b in lm.coef_], means=[r(means[c_], 2) for c_ in cols], base=r(base, 1), cars=cars)

# 6. Universal Bank: inntekt mot Personal Loan (aggregert per unik inntekt)
ub = mlba.load_data('UniversalBank.csv')
g = ub.groupby('Income')['Personal Loan'].agg(['count', 'sum']).reset_index()
out['ubIncome'] = [[int(a.Income), int(a.count), int(a.sum)] for a in g.itertuples()]
# IRLS for kontroll
xv = ub['Income'].values.astype(float); yv = ub['Personal Loan'].values.astype(float)
Xm = np.column_stack([np.ones_like(xv), xv]); b = np.zeros(2)
for _ in range(50):
    p = 1 / (1 + np.exp(-Xm @ b)); W = p * (1 - p)
    b = b + np.linalg.solve(Xm.T @ (Xm * W[:, None]), Xm.T @ (yv - p))
out['ubMLE'] = [r(b[0], 5), r(b[1], 6)]

js = 'const DATA = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
open('src/data.js', 'w').write(js)
print('bytes', len(js))
print('cereal PVE', out['cerealPVE'][:5], 'n', out['cerealN'])
print('cereal PC1', out['cerealPC1'][:5])
print('exhaustive', [(d['k'], d['adjr2'], d['aic']) for d in out['toyotaExhaustive']])
print('forward', out['toyotaForward'])
print('backward', out['toyotaBackward'], out['toyotaBackwardKept'])
print('lasso nz', [(d['a'], sum(1 for v in d['coef'] if v != 0), d['rmse']) for d in out['lassoPath'][::4]])
print('ridge', [(d['a'], d['rmse']) for d in out['ridgePath'][::5]])
print('ols rmse', out['olsStdRMSE'], 'cols', cols)
print('ubMLE', out['ubMLE'], 'n unique incomes', len(out['ubIncome']))
print('shap base', out['shapLinear']['base'], [(c_['pred'], c_['actual']) for c_ in out['shapLinear']['cars']])
