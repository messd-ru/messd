export const ports = { api: 3100, core: 4100, rtc: 40100, web: 5180 }

export const urls = {
	api: `http://localhost:${ports.api}`,
	core: `ws://localhost:${ports.core}/ws`,
	web: `http://localhost:${ports.web}`,
}
