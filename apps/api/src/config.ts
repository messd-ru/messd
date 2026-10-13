import { z } from 'zod'

const configSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	API_HOST: z.string().default('0.0.0.0'),
	API_PORT: z.coerce.number().int().positive().default(3000),
	DATABASE_URL: z.url(),
	LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
	RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
	ROOM_TTL_HOURS: z.coerce.number().int().positive().default(24),
})

export type Config = z.infer<typeof configSchema>

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
	return configSchema.parse(env)
}
