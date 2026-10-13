import type { Peer } from '@messd/contracts/signaling'
import { Avatar } from '@messd/ui/components/avatar'
import { Button } from '@messd/ui/components/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@messd/ui/components/dropdown-menu'
import { Input } from '@messd/ui/components/input'
import { cn } from '@messd/ui/lib/utils'
import {
	CopyIcon,
	EllipsisIcon,
	HandIcon,
	MicIcon,
	MicOffIcon,
	PinIcon,
	PinOffIcon,
	SearchIcon,
	UserMinusIcon,
	UserPlusIcon,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { PanelFrame } from '#pages/room/components/panels/panel-frame.tsx'
import { useLocalMedia } from '#pages/room/lib/local-media.ts'
import { useRoomSession } from '#pages/room/lib/session-context.ts'
import { remotePeers, roomActions, useRoomStore } from '#pages/room/store/room-store.ts'
import { copyRoomLink } from '#shared/lib/clipboard.ts'
import { initials } from '#shared/lib/format.ts'
import { useSession } from '#shared/store/session.ts'

type Row = {
	id: string
	tileId: string
	name: string
	role: string
	audio: boolean
	hand: boolean
	handRaisedAt: number | null
	self: boolean
	peer: Peer | null
}

function describe(
	peer: Pick<Peer, 'role' | 'video' | 'reconnecting'>,
	speaking: boolean,
) {
	if (peer.reconnecting) return 'Переподключается…'
	if (peer.role === 'creator') return 'Создатель комнаты'
	if (speaking) return 'Говорит'
	if (!peer.video) return 'Без видео'
	return 'В комнате'
}

export function ParticipantsPanel({ mobile }: { mobile: boolean }) {
	const session = useRoomSession()
	const guest = useSession((state) => state.guest)
	const open = useRoomStore((state) => state.panel === 'participants')
	const code = useRoomStore((state) => state.code)
	const peers = useRoomStore((state) => state.peers)
	const selfId = useRoomStore((state) => state.selfId)
	const creatorId = useRoomStore((state) => state.creatorId)
	const activeSpeakerId = useRoomStore((state) => state.activeSpeakerId)
	const pinnedId = useRoomStore((state) => state.pinnedId)
	const hand = useRoomStore((state) => state.hand)
	const micEnabled = useLocalMedia((state) => state.micEnabled)
	const cameraEnabled = useLocalMedia((state) => state.cameraEnabled)
	const [query, setQuery] = useState('')
	const selfIsCreator = Boolean(guest && guest.id === creatorId)
	const total = Object.keys(peers).length + 1

	const selfRow: Row = {
		id: selfId ?? 'self',
		tileId: 'self',
		name: `${guest?.name ?? 'Вы'} (вы)`,
		role: describe(
			{
				role: selfIsCreator ? 'creator' : 'member',
				video: cameraEnabled,
				reconnecting: false,
			},
			activeSpeakerId === selfId,
		),
		audio: micEnabled,
		hand,
		handRaisedAt: hand ? 0 : null,
		self: true,
		peer: null,
	}

	const rows = [
		selfRow,
		...remotePeers({ peers }).map<Row>((peer) => ({
			id: peer.id,
			tileId: peer.id,
			name: peer.name,
			role: describe(peer, activeSpeakerId === peer.id),
			audio: peer.audio,
			hand: peer.hand,
			handRaisedAt: peer.handRaisedAt,
			self: false,
			peer,
		})),
	]
		.filter((row) => row.name.toLowerCase().includes(query.trim().toLowerCase()))
		.sort((a, b) => {
			if (a.hand !== b.hand) return a.hand ? -1 : 1
			if (a.hand && b.hand) return (a.handRaisedAt ?? 0) - (b.handRaisedAt ?? 0)
			return 0
		})

	async function moderate(peer: Peer, action: 'mute' | 'remove') {
		try {
			await session.moderate(peer.id, action)
			toast(
				action === 'mute'
					? `Микрофон выключен: ${peer.name}`
					: `${peer.name}: удалён из комнаты`,
			)
		} catch {
			toast.error('Не удалось выполнить действие')
		}
	}

	return (
		<PanelFrame
			title={`Участники · ${total}`}
			description="Список участников звонка"
			mobile={mobile}
			open={open}
		>
			<div className={cn('flex flex-col gap-2.5', mobile ? 'px-5 pb-3' : 'px-4 pb-3.5')}>
				{!mobile && (
					<Input
						icon={<SearchIcon />}
						placeholder="Поиск"
						aria-label="Поиск по участникам"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						className="h-9 px-2.5"
					/>
				)}
				<div className="grid grid-cols-2 gap-2">
					<Button
						variant="inverse"
						size={mobile ? 'lg' : 'sm'}
						onClick={() => roomActions.setInviteOpen(true)}
					>
						<UserPlusIcon />
						Пригласить
					</Button>
					<Button
						variant="outline"
						size={mobile ? 'lg' : 'sm'}
						onClick={() => void copyRoomLink(code)}
					>
						<CopyIcon />
						Ссылка
					</Button>
				</div>
			</div>
			<ul
				data-testid="participants-list"
				className={cn(
					'm-0 flex min-h-0 flex-1 list-none flex-col gap-0.5 overflow-y-auto',
					mobile ? 'px-3 py-1' : 'border-t border-line p-2',
				)}
			>
				{rows.map((row) => (
					<li
						key={row.id}
						data-testid="participant-row"
						className={cn(
							'flex items-center gap-2.5 rounded-lg',
							mobile ? 'min-h-14 gap-3 px-2 py-2.5' : 'p-2',
						)}
					>
						<Avatar
							initials={initials(row.self ? (guest?.name ?? '') : row.name)}
							size={mobile ? 'sm' : 'xs'}
							tone={mobile ? 'surface' : 'background'}
						/>
						<div className="flex min-w-0 flex-1 flex-col">
							<span className="truncate font-semibold">{row.name}</span>
							<span className="text-xs text-muted">{row.role}</span>
						</div>
						{row.hand && (
							<HandIcon className="size-[15px] text-accent" aria-label="Поднята рука" />
						)}
						{row.audio ? (
							<MicIcon
								className="size-[15px] text-accent"
								aria-label="Микрофон включён"
							/>
						) : (
							<MicOffIcon
								className="size-[15px] text-muted"
								aria-label="Микрофон выключен"
							/>
						)}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									aria-label={`Действия: ${row.name}`}
									className="grid size-7 place-items-center rounded-md text-muted outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-accent/50"
								>
									<EllipsisIcon className="size-[15px]" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onSelect={() => roomActions.pin(row.tileId)}>
									{pinnedId === row.tileId ? <PinOffIcon /> : <PinIcon />}
									{pinnedId === row.tileId ? 'Открепить видео' : 'Закрепить видео'}
								</DropdownMenuItem>
								{selfIsCreator && row.peer && (
									<>
										<DropdownMenuItem
											disabled={!row.audio}
											onSelect={() => row.peer && void moderate(row.peer, 'mute')}
										>
											<MicOffIcon />
											Выключить микрофон
										</DropdownMenuItem>
										<DropdownMenuItem
											tone="danger"
											onSelect={() => row.peer && void moderate(row.peer, 'remove')}
										>
											<UserMinusIcon />
											Удалить из комнаты
										</DropdownMenuItem>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</li>
				))}
			</ul>
		</PanelFrame>
	)
}
