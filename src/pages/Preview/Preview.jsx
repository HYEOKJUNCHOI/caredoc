/* 미리보기 + 출력
   - 서류 타입에 따라 A4 가로 / A3 가로 자동 전환
   - 화면 너비에 맞게 scale 해서 표시 */

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCurrentUser, getCurrentUserId, getDocument } from '../../utils/storage';
import SupportPlanDoc from './docs/SupportPlanDoc';
import MonitoringDoc  from './docs/MonitoringDoc';
import MeetingDoc     from './docs/MeetingDoc';
import BasicInfoDoc   from './docs/BasicInfoDoc';
import styles from './Preview.module.css';

/* 서류 타입별 페이지 크기 (px @ 96dpi) */
const PAGE_SIZES = {
  basicInfo: { width: 1587, height: 1122, pageCSS: 'A3 landscape' }, /* A3 가로 */
};
const DEFAULT_SIZE = { width: 1122, height: 794, pageCSS: '297mm 210mm' }; /* A4 가로 */
const getPageSize = (type) => PAGE_SIZES[type] || DEFAULT_SIZE;

/* 컨테이너 너비 변화에 따라 스케일 계산 */
const usePageScale = (ref, pageWidth) => {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const available = el.offsetWidth - 32;
      setScale(Math.min(1, available / pageWidth));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, pageWidth]);
  return scale;
};

const DOC_COMPONENTS = {
  supportPlan:    SupportPlanDoc,
  monitoring:     MonitoringDoc,
  meetingMinutes: MeetingDoc,
  basicInfo:      BasicInfoDoc,
};

const Preview = () => {
  const { type } = useParams();
  const { t } = useTranslation();
  const userId = getCurrentUserId();
  const user   = getCurrentUser();
  const [data, setData] = useState(null);

  const { width: pageWidth, height: pageHeight, pageCSS } = getPageSize(type);

  const viewportRef = useRef(null);
  const scale = usePageScale(viewportRef, pageWidth);

  useEffect(() => {
    if (!userId) return;
    setData(getDocument(userId, type + '_preview') || getDocument(userId, type));
  }, [userId, type]);

  const writeDate = data?.writeDate;

  /* A4/A3 페이지 DOM 요소 가져오기 */
  const getA4El = () => document.querySelector('[data-a4-page]');

  /* ── 인쇄: 타입별 페이지 크기 강제 + 넘침 시 자동 스케일 ── */
  const handlePrint = () => {
    const el = getA4El();

    let pageStyle = document.getElementById('__print_page__');
    if (!pageStyle) {
      pageStyle = document.createElement('style');
      pageStyle.id = '__print_page__';
      document.head.appendChild(pageStyle);
    }
    pageStyle.textContent = `@page { size: ${pageCSS}; margin: 0; }`;

    /* 내용이 페이지 높이 초과 시 zoom으로 1페이지 맞춤 */
    if (el && el.scrollHeight > pageHeight) {
      const zoom = ((pageHeight / el.scrollHeight) * 100).toFixed(1);
      let fitStyle = document.getElementById('__print_fit__');
      if (!fitStyle) {
        fitStyle = document.createElement('style');
        fitStyle.id = '__print_fit__';
        document.head.appendChild(fitStyle);
      }
      fitStyle.textContent = `@media print { [data-a4-page] { zoom: ${zoom}% !important; } }`;
    }

    window.print();
  };

  const DocComponent = DOC_COMPONENTS[type];

  return (
    <div className={styles.container} data-qa="preview-page">

      {/* ── 출력 버튼 바 ── */}
      <div className={styles.actions} data-qa="preview-actions">
        <button className={styles.printBtn} onClick={handlePrint}>
          🖨 {t('preview.print')}
        </button>
      </div>

      {/* 뷰어 영역 */}
      <div className={styles.a4Viewport} ref={viewportRef}>
        {data && DocComponent ? (
          <div
            className={styles.a4ScaleOuter}
            style={{ height: Math.ceil(pageHeight * scale) }}
          >
            <div
              className={styles.a4ScaleInner}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: pageWidth,
              }}
            >
              <DocComponent data={data} user={user} writeDate={writeDate} />
            </div>
          </div>
        ) : (
          <p className={styles.empty}>작성된 데이터가 없습니다.</p>
        )}
      </div>

    </div>
  );
};

export default Preview;
