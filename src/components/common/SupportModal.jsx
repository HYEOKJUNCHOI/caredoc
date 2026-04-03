/* ShibaHelp — 시바견 NPC 도움말 모달 */

import { useTranslation } from 'react-i18next';
import styles from './SupportModal.module.css';

const TIPS = {
  ja: [
    '👤 まず「＋ 新しい利用者を追加」から利用者を登録してね！',
    '📋 利用者を選んだら、作りたい書類の種類を選んでね！',
    '✏️ 入力画面で情報を入れると、書類に自動で反映されるよ！',
    '📄 プレビュー画面で内容を確認してから、PDFで保存してね！',
    '🗑️ 利用者カードの右にある✕ボタンで削除できるよ！',
    '☁️ データはクラウドに自動保存されるので、どの端末でも使えるよ！',
  ],
  ko: [
    '👤 먼저 「＋ 새 이용자 추가」로 이용자를 등록해 보세요!',
    '📋 이용자를 선택하면 만들고 싶은 서류 종류를 고를 수 있어요!',
    '✏️ 입력 화면에서 정보를 넣으면 서류에 자동으로 반영돼요!',
    '📄 미리보기에서 내용 확인 후 PDF로 저장하세요!',
    '🗑️ 이용자 카드 우측 ✕ 버튼으로 삭제할 수 있어요!',
    '☁️ 데이터는 클라우드에 자동 저장되어 어디서든 쓸 수 있어요!',
  ],
};

const ShibaHelp = ({ onClose }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'ko' ? 'ko' : 'ja';
  const tips = TIPS[lang];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <p className={styles.title}>
          {lang === 'ko' ? '🐾 시바의 도움말' : '🐾 シバのヘルプ'}
        </p>
        <ul className={styles.tipList}>
          {tips.map((tip, i) => (
            <li key={i} className={styles.tipItem}>{tip}</li>
          ))}
        </ul>
        <button className={styles.cancelBtn} onClick={onClose}>
          {lang === 'ko' ? '닫기' : '閉じる'}
        </button>
      </div>
    </div>
  );
};

export default ShibaHelp;
