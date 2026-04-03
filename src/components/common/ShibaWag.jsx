/* ShibaWag — 꼬리 흔드는 시바견 캐릭터 + 순환 말풍선 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ShibaWag.module.css';

const MESSAGES = {
  ja: [
    '利用者を追加して始めよう！👤',
    '書類はPDFで保存できるよ📄',
    'カード右の✕ボタンで削除できるよ🗑️',
    'データは自動でクラウド保存☁️',
    '書類の種類は複数選べるよ📋',
  ],
  ko: [
    '이용자를 추가하고 시작해요! 👤',
    '서류는 PDF로 저장할 수 있어요 📄',
    '카드 우측 ✕ 버튼으로 삭제 가능 🗑️',
    '데이터는 자동으로 클라우드 저장 ☁️',
    '서류 종류는 여러 개 선택 가능 📋',
  ],
};

const ShibaWag = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'ko' ? 'ko' : 'ja';

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
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <div className={styles.bubble}>{MESSAGES[lang][msgIdx]}</div>
        <div className={styles.shiba} />
      </div>
    </div>
  );
};

export default ShibaWag;
