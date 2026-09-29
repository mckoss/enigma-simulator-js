import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173/enigma-simulator-js/';

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL, ...devices['Desktop Chrome'] },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
