import type { ImageSegmenter } from '@mediapipe/tasks-vision'
import wasmLoaderPath from '@mediapipe/tasks-vision/vision_wasm_internal.js?url'
import wasmBinaryPath from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url'

const MODEL_URL = '/models/selfie_segmenter.tflite'
const FRAME_INTERVAL_MS = 1000 / 30
const BLUR_RADIUS = 14
const DOWNSCALE = 16

let segmenter: Promise<ImageSegmenter> | null = null

function loadSegmenter() {
	segmenter ??= import('@mediapipe/tasks-vision').then(({ ImageSegmenter }) =>
		ImageSegmenter.createFromOptions(
			{ wasmLoaderPath, wasmBinaryPath },
			{
				baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
				runningMode: 'VIDEO',
				outputCategoryMask: false,
				outputConfidenceMasks: true,
			},
		),
	)
	return segmenter
}

function canvas(width: number, height: number) {
	const element = document.createElement('canvas')
	element.width = width
	element.height = height
	const context = element.getContext('2d')
	if (!context) throw new Error('Canvas 2D is not supported')
	return { element, context }
}

export async function blurTrack(source: MediaStreamTrack) {
	const model = await loadSegmenter()
	const video = document.createElement('video')
	video.muted = true
	video.playsInline = true
	video.srcObject = new MediaStream([source])
	await video.play()

	const width = video.videoWidth || 640
	const height = video.videoHeight || 480
	const output = canvas(width, height)
	const person = canvas(width, height)
	const small = canvas(Math.ceil(width / DOWNSCALE), Math.ceil(height / DOWNSCALE))
	const mask = canvas(1, 1)
	const nativeBlur = 'filter' in output.context
	let maskData: ImageData | null = null
	let stopped = false
	let timer: ReturnType<typeof setTimeout> | undefined

	const drawBackground = () => {
		if (nativeBlur) {
			output.context.filter = `blur(${BLUR_RADIUS}px)`
			output.context.drawImage(video, 0, 0, width, height)
			output.context.filter = 'none'
			return
		}
		small.context.drawImage(video, 0, 0, small.element.width, small.element.height)
		output.context.imageSmoothingQuality = 'high'
		output.context.drawImage(small.element, 0, 0, width, height)
	}

	const render = () => {
		if (stopped) return
		if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
			model.segmentForVideo(video, performance.now(), (result) => {
				const confidence = result.confidenceMasks?.[0]
				if (!confidence) return
				if (
					!maskData ||
					maskData.width !== confidence.width ||
					maskData.height !== confidence.height
				) {
					mask.element.width = confidence.width
					mask.element.height = confidence.height
					maskData = mask.context.createImageData(confidence.width, confidence.height)
				}
				const values = confidence.getAsFloat32Array()
				for (let index = 0; index < values.length; index += 1) {
					maskData.data[index * 4 + 3] = (values[index] ?? 0) * 255
				}
				mask.context.putImageData(maskData, 0, 0)
			})
			drawBackground()
			person.context.globalCompositeOperation = 'copy'
			person.context.drawImage(mask.element, 0, 0, width, height)
			person.context.globalCompositeOperation = 'source-in'
			person.context.drawImage(video, 0, 0, width, height)
			output.context.drawImage(person.element, 0, 0)
		}
		timer = setTimeout(render, FRAME_INTERVAL_MS)
	}
	render()

	const track = output.element.captureStream(30).getVideoTracks()[0]
	if (!track) throw new Error('Canvas capture is not supported')

	return {
		track,
		stop() {
			stopped = true
			clearTimeout(timer)
			track.stop()
			video.srcObject = null
		},
	}
}
