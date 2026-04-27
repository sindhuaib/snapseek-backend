export function createApi(apiBase) {
  const base = apiBase || '/api';

  async function fetchProducts() {
    const res = await fetch(`${base}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    return data.products;
  }

  async function searchByImage(file) {
    const form = new FormData();
    form.append('image', file);
    const res = await fetch(`${base}/search`, { method: 'POST', body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Search failed');
    }
    const data = await res.json();
    return data.results;
  }

  return { fetchProducts, searchByImage };
}
