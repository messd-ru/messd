import { toast } from 'sonner'
import { roomUrl } from '#shared/lib/room-link.ts'

export async function copyRoomLink(code: string) {
	try {
		await navigator.clipboard.writeText(roomUrl(code))
		toast.success('Ссылка скопирована')
	} catch {
		toast.error('Не удалось скопировать ссылку')
	}
}

export async function shareRoomLink(code: string) {
	const url = roomUrl(code)
	if (navigator.share) {
		try {
			await navigator.share({ title: 'Звонок в MESSD', url })
			return
		} catch (error) {
			if ((error as DOMException).name === 'AbortError') return
		}
	}
	await copyRoomLink(code)
}
