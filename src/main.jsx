import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n/index.js'; // i18next 초기화 — App보다 먼저 로드
import './index.css';
import App from './App.jsx';

/* Service Worker 등록 — PWA 설치 활성화 */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
