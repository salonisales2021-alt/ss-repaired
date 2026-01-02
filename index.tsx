import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Safely cleanup Service Workers to prevent stale caches
// Wrapped in try-catch to avoid "invalid state" errors in some environments
const cleanupServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        registration.unregister().catch(err => console.warn('SW unregister failed:', err));
      }
    } catch (error) {
      // Silently fail if SW is not accessible (e.g., sandboxed iframe)
      console.warn('ServiceWorker access restricted, skipping cleanup.');
    }
  }
};

cleanupServiceWorkers();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  // Failsafe: If React crashes immediately, show it on screen
  rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; margin: 20px;">
      <h3>Application Failed to Start</h3>
      <pre style="text-align: left; background: #fff; padding: 10px; overflow: auto;">${error instanceof Error ? error.message : JSON.stringify(error)}</pre>
      <p>Please check console for more details.</p>
    </div>
  `;
  console.error("Critical Mount Error:", error);
}