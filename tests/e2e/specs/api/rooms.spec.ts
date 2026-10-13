import { type APIRequestContext, expect, test } from '@playwright/test'

async function guestHeaders(request: APIRequestContext, name: string) {
	const { token, guest } = await (
		await request.post('/api/guests', { data: { name } })
	).json()
	return { headers: { authorization: `Bearer ${token}` }, guest }
}

test.describe('Комнаты', () => {
	test('создаёт комнату с читаемым кодом', async ({ request }) => {
		const { headers, guest } = await guestHeaders(request, 'Создатель')
		const response = await request.post('/api/rooms', { headers })
		expect(response.status()).toBe(201)
		const { room } = await response.json()
		expect(room.code).toMatch(/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/)
		expect(room.creatorId).toBe(guest.id)

		const fetched = await request.get(`/api/rooms/${room.code}`)
		expect(fetched.status()).toBe(200)
		expect((await fetched.json()).room.code).toBe(room.code)
	})

	test('сообщает причину, если комнаты нет', async ({ request }) => {
		const missing = await request.get('/api/rooms/zzz-zzzz-zzz')
		expect(missing.status()).toBe(404)
		expect(await missing.json()).toEqual({ reason: 'not_found' })
	})

	test('валидирует формат кода', async ({ request }) => {
		expect((await request.get('/api/rooms/Bad_Code')).status()).toBe(400)
	})

	test('ищет только среди своих контактов', async ({ request }) => {
		const { headers } = await guestHeaders(request, 'Одиночка')
		const response = await request.get('/api/contacts?query=а', { headers })
		expect(response.status()).toBe(200)
		expect(await response.json()).toEqual({ contacts: [] })
	})

	test('отвечает на проверку здоровья', async ({ request }) => {
		expect(await (await request.get('/api/health')).json()).toEqual({ status: 'ok' })
	})
})
