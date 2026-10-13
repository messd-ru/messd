import { guestNameSchema } from '@messd/contracts/guest'
import { Button } from '@messd/ui/components/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from '@messd/ui/components/dialog'
import { Input } from '@messd/ui/components/input'
import { UserIcon } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { createGuest, renameGuest } from '#shared/api/guest.ts'
import { useSession } from '#shared/store/session.ts'

type NameDialogProps = {
	open: boolean
	onOpenChange?: (open: boolean) => void
}

export function NameDialog({ open, onOpenChange }: NameDialogProps) {
	const guest = useSession((state) => state.guest)
	const token = useSession((state) => state.token)
	const editing = Boolean(token && guest)

	return (
		<Dialog open={open} onOpenChange={editing ? onOpenChange : undefined}>
			<DialogContent
				closable={editing}
				onEscapeKeyDown={(event) => {
					if (!editing) event.preventDefault()
				}}
				onInteractOutside={(event) => {
					if (!editing) event.preventDefault()
				}}
			>
				<NameForm key={String(open)} onDone={() => onOpenChange?.(false)} />
			</DialogContent>
		</Dialog>
	)
}

function NameForm({ onDone }: { onDone: () => void }) {
	const guest = useSession((state) => state.guest)
	const token = useSession((state) => state.token)
	const setSession = useSession((state) => state.setSession)
	const setGuest = useSession((state) => state.setGuest)
	const editing = Boolean(token && guest)
	const [name, setName] = useState(guest?.name ?? '')
	const [error, setError] = useState<string | null>(null)
	const [pending, setPending] = useState(false)

	async function submit(event: FormEvent) {
		event.preventDefault()
		const parsed = guestNameSchema.safeParse(name)
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message ?? 'Проверьте имя')
			return
		}
		setPending(true)
		try {
			if (editing) {
				const { guest: updated } = await renameGuest(parsed.data)
				setGuest(updated)
			} else {
				const session = await createGuest(parsed.data)
				setSession(session.guest, session.token)
			}
			onDone()
		} catch {
			setError('Не удалось сохранить имя. Попробуйте ещё раз')
		} finally {
			setPending(false)
		}
	}

	return (
		<form onSubmit={submit} className="flex flex-col gap-[18px]" noValidate>
			<div className="flex flex-col gap-1.5">
				<DialogTitle>{editing ? 'Как вас называть?' : 'Как вас зовут?'}</DialogTitle>
				<DialogDescription>
					Имя увидят собеседники в звонке. Регистрация не нужна.
				</DialogDescription>
			</div>
			<div className="flex flex-col gap-2">
				<Input
					autoFocus
					icon={<UserIcon />}
					name="name"
					autoComplete="given-name"
					placeholder="Ваше имя"
					maxLength={40}
					value={name}
					invalid={Boolean(error)}
					onChange={(event) => {
						setName(event.target.value)
						setError(null)
					}}
					className="h-11 rounded-[10px]"
				/>
				{error && (
					<span role="alert" className="text-[13px] font-medium text-danger">
						{error}
					</span>
				)}
			</div>
			<Button type="submit" variant="accent" size="xl" disabled={pending}>
				{editing ? 'Сохранить' : 'Продолжить'}
			</Button>
		</form>
	)
}
