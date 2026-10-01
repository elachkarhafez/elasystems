# elasystems.com

Static one-page site for ElaSystems (Detroit: websites, apps, business systems), served by GitHub Pages from the
root of this repository (`CNAME` keeps the domain).

## Editing

Edit the sources in `src/`, then rebuild. The generated files at the root (`index.html`, `css/site.css`,
`js/site.js`) are committed so GitHub Pages can serve them without a build step.

```
node tools/build.mjs              # writes index.html, css/site.css, js/site.js at the repo root
node tools/build.mjs --out DIR    # same three files into DIR (for isolated testing), assets symlinked
node tools/build.mjs --pretty     # keep comments and indentation in the generated css/js (default: stripped)
```

- `src/index.template.html` — the document shell. `<!-- @partial name -->` pulls in `src/partials/<name>.html`.
- `src/partials/*.html` — one file per section (hero, pillars, diagnose, work, apps, systems, contact, footer, chrome).
- `src/css/NN-*.css` — concatenated in filename order. Tokens live in `00-tokens.css`.
- `src/js/NN-*.js` — concatenated in filename order. `00-core.js` is the shared layer (`window.ES`: the one
  requestAnimationFrame loop with lerps, the IntersectionObserver reveals, the film layer, the haze, the reduced-motion
  switch), `01-scroll.js` the scroll layer (Lenis on fine pointers, the film-cut dips, scene state, scrollTo with focus),
  the rest are per-scene behaviours.
- `js/vendor/` — Lenis 1.1.18 (standard licence).
- `brand/`, `work/`, `apps/`, `fonts/` — assets. Portfolio captures are the clients' own sites; never add third-party images.

## Rules that do not change

- The primary call to action is a text message: `sms:+13133006898`, labelled "Text 313-300-6898" / "Text us".
  Also `tel:+13133006898` and `mailto:elasystemdesign@gmail.com`.
- Portfolio shows names, screenshots and links only. No counts, ratings, results or testimonials anywhere.
- App screens are labelled concept work; dashboards are "recreated for illustration, sample data".
- No unsourced numbers or claims. `prefers-reduced-motion` and the footer "Reduce effects" toggle give a still page:
  every scene in its final state, no film-layer motion, no fades.

## Local preview

```
python3 -m http.server 8787 --bind 127.0.0.1      # then open http://127.0.0.1:8787/
```
