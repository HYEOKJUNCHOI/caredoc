/* 개별지원계획서 작성 폼
   구조:
   1. 본인(가족) 의향·니즈 → 자유 입력
   2. 장기목표 → 자유 입력
   3. 단기목표 + 구체적 지원내용 → 문구 선택 버튼 + 1회용 칩 입력
   4. 특기사항 → 체크박스 4항목
   5. 동의 일자 / 서명 → 날짜 피커 (기본값: 오늘) + 서명은 탭 제외 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getMergedPhrases, getItem, setItem, hidePhrase } from '../../utils/storage';
import defaultPhrases from '../../data/phrases';
import styles from './Edit.module.css';

const isDefaultPhrase = (cat, item) =>
  defaultPhrases[cat]?.some((d) => d.ko === item.ko && d.ja === item.ja);


const getTodayString = () => new Date().toISOString().split('T')[0];

const CIRCLE_NUMS = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳'];

/* field → data key 매핑 헬퍼 */
const oneTimeKey = (field) =>
  field === 'shortTermGoals' ? 'shortTermGoalItems' : 'supportContentItems';

const SupportPlanEdit = ({ data, onChange }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isJa = lang === 'ja';
  const needsRef    = useRef(null);
  const longTermRef = useRef(null);

  /* 테스트 데이터 토글 상태 */
  const [testMode,    setTestMode]    = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  const fillTestData = () => {
    onChange('needs',        '安心して生活できる環境の中で、健康を維持しながら穏やかに暮らしたい。体調の変化があった時に適切な支援を受けたい。');
    onChange('longTermGoal', '心身の健康を維持しながら、グループホームでの安定した生活を継続できるよう支援する。');
    onChange('shortTermGoals', [
      { ko: '다치지 않도록 조심하며 생활한다', ja: 'けがをしないように気をつけて生活する' },
      { ko: '건강 상태 변화에 주의하며 생활한다', ja: '体調の変化に気をつけて生活する' },
      { ko: '평온하게 생활한다', ja: 'おだやかに生活をする' },
    ]);
    onChange('supportContent', [
      { ko: '야간 정시 안전 확인 실시 (에어컨·침구 조정 등)', ja: '夜間定時見守りを行います（エアコン、寝具の調整等）' },
      { ko: '병원 연락 및 조정 지원', ja: '病院との連携や調整の支援' },
      { ko: '복약 관리 지원', ja: '服薬管理の支援' },
    ]);
    onChange('shortTermGoalItems', '');
    onChange('supportContentItems', '');
    onChange('specialNotes', [true, true, true, true]);
    onChange('consentDate', getTodayString());
    onChange('consentSign', '');
  };

  const clearTestData = () => {
    ['needs', 'longTermGoal', 'shortTermGoalItems', 'supportContentItems', 'consentSign'].forEach(f => onChange(f, ''));
    onChange('shortTermGoals', []);
    onChange('supportContent', []);
    onChange('specialNotes', [true, true, true, true]);
  };

  /* refreshKey: 문구 추가 후 목록 재계산 트리거 */
  const [refreshKey, setRefreshKey] = useState(0);
  const goals   = useMemo(() => getMergedPhrases('goals'),   [refreshKey]);
  const support  = useMemo(() => getMergedPhrases('support'), [refreshKey]);

  /* 공용 문구 인라인 추가 상태 */
  const [addingField, setAddingField] = useState(null);
  const [addText, setAddText] = useState('');
  const addInputRef = useRef(null);

  /* 1회용 항목 추가 상태 */
  const [oneTimeField, setOneTimeField] = useState(null);
  const [oneTimeText, setOneTimeText]   = useState('');
  const oneTimeRef = useRef(null);

  /* 1회용 항목 편집 상태 */
  const [editingOneTime, setEditingOneTime]   = useState(null); // { field, idx }
  const [editOneTimeText, setEditOneTimeText] = useState('');

  /* 문구 버튼 토글 — { ko, ja } 객체로 저장 */
  const togglePhrase = (field, item) => {
    const list = data[field] || [];
    const exists = list.some((p) => p.ko === item.ko && p.ja === item.ja);
    const updated = exists
      ? list.filter((p) => !(p.ko === item.ko && p.ja === item.ja))
      : [...list, { ko: item.ko, ja: item.ja }];
    onChange(field, updated);
  };

  /* 숫자키(1~9) 단축키 */
  const handleGridKeyDown = (e, field, items) => {
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= 9) {
      const target = items[num - 1];
      if (target) {
        e.preventDefault();
        togglePhrase(field, target);
      }
    }
  };

  /* 문구 삭제 — 기본 문구는 숨김 처리, 커스텀 문구는 저장소에서 제거 */
  const deletePhrase = (field, cat, item) => {
    if (isDefaultPhrase(cat, item)) {
      hidePhrase(cat, item);
    } else {
      const current = getItem('customPhrases', {});
      setItem('customPhrases', {
        ...current,
        [cat]: (current[cat] || []).filter((p) => !(p.ko === item.ko && p.ja === item.ja)),
      });
    }
    setRefreshKey((k) => k + 1);
    onChange(field, (data[field] || []).filter((p) => !(p.ko === item.ko && p.ja === item.ja)));
  };

  /* 공용 문구 인라인 추가 */
  const addPhrase = (field) => {
    const text = addText.trim();
    if (!text) return;
    const entry = lang === 'ko' ? { ko: text, ja: '' } : { ko: '', ja: text };
    const current = getItem('customPhrases', {});
    const cat = field === 'shortTermGoals' ? 'goals' : 'support';
    const updated = { ...current, [cat]: [...(current[cat] || []), entry] };
    setItem('customPhrases', updated);
    setRefreshKey((k) => k + 1);
    onChange(field, [...(data[field] || []), entry]);
    setAddText('');
    setAddingField(null);
  };

  useEffect(() => {
    if (addingField) setTimeout(() => addInputRef.current?.focus(), 30);
  }, [addingField]);

  useEffect(() => {
    if (oneTimeField) setTimeout(() => oneTimeRef.current?.focus(), 30);
  }, [oneTimeField]);

  /* ── 1회용 항목 핸들러 ── */
  const addOneTimeItem = (field) => {
    const text = oneTimeText.trim();
    if (!text) { setOneTimeField(null); return; }
    const key = oneTimeKey(field);
    onChange(key, [...(data[key] || []), text]);
    setOneTimeText('');
    setOneTimeField(null);
  };

  const deleteOneTimeItem = (field, idx) => {
    const key = oneTimeKey(field);
    onChange(key, (data[key] || []).filter((_, i) => i !== idx));
    if (editingOneTime?.field === field && editingOneTime?.idx === idx) setEditingOneTime(null);
  };

  const startEditOneTime = (field, idx) => {
    const key = oneTimeKey(field);
    setEditingOneTime({ field, idx });
    setEditOneTimeText((data[key] || [])[idx] || '');
  };

  const saveOneTimeEdit = (field, idx) => {
    const key = oneTimeKey(field);
    const text = editOneTimeText.trim();
    if (!text) {
      deleteOneTimeItem(field, idx);
    } else {
      const updated = [...(data[key] || [])];
      updated[idx] = text;
      onChange(key, updated);
    }
    setEditingOneTime(null);
  };


  const notes    = data.specialNotes ?? [true, true, true, true];
  const noteKeys = ['note1', 'note2', 'note3', 'note4'];

  useEffect(() => {
    if (!data.consentDate) onChange('consentDate', getTodayString());
  }, []);

  const consentDate = data.consentDate || getTodayString();

  const visibleGoals   = goals.filter(item => item[lang]);
  const visibleSupport = support.filter(item => item[lang]);

  /* 공용 문구 인라인 추가 UI */
  const renderAddButton = (field) => {
    const isOpen = addingField === field;
    if (isOpen) {
      return (
        <div className={styles.addInlineWrap} onClick={(e) => e.stopPropagation()}>
          <input
            ref={addInputRef}
            className={styles.addInlineInput}
            placeholder={lang === 'ko' ? '새 문구 입력...' : '新しい文言を入力...'}
            value={addText}
            onChange={(e) => setAddText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addPhrase(field);
              if (e.key === 'Escape') { setAddingField(null); setAddText(''); }
            }}
            tabIndex={-1}
          />
          <button className={styles.addInlineConfirm} onClick={() => addPhrase(field)} tabIndex={-1}>✓</button>
          <button className={styles.addInlineCancel} onClick={() => { setAddingField(null); setAddText(''); }} tabIndex={-1}>✕</button>
        </div>
      );
    }
    return (
      <button
        className={styles.addPhraseBtn}
        onClick={(e) => { e.stopPropagation(); setAddingField(field); setAddText(''); }}
        tabIndex={-1}
        title={lang === 'ko' ? '문구 추가' : '文言を追加'}
      >+</button>
    );
  };

  /* 직접 입력 textarea */
  const renderOneTimeArea = (field) => {
    const key = oneTimeKey(field);
    return (
      <textarea
        className={styles.textarea}
        placeholder={lang === 'ko' ? '직접 입력...' : '直接入力...'}
        value={typeof data[key] === 'string' ? data[key] : ''}
        onChange={(e) => onChange(key, e.target.value)}
        rows={2}
      />
    );
  };

  return (
    <div className={styles.formBody} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 20px 80px' }}>

      {/* 테스트 데이터 로딩 오버레이 */}
      {testLoading && (
        <div className={styles.testLoadingOverlay}>
          <div className={styles.testLoadingSpinner} />
          <span>{isJa ? 'データを入力中...' : '데이터 입력 중...'}</span>
        </div>
      )}

      {/* 테스트 데이터 슬라이드 토글 */}
      <label className={styles.testToggleWrap}>
        <span className={styles.testToggleSwitch}>
          <input
            type="checkbox"
            tabIndex={-1}
            checked={testMode}
            onChange={(e) => {
              const next = e.target.checked;
              setTestLoading(true);
              setTimeout(() => {
                if (next) fillTestData();
                else clearTestData();
                setTestMode(next);
                setTestLoading(false);
              }, 700);
            }}
          />
          <span className={styles.testToggleTrack} />
        </span>
        {testMode
          ? (isJa ? 'テストモード中' : '테스트 모드')
          : (isJa ? 'テストデータを入力' : '테스트 데이터 입력')}
      </label>

      {/* 섹션 1: 본인 의향·니즈 */}
      <div className={styles.spBox} data-qa="edit-section-needs">
        <div className={styles.spBoxHeader}>
          <span className={styles.spBoxNum}>1</span>
          {t('doc.supportPlan.needs')}
        </div>
        <div className={styles.spBoxBody}>
          <textarea
            ref={needsRef}
            className={styles.textarea}
            placeholder={t('edit.customPlaceholder')}
            value={data.needs || ''}
            onChange={(e) => onChange('needs', e.target.value)}
            rows={3}
            tabIndex={1}
          />
        </div>
      </div>

      {/* 섹션 2: 장기목표 */}
      <div className={styles.spBox} data-qa="edit-section-longterm">
        <div className={styles.spBoxHeader}>
          <span className={styles.spBoxNum}>2</span>
          {t('doc.supportPlan.longTermGoal')}
        </div>
        <div className={styles.spBoxBody}>
          <textarea
            ref={longTermRef}
            className={styles.textarea}
            placeholder={t('edit.customPlaceholder')}
            value={data.longTermGoal || ''}
            onChange={(e) => onChange('longTermGoal', e.target.value)}
            rows={3}
            tabIndex={2}
          />
        </div>
      </div>

      {/* 섹션 3: 단기목표 + 구체적 지원내용 */}
      <div className={styles.spBox} data-qa="edit-section-shortterm">
        <div className={styles.spBoxHeader}>
          <span className={styles.spBoxNum}>3</span>
          {t('doc.supportPlan.shortTermSection')}
        </div>
        <div className={styles.spBoxBody}>

          {/* 단기목표 그리드 */}
          <p className={styles.subLabel}>{t('doc.supportPlan.shortTermGoal')}</p>
          <div
            className={styles.phraseGrid}
            data-qa="edit-goals-grid"
            tabIndex={3}
            onKeyDown={(e) => handleGridKeyDown(e, 'shortTermGoals', visibleGoals)}
          >
            <div className={styles.gridLabel}>
              <span></span>
              {renderAddButton('shortTermGoals')}
            </div>
            {visibleGoals.map((item, idx) => {
              const isSelected = (data.shortTermGoals || []).some((p) => p.ko === item.ko && p.ja === item.ja);
              return (
                <button
                  key={idx}
                  className={`${styles.phraseBtn} ${isSelected ? styles.selected : ''}`}
                  onClick={() => togglePhrase('shortTermGoals', item)}
                  tabIndex={-1}
                >
                  <span className={styles.phraseNum}>{CIRCLE_NUMS[idx]}</span> {item[lang]}
                  <span
                    className={styles.deletePhraseBadge}
                    onClick={(e) => { e.stopPropagation(); deletePhrase('shortTermGoals', 'goals', item); }}
                  >✕</span>
                </button>
              );
            })}
          </div>
          {renderOneTimeArea('shortTermGoals')}

          {/* 구체적 지원내용 그리드 */}
          <p className={styles.subLabel} style={{ marginTop: 12 }}>{t('doc.supportPlan.supportContent')}</p>
          <div
            className={styles.phraseGrid}
            data-qa="edit-support-grid"
            tabIndex={5}
            onKeyDown={(e) => handleGridKeyDown(e, 'supportContent', visibleSupport)}
          >
            <div className={styles.gridLabel}>
              <span></span>
              {renderAddButton('supportContent')}
            </div>
            {visibleSupport.map((item, idx) => {
              const isSelected = (data.supportContent || []).some((p) => p.ko === item.ko && p.ja === item.ja);
              return (
                <button
                  key={idx}
                  className={`${styles.phraseBtn} ${isSelected ? styles.selected : ''}`}
                  onClick={() => togglePhrase('supportContent', item)}
                  tabIndex={-1}
                >
                  <span className={styles.phraseNum}>{CIRCLE_NUMS[idx]}</span> {item[lang]}
                  <span
                    className={styles.deletePhraseBadge}
                    onClick={(e) => { e.stopPropagation(); deletePhrase('supportContent', 'support', item); }}
                  >✕</span>
                </button>
              );
            })}
          </div>
          {renderOneTimeArea('supportContent')}

        </div>
      </div>

      {/* 섹션 4: 특기사항 */}
      <div className={styles.spBox} data-qa="edit-section-notes">
        <div className={styles.spBoxHeader}>
          <span className={styles.spBoxNum}>4</span>
          {t('doc.supportPlan.specialNotes')}
        </div>
        <div className={styles.spBoxBody}>
          {noteKeys.map((key, idx) => (
            <label key={idx} className={styles.checkItem} tabIndex={-1}>
              <input type="checkbox" checked={true} readOnly className={styles.checkbox} tabIndex={-1} />
              <span>{t(`doc.supportPlan.${key}`)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 동의 일자 / 서명 */}
      <div className={styles.spBox} data-qa="edit-section-consent">
        <div className={styles.spBoxHeader}>{t('doc.supportPlan.consentSection')}</div>
        <div className={styles.spBoxBody}>
          <div className={styles.consentRow}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>{t('doc.supportPlan.consentDate')}</label>
              <input
                className={styles.input}
                type="date"
                value={consentDate}
                onChange={(e) => onChange('consentDate', e.target.value)}
                tabIndex={-1}
                onFocus={(e) => { try { e.target.showPicker(); } catch (_) {} }}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>{t('doc.supportPlan.consentSign')}</label>
              <input
                className={styles.input}
                type="text"
                placeholder="　"
                value={data.consentSign || ''}
                onChange={(e) => onChange('consentSign', e.target.value)}
                tabIndex={-1}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SupportPlanEdit;
