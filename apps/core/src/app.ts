import websocket from '@fastify/websocket'
import type { Db } from '@messd/db/client'
import Fastify from 'fastify'
import type { Config } from '#config.ts'
import { createSignalingController } from '#controllers/signaling.controller.ts'
import { createMediaWorkers } from '#lib/media-workers.ts'
import { createContactModel } from '#models/contact.model.ts'
import { createGuestModel } from '#models/guest.model.ts'
import { createRoomRecordModel } from '#models/room-record.model.ts'
import { createRoomRegistry } from '#models/room-registry.model.ts'

const MAX_PAYLOAD = 64 * 1024

export async function buildApp(config: Config, db: Db) {
	const app = Fastify({
		trustProxy: true,
		logger: {
			level: config.LOG_LEVEL,
			transport:
				config.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
		},
	})

	await app.register(websocket, { options: { maxPayload: MAX_PAYLOAD } })

	const media = await createMediaWorkers(config, app.log)
	const registry = createRoomRegistry({
		config,
		media,
		records: createRoomRecordModel(db, config.ROOM_TTL_HOURS),
		logger: app.log,
	})
	const signaling = createSignalingController({
		config,
		logger: app.log,
		registry,
		guests: createGuestModel(db),
		contacts: createContactModel(db),
	})

	app.get('/health', () => ({ status: 'ok' }))
	app.get('/ws', { websocket: true }, (socket, request) =>
		signaling.connect(socket, request),
	)

	app.addHook('onClose', () => {
		signaling.close()
		registry.closeAll()
		media.close()
	})

	return app
}
