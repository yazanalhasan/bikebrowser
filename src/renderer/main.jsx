import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { shouldRenderBootstrapError } from './bootstrapErrorPolicy';
import './index.css';

const ERROR_OVERLAY_ID = 'bikebrowser-bootstrap-error-overlay';
let appStarted = false;

function renderBootstrapError(error, source = 'bootstrap') {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.error(`[renderer:${source}]`, error);

  if (!shouldRenderBootstrapError({ appStarted, source, error })) {
    return;
  }

  if (!document?.body) {
    return;
  }

  let overlay = document.getElementById(ERROR_OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = ERROR_OVERLAY_ID;
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '2147483647';
    overlay.style.background = '#f8fafc';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '24px';
    overlay.style.fontFamily = 'Segoe UI,Tahoma,sans-serif';

    const card = document.createElement('div');
    card.style.maxWidth = '780px';
    card.style.width = '100%';
    card.style.background = '#fff';
    card.style.border = '1px solid #e2e8f0';
    card.style.borderRadius = '16px';
    card.style.padding = '24px';
    card.style.boxShadow = '0 10px 30px rgba(15,23,42,.08)';

    const title = document.createElement('h1');
    title.textContent = 'Renderer failed to start';
    title.style.margin = '0 0 12px';
    title.style.fontSize = '24px';
    title.style.color = '#0f172a';

    const subtitle = document.createElement('p');
    subtitle.textContent = 'BikeBrowser hit an initialization error and could not render the UI.';
    subtitle.style.margin = '0 0 16px';
    subtitle.style.color = '#334155';

    const details = document.createElement('pre');
    details.setAttribute('data-role', 'error-details');
    details.style.margin = '0';
    details.style.padding = '12px';
    details.style.background = '#f1f5f9';
    details.style.borderRadius = '10px';
    details.style.whiteSpace = 'pre-wrap';
    details.style.color = '#0f172a';

    const hint = document.createElement('p');
    hint.textContent = 'Open DevTools Console for full stack trace.';
    hint.style.margin = '16px 0 0';
    hint.style.color = '#475569';

    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(details);
    card.appendChild(hint);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  const detailsNode = overlay.querySelector('[data-role="error-details"]');
  if (detailsNode) {
    detailsNode.textContent = message;
  }
}

const rootElement = document.getElementById('root');

window.addEventListener('error', (event) => {
  renderBootstrapError(event.error || event.message, 'window.error');
});

window.addEventListener('unhandledrejection', (event) => {
  renderBootstrapError(event.reason, 'unhandledrejection');
});

if ('caches' in window) {
  caches.keys().then((names) => {
    names.forEach((name) => caches.delete(name));
  });
}

if (window.location.hostname.includes('bike-browser.com')) {
  console.log('Running in LIVE DEV MODE');
}

try {
  if (!rootElement) {
    throw new Error('Root element #root was not found in index.html');
  }

  const isDevMode = import.meta?.env?.MODE === 'development';
  const appTree = isDevMode ? <App /> : (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  ReactDOM.createRoot(rootElement).render(
    appTree
  );
  appStarted = true;

  if ('serviceWorker' in navigator) {
    const isDev =
      window.location.hostname === 'localhost' ||
      window.location.hostname.includes('trycloudflare') ||
      window.location.hostname.includes('bike-browser.com');

    if (!isDev) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.warn('Service worker registration failed:', error);
      });
    } else {
      console.log('Service worker disabled in dev mode');

      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
    }
  }
} catch (error) {
  renderBootstrapError(error, 'createRoot');
}
