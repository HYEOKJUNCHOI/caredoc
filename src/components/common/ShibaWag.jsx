/* ShibaWag — 꼬리 흔드는 시바견 캐릭터
   원본 이미지(siba.png): 1536×1024, 두 프레임이 좌우로 나란히
   CSS background-position으로 프레임 1↔2 전환 → 꼬리 흔들기 애니메이션 */

import { useState, useEffect } from 'react';
import styles from './ShibaWag.module.css';
import SupportModal from './SupportModal';

const MESSAGES = [
  'コーヒー一杯のご支援を ☕',
  'お役に立てましたか？🐾',
  '書類作成、お疲れ様です！',
  'ご支援いただけると嬉しいです🙏',
  'いつもありがとうございます！',
  '介護の現場、応援しています',
  '困ったことはありませんか？',
  'サーバー維持のためご支援を',
];

const ShibaWag = () => {
  const [open, setOpen] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIdx((i) => (i + 1) % MESSAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <div className={styles.wrap}>
        <img src="/sibazip.png" className={styles.house} alt="" />
        <div className={styles.inner} onClick={() => setOpen(true)}>
          <div className={styles.bubble}>{MESSAGES[msgIdx]}</div>
          <div className={styles.shiba} />
        </div>
      </div>
      {open && <SupportModal onClose={() => setOpen(false)} />}
    </>
  );
};

export default ShibaWag;
