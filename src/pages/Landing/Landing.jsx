/* 랜딩 페이지 — Google 로그인 */

/* ============================================================
   [면접 설명 포인트] Landing.jsx 역할
   - 미로그인 사용자가 가장 먼저 보는 화면.
   - 서비스 소개 + Google OAuth 로그인 버튼으로 구성.
   - 로그인 상태·에러·로딩을 props로 받아 UI에 반영.
     (상태 관리는 useAuth 훅에서, 표현만 이 컴포넌트가 담당 — 관심사 분리)

   [props(프롭스) 설명]
   - loginLoading  : 로그인 요청 진행 중 여부 → 버튼 비활성화에 사용
   - loginError    : 로그인 실패 시 에러 메시지 → 버튼 아래 표시
   - loginWithGoogle: 버튼 클릭 시 실행할 로그인 함수 → App.jsx에서 주입
   ============================================================ */

import LanguageToggle from '../../components/common/LanguageToggle';
import styles from './Landing.module.css';

/* 구조 분해 할당(Destructuring 디스트럭처링):
   props 객체에서 필요한 값만 꺼내 변수로 사용 */
const Landing = ({ loginLoading, loginError, loginWithGoogle, loginWithLine }) => {

  return (
    <div className={styles.wrap}>
      {/* 오른쪽 상단 언어 토글 — position fixed로 랜딩 위에 항상 표시 */}
      <div style={{ position: 'fixed', top: 12, right: 16, zIndex: 100 }}>
        <LanguageToggle />
      </div>

      {/* 로고 */}
      <div className={styles.logo}>CareDoc</div>
      <p className={styles.sub}>介護書類をかんたんに、もっとスマートに。</p>

      {/* 워드/엑셀 → CareDoc 전환 흐름 안내 (서비스 가치 설명 섹션) */}
      <div className={styles.flow}>
        <div className={styles.flowItem}>
          <div className={styles.flowIcon}>
            <span className={styles.officeIcon} style={{ background: '#2B579A' }}>W</span>
            <span className={styles.officeIcon} style={{ background: '#217346' }}>X</span>
          </div>
          <div className={styles.flowLabel}>Word / Excel</div>
          <div className={styles.flowDesc}>手書き・手入力<br />毎回ゼロから作成</div>
        </div>

        <div className={styles.arrow}>→</div>

        {/* flowItemActive 클래스로 CareDoc 카드를 강조 표시 */}
        <div className={`${styles.flowItem} ${styles.flowItemActive}`}>
          <div className={styles.flowIcon}>🌐</div>
          <div className={styles.flowLabel}>CareDoc</div>
          <div className={styles.flowDesc}>ブラウザで入力<br />即PDF・自動保存</div>
        </div>
      </div>

      <p className={styles.catchCopy}>もっとスマートに、もっとラクに。</p>

      {/* Google 로그인 버튼
          disabled(디세이블드): loginLoading이 true인 동안 버튼 비활성화 → 중복 클릭 방지
          onClick(온클릭): 버튼 클릭 시 loginWithGoogle 함수 실행 */}
      {/* 로그인 버튼 묶음 — 두 버튼 간격 15px, 동일 너비 */}
      <div className={styles.loginBtns}>
        <button className={styles.lineBtn} onClick={loginWithLine} disabled={loginLoading}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ marginRight: 8, flexShrink: 0 }}>
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
          LINEでログイン
        </button>

        <button className={styles.loginBtn} onClick={loginWithGoogle} disabled={loginLoading}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className={styles.googleIcon} />
          {loginLoading ? 'ログイン中...' : 'Googleアカウントでログイン'}
        </button>
      </div>

      {/* && 단축 평가(Short-circuit Evaluation 숏서킷 이벨류에이션):
          loginError가 truthy일 때만 에러 메시지 렌더링 */}
      {loginError && <p className={styles.errorMsg}>{loginError}</p>}

      <p className={styles.note}>ログインするとデータがクラウドに保存され<br />どの端末からでもアクセスできます。</p>

    </div>
  );
};

export default Landing;
