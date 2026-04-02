/* 헤더 — 로고(홈) or 뒤로가기 + 중앙 서류명 + 우측 언어 토글 */

/* ============================================================
   [면접 설명 포인트] Header.jsx 역할
   - 모든 페이지 최상단에 공통으로 렌더링되는 레이아웃 컴포넌트.
   - 현재 URL 경로(pathname)를 읽어 홈 / 서류 편집 화면을 구분한다.
   - 자동 로그아웃 타이머 로직을 담당한다.
   ============================================================ */

/* useState(유즈스테이트): 남은 시간(timeLeft) 상태 관리
   useEffect(유즈이펙트): 타이머 등록/해제
   useRef(유즈레프): lastActiveRef — 마지막 사용자 활동 시각. 렌더링과 무관하게 최신값 유지 */
import { useState, useEffect, useRef } from 'react';

/* useNavigate(유즈내비게이트): 코드로 페이지 이동
   useLocation(유즈로케이션): 현재 URL 경로 정보를 읽는 훅 */
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import LanguageToggle from '../common/LanguageToggle';
import styles from './Header.module.css';

/* DOC_TITLES(닥타이틀스): 서류 타입 키 → 헤더 중앙에 표시할 문서명 매핑 객체
   URL 경로 맨 뒤(.pop())가 이 객체의 키와 일치하면 해당 이름을 중앙에 표시 */
const DOC_TITLES_JA = {
  basicInfo:      '基本情報',
  supportPlan:    '個別支援計画書',
  monitoring:     'モニタリング記録表',
  meetingMinutes: '作成会議録',
};
const DOC_TITLES_KO = {
  basicInfo:      '기본정보',
  supportPlan:    '개별지원계획서',
  monitoring:     '모니터링기록표',
  meetingMinutes: '작성회의록',
};

const Header = () => {
  const navigate = useNavigate();

  /* useLocation(유즈로케이션): 현재 페이지 URL 정보를 담은 객체
     location.pathname(패스네임): 현재 URL 경로 예: '/edit/basicInfo' */
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();

  /* 로그아웃 확인 모달 표시 여부 */
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  /* 홈('/') 여부 판단 — 홈이면 로고 표시, 그 외엔 뒤로가기 버튼 표시 */
  const isHome = location.pathname === '/';

  /* URL 경로 맨 마지막 세그먼트 추출
     '/edit/basicInfo'.split('/').pop() → 'basicInfo'
     이 값으로 DOC_TITLES 객체를 조회해 중앙 서류명을 표시 */
  const pathType = location.pathname.split('/').pop();
  const DOC_TITLES = i18n.language === 'ja' ? DOC_TITLES_JA : DOC_TITLES_KO;
  const docTitle = DOC_TITLES[pathType] || null;

  /* ── 자동 로그아웃 타이머 ──
     [설계 이유]
     Header는 모든 페이지에 항상 존재하므로,
     자동 로그아웃 타이머를 여기에 두면 모든 화면에서 동작이 보장됩니다.
     만약 개별 페이지에 두면 페이지 이동 시마다 타이머가 초기화됩니다. */

  /* 남은 시간(초). 초기값 1200 = 20분 */
  const [timeLeft, setTimeLeft] = useState(1200);

  /* lastActiveRef(라스트액티브레프): 마지막 사용자 활동 시각 (타임스탬프, 밀리초)
     useRef를 쓰는 이유: 이벤트 핸들러 안에서 매번 최신값을 참조해야 하지만,
     값이 바뀔 때마다 화면을 다시 그릴 필요가 없으므로 ref가 적합 */
  const lastActiveRef = useRef(Date.now());

  useEffect(() => {
    /* 사용자 활동 이벤트 목록 — 이 중 하나라도 감지되면 타이머 리셋
       mousemove는 제외 (살짝만 움직여도 리셋되는 걸 방지) */
    const events = ['mousedown', 'keydown', 'touchstart', 'wheel'];

    /* 이벤트 발생 시 현재 시각을 lastActiveRef에 기록 */
    const resetTimer = () => {
      lastActiveRef.current = Date.now();
    };

    /* passive: true — 이벤트 핸들러가 preventDefault()를 호출하지 않음을 브라우저에 알려
       스크롤 성능을 최적화하는 옵션 */
    events.forEach((evt) => document.addEventListener(evt, resetTimer, { passive: true }));

    /* setInterval(셋인터벌): N밀리초마다 콜백을 반복 실행하는 타이머
       1000ms = 1초마다 남은 시간을 계산해 상태를 업데이트 */
    const interval = setInterval(() => {
      const now = Date.now();
      /* 마지막 활동 이후 경과 시간(초) 계산 */
      const elapsed = Math.floor((now - lastActiveRef.current) / 1000);
      /* Math.max(수학맥스): 음수가 되지 않도록 최솟값을 0으로 제한 */
      const remaining = Math.max(1200 - elapsed, 0);

      setTimeLeft(remaining);

      /* 남은 시간이 0초가 되면 자동 로그아웃 실행 */
      if (remaining === 0) {
        logout();
      }
    }, 1000);

    /* 클린업(cleanup) 함수: useEffect가 다시 실행되거나 컴포넌트가 언마운트될 때 실행
       이벤트 리스너와 인터벌을 제거하지 않으면 메모리 누수(memory leak)가 발생함 */
    return () => {
      events.forEach((evt) => document.removeEventListener(evt, resetTimer));
      /* clearInterval(클리어인터벌): setInterval로 만든 반복 타이머를 중지 */
      clearInterval(interval);
    };
  }, [logout]); /* logout 함수가 바뀔 때만 effect 재실행 */

  /* 초(seconds)를 MM:SS 형식으로 변환하는 함수
     padStart(패드스타트): 문자열을 지정 길이로 맞추되, 부족한 앞자리를 '0'으로 채움
     예: 5 → '05' */
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  /* 1분 이하 남으면 빨간색 경고 스타일 적용 */
  const isWarning = timeLeft <= 60;

  return (
    <header className={styles.header} data-qa="app-header">
      <div className={styles.left}>
        {/* 조건부 렌더링: 홈이면 로고, 아니면 뒤로가기 버튼 */}
        {isHome ? (
          <span className={styles.logo}>
            CareDoc<span className={styles.logoDot} />
          </span>
        ) : (
          <button
            className={styles.backBtn}
            /* navigate(-1): 브라우저 히스토리에서 이전 페이지로 이동 */
            onClick={() => navigate(-1)}
            aria-label={t('nav.back')}
            tabIndex={-1}
          >
            <span className={styles.backArrow}>←</span>
            {t('nav.back')}
          </button>
        )}
      </div>

      {/* 중앙 서류명 — docTitle이 있을 때만 표시 (단축 평가, && 연산자) */}
      <div className={styles.center}>
        {docTitle && <span className={styles.docTitle}>{docTitle}</span>}
      </div>

      <div className={styles.right}>
        {/* 템플릿 리터럴로 기본 클래스 + 경고 클래스를 조건부로 합침 */}
        <div className={`${styles.timer} ${isWarning ? styles.timerWarning : ''}`} title="自動ログアウトまで">
          ⏳ {formatTime(timeLeft)}
        </div>
        {/* 언어 토글 컴포넌트 — 한국어/일본어 전환 */}
        <LanguageToggle />
        <button className={styles.logoutBtn} onClick={() => setShowLogoutModal(true)} tabIndex={-1}>
          {i18n.language === 'ja' ? 'ログアウト' : '로그아웃'}
        </button>
      </div>

      {/* 로그아웃 확인 모달 */}
      {showLogoutModal && (
        <div className={styles.modalOverlay} onClick={() => setShowLogoutModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalTitle}>
              {i18n.language === 'ja' ? 'ログアウト' : '로그아웃'}
            </p>
            <p className={styles.modalDesc}>
              {i18n.language === 'ja'
                ? '公共の場でご利用でしたか？\n各サービスからもログアウトを推奨します。'
                : '공공장소에서 사용하셨나요?\n아래 서비스에서도 로그아웃하시길 권장합니다.'}
            </p>
            <div className={styles.modalLinks}>
              <a
                href="https://accounts.google.com/logout"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.modalLinkBtn}
                style={{ background: '#fff', color: '#333', border: '1px solid #ddd' }}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={16} height={16} alt="" />
                {i18n.language === 'ja' ? <>Googleから<br/>ログアウト</> : <>Google<br/>로그아웃</>}
              </a>
              <div className={styles.modalLineNote}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#06C755" style={{ flexShrink: 0 }}>
                  <path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
                <span>
                  {i18n.language === 'ja'
                    ? <>LINEアプリ → ⚙️ → アカウント →<br/>ログイン中の端末 → ログアウト</>
                    : <>LINE 앱 → ⚙️ → 계정 → 접속중인기기<br/>→ 로그아웃</>}
                </span>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalCancelBtn} onClick={() => setShowLogoutModal(false)}>
                {i18n.language === 'ja' ? 'キャンセル' : '취소'}
              </button>
              <button className={styles.modalLogoutBtn} onClick={() => { setShowLogoutModal(false); logout(); }}>
                {i18n.language === 'ja' ? 'アプリをログアウト' : '앱 로그아웃'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
