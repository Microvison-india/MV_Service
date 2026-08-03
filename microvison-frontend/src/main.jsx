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
    .then((res) => {
      if (!res.ok) return null;
      return res.json();
    })
    .then((data) => {
      if (!data) return;
      if (!currentAppVersion) {
        currentAppVersion = data.version;
      } else if (currentAppVersion !== data.version) {
        console.log('New deployment detected! Auto-refreshing...');
        // Unregister any stale service workers first
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (let registration of registrations) {
              registration.unregister();
            }
          });
        }
        // Hard reload bypasses browser cache
        window.location.reload(true);
      }
    })
    .catch(() => {}); // Silently ignore network errors (offline, etc.)
};

// 1. Check on first load
checkAppVersion();

// 2. Check every 2 minutes for users who leave the tab open
setInterval(checkAppVersion, 2 * 60 * 1000);

// 3. Check immediately when user returns to the tab/app (phone waking from sleep, switching apps)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    checkAppVersion();
  }
});

createRoot(document.getElementById('root')).render(<App />);
