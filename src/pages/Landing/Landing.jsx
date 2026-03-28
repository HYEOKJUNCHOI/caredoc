/* 랜딩 페이지 — Google 로그인 */
import styles from './Landing.module.css';

const Landing = ({ loginLoading, loginError, loginWithGoogle }) => {

  return (
    <div className={styles.wrap}>

      {/* 로고 */}
      <div className={styles.logo}>CareDoc</div>
      <p className={styles.sub}>介護書類をかんたんに、もっとスマートに。</p>

      {/* 워드 → 웹 변환 표현 */}
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

        <div className={`${styles.flowItem} ${styles.flowItemActive}`}>
          <div className={styles.flowIcon}>🌐</div>
          <div className={styles.flowLabel}>CareDoc</div>
          <div className={styles.flowDesc}>ブラウザで入力<br />即PDF・自動保存</div>
        </div>
      </div>

      <p className={styles.catchCopy}>もっとスマートに、もっとラクに。</p>

      {/* 구글 로그인 버튼 */}
      <button className={styles.loginBtn} onClick={loginWithGoogle} disabled={loginLoading}>
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className={styles.googleIcon} />
        {loginLoading ? 'ログイン中...' : 'Googleアカウントでログイン'}
      </button>

      {loginError && <p className={styles.errorMsg}>{loginError}</p>}

      <p className={styles.note}>ログインするとデータがクラウドに保存され<br />どの端末からでもアクセスできます。</p>

    </div>
  );
};

export default Landing;
