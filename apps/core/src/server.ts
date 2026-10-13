import { createDb } from '@messd/db/client'
import { buildApp } from '#app.ts'
import { loadConfig } from '#config.ts'

const config = loadConfig()
const db = createDb(config.DATABASE_URL)
const app = await buildApp(config, db)

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
	process.once(signal, async () => {
		await app.close()
		await db.$client.end()
		process.exit(0)
	})
}

await app.listen({ host: config.CORE_HOST, port: config.CORE_PORT })
