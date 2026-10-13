import rateLimit from '@fastify/rate-limit'
import type { Db } from '@messd/db/client'
import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import type { Config } from '#config.ts'
import { registerRoutes } from '#routes.ts'

export async function buildApp(config: Config, db: Db) {
	const app = Fastify({
		trustProxy: true,
		logger: {
			level: config.LOG_LEVEL,
			transport:
				config.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
		},
	})

	app.setValidatorCompiler(validatorCompiler)
	app.setSerializerCompiler(serializerCompiler)
	app.decorateRequest('guest', null)
	await app.register(rateLimit, { global: false })
	registerRoutes(app, db, config)

	return app
}
