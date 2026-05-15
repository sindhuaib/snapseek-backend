const HF_API_URL =
  process.env.HF_API_URL ||
  'https://router.huggingface.co/hf-inference/models/openai/clip-vit-base-patch32/pipeline/image-feature-extraction';

const MAX_ATTEMPTS = 4;

function l2Normalize(vec) {
  let sum = 0;
  for (const v of vec) sum += v * v;
  const norm = Math.sqrt(sum) || 1;
  return vec.map((v) => v / norm);
}

function parseEmbedding(data) {
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'number') {
    return data;
  }
  if (Array.isArray(data) && Array.isArray(data[0]) && typeof data[0][0] === 'number') {
    return data[0];
  }
  if (Array.isArray(data) && data[0] && typeof data[0].label === 'string') {
    throw new Error(
      'HF API returned zero-shot classifications instead of embeddings. The default pipeline for this model does not expose raw image embeddings — switch to an HF Space (Option D) or a model with image-feature-extraction pipeline.'
    );
  }
  throw new Error(`Unexpected HF embedding response shape: ${JSON.stringify(data).slice(0, 200)}`);
}

async function callHF(buffer) {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) throw new Error('HUGGINGFACE_API_TOKEN env var is not set');

  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'x-wait-for-model': 'true',
      },
      body: buffer,
    });

    if (res.status === 503) {
      let waitMs = 10000;
      try {
        const body = await res.json();
        if (body?.estimated_time) waitMs = Math.min(60000, body.estimated_time * 1000);
      } catch {}
      console.log(`HF model loading (attempt ${attempt}/${MAX_ATTEMPTS}), waiting ${waitMs}ms`);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      lastErr = new Error(`HF API ${res.status}: ${text.slice(0, 300)}`);
      if (res.status >= 500) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      throw lastErr;
    }

    const data = await res.json();
    return parseEmbedding(data);
  }

  throw lastErr || new Error('HF API did not return a valid response after retries');
}

export async function warmup() {
  if (!process.env.HUGGINGFACE_API_TOKEN) {
    console.warn('HUGGINGFACE_API_TOKEN not set — search will fail until configured.');
  }
}

export async function embedImageFromBuffer(buffer) {
  const raw = await callHF(buffer);
  return l2Normalize(raw);
}

export async function embedImageFromUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: HTTP ${res.status}`);
  const arrayBuf = await res.arrayBuffer();
  return embedImageFromBuffer(Buffer.from(arrayBuf));
}
