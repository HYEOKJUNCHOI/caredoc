import ShibaWag from '../common/ShibaWag';
import styles from './Footer.module.css';

const Footer = () => (
  <footer className={styles.footer}>
    <span className={styles.copy}>🐾 介護書類をもっとスマートに</span>
    <div className={styles.shibaWrap}>
      <ShibaWag />
    </div>
  </footer>
);

export default Footer;
