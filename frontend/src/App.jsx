import { useEffect, useMemo, useState } from 'react';
import ImageUpload from './components/ImageUpload.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import { createApi } from './api.js';

export default function App({ apiBase }) {
  const api = useMemo(() => createApi(apiBase), [apiBase]);
  const [products, setProducts] = useState([]);
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .fetchProducts()
      .then(setProducts)
      .catch((e) => setError(e.message));
  }, [api]);

  async function handleUpload(file) {
    setSearching(true);
    setError(null);
    try {
      const found = await api.searchByImage(file);
      setResults(found);
    } catch (e) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  }

  function clearResults() {
    setResults(null);
  }

  return (
    <div className="isw-app">
      <header className="isw-header">
        <h1>Visual Search</h1>
        <ImageUpload onUpload={handleUpload} disabled={searching} />
      </header>

      {error && <p className="isw-error">{error}</p>}

      {results !== null ? (
        <section>
          <div className="isw-results-header">
            <h2>Search Results</h2>
            <button onClick={clearResults} className="isw-link-button">
              Back to all products
            </button>
          </div>
          {results.length === 0 ? (
            <p className="isw-no-results">No results found</p>
          ) : (
            <ProductGrid products={results} showScore />
          )}
        </section>
      ) : (
        <section>
          <h2>All Products</h2>
          {searching && <p>Searching...</p>}
          <ProductGrid products={products} />
        </section>
      )}
    </div>
  );
}
