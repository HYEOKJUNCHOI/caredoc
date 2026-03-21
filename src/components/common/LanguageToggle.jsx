/* 언어 토글 버튼 */

import { useTranslation } from 'react-i18next';
import styles from './LanguageToggle.module.css';

const LanguageToggle = () => {
  const { i18n, t } = useTranslation();

  const toggle = () => {
    i18n.changeLanguage(i18n.language === 'ko' ? 'ja' : 'ko');
  };

  const isKo = i18n.language === 'ko';

  return (
    <button
      className={styles.toggle}
      onClick={toggle}
      data-qa="language-toggle"
      aria-label="언어 전환"
      tabIndex={-1}
    >
      <span className={styles.flag}>{isKo ? '🇯🇵' : '🇰🇷'}</span>
      {t('lang.toggle')}
    </button>
  );
};

export default LanguageToggle;
