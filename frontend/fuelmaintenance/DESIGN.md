# FuelMaintenance — frontend design system

This document is the hand-off reference for the public landing page, the auth
pages, and the authenticated dashboard shell. It records the **design tokens**,
the **component library**, the **animation rules**, and the **PWA/offline**
setup so the Flutter app (and any future web work) can mirror the same system.

Stack: **React + Vite**, **react-router-dom** for routing, **vite-plugin-pwa**
for the service worker, **oxlint** for linting. Plain JavaScript (no
TypeScript). Tailwind is present but the app uses the token system below, not
utility classes.

---

## 1. Brand

The product name lives in exactly one place:

```js
// src/config/brand.js
export const APP_NAME = 'FuelMaintenance'
```

Never hardcode the name in a component — import `APP_NAME`. The same goes for
`APP_TAGLINE` and `APP_DESCRIPTION`.

---

## 2. Design tokens

All tokens are CSS custom properties defined in
[`src/styles/tokens.css`](../src/styles/tokens.css). There are **two themes**:
**light** (default — used by the landing page) and **dark** (a car dashboard at
night). Themes are switchable and respect `prefers-color-scheme`.

### 2.1 How theming works

1. `tokens.css` defines light values on `:root`.
2. A `@media (prefers-color-scheme: dark)` block overrides them — but only on
   `:root:not([data-theme='light'])`, so an explicit choice always wins.
3. `:root[data-theme='dark']` / `:root[data-theme='light']` apply the explicit
   override.
4. `src/styles/ThemeContext.jsx` (`ThemeProvider`) persists the choice to
   `localStorage` under **`fuelmaintenance.theme`** (`'light' | 'dark'`, or
   removed for `'system'`) and writes `data-theme` onto `<html>`.
5. An inline script in `index.html` reads the same key **before first paint**
   to set `data-theme` and avoid a flash of the wrong theme (FOUC).
6. `src/components/ui/ThemeToggle.jsx` cycles **light → dark → system**.

The context object lives in `src/styles/theme-context.js` and the consumer hook
`useTheme()` in `src/styles/useTheme.js` (split out so React Fast Refresh keeps
working — a `.jsx` file must only export components).

### 2.2 Palette

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--fm-accent` | `#0ea5c4` | `#42d8f4` | Primary accent — gauge needle, route line, links |
| `--fm-accent-strong` | `#0891b2` | `#7ae8fa` | Hover / pressed accent |
| `--fm-accent-soft` | `rgba(14,165,196,.12)` | `rgba(66,216,244,.12)` | Accent tint fills |
| `--fm-ok` | `#16a34a` | `#4fe1a5` | **Status only** — synced / within range |
| `--fm-warn` | `#b45309` | `#ffb957` | **Status only** — service due, unusual |
| `--fm-danger` | `#dc2626` | `#ff8a8a` | **Status only** — errors, destination pin |
| `--fm-bg` | `#f4f7fb` | `#080f20` | Page background |
| `--fm-surface` | `#ffffff` | `#141e33` | Card surface |
| `--fm-surface-2` | `#eef3f9` | `#101a2d` | Recessed surface (inputs, auth art) |
| `--fm-ink` | `#0e1b2e` | `#f0f4ff` | Primary text |
| `--fm-ink-soft` | `#3d4c63` | `#c4cede` | Secondary text |
| `--fm-muted` | `#64748b` | `#9aa8c5` | Muted text / captions |
| `--fm-line` | `#dbe4ef` | `#1c2943` | Borders |
| `--fm-line-strong` | `#b9c7da` | `#35425b` | Emphasised borders |
| `--fm-map-grid` | `rgba(14,27,46,.07)` | `rgba(240,244,255,.06)` | Faint map/topographic grid |
| `--fm-shadow` / `--fm-shadow-sm` | soft navy | deeper black | Card elevation |

`--fm-ok`, `--fm-warn`, `--fm-danger` carry matching `*-bg` tokens for tinted
status banners.

### 2.3 Radius, spacing, type

```
--fm-radius-sm 5px   --fm-radius-md 9px   --fm-radius-lg 16px   --fm-radius-xl 24px
--fm-space-1 4px  ·2 8px  ·3 12px  ·4 16px  ·5 24px  ·6 32px  ·7 48px  ·8 80px
--fm-type-xs 10px ·sm 12px ·md 14px ·lg 20px ·xl 30px ·2xl 44px
--fm-type-hero clamp(40px, 7vw, 72px)
```

### 2.4 Typography

- Display: **Barlow Condensed** (`--fm-font-display`)
- Text/UI + all figures: **Space Mono** (`--fm-font-text`)
- Both are **self-hosted** in `public/fonts/` (latin subset `.woff2`, ~97 KB
  total) — **no runtime Google Fonts request**, because of offline-first and
  metered mobile data. Fallbacks: `Arial Narrow` / `system-ui` and
  `ui-monospace` / `SF Mono` / `Menlo`.
- All numbers use **tabular figures** (`font-variant-numeric: tabular-nums`) via
  the `.fm-tnum` utility, so UGX amounts never jitter while animating.

---

## 3. Component library

```
src/
  config/brand.js            APP_NAME / tagline / description
  styles/
    tokens.css               design tokens + light/dark themes
    theme-context.js         ThemeContext object (Fast-Refresh split)
    ThemeContext.jsx         ThemeProvider
    useTheme.js              useTheme() hook
    ui.css                   shared UI primitives + feedback styles
  components/
    animations.jsx           Reveal, Counter, RouteAnimation, Gauge, EngineLine, SyncIndicator
    LoginForm.jsx            sign-in form (validation, show/hide, remember-me)
    ui/ThemeToggle.jsx       light → dark → system toggle
    ui/Feedback.jsx          Skeleton, SkeletonCard, EmptyState
  pages/
    Landing.jsx / Landing.css
    Login.jsx / Register.jsx / Auth.css
    Dashboard.jsx / Dashboard.css (+ Fuel, Services, System, Telemetry, Trips)
  hooks/useSyncStatus.js     online/offline + pending sync count
  api/auth.js                Django token adapter (mock behind a flag)
  scripts/generate_icons.py  renders PWA PNG icons from favicon.svg
```

### 3.1 UI primitives (`ui.css`)

Classes used across pages: `.fm-btn` (+ `--primary` / `--ghost`), `.fm-card`
(+ `--lift`), `.fm-badge` (+ `--accent` / `--ok`), `.fm-eyebrow`, `.fm-muted`,
`.fm-section` (+ `--alt`), `.fm-wrap`, `.fm-grid` (+ `--3`), `.fm-split`,
`.fm-tabs`, `.fm-sr-only`, `.fm-route-fallback`.

### 3.2 Feedback (`components/ui/Feedback.jsx`)

- `Skeleton` — shimmering placeholder block.
- `SkeletonCard` — heading + body bars; used by the route fallback and empty
  loading states.
- `EmptyState` — icon + title + message + optional action.

These satisfy the "skeleton loaders and empty states for every card"
requirement.

---

## 4. Animation rules

Animation lives in small reusable components in
[`src/components/animations.jsx`](../src/components/animations.jsx).

| Component | Purpose |
| --- | --- |
| `Reveal` | Fade/slide a section in **once** when scrolled into view (IntersectionObserver, staggered via `data-delay`). |
| `Counter` | Animated integer counter that runs once visible; used for the maintenance countdown. |
| `RouteAnimation` | SVG GPS route that **draws itself** (`stroke-dashoffset`) with a marker travelling via `animateMotion` + floating stat chips. |
| `Gauge` | Speedometer-style dial; needle/arc animates into view. |
| `EngineLine` | Line-art engine with moving pistons + a pulsing warning light. |
| `SyncIndicator` | Offline → syncing → synced status pill (pure CSS pulse, `aria-live`). |

### Hard rules

- **Animate `transform` and `opacity` only** — never layout-thrashing
  properties.
- **No Three.js / WebGL / video backgrounds / large Lottie.** CSS + SVG only.
- **`prefers-reduced-motion`** is respected: `Counter` jumps to its end value;
  SVG/CSS transitions collapse to static end states via
  `@media (prefers-reduced-motion: reduce)` in the CSS.
- **Pause off-screen / hidden-tab** motion where relevant (SVG SMIL +
  IntersectionObserver-driven components naturally idle off-screen).
- Keep motion **cheap on budget phones** — short durations, GPU-friendly
  properties, no per-frame JS except the single `Counter` rAF loop.

---

## 5. Pages

- **Landing (`/`)** — sticky nav (anchors + theme toggle + Login/Get started,
  mobile menu), hero (animated route + gauges), feature grid, how-it-works
  timeline, cost-prediction showcase (range + predicted-vs-actual chart),
  maintenance section (engine line art + service countdown), works-offline
  section, cars-and-bikes toggle, packages, FAQ accordion, final CTA + footer.
  **No invented social proof** — sample figures are labelled "Sample data".
- **Auth (`/login`, `/register`)** — split layout: form one side, animated
  route/gauge artwork the other (art hidden < 900px). Validation messages,
  show/hide password, loading state, error state, remember-me. Offline note
  tells the user the page renders offline but sign-in needs the network.
- **Dashboard (`/dashboard`)** — sample-data cards (odometer, efficiency,
  fuel cost, distance), telemetry chart, next-service alert, predictive card,
  reminders, and sub-tabs (Telemetry / Fuel / Services / Trips / System).
  Top bar has the sync pill + theme toggle + vehicle switcher; bottom tab bar
  on mobile.

> Data is currently **sample/demo** data rendered from local component state.
> All data access is intended to go through hooks reading local storage (Dexie)
> first, never straight from the network. `useSyncStatus` and `api/auth.js` are
> the first wiring points; the auth API has a clearly-marked mock adapter
> behind a flag until the Django backend is connected.

---

## 6. PWA & offline

Configured with **`vite-plugin-pwa`** in `vite.config.js`:

- `registerType: 'autoUpdate'` — the shell updates itself in the background.
- A generated `manifest.webmanifest` (name, icons, `theme_color` `#0ea5c4`,
  `background_color`, `standalone`, `portrait`) linked automatically.
- `workbox` **precaches the entire app shell** — `index.html`, every route
  chunk (Landing/Login/Register/Dashboard + their CSS), all self-hosted fonts,
  and all PNG icons (23 assets). Verified: `sw.js` contains the full
  precache manifest, and every precached URL returns 200 from `dist`.
- `navigateFallback: 'index.html'` with `navigateFallbackDenylist: [/^\/api\//]`
  so SPA deep links work offline while API calls bypass the cache.
- `public/fonts/*.woff2` and `public/icons/*.png` are committed, so the shell
  needs **no network** after the first visit.
- `public/manifest.webmanifest` is intentionally **not** committed — the plugin
  is the single source of truth.

**Offline behaviour:** `/` and `/login` render from the SW cache with no
network. Sign-in itself may require the network the first time; the auth pages
show a clear offline message (`.fm-offline-note`) in that case.

Icons are generated by `scripts/generate_icons.py` (renders `favicon.svg` to
PNG at 192/512/180/32, plus maskable variants) — re-run it if the logo changes.
*Note: it uses a custom built-in rasteriser, so run it with `python3 scripts/generate_icons.py`.*

---

## 7. Accessibility & performance

- **Semantic HTML** (`header`/`nav`/`main`/`section`/`footer`, labelled
  sections via `aria-labelledby`), keyboard-navigable nav, visible focus
  states, labelled form fields, `role="alert"` error banners, `aria-pressed`
  toggles, `role="tablist"`/`progressbar` where appropriate.
- **`aria-live`** on the sync-status pill so online/offline changes announce.
- **WCAG AA contrast** targeted in both themes (status colours kept distinct;
  focus rings use `--fm-focus`).
- **Route-level code splitting** with `React.lazy` + `Suspense` (Landing eager
  as the entry shell; Login/Register/Dashboard load on demand) — confirmed by
  separate `Login-*`, `Register-*`, `Dashboard-*` chunks in the build output.
- **Below-the-fold** landing sections animate in on scroll; no large images —
  all artwork is inline, optimised SVG.
- Self-hosted latin-subset fonts keep the shell lightweight for slow/metered
  connections.


