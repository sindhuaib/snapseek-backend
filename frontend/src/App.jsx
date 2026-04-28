import { useEffect, useMemo, useState } from 'react';
import ImageUpload from './components/ImageUpload.jsx';

import { createApi } from './api.js';

export default function App({ apiBase }) {
  const api = useMemo(() => createApi(apiBase), [apiBase]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .fetchProducts()
      .then(setProducts)
      .catch((e) => setError(e.message));
  }, [api]);

  return (
    <div className="isw-app">
      <header className="isw-header">
        <h1>Visual Search</h1>
        <ImageUpload
          api={api}
          presetImages={products.slice(0, 6).map((p) => p.imageUrl)}
        />
      </header>

      {error && <p className="isw-error">{error}</p>}

     
    </div>
  );
}
