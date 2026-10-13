import type { Contact } from '@messd/contracts/guest'
import { Avatar } from '@messd/ui/components/avatar'
import { Button } from '@messd/ui/components/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from '@messd/ui/components/dialog'
import { Input } from '@messd/ui/components/input'
import { CheckIcon, CopyIcon, LinkIcon, SearchIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useRoomSession } from '#pages/room/lib/session-context.ts'
import { roomActions, useRoomStore } from '#pages/room/store/room-store.ts'
import { searchContacts } from '#shared/api/contacts.ts'
import { copyRoomLink } from '#shared/lib/clipboard.ts'
import { initials } from '#shared/lib/format.ts'
import { roomLinkLabel } from '#shared/lib/room-link.ts'

const DEBOUNCE_MS = 200

function InviteContent() {
	const session = useRoomSession()
	const code = useRoomStore((state) => state.code)
	const peers = useRoomStore((state) => state.peers)
	const [query, setQuery] = useState('')
	const [contacts, setContacts] = useState<Contact[] | null>(null)
	const [invited, setInvited] = useState<string[]>([])
	const inRoom = new Set(Object.values(peers).map((peer) => peer.guestId))

	useEffect(() => {
		let active = true
		const timer = setTimeout(() => {
			searchContacts(query.trim())
				.then((result) => {
					if (active) setContacts(result)
				})
				.catch(() => {
					if (active) setContacts([])
				})
		}, DEBOUNCE_MS)
		return () => {
			active = false
			clearTimeout(timer)
		}
	}, [query])

	async function invite(contact: Contact) {
		setInvited((current) => [...current, contact.id])
		try {
			const { delivered } = await session.invite(contact.id)
			if (!delivered) toast(`${contact.name} сейчас не в сети — отправьте ссылку`)
		} catch {
			setInvited((current) => current.filter((id) => id !== contact.id))
			toast.error('Не удалось отправить приглашение')
		}
	}

	return (
		<>
			<div className="flex flex-col gap-1.5 pr-8">
				<DialogTitle>Пригласить в звонок</DialogTitle>
				<DialogDescription>
					Позовите тех, с кем вы уже созванивались, или отправьте ссылку.
				</DialogDescription>
			</div>
			<button
				type="button"
				onClick={() => void copyRoomLink(code)}
				className="flex h-[42px] items-center gap-2 rounded-[10px] border border-line bg-surface px-3 outline-none hover:border-muted focus-visible:ring-2 focus-visible:ring-accent/50"
			>
				<LinkIcon className="size-[15px]" />
				<span className="flex-1 truncate text-left font-medium">
					{roomLinkLabel(code)}
				</span>
				<CopyIcon className="size-[15px]" aria-label="Скопировать ссылку" />
			</button>
			<Input
				icon={<SearchIcon />}
				placeholder="Найти человека"
				aria-label="Найти человека"
				value={query}
				onChange={(event) => setQuery(event.target.value)}
			/>
			<div className="flex max-h-72 min-h-24 flex-col gap-0.5 overflow-y-auto">
				{contacts === null ? (
					<span className="py-3 text-center text-muted">Ищем…</span>
				) : contacts.length === 0 ? (
					<span className="py-3 text-center leading-normal text-pretty text-muted">
						Здесь появятся люди, с которыми вы созванивались
					</span>
				) : (
					contacts.map((contact) => {
						const done = invited.includes(contact.id) || inRoom.has(contact.id)
						return (
							<div
								key={contact.id}
								className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-surface"
							>
								<Avatar initials={initials(contact.name)} size="xs" tone="background" />
								<span className="flex-1 truncate font-semibold">{contact.name}</span>
								<Button
									size="sm"
									variant={done ? 'outline' : 'accent'}
									disabled={done}
									onClick={() => void invite(contact)}
								>
									{done && <CheckIcon />}
									{inRoom.has(contact.id) ? 'В звонке' : done ? 'Позвали' : 'Позвать'}
								</Button>
							</div>
						)
					})
				)}
			</div>
		</>
	)
}

export function InviteDialog() {
	const open = useRoomStore((state) => state.inviteOpen)

	return (
		<Dialog open={open} onOpenChange={roomActions.setInviteOpen}>
			<DialogContent>{open && <InviteContent />}</DialogContent>
		</Dialog>
	)
}
