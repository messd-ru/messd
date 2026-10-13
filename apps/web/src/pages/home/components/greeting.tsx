import { useState } from 'react'
import { NameDialog } from '#shared/components/name-dialog.tsx'
import { firstName, formatToday } from '#shared/lib/format.ts'
import { useSession } from '#shared/store/session.ts'

export function Greeting() {
	const guest = useSession((state) => state.guest)
	const [editing, setEditing] = useState(false)

	return (
		<div className="flex flex-col gap-1.5">
			<span className="hidden font-medium text-muted lg:block">{formatToday()}</span>
			<h1 className="m-0 text-[28px] font-semibold lg:text-[32px] lg:tracking-[-0.01em]">
				Привет,{' '}
				<button
					type="button"
					title="Изменить имя"
					onClick={() => setEditing(true)}
					className="rounded-md decoration-line decoration-2 underline-offset-4 outline-none hover:underline focus-visible:underline"
				>
					{guest ? firstName(guest.name) : 'гость'}
				</button>
			</h1>
			<NameDialog open={editing} onOpenChange={setEditing} />
		</div>
	)
}
