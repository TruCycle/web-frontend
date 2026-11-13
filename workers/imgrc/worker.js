/**
 * TruCycle Vision Worker
 * Cloudflare Worker — deploy via `wrangler deploy`
 *
 * Required binding in wrangler.toml:
 *   [ai]
 *   binding = "AI"
 *
 * Model: @cf/meta/llama-3.2-11b-vision-instruct
 *   - Proper vision model (unlike Gemma 4 which is text-only)
 *   - Accepts messages[] + image array
 *   - Better JSON instruction-following than LLaVA 1.5
 */

const MODEL = '@cf/meta/llama-3.2-11b-vision-instruct'

// 1.5 MB hard limit — Workers can't resize images and spreading a 3MB
// Uint8Array into a number[] easily exceeds the thread memory ceiling
const MAX_BYTES = 1.5 * 1024 * 1024
const MAX_BODY_BYTES = MAX_BYTES + 16 * 1024

async function readBoundedMultipart(request) {
  const reader = request.body?.getReader()
  if (!reader) throw new Error('Missing body')
  const chunks = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY_BYTES) {
        void reader.cancel().catch(() => {})
        return null
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const body = new Blob(chunks)
  return new Response(body, { headers: { 'Content-Type': request.headers.get('Content-Type') ?? '' } }).formData()
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

/**
 * Robust JSON extractor — handles LLaVA/Llama escaping quirks:
 *   - unescaped backslashes  e.g. "TV\stand"  → "TV\\stand"
 *   - control characters
 *   - markdown fences
 *   - trailing commas
 *   - text before/after the JSON object
 */
function extractJson(raw) {
  // If Cloudflare AI already parsed it into an object, return it directly
  if (typeof raw === 'object' && raw !== null) {
    return raw
  }

  // Guard against non-string types
  if (typeof raw !== 'string') {
    return null
  }

  let text = raw.trim()

  // Strip markdown fences
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  }

  // Slice out the first {...} block
  const start = text.indexOf('{')
  const end   = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null

  let candidate = text.slice(start, end + 1)

  // Pass 1 — try as-is
  try { return JSON.parse(candidate) } catch { /* fall through */ }

  // Pass 2 — fix common model escaping issues
  candidate = candidate
    // escape lone backslashes that aren't part of a valid JSON escape sequence
    .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
    // strip ASCII control characters (0x00–0x1F except \t \n \r)
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
    // trailing commas before } or ]
    .replace(/,\s*([}\]])/g, '$1')

  try { return JSON.parse(candidate) } catch { /* fall through */ }

  // Pass 3 — aggressively strip everything non-printable and retry
  candidate = candidate.replace(/[^\x20-\x7E\n\r\t]/g, '')
  try { return JSON.parse(candidate) } catch { /* fall through */ }

  return null
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405)
    }
    const secret = env.VISION_WORKER_SECRET
    if (typeof secret !== 'string' || !/^[0-9a-f]{64}$/.test(secret)) {
      return json({ error: 'Image analysis is unavailable' }, 503)
    }
    const bearer = /^Bearer ([0-9a-f]{64})$/.exec(request.headers.get('Authorization') ?? '')
    const encoder = new TextEncoder()
    if (!bearer || !crypto.subtle.timingSafeEqual(encoder.encode(bearer[1]), encoder.encode(secret))) {
      return json({ error: 'Unauthorized' }, 401)
    }

    if (!env.AI) {
      console.error('AI binding missing — add [ai] binding = "AI" to wrangler.toml')
      return json({ error: 'AI binding not configured' }, 500)
    }

    // ── Parse multipart form ────────────────────────────────────────────────
    let imageArray
    let userPrompt = 'Analyze this item for TruCycle.'

    try {
      const formData = await readBoundedMultipart(request)
      if (!formData) return json({ error: 'Request body is too large' }, 413)
      if (formData.getAll('image').length !== 1 || formData.getAll('prompt').length > 1 ||
          [...formData.keys()].some((key) => key !== 'image' && key !== 'prompt')) {
        return json({ error: 'Invalid image form data' }, 400)
      }
      const imageFile = formData.get('image')
      const customPrompt = formData.get('prompt')
      if (customPrompt !== null && (typeof customPrompt !== 'string' || new TextEncoder().encode(customPrompt).length > 1024)) {
        return json({ error: 'Invalid prompt' }, 400)
      }

      if (!imageFile || typeof imageFile === 'string') {
        return json({ error: "Missing 'image' file in form data" }, 400)
      }

      if (imageFile.size > MAX_BYTES) {
        return json({
          error: `Image too large (${(imageFile.size / 1024 / 1024).toFixed(1)} MB). Max 1.5 MB.`,
          hint: 'Resize or compress the image before uploading.',
        }, 413)
      }

      // Array.from is equivalent to spread but slightly more explicit;
      // the Workers AI SDK requires number[] not TypedArray for image inputs
      const arrayBuffer = await imageFile.arrayBuffer()
      imageArray = Array.from(new Uint8Array(arrayBuffer))

      if (customPrompt && typeof customPrompt === 'string' && customPrompt.trim()) {
        userPrompt = customPrompt.trim()
      }
    } catch {
      return json({ error: 'Failed to parse request body' }, 400)
    }

    // ── Run inference ───────────────────────────────────────────────────────
    try {
      // Per Cloudflare docs: messages[] is the correct format for this model.
      // The image is passed as a SEPARATE top-level field alongside messages[],
      // NOT nested inside the content array. The output key is { response: "..." }.
      const inferenceInput = {
        messages: [
          {
            role: 'system',
            content:
              'You are an item analysis AI for TruCycle UK. ' +
              'Respond with ONLY a raw JSON object — no markdown, no code fences, no extra text. ' +
              'Use plain ASCII only; no backslashes inside string values. ' +
              'Required keys: ' +
              '"item_type" (string, e.g. "sofa"), ' +
              '"condition" (one of: "Excellent", "Good", "Fair", "Poor"), ' +
              '"reusable" (boolean), ' +
              '"suggested_category" (one of: "Furniture", "Kitchenware", "Books + media", "Kids + baby", "Garden + tools", "Tech shelf", "Clothing", "Other"), ' +
              '"notes" (one short sentence, no backslashes).',
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        image: imageArray,  // top-level, not nested in content
        max_tokens: 350,
      }

      const response = await env.AI.run(MODEL, inferenceInput)

      // Output schema: { response: string | object }
      const rawOutput =
        response?.response ??
        response?.description ??
        response?.choices?.[0]?.message?.content ??
        (typeof response === 'string' ? response : null)

      if (!rawOutput) {
        throw new Error('Model returned an empty response')
      }

      const parsed = extractJson(rawOutput)

      if (parsed) {
        return json({ success: true, data: parsed })
      }

      // Could not extract JSON — return raw text so the UI can still show it
      return json({
        success: true,
        data: null,
        raw: typeof rawOutput === 'string' ? rawOutput : JSON.stringify(rawOutput),
      })

    } catch (err) {
      if (/\b5016\b/.test(String(err))) {
        console.warn('Vision model license requires account owner action')
        return json({ success: false, error: 'Vision model unavailable pending account setup' }, 503)
      }
      console.error('Vision inference failed')
      return json({ success: false, error: 'Vision inference failed' }, 500)
    }
  },
}
