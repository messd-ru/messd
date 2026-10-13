import type { Guest } from '@messd/contracts/guest'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SessionStore = {
	guest: Guest | null
	token: string | null
	setSession: (guest: Guest, token: string) => void
	setGuest: (guest: Guest) => void
	clear: () => void
}

export const useSession = create<SessionStore>()(
	persist(
		(set) => ({
			guest: null,
			token: null,
			setSession: (guest, token) => set({ guest, token }),
			setGuest: (guest) => set({ guest }),
			clear: () => set({ guest: null, token: null }),
		}),
		{ name: 'messd:session', version: 1 },
	),
)
