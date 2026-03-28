/* i18next 초기 설정
   - 기본 언어: 한국어 (ko)
   - 토글: ko ↔ ja
   - localStorage에 언어 선택 저장 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ko from './locales/ko.json';
import ja from './locales/ja.json';

/* localStorage에 저장된 언어가 있으면 그걸 쓰고, 없으면 한국어 기본 */
const savedLang = localStorage.getItem('caredoc-lang') || 'ko';

i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    ja: { translation: ja },
  },
  lng: savedLang,
  fallbackLng: 'ko',
  interpolation: {
    escapeValue: false, // React는 자체 XSS 방어가 있으므로 꺼둠
  },
});

/* 초기 언어 설정 동기화 */
document.documentElement.lang = i18n.language;

/* 언어 변경 시 localStorage 저장 및 html lang 속성 업데이트 */
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('caredoc-lang', lng);
  document.documentElement.lang = lng;
});

export default i18n;
