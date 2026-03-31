/* 언어 토글 버튼 — 한국어 ↔ 일본어 전환 */

/* ============================================================
   [면접 설명 포인트] LanguageToggle.jsx 역할
   - 헤더 우측에 표시되는 언어 전환 버튼.
   - 클릭 시 한국어(ko) ↔ 일본어(ja)를 즉시 전환.
   - react-i18next의 i18n.changeLanguage()가 전역 언어 상태를 변경하므로
     모든 t('key') 호출이 자동으로 새 언어 텍스트로 리렌더링됨.
   ============================================================ */

/* useTranslation(유즈트랜슬레이션): 현재 언어 정보와 번역 함수를 제공하는 훅
   i18n(아이에이티넥스트엔): 언어 변경·현재 언어 조회 등 i18next 핵심 객체 */
import { useTranslation } from 'react-i18next';
import styles from './LanguageToggle.module.css';

const LanguageToggle = () => {
  const { i18n, t } = useTranslation();

  /* toggle(토글): 현재 언어가 'ko'면 'ja'로, 'ja'면 'ko'로 전환
     i18n.changeLanguage(체인지랭귀지): react-i18next 전역 언어를 바꾸는 함수.
     이 함수 하나만 호출하면 앱 전체의 모든 t() 텍스트가 즉시 교체됨. */
  const toggle = () => {
    i18n.changeLanguage(i18n.language === 'ko' ? 'ja' : 'ko');
  };

  /* 현재 언어가 한국어인지 확인 — 버튼에 보여줄 "다음 언어" 국기를 결정 */
  const isKo = i18n.language === 'ko';

  return (
    <button
      className={styles.toggle}
      onClick={toggle}
      data-qa="language-toggle"
      /* aria-label(아리아 레이블): 스크린 리더(시각장애인용 도구)에 버튼 역할을 설명하는 접근성 속성 */
      aria-label="언어 전환"
      /* tabIndex={-1}: Tab 키 이동 대상에서 제외 — 폼 입력 중 헤더 버튼으로 포커스가 튀지 않도록 */
      tabIndex={-1}
    >
      {/* 현재 한국어면 다음에 바꿀 일본 국기를, 일본어면 한국 국기를 표시 */}
      <span className={styles.flag}>{isKo ? '🇯🇵' : '🇰🇷'}</span>
      {/* t('lang.toggle'): ko → '日本語', ja → '한국어' */}
      {t('lang.toggle')}
    </button>
  );
};

export default LanguageToggle;
