import { useRef } from 'react';

export default function ImageUpload({ onUpload, disabled }) {
  const inputRef = useRef(null);

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  }

  return (
    <div className="isw-upload">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="isw-primary"
      >
        {disabled ? 'Searching...' : 'Search by Image'}
      </button>
    </div>
  );
}
