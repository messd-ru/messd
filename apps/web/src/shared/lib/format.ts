const pluralRules = new Intl.PluralRules('ru')

const units = {
	hour: { one: 'час', few: 'часа', many: 'часов' },
	minute: { one: 'минуту', few: 'минуты', many: 'минут' },
	second: { one: 'секунду', few: 'секунды', many: 'секунд' },
	participant: { one: 'участник', few: 'участника', many: 'участников' },
} as const

export function plural(count: number, unit: keyof typeof units) {
	const forms = units[unit]
	const rule = pluralRules.select(count)
	const form = rule === 'one' ? forms.one : rule === 'few' ? forms.few : forms.many
	return `${count} ${form}`
}

function pad(value: number) {
	return String(value).padStart(2, '0')
}

export function formatDuration(ms: number) {
	const total = Math.max(0, Math.floor(ms / 1000))
	const hours = Math.floor(total / 3600)
	const minutes = Math.floor((total % 3600) / 60)
	const seconds = total % 60
	return hours
		? `${hours}:${pad(minutes)}:${pad(seconds)}`
		: `${pad(minutes)}:${pad(seconds)}`
}

export function formatCountdown(ms: number) {
	const total = Math.max(0, Math.ceil(ms / 1000))
	return `${Math.floor(total / 60)}:${pad(total % 60)}`
}

export function formatSpokenDuration(ms: number) {
	const total = Math.max(0, Math.floor(ms / 1000))
	const hours = Math.floor(total / 3600)
	const minutes = Math.floor((total % 3600) / 60)
	const seconds = total % 60
	const parts = [
		hours ? plural(hours, 'hour') : null,
		minutes ? plural(minutes, 'minute') : null,
		seconds || (!hours && !minutes) ? plural(seconds, 'second') : null,
	]
	return parts.filter(Boolean).join(' ')
}

export function formatToday(date = new Date()) {
	const text = new Intl.DateTimeFormat('ru', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
	}).format(date)
	return text.charAt(0).toUpperCase() + text.slice(1)
}

export function initials(name: string) {
	const letters = name
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? '')
		.join('')
	return letters || '?'
}

export function firstName(name: string) {
	return name.trim().split(/\s+/)[0] ?? name
}
