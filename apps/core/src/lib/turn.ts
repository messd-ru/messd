import type { IceServer } from '@messd/contracts/signaling'
import { createHmac } from 'node:crypto'
import type { Config } from '#config.ts'

export function createIceServers(config: Config, guestId: string): IceServer[] {
	if (!config.TURN_URLS.length || !config.TURN_SECRET) return []
	const expiresAt = Math.floor(Date.now() / 1000) + config.TURN_TTL_SECONDS
	const username = `${expiresAt}:${guestId}`
	const credential = createHmac('sha1', config.TURN_SECRET)
		.update(username)
		.digest('base64')
	return [{ urls: config.TURN_URLS, username, credential }]
}
