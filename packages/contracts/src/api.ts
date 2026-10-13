import { z } from 'zod'
import { contactSchema, guestNameSchema, guestSchema } from './guest.ts'
import { roomNotFoundReasonSchema, roomSchema } from './room.ts'

export const createGuestBodySchema = z.object({
	name: guestNameSchema,
})

export const updateGuestBodySchema = createGuestBodySchema

export const guestSessionSchema = z.object({
	guest: guestSchema,
	token: z.string(),
})

export type GuestSession = z.infer<typeof guestSessionSchema>

export const guestResponseSchema = z.object({
	guest: guestSchema,
})

export const roomResponseSchema = z.object({
	room: roomSchema,
})

export const roomNotFoundResponseSchema = z.object({
	reason: roomNotFoundReasonSchema,
})

export const contactsQuerySchema = z.object({
	query: z.string().trim().max(40).default(''),
})

export const contactsResponseSchema = z.object({
	contacts: z.array(contactSchema),
})

export const errorResponseSchema = z.object({
	message: z.string(),
})
