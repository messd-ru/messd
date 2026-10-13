import { createWorker, type types } from 'mediasoup'
import type { FastifyBaseLogger } from 'fastify'
import type { Config } from '#config.ts'
import { mediaCodecs } from '#lib/media-codecs.ts'

type MediaWorker = {
	worker: types.Worker
	webRtcServer: types.WebRtcServer
	routers: number
}

export type MediaWorkers = Awaited<ReturnType<typeof createMediaWorkers>>

export async function createMediaWorkers(config: Config, logger: FastifyBaseLogger) {
	const pool: MediaWorker[] = []

	for (let index = 0; index < config.MEDIASOUP_WORKERS; index += 1) {
		const worker = await createWorker({ logLevel: 'warn' })
		worker.on('died', (error) => {
			logger.fatal({ err: error }, 'mediasoup worker died')
			process.exit(1)
		})
		const listen = {
			ip: config.RTC_LISTEN_IP,
			announcedAddress: config.RTC_ANNOUNCED_ADDRESS,
			port: config.RTC_PORT + index,
		}
		const webRtcServer = await worker.createWebRtcServer({
			listenInfos: [
				{ protocol: 'udp', ...listen },
				{ protocol: 'tcp', ...listen },
			],
		})
		pool.push({ worker, webRtcServer, routers: 0 })
	}

	return {
		async createRouter() {
			const target = pool.reduce((least, item) =>
				item.routers < least.routers ? item : least,
			)
			const router = await target.worker.createRouter({ mediaCodecs })
			target.routers += 1
			router.observer.once('close', () => {
				target.routers -= 1
			})
			return { router, webRtcServer: target.webRtcServer }
		},

		close() {
			for (const { worker } of pool) worker.close()
		},
	}
}
