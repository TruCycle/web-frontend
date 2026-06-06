// Lazy-loaded MobileNet image classifier.
// Heavy deps are dynamically imported so they only land in the Spot route bundle.

export interface ClassificationResult {
  readonly className: string
  readonly probability: number
}

type MobileNetModel = {
  classify: (input: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageData) => Promise<ClassificationResult[]>
}

let modelPromise: Promise<MobileNetModel> | null = null

async function loadModel(): Promise<MobileNetModel> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const [, mobilenet] = await Promise.all([
        import('@tensorflow/tfjs'),
        import('@tensorflow-models/mobilenet'),
      ])
      // version 2 / alpha 0.5 keeps the bundle and download lighter than the default.
      return mobilenet.load({ version: 2, alpha: 0.5 }) as Promise<MobileNetModel>
    })().catch((cause) => {
      modelPromise = null
      throw cause
    })
  }

  return modelPromise
}

function fileToImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not decode the captured image.'))
    }
    image.src = url
  })
}

export async function classifyImageFile(file: File, topK = 5): Promise<ClassificationResult[]> {
  const [model, image] = await Promise.all([loadModel(), fileToImageElement(file)])
  const predictions = await model.classify(image)
  return predictions.slice(0, topK)
}

export function warmUpClassifier(): void {
  void loadModel().catch(() => {
    // Swallow — classification will surface the error on the actual call.
  })
}
