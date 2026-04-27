const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const HF_MODEL = process.env.HF_EMBEDDING_MODEL || 'facebook/dinov2-base';
const HF_URL = `https://api-inference.huggingface.co/pipeline/image-feature-extraction/${HF_MODEL}`;

const MAX_RETRIES = 4;
const COLD_START_BACKOFF_MS = 5000;

async function postImageBytes(buffer) {
  if (!HF_TOKEN) {
    throw new Error('HUGGINGFACE_API_TOKEN env var is not set');
  }
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(HF_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/octet-stream',
      },
      body: buffer,
    });

    if (res.ok) {
      return res.json();
    }

    const text = await res.text();
    if (res.status === 503 && attempt < MAX_RETRIES) {
      let wait = COLD_START_BACKOFF_MS;
      try {
        const parsed = JSON.parse(text);
        if (parsed.estimated_time) wait = Math.ceil(parsed.estimated_time * 1000);
      } catch {}
      console.log(`HF model warming up, retry ${attempt}/${MAX_RETRIES} in ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    throw new Error(`HF inference failed (${res.status}): ${text.slice(0, 300)}`);
  }
  throw new Error('HF inference: max retries exceeded');
}

function poolFeatures(features) {
  if (!Array.isArray(features)) {
    throw new Error('Unexpected HF response shape');
  }

  let arr = features;
  while (Array.isArray(arr[0]) && Array.isArray(arr[0][0])) {
    arr = arr[0];
  }

  if (Array.isArray(arr[0])) {
    const dim = arr[0].length;
    const sum = new Array(dim).fill(0);
    for (const row of arr) {
      for (let i = 0; i < dim; i++) sum[i] += row[i];
    }
    return sum.map((v) => v / arr.length);
  }

  return arr;
}

function l2Normalize(vec) {
  let sum = 0;
  for (const v of vec) sum += v * v;
  const norm = Math.sqrt(sum) || 1;
  return vec.map((v) => v / norm);
}

export async function warmup() {
  if (!HF_TOKEN) {
    console.warn('HUGGINGFACE_API_TOKEN not set — embedding calls will fail');
  }
}

export async function embedImageFromBuffer(buffer) {
  const features = await postImageBytes(buffer);
  return l2Normalize(poolFeatures(features));
}

export async function embedImageFromUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url} (${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return embedImageFromBuffer(buffer);
}
