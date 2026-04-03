/* ShibaWag — 꼬리 흔드는 시바견 캐릭터 + 순환 말풍선 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ShibaWag.module.css';
import ShibaHelp from './SupportModal';

const MESSAGES = {
  ja: [
    'お役に立てましたか？🐾',
    '書類作成、お疲れ様です！',
    'いつもありがとうございます！',
    '困ったことはありませんか？',
    'クリックしてヘルプを見る📋',
  ],
  ko: [
    '도움이 되셨나요? 🐾',
    '서류 작성 수고 많으세요!',
    '항상 감사합니다!',
    '궁금한 게 있으면 눌러보세요!',
    '눌러서 도움말 보기 📋',
  ],
};

const ShibaWag = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'ko' ? 'ko' : 'ja';

  const [open, setOpen] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    setMsgIdx(0);
  }, [lang]);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIdx((i) => (i + 1) % MESSAGES[lang].length);
    }, 6000);
    return () => clearInterval(timer);
  }, [lang]);

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.inner} onClick={() => setOpen(true)}>
          <div className={styles.bubble}>{MESSAGES[lang][msgIdx]}</div>
          <div className={styles.shiba} />
        </div>
      </div>
      {open && <ShibaHelp onClose={() => setOpen(false)} />}
    </>
  );
};

export default ShibaWag;
