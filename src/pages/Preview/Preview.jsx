/* 미리보기 + 출력
   - A4 가로 양식을 화면 너비에 맞게 scale 해서 표시
   - 프린트 출력 버튼 */

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCurrentUser, getCurrentUserId, getDocument } from '../../utils/storage';
import SupportPlanDoc from './docs/SupportPlanDoc';
import MonitoringDoc  from './docs/MonitoringDoc';
import MeetingDoc     from './docs/MeetingDoc';
import BasicInfoDoc   from './docs/BasicInfoDoc';
import styles from './Preview.module.css';

/* A4 가로 기준 너비/높이 (px, 96dpi) */
const A4_WIDTH  = 1122;
const A4_HEIGHT = 794;

/* 컨테이너 너비 변화에 따라 A4 스케일 계산 */
const useA4Scale = (ref) => {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const available = el.offsetWidth - 32;
      setScale(Math.min(1, available / A4_WIDTH));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
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

  const viewportRef = useRef(null);
  const scale = useA4Scale(viewportRef);

  useEffect(() => {
    if (!userId) return;
    setData(getDocument(userId, type + '_preview') || getDocument(userId, type));
  }, [userId, type]);

  const writeDate = data?.writeDate;

  /* A4 페이지 DOM 요소 가져오기 */
  const getA4El = () => document.querySelector('[data-a4-page]');

  /* ── 인쇄: A4 가로 강제 + 1페이지 자동 스케일 ── */
  const handlePrint = () => {
    const el = getA4El();

    /* @page 직접 주입 — CSS Modules 로딩 타이밍 불일치 방지 */
    let pageStyle = document.getElementById('__print_page__');
    if (!pageStyle) {
      pageStyle = document.createElement('style');
      pageStyle.id = '__print_page__';
      document.head.appendChild(pageStyle);
    }
    /* 297mm × 210mm 로 직접 명시 — "A4 landscape" 키워드는 Chrome에서 무시될 수 있음 */
    pageStyle.textContent = '@page { size: 297mm 210mm; margin: 0; }';

    /* 내용이 794px 초과 시 zoom으로 1페이지 맞춤 */
    if (el && el.scrollHeight > A4_HEIGHT) {
      const zoom = ((A4_HEIGHT / el.scrollHeight) * 100).toFixed(1);
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

      {/* A4 뷰어 영역 */}
      <div className={styles.a4Viewport} ref={viewportRef}>
        {data && DocComponent ? (
          <div
            className={styles.a4ScaleOuter}
            style={{ height: Math.ceil(A4_HEIGHT * scale) }}
          >
            <div
              className={styles.a4ScaleInner}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: A4_WIDTH,
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
