import { expect, test } from '@playwright/test'
import { signIn } from '../../support/session.ts'

test.describe('Настройки', () => {
	test('сохраняет переключатели без кнопки «Сохранить»', async ({ page, isMobile }) => {
		await signIn(page, 'Гость')
		await page.goto('/settings')
		const blur = page.getByRole('switch', { name: 'Размытие фона' })
		await expect(blur).not.toBeChecked()
		await blur.click()
		await expect(blur).toBeChecked()
		await page.reload()
		await expect(page.getByRole('switch', { name: 'Размытие фона' })).toBeChecked()
		await expect(
			page.getByRole('switch', { name: 'Входить с выключенной камерой' }),
		).toBeVisible({
			visible: !isMobile,
		})
	})

	test(
		'значения по умолчанию применяются в лобби',
		{ tag: '@media' },
		async ({ page, isMobile }) => {
			await signIn(page, 'Гость')
			await page.goto('/settings')
			await page
				.getByRole('switch', {
					name: isMobile ? 'Вход без микрофона' : 'Входить с выключенным микрофоном',
				})
				.click()
			await page.getByRole('link', { name: 'Главная' }).click()
			await page.getByRole('button', { name: /Новый звонок/ }).click()
			await expect(
				page.getByRole('button', { name: 'Включить микрофон' }),
			).toHaveAttribute('aria-pressed', 'true')
			await expect(page.getByRole('button', { name: 'Выключить камеру' })).toBeVisible()
		},
	)

	test(
		'показывает выбор устройств на десктопе',
		{ tag: '@media' },
		async ({ page, isMobile }) => {
			test.skip(isMobile, 'Раздел устройств есть только на десктопе')
			await signIn(page, 'Гость')
			await page.goto('/settings')
			await expect(page.getByRole('combobox', { name: 'Камера' })).toBeVisible()
			await expect(page.getByRole('combobox', { name: 'Микрофон' })).toBeVisible()
			await expect(page.getByRole('meter', { name: 'Уровень микрофона' })).toBeVisible()
			await expect(page.getByRole('button', { name: 'Проверить' })).toBeVisible()
		},
	)
})
