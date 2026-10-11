import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Die GitHub-Pages-Vorschau hat keinen Server: Anfragen, Termine und Statistik kämen dort nie an.
// Darum Besucher automatisch zur echten Daryos-Seite weiterleiten (Adresse beim Bauen über VITE_LIVE_URL).
const live = import.meta.env.VITE_LIVE_URL as string | undefined;
if (live && /\.github\.io$/.test(location.hostname)) {
  location.replace(live.replace(/\/$/, '') + '/' + location.hash);
} else {
  createRoot(document.getElementById('root')!).render(<App />);
}
