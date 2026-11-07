import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register service worker immediately so the entire game and 3D assets work 100% offline on iPhone and Android
registerSW({immediate: true});

createRoot(document.getElementById('root')!).render(<App />);
