/* 전체 인쇄 — 기본정보·개별지원계획서·모니터링·회의록 4종 한 번에 인쇄 */

import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getCurrentUser, getCurrentUserId, getDocument } from '../../utils/storage';
import BasicInfoDoc   from './docs/BasicInfoDoc';
import SupportPlanDoc from './docs/SupportPlanDoc';
import MonitoringDoc  from './docs/MonitoringDoc';
import MeetingDoc     from './docs/MeetingDoc';
import styles from './Preview.module.css';

const A4_WIDTH  = 1122;
const A4_HEIGHT = 794;

/* 인쇄 순서: 기본정보 → 개별지원계획서 → 모니터링 → 회의록 */
const ALL_DOCS = [
  { key: 'basicInfo',      DocComponent: BasicInfoDoc   },
  { key: 'supportPlan',    DocComponent: SupportPlanDoc },
  { key: 'monitoring',     DocComponent: MonitoringDoc  },
  { key: 'meetingMinutes', DocComponent: MeetingDoc     },
];

const PrintAll = () => {
  const { t } = useTranslation();
  const userId = getCurrentUserId();
  const user   = getCurrentUser();

  const viewportRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [allData, setAllData] = useState({});

  /* 뷰어 너비에 맞게 A4 스케일 계산 */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => {
      const available = el.offsetWidth - 32;
      setScale(Math.min(1, available / A4_WIDTH));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* 4종 서류 데이터 로드 (_preview 스냅샷 우선, 없으면 원본) */
  useEffect(() => {
    if (!userId) return;
    const loaded = {};
    ALL_DOCS.forEach(({ key }) => {
      loaded[key] = getDocument(userId, key + '_preview') || getDocument(userId, key) || {};
    });
    setAllData(loaded);
  }, [userId]);

  const handlePrint = () => {
    let pageStyle = document.getElementById('__print_page__');
    if (!pageStyle) {
      pageStyle = document.createElement('style');
      pageStyle.id = '__print_page__';
      document.head.appendChild(pageStyle);
    }
    pageStyle.textContent = '@page { size: 297mm 210mm; margin: 0; }';
    window.print();
  };

  return (
    <div className={styles.container} data-qa="print-all-page">

      {/* 인쇄 버튼 바 */}
      <div className={styles.actions} data-qa="print-all-actions">
        <button className={styles.printBtn} onClick={handlePrint}>
          🖨 {t('preview.print')}
        </button>
      </div>

      {/* 4종 A4 페이지 — 화면에서는 스케일 축소, 인쇄 시 원본 크기 */}
      <div className={styles.a4Viewport} ref={viewportRef}>
        {ALL_DOCS.map(({ key, DocComponent }) => {
          const data = allData[key];
          return (
            <div
              key={key}
              className={styles.a4ScaleOuter}
              style={{ height: Math.ceil(A4_HEIGHT * scale), marginBottom: 16 }}
            >
              <div
                className={styles.a4ScaleInner}
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  width: A4_WIDTH,
                }}
              >
                <DocComponent data={data} user={user} writeDate={data?.writeDate} />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default PrintAll;
