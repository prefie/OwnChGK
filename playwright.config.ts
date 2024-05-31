import { defineConfig } from '@playwright/test';

export default defineConfig({
  fullyParallel: true,
  use: {
    browserName: 'firefox',
    headless: true,
    viewport: { width: 1200, height: 800 },
  }
});