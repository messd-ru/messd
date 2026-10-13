export async function ensureNotificationPermission() {
	if (!('Notification' in window)) return false
	if (Notification.permission === 'granted') return true
	if (Notification.permission === 'denied') return false
	return (await Notification.requestPermission()) === 'granted'
}
