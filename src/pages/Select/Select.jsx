/* 서류 선택 화면 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './Select.module.css';

/* 기본정보 → 개별지원계획서 → 모니터링 → 회의록 순서 */
const DOC_TYPES = [
  { key: 'basicInfo',      icon: '📄' },
  { key: 'supportPlan',    icon: '📋' },
  { key: 'monitoring',     icon: '📊' },
  { key: 'meetingMinutes', icon: '📝' },
];

const Select = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className={styles.container} data-qa="select-page">
      <h1 className={styles.title}>{t('select.title')}</h1>
      <p className={styles.subtitle}>{t('select.subtitle')}</p>

      <div className={styles.cardList} data-qa="select-card-list">
        {DOC_TYPES.map(({ key, icon }) => (
          <button
            key={key}
            className={styles.card}
            onClick={() => navigate(`/edit/${key}`)}
            data-qa={`select-card-${key}`}
          >
            <div className={styles.iconWrap}>{icon}</div>
            <div className={styles.cardBody}>
              <span className={styles.cardTitle}>{t(`select.${key}`)}</span>
              <span className={styles.cardDesc}>{t(`select.${key}Desc`)}</span>
            </div>
            <span className={styles.chevron}>›</span>
          </button>
        ))}
      </div>

    </div>
  );
};

export default Select;
