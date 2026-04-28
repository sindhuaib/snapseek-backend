import { useEffect, useRef, useState } from 'react';

export default function ImageUpload({ api, presetImages = [] }) {
  const inputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  async function runSearch(file) {
    if (!file) return;
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setError(null);
    setResults(null);
    setSearching(true);
    try {
      const found = await api.searchByImage(file);
      setResults(found);
    } catch (e) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  }

  async function runSearchFromUrl(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Could not load preset image');
      const blob = await res.blob();
      const file = new File([blob], 'preset.jpg', { type: blob.type });
      runSearch(file);
    } catch (e) {
      setError(e.message);
    }
  }

  function handleChange(e) {
    const file = e.target.files?.[0];
    runSearch(file);
    e.target.value = '';
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function closeModal() {
    setIsOpen(false);
  }

  function reset() {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setResults(null);
    setError(null);
    setSearching(false);
  }

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const hasStarted = previewUrl !== null || searching;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="isw-primary"
      >
        Search by Image
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      {isOpen && (
        <div className="isw-modal-backdrop" onClick={closeModal}>
          <div
            className={`isw-modal ${hasStarted ? 'isw-modal-split' : 'isw-modal-narrow'}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              className="isw-modal-close"
              onClick={closeModal}
              aria-label="Close"
            >
              ×
            </button>

            {!hasStarted ? (
              <div className="isw-init">
                <h2 className="isw-panel-title isw-panel-title-center">Image Search</h2>

                <div className="isw-dropzone">
                  <svg
                    className="isw-dropzone-icon"
                    width="42"
                    height="42"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 16V4" />
                    <path d="M7 9l5-5 5 5" />
                    <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
                  </svg>
                  <p className="isw-dropzone-text">
                    Drag and drop your image here, click "Upload Image,"<br />
                    or paste the image here
                  </p>
                  <button
                    type="button"
                    className="isw-upload-btn"
                    onClick={openPicker}
                  >
                    Upload Image
                  </button>
                </div>

                {presetImages.length > 0 && (
                  <div className="isw-presets-section">
                    <p className="isw-presets-label">Popular Search Product Images</p>
                    <div className="isw-presets-row">
                      {presetImages.slice(0, 6).map((src, i) => (
                        <button
                          key={i}
                          type="button"
                          className="isw-preset-thumb"
                          onClick={() => runSearchFromUrl(src)}
                        >
                          <img src={src} alt="" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="isw-modal-body">
                <section className="isw-panel isw-panel-left">
                  <h2 className="isw-panel-title">Image Search</h2>
                  <div className="isw-upload-card">
                    <div className="isw-preview">
                      {previewUrl && <img src={previewUrl} alt="Uploaded" />}
                    </div>

                    {presetImages.length > 0 && (
                      <div className="isw-thumb-strip">
                        {presetImages.slice(0, 5).map((src, i) => (
                          <button
                            key={i}
                            type="button"
                            className="isw-thumb"
                            onClick={() => runSearchFromUrl(src)}
                          >
                            <img src={src} alt="" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                <section className="isw-panel isw-panel-right">
                  <h2 className="isw-panel-title">Search result</h2>

                  {error && <p className="isw-error">{error}</p>}
                  {searching && <p className="isw-status">Searching...</p>}
                  {!searching && results && results.length === 0 && (
                    <p className="isw-status">No matching products found.</p>
                  )}
                  {!searching && results && results.length > 0 && (
                    <div className="isw-results-grid">
                      {results.map((p) => (
                        <article key={p._id} className="isw-result-card">
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noreferrer"
                            className="isw-result-img"
                          >
                            <img src={p.imageUrl} alt={p.title} />
                          </a>
                          <div className="isw-result-body">
                            <h3 className="isw-result-title">{p.title}</h3>
                            <p className="isw-result-price">₹6,760</p>
                            <a
                              href={p.link}
                              target="_blank"
                              rel="noreferrer"
                              className="isw-select-btn"
                            >
                              Select Options
                            </a>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
