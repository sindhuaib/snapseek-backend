import { useEffect, useMemo, useState } from 'react';
import ImageUpload from './components/ImageUpload.jsx';

import { createApi } from './api.js';

export default function App({ apiBase }) {
  const api = useMemo(() => createApi(apiBase), [apiBase]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      api.warmup?.();
      try {
        let products;
        try {
          products = await api.fetchProducts();
        } catch (firstErr) {
          if (cancelled) return;
          setError('Waking up server…');
          await new Promise((r) => setTimeout(r, 3000));
          products = await api.fetchProducts();
          if (!cancelled) setError(null);
        }
        if (!cancelled) setProducts(products);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

return (
  <>
    <ImageUpload
      api={api}
      presetImages={products.slice(0, 6).map((p) => p.imageUrl)}
    />
    {error && <p className="isw-error">{error}</p>}
  </>
);

}
