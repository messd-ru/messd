import { Tooltip, TooltipContent, TooltipTrigger } from '@messd/ui/components/tooltip'
import { cn } from '@messd/ui/lib/utils'
import { LockIcon, LockOpenIcon } from 'lucide-react'
import { useRoomStore } from '#pages/room/store/room-store.ts'

function useEncryptionHint() {
	const encrypted = useRoomStore((state) => state.encrypted)
	const safetyCode = useRoomStore((state) => state.safetyCode)
	const hint = encrypted
		? `Сквозное шифрование включено${safetyCode ? `. Код безопасности: ${safetyCode} — сверьте его с собеседниками` : ''}`
		: 'Браузер не поддерживает сквозное шифрование — звонок защищён только транспортным шифрованием'
	return { encrypted, hint }
}

export function EncryptionIcon({ className }: { className?: string }) {
	const { encrypted, hint } = useEncryptionHint()
	const Icon = encrypted ? LockIcon : LockOpenIcon
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span
					tabIndex={0}
					aria-label={encrypted ? 'Сквозное шифрование' : 'Без сквозного шифрования'}
					data-testid="encryption-indicator"
					data-encrypted={encrypted}
					className={cn('inline-flex outline-none', className)}
				>
					<Icon className="size-[11px]" />
				</span>
			</TooltipTrigger>
			<TooltipContent>{hint}</TooltipContent>
		</Tooltip>
	)
}

export function EncryptionPill() {
	const { encrypted, hint } = useEncryptionHint()
	const Icon = encrypted ? LockIcon : LockOpenIcon
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span
					tabIndex={0}
					data-testid="encryption-indicator"
					data-encrypted={encrypted}
					className="flex h-[30px] items-center gap-1.5 rounded-full border border-line px-2.5 text-xs font-semibold text-muted outline-none"
				>
					<Icon className="size-3" />
					{encrypted ? 'Сквозное шифрование' : 'Транспортное шифрование'}
				</span>
			</TooltipTrigger>
			<TooltipContent>{hint}</TooltipContent>
		</Tooltip>
	)
}
