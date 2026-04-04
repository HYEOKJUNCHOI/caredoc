/* Edit — 서류 타입에 따라 적절한 폼 컴포넌트로 디스패치
   - 이용자 정보 + 기입일 자동 표시 (헤더 영역)
   - 데이터 로드/저장 책임은 이 컴포넌트가 담당 */

/*
  ────────────────────────────────────────────────────────
  [면접 설명 포인트] 이 컴포넌트의 역할
  ────────────────────────────────────────────────────────
  - Edit는 "라우터 허브" 역할을 한다.
  - URL 파라미터(type)를 보고 알맞은 폼 컴포넌트를 골라 렌더링한다.
  - 모든 서류 타입이 공유하는 헤더(이용자 정보, 기입일)와
    미리보기 버튼도 이 컴포넌트가 관리한다.
  - 데이터 로드/저장의 진입점이기도 하다.
  ────────────────────────────────────────────────────────
*/

/* useState(유즈스테이트): 컴포넌트 내부 상태를 선언하는 리액트 훅 */
/* useEffect(유즈이펙트): 렌더링 이후 사이드이펙트(외부 데이터 로드, 이벤트 등록)를 실행하는 훅 */
/* useRef(유즈레프): DOM 요소나 변경되어도 리렌더링을 유발하지 않는 값을 저장할 때 쓰는 훅 */
/* useCallback(유즈콜백): 함수를 메모이제이션하여 불필요한 재생성을 막는 훅 */
import { useState, useEffect, useRef, useCallback } from 'react';

/* useParams(유즈파람즈): URL의 :type 같은 동적 세그먼트 값을 읽는 훅 */
/* useNavigate(유즈내비게이트): 코드로 페이지를 이동시키는 훅 */
import { useParams, useNavigate } from 'react-router-dom';

/* useTranslation(유즈트랜슬레이션): i18next 다국어 번역 훅 — t('key')로 번역 문자열을 가져온다 */
import { useTranslation } from 'react-i18next';

/* storage 유틸: localStorage를 추상화한 커스텀 함수 모음 */
import { getCurrentUser, getCurrentUserId, getDocument, saveDocument, getUsers, saveUsers } from '../../utils/storage';

/* 서류별 폼 컴포넌트 import */
import SupportPlanEdit from './SupportPlanEdit';
import MonitoringEdit from './MonitoringEdit';
import MeetingMinutesEdit from './MeetingMinutesEdit';
import BasicInfoEdit from './BasicInfoEdit';

/* CSS Modules(씨에스에스 모듈): className이 자동으로 고유해져서 스타일 충돌을 막는 방식 */
import styles from './Edit.module.css';

/* ────────────────────────────────────────────────────────
   [패턴] 전략 패턴(Strategy Pattern) — 타입 키로 컴포넌트를 선택
   URL의 :type 값이 키가 되어 실행할 컴포넌트를 동적으로 결정한다.
   if/else 분기 없이 객체 조회만으로 처리하는 것이 핵심.
   ──────────────────────────────────────────────────────── */
/* 서류 타입 → 컴포넌트 매핑 */
const FORMS = {
  supportPlan: SupportPlanEdit,
  monitoring: MonitoringEdit,
  meetingMinutes: MeetingMinutesEdit,
  basicInfo: BasicInfoEdit,
};


const Edit = () => {
  /* useParams(유즈파람즈): URL 경로의 :type 부분을 꺼낸다 — 예: /edit/monitoring → type = 'monitoring' */
  const { type } = useParams();

  /* i18n(아이에이틴엔): Internationalization의 약자. 다국어 지원 라이브러리 객체 */
  /* lang: 현재 언어 코드 — 'ko' 또는 'ja' */
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  /* navigate(내비게이트): 버튼 클릭 시 코드로 페이지를 이동시키는 함수 */
  const navigate = useNavigate();

  /* 현재 로그인한 사용자 ID와 사용자 객체를 스토리지에서 불러온다 */
  const userId = getCurrentUserId();
  const user = getCurrentUser();

  /* formRef(폼레프): 폼 DOM 전체를 참조하기 위한 ref. 포커스 트랩에 활용된다 */
  const formRef = useRef(null);

  /* formData(폼데이터): 현재 편집 중인 서류 데이터 전체를 담는 상태 */
  const [formData, setFormData] = useState({});

  /* 헤더 인라인 수정 상태 */
  /* editingInfo: 헤더가 '읽기 모드'인지 '편집 모드'인지 나타내는 boolean 상태 */
  const [editingInfo, setEditingInfo] = useState(false);

  /* infoValues: 헤더 편집 모드에서 임시로 보관하는 값 — 저장 전까지 formData에 반영하지 않는다 */
  const [infoValues, setInfoValues] = useState({ name: '', manager: '', writeDate: '' });

  /* localUser: 헤더 수정 후 즉시 화면에 반영하기 위한 로컬 복사본 상태
     — 저장 전에는 서버/스토리지와 다를 수 있다 (Optimistic UI와 유사한 패턴) */
  const [localUser, setLocalUser] = useState(user);

  /* ────────────────────────────────────────────────────────
     날짜 처리:
     - todayISO: 저장용 포맷 (YYYY-MM-DD) — input type="date"의 value에 사용
     - today: 표시용 포맷 (2026. 03. 21) — 화면에 보여줄 때 사용
     ──────────────────────────────────────────────────────── */
  /* 오늘 날짜 — ISO(YYYY-MM-DD)와 표시용(2026. 03. 21) 두 가지 */
  const todayISO = new Date().toISOString().split('T')[0];
  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).replace(/\//g, '. ');

  /* YYYY-MM-DD → 2026. 03. 21 표시용 변환 */
  const formatDateDisplay = (iso) => {
    if (!iso) return today;
    if (iso.includes('-')) {
      const [y, m, d] = iso.split('-');
      return `${y}. ${m}. ${d}`;
    }
    return iso;
  };

  /* ────────────────────────────────────────────────────────
     [패턴] useEffect로 초기 데이터 로드
     - 의존성 배열 [userId, type]: userId나 type이 바뀔 때마다 재실행
     - _testMode 플래그: 테스트 데이터는 스토리지에서 무시하여 빈 폼 유지
     ──────────────────────────────────────────────────────── */
  /* 마운트 시 저장된 서류 데이터 로드
     — _testMode가 true로 저장된 데이터는 테스트 데이터이므로 무시 */
  useEffect(() => {
    if (!userId) return;
    const saved = getDocument(userId, type);
    if (saved && !saved._testMode) {
      setFormData(saved);
    } else if (type === 'basicInfo') {
      /* 이용자 등록 데이터 자동 연동 — 이름만 초기값으로 설정 */
      setFormData({ nameKanji: user?.name || '' });
    }
  }, [userId, type]);

  /* ────────────────────────────────────────────────────────
     [패턴] 포커스 트랩(Focus Trap)
     - 접근성(Accessibility) 향상 기법
     - Tab 키가 폼 안에서만 순환하도록 강제한다
     - 브라우저 달력 UI로 포커스가 빠져나가면 자동으로 복귀시킨다
     - useCallback: 이 함수는 이벤트 리스너로 등록되므로,
       불필요한 재생성을 막기 위해 useCallback으로 감싼다
     ──────────────────────────────────────────────────────── */
  /* 포커스 트랩 — 탭이 폼 안에서만 순환, 달력·브라우저 UI로 빠지면 1번으로 복귀 */
  const handleTabTrap = useCallback((e) => {
    if (e.key !== 'Tab') return;
    if (!formRef.current) return;

    /* tabIndex > 0 인 요소만 수집 — querySelectorAll로 탭 순서 대상 요소를 찾는다 */
    const focusable = Array.from(
      formRef.current.querySelectorAll('[tabindex]:not([tabindex="-1"])')
    ).sort((a, b) => a.tabIndex - b.tabIndex);

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    const active = document.activeElement; /* 현재 포커스된 DOM 요소 */

    /* 포커스가 폼 밖(달력 UI)에 있으면 → Tab을 Esc처럼 동작시켜 달력을 닫음
       달력이 닫히면 포커스가 date input으로 돌아오고,
       다음 Tab에서 last(date input) → first(1번)로 이동 */
    if (!formRef.current.contains(active)) {
      e.preventDefault();
      /* dispatchEvent(디스패치이벤트): 코드로 직접 이벤트를 발생시키는 DOM API */
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      /* 달력이 닫히고 date input에 포커스가 돌아올 때까지 대기 후 포커스 확보 */
      const dateInput = formRef.current.querySelector('[tabindex="12"]');
      if (dateInput) setTimeout(() => dateInput.focus(), 50);
      return;
    }

    /* Shift+Tab: 역방향 이동 — 첫 번째에서 더 앞으로 가면 마지막으로 순환 */
    if (e.shiftKey) {
      if (active === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      /* Tab: 정방향 이동 — 마지막에서 더 가면 첫 번째로 순환 */
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  useEffect(() => {
    /* capture: true(캡처 트루) — 브라우저 네이티브 달력보다 먼저 Tab 이벤트를 잡는다
       이벤트 캡처링(Capturing) 단계에서 가로채는 것이 핵심 */
    document.addEventListener('keydown', handleTabTrap, true);
    /* cleanup(클린업): 컴포넌트가 언마운트될 때 이벤트 리스너를 제거해 메모리 누수를 막는다 */
    return () => document.removeEventListener('keydown', handleTabTrap, true);
  }, [handleTabTrap]);

  /* ────────────────────────────────────────────────────────
     [패턴] 포커스 이동 시 스크롤 자동 조정
     - scrollIntoView(스크롤인투뷰): 포커스된 요소가 화면 안에 보이도록 자동 스크롤
     - block: 'center': 요소를 화면 수직 중앙에 맞춘다
     ──────────────────────────────────────────────────────── */
  /* 포커스 이동 시 해당 요소가 화면 중앙에 오도록 스크롤 */
  useEffect(() => {
    const handleFocusIn = (e) => {
      const el = e.target;
      if (!formRef.current?.contains(el)) return;
      if (el.tabIndex <= 0) return;
      /* smooth(스무스): 부드러운 애니메이션 스크롤 */
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    /* focusin(포커스인): focus와 달리 버블링이 되어 부모 요소에서도 감지 가능 */
    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);

  /* 헤더 수정 모드 진입 — 현재값을 infoValues에 복사하여 편집 모드 시작 */
  const startEditInfo = () => {
    setInfoValues({
      name: localUser?.name || '',
      manager: localUser?.manager || '',
      writeDate: formData.writeDate || todayISO,
    });
    setEditingInfo(true);
  };

  /* ────────────────────────────────────────────────────────
     헤더 수정 저장 흐름:
     1. 스토리지의 전체 사용자 목록을 가져온다
     2. 현재 사용자만 이름·담당자를 업데이트한 새 배열을 만든다 (map으로 불변 처리)
     3. 스토리지에 저장 후 localUser, formData 상태를 갱신
     async/await(어싱크/어웨이트): 비동기 저장 함수를 기다린 후 다음 작업을 실행
     ──────────────────────────────────────────────────────── */
  /* 헤더 수정 저장 — 유저 정보 + 서류 writeDate 업데이트 */
  const saveInfo = async () => {
    const users = getUsers();
    /* map으로 불변(Immutable) 업데이트 — 원본 배열을 직접 수정하지 않는다 */
    const updated = users.map((u) =>
      u.id === userId ? { ...u, name: infoValues.name, manager: infoValues.manager } : u
    );
    await saveUsers(updated);
    /* 함수형 업데이트: prev를 받아 새 객체를 반환 — 최신 상태를 기반으로 안전하게 갱신 */
    setLocalUser((prev) => ({ ...prev, name: infoValues.name, manager: infoValues.manager }));
    setFormData((prev) => ({ ...prev, writeDate: infoValues.writeDate }));
    setEditingInfo(false);
  };

  /* ────────────────────────────────────────────────────────
     [패턴] Controlled Input(컨트롤드 인풋)
     - handleChange를 모든 폼 자식에 주입(Props Drilling)
     - 자식은 onChange를 호출하고, 부모가 상태를 단일 관리한다
     - [field]: value → 동적 키(computed property) 문법으로 필드명을 변수로 사용
     ──────────────────────────────────────────────────────── */
  /* 개별 필드 업데이트 핸들러 — 폼 컴포넌트에 주입 */
  const handleChange = (field, value) => {
    /* 스프레드 연산자(...)로 기존 상태를 복사 후, 해당 필드만 덮어쓴다 */
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /* ────────────────────────────────────────────────────────
     [패턴] 미리보기 전 스냅샷(Snapshot) 저장
     - 원본(bilingual): type 키에 저장 → 나중에 편집 재개 시 사용
     - 스냅샷(단일 언어로 확정): type_preview 키에 저장 → Preview 페이지에서 표시
     - bilingual(바이링구얼): 한국어·일본어 두 가지를 모두 가진 { ko, ja } 객체
     ──────────────────────────────────────────────────────── */
  /* 미리보기 이동 전 저장
     - 원본(bilingual): type 키에 저장 (편집 재개용)
     - 스냅샷(현재 언어로 확정): type_preview 키에 저장 (Preview 표시용) */
  const goPreview = async () => {
    if (userId) {
      /* 테스트 모드 중에는 원본 데이터를 저장하지 않음 (재진입 시 빈 양식 유지) */
      if (!formData._testMode) {
        await saveDocument(userId, type, formData);
      }

      /* { ko, ja } 배열 필드를 현재 언어 문자열로 확정
         — 미리보기는 단일 언어만 표시하므로 이 시점에 언어를 고정한다 */
      const resolveArray = (arr) =>
        (arr || []).map((p) =>
          typeof p === 'object' ? (p[lang] || p.ko || '') : p
        );

      /* 1회용 항목(oneTimeItems)을 공용 문구 배열 뒤에 합쳐서 미리보기에 반영
         — 스프레드(...) 로 두 배열을 병합 */
      const snapshot = {
        ...formData,
        writeDate:      formData.writeDate || todayISO,
        shortTermGoals: [
          ...resolveArray(formData.shortTermGoals),
          ...(formData.shortTermGoalItems || []),
        ],
        supportContent: [
          ...resolveArray(formData.supportContent),
          ...(formData.supportContentItems || []),
        ],
      };
      /* type + '_preview' 키로 저장 — 예: 'supportPlan_preview' */
      await saveDocument(userId, type + '_preview', snapshot);
    }
    /* navigate(내비게이트): /preview/supportPlan 등 미리보기 페이지로 이동 */
    navigate(`/preview/${type}`);
  };

  /* FORMS 객체에서 타입에 맞는 컴포넌트를 꺼낸다 — 없으면 에러 메시지 표시 */
  const FormComponent = FORMS[type];
  if (!FormComponent) return <p style={{ padding: 20 }}>알 수 없는 서류 타입입니다.</p>;

  /* 자동 연동: 모니터링·회의록에서 개별지원계획서 데이터 참조
     — supportPlanData를 자식 컴포넌트에 prop으로 내려준다 */
  const supportPlanData = getDocument(userId, 'supportPlan');

  /* 표시할 날짜 — 수정된 경우 formData.writeDate 우선, 표시용 포맷으로 변환 */
  const displayDate = formatDateDisplay(formData.writeDate);

  return (
    /* data-qa(데이터큐에이): 개발자 도구에서 컴포넌트 위치를 빠르게 찾기 위한 식별자 */
    <div className={styles.container} data-qa="edit-page" ref={formRef}>

      {/* 이용자 정보 헤더 — 수정 토글
          조건부 렌더링: editingInfo가 true면 입력 폼, false면 읽기 텍스트 표시 */}
      <div className={styles.infoHeader} data-qa="edit-info-header">
        {editingInfo ? (
          /* 편집 모드: input 요소로 이름/담당자/기입일 수정 가능 */
          <>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('doc.userName')}</span>
              <input
                className={styles.infoInput}
                value={infoValues.name}
                /* 화살표 함수로 prev 스프레드 후 name만 교체 */
                onChange={(e) => setInfoValues((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('doc.writerName')}</span>
              <input
                className={styles.infoInput}
                value={infoValues.manager}
                onChange={(e) => setInfoValues((p) => ({ ...p, manager: e.target.value }))}
              />
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('doc.writeDate')}</span>
              <input
                className={styles.infoInput}
                type="date"
                lang={lang}
                placeholder={lang === 'ja' ? '年-月-日' : '연도-월-일'}
                value={infoValues.writeDate}
                onChange={(e) => setInfoValues((p) => ({ ...p, writeDate: e.target.value }))}
                /* showPicker(쇼피커): 날짜 피커(달력 UI)를 코드로 강제 오픈 */
                onFocus={(e) => { try { e.target.showPicker(); } catch (_) {} }}
              />
            </div>
            {/* tabIndex={-1}: 탭 키 이동 대상에서 제외 — 헤더 버튼은 폼 탭 순환에 포함하지 않는다 */}
            <button className={styles.infoSaveBtn} onClick={saveInfo} tabIndex={-1}>저장</button>
          </>
        ) : (
          /* 읽기 모드: 저장된 값을 텍스트로 표시 */
          <>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('doc.userName')}</span>
              {/* 옵셔널 체이닝(?.) + nullish 병합(||): 값이 없으면 '—' 표시 */}
              <span className={styles.infoValue}>{localUser?.name || '—'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('doc.writerName')}</span>
              <span className={styles.infoValue}>{localUser?.manager || '—'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('doc.writeDate')}</span>
              <span className={styles.infoValue}>{displayDate}</span>
            </div>
            <button className={styles.infoEditBtn} onClick={startEditInfo} tabIndex={-1}>수정</button>
          </>
        )}
      </div>

      {/* 서류별 폼 — 동적 컴포넌트 렌더링
          FormComponent가 SupportPlanEdit / MonitoringEdit / MeetingMinutesEdit 중 하나가 된다
          data, onChange, supportPlanData를 props로 내려준다 */}
      <FormComponent
        data={formData}
        onChange={handleChange}
        supportPlanData={supportPlanData}
      />

      {/* 미리보기 버튼 — 하단 고정 */}
      <div className={styles.actions} data-qa="edit-actions">
        <button className={styles.previewBtn} onClick={goPreview} tabIndex={13}>
          {t('edit.preview')}
        </button>
      </div>
    </div>
  );
};

export default Edit;
