import { useEffect, useRef, useState } from 'react';

export default function ImageUpload({ api, presetImages = [] }) {
  const inputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

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
      let found;
      try {
        found = await api.searchByImage(file);
      } catch (firstErr) {
        setError('Waking up server, retrying…');
        await new Promise((r) => setTimeout(r, 3000));
        found = await api.searchByImage(file);
        setError(null);
      }
      console.log("test", found);
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

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) runSearch(file);
  }

  function openPicker() { inputRef.current?.click(); }
  function closeModal() { setIsOpen(false); }

  function reset() {
    setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setResults(null);
    setError(null);
    setSearching(false);
  }

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) api.warmup?.();
  }, [isOpen, api]);

  useEffect(() => { if (!isOpen) reset(); }, [isOpen]);
  useEffect(() => { return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }; }, [previewUrl]);

  const hasStarted = previewUrl !== null || searching;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        .isw-trigger {
          background: none; border: none; cursor: pointer; padding: 6px;
          color: inherit; display: flex; align-items: center; justify-content: center;
        }
        .isw-modal-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          z-index: 9999; display: flex; align-items: center; justify-content: center;
          padding: 16px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .isw-modal-narrow {
          background: #fff; border-radius: 16px; width: 100%; max-width: 400px;
          overflow: hidden; border: 1px solid #e1e3e5;
          box-shadow: 0 8px 40px rgba(0,0,0,0.16); animation: isw-pop 0.2s ease; position: relative;
        }
        .isw-modal-split {
          background: #fff; border-radius: 16px; width: 100%; max-width: 860px;
          overflow: hidden; border: 1px solid #e1e3e5;
          box-shadow: 0 8px 40px rgba(0,0,0,0.16); animation: isw-pop 0.2s ease; position: relative;
        }
        @keyframes isw-pop {
          from { transform: scale(0.95); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
        .isw-header {
          background: #008060; padding: 13px 16px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .isw-header-left { display: flex; align-items: center; gap: 10px; }
        .isw-header-icon {
          width: 34px; height: 34px; background: rgba(255,255,255,0.15);
          border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff;
        }
        .isw-header-title { color: #fff; font-size: 14px; font-weight: 600; line-height: 1.2; }
        .isw-header-sub { color: rgba(255,255,255,0.75); font-size: 11px; margin-top: 1px; }
        .isw-modal-close {
          width: 30px; height: 30px; background: rgba(255,255,255,0.15); border-radius: 8px;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          color: #fff; font-size: 20px; border: none; line-height: 1; flex-shrink: 0; font-family: inherit;
        }
        .isw-modal-close:hover { background: rgba(255,255,255,0.25); }
        .isw-body { padding: 18px; }
        .isw-dropzone {
          border: 2px dashed #b5d5c8; border-radius: 12px; padding: 32px 16px;
          text-align: center; background: #f3faf7; cursor: pointer; transition: all 0.2s;
        }
        .isw-dropzone:hover, .isw-dropzone.drag-over { border-color: #008060; background: #e8f5f0; }
        .isw-dropzone-icon-wrap {
          width: 54px; height: 54px; background: #d4edde; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; color: #008060;
        }
        .isw-dropzone-title { color: #202223; font-size: 14px; font-weight: 600; margin-bottom: 4px; }
        .isw-dropzone-sub { color: #6d7175; font-size: 12px; margin-bottom: 14px; }
        .isw-upload-btn {
          background: #008060; color: #fff; border: none; border-radius: 8px;
          padding: 10px 24px; font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: background 0.15s;
        }
        .isw-upload-btn:hover { background: #006e52; }
        .isw-divider { display: flex; align-items: center; gap: 8px; margin: 14px 0; }
        .isw-div-line { flex: 1; height: 1px; background: #e1e3e5; }
        .isw-div-text { font-size: 11px; color: #8c9196; font-weight: 500; white-space: nowrap; }
        .isw-presets-label { font-size: 12px; color: #6d7175; font-weight: 500; margin-bottom: 10px; }
        .isw-presets-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
        .isw-preset-thumb {
          aspect-ratio: 1; border-radius: 8px; border: 1.5px solid #e1e3e5;
          overflow: hidden; cursor: pointer; padding: 0; background: #f6f6f7; transition: all 0.15s;
        }
        .isw-preset-thumb:hover { border-color: #008060; transform: scale(1.05); }
        .isw-preset-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .isw-tip {
          background: #f6f6f7; border-radius: 8px; padding: 10px 12px;
          display: flex; align-items: flex-start; gap: 8px; margin-top: 14px;
        }
        .isw-tip-text { font-size: 11px; color: #6d7175; line-height: 1.5; }

        /* ── Split layout ── */
        .isw-modal-body { display: grid; grid-template-columns: 200px 1fr; min-height: 460px; }
        .isw-panel-left {
          padding: 14px; border-right: 1px solid #e1e3e5; background: #fafafa; min-width: 0;
        }
        .isw-panel-right { padding: 14px; overflow-y: auto; max-height: 500px; min-width: 0; }
        .isw-panel-title {
          font-size: 10px; font-weight: 600; color: #6d7175;
          text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 10px;
        }
        .isw-preview {
          width: 100%; aspect-ratio: 1; border-radius: 10px; overflow: hidden;
          border: 1px solid #e1e3e5; background: #f0f0f0; margin-bottom: 10px;
        }
        .isw-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .isw-thumb-strip { display: flex; gap: 5px; margin-bottom: 10px; }
        .isw-thumb {
          width: 36px; height: 36px; border-radius: 6px; overflow: hidden;
          border: 1px solid #e1e3e5; cursor: pointer; padding: 0;
          background: #f6f6f7; flex-shrink: 0; transition: all 0.15s;
        }
        .isw-thumb:hover { border-color: #008060; transform: scale(1.06); }
        .isw-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .isw-drop-cta {
          width: 100%; background: #f3faf7; border: 1.5px dashed #b5d5c8;
          border-radius: 8px; padding: 9px; font-size: 11px; font-weight: 500;
          color: #008060; cursor: pointer; font-family: inherit; transition: all 0.15s; text-align: center;
        }
        .isw-drop-cta:hover { background: #e8f5f0; border-color: #008060; }

        /* ── Results header ── */
        .isw-results-header {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;
        }
        .isw-results-count {
          font-size: 10px; font-weight: 600; color: #6d7175;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .isw-sort-select {
          font-size: 11px; color: #6d7175; background: #fff;
          border: 1px solid #e1e3e5; border-radius: 6px; padding: 3px 8px;
          cursor: pointer; font-family: inherit; outline: none;
        }
        .isw-sort-select:focus { border-color: #008060; }

        /* ── 3-col compact results grid ── */
        .isw-results-grid {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 8px;
        }
        .isw-result-card {
          border: 1px solid #e1e3e5; border-radius: 9px; overflow: hidden;
          transition: border-color 0.15s, box-shadow 0.15s; background: #fff; cursor: pointer;
        }
        .isw-result-card:hover {
          border-color: #008060; box-shadow: 0 2px 10px rgba(0,128,96,0.12);
        }
        .isw-result-img {
          display: block; width: 100%; aspect-ratio: 1; overflow: hidden; background: #f6f6f7;
        }
        .isw-result-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .isw-result-body { padding: 7px 8px; }
        .isw-result-badge {
          display: inline-block; background: #e8f5f0; color: #006e52;
          font-size: 9px; font-weight: 600; padding: 2px 6px;
          border-radius: 999px; margin-bottom: 4px;
        }
        .isw-result-title {
          font-size: 11px; font-weight: 500; color: #202223; margin-bottom: 3px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .isw-result-price { font-size: 11px; color: #008060; font-weight: 600; margin-bottom: 6px; }
        .isw-select-btn {
          display: block; text-align: center; background: #008060; color: #fff;
          border-radius: 6px; padding: 5px 8px; font-size: 11px; font-weight: 600;
          text-decoration: none; transition: background 0.15s; border: none;
          cursor: pointer; width: 100%; font-family: inherit;
        }
        .isw-select-btn:hover { background: #006e52; }

        /* ── Status ── */
        .isw-status { font-size: 13px; color: #6d7175; text-align: center; padding: 24px 0; }
        .isw-spinner {
          width: 28px; height: 28px; border: 3px solid #e1e3e5;
          border-top-color: #008060; border-radius: 50%;
          animation: isw-spin 0.7s linear infinite; margin: 0 auto 10px;
        }
        @keyframes isw-spin { to { transform: rotate(360deg); } }
        .isw-error {
          background: #fde2e1; color: #b3261e; border-radius: 8px;
          padding: 10px 14px; font-size: 12px; margin-bottom: 12px;
        }
      `}</style>

      {/* ── Trigger ── */}
      <button onClick={() => setIsOpen(true)} className="isw-trigger" aria-label="Search by image">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4l-1.5-2h-6L5.5 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <circle cx="10" cy="13" r="3.5" />
          <path d="M19 2v6M16 5h6" />
        </svg>
      </button>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} style={{ display: 'none' }} />

      {isOpen && (
        <div className="isw-modal-backdrop" onClick={closeModal}>
          <div
            className={hasStarted ? 'isw-modal-split' : 'isw-modal-narrow'}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* ── Header ── */}
            <div className="isw-header">
              <div className="isw-header-left">
                <div className="isw-header-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                    <path d="M11 8v6M8 11h6"/>
                  </svg>
                </div>
                <div>
                  <div className="isw-header-title">Visual Search</div>
                  <div className="isw-header-sub">Find products by image</div>
                </div>
              </div>
              <button className="isw-modal-close" onClick={closeModal} aria-label="Close">×</button>
            </div>

            {/* ── Initial State ── */}
            {!hasStarted && (
              <div className="isw-body">
                <div
                  className={`isw-dropzone ${dragOver ? 'drag-over' : ''}`}
                  onClick={openPicker}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <div className="isw-dropzone-icon-wrap">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 16V4"/><path d="M7 9l5-5 5 5"/>
                      <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"/>
                    </svg>
                  </div>
                  <div className="isw-dropzone-title">Upload a product image</div>
                  <div className="isw-dropzone-sub">Drag & drop or browse — PNG, JPG, WEBP</div>
                  <button type="button" className="isw-upload-btn" onClick={(e) => { e.stopPropagation(); openPicker(); }}>
                    Choose image
                  </button>
                </div>

                {presetImages.length > 0 && (
                  <>
                    <div className="isw-divider">
                      <div className="isw-div-line"></div>
                      <span className="isw-div-text">OR TRY A POPULAR SEARCH</span>
                      <div className="isw-div-line"></div>
                    </div>
                    <p className="isw-presets-label">Trending products</p>
                    <div className="isw-presets-row">
                      {presetImages.slice(0, 6).map((src, i) => (
                        <button key={i} type="button" className="isw-preset-thumb" onClick={() => runSearchFromUrl(src)}>
                          <img src={src} alt="" />
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <div className="isw-tip">
                  <span style={{ color: '#008060', fontSize: 15, flexShrink: 0 }}>💡</span>
                  <span className="isw-tip-text">For best results, use clear product photos with a plain background.</span>
                </div>
              </div>
            )}

            {/* ── Split State ── */}
            {hasStarted && (
              <div className="isw-modal-body">
                {/* Left Panel */}
                <section className="isw-panel-left">
                  <p className="isw-panel-title">Your image</p>
                  <div className="isw-preview">
                    {previewUrl && <img src={previewUrl} alt="Uploaded" />}
                  </div>
                  {presetImages.length > 0 && (
                    <div className="isw-thumb-strip">
                      {presetImages.slice(0, 5).map((src, i) => (
                        <button key={i} type="button" className="isw-thumb" onClick={() => runSearchFromUrl(src)}>
                          <img src={src} alt="" />
                        </button>
                      ))}
                    </div>
                  )}
                  <button type="button" className="isw-drop-cta" onClick={openPicker}>
                    ↑ Upload a different image
                  </button>
                </section>

                {/* Right Panel */}
                <section className="isw-panel-right">
                  {error && <div className="isw-error">⚠ {error}</div>}

                  {searching && (
                    <div className="isw-status">
                      <div className="isw-spinner"></div>
                      Finding matching products...
                    </div>
                  )}

                  {!searching && results && results.length === 0 && (
                    <div className="isw-status">No matching products found. Try a different image.</div>
                  )}

                  {!searching && results && results.length > 0 && (
                    <>
                      <div className="isw-results-header">
                        <span className="isw-results-count">{results.length} products found</span>
                     
                      </div>

                      <div className="isw-results-grid">
                        {results.map((p, index) => (
                          <article key={p._id} className="isw-result-card">
                            <a href={p.link} target="_blank" rel="noreferrer" className="isw-result-img">
                              <img src={p.imageUrl} alt={p.title} />
                            </a>
                            <div className="isw-result-body">
                              {index === 0 && <div className="isw-result-badge">Top match</div>}
                              <h3 className="isw-result-title">{p.title}</h3>
                              <p className="isw-result-price">{p.price}</p>
                              <a href={p.link} target="_blank" rel="noreferrer" className="isw-select-btn">
                                View
                              </a>
                            </div>
                          </article>
                        ))}
                      </div>
                    </>
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
