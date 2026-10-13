import { type Browser, type Page, expect } from '@playwright/test'
import { createGuest } from './api.ts'

export async function signIn(page: Page, name: string) {
	const session = await createGuest(name)
	await page.addInitScript(
		(value) => {
			localStorage.setItem('messd:session', value)
		},
		JSON.stringify({ state: { guest: session.guest, token: session.token }, version: 1 }),
	)
	return session
}

export async function openParticipant(
	browser: Browser,
	name: string,
	contextOptions = {},
) {
	const context = await browser.newContext(contextOptions)
	const page = await context.newPage()
	const session = await signIn(page, name)
	return { context, page, session }
}

export async function joinCall(page: Page, code: string, button = 'Подключиться') {
	await page.goto(`/${code}`)
	await page.getByRole('button', { name: button, exact: true }).click()
	await expect(page.getByTestId('call-view')).toBeVisible()
}

export function tile(page: Page, name: string) {
	return page.locator(`[data-testid="video-tile"][data-name="${name}"]`)
}

export async function expectRemoteVideo(page: Page, name: string) {
	await expect
		.poll(
			() =>
				tile(page, name)
					.locator('video')
					.evaluate((video: HTMLVideoElement) => video.videoWidth),
			{ timeout: 15_000 },
		)
		.toBeGreaterThan(0)
}
