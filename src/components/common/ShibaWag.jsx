/* ShibaWag — 꼬리 흔드는 시바견 캐릭터
   원본 이미지(siba.png): 1536×1024, 두 프레임이 좌우로 나란히
   CSS background-position으로 프레임 1↔2 전환 → 꼬리 흔들기 애니메이션 */

import styles from './ShibaWag.module.css';

const ShibaWag = () => (
  <div className={styles.shiba} title="🐾 CareDoc" />
);

export default ShibaWag;
