import type { createGuestBodySchema } from '@messd/contracts/api'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { z } from 'zod'
import type { GuestModel } from '#models/guest.model.ts'
import { currentGuest } from '#plugins/auth.ts'
import { guestView } from '#views/guest.view.ts'

type NameRequest = FastifyRequest<{ Body: z.infer<typeof createGuestBodySchema> }>

export function createGuestController(guests: GuestModel) {
	return {
		async create(request: NameRequest, reply: FastifyReply) {
			const { guest, token } = await guests.create(request.body.name)
			return reply.code(201).send({ guest: guestView(guest), token })
		},

		me(request: FastifyRequest) {
			return { guest: guestView(currentGuest(request)) }
		},

		async rename(request: NameRequest) {
			const guest = await guests.rename(currentGuest(request).id, request.body.name)
			if (!guest) throw new Error('Guest disappeared')
			return { guest: guestView(guest) }
		},
	}
}
