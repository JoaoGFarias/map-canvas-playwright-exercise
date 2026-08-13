import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, When, Then } = createBdd();

const FIRE_RISK_ZONE_CENTER: [number, number] = [-122.4194, 37.7749];
const FIRE_RISK_ZONE_ZOOM = 9;

declare global {
  interface Window {
    map: maplibregl.Map;
  }
}

Given('the map page is open', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.map !== undefined);
});

When('I force the map to center on the fire-risk zone at a fixed zoom', async ({ page }) => {
  // jumpTo, not flyTo/easeTo: instant camera move, no animation-timing flakiness.
  await page.evaluate(
    ({ center, zoom }) => window.map.jumpTo({ center, zoom }),
    { center: FIRE_RISK_ZONE_CENTER, zoom: FIRE_RISK_ZONE_ZOOM },
  );
});

When('I wait for the map to become idle', async ({ page }) => {
  // 'idle' (not 'load'): fires after tiles finish and the fire-risk-zone
  // layers, added inside map.js's own 'load' handler, have actually painted.
  await page.evaluate(() => new Promise<void>((resolve) => window.map.once('idle', resolve)));
});

Then("clicking the canvas at the fire-risk zone's projected pixel coordinate should hit inside the zone", async ({ page }) => {
  // Derived from the map's own projection API, not a hardcoded pixel guess.
  const point = await page.evaluate(({ center }) => {
    const projected = window.map.project(center);
    return { x: projected.x, y: projected.y };
  }, { center: FIRE_RISK_ZONE_CENTER });

  // force: true — the fire-risk-zone center is also where map.js places its
  // marker pin, an overlaid DOM element that would otherwise block Playwright's
  // actionability check. The queryRenderedFeatures assertion below is the
  // real proof the click landed correctly, not the DOM hit-test.
  await page.locator('#map canvas').first().click({ position: point, force: true });

  // WebGL canvas has no reliable Canvas2D pixel read-back, so the hit-test
  // is done via MapLibre's own render query instead of a screenshot diff.
  const hits = await page.evaluate(
    ({ point }) => window.map.queryRenderedFeatures([point.x, point.y], { layers: ['fire-risk-zone-fill'] }),
    { point },
  );

  expect(hits.length).toBeGreaterThan(0);
});
