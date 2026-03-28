/* 랜딩 페이지 — GSI 버튼으로 Google 로그인 */
import { useEffect, useRef } from 'react';
import styles from './Landing.module.css';

const Landing = ({ loginLoading, loginError }) => {
  const googleBtnRef = useRef(null);

  useEffect(() => {
    const renderBtn = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          size: 'large',
          text: 'signin_with',
          width: 280,
          logo_alignment: 'left',
        });
      }
    };
    if (window.google) renderBtn();
    else window.addEventListener('load', renderBtn);
    return () => window.removeEventListener('load', renderBtn);
  }, []);

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

      {/* Google GSI 버튼 / 로딩 */}
      {loginLoading
        ? <div className={styles.loginBtn}>ログイン中...</div>
        : <div ref={googleBtnRef} className={styles.googleBtnWrap} />
      }

      {loginError && <p className={styles.errorMsg}>{loginError}</p>}

      <p className={styles.note}>ログインするとデータがクラウドに保存され<br />どの端末からでもアクセスできます。</p>

    </div>
  );
};

export default Landing;
