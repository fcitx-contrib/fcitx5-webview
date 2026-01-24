import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testIgnore: 'tests/unit/**',
  fullyParallel: true,
  projects: [{
    name: 'webkit',
    use: devices['Desktop Safari'],
  }]
})
