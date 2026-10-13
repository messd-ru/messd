import { Button } from '@messd/ui/components/button'
import {
	ChevronLeftIcon,
	PhoneIcon,
	RotateCwIcon,
	SettingsIcon,
	TriangleAlertIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { EffectToggle } from '#pages/room/components/lobby/effects-popover.tsx'
import { LobbyBlocked } from '#pages/room/components/lobby/lobby-blocked.tsx'
import { LobbyHeading } from '#pages/room/components/lobby/lobby-heading.tsx'
import { LobbyPreview } from '#pages/room/components/lobby/lobby-preview.tsx'
import { PermissionHelpSheet } from '#pages/room/components/lobby/permission-help-sheet.tsx'
import { localMedia, useLocalMedia } from '#pages/room/lib/local-media.ts'
import { DeviceSelect } from '#shared/components/device-select.tsx'
import { LogoMark } from '#shared/components/logo-mark.tsx'
import { useDevices } from '#shared/hooks/use-devices.ts'
import { useIsDesktop } from '#shared/hooks/use-media-query.ts'
import { supportsSinkSelection } from '#shared/lib/media-support.ts'
import { usePreferences } from '#shared/store/preferences.ts'

type LobbyProps = {
	ready: boolean
	joining: boolean
	onJoin: (withVideo: boolean) => void
}

function LobbyDevices() {
	const permission = useLocalMedia((state) => state.permission)
	const { cameras, microphones, speakers } = useDevices(permission)
	const cameraId = usePreferences((state) => state.cameraId)
	const micId = usePreferences((state) => state.micId)
	const speakerId = usePreferences((state) => state.speakerId)
	const setPreference = usePreferences((state) => state.set)

	return (
		<div className="grid grid-cols-3 gap-2.5">
			<DeviceSelect
				kind="camera"
				devices={cameras}
				value={cameraId}
				onChange={(id) => {
					setPreference('cameraId', id)
					void localMedia.reselect('camera')
				}}
			/>
			<DeviceSelect
				kind="microphone"
				devices={microphones}
				value={micId}
				onChange={(id) => {
					setPreference('micId', id)
					void localMedia.reselect('microphone')
				}}
			/>
			<DeviceSelect
				kind="speaker"
				devices={supportsSinkSelection ? speakers : []}
				value={speakerId}
				fallback="Системный динамик"
				onChange={(id) => setPreference('speakerId', id)}
			/>
		</div>
	)
}

function DesktopLobby({ ready, joining, onJoin }: LobbyProps) {
	const permission = useLocalMedia((state) => state.permission)
	const blur = useLocalMedia((state) => state.blur)
	const blurPending = useLocalMedia((state) => state.blurPending)
	const noiseSuppression = useLocalMedia((state) => state.noiseSuppression)
	const cameraEnabled = useLocalMedia((state) => state.cameraEnabled)
	const blocked = permission === 'denied'
	const waiting = joining || !ready || permission === 'pending'

	return (
		<div className="flex h-dvh flex-col">
			<header className="flex h-16 shrink-0 items-center justify-between border-b border-line px-7">
				<Link to="/" className="flex w-16 items-center gap-2 font-semibold text-muted">
					<ChevronLeftIcon className="size-[18px]" />
					Назад
				</Link>
				<LogoMark />
				<div className="w-16" />
			</header>
			<main className="mx-auto grid min-h-0 w-full max-w-[1440px] flex-1 grid-cols-[minmax(0,1fr)_360px] items-center gap-12 overflow-y-auto px-16 py-12">
				<div className="flex w-full max-w-[calc((100dvh-216px)*1.6)] flex-col gap-4 justify-self-center">
					{blocked ? <LobbyBlocked /> : <LobbyPreview />}
					{!blocked && <LobbyDevices />}
				</div>
				<div className="flex flex-col gap-7">
					<LobbyHeading withAvatars={!blocked} />
					{blocked ? (
						<div className="flex gap-2.5 rounded-xl border border-line bg-surface px-4 py-3.5">
							<TriangleAlertIcon className="size-[18px] shrink-0 text-danger" />
							<span className="leading-normal text-muted">
								Без доступа вас не увидят и не услышат. Можно войти и только смотреть.
							</span>
						</div>
					) : (
						<div className="flex flex-col rounded-xl border border-line">
							<EffectToggle
								id="lobby-blur"
								label="Размыть фон"
								hint={blurPending ? 'Загружаем модель…' : 'Скрыть то, что за спиной'}
								checked={blur}
								onChange={(value) => void localMedia.setBlur(value)}
							/>
							<EffectToggle
								id="lobby-noise"
								label="Шумоподавление"
								hint="Убрать фоновые звуки"
								checked={noiseSuppression}
								onChange={(value) => void localMedia.setNoiseSuppression(value)}
								bordered
							/>
						</div>
					)}
					<div className="flex flex-col gap-2.5">
						{blocked ? (
							<>
								<Button
									variant="accent"
									size="xl"
									onClick={() => void localMedia.start()}
								>
									<RotateCwIcon />
									Проверить снова
								</Button>
								<Button
									variant="outline"
									size="xl"
									disabled={joining || !ready}
									onClick={() => onJoin(false)}
								>
									Войти без камеры и микрофона
								</Button>
							</>
						) : (
							<>
								<Button
									variant="accent"
									size="xl"
									disabled={waiting}
									onClick={() => onJoin(cameraEnabled)}
								>
									{joining ? 'Подключаемся…' : 'Подключиться'}
								</Button>
								<Button
									variant="outline"
									size="xl"
									disabled={waiting}
									onClick={() => onJoin(false)}
								>
									<PhoneIcon />
									Только голос
								</Button>
							</>
						)}
					</div>
				</div>
			</main>
		</div>
	)
}

function MobileLobby({ ready, joining, onJoin }: LobbyProps) {
	const permission = useLocalMedia((state) => state.permission)
	const cameraEnabled = useLocalMedia((state) => state.cameraEnabled)
	const { speakers } = useDevices(permission)
	const speakerId = usePreferences((state) => state.speakerId)
	const setPreference = usePreferences((state) => state.set)
	const [helpOpen, setHelpOpen] = useState(false)
	const blocked = permission === 'denied'
	const waiting = joining || !ready || permission === 'pending'

	return (
		<div className="flex h-dvh flex-col safe-top">
			<Link
				to="/"
				className="flex items-center gap-2 px-4 py-2 pt-[calc(8px+max(0px,12px-env(safe-area-inset-top)))] font-semibold text-muted"
			>
				<ChevronLeftIcon className="size-5" />
				Назад
			</Link>
			<div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-5 pt-2">
				{blocked ? <LobbyBlocked mobile /> : <LobbyPreview mobile />}
				<LobbyHeading compact />
				{!blocked && (
					<DeviceSelect
						kind="speaker"
						devices={supportsSinkSelection ? speakers : []}
						value={speakerId}
						fallback="Динамик телефона"
						onChange={(id) => setPreference('speakerId', id)}
						className="h-11 rounded-[10px]"
					/>
				)}
			</div>
			<div className="flex flex-col gap-2.5 px-5 pt-4 safe-bottom">
				<div className="flex flex-col gap-2.5 pb-[max(0px,34px-env(safe-area-inset-bottom))]">
					{blocked ? (
						<>
							<Button variant="accent" size="mobile" onClick={() => setHelpOpen(true)}>
								<SettingsIcon />
								Открыть настройки
							</Button>
							<Button
								variant="outline"
								size="mobile"
								disabled={joining || !ready}
								onClick={() => onJoin(false)}
							>
								Войти без камеры
							</Button>
						</>
					) : (
						<>
							<Button
								variant="accent"
								size="mobile"
								className="h-[52px] text-base"
								disabled={waiting}
								onClick={() => onJoin(cameraEnabled)}
							>
								{joining ? 'Подключаемся…' : 'Подключиться'}
							</Button>
							<Button
								variant="ghost"
								size="mobile"
								disabled={waiting}
								onClick={() => onJoin(false)}
							>
								<PhoneIcon />
								Только голос
							</Button>
						</>
					)}
				</div>
			</div>
			<PermissionHelpSheet
				open={helpOpen}
				onOpenChange={setHelpOpen}
				onRetry={() => void localMedia.start()}
			/>
		</div>
	)
}

export function Lobby(props: LobbyProps) {
	const isDesktop = useIsDesktop()
	return isDesktop ? <DesktopLobby {...props} /> : <MobileLobby {...props} />
}
