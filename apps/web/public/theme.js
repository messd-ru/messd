try {
	const stored = JSON.parse(localStorage.getItem('messd:preferences') ?? 'null')
	document.documentElement.dataset.theme =
		stored?.state?.theme === 'dark' ? 'dark' : 'light'
} catch {
	document.documentElement.dataset.theme = 'light'
}
