import type { z } from 'zod'
import { useSession } from '#shared/store/session.ts'

export class ApiError extends Error {
	readonly status: number
	readonly body: unknown

	constructor(status: number, body: unknown) {
		super(`Request failed with status ${status}`)
		this.status = status
		this.body = body
	}
}

type RequestOptions = {
	method?: 'GET' | 'POST' | 'PATCH'
	body?: unknown
}

export async function request<T extends z.ZodType>(
	schema: T,
	path: string,
	{ method = 'GET', body }: RequestOptions = {},
): Promise<z.infer<T>> {
	const token = useSession.getState().token
	const headers: Record<string, string> = {}
	if (body !== undefined) headers['content-type'] = 'application/json'
	if (token) headers.authorization = `Bearer ${token}`
	const response = await fetch(`/api${path}`, {
		method,
		headers,
		body: body === undefined ? undefined : JSON.stringify(body),
	})
	const data: unknown = await response.json().catch(() => null)
	if (!response.ok) {
		if (response.status === 401) useSession.getState().clear()
		throw new ApiError(response.status, data)
	}
	return schema.parse(data)
}
