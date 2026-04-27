import {
  AutoProcessor,
  CLIPVisionModelWithProjection,
  RawImage,
} from '@xenova/transformers';

const MODEL_ID = 'Xenova/clip-vit-base-patch32';

let processorPromise;
let modelPromise;

function getProcessor() {
  if (!processorPromise) processorPromise = AutoProcessor.from_pretrained(MODEL_ID);
  return processorPromise;
}

function getModel() {
  if (!modelPromise) modelPromise = CLIPVisionModelWithProjection.from_pretrained(MODEL_ID);
  return modelPromise;
}

export async function warmup() {
  await Promise.all([getProcessor(), getModel()]);
}

export async function embedImageFromBuffer(buffer) {
  const blob = new Blob([buffer]);
  const image = await RawImage.fromBlob(blob);
  return embedImage(image);
}

export async function embedImageFromUrl(url) {
  const image = await RawImage.read(url);
  return embedImage(image);
}

async function embedImage(image) {
  const [processor, model] = await Promise.all([getProcessor(), getModel()]);
  const inputs = await processor(image);
  const { image_embeds } = await model(inputs);
  return l2Normalize(Array.from(image_embeds.data));
}

function l2Normalize(vec) {
  let sum = 0;
  for (const v of vec) sum += v * v;
  const norm = Math.sqrt(sum) || 1;
  return vec.map((v) => v / norm);
}
