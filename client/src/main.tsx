import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered:', registration);
        
        // Check for updates every 10 seconds
        setInterval(() => {
          registration.update();
        }, 10000);
        
        // Force reload when new service worker is waiting
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available, reload page
                console.log('New service worker available, reloading...');
                window.location.reload();
              }
            });
          }
        });
      })
      .catch(err => {
        console.log('Service Worker registration failed:', err);
      });
  });
}
