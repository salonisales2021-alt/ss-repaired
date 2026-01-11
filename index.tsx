
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const cleanupServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    } catch (error) {
      // Ignore
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
  // Safe Error Rendering (XSS prevention)
  const safeMessage = error instanceof Error ? error.message : "Unknown error";
  rootElement.innerText = `Application Error: ${safeMessage}`;
  console.error("Critical Mount Error:", error);
}
