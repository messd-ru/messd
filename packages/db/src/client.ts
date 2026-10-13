import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'
import * as schema from './schema.ts'

export function createDb(connectionString: string) {
	const pool = new Pool({ connectionString, max: 10 })
	return drizzle({ client: pool, schema })
}

export type Db = ReturnType<typeof createDb>

export async function runMigrations(db: Db) {
	await migrate(db, {
		migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
	})
}
