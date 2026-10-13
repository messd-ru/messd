import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@messd/ui/components/dropdown-menu'
import { CheckIcon, Volume2Icon } from 'lucide-react'
import { MenuValue } from '#pages/settings/components/menu-value.tsx'
import { SettingRow } from '#pages/settings/components/settings-section.tsx'
import { useDevices } from '#shared/hooks/use-devices.ts'
import { supportsSinkSelection } from '#shared/lib/media-support.ts'
import { usePreferences } from '#shared/store/preferences.ts'

export function AudioOutputMenu() {
	const { speakers } = useDevices()
	const speakerId = usePreferences((state) => state.speakerId)
	const setPreference = usePreferences((state) => state.set)
	const options = supportsSinkSelection ? speakers : []
	const current = options.find((device) => device.deviceId === speakerId) ?? options[0]

	return (
		<SettingRow label="Аудиовыход" icon={<Volume2Icon />}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild disabled={!options.length}>
					<MenuValue>
						<span className="max-w-32 truncate">{current?.label ?? 'Динамик'}</span>
					</MenuValue>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{options.map((device) => (
						<DropdownMenuItem
							key={device.deviceId}
							onSelect={() => setPreference('speakerId', device.deviceId)}
						>
							<span className="flex-1 truncate">{device.label}</span>
							{device.deviceId === current?.deviceId && (
								<CheckIcon className="text-accent!" />
							)}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</SettingRow>
	)
}
