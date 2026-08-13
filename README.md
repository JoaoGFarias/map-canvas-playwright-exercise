# Map Canvas Playwright Exercise

Hands-on exercise for testing canvas/map-rendered UI with Playwright — the pattern that transfers across any map library (Mapbox/MapLibre GL JS, Leaflet, OpenLayers, etc.), since rendered map features aren't part of the DOM and can't be found with normal selectors.

Two parallel implementations, same San Francisco fire-risk-zone scenario, showing where the testing approach diverges by rendering technology:

- **`mapbox/`** — [MapLibre GL JS](https://maplibre.org/) (WebGL, renders to a single `<canvas>`). No DOM nodes for map features at all — even the "click a marker" case only works because markers are a separate DOM overlay MapLibre manages outside the canvas.
- **`leaflet/`** — [Leaflet](https://leafletjs.com/) with `preferCanvas: true`. A genuine Canvas2D context, so unlike WebGL, in-page pixel sampling (`getImageData`) actually works reliably. Also demonstrates the DOM-vs-canvas contrast directly: markers stay real DOM nodes even under `preferCanvas`, while polygons don't.

## Quick start

```bash
make up      # install deps, start both dev servers
make test    # run both Playwright/Gherkin test suites
make down    # stop both servers
make reload  # down && up
```

- Mapbox page: http://localhost:8080
- Leaflet page: http://localhost:5173

## What each test suite proves

Both suites use [Gherkin](https://cucumber.io/docs/gherkin/) feature files (`tests/*.feature`) via [`playwright-bdd`](https://github.com/vitalets/playwright-bdd), with step definitions in `tests/steps/map.steps.ts`.

Core scenario (both projects): the map boots at a neutral world view — not at the fire-risk zone under test — so the test must force the camera to a fixed center/zoom itself before asserting anything, the same way a real app never boots already looking at the place under test.

1. **Force a fixed view** — `jumpTo` (Mapbox) / `setView({ animate: false })` (Leaflet). Instant camera move, no animation-timing flakiness.
2. **Wait for render-complete** — `idle` event (Mapbox) / tile layer `load` event (Leaflet), not just page-load, since WebGL/canvas rendering lags behind it.
3. **Click the canvas at a fixed pixel** — derived from the map library's own coordinate-projection API (`map.project()` / `map.latLngToContainerPoint()`), never a hardcoded pixel guess.
4. **Verify the click landed correctly** — `queryRenderedFeatures()` (Mapbox, since WebGL has no reliable pixel read-back) vs. real `getImageData()` color sampling (Leaflet, since it's genuine Canvas2D).

Leaflet's suite adds a second scenario clicking the DOM marker directly via a real locator — no coordinate math needed — to make the DOM-vs-canvas contrast explicit in the spec itself.

## Determinism patterns demonstrated

- Fixed viewport size (`playwright.config.ts`)
- Fixed zoom/center, forced by the test, not inherited from a hardcoded production default
- Wait for the library's own render-complete signal, not generic page-load
- Coordinate-based interaction, since there's no selector to click
- Sequential test execution (`workers: 1`) — parallel workers competing for GPU/canvas rendering is a known flakiness source
