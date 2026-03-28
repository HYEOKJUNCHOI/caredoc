/* Edit — 서류 타입에 따라 적절한 폼 컴포넌트로 디스패치
   - 이용자 정보 + 기입일 자동 표시 (헤더 영역)
   - 데이터 로드/저장 책임은 이 컴포넌트가 담당 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCurrentUser, getCurrentUserId, getDocument, saveDocument, getUsers, saveUsers } from '../../utils/storage';
import SupportPlanEdit from './SupportPlanEdit';
import MonitoringEdit from './MonitoringEdit';
import MeetingMinutesEdit from './MeetingMinutesEdit';
import BasicInfoEdit from './BasicInfoEdit';
import styles from './Edit.module.css';

/* 서류 타입 → 컴포넌트 매핑 */
const FORMS = {
  supportPlan: SupportPlanEdit,
  monitoring: MonitoringEdit,
  meetingMinutes: MeetingMinutesEdit,
  basicInfo: BasicInfoEdit,
};


const Edit = () => {
  const { type } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const userId = getCurrentUserId();
  const user = getCurrentUser();

  const formRef = useRef(null);
  const [formData, setFormData] = useState({});

  /* 헤더 인라인 수정 상태 */
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoValues, setInfoValues] = useState({ name: '', manager: '', writeDate: '' });
  /* 수정 후 화면 반영을 위한 로컬 유저 상태 */
  const [localUser, setLocalUser] = useState(user);

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

  /* 포커스 트랩 — 탭이 폼 안에서만 순환, 달력·브라우저 UI로 빠지면 1번으로 복귀 */
  const handleTabTrap = useCallback((e) => {
    if (e.key !== 'Tab') return;
    if (!formRef.current) return;

    /* tabIndex > 0 인 요소만 수집 */
    const focusable = Array.from(
      formRef.current.querySelectorAll('[tabindex]:not([tabindex="-1"])')
    ).sort((a, b) => a.tabIndex - b.tabIndex);

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    const active = document.activeElement;

    /* 포커스가 폼 밖(달력 UI)에 있으면 → Tab을 Esc처럼 동작시켜 달력을 닫음
       달력이 닫히면 포커스가 date input으로 돌아오고,
       다음 Tab에서 last(date input) → first(1번)로 이동 */
    if (!formRef.current.contains(active)) {
      e.preventDefault();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      /* 달력이 닫히고 date input에 포커스가 돌아올 때까지 대기 후 포커스 확보 */
      const dateInput = formRef.current.querySelector('[tabindex="12"]');
      if (dateInput) setTimeout(() => dateInput.focus(), 50);
      return;
    }

    if (e.shiftKey) {
      if (active === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  useEffect(() => {
    /* capture: true — 브라우저 네이티브 달력보다 먼저 Tab 이벤트를 잡음 */
    document.addEventListener('keydown', handleTabTrap, true);
    return () => document.removeEventListener('keydown', handleTabTrap, true);
  }, [handleTabTrap]);

  /* 포커스 이동 시 해당 요소가 화면 중앙에 오도록 스크롤 */
  useEffect(() => {
    const handleFocusIn = (e) => {
      const el = e.target;
      if (!formRef.current?.contains(el)) return;
      if (el.tabIndex <= 0) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);

  /* 헤더 수정 모드 진입 — 현재값 복사 */
  const startEditInfo = () => {
    setInfoValues({
      name: localUser?.name || '',
      manager: localUser?.manager || '',
      writeDate: formData.writeDate || todayISO,
    });
    setEditingInfo(true);
  };

  /* 헤더 수정 저장 — 유저 정보 + 서류 writeDate 업데이트 */
  const saveInfo = async () => {
    const users = getUsers();
    const updated = users.map((u) =>
      u.id === userId ? { ...u, name: infoValues.name, manager: infoValues.manager } : u
    );
    await saveUsers(updated);
    setLocalUser((prev) => ({ ...prev, name: infoValues.name, manager: infoValues.manager }));
    setFormData((prev) => ({ ...prev, writeDate: infoValues.writeDate }));
    setEditingInfo(false);
  };

  /* 개별 필드 업데이트 핸들러 — 폼 컴포넌트에 주입 */
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /* 미리보기 이동 전 저장
     - 원본(bilingual): type 키에 저장 (편집 재개용)
     - 스냅샷(현재 언어로 확정): type_preview 키에 저장 (Preview 표시용) */
  const goPreview = async () => {
    if (userId) {
      /* 테스트 모드 중에는 원본 데이터를 저장하지 않음 (재진입 시 빈 양식 유지) */
      if (!formData._testMode) {
        await saveDocument(userId, type, formData);
      }

      /* { ko, ja } 배열 필드를 현재 언어 문자열로 확정 */
      const resolveArray = (arr) =>
        (arr || []).map((p) =>
          typeof p === 'object' ? (p[lang] || p.ko || '') : p
        );

      /* 1회용 항목(oneTimeItems)을 공용 문구 배열 뒤에 합쳐서 미리보기에 반영 */
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
      await saveDocument(userId, type + '_preview', snapshot);
    }
    navigate(`/preview/${type}`);
  };

  const FormComponent = FORMS[type];
  if (!FormComponent) return <p style={{ padding: 20 }}>알 수 없는 서류 타입입니다.</p>;

  /* 자동 연동: 모니터링·회의록에서 개별지원계획서 데이터 참조 */
  const supportPlanData = getDocument(userId, 'supportPlan');

  /* 표시할 날짜 — 수정된 경우 formData.writeDate 우선, 표시용 포맷으로 변환 */
  const displayDate = formatDateDisplay(formData.writeDate);

  return (
    <div className={styles.container} data-qa="edit-page" ref={formRef}>

      {/* 이용자 정보 헤더 — 수정 토글 */}
      <div className={styles.infoHeader} data-qa="edit-info-header">
        {editingInfo ? (
          <>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('doc.userName')}</span>
              <input
                className={styles.infoInput}
                value={infoValues.name}
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
                onFocus={(e) => { try { e.target.showPicker(); } catch (_) {} }}
              />
            </div>
            <button className={styles.infoSaveBtn} onClick={saveInfo} tabIndex={-1}>저장</button>
          </>
        ) : (
          <>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('doc.userName')}</span>
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

      {/* 서류별 폼 */}
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
