const CDN_URL = 'https://esm.sh/@xenova/transformers@2.17.2';
const MODEL_NAME = 'Xenova/clip-vit-base-patch32';

let modelPromise = null;
let statusCb = null;

function setStatus(msg) {
  if (statusCb) statusCb(msg);
}

export function onStatus(cb) {
  statusCb = cb;
}

function l2Normalize(vec) {
  let sum = 0;
  for (const v of vec) sum += v * v;
  const norm = Math.sqrt(sum) || 1;
  return Array.from(vec).map((v) => v / norm);
}

async function dynamicImport(url) {
  return import(/* @vite-ignore */ url);
}

function loadModel() {
  if (modelPromise) return modelPromise;
  modelPromise = (async () => {
    setStatus('Loading visual search engine (one-time, ~150MB)…');
    const transformers = await dynamicImport(CDN_URL);
    const { AutoProcessor, CLIPVisionModelWithProjection, RawImage, env } = transformers;

    env.allowLocalModels = false;
    env.useBrowserCache = true;

    const processor = await AutoProcessor.from_pretrained(MODEL_NAME);
    const model = await CLIPVisionModelWithProjection.from_pretrained(MODEL_NAME, {
      quantized: true,
      progress_callback: (p) => {
        if (p?.status === 'progress' && p.progress != null) {
          setStatus(`Loading model… ${Math.round(p.progress)}%`);
        }
      },
    });
    setStatus(null);
    return { processor, model, RawImage };
  })().catch((err) => {
    modelPromise = null;
    throw err;
  });
  return modelPromise;
}

export function preloadModel() {
  loadModel().catch(() => {});
}

export function isModelReady() {
  return Boolean(modelPromise);
}

export async function embedImage(file) {
  const { processor, model, RawImage } = await loadModel();
  const image = await RawImage.fromBlob(file);
  const inputs = await processor(image);
  const { image_embeds } = await model(inputs);
  return l2Normalize(image_embeds.data);
}
