/* 헤더 — 로고(홈) or 뒤로가기 + 중앙 서류명 + 우측 언어 토글 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../common/LanguageToggle';
import styles from './Header.module.css';

const DOC_TITLES = {
  basicInfo:      '基本情報',
  supportPlan:    '個別支援計画書',
  monitoring:     'モニタリング記録表',
  meetingMinutes: '作成会議録',
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const isHome = location.pathname === '/';

  /* /edit/:type 또는 /preview/:type 경로에서 서류명 파싱 */
  const pathType = location.pathname.split('/').pop();
  const docTitle = DOC_TITLES[pathType] || null;

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

      {/* 중앙 서류명 */}
      <div className={styles.center}>
        {docTitle && <span className={styles.docTitle}>{docTitle}</span>}
      </div>

      <div className={styles.right}>
        <LanguageToggle />
      </div>
    </header>
  );
};

export default Header;
