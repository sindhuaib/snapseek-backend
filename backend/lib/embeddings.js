const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

const VISION_MODEL = process.env.CF_VISION_MODEL || '@cf/llava-hf/llava-1.5-7b-hf';
const TEXT_EMBED_MODEL = process.env.CF_EMBED_MODEL || '@cf/baai/bge-base-en-v1.5';

const DESCRIBE_PROMPT =
  'Describe ONLY the visual appearance of the main product in this image. List in this order: (1) exact colors visible (e.g. neon pink, pastel yellow, charcoal black, sky blue), (2) patterns or graphics (e.g. geometric, isometric, floral, abstract, gradient, striped, polka dot, camo, plain solid), (3) artistic style (e.g. photo-realistic, cartoon, minimalist, retro, futuristic), (4) shape and surface finish (e.g. matte, glossy, rounded, angular). Do NOT mention what type of object it is. Do NOT mention the background, lighting, or setting. Do NOT use generic words like "stylish", "modern", or "design". Use 4-6 short comma-separated phrases.';

function ensureConfigured() {
  if (!CF_TOKEN || !CF_ACCOUNT_ID) {
    throw new Error(
      'CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID env vars must be set'
    );
  }
}

async function cfRun(model, body) {
  ensureConfigured();
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${model}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Cloudflare ${model} failed (${res.status}): ${text.slice(0, 300)}`
    );
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(
      `Cloudflare ${model} returned error: ${JSON.stringify(data.errors).slice(0, 300)}`
    );
  }
  return data.result;
}

async function describeImage(buffer) {
  const bytes = Array.from(new Uint8Array(buffer));
  const result = await cfRun(VISION_MODEL, {
    image: bytes,
    prompt: DESCRIBE_PROMPT,
    max_tokens: 256,
  });
  const description = (result.description || result.response || '').trim();
  if (!description) {
    throw new Error('Vision model returned empty description');
  }
  return description;
}

async function embedText(text) {
  const result = await cfRun(TEXT_EMBED_MODEL, { text: [text] });
  if (!Array.isArray(result.data) || !Array.isArray(result.data[0])) {
    throw new Error(`Unexpected embedding response: ${JSON.stringify(result).slice(0, 200)}`);
  }
  return result.data[0];
}

function l2Normalize(vec) {
  let sum = 0;
  for (const v of vec) sum += v * v;
  const norm = Math.sqrt(sum) || 1;
  return vec.map((v) => v / norm);
}

export async function warmup() {
  if (!CF_TOKEN || !CF_ACCOUNT_ID) {
    console.warn(
      'CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID not set — embedding calls will fail'
    );
  }
}

export async function embedImageFromBuffer(buffer) {
  const description = await describeImage(buffer);
  console.log(`  Description: ${description.slice(0, 120)}${description.length > 120 ? '...' : ''}`);
  const embedding = await embedText(description);
  return l2Normalize(embedding);
}

export async function embedImageFromUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url} (${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return embedImageFromBuffer(buffer);
}
