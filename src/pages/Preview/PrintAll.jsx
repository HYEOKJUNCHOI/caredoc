/* 전체 인쇄 — 기본정보·개별지원계획서·모니터링·회의록 4종 한 번에 인쇄 */

import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getCurrentUser, getCurrentUserId, getDocument } from '../../utils/storage';
import BasicInfoDoc   from './docs/BasicInfoDoc';
import SupportPlanDoc from './docs/SupportPlanDoc';
import MonitoringDoc  from './docs/MonitoringDoc';
import MeetingDoc     from './docs/MeetingDoc';
import styles from './Preview.module.css';

/* 서류 타입별 페이지 크기 */
const PAGE_SIZES = {
  basicInfo: { width: 1587, height: 1122, pageCSS: '420mm 297mm' },
};
const DEFAULT_SIZE = { width: 1122, height: 794, pageCSS: '297mm 210mm' };
const getPageSize = (key) => PAGE_SIZES[key] || DEFAULT_SIZE;

/* 인쇄 순서: 기본정보(A3) → 개별지원계획서(A4) → 모니터링(A4) → 회의록(A4) */
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

  /* 뷰어 너비에 맞게 스케일 계산 (가장 넓은 페이지 기준 = basicInfo A3) */
  const maxWidth = Math.max(...ALL_DOCS.map(({ key }) => getPageSize(key).width));
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => {
      const available = el.offsetWidth - 32;
      setScale(Math.min(1, available / maxWidth));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxWidth]);

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
    /* 전체 인쇄 시 각 페이지마다 @page 크기가 다를 수 없으므로
       basicInfo가 포함된 경우 A3를 기본으로 설정하고
       A4 문서는 자체 CSS @page(297mm 210mm)로 덮어씀 */
    let pageStyle = document.getElementById('__print_page__');
    if (!pageStyle) {
      pageStyle = document.createElement('style');
      pageStyle.id = '__print_page__';
      document.head.appendChild(pageStyle);
    }
    /* 각 문서의 @page CSS가 BasicInfo.module.css / A4.module.css에 정의돼 있으므로
       여기서는 기본값만 지정 (브라우저가 각 문서의 CSS를 우선 적용) */
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
          const { width: pw, height: ph } = getPageSize(key);
          return (
            <div
              key={key}
              className={styles.a4ScaleOuter}
              style={{ height: Math.ceil(ph * scale), marginBottom: 16 }}
            >
              <div
                className={styles.a4ScaleInner}
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  width: pw,
                }}
              >
                <DocComponent data={data || {}} user={user} writeDate={data?.writeDate} />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default PrintAll;
