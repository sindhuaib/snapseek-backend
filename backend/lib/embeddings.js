import { AutoProcessor, CLIPVisionModelWithProjection, RawImage, env } from '@xenova/transformers';

env.cacheDir = process.env.TRANSFORMERS_CACHE || './.transformers-cache';
env.allowLocalModels = false;

const MODEL_NAME = process.env.CLIP_MODEL || 'Xenova/clip-vit-base-patch32';

let processor;
let visionModel;
let loadingPromise;

async function loadModel() {
  if (!loadingPromise) {
    loadingPromise = (async () => {
      console.log(`Loading CLIP model: ${MODEL_NAME}...`);
      processor = await AutoProcessor.from_pretrained(MODEL_NAME);
      visionModel = await CLIPVisionModelWithProjection.from_pretrained(MODEL_NAME);
      console.log('CLIP model loaded.');
    })();
  }
  await loadingPromise;
}

function l2Normalize(vec) {
  let sum = 0;
  for (const v of vec) sum += v * v;
  const norm = Math.sqrt(sum) || 1;
  return Array.from(vec).map((v) => v / norm);
}

export async function warmup() {
  await loadModel();
}

export async function embedImageFromBuffer(buffer) {
  await loadModel();
  const blob = new Blob([buffer]);
  const image = await RawImage.fromBlob(blob);
  const imageInputs = await processor(image);
  const { image_embeds } = await visionModel(imageInputs);
  return l2Normalize(image_embeds.data);
}

export async function embedImageFromUrl(url) {
  await loadModel();
  const image = await RawImage.fromURL(url);
  const imageInputs = await processor(image);
  const { image_embeds } = await visionModel(imageInputs);
  return l2Normalize(image_embeds.data);
}
