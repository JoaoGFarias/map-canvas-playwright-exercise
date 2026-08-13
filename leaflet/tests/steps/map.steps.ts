import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, When, Then } = createBdd();

// Leaflet takes [lat, lng]; the sibling Mapbox project takes [lng, lat] for
// the same coordinates — mixing the two silently reprojects to the wrong
// hemisphere instead of erroring.
const FIRE_RISK_ZONE_CENTER: [number, number] = [37.7749, -122.4194];
const FIXED_ZOOM = 9;

declare global {
  interface Window {
    map: L.Map;
    tileLayer: L.TileLayer;
  }
}

type ScreenPoint = { x: number; y: number };

Given('the map page is open', async ({ page }) => {
  await page.goto('/');
  await waitForMapAndTileLayerToExist(page);
});

async function waitForMapAndTileLayerToExist(page: Page) {
  await page.waitForFunction(() => window.map !== undefined && window.tileLayer !== undefined);
}

When('I force the map to center on the fire-risk zone at a fixed zoom', async ({ page }) => {
  await setMapViewTo(page, FIRE_RISK_ZONE_CENTER, FIXED_ZOOM);
});

async function setMapViewTo(page: Page, center: [number, number], zoom: number) {
  // animate: false — Leaflet's equivalent of MapLibre's jumpTo: instant
  // camera move, no animation-timing flakiness.
  await page.evaluate(
    ({ center, zoom }) => window.map.setView(center, zoom, { animate: false }),
    { center, zoom },
  );
}

When('I wait for the basemap tiles to finish loading', async ({ page }) => {
  await waitForTileLayerToLoad(page);
});

async function waitForTileLayerToLoad(page: Page) {
  // once('load', ...) registered after tiles already finished would never
  // resolve, so the already-loaded case must be checked explicitly first.
  await page.evaluate(() => new Promise<void>((resolve) => {
    if ((window.tileLayer as any)._loading === false) {
      resolve();
    } else {
      window.tileLayer.once('load', () => resolve());
    }
  }));
}

Then("clicking the canvas at the fire-risk zone's projected pixel coordinate should hit inside the zone", async ({ page }) => {
  const fireRiskZoneCanvasPoint = await projectToCanvasPoint(page, FIRE_RISK_ZONE_CENTER);

  await clickOverlayCanvasAt(page, fireRiskZoneCanvasPoint);
  await expectPointToBeFireRiskZoneColored(page, fireRiskZoneCanvasPoint);
});

async function projectToCanvasPoint(page: Page, latLng: [number, number]): Promise<ScreenPoint> {
  // latLngToContainerPoint is relative to the map pane, but Leaflet's
  // canvas renderer positions its <canvas> element on a padded, CSS-translated
  // offset from that pane (it over-renders past the viewport so panning
  // doesn't need an immediate repaint) — so the container point has to be
  // re-based onto the canvas element's own bounding box before it's a valid
  // canvas-local pixel coordinate for click()/getImageData() alike.
  return page.evaluate(({ latLng }) => {
    const containerPoint = window.map.latLngToContainerPoint(latLng);
    const mapRect = window.map.getContainer().getBoundingClientRect();
    const canvasEl = document.querySelector('.leaflet-overlay-pane canvas') as HTMLCanvasElement;
    const canvasRect = canvasEl.getBoundingClientRect();
    return {
      x: mapRect.left + containerPoint.x - canvasRect.left,
      y: mapRect.top + containerPoint.y - canvasRect.top,
    };
  }, { latLng });
}

async function clickOverlayCanvasAt(page: Page, point: ScreenPoint) {
  await page.locator('.leaflet-overlay-pane canvas').click({ position: point });
}

async function expectPointToBeFireRiskZoneColored(page: Page, point: ScreenPoint) {
  const [red, green, blue] = await readCanvasPixelAt(page, point);
  // Canvas2D pixel sampling is reliable here because preferCanvas renders to
  // a real 2D context; the sibling Mapbox project uses WebGL, whose
  // framebuffer isn't readable this way without extra setup. Assert red
  // dominance, not an exact RGB match, since the fill is alpha-composited
  // over whatever basemap tile color sits underneath.
  expect(red).toBeGreaterThan(green);
  expect(red).toBeGreaterThan(blue);
}

async function readCanvasPixelAt(page: Page, point: ScreenPoint): Promise<[number, number, number, number]> {
  return page.evaluate(({ point }) => {
    const canvasEl = document.querySelector('.leaflet-overlay-pane canvas') as HTMLCanvasElement;
    const ctx = canvasEl.getContext('2d')!;
    const data = ctx.getImageData(point.x, point.y, 1, 1).data;
    return Array.from(data) as [number, number, number, number];
  }, { point });
}

Then('I can click the fire-risk zone marker by its real DOM selector', async ({ page }) => {
  await clickFireRiskZoneMarker(page);
  await expectFireRiskZonePopupToBeVisible(page);
});

async function clickFireRiskZoneMarker(page: Page) {
  // Unlike the canvas-rendered polygon, Leaflet markers are real DOM nodes —
  // no coordinate projection needed, a normal locator click works.
  await page.locator('.leaflet-marker-icon').click();
}

async function expectFireRiskZonePopupToBeVisible(page: Page) {
  await expect(page.locator('.leaflet-popup-content')).toContainText('Fire risk zone center');
}
