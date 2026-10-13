import type { GuestRow } from '@messd/db/schema'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { GuestModel } from '#models/guest.model.ts'

declare module 'fastify' {
	interface FastifyRequest {
		guest: GuestRow | null
	}
}

export function createAuthenticate(guests: GuestModel) {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		const header = request.headers.authorization
		const token = header?.startsWith('Bearer ') ? header.slice(7) : null
		const guest = token ? await guests.findByToken(token) : null
		if (!guest) return reply.code(401).send({ message: 'Нужна гостевая сессия' })
		request.guest = guest
	}
}

export function currentGuest(request: FastifyRequest) {
	if (!request.guest) throw new Error('Guest is not authenticated')
	return request.guest
}
