import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'tests/*.feature',
  steps: 'tests/steps/*.ts',
});

export default defineConfig({
  // playwright-bdd generates plain .spec.js files from the .feature +
  // steps files; testDir must point at its output directory, not the
  // Gherkin sources.
  testDir,
  // Sequential: parallel workers competing for GPU/canvas rendering is a
  // known flakiness source for screenshot/pixel-based canvas assertions.
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    // Pixel coordinates in the tests are only valid at this exact size.
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: 'npm start',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
