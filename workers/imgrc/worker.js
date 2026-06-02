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

const ALLOWED_ORIGINS = [
  'https://stage.up.railway.app',
  'https://trucycle.co.uk',
  'https://www.trucycle.co.uk',
  'http://localhost:5173',
  'http://localhost:4173',
]

const MODEL = '@cf/meta/llama-3.2-11b-vision-instruct'

// 1.5 MB hard limit — Workers can't resize images and spreading a 3MB
// Uint8Array into a number[] easily exceeds the thread memory ceiling
const MAX_BYTES = 1.5 * 1024 * 1024

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
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
    const origin = request.headers.get('Origin') ?? ''

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, origin)
    }

    if (!env.AI) {
      console.error('AI binding missing — add [ai] binding = "AI" to wrangler.toml')
      return json({ error: 'AI binding not configured' }, 500, origin)
    }

    // ── Parse multipart form ────────────────────────────────────────────────
    let imageArray
    let userPrompt = 'Analyze this item for TruCycle.'

    try {
      const formData = await request.formData()
      const imageFile = formData.get('image')
      const customPrompt = formData.get('prompt')

      if (!imageFile || typeof imageFile === 'string') {
        return json({ error: "Missing 'image' file in form data" }, 400, origin)
      }

      const arrayBuffer = await imageFile.arrayBuffer()

      // Reject oversized images before allocation — spreading a 3MB file into
      // a number[] can exhaust the Worker's memory and crash the thread
      if (arrayBuffer.byteLength > MAX_BYTES) {
        return json({
          error: `Image too large (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)} MB). Max 1.5 MB.`,
          hint: 'Resize or compress the image before uploading.',
        }, 413, origin)
      }

      // Array.from is equivalent to spread but slightly more explicit;
      // the Workers AI SDK requires number[] not TypedArray for image inputs
      imageArray = Array.from(new Uint8Array(arrayBuffer))

      if (customPrompt && typeof customPrompt === 'string' && customPrompt.trim()) {
        userPrompt = customPrompt.trim()
      }
    } catch (err) {
      console.error('Failed to parse request:', err)
      return json({ error: 'Failed to parse request body', detail: String(err) }, 400, origin)
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

      let response
      try {
        response = await env.AI.run(MODEL, inferenceInput)
      } catch (firstErr) {
        // Error 5016 — model requires a one-time license agreement.
        // Send the literal prompt 'agree' then retry the real request.
        if (String(firstErr).includes('5016')) {
          console.log('Accepting Llama 3.2 Vision license agreement (error 5016)…')
          await env.AI.run(MODEL, { prompt: 'agree' })
          response = await env.AI.run(MODEL, inferenceInput)
        } else {
          throw firstErr
        }
      }

      // Docs confirm output schema: { response: string }
      const rawText =
        response?.response ??
        response?.choices?.[0]?.message?.content ??
        (typeof response === 'string' ? response : '')

      if (!rawText) {
        throw new Error('Model returned an empty response')
      }

      const parsed = extractJson(rawText)

      if (parsed) {
        return json({ success: true, data: parsed }, 200, origin)
      }

      // Could not extract JSON — return raw text so the UI can still show it
      return json({ success: true, data: null, raw: rawText }, 200, origin)

    } catch (err) {
      console.error('AI inference error:', err)
      return json({ success: false, error: String(err), model: MODEL }, 500, origin)
    }
  },
}
