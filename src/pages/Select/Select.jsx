/* 서류 선택 화면
   이용자를 선택한 후 어떤 서류를 작성/편집할지 고르는 페이지 */

/* ============================================================
   [면접 설명 포인트] Select.jsx 역할
   - 이용자 카드 클릭 후 진입하는 두 번째 화면.
   - 서류 종류(기본정보, 개별지원계획서, 모니터링, 회의록)를 카드 형태로 나열.
   - 카드 클릭 시 해당 서류의 편집 화면(/edit/:type)으로 이동.

   [설계 포인트]
   - DOC_TYPES 배열로 카드를 관리해, 서류 종류가 추가/삭제될 때
     이 배열만 수정하면 화면이 자동으로 업데이트됩니다. (데이터 주도 렌더링)
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './Select.module.css';

/* DOC_TYPES(닥타입스): 서류 카드 목록을 배열로 관리
   key(키): URL 파라미터로 사용되는 서류 식별자
   icon(아이콘): 카드에 표시할 이모지 아이콘
   번역 텍스트(제목, 설명)는 i18n에서 select.{key}, select.{key}Desc 키로 가져옴 */
const DOC_TYPES = [
  { key: 'basicInfo',      icon: '📄' }, /* 기본정보 */
  { key: 'supportPlan',    icon: '📋' }, /* 개별지원계획서 */
  { key: 'monitoring',     icon: '📊' }, /* 모니터링 기록표 */
  { key: 'meetingMinutes', icon: '📝' }, /* 작성회의록 */
];

const Select = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    /* data-qa(데이터-큐에이): DevTools에서 이 요소의 코드 위치를 즉시 찾기 위한 식별자 */
    <div className={styles.container} data-qa="select-page">
      <h1 className={styles.title}>{t('select.title')}</h1>
      <p className={styles.subtitle}>{t('select.subtitle')}</p>

      <div className={styles.cardList} data-qa="select-card-list">
        {/* map(맵): DOC_TYPES 배열의 각 항목을 카드 버튼 JSX로 변환
            구조 분해 할당({ key, icon }): 배열 항목 객체에서 필요한 값만 꺼냄 */}
        {DOC_TYPES.map(({ key, icon }) => (
          <button
            /* key(키): React가 리스트를 효율적으로 업데이트하기 위한 고유 식별자
               key가 있으면 배열 순서가 바뀌어도 올바른 컴포넌트만 업데이트됨 */
            key={key}
            className={styles.card}
            /* 클릭 시 /edit/basicInfo 처럼 서류 타입을 URL에 포함해 편집 화면으로 이동
               템플릿 리터럴(`/edit/${key}`): 문자열 안에 변수를 삽입하는 ES6 문법 */
            onClick={() => navigate(`/edit/${key}`)}
            data-qa={`select-card-${key}`}
          >
            <div className={styles.iconWrap}>{icon}</div>
            <div className={styles.cardBody}>
              {/* t(`select.${key}`): 동적 키로 번역 텍스트 조회
                  예: key='basicInfo' → t('select.basicInfo') → '기본정보' 또는 '基本情報' */}
              <span className={styles.cardTitle}>{t(`select.${key}`)}</span>
              <span className={styles.cardDesc}>{t(`select.${key}Desc`)}</span>
            </div>
            {/* › 화살표: 더 들어갈 수 있는 항목임을 시각적으로 표시 (어포던스, affordance) */}
            <span className={styles.chevron}>›</span>
          </button>
        ))}
      </div>

    </div>
  );
};

export default Select;
