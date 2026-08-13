# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Two parallel, independent example projects (`mapbox/`, `leaflet/`) demonstrating Playwright testing patterns for canvas/map-rendered UI — content that isn't part of the DOM and can't be found with normal `page.locator()` selectors. Each folder is a self-contained static page + its own Playwright/Gherkin test suite; they don't import from or depend on each other. Same fire-risk-zone scenario in both, chosen to make the divergence between WebGL (Mapbox/MapLibre) and Canvas2D (Leaflet) rendering concrete.

## Commands

Run from the repo root:

```bash
make up      # npm install + start both dev servers (mapbox :8080, leaflet :5173)
make down    # stop both servers
make reload  # down && up
make test    # run both Playwright/Gherkin suites (mapbox, then leaflet)
```

Per-project, from inside `mapbox/` or `leaflet/`:

```bash
npm start    # node server.js — static file server for that project's page only
npm test     # bddgen && playwright test — generates specs from .feature files, then runs them
```

To run a single scenario, use Playwright's own `-g` grep flag against the generated spec (playwright-bdd compiles `.feature` files into `.features-gen/` before each run):

```bash
npx bddgen && npx playwright test -g "Force a fixed view and click the fire-risk zone"
```

No lint/typecheck script is configured in either project.

## Architecture

**Gherkin-to-Playwright bridge:** both projects use [`playwright-bdd`](https://github.com/vitalets/playwright-bdd), not `cucumber-js` directly. `tests/*.feature` files describe scenarios in Given/When/Then; `tests/steps/map.steps.ts` implements them. `playwright.config.ts` wires this via `defineBddConfig({ features, steps })`, whose return value becomes `testDir` — the config points at playwright-bdd's *generated* spec directory (`.features-gen/`, gitignored), not the Gherkin source files directly. The `test` npm script always runs `bddgen` before `playwright test` for this reason.

**Cross-boundary test hooks:** each page's `map.js` deliberately exposes its map instance as `window.map` (and `window.tileLayer` in leaflet/) purely so Playwright's `page.evaluate()` calls in the step definitions can reach it. This is the only reason those globals exist — don't remove them thinking they're leftover debug code.

**Deliberately mismatched boot state:** both maps construct at a neutral world view (`center: [0,0], zoom: 2`), not at the San Francisco fire-risk zone the tests exercise. This is intentional, not a bug — it forces every test to prove it moves the camera itself (`jumpTo` / `setView({ animate: false })`) rather than piggybacking on a hardcoded production default that happens to match. If you see a test relying on the initial view already matching its assertions, that's a regression in the pattern, not a simplification.

**Step-definition file structure follows the Stepdown Rule:** in both `tests/steps/map.steps.ts`, the `Given`/`When`/`Then` step registrations come first (top-down, in call order), each immediately followed by the private helper function(s) it calls. When adding a new step, insert it and its helpers in that same position — don't append new helpers to the bottom of the file.

**Why the two projects verify clicks differently:** this is the core lesson the repo demonstrates, not an inconsistency to fix.
- `mapbox/` (WebGL, single `<canvas>`) has no reliable in-page pixel read-back, so its `Then` step verifies via MapLibre's own `map.queryRenderedFeatures(point, { layers: [...] })` instead of a screenshot or `getImageData` call.
- `leaflet/` (`preferCanvas: true`, a real Canvas2D context) verifies via genuine `canvas.getContext('2d').getImageData(x, y, 1, 1)` pixel sampling, asserting red-channel dominance rather than an exact RGB match (the fill is alpha-composited over whatever basemap tile sits underneath).
- `leaflet/` also has a second scenario clicking a DOM marker (`.leaflet-marker-icon`) via a normal locator — no coordinate math — to contrast against the canvas-rendered polygon in the same file. `mapbox/` mirrors this with its own marker/popup scenario, though MapLibre markers use a different selector (`.maplibregl-marker`) and don't need Leaflet's container-point-to-canvas-local-pixel rebasing step.

**Leaflet's canvas pixel coordinates need re-basing:** `map.latLngToContainerPoint()` returns a point relative to the map pane, but Leaflet's canvas renderer positions its `<canvas>` element on a padded, CSS-translated offset from that pane (it over-renders past the viewport so panning doesn't need an immediate repaint). `projectToCanvasPoint()` in `leaflet/tests/steps/map.steps.ts` re-bases through the canvas element's own `getBoundingClientRect()` before the point is valid for both `.click()` and `getImageData()`. Mapbox's `map.project()` needs no equivalent step — MapLibre's canvas fills its container exactly.

**Coordinate order gotcha:** Mapbox/MapLibre APIs take `[lng, lat]`; Leaflet APIs take `[lat, lng]`. Both `map.js` files define the same San Francisco fire-risk-zone location, in each library's native order — mixing the two silently reprojects to the wrong hemisphere instead of erroring, so don't copy a coordinate pair across projects without swapping the order.
