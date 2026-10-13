import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@messd/ui/components/select'
import { MicIcon, VideoIcon, Volume2Icon } from 'lucide-react'

const icons = {
	camera: VideoIcon,
	microphone: MicIcon,
	speaker: Volume2Icon,
}

const placeholders = {
	camera: 'Камера',
	microphone: 'Микрофон',
	speaker: 'Динамик',
}

type DeviceSelectProps = {
	kind: keyof typeof icons
	devices: MediaDeviceInfo[]
	value: string | null
	onChange: (deviceId: string) => void
	className?: string
	fallback?: string
}

export function DeviceSelect({
	kind,
	devices,
	value,
	onChange,
	className,
	fallback,
}: DeviceSelectProps) {
	const Icon = icons[kind]
	const selected = devices.some((device) => device.deviceId === value)
		? (value ?? undefined)
		: devices[0]?.deviceId

	return (
		<Select value={selected ?? ''} onValueChange={onChange} disabled={!devices.length}>
			<SelectTrigger
				icon={<Icon />}
				className={className}
				aria-label={placeholders[kind]}
			>
				<SelectValue placeholder={fallback ?? placeholders[kind]} />
			</SelectTrigger>
			<SelectContent>
				{devices.map((device) => (
					<SelectItem key={device.deviceId} value={device.deviceId}>
						{device.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
