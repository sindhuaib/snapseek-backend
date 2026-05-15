export function createApi(apiBase) {
  const base = apiBase || '/api';

  async function fetchProducts() {
    const res = await fetch(`${base}/products`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.detail ? `Failed to fetch products: ${err.detail}` : `Failed to fetch products (HTTP ${res.status})`;
      throw new Error(msg);
    }
    const data = await res.json();
    return data.products;
  }

  async function searchByImage(file) {
    const form = new FormData();
    form.append('image', file);
    const res = await fetch(`${base}/search`, { method: 'POST', body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.detail ? `${err.error || 'Search failed'}: ${err.detail}` : (err.error || `Search failed (HTTP ${res.status})`);
      throw new Error(msg);
    }
    const data = await res.json();
    return data.results;
  }

  async function warmup() {
    try {
      await fetch(`${base}/health`, { method: 'GET' });
    } catch {
    }
  }

  return { fetchProducts, searchByImage, warmup };
}
