/* ShibaWag — 꼬리 흔드는 시바견 캐릭터 + 집 + 순환 말풍선 */

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
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* wrap: 콘텐츠 박스 하단 전체 폭에 걸쳐 집(왼쪽) + 시바(오른쪽) 배치 */}
      <div className={styles.wrap}>
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
