import { expect, test } from '@playwright/test'

test.describe('Гостевые сессии', () => {
	test('создаёт гостя без регистрации и возвращает токен', async ({ request }) => {
		const response = await request.post('/api/guests', { data: { name: '  Аня  ' } })
		expect(response.status()).toBe(201)
		const body = await response.json()
		expect(body.guest.name).toBe('Аня')
		expect(body.guest.id).toMatch(/^[0-9a-f-]{36}$/)
		expect(body.token.length).toBeGreaterThan(30)
	})

	test('отклоняет пустое и слишком длинное имя', async ({ request }) => {
		const empty = await request.post('/api/guests', { data: { name: ' ' } })
		expect(empty.status()).toBe(400)
		const long = await request.post('/api/guests', { data: { name: 'а'.repeat(41) } })
		expect(long.status()).toBe(400)
	})

	test('возвращает и переименовывает текущего гостя по токену', async ({ request }) => {
		const { token } = await (
			await request.post('/api/guests', { data: { name: 'Дима' } })
		).json()
		const headers = { authorization: `Bearer ${token}` }
		const me = await request.get('/api/guests/me', { headers })
		expect((await me.json()).guest.name).toBe('Дима')
		const renamed = await request.patch('/api/guests/me', {
			headers,
			data: { name: 'Дмитрий' },
		})
		expect((await renamed.json()).guest.name).toBe('Дмитрий')
	})

	test('требует токен для защищённых маршрутов', async ({ request }) => {
		expect((await request.get('/api/guests/me')).status()).toBe(401)
		expect(
			(
				await request.get('/api/guests/me', {
					headers: { authorization: 'Bearer wrong' },
				})
			).status(),
		).toBe(401)
		expect((await request.post('/api/rooms')).status()).toBe(401)
	})
})
