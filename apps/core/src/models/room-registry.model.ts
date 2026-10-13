import type { FastifyBaseLogger } from 'fastify'
import type { Config } from '#config.ts'
import type { MediaWorkers } from '#lib/media-workers.ts'
import { errors } from '#lib/signaling-error.ts'
import type { ProducerAppData } from '#models/peer.model.ts'
import type { RoomRecordModel } from '#models/room-record.model.ts'
import { Room } from '#models/room.model.ts'

type RegistryDeps = {
	config: Config
	media: MediaWorkers
	records: RoomRecordModel
	logger: FastifyBaseLogger
}

export function createRoomRegistry({ config, media, records, logger }: RegistryDeps) {
	const rooms = new Map<string, Room>()
	const opening = new Map<string, Promise<Room>>()

	function setActiveSpeaker(room: Room, peerId: string | null) {
		if (room.activeSpeakerId === peerId) return
		room.activeSpeakerId = peerId
		room.broadcast('activeSpeaker', { peerId })
	}

	async function create(code: string) {
		const record = await records.findActive(code)
		if (record.status === 'not_found') throw errors.roomNotFound()
		if (record.status === 'ended') throw errors.roomEnded()
		const { router, webRtcServer } = await media.createRouter()
		const audioObserver = await router.createAudioLevelObserver({
			maxEntries: 1,
			threshold: -60,
			interval: 400,
		})
		const room = new Room({
			code,
			creatorId: record.room.creatorId,
			started: Boolean(record.room.startedAt),
			router,
			webRtcServer,
			audioObserver,
		})
		audioObserver.on('volumes', ([loudest]) => {
			const appData = loudest?.producer.appData as ProducerAppData | undefined
			setActiveSpeaker(room, appData?.peerId ?? null)
		})
		audioObserver.on('silence', () => setActiveSpeaker(room, null))
		rooms.set(code, room)
		return room
	}

	async function dispose(room: Room) {
		if (room.peers.size > 0 || rooms.get(room.code) !== room) return
		rooms.delete(room.code)
		for (const session of room.watchers) session.watching = null
		room.close()
		if (room.started) await records.markEnded(room.code)
		logger.info({ code: room.code, ended: room.started }, 'room closed')
	}

	return {
		async open(code: string) {
			const existing = rooms.get(code)
			if (existing) return existing
			const pending = opening.get(code) ?? create(code)
			opening.set(code, pending)
			try {
				return await pending
			} finally {
				opening.delete(code)
			}
		},

		async markStarted(room: Room) {
			if (room.started) return
			room.started = true
			await records.markStarted(room.code)
		},

		reconcile(room: Room) {
			room.cancelClose()
			if (room.peers.size > 0) return
			if (!room.started && room.watchers.size > 0) return
			room.closeTimer = setTimeout(() => {
				dispose(room).catch((error: unknown) =>
					logger.error({ err: error }, 'room close failed'),
				)
			}, config.ROOM_CLOSE_DELAY_MS)
		},

		closeAll() {
			for (const room of rooms.values()) room.close()
			rooms.clear()
		},
	}
}

export type RoomRegistry = ReturnType<typeof createRoomRegistry>
