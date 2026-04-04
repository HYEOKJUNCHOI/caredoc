/* 미리보기 + 출력
   - 서류 타입에 따라 A4 가로 / A3 가로 자동 전환
   - 화면 너비에 맞게 scale 해서 표시 */

/*
  [컴포넌트 개요 — 면접 설명용]
  이 파일은 작성된 서류(개별지원계획서, 모니터링 등)를
  A4/A3 크기로 미리보기하고 인쇄·PDF 저장을 제공하는 페이지입니다.

  핵심 기술 포인트:
  1. Custom Hook(커스텀 훅) — usePageScale: 컨테이너 크기에 따라 서류 배율 자동 조정
  2. Dynamic Import(다이나믹 임포트) — handleDownloadPdf: 라이브러리를 필요할 때만 로드해 초기 번들 크기 축소
  3. ResizeObserver(리사이즈 옵저버) — 브라우저 내장 API로 DOM 크기 변화를 감지
  4. useMemo(유즈메모) — 불필요한 재계산을 막아 성능 최적화
  5. useRef(유즈레프) — DOM 요소에 직접 접근할 때 사용 (PDF 캡처 대상 지정)
*/

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCurrentUser, getCurrentUserId, getDocument } from '../../utils/storage';
import SupportPlanDoc from './docs/SupportPlanDoc';
import MonitoringDoc  from './docs/MonitoringDoc';
import MeetingDoc     from './docs/MeetingDoc';
import BasicInfoDoc   from './docs/BasicInfoDoc';
import styles from './Preview.module.css';

/* 서류 타입별 페이지 크기 (px @ 96dpi) */
/* basicInfo(기본정보)만 A3 가로, 나머지는 A4 가로 기본값 사용 */
const PAGE_SIZES = {
  basicInfo: { width: 1587, height: 1122, pageCSS: 'A3 landscape' }, /* A3 가로 */
};
/* DEFAULT_SIZE(디폴트사이즈): A4 가로 크기 — 지정되지 않은 서류 타입의 기본값 */
const DEFAULT_SIZE = { width: 1122, height: 794, pageCSS: '297mm 210mm' }; /* A4 가로 */
/* getPageSize(겟페이지사이즈): 타입에 맞는 크기 반환. 없으면 A4 기본값 사용 */
const getPageSize = (type) => PAGE_SIZES[type] || DEFAULT_SIZE;

/*
  [Custom Hook] usePageScale(유즈페이지스케일)
  ─ "화면에 꽉 차도록 서류를 자동으로 줄이거나 늘린다"
  ─ 왜 Custom Hook으로 분리했는가?
    → scale 계산 로직이 Preview 컴포넌트 안에 있으면 코드가 길어지고
      다른 컴포넌트에서 재사용하기 어렵기 때문에 훅으로 분리했습니다.
  ─ ResizeObserver(리사이즈 옵저버): 브라우저 내장 API.
    window.resize 이벤트와 달리 특정 DOM 요소의 크기 변화만 감지합니다.
*/
const usePageScale = (ref, pageWidth) => {
  /* useState(유즈스테이트): 배율(scale) 상태를 컴포넌트 내부에서 관리 */
  const [scale, setScale] = useState(1);
  /* useEffect(유즈이펙트): 컴포넌트가 화면에 붙은 뒤 DOM 접근이 필요할 때 사용 */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      /* 32px: 좌우 패딩 여백. 가용 너비 내에서 서류가 넘치지 않도록 제한 */
      const available = el.offsetWidth - 32;
      /* Math.min(1, ...): 화면이 서류보다 크더라도 1 이상으로 확대하지 않음 */
      setScale(Math.min(1, available / pageWidth));
    };
    update(); /* 최초 1회 즉시 실행 */
    const ro = new ResizeObserver(update); /* 컨테이너 크기 변화 감지 */
    ro.observe(el);
    /* cleanup(클린업): 컴포넌트 언마운트 시 옵저버 해제 → 메모리 누수 방지 */
    return () => ro.disconnect();
  }, [ref, pageWidth]);
  return scale;
};

/*
  DOC_COMPONENTS(닥컴포넌트스): 서류 타입 문자열 → 컴포넌트 매핑 객체
  ─ 왜 이렇게 했는가?
    → if/else나 switch 대신 객체 맵을 사용하면,
      나중에 서류 타입이 추가될 때 이 객체에만 항목을 추가하면 됩니다.
      코드를 여러 곳에서 수정할 필요가 없어 유지보수가 쉽습니다.
*/
const DOC_COMPONENTS = {
  supportPlan:    SupportPlanDoc,
  monitoring:     MonitoringDoc,
  meetingMinutes: MeetingDoc,
  basicInfo:      BasicInfoDoc,
};

/* 서류 타입 → PDF 파일명 라벨 */
/* PDF 저장 시 파일명에 일본어 문서명이 포함되도록 미리 정의 */
const DOC_LABELS = {
  supportPlan:    '個別支援計画書',
  monitoring:     'モニタリング記録表',
  meetingMinutes: '作成会議録',
  basicInfo:      '基本情報',
};

const Preview = () => {
  /* useParams(유즈패럼스): URL 경로의 :type 부분을 읽어옵니다 */
  /* 예: /preview/supportPlan → type = 'supportPlan' */
  const { type } = useParams();

  /* useTranslation(유즈트랜슬레이션): i18n 다국어 처리 훅. t('키') 형태로 번역 텍스트 반환 */
  const { t } = useTranslation();

  /* localStorage에서 현재 로그인된 사용자 정보와 ID를 가져옴 */
  const userId = getCurrentUserId();
  const user   = getCurrentUser();

  /* data(데이터): 해당 서류의 저장된 내용. null이면 "데이터 없음" 화면 표시 */
  const [data, setData] = useState(null);

  /* pdfLoading(피디에프로딩): PDF 생성 중에는 버튼을 비활성화하기 위한 상태 */
  const [pdfLoading, setPdfLoading] = useState(false);

  /* 서류 타입에 따라 페이지 크기(너비/높이/CSS 크기명) 결정 */
  const { width: pageWidth, height: pageHeight, pageCSS } = getPageSize(type);

  /* useRef(유즈레프): DOM 요소를 직접 가리키는 참조값. useState와 달리 값이 바뀌어도 리렌더 없음 */
  const viewportRef = useRef(null); /* 뷰어 전체 컨테이너 — 스케일 계산 기준 */
  const innerRef    = useRef(null); /* PDF 캡처 대상 — html2canvas가 이 요소를 이미지로 변환 */

  /* Custom Hook 호출: 뷰어 너비 변화에 따른 배율 자동 계산 */
  const scale = usePageScale(viewportRef, pageWidth);

  /* 컴포넌트 마운트 시, 또는 userId/type이 바뀔 때 저장된 서류 데이터 로드 */
  useEffect(() => {
    if (!userId) return;
    /* '_preview' 접미사가 붙은 미리보기 전용 스냅샷을 우선 로드,
       없으면 원본 데이터를 폴백(fallback)으로 사용 */
    setData(getDocument(userId, type + '_preview') || getDocument(userId, type));
  }, [userId, type]);

  /* writeDate(라이트데이트): 서류 기입 날짜. 각 Doc 컴포넌트에 내려보냄 */
  const writeDate = data?.writeDate;

  /* ── 인쇄: 용지 크기에 맞춰 콘텐츠를 꽉 채움 ── */
  /*
    handlePrint(핸들프린트): 브라우저 기본 인쇄 기능 활용
    ─ 왜 동적으로 <style> 태그를 생성하는가?
      → CSS 파일에 @page 규칙을 고정으로 쓰면 모든 페이지에 영향을 미치기 때문에,
        인쇄 직전에만 스타일을 주입하고 인쇄 후에는 제거하는 방식을 사용합니다.
  */
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
  /*
    handleDownloadPdf(핸들다운로드피디에프): DOM을 이미지로 캡처해 PDF로 저장
    ─ Dynamic Import(다이나믹 임포트) 사용 이유:
      html2canvas와 jsPDF는 용량이 큰 라이브러리입니다.
      페이지 첫 로딩 시가 아니라, 버튼 클릭 시에만 로드해서
      초기 로딩 속도를 빠르게 유지합니다. (코드 스플리팅 패턴)
    ─ Promise.all(프로미스올): 두 라이브러리를 동시에 병렬로 로드해 대기 시간 단축
    ─ async/await(어싱크/어웨이트): 비동기 작업을 동기처럼 읽히게 만드는 문법
  */
  const handleDownloadPdf = async () => {
    if (!innerRef.current) return;
    setPdfLoading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const el = innerRef.current;

      /* 스케일 transform 일시 해제 → 원본 해상도로 캡처
         이유: transform: scale()이 적용된 채 캡처하면 해상도가 낮아질 수 있음 */
      const prevTransform = el.style.transform;
      el.style.transform = 'none';

      /* html2canvas(에이치티엠엘투캔버스): HTML 요소를 canvas(이미지)로 렌더링하는 라이브러리 */
      const canvas = await html2canvas(el, {
        scale: 2,           /* 2× → 고해상도 (Retina 화면 대응) */
        useCORS: true,      /* CORS(코르스): 외부 이미지 허용 */
        logging: false,     /* 콘솔 로그 비활성화 */
        backgroundColor: '#ffffff',
      });

      /* 캡처 완료 후 원래 transform 복원 */
      el.style.transform = prevTransform;

      /* jsPDF(제이에스피디에프): JavaScript로 PDF를 생성하는 라이브러리 */
      const isA3 = type === 'basicInfo';
      const pdf  = new jsPDF({
        orientation: 'landscape', /* landscape(랜드스케이프): 가로 방향 */
        unit: 'mm',
        format: isA3 ? 'a3' : 'a4',
      });

      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      /* toDataURL(투데이터유알엘): canvas를 base64 인코딩된 이미지 문자열로 변환 */
      const imgData = canvas.toDataURL('image/jpeg', 0.95); /* 0.95: 95% 품질 */
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);

      /* 파일명 = 이용자 이름 + 문서명 조합 */
      const nameLabel = data?.nameKanji || user?.name || 'document';
      const docLabel  = DOC_LABELS[type] || type;
      pdf.save(`${nameLabel}_${docLabel}.pdf`);
    } catch (err) {
      console.error('PDF 생성 실패:', err);
      alert('PDF 생성에 실패했습니다.');
    } finally {
      /* finally(파이널리): 성공·실패 관계없이 반드시 실행. 로딩 상태 해제에 사용 */
      setPdfLoading(false);
    }
  };

  /* DOC_COMPONENTS 맵에서 현재 타입에 해당하는 컴포넌트를 꺼냄 */
  /* 없는 타입이면 undefined → 조건부 렌더링으로 "데이터 없음" 표시 */
  const DocComponent = DOC_COMPONENTS[type];

  /*
    isMobile(이즈모바일): 모바일 기기 여부 판단
    ─ useMemo(유즈메모) 사용 이유:
      → navigator.userAgent와 window.innerWidth는 렌더링마다 다시 읽을 필요가 없습니다.
        useMemo로 감싸면 의존성([])이 변하지 않는 한 한 번만 계산하고 캐싱합니다.
    ─ UA(유저에이전트) 문자열 + 화면 너비 1024px 기준을 병행 사용한 이유:
      → UA 우회 또는 데스크탑에서 창을 좁힌 경우를 모두 커버하기 위함
  */
  const isMobile = useMemo(() =>
    /iPhone|iPad|Android/i.test(navigator.userAgent) || window.innerWidth < 1024
  , []);

  return (
    <div className={styles.container} data-qa="preview-page">

      {/* ── 출력 버튼 바 ── */}
      <div className={styles.actions} data-qa="preview-actions">
        {/* 모바일에서는 인쇄 버튼 숨김 — 모바일 브라우저의 인쇄 기능이 불안정하기 때문 */}
        {!isMobile && (
          <button className={styles.printBtn} onClick={handlePrint}>
            🖨 {t('preview.print')}
          </button>
        )}
        {/* disabled(디세이블드): data가 없거나 PDF 생성 중일 때 버튼 비활성화 */}
        <button className={styles.pdfBtn} onClick={handleDownloadPdf} disabled={pdfLoading || !data}>
          {pdfLoading ? '⏳ 생성 중...' : `📄 ${t('preview.downloadPdf')}`}
        </button>
        {/* 모바일에서는 인쇄 버튼 대신 PDF 저장 안내 텍스트 표시 */}
        {isMobile && (
          <span style={{ fontSize: '11px', color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
            📄 → 🖨 {t('preview.mobilePdfHint')}
          </span>
        )}
      </div>

      {/* 뷰어 영역 */}
      <div className={styles.a4Viewport} ref={viewportRef}>
        {/* data와 DocComponent가 모두 있을 때만 서류를 렌더링 — 조건부 렌더링 패턴 */}
        {data && DocComponent ? (
          <div
            className={styles.a4ScaleOuter}
            /* scale에 따라 외부 컨테이너 높이를 동적으로 계산
               이유: transform: scale()은 실제 레이아웃 공간을 바꾸지 않으므로
               수동으로 높이를 맞춰줘야 뷰어가 잘려 보이지 않음 */
            style={{ height: Math.ceil(pageHeight * scale) }}
          >
            <div
              id="print-scale-target"
              ref={innerRef}
              className={styles.a4ScaleInner}
              style={{
                /* transform: scale() — 서류 원본 크기 유지하면서 화면에 맞게 축소 표시 */
                transform: `scale(${scale})`,
                transformOrigin: 'top left', /* 좌상단 기준으로 축소 */
                width: pageWidth,            /* 서류 원본 너비 고정 */
              }}
            >
              {/* DocComponent: 타입에 따라 동적으로 결정된 서류 컴포넌트 렌더링 */}
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
