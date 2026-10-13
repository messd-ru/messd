import { expect, test } from '@playwright/test'
import { signIn } from '../../support/session.ts'

test.describe('Главная', () => {
	test('спрашивает имя при первом визите', async ({ page }) => {
		await page.goto('/')
		const dialog = page.getByRole('dialog', { name: 'Как вас зовут?' })
		await expect(dialog).toBeVisible()
		await dialog.getByRole('button', { name: 'Продолжить' }).click()
		await expect(dialog.getByRole('alert')).toHaveText('Введите имя')
		await dialog.getByPlaceholder('Ваше имя').fill('Иван Петров')
		await dialog.getByRole('button', { name: 'Продолжить' }).click()
		await expect(dialog).toBeHidden()
		await expect(page.getByRole('heading', { name: 'Привет, Иван' })).toBeVisible()
	})

	test('приветствует по имени и показывает дату на десктопе', async ({
		page,
		isMobile,
	}) => {
		await signIn(page, 'Анна Смирнова')
		await page.goto('/')
		await expect(page.getByRole('heading', { name: 'Привет, Анна' })).toBeVisible()
		const today = new Intl.DateTimeFormat('ru', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
		})
			.format(new Date())
			.replace(/^./, (letter) => letter.toUpperCase())
		await expect(page.getByText(today)).toBeVisible({ visible: !isMobile })
	})

	test('создаёт новый звонок и ведёт в лобби', async ({ page }) => {
		await signIn(page, 'Создатель')
		await page.goto('/')
		await page.getByRole('button', { name: /Новый звонок/ }).click()
		await expect(page).toHaveURL(/\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/)
		await expect(page.getByTestId('lobby-title')).toHaveText('Новый звонок')
	})

	test('проверяет формат ссылки перед входом', async ({ page, isMobile }) => {
		await signIn(page, 'Гость')
		await page.goto('/')
		if (isMobile) await page.getByRole('button', { name: 'По ссылке' }).click()
		await page.getByLabel('Ссылка или код комнаты').fill('это не ссылка!')
		await page.getByRole('button', { name: 'Войти', exact: true }).click()
		await expect(page.getByRole('alert')).toContainText('Проверьте ссылку')
		await page.getByLabel('Ссылка или код комнаты').fill('https://messd.app/zzz-zzzz-zzz')
		await page.getByRole('button', { name: 'Войти', exact: true }).click()
		await expect(page).toHaveURL(/\/zzz-zzzz-zzz$/)
		await expect(page.getByRole('heading', { name: 'Комната не найдена' })).toBeVisible()
	})

	test('экран «Комната не найдена» предлагает выход', async ({ page }) => {
		await signIn(page, 'Гость')
		await page.goto('/abc-defg-hij')
		await expect(page.getByRole('heading', { name: 'Комната не найдена' })).toBeVisible()
		await page.getByRole('link', { name: 'На главную' }).first().click()
		await expect(page).toHaveURL(/\/$/)
	})

	test('запоминает выбранную тему', async ({ page, isMobile }) => {
		await signIn(page, 'Гость')
		await page.goto(isMobile ? '/settings' : '/')
		await page.getByRole('radio', { name: 'Тёмная тема' }).click()
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
		await page.reload()
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
		await page.getByRole('radio', { name: 'Светлая тема' }).click()
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
	})

	test('навигация между главной и настройками', async ({ page }) => {
		await signIn(page, 'Гость')
		await page.goto('/')
		await page.getByRole('link', { name: 'Настройки' }).click()
		await expect(page.getByRole('heading', { name: 'Настройки' })).toBeVisible()
		await page.getByRole('link', { name: 'Главная' }).click()
		await expect(page.getByRole('heading', { name: /Привет/ })).toBeVisible()
	})
})
