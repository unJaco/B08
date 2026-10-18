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

- **Font:** `--font`, i.e. IBM Plex Mono with Courier New and monospace as fallbacks. Nothing loads it as a webfont, so it only shows if it is installed locally.
- **Weights:** `--fw-regular` 400 · `--fw-medium` 500 · `--fw-semibold` 600 · `--fw-bold` 700
- **Base:** `html { font-size: 16px }`, body line-height 1.7

Font sizes are named `--fs-N` = N/100 rem (`--fs-72` = 0.72rem). Core scale:

| Token | rem | px | Role |
|---|---|---|---|
| `--fs-72` | 0.72 | 11.5 | meta, labels, footer, status, kicker |
| `--fs-78` | 0.78 | 12.5 | section h2 (uppercase), buttons, back link |
| `--fs-82` | 0.82 | 13.1 | nav, list descriptions |
| `--fs-85` | 0.85 | 13.6 | secondary copy, tables |
| `--fs-92` | 0.92 | 14.7 | article body (p, li) |
| `--fs-95` | 0.95 | 15.2 | list titles, page head |
| `--fs-100` | 1 | 16 | base, home h1, logo |
| `--fs-110` | 1.1 | 17.6 | article / case h1 |

The demos also use one-off sizes between those steps (`--fs-58` … `--fs-90`), plus chess glyphs at `--fs-150` and `--fs-190`.

### Spacing

`--sp-N` = N/100 rem (`--sp-150` = 1.5rem), `--sp-Npx` = N px (used only inside the T9 phone mockup and `kbd`).
The common steps are `--sp-25`, `--sp-50`, `--sp-100`, `--sp-150`, `--sp-200` and `--sp-300`. Everything else is a one-off.

### Radii

`--radius-N` = N px: `2 · 3 · 4 · 5 · 6 · 8 · 12 · 16 · 20 · 22`, plus `--radius-full` (50 %, for dots and the portrait).
Typical choices: buttons and logo `6`, demo frames `12`, images `8`/`16`, pills `20`.

### Layout

`--max: 680px` is the content column width for header, main and footer. There is a single breakpoint at `max-width: 560px`.

### Not tokenized (on purpose)

- `theme-color` in `baseof.html` and the colors in `site.webmanifest` are `#0a0a0a`, because CSS variables can't be used there. Change them together with `--bg`.
- Component geometry (widths/heights such as the board size, phone width, image max-width), letter-spacing, line-heights and transitions stay local.
- `route-demo.js` reads `--green-bright`, `--coral` and `--accent` at runtime, because Leaflet writes colors into SVG attributes.

## Consolidation backlog

The scale grew organically: there are 23 font sizes and about 30 spacing values, several only 0.02rem apart. They were tokenized 1:1 so nothing would shift visually. Folding them into roughly 8 sizes and roughly 10 spacing steps is a separate, visible change.

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
