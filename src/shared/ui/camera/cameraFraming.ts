export interface CameraTransform {
  readonly zoom: number
  readonly panX: number
  readonly panY: number
}

export interface CameraFrame extends CameraTransform {
  readonly scale: number
  readonly width: number
  readonly height: number
  readonly cropX: number
  readonly cropY: number
  readonly cropWidth: number
  readonly cropHeight: number
}

export const INITIAL_CAMERA_TRANSFORM: CameraTransform = { zoom: 1, panX: 0, panY: 0 }

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export function resolveCameraFrame(
  sourceWidth: number,
  sourceHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  transform: CameraTransform,
): CameraFrame | null {
  if (![sourceWidth, sourceHeight, viewportWidth, viewportHeight].every((value) => Number.isFinite(value) && value > 0)) {
    return null
  }
  const zoom = clamp(Number.isFinite(transform.zoom) ? transform.zoom : 1, 1, 4)
  const scale = Math.max(viewportWidth / sourceWidth, viewportHeight / sourceHeight) * zoom
  const width = sourceWidth * scale
  const height = sourceHeight * scale
  const maxX = Math.max(0, (width - viewportWidth) / 2)
  const maxY = Math.max(0, (height - viewportHeight) / 2)
  const panX = clamp(Number.isFinite(transform.panX) ? transform.panX : 0, -maxX, maxX)
  const panY = clamp(Number.isFinite(transform.panY) ? transform.panY : 0, -maxY, maxY)
  const cropWidth = Math.min(sourceWidth, viewportWidth / scale)
  const cropHeight = Math.min(sourceHeight, viewportHeight / scale)
  return {
    zoom, panX, panY, scale, width, height, cropWidth, cropHeight,
    cropX: clamp((width / 2 - viewportWidth / 2 - panX) / scale, 0, sourceWidth - cropWidth),
    cropY: clamp((height / 2 - viewportHeight / 2 - panY) / scale, 0, sourceHeight - cropHeight),
  }
}

// Keep the source point under an anchor fixed while zooming. Coordinates are
// CSS pixels relative to the viewport centre; the final resolver clamps edges.
export function zoomCameraAt(frame: CameraFrame, zoom: number, x = 0, y = 0): CameraTransform {
  const nextZoom = clamp(Number.isFinite(zoom) ? zoom : frame.zoom, 1, 4)
  const ratio = nextZoom / frame.zoom
  return {
    zoom: nextZoom,
    panX: x - (x - frame.panX) * ratio,
    panY: y - (y - frame.panY) * ratio,
  }
}
