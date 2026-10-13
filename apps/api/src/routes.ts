import {
	contactsQuerySchema,
	contactsResponseSchema,
	createGuestBodySchema,
	errorResponseSchema,
	guestResponseSchema,
	guestSessionSchema,
	roomNotFoundResponseSchema,
	roomResponseSchema,
	updateGuestBodySchema,
} from '@messd/contracts/api'
import { roomCodeSchema } from '@messd/contracts/room'
import type { Db } from '@messd/db/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { Config } from '#config.ts'
import { createContactController } from '#controllers/contact.controller.ts'
import { createGuestController } from '#controllers/guest.controller.ts'
import { createHealthController } from '#controllers/health.controller.ts'
import { createRoomController } from '#controllers/room.controller.ts'
import { createContactModel } from '#models/contact.model.ts'
import { createGuestModel } from '#models/guest.model.ts'
import { createRoomModel } from '#models/room.model.ts'
import { createAuthenticate } from '#plugins/auth.ts'

export function registerRoutes(app: FastifyInstance, db: Db, config: Config) {
	const guestModel = createGuestModel(db)
	const authenticate = createAuthenticate(guestModel)
	const health = createHealthController()
	const guests = createGuestController(guestModel)
	const rooms = createRoomController(createRoomModel(db, config.ROOM_TTL_HOURS))
	const contacts = createContactController(createContactModel(db))
	const rateLimit = { max: config.RATE_LIMIT_MAX, timeWindow: '1 minute' }
	const unauthorized = { 401: errorResponseSchema }
	const api = app.withTypeProvider<ZodTypeProvider>()

	api.get('/api/health', {
		schema: { response: { 200: z.object({ status: z.literal('ok') }) } },
		handler: health.check,
	})

	api.post('/api/guests', {
		config: { rateLimit },
		schema: { body: createGuestBodySchema, response: { 201: guestSessionSchema } },
		handler: guests.create,
	})

	api.get('/api/guests/me', {
		preHandler: authenticate,
		schema: { response: { 200: guestResponseSchema, ...unauthorized } },
		handler: guests.me,
	})

	api.patch('/api/guests/me', {
		preHandler: authenticate,
		schema: {
			body: updateGuestBodySchema,
			response: { 200: guestResponseSchema, ...unauthorized },
		},
		handler: guests.rename,
	})

	api.post('/api/rooms', {
		config: { rateLimit },
		preHandler: authenticate,
		schema: { response: { 201: roomResponseSchema, ...unauthorized } },
		handler: rooms.create,
	})

	api.get('/api/rooms/:code', {
		schema: {
			params: z.object({ code: roomCodeSchema }),
			response: { 200: roomResponseSchema, 404: roomNotFoundResponseSchema },
		},
		handler: rooms.show,
	})

	api.get('/api/contacts', {
		preHandler: authenticate,
		schema: {
			querystring: contactsQuerySchema,
			response: { 200: contactsResponseSchema, ...unauthorized },
		},
		handler: contacts.search,
	})
}
