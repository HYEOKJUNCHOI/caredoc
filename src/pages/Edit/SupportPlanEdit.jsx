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
  const needsRef    = useRef(null);
  const longTermRef = useRef(null);

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

  /* 1회용 항목 칩 + 입력 영역 */
  const renderOneTimeArea = (field) => {
    const key = oneTimeKey(field);
    const items = data[key] || [];
    return (
      <div className={styles.oneTimeArea}>
        {/* 추가된 1회용 칩 목록 */}
        {items.map((text, i) => (
          editingOneTime?.field === field && editingOneTime?.idx === i ? (
            /* 편집 모드 */
            <div key={i} className={styles.addInlineWrap} onClick={(e) => e.stopPropagation()}>
              <input
                autoFocus
                className={styles.addInlineInput}
                value={editOneTimeText}
                onChange={(e) => setEditOneTimeText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveOneTimeEdit(field, i);
                  if (e.key === 'Escape') setEditingOneTime(null);
                }}
                tabIndex={-1}
              />
              <button className={styles.addInlineConfirm} onClick={() => saveOneTimeEdit(field, i)} tabIndex={-1}>✓</button>
              <button className={styles.addInlineCancel} onClick={() => setEditingOneTime(null)} tabIndex={-1}>✕</button>
            </div>
          ) : (
            /* 칩 표시 */
            <button
              key={i}
              className={`${styles.phraseBtn} ${styles.oneTimeChip}`}
              onClick={() => startEditOneTime(field, i)}
              tabIndex={-1}
              title={lang === 'ko' ? '클릭하여 편집' : 'クリックして編集'}
            >
              ✏ {text}
              <span
                className={styles.deletePhraseBadge}
                onClick={(e) => { e.stopPropagation(); deleteOneTimeItem(field, i); }}
              >✕</span>
            </button>
          )
        ))}

        {/* 입력창 */}
        {oneTimeField === field ? (
          <div className={styles.addInlineWrap} onClick={(e) => e.stopPropagation()}>
            <input
              ref={oneTimeRef}
              className={styles.addInlineInput}
              placeholder={lang === 'ko' ? '이 분을 위한 내용 입력...' : 'この方のための内容を入力...'}
              value={oneTimeText}
              onChange={(e) => setOneTimeText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addOneTimeItem(field);
                if (e.key === 'Escape') { setOneTimeField(null); setOneTimeText(''); }
              }}
              tabIndex={-1}
            />
            <button className={styles.addInlineConfirm} onClick={() => addOneTimeItem(field)} tabIndex={-1}>✓</button>
            <button className={styles.addInlineCancel} onClick={() => { setOneTimeField(null); setOneTimeText(''); }} tabIndex={-1}>✕</button>
          </div>
        ) : (
          <button
            className={styles.oneTimeInputTrigger}
            onClick={(e) => { e.stopPropagation(); setOneTimeField(field); setOneTimeText(''); }}
            tabIndex={-1}
          >
            {lang === 'ko' ? '+ 이 분을 위한 내용 직접 입력...' : '+ この方のための内容を直接入力...'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={styles.formBody}>

      {/* 섹션 1: 본인 의향·니즈 */}
      <section className={styles.section} data-qa="edit-section-needs">
        <div className={styles.phraseGrid} onClick={() => needsRef.current?.focus()}>
          <h2 className={`${styles.sectionTitle} ${styles.gridTitle}`}>
            <span className={styles.sectionNum}>1</span>
            {t('doc.supportPlan.needs')}
          </h2>
          <textarea
            ref={needsRef}
            className={`${styles.textarea} ${styles.gridTextarea}`}
            placeholder={t('edit.customPlaceholder')}
            value={data.needs || ''}
            onChange={(e) => onChange('needs', e.target.value)}
            rows={3}
            tabIndex={1}
          />
        </div>
      </section>

      {/* 섹션 2: 장기목표 */}
      <section className={styles.section} data-qa="edit-section-longterm">
        <div className={styles.phraseGrid} onClick={() => longTermRef.current?.focus()}>
          <h2 className={`${styles.sectionTitle} ${styles.gridTitle}`}>
            <span className={styles.sectionNum}>2</span>
            {t('doc.supportPlan.longTermGoal')}
          </h2>
          <textarea
            ref={longTermRef}
            className={`${styles.textarea} ${styles.gridTextarea}`}
            placeholder={t('edit.customPlaceholder')}
            value={data.longTermGoal || ''}
            onChange={(e) => onChange('longTermGoal', e.target.value)}
            rows={3}
            tabIndex={2}
          />
        </div>
      </section>

      {/* 섹션 3: 단기목표 + 구체적 지원내용 */}
      <section className={styles.section} data-qa="edit-section-shortterm">
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionNum}>3</span>
          {t('doc.supportPlan.shortTermSection')}
        </h2>

        {/* 단기목표 그리드 */}
        <div
          className={styles.phraseGrid}
          data-qa="edit-goals-grid"
          tabIndex={3}
          onKeyDown={(e) => handleGridKeyDown(e, 'shortTermGoals', visibleGoals)}
        >
          <div className={styles.gridLabel}>
            <span>{t('doc.supportPlan.shortTermGoal')}</span>
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
          {/* 1회용 항목 영역 */}
          {renderOneTimeArea('shortTermGoals')}
        </div>

        {/* 구체적 지원내용 그리드 */}
        <div
          className={styles.phraseGrid}
          data-qa="edit-support-grid"
          tabIndex={5}
          onKeyDown={(e) => handleGridKeyDown(e, 'supportContent', visibleSupport)}
        >
          <div className={styles.gridLabel}>
            <span>{t('doc.supportPlan.supportContent')}</span>
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
          {/* 1회용 항목 영역 */}
          {renderOneTimeArea('supportContent')}
        </div>
      </section>

      {/* 섹션 4: 특기사항 — 기본값 고정, CRUD 없음, 탭 제외 */}
      <section className={styles.section} data-qa="edit-section-notes">
        <div className={styles.phraseGrid} tabIndex={-1}>
          <div className={`${styles.sectionTitle} ${styles.gridTitle} ${styles.gridLabel}`}>
            <span>
              <span className={styles.sectionNum}>4</span>
              {' '}{t('doc.supportPlan.specialNotes')}
            </span>
          </div>
          {noteKeys.map((key, idx) => (
            <label key={idx} className={styles.checkItem} tabIndex={-1}>
              <input
                type="checkbox"
                checked={true}
                readOnly
                className={styles.checkbox}
                tabIndex={-1}
              />
              <span>{t(`doc.supportPlan.${key}`)}</span>
            </label>
          ))}
        </div>
      </section>

      {/* 동의 일자 / 서명 */}
      <section className={styles.section} data-qa="edit-section-consent">
        <h2 className={styles.sectionTitle}>{t('doc.supportPlan.consentSection')}</h2>
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
      </section>

    </div>
  );
};

export default SupportPlanEdit;
