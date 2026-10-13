import { defineConfig, devices } from '@playwright/test'
import { networkInterfaces } from 'node:os'
import { ports, urls } from './support/urls.ts'

const externalAddress = Object.values(networkInterfaces())
	.flat()
	.find((item) => item?.family === 'IPv4' && !item.internal)?.address

const DATABASE_URL =
	process.env.DATABASE_URL ?? 'postgres://messd:messd@localhost:5432/messd'
const fakeMedia = ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
const firefoxMedia = {
	'media.navigator.streams.fake': true,
	'media.navigator.permission.disabled': true,
}

export default defineConfig({
	testDir: './specs',
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 2 : 4,
	timeout: 60_000,
	expect: { timeout: 10_000 },
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: urls.web,
		locale: 'ru-RU',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
	},
	projects: [
		{ name: 'api', testMatch: /api\/.*\.spec\.ts/, use: { baseURL: urls.api } },
		{ name: 'signaling', testMatch: /signaling\/.*\.spec\.ts/ },
		{
			name: 'desktop-chromium',
			testMatch: /ui\/.*\.spec\.ts/,
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: 1280, height: 800 },
				permissions: ['camera', 'microphone'],
				launchOptions: { args: fakeMedia },
			},
		},
		{
			name: 'mobile-chromium',
			testMatch: /ui\/.*\.spec\.ts/,
			use: {
				...devices['Pixel 7'],
				viewport: { width: 390, height: 844 },
				permissions: ['camera', 'microphone'],
				launchOptions: { args: fakeMedia },
			},
		},
		{
			name: 'desktop-firefox',
			testMatch: /ui\/.*\.spec\.ts/,
			use: {
				...devices['Desktop Firefox'],
				viewport: { width: 1280, height: 800 },
				launchOptions: { firefoxUserPrefs: firefoxMedia },
			},
		},
		{
			name: 'desktop-webkit',
			testMatch: /ui\/.*\.spec\.ts/,
			grepInvert: /@media/,
			use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 800 } },
		},
	],
	webServer: [
		{
			command: 'node src/server.ts',
			cwd: '../../apps/api',
			url: `${urls.api}/api/health`,
			reuseExistingServer: !process.env.CI,
			env: {
				NODE_ENV: 'test',
				LOG_LEVEL: 'warn',
				DATABASE_URL,
				API_PORT: String(ports.api),
				RATE_LIMIT_MAX: '10000',
			},
		},
		{
			command: 'node src/server.ts',
			cwd: '../../apps/core',
			url: `http://localhost:${ports.core}/health`,
			reuseExistingServer: !process.env.CI,
			env: {
				NODE_ENV: 'test',
				LOG_LEVEL: 'warn',
				DATABASE_URL,
				CORE_PORT: String(ports.core),
				RTC_PORT: String(ports.rtc),
				RTC_ANNOUNCED_ADDRESS:
					process.env.RTC_ANNOUNCED_ADDRESS ?? externalAddress ?? '127.0.0.1',
				MEDIASOUP_WORKERS: '2',
				ROOM_CLOSE_DELAY_MS: '3000',
				PEER_RECONNECT_GRACE_MS: '4000',
			},
		},
		{
			command: `pnpm exec vite --port ${ports.web}`,
			cwd: '../../apps/web',
			url: urls.web,
			reuseExistingServer: !process.env.CI,
			env: {
				API_PROXY_TARGET: urls.api,
				CORE_PROXY_TARGET: `http://localhost:${ports.core}`,
			},
		},
	],
})
