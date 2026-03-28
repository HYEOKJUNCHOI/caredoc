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

/* 서류 타입 → PDF 파일명 라벨 */
const DOC_LABELS = {
  supportPlan:    '個別支援計画書',
  monitoring:     'モニタリング記録表',
  meetingMinutes: '作成会議録',
  basicInfo:      '基本情報',
};

const Preview = () => {
  const { type } = useParams();
  const { t } = useTranslation();
  const userId = getCurrentUserId();
  const user   = getCurrentUser();
  const [data, setData] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const { width: pageWidth, height: pageHeight, pageCSS } = getPageSize(type);

  const viewportRef = useRef(null);
  const innerRef    = useRef(null); /* PDF 캡처 대상 */
  const scale = usePageScale(viewportRef, pageWidth);

  useEffect(() => {
    if (!userId) return;
    setData(getDocument(userId, type + '_preview') || getDocument(userId, type));
  }, [userId, type]);

  const writeDate = data?.writeDate;

  /* ── 인쇄: 용지 크기에 맞춰 콘텐츠를 꽉 채움 ── */
  const handlePrint = () => {
    let pageStyle = document.getElementById('__print_page__');
    if (!pageStyle) {
      pageStyle = document.createElement('style');
      pageStyle.id = '__print_page__';
      document.head.appendChild(pageStyle);
    }

    /* @page size를 지정하지 않음 → 사용자가 인쇄 다이얼로그에서 선택한 용지에 맞춤 */
    pageStyle.textContent = `
      @page {
        size: landscape;
        margin: 0mm;
      }
      @media print {
        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        #print-scale-target {
          transform: none !important;
          transform-origin: top left !important;
          width: 100vw !important;
          max-width: 100vw !important;
          height: 100vh !important;
        }
        #print-scale-target > * {
          width: 100% !important;
          height: 100% !important;
        }
      }
    `;
    const fitStyle = document.getElementById('__print_fit__');
    if (fitStyle) fitStyle.remove();
    window.print();
  };

  /* ── PDF 다운로드: html2canvas → jsPDF ── */
  const handleDownloadPdf = async () => {
    if (!innerRef.current) return;
    setPdfLoading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const el = innerRef.current;

      /* 스케일 transform 일시 해제 → 원본 해상도로 캡처 */
      const prevTransform = el.style.transform;
      el.style.transform = 'none';

      const canvas = await html2canvas(el, {
        scale: 2,           /* 2× → 고해상도 */
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      el.style.transform = prevTransform;

      const isA3 = type === 'basicInfo';
      const pdf  = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: isA3 ? 'a3' : 'a4',
      });

      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);

      const nameLabel = data?.nameKanji || user?.name || 'document';
      const docLabel  = DOC_LABELS[type] || type;
      pdf.save(`${nameLabel}_${docLabel}.pdf`);
    } catch (err) {
      console.error('PDF 생성 실패:', err);
      alert('PDF 생성에 실패했습니다.');
    } finally {
      setPdfLoading(false);
    }
  };

  const DocComponent = DOC_COMPONENTS[type];

  return (
    <div className={styles.container} data-qa="preview-page">

      {/* ── 출력 버튼 바 ── */}
      <div className={styles.actions} data-qa="preview-actions">
        <button className={styles.printBtn} onClick={handlePrint}>
          🖨 {t('preview.print')}
        </button>
        <button className={styles.pdfBtn} onClick={handleDownloadPdf} disabled={pdfLoading || !data}>
          {pdfLoading ? '⏳ 생성 중...' : `📄 ${t('preview.downloadPdf')}`}
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
              id="print-scale-target"
              ref={innerRef}
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
