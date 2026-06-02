/**
 * TruCycle Vision Worker
 * Cloudflare Worker — deploy via `wrangler deploy`
 *
 * Required binding in wrangler.toml:
 *   [ai]
 *   binding = "AI"
 *
 * Model note:
 *   @cf/google/gemma-4-26b-a4b-it is TEXT-ONLY — it cannot accept image inputs.
 *   @cf/unum/uform-gen2-qwen-500m and @cf/llava-hf/llava-1.5-7b-hf are the
 *   vision-capable models available on Workers AI.
 *   We use llava-1.5-7b-hf as the primary; uform-gen2 as a smaller fallback.
 */

const ALLOWED_ORIGINS = [
  'https://stage.up.railway.app',
  'https://trucycle.co.uk',
  'https://www.trucycle.co.uk',
  'http://localhost:5173',
  'http://localhost:4173',
]

// Vision-capable model available on Cloudflare Workers AI
const MODEL = '@cf/llava-hf/llava-1.5-7b-hf'

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

    let imageArray
    let userPrompt = 'Analyze this item for Trucycle.'

    try {
      const formData = await request.formData()
      const imageFile = formData.get('image')
      const customPrompt = formData.get('prompt')

      if (!imageFile || typeof imageFile === 'string') {
        return json({ error: "Missing 'image' file in form data" }, 400, origin)
      }

      if (customPrompt && typeof customPrompt === 'string' && customPrompt.trim()) {
        userPrompt = customPrompt.trim()
      }

      const arrayBuffer = await imageFile.arrayBuffer()
      imageArray = [...new Uint8Array(arrayBuffer)]
    } catch (err) {
      console.error('Failed to parse request:', err)
      return json({ error: 'Failed to parse request body', detail: String(err) }, 400, origin)
    }

    try {
      const systemInstruction =
        'You are an item analysis AI for Trucycle UK. ' +
        'Respond ONLY with a raw JSON object — no markdown, no code fences, no extra text. ' +
        'Required keys: ' +
        '"item_type" (string, e.g. "sofa"), ' +
        '"condition" ("Excellent" | "Good" | "Fair" | "Poor"), ' +
        '"reusable" (boolean), ' +
        '"suggested_category" (one of: "Furniture","Kitchenware","Books + media","Kids + baby","Garden + tools","Tech shelf","Clothing","Other"), ' +
        '"notes" (string, one short sentence).'

      const fullPrompt = `${systemInstruction}\n\nUser request: ${userPrompt}`

      // LLaVA-1.5 accepts { prompt, image } — flat shape, not messages array
      const response = await env.AI.run(MODEL, {
        prompt: fullPrompt,
        image: imageArray,
        max_tokens: 400,
      })

      // LLaVA returns { description: "..." } or a plain string
      let rawText =
        typeof response === 'string'
          ? response
          : (response?.description ?? response?.result ?? response?.choices?.[0]?.message?.content ?? '')

      if (!rawText) {
        throw new Error('AI returned an empty response')
      }

      // Strip markdown fences if the model wraps its output anyway
      let clean = rawText.trim()
      if (clean.startsWith('```')) {
        clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
      }

      // Extract the first JSON object from the response even if there's surrounding text
      const jsonMatch = clean.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        // Return raw text if no JSON found — still useful for debugging
        return json({ success: true, raw: rawText, data: null }, 200, origin)
      }

      const parsed = JSON.parse(jsonMatch[0])
      return json({ success: true, data: parsed }, 200, origin)
    } catch (err) {
      console.error('AI inference error:', err)
      return json({ success: false, error: String(err), model: MODEL }, 500, origin)
    }
  },
}
