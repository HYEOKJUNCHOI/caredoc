/* ShibaHelp — 시바견 NPC 도움말 모달 */

import { useTranslation } from 'react-i18next';
import styles from './SupportModal.module.css';

const TIPS = {
  ja: [
    '🐾 利用者を長押しすると削除ボタンが出るよ！',
    '📄 書類はプレビュー画面からPDFで保存できるよ！',
    '☁️ ログインすると複数の端末でデータを共有できるよ！',
    '✏️ 担当者名を入力すると書類に自動で入るよ！',
    '📋 利用者を追加してから書類の種類を選んでね！',
    '🔄 別のアカウントでログインすると自動でデータが切り替わるよ！',
  ],
  ko: [
    '🐾 이용자를 꾹 누르면 삭제 버튼이 나와요!',
    '📄 서류는 미리보기 화면에서 PDF로 저장할 수 있어요!',
    '☁️ 로그인하면 여러 기기에서 데이터를 공유할 수 있어요!',
    '✏️ 담당자 이름을 입력하면 서류에 자동으로 들어가요!',
    '📋 이용자를 추가한 뒤 서류 종류를 선택해 보세요!',
    '🔄 다른 계정으로 로그인하면 데이터가 자동으로 전환돼요!',
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
