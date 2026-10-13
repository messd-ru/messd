import { z } from 'zod'

export const guestNameSchema = z
	.string()
	.trim()
	.min(1, 'Введите имя')
	.max(40, 'Не длиннее 40 символов')

export const guestSchema = z.object({
	id: z.uuid(),
	name: guestNameSchema,
})

export type Guest = z.infer<typeof guestSchema>

export const contactSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	lastCallAt: z.iso.datetime(),
})

export type Contact = z.infer<typeof contactSchema>
