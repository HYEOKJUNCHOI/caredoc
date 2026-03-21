/* 헤더 — 로고(홈) or 뒤로가기 + 우측 언어 토글 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../common/LanguageToggle';
import styles from './Header.module.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const isHome = location.pathname === '/';

  return (
    <header className={styles.header} data-qa="app-header">
      <div className={styles.left}>
        {isHome ? (
          <span className={styles.logo}>
            CareDoc<span className={styles.logoDot} />
          </span>
        ) : (
          <button
            className={styles.backBtn}
            onClick={() => navigate(-1)}
            aria-label={t('nav.back')}
            tabIndex={-1}
          >
            <span className={styles.backArrow}>←</span>
            {t('nav.back')}
          </button>
        )}
      </div>
      <div className={styles.right}>
        <LanguageToggle />
      </div>
    </header>
  );
};

export default Header;
