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

import styles from './Landing.module.css';

/* 구조 분해 할당(Destructuring 디스트럭처링):
   props 객체에서 필요한 값만 꺼내 변수로 사용 */
const Landing = ({ loginLoading, loginError, loginWithGoogle }) => {

  return (
    <div className={styles.wrap}>

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
      <button className={styles.loginBtn} onClick={loginWithGoogle} disabled={loginLoading}>
        {/* Google 공식 SVG 아이콘 — 브랜드 가이드라인 준수 */}
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className={styles.googleIcon} />
        {/* 삼항 연산자(Ternary Operator 터너리 오퍼레이터): 로딩 중이면 '로그인 중...', 아니면 기본 텍스트 */}
        {loginLoading ? 'ログイン中...' : 'Googleアカウントでログイン'}
      </button>

      {/* && 단축 평가(Short-circuit Evaluation 숏서킷 이벨류에이션):
          loginError가 truthy일 때만 에러 메시지 렌더링 */}
      {loginError && <p className={styles.errorMsg}>{loginError}</p>}

      <p className={styles.note}>ログインするとデータがクラウドに保存され<br />どの端末からでもアクセスできます。</p>

    </div>
  );
};

export default Landing;
