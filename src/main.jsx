import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n/index.js'; // i18next 초기화 — App보다 먼저 로드
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
