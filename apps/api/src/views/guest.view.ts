import type { Guest } from '@messd/contracts/guest'
import type { GuestRow } from '@messd/db/schema'

export function guestView(guest: GuestRow): Guest {
	return { id: guest.id, name: guest.name }
}
