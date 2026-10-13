import type { Contact } from '@messd/contracts/guest'
import { Avatar } from '@messd/ui/components/avatar'
import { Button } from '@messd/ui/components/button'
import { Input } from '@messd/ui/components/input'
import { Popover, PopoverAnchor, PopoverContent } from '@messd/ui/components/popover'
import { PhoneIcon, SearchIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { searchContacts } from '#shared/api/contacts.ts'
import { useStartCall } from '#shared/hooks/use-start-call.ts'
import { initials } from '#shared/lib/format.ts'
import { useSession } from '#shared/store/session.ts'

const DEBOUNCE_MS = 200

const lastCallFormat = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long' })

export function PeopleSearch() {
	const token = useSession((state) => state.token)
	const [query, setQuery] = useState('')
	const [open, setOpen] = useState(false)
	const [contacts, setContacts] = useState<Contact[] | null>(null)
	const { start, pending } = useStartCall()

	useEffect(() => {
		if (!open || !token) return
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
	}, [open, query, token])

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverAnchor asChild>
				<div className="w-[280px]">
					<Input
						role="combobox"
						aria-expanded={open}
						aria-label="Найти человека"
						icon={<SearchIcon />}
						placeholder="Найти человека"
						value={query}
						onFocus={() => setOpen(true)}
						onChange={(event) => {
							setQuery(event.target.value)
							setOpen(true)
						}}
					/>
				</div>
			</PopoverAnchor>
			<PopoverContent
				align="end"
				className="flex w-[320px] flex-col gap-0.5 p-1.5"
				onOpenAutoFocus={(event) => event.preventDefault()}
				onInteractOutside={(event) => {
					if ((event.target as HTMLElement).closest('[role="combobox"]'))
						event.preventDefault()
				}}
			>
				{contacts === null ? (
					<span className="px-2.5 py-3 text-muted">Ищем…</span>
				) : contacts.length === 0 ? (
					<span className="px-2.5 py-3 leading-normal text-pretty text-muted">
						{query.trim()
							? 'Никого не нашли. Ищем среди тех, с кем вы созванивались'
							: 'Здесь появятся люди, с которыми вы созванивались'}
					</span>
				) : (
					contacts.map((contact) => (
						<div
							key={contact.id}
							className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-surface"
						>
							<Avatar initials={initials(contact.name)} size="xs" tone="background" />
							<div className="flex min-w-0 flex-1 flex-col">
								<span className="truncate font-semibold">{contact.name}</span>
								<span className="text-xs text-muted">
									Созванивались {lastCallFormat.format(new Date(contact.lastCallAt))}
								</span>
							</div>
							<Button
								size="sm"
								variant="accent"
								disabled={pending}
								onClick={() => void start({ guestId: contact.id, name: contact.name })}
							>
								<PhoneIcon />
								Позвонить
							</Button>
						</div>
					))
				)}
			</PopoverContent>
		</Popover>
	)
}
