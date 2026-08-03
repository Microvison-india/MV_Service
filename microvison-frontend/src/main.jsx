import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

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

createRoot(document.getElementById('root')).render(<App />);
