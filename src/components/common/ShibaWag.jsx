/* ShibaWag — 꼬리 흔드는 시바견 캐릭터 + 순환 말풍선 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import styles from './ShibaWag.module.css';

const MESSAGES = {
  ja: [
    '利用者を追加して始めよう！👤',
    '書類はPDFで保存できるよ📄',
    'カード右の✕ボタンで削除できるよ🗑️',
    'データは自動でクラウド保存☁️',
    '基本情報・支援計画書・会議録が作れるよ📋',
  ],
  ko: [
    '이용자를 추가하고 시작해요! 👤',
    '서류는 PDF로 저장할 수 있어요 📄',
    '카드 우측 ✕ 버튼으로 삭제 가능 🗑️',
    '데이터는 자동으로 클라우드 저장 ☁️',
    '기본정보·지원계획서·회의록 작성 가능 📋',
  ],
};

const ShibaWag = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'ko' ? 'ko' : 'ja';
  const { canInstall, isInstalled, install } = useInstallPrompt();
  const [showGuide, setShowGuide] = useState(false);

  const handleShortcut = () => {
    /* .url 파일 생성 — Windows 바로가기 형식 */
    const content = `[InternetShortcut]\nURL=https://caredoc-navy.vercel.app/\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'CareDoc.url';
    a.click();
    URL.revokeObjectURL(a.href);
  };

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
      {!isInstalled && (
        <div className={styles.installWrap}>
          <button
            className={styles.installBtn}
            onClick={canInstall ? install : handleShortcut}
          >
            <span className={styles.installIcon}>📲</span>
            <span className={styles.installLabel}>
              {lang === 'ko' ? '바탕화면에 추가' : 'ホーム画面に追加'}
            </span>
          </button>
        </div>
      )}
      <div className={styles.wrap}>
        <div className={styles.inner}>
          <div className={styles.bubble}>{MESSAGES[lang][msgIdx]}</div>
          <div className={styles.shiba} />
        </div>
      </div>
    </>
  );
};

export default ShibaWag;
