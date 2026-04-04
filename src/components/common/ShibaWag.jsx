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
  const [showConfirm, setShowConfirm] = useState(false);

  const handleShortcut = () => {
    const content = `[InternetShortcut]\nURL=https://caredoc-navy.vercel.app/\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'CareDoc.url';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleHouseClick = () => setShowConfirm(true);

  const handleConfirm = () => {
    setShowConfirm(false);
    if (canInstall) install();
    else handleShortcut();
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
      <div className={styles.ground}>
        {/* 집 입구 오른쪽에서 시바 방향으로 — 왼발·오른발 교차 */}
        {[
          { left: '32%', top: '8px',  rotate:  80 },
          { left: '40%', top: '22px', rotate: 100 },
          { left: '48%', top: '6px',  rotate:  80 },
          { left: '56%', top: '20px', rotate: 100 },
          { left: '64%', top: '8px',  rotate:  80 },
        ].map((p, i) => (
          <span
            key={i}
            className={styles.paw}
            style={{
              left: p.left,
              top: p.top,
              transform: `rotate(${p.rotate}deg)`,
            }}
          >🐾</span>
        ))}
      </div>
      {!isInstalled && (
        <div className={styles.installWrap} onClick={handleHouseClick}>
          <img src="/sibazip.png" className={styles.houseImg} alt="바로가기" />
        </div>
      )}
      {showConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setShowConfirm(false)}>
          <div className={styles.confirmCard} onClick={(e) => e.stopPropagation()}>
            <p className={styles.confirmTitle}>
              {lang === 'ko' ? '🏠 바탕화면에 추가하시겠습니까?' : '🏠 ホーム画面に追加しますか？'}
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setShowConfirm(false)}>
                {lang === 'ko' ? '취소' : 'キャンセル'}
              </button>
              <button className={styles.confirmOk} onClick={handleConfirm}>
                {lang === 'ko' ? '추가' : '追加する'}
              </button>
            </div>
          </div>
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
