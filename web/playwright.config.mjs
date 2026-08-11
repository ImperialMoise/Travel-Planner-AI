import {
  defineConfig,
  devices
} from '@playwright/test';

const localBaseURL =
  'http://127.0.0.1:4173';

const externalBaseURL =
  process.env.PLAYWRIGHT_BASE_URL || '';

const baseURL =
  externalBaseURL || localBaseURL;

export default defineConfig({
  testDir: './tests',

  timeout: 45_000,

  expect: {
    timeout: 10_000
  },

  fullyParallel: true,

  forbidOnly: Boolean(process.env.CI),

  retries: process.env.CI
    ? 2
    : 0,

  workers: process.env.CI
    ? 1
    : undefined,

  reporter: process.env.CI
    ? [
        ['line'],
        [
          'html',
          {
            open: 'never'
          }
        ]
      ]
    : [
        ['list'],
        [
          'html',
          {
            open: 'never'
          }
        ]
      ],

  use: {
    baseURL,

    trace: 'retain-on-failure',

    screenshot: 'only-on-failure',

    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'desktop-chromium',

      use: {
        ...devices['Desktop Chrome']
      }
    },

    {
      name: 'mobile-chromium',

      use: {
        ...devices['Pixel 7']
      }
    }
  ],

  webServer: externalBaseURL
    ? undefined
    : {
        command:
          'python3 -m http.server 4173 --directory dist',

        url: localBaseURL,

        reuseExistingServer:
          !process.env.CI,

        timeout: 120_000,

        stdout: 'ignore',

        stderr: 'pipe'
      }
});