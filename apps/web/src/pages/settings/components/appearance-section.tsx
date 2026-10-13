import { Switch } from '@messd/ui/components/switch'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@messd/ui/components/dropdown-menu'
import { BellIcon, CheckIcon } from 'lucide-react'
import { toast } from 'sonner'
import { MenuValue } from '#pages/settings/components/menu-value.tsx'
import {
	SettingRow,
	SettingsSection,
} from '#pages/settings/components/settings-section.tsx'
import { ensureNotificationPermission } from '#pages/settings/lib/notifications.ts'
import { ThemeToggle } from '#shared/components/theme-toggle.tsx'
import { usePreferences } from '#shared/store/preferences.ts'

async function enableBrowserNotifications() {
	const granted = await ensureNotificationPermission()
	if (!granted)
		toast.error('Браузер запретил уведомления. Разрешите их в настройках сайта')
	return granted
}

export function AppearanceSection() {
	const ringtone = usePreferences((state) => state.ringtone)
	const browserNotifications = usePreferences((state) => state.browserNotifications)
	const setPreference = usePreferences((state) => state.set)

	return (
		<SettingsSection title="Оформление и уведомления">
			<SettingRow label="Тема">
				<ThemeToggle itemClassName="h-8 px-3 [&_svg]:size-3.5" />
			</SettingRow>
			<SettingRow label="Звук входящего звонка" htmlFor="setting-ringtone">
				<Switch
					id="setting-ringtone"
					checked={ringtone}
					onCheckedChange={(value) => setPreference('ringtone', value)}
				/>
			</SettingRow>
			<SettingRow
				label="Уведомления в браузере"
				description="Когда вам звонят, а вкладка неактивна"
				htmlFor="setting-browser-notifications"
			>
				<Switch
					id="setting-browser-notifications"
					checked={browserNotifications}
					onCheckedChange={async (value) => {
						setPreference(
							'browserNotifications',
							value && (await enableBrowserNotifications()),
						)
					}}
				/>
			</SettingRow>
		</SettingsSection>
	)
}

export function MobileAppearanceSections() {
	const ringtone = usePreferences((state) => state.ringtone)
	const browserNotifications = usePreferences((state) => state.browserNotifications)
	const setPreference = usePreferences((state) => state.set)
	const enabled = ringtone || browserNotifications

	async function setEnabled(value: boolean) {
		setPreference('ringtone', value)
		setPreference('browserNotifications', value && (await enableBrowserNotifications()))
	}

	return (
		<>
			<SettingsSection title="Оформление">
				<div className="p-2.5">
					<ThemeToggle
						className="grid grid-cols-2"
						itemClassName="h-10 text-sm [&_svg]:size-[15px]"
					/>
				</div>
			</SettingsSection>
			<SettingsSection title="Уведомления">
				<SettingRow label="Уведомления" icon={<BellIcon />}>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<MenuValue>{enabled ? 'Вкл' : 'Выкл'}</MenuValue>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="min-w-36">
							{[true, false].map((value) => (
								<DropdownMenuItem
									key={String(value)}
									onSelect={() => void setEnabled(value)}
								>
									<span className="flex-1">{value ? 'Включены' : 'Выключены'}</span>
									{value === enabled && <CheckIcon className="text-accent!" />}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</SettingRow>
			</SettingsSection>
		</>
	)
}
