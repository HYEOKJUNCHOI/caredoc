/* 헤더 — 로고(홈) or 뒤로가기 + 중앙 서류명 + 우측 언어 토글 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
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
  const { logout } = useAuth();
  const isHome = location.pathname === '/';

  /* /edit/:type 또는 /preview/:type 경로에서 서류명 파싱 */
  const pathType = location.pathname.split('/').pop();
  const docTitle = DOC_TITLES[pathType] || null;

  /* 30분 자동 로그아웃 타이머 로직 */
  const [timeLeft, setTimeLeft] = useState(1200); // 20분 = 1200초
  const lastActiveRef = useRef(Date.now());

  useEffect(() => {
    // 사용자 활동 이벤트 (마우스, 키보드, 터치, 스크롤 등)
    const events = ['mousedown', 'keydown', 'touchstart', 'wheel'];
    const resetTimer = () => {
      lastActiveRef.current = Date.now();
    };

    events.forEach((evt) => document.addEventListener(evt, resetTimer, { passive: true }));

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastActiveRef.current) / 1000);
      const remaining = Math.max(1200 - elapsed, 0);
      
      setTimeLeft(remaining);

      // 0초가 되면 30분 미사용으로 판단하여 자동 로그아웃 실행
      if (remaining === 0) {
        logout();
      }
    }, 1000);

    return () => {
      events.forEach((evt) => document.removeEventListener(evt, resetTimer));
      clearInterval(interval);
    };
  }, [logout]);

  /* MM:SS 포맷팅 */
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isWarning = timeLeft <= 60; // 1분 이하 남았을 때 텍스트 강조

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
        {/* 타이머 표시 영역 */}
        <div className={`${styles.timer} ${isWarning ? styles.timerWarning : ''}`} title="自動ログアウトまで">
          ⏳ {formatTime(timeLeft)}
        </div>
        <LanguageToggle />
        <button className={styles.logoutBtn} onClick={logout} tabIndex={-1}>ログアウト</button>
      </div>
    </header>
  );
};

export default Header;
