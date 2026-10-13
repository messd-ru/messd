import { Switch } from '@messd/ui/components/switch'
import { AudioLinesIcon, MicOffIcon, SparklesIcon, VideoOffIcon } from 'lucide-react'
import { AudioOutputMenu } from '#pages/settings/components/audio-output-menu.tsx'
import {
	SettingRow,
	SettingsSection,
} from '#pages/settings/components/settings-section.tsx'
import { usePreferences } from '#shared/store/preferences.ts'

type CallsSectionProps = {
	desktop: boolean
}

export function CallsSection({ desktop }: CallsSectionProps) {
	const blur = usePreferences((state) => state.blur)
	const noiseSuppression = usePreferences((state) => state.noiseSuppression)
	const joinMuted = usePreferences((state) => state.joinMuted)
	const joinWithoutCamera = usePreferences((state) => state.joinWithoutCamera)
	const setPreference = usePreferences((state) => state.set)

	return (
		<SettingsSection title="Звонки">
			<SettingRow
				label="Размытие фона"
				description="Включать по умолчанию"
				icon={<SparklesIcon />}
				htmlFor="setting-blur"
			>
				<Switch
					id="setting-blur"
					checked={blur}
					onCheckedChange={(value) => setPreference('blur', value)}
				/>
			</SettingRow>
			<SettingRow
				label="Шумоподавление"
				description="Убирать фоновые звуки"
				icon={<AudioLinesIcon />}
				htmlFor="setting-noise"
			>
				<Switch
					id="setting-noise"
					checked={noiseSuppression}
					onCheckedChange={(value) => setPreference('noiseSuppression', value)}
				/>
			</SettingRow>
			<SettingRow
				label={desktop ? 'Входить с выключенным микрофоном' : 'Вход без микрофона'}
				icon={<MicOffIcon />}
				htmlFor="setting-join-muted"
			>
				<Switch
					id="setting-join-muted"
					checked={joinMuted}
					onCheckedChange={(value) => setPreference('joinMuted', value)}
				/>
			</SettingRow>
			{desktop ? (
				<SettingRow
					label="Входить с выключенной камерой"
					icon={<VideoOffIcon />}
					htmlFor="setting-join-camera"
				>
					<Switch
						id="setting-join-camera"
						checked={joinWithoutCamera}
						onCheckedChange={(value) => setPreference('joinWithoutCamera', value)}
					/>
				</SettingRow>
			) : (
				<AudioOutputMenu />
			)}
		</SettingsSection>
	)
}
