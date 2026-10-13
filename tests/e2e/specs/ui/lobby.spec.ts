import { expect, test } from '@playwright/test'
import { createRoom } from '../../support/api.ts'
import { signIn } from '../../support/session.ts'

test.describe('Лобби', () => {
	test(
		'показывает живое превью и переносит состояние в звонок',
		{ tag: '@media' },
		async ({ page }) => {
			const session = await signIn(page, 'Гость')
			const room = await createRoom(session.token)
			await page.goto(`/${room.code}`)
			await expect
				.poll(() =>
					page
						.locator('video')
						.first()
						.evaluate((video: HTMLVideoElement) => video.videoWidth),
				)
				.toBeGreaterThan(0)
			await page.getByRole('button', { name: 'Выключить микрофон' }).click()
			await page.getByRole('button', { name: 'Подключиться', exact: true }).click()
			await expect(page.getByTestId('call-view')).toHaveAttribute('data-mode', 'waiting')
			await expect(
				page.getByRole('button', { name: 'Включить микрофон' }),
			).toHaveAttribute('aria-pressed', 'true')
			await expect(page.getByRole('button', { name: 'Выключить камеру' })).toBeVisible()
		},
	)

	test('«Только голос» входит без камеры', { tag: '@media' }, async ({ page }) => {
		const session = await signIn(page, 'Гость')
		const room = await createRoom(session.token)
		await page.goto(`/${room.code}`)
		await page.getByRole('button', { name: 'Только голос' }).click()
		await expect(page.getByTestId('call-view')).toBeVisible()
		await expect(page.getByRole('button', { name: 'Включить камеру' })).toBeVisible()
	})

	test('помещается в экран без прокрутки', async ({ page, isMobile }) => {
		const session = await signIn(page, 'Гость')
		const room = await createRoom(session.token)
		const sizes = isMobile
			? [
					{ width: 390, height: 844 },
					{ width: 390, height: 667 },
				]
			: [
					{ width: 1280, height: 720 },
					{ width: 1536, height: 730 },
					{ width: 1920, height: 940 },
					{ width: 2560, height: 1300 },
					{ width: 3840, height: 2160 },
				]
		await page.goto(`/${room.code}`)
		await expect(page.getByTestId('lobby-title')).toBeVisible()
		for (const size of sizes) {
			await page.setViewportSize(size)
			await expect
				.poll(() =>
					page.evaluate(() =>
						[document.documentElement, ...document.body.querySelectorAll('*')].some(
							(element) =>
								(element === document.documentElement ||
									['auto', 'scroll'].includes(getComputedStyle(element).overflowY)) &&
								element.scrollHeight > element.clientHeight + 1,
						),
					),
				)
				.toBe(false)
		}
	})

	test('не растягивается на 4K', async ({ page, isMobile }) => {
		test.skip(isMobile, 'Только для десктопа')
		const session = await signIn(page, 'Гость')
		const room = await createRoom(session.token)
		await page.setViewportSize({ width: 3840, height: 2160 })
		await page.goto(`/${room.code}`)
		await expect(page.getByTestId('lobby-title')).toBeVisible()
		const content = await page.getByRole('main').boundingBox()
		expect(content?.width).toBeLessThanOrEqual(1440)
		expect((content?.x ?? 0) * 2 + (content?.width ?? 0)).toBeCloseTo(3840, 0)
	})

	test('«Назад» возвращает без входа', async ({ page }) => {
		const session = await signIn(page, 'Гость')
		const room = await createRoom(session.token)
		await page.goto(`/${room.code}`)
		await page.getByRole('link', { name: 'Назад' }).click()
		await expect(page).toHaveURL(/\/$/)
	})

	test('при запрете доступа показывает инструкцию', async ({ page, isMobile }) => {
		await page.addInitScript(() => {
			navigator.mediaDevices.getUserMedia = () =>
				Promise.reject(new DOMException('Permission denied', 'NotAllowedError'))
		})
		const session = await signIn(page, 'Гость')
		const room = await createRoom(session.token)
		await page.goto(`/${room.code}`)
		if (isMobile) {
			await expect(page.getByText('Нет доступа к камере и микрофону')).toBeVisible()
			await page.getByRole('button', { name: 'Открыть настройки' }).click()
			await expect(
				page.getByRole('dialog', { name: 'Как включить доступ' }),
			).toBeVisible()
			await page.getByRole('button', { name: 'Проверить снова' }).click()
			await expect(page.getByRole('button', { name: 'Войти без камеры' })).toBeVisible()
			return
		}
		await expect(page.getByText('Браузер заблокировал камеру и микрофон')).toBeVisible()
		await expect(page.getByText('Без доступа вас не увидят и не услышат.')).toBeVisible()
		await expect(page.getByRole('button', { name: 'Проверить снова' })).toBeVisible()
		await expect(
			page.getByRole('button', { name: 'Войти без камеры и микрофона' }),
		).toBeVisible()
	})
})
