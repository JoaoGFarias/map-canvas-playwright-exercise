import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, When, Then } = createBdd();

const FIRE_RISK_ZONE_CENTER: [number, number] = [-122.4194, 37.7749];
const FIRE_RISK_ZONE_ZOOM = 9;
const FIRE_RISK_ZONE_FILL_LAYER = 'fire-risk-zone-fill';

declare global {
  interface Window {
    map: maplibregl.Map;
  }
}

type ScreenPoint = { x: number; y: number };

async function waitForMapToExist(page: Page) {
  await page.waitForFunction(() => window.map !== undefined);
}

async function jumpMapTo(page: Page, center: [number, number], zoom: number) {
  // jumpTo, not flyTo/easeTo: instant camera move, no animation-timing flakiness.
  await page.evaluate(
    ({ center, zoom }) => window.map.jumpTo({ center, zoom }),
    { center, zoom },
  );
}

async function waitForMapToBeIdle(page: Page) {
  // 'idle' (not 'load'): fires after tiles finish and the fire-risk-zone
  // layers, added inside map.js's own 'load' handler, have actually painted.
  await page.evaluate(() => new Promise<void>((resolve) => window.map.once('idle', resolve)));
}

async function projectToScreenPoint(page: Page, lngLat: [number, number]): Promise<ScreenPoint> {
  // Derived from the map's own projection API, not a hardcoded pixel guess.
  return page.evaluate(({ lngLat }) => {
    const projected = window.map.project(lngLat);
    return { x: projected.x, y: projected.y };
  }, { lngLat });
}

async function clickMapCanvasAt(page: Page, point: ScreenPoint) {
  // force: true — the fire-risk-zone center is also where map.js places its
  // marker pin, an overlaid DOM element that would otherwise block Playwright's
  // actionability check. queryFeaturesRenderedAt below is the real proof the
  // click landed correctly, not the DOM hit-test.
  await page.locator('#map canvas').first().click({ position: point, force: true });
}

async function queryFeaturesRenderedAt(page: Page, point: ScreenPoint, layer: string) {
  // WebGL canvas has no reliable Canvas2D pixel read-back, so the hit-test
  // is done via MapLibre's own render query instead of a screenshot diff.
  return page.evaluate(
    ({ point, layer }) => window.map.queryRenderedFeatures([point.x, point.y], { layers: [layer] }),
    { point, layer },
  );
}

Given('the map page is open', async ({ page }) => {
  await page.goto('/');
  await waitForMapToExist(page);
});

When('I force the map to center on the fire-risk zone at a fixed zoom', async ({ page }) => {
  await jumpMapTo(page, FIRE_RISK_ZONE_CENTER, FIRE_RISK_ZONE_ZOOM);
});

When('I wait for the map to become idle', async ({ page }) => {
  await waitForMapToBeIdle(page);
});

Then("clicking the canvas at the fire-risk zone's projected pixel coordinate should hit inside the zone", async ({ page }) => {
  const fireRiskZoneScreenPoint = await projectToScreenPoint(page, FIRE_RISK_ZONE_CENTER);

  await clickMapCanvasAt(page, fireRiskZoneScreenPoint);

  const hits = await queryFeaturesRenderedAt(page, fireRiskZoneScreenPoint, FIRE_RISK_ZONE_FILL_LAYER);
  expect(hits.length).toBeGreaterThan(0);
});
