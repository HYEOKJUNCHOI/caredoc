/* 랜딩 페이지 — 미로그인 시 표시 */
import styles from './Landing.module.css';

const Landing = ({ onLogin, loginLoading, loginError }) => (
  <div className={styles.wrap}>

    {/* 로고 */}
    <div className={styles.logo}>CareDoc</div>
    <p className={styles.sub}>介護書類をかんたんに、もっとスマートに。</p>

    {/* 워드 → 웹 변환 표현 */}
    <div className={styles.flow}>
      <div className={styles.flowItem}>
        <div className={styles.flowIcon}>📄</div>
        <div className={styles.flowLabel}>Word / 紙</div>
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
    <button className={styles.loginBtn} onClick={onLogin} disabled={loginLoading}>
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className={styles.googleIcon} />
      {loginLoading ? 'ログイン中...' : 'Googleアカウントでログイン'}
    </button>

    {loginError && <p className={styles.errorMsg}>{loginError}</p>}

    <p className={styles.note}>ログインするとデータがクラウドに保存され<br />どの端末からでもアクセスできます。</p>

  </div>
);

export default Landing;
