"""Setter sammen src/ til én selvstendig dist/index.html."""
import pathlib, re, sys
root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'src'
order = ['lib.js', 'data.js', 'app.js']
topics = ['grunnmur.js', 'regresjon.js', 'klassifikasjon.js', 'traer.js', 'nevrale.js', 'genai.js', 'uveiledet.js', 'oppaa.js']
parts = []
for f in order + ['topics/' + t for t in topics]:
    p = src / f
    if p.exists():
        parts.append(f'/* ---- {f} ---- */\n' + p.read_text())
    else:
        print('mangler', f, file=sys.stderr)
parts.append("window.addEventListener('hashchange', route);\nif (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route); else route();")
js = '\n'.join(parts).replace('</script', '<\\/script')
css = (src / 'styles.css').read_text()
html = (src / 'index.template.html').read_text().replace('/*CSS*/', css).replace('/*JS*/', js)
out = root / (sys.argv[1] if len(sys.argv) > 1 else 'index.html')  # standard: index.html i roten, klar for GitHub Pages
out.write_text(html)
print(out, len(html) // 1024, 'KB')
