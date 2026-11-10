import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {
  ensureOfflineServiceWorker,
  warmOfflineCache,
} from './utils/offlineCacheManager';

// Ensure screen orientation is unlocked so the app never forces landscape mode
try {
  const scr = window.screen as Screen & {
    orientation?: {
      unlock?: () => void;
    };
  };
  if (scr?.orientation && typeof scr.orientation.unlock === 'function') {
    scr.orientation.unlock();
  }
} catch {
  // Ignore on browsers that do not support screen.orientation.unlock
}

// Register offline service worker (or clean up any conflicting SW on Cloud Run proxy hosts)
// without attaching any controllerchange auto-reload listeners.
void ensureOfflineServiceWorker().then(() => {
  void warmOfflineCache();
});

createRoot(document.getElementById('root')!).render(<App />);
