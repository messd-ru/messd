import {
	type Browser,
	type BrowserContext,
	type Page,
	expect,
	test,
} from '@playwright/test'
import { createRoom } from '../../support/api.ts'
import {
	expectRemoteVideo,
	joinCall,
	openParticipant,
	tile,
} from '../../support/session.ts'

test.describe('Звонок', { tag: '@media' }, () => {
	let contexts: BrowserContext[] = []

	test.afterEach(async () => {
		await Promise.all(contexts.map((context) => context.close()))
		contexts = []
	})

	async function participant(browser: Browser, name: string) {
		const result = await openParticipant(browser, name)
		contexts.push(result.context)
		return result
	}

	async function openMore(page: Page) {
		await page.getByRole('button', { name: 'Ещё' }).click()
	}

	test('один на один: ожидание, видео, шифрование и уход собеседника', async ({
		browser,
		isMobile,
	}) => {
		const anna = await participant(browser, 'Аня Климова')
		const ivan = await participant(browser, 'Иван')
		const room = await createRoom(anna.session.token)

		await joinCall(anna.page, room.code)
		await expect(anna.page.getByTestId('waiting-stage')).toBeVisible()
		await expect(anna.page.getByText('Ждём собеседника')).toBeVisible()
		if (!isMobile)
			await expect(anna.page.getByTestId('room-link')).toContainText(room.code)

		await joinCall(ivan.page, room.code)
		await expect(anna.page.getByTestId('call-view')).toHaveAttribute('data-mode', 'pair')
		await expect(ivan.page.getByTestId('call-view')).toHaveAttribute('data-mode', 'pair')
		await expectRemoteVideo(anna.page, 'Иван')
		await expectRemoteVideo(ivan.page, 'Аня Климова')
		await expect(anna.page.getByTestId('encryption-indicator').first()).toHaveAttribute(
			'data-encrypted',
			'true',
		)

		await ivan.page.getByRole('button', { name: 'Выключить микрофон' }).click()
		await expect(anna.page.getByLabel('Микрофон собеседника выключен')).toBeVisible()

		await ivan.page.getByRole('button', { name: 'Завершить звонок' }).click()
		await expect(ivan.page).toHaveURL(/\/$/)
		await expect(anna.page.getByTestId('peer-left-stage')).toBeVisible()
		await expect(anna.page.getByText('Собеседник покинул звонок')).toBeVisible()
		await expect(anna.page.getByRole('button', { name: 'Позвонить снова' })).toBeVisible()
		if (!isMobile)
			await expect(anna.page.getByText(/Комната закроется через 0:5\d/)).toBeVisible()

		await anna.page.getByRole('button', { name: 'Позвонить снова' }).click()
		await expect(anna.page.getByTestId('waiting-stage')).toBeVisible()
	})

	test('раскладка «рядом» и зашифрованный чат', async ({ browser, isMobile }) => {
		const anna = await participant(browser, 'Аня')
		const ivan = await participant(browser, 'Иван')
		const room = await createRoom(anna.session.token)
		await joinCall(anna.page, room.code)
		await joinCall(ivan.page, room.code)
		await expect(anna.page.getByTestId('call-view')).toHaveAttribute('data-mode', 'pair')

		if (!isMobile) {
			await openMore(anna.page)
			await anna.page.getByRole('menuitem', { name: 'Рядом, на равных' }).click()
			await expect(tile(anna.page, 'Иван')).toBeVisible()
			await expect(anna.page.getByText('Сквозное шифрование')).toBeVisible()
			await expect(
				anna.page.getByRole('button', { name: 'Завершить звонок' }),
			).toHaveText('Завершить')
		}

		const openChat = async (page: Page) => {
			if (isMobile) {
				await openMore(page)
				await page.getByRole('menuitem', { name: /Чат/ }).click()
			} else {
				await page.getByRole('button', { name: 'Чат' }).click()
			}
		}

		await openChat(anna.page)
		await anna.page.getByLabel('Сообщение').fill('Привет! Слышно?')
		await anna.page.getByRole('button', { name: 'Отправить' }).click()
		await expect(anna.page.getByTestId('chat-message')).toContainText('Привет! Слышно?')

		await openChat(ivan.page)
		await expect(ivan.page.getByTestId('chat-message')).toContainText('Привет! Слышно?')
		await expect(ivan.page.getByTestId('chat-message')).toContainText('Аня')
	})

	test('групповой звонок: сетка, рука, участники и модерация', async ({ browser }) => {
		const anna = await participant(browser, 'Аня')
		const papa = await participant(browser, 'Папа')
		const mama = await participant(browser, 'Мама')
		const room = await createRoom(anna.session.token)
		await joinCall(anna.page, room.code)
		await joinCall(papa.page, room.code)
		await joinCall(mama.page, room.code)

		await expect(anna.page.getByTestId('call-view')).toHaveAttribute('data-mode', 'group')
		await expect(
			anna.page.getByTestId('call-grid').getByTestId('video-tile'),
		).toHaveCount(3)
		await expectRemoteVideo(anna.page, 'Мама')

		await mama.page.getByRole('button', { name: 'Поднять руку' }).click()
		await anna.page.getByRole('button', { name: 'Участники', exact: true }).click()
		const rows = anna.page.getByTestId('participant-row')
		await expect(rows).toHaveCount(3)
		await expect(rows.first()).toContainText('Мама')
		await expect(rows.first().getByLabel('Поднята рука')).toBeVisible()
		await expect(rows.filter({ hasText: 'Аня (вы)' })).toContainText('Создатель комнаты')

		await rows
			.filter({ hasText: 'Папа' })
			.getByRole('button', { name: 'Действия: Папа' })
			.click()
		await anna.page.getByRole('menuitem', { name: 'Выключить микрофон' }).click()
		await expect(
			papa.page.getByRole('button', { name: 'Включить микрофон' }),
		).toBeVisible()

		await papa.page.getByRole('button', { name: 'Участники', exact: true }).click()
		const papaRows = papa.page.getByTestId('participant-row')
		await papaRows
			.filter({ hasText: 'Аня' })
			.getByRole('button', { name: 'Действия: Аня' })
			.click()
		await expect(
			papa.page.getByRole('menuitem', { name: 'Закрепить видео' }),
		).toBeVisible()
		await expect(
			papa.page.getByRole('menuitem', { name: 'Удалить из комнаты' }),
		).toHaveCount(0)
		await papa.page.keyboard.press('Escape')

		await rows
			.filter({ hasText: 'Мама' })
			.getByRole('button', { name: 'Действия: Мама' })
			.click()
		await anna.page.getByRole('menuitem', { name: 'Удалить из комнаты' }).click()
		await expect(mama.page).toHaveURL(/\/$/)
		await expect(rows).toHaveCount(2)
	})

	test('переключение раскладки группы на «говорящий крупно»', async ({
		browser,
		isMobile,
	}) => {
		test.skip(isMobile, 'Раскладка спикера проверяется на десктопе')
		const anna = await participant(browser, 'Аня')
		const papa = await participant(browser, 'Папа')
		const mama = await participant(browser, 'Мама')
		const room = await createRoom(anna.session.token)
		await joinCall(anna.page, room.code)
		await joinCall(papa.page, room.code)
		await joinCall(mama.page, room.code)

		await expect(anna.page.getByTestId('call-grid')).toBeVisible()
		await openMore(anna.page)
		await anna.page.getByRole('menuitem', { name: 'Говорящий крупно' }).click()
		await expect(anna.page.getByTestId('call-grid')).toHaveCount(0)
		await expect(anna.page.getByTestId('video-tile')).toHaveCount(3)
	})
})
