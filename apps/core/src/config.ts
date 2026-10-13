import { availableParallelism } from 'node:os'
import { z } from 'zod'

const list = z
	.string()
	.default('')
	.transform((value) =>
		value
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean),
	)

const configSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	CORE_HOST: z.string().default('0.0.0.0'),
	CORE_PORT: z.coerce.number().int().positive().default(4000),
	DATABASE_URL: z.url(),
	LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
	APP_ORIGINS: list,
	RTC_LISTEN_IP: z.string().default('0.0.0.0'),
	RTC_ANNOUNCED_ADDRESS: z.string().default('127.0.0.1'),
	RTC_PORT: z.coerce.number().int().positive().default(40000),
	MEDIASOUP_WORKERS: z.coerce.number().int().positive().default(availableParallelism()),
	TURN_URLS: list,
	TURN_SECRET: z.string().default(''),
	TURN_TTL_SECONDS: z.coerce.number().int().positive().default(86_400),
	MAX_PEERS: z.coerce.number().int().min(2).default(50),
	ROOM_CLOSE_DELAY_MS: z.coerce.number().int().nonnegative().default(60_000),
	PEER_RECONNECT_GRACE_MS: z.coerce.number().int().nonnegative().default(20_000),
	ROOM_TTL_HOURS: z.coerce.number().int().positive().default(24),
})

export type Config = z.infer<typeof configSchema>

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
	return configSchema.parse(env)
}
