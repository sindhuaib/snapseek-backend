import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './App.css';

function mount(target, options = {}) {
  const el =
    typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) {
    console.error(`ImageSearchWidget: target ${target} not found`);
    return;
  }
  const apiBase =
    options.apiBase ||
    el.getAttribute('data-api-base') ||
    '/api';

  el.classList.add('image-search-widget');

  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <App apiBase={apiBase.replace(/\/$/, '')} />
    </React.StrictMode>
  );
}

if (typeof window !== 'undefined') {
  window.ImageSearchWidget = { mount };

  document.addEventListener('DOMContentLoaded', () => {
    document
      .querySelectorAll('[data-image-search-widget]')
      .forEach((el) => mount(el));
  });

  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    document
      .querySelectorAll('[data-image-search-widget]')
      .forEach((el) => mount(el));
  }
}
