import { expect, test } from '@playwright/test'
import { createGuest, createRoom } from '../../support/api.ts'
import { SignalingTestClient } from '../../support/signaling.ts'

test.describe('Сигнализация', () => {
	let clients: SignalingTestClient[] = []

	async function connect(name: string) {
		const session = await createGuest(name)
		const client = await SignalingTestClient.connect()
		clients.push(client)
		const hello = await client.request('hello', { token: session.token })
		expect(hello.ok).toBe(true)
		return { client, session }
	}

	test.afterEach(() => {
		for (const client of clients) client.close()
		clients = []
	})

	test('не пускает без гостевой сессии', async () => {
		const client = await SignalingTestClient.connect()
		clients.push(client)
		const denied = await client.request('hello', { token: 'invalid' })
		expect(denied).toMatchObject({ ok: false, error: { code: 'unauthorized' } })
		const peek = await client.request('peek', { code: 'abc-defg-hij' })
		expect(peek).toMatchObject({ ok: false, error: { code: 'unauthorized' } })
	})

	test('валидирует сообщения и сообщает о несуществующей комнате', async () => {
		const { client } = await connect('Проверка')
		expect(await client.request('peek', { code: 'Bad Code' })).toMatchObject({
			ok: false,
			error: { code: 'bad_request' },
		})
		expect(await client.request('peek', { code: 'zzz-zzzz-zzz' })).toMatchObject({
			ok: false,
			error: { code: 'room_not_found' },
		})
	})

	test('объявляет участников, состояние и роли', async () => {
		const creator = await connect('Аня')
		const guest = await connect('Евгений')
		const room = await createRoom(creator.session.token)

		const peek = await guest.client.request('peek', { code: room.code })
		expect(peek.ok && peek.data.room.peers).toEqual([])

		const joined = await creator.client.request('join', {
			code: room.code,
			rtpCapabilities: {},
			publicKey: 'key-a',
		})
		expect(joined.ok).toBe(true)
		const lobby = await guest.client.waitFor(
			'roomChanged',
			({ room: snapshot }) => snapshot.peers.length === 1,
		)
		expect(lobby.room.peers[0]).toMatchObject({ name: 'Аня', role: 'creator' })

		const second = await guest.client.request('join', {
			code: room.code,
			rtpCapabilities: {},
			publicKey: 'key-b',
		})
		expect(second.ok && second.data.peers.map((peer) => peer.name)).toEqual(['Аня'])
		const { peer } = await creator.client.waitFor('peerJoined')
		expect(peer).toMatchObject({ name: 'Евгений', role: 'member', publicKey: 'key-b' })

		await guest.client.request('updateState', { hand: true })
		const updated = await creator.client.waitFor(
			'peerUpdated',
			({ peer: item }) => item.hand,
		)
		expect(updated.peer.handRaisedAt).not.toBeNull()

		await guest.client.request('leave', {})
		const left = await creator.client.waitFor('peerLeft')
		expect(left.peerId).toBe(peer.id)
	})

	test('разрешает модерацию только создателю', async () => {
		const creator = await connect('Создатель')
		const member = await connect('Участник')
		const room = await createRoom(creator.session.token)
		const base = { code: room.code, rtpCapabilities: {}, publicKey: 'k' }
		const creatorJoin = await creator.client.request('join', base)
		const memberJoin = await member.client.request('join', base)
		if (!creatorJoin.ok || !memberJoin.ok) throw new Error('join failed')

		expect(
			await member.client.request('moderate', {
				peerId: creatorJoin.data.peerId,
				action: 'mute',
			}),
		).toMatchObject({ ok: false, error: { code: 'forbidden' } })

		await creator.client.request('moderate', {
			peerId: memberJoin.data.peerId,
			action: 'mute',
		})
		await member.client.waitFor('forceMute')

		await creator.client.request('moderate', {
			peerId: memberJoin.data.peerId,
			action: 'remove',
		})
		await member.client.waitFor('removed')
		expect(await member.client.request('join', base)).toMatchObject({
			ok: false,
			error: { code: 'forbidden' },
		})
	})

	test('доставляет приглашения и пересылает ключи шифрования адресно', async () => {
		const caller = await connect('Звонящий')
		const callee = await connect('Собеседник')
		const room = await createRoom(caller.session.token)
		const joined = await caller.client.request('join', {
			code: room.code,
			rtpCapabilities: {},
			publicKey: 'k',
		})
		expect(joined.ok).toBe(true)

		const invite = await caller.client.request('invite', {
			guestId: callee.session.guest.id,
			code: room.code,
		})
		expect(invite).toMatchObject({ ok: true, data: { delivered: true } })
		const invited = await callee.client.waitFor('invited')
		expect(invited).toEqual({
			code: room.code,
			from: { guestId: caller.session.guest.id, name: 'Звонящий' },
		})

		const calleeJoin = await callee.client.request('join', {
			code: room.code,
			rtpCapabilities: {},
			publicKey: 'k2',
		})
		if (!calleeJoin.ok || !joined.ok) throw new Error('join failed')
		const sealed = { iv: 'aXY=', data: 'ZGF0YQ==', index: 0 }
		await caller.client.request('e2eeKey', { to: calleeJoin.data.peerId, sealed })
		expect(await callee.client.waitFor('e2eeKey')).toEqual({
			from: joined.data.peerId,
			sealed,
		})
	})

	test('выдаёт транспорт WebRTC через общий порт сервера', async () => {
		const { client, session } = await connect('Транспорт')
		const room = await createRoom(session.token)
		await client.request('join', { code: room.code, rtpCapabilities: {}, publicKey: 'k' })
		const transport = await client.request('createTransport', { direction: 'send' })
		expect(transport.ok).toBe(true)
		if (!transport.ok) return
		expect(transport.data.iceCandidates.length).toBeGreaterThan(0)
		expect(transport.data.dtlsParameters).toHaveProperty('fingerprints')
	})
})
