import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Forcefully unregister any lingering Service Workers from the old PWA setup
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister().then(
        (success) => {
          if (success) console.log('Successfully unregistered stale service worker.');
        }
      );
    }
  });
}

// Auto-reload on stale script loading error after deployments
window.addEventListener('error', (event) => {
  if (
    event.message &&
    (event.message.includes('Loading chunk') ||
     event.message.includes('Importing a module script failed') ||
     event.message.includes('Unexpected token'))
  ) {
    const hasReloaded = sessionStorage.getItem('auto_reloaded_for_update');
    if (!hasReloaded) {
      sessionStorage.setItem('auto_reloaded_for_update', 'true');
      window.location.reload();
    }
  }
});

// Periodic version check to auto-refresh all clients (phones, laptops) upon new deployments
let currentAppVersion = null;
const checkAppVersion = () => {
  fetch(`/version.json?t=${new Date().getTime()}`, { cache: 'no-store' })
    .then((res) => res.json())
    .then((data) => {
      if (!currentAppVersion) {
        currentAppVersion = data.version;
      } else if (currentAppVersion !== data.version) {
        console.log('New deployment detected! Auto-refreshing...');
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (let registration of registrations) {
              registration.unregister();
            }
          });
        }
        window.location.reload(true);
      }
    })
    .catch(() => {}); // Ignore network errors
};

// Check immediately, then every 2 minutes
checkAppVersion();
setInterval(checkAppVersion, 2 * 60 * 1000);

createRoot(document.getElementById('root')).render(<App />);
