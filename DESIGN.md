# B08 — Design

Dark, monospace, quiet. One font, one accent color, thin borders, lots of muted gray.

All tokens live in [`static/css/tokens.css`](static/css/tokens.css), loaded in `baseof.html` before `style.css` and the demo stylesheets. Use `var(--…)` instead of literal values.

## Tokens

### Color

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0a0a0a` | page background |
| `--fg` | `#ededed` | primary text |
| `--muted` | `#c8c8c8` | secondary text, nav, h2 |
| `--faint` | `#9a9a9a` | meta, labels, stack, hints |
| `--accent` | `#bcd0f0` | links, hover, active states |
| `--border` | `#262626` | dividers, header/footer rules |
| `--border-strong` | `#383838` | boxes, buttons, chips |
| `--green` | `#7fb28a` | status *shipped* |
| `--amber` | `#d4b679` | status *wip*, priority medium |
| `--coral` | `#d4795f` | errors / check / blocked, priority high |
| `--green-bright` | `#5fb36a` | chess selection, map start |
| `--blue`, `--violet` | `#6ea8d8`, `#c79bd8` | signal tags (mining demo) |

Alpha variants follow `--<color>-<alpha%>`, e.g. `--accent-08` = accent at 8 %, `--black-50` = black at 50 % (used in shadows).
Component surfaces (logo gradient, T9 phone, keypad, chess board/pieces) have their own named tokens: `--logo-*`, `--phone-*`, `--key-*`, `--board-*`, `--piece-*`.

### Type

- **Font:** `--font`, i.e. IBM Plex Mono. It is self-hosted from `static/fonts/` (latin subset; 400, 400 italic, 500, 600, 700; OFL) and declared via `@font-face` in `tokens.css`. The regular weight is preloaded in `baseof.html`. Courier New and monospace are fallbacks only. Don't load it from Google Fonts (GDPR).
- **Weights:** `--fw-regular` 400 · `--fw-medium` 500 · `--fw-semibold` 600 · `--fw-bold` 700
- **Base:** `html { font-size: 16px }`, body line-height 1.7

Font-size scale:

| Token | rem | px | Role |
|---|---|---|---|
| `--fs-3xs` | 0.6 | 9.6 | micro labels (demos) |
| `--fs-2xs` | 0.68 | 10.9 | status badge, chips, small demo text |
| `--fs-xs` | 0.72 | 11.5 | meta, labels, footer, kicker |
| `--fs-sm` | 0.8 | 12.8 | nav, section h2 (uppercase), buttons, descriptions |
| `--fs-md` | 0.85 | 13.6 | secondary copy, tables, leads |
| `--fs-lg` | 0.92 | 14.7 | article body, list titles |
| `--fs-xl` | 1 | 16 | base, home h1, logo |
| `--fs-2xl` | 1.1 | 17.6 | article / case h1 |

Chess glyphs are sized relative to their board: `--fs-glyph-sm` (1.5rem, T9) and `--fs-glyph-lg` (1.9rem, Pirc).
Don't add sizes between these steps. Pick the nearest one.

### Spacing

`--sp-N` = N px at the 16px root, defined in rem on a 4px grid. The steps are `2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32 · 48`.
Use it for every margin, padding and gap, including the T9 phone mockup.

### Radii

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 4px | chips, tags, kbd, chess boards |
| `--radius-md` | 6px | buttons, logo, images, keys |
| `--radius-lg` | 12px | demo frames |
| `--radius-xl` | 20px | phone body, image pairs |
| `--radius-pill` | 999px | pills, progress bars |
| `--radius-full` | 50% | dots, portrait |

### Layout

`--max: 680px` is the content column width for header, main and footer. There is a single breakpoint at `max-width: 560px`.

### Not tokenized (on purpose)

- `theme-color` in `baseof.html` and the colors in `site.webmanifest` are `#0a0a0a`, because CSS variables can't be used there. Change them together with `--bg`.
- Component geometry (widths/heights such as the board size, phone width, image max-width), letter-spacing, line-heights and transitions stay local.
- `route-demo.js` reads `--green-bright`, `--coral` and `--accent` at runtime, because Leaflet writes colors into SVG attributes.

## Templates & building blocks

There is no `layouts/partials/` directory. Reusable pieces are the base layout and shortcodes.

### Layouts

| File | Purpose |
|---|---|
| `_default/baseof.html` | Shell: `<head>` (meta, OG, favicons, CSS, GoatCounter in production), header (logo, menu, LinkedIn/Mail icons), `main` block, footer (Pirc easter egg, legal links) |
| `index.html` | Home: kicker, intro, links |
| `_default/list.html` | Project index, split into *Contract* / *Personal* by `role`, sorted by `weight`, with a status badge |
| `_default/single.html` | Case study (`projects`: back link, head, meta row) or plain article |
| `about/single.html` | About page with portrait header and numbered h2s |
| `pirc/single.html` | Pirc easter egg: interactive opening walkthrough. Its CSS is inline in `<style>` and uses the tokens. |
| `404.html` | Not-found page, reuses `.home` styles |
| `_markup/render-link.html` | Link render hook |
| `robots.txt`, `sitemap.xml` | SEO output templates |

### Shortcodes

| Shortcode | Purpose | CSS |
|---|---|---|
| `asset-img` | Single image from `assets/` (`src`, `alt`, `wide`) | `.project-img` |
| `asset-img-pair` | Two images side by side, 2:1 grid | `.project-img-pair` |
| `muted` | Muted paragraph from inner Markdown | `.text-muted` |
| `social` | Mail/LinkedIn link with icon | `.social-link` |
| `mailto` | Plain email link | — |
| `mining-demo` | Social Mining demo: news inbox + staged AI analysis | `css/mining-demo.css`, `js/mining-demo.js` |
| `route-demo` | Navigator demo: Leaflet map + Valhalla routing with blocked streets | `css/route-demo.css`, `css/leaflet.css`, `js/route-demo.js` |
| `t9-demo` | T9 Chess demo: keypad phone mockup with a D-pad-driven board | `css/t9-demo.css`, `js/t9-demo.js` |

Demo stylesheets are loaded by their shortcode and rely on `tokens.css` from the base layout. Prefix their classes per demo (`md-`, `rd-`, `t9-`).
