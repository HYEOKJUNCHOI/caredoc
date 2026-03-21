/* 모니터링기록표 작성 폼 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getMergedPhrases, getItem, setItem, hidePhrase } from '../../utils/storage';
import defaultPhrases from '../../data/phrases';
import styles from './Edit.module.css';

const isDefaultSat = (item) =>
  defaultPhrases.satisfaction?.some((d) => d.ko === item.ko && d.ja === item.ja);

const ACHIEVE_KEYS   = ['achieveA', 'achieveB', 'achieveC'];
const ACHIEVE_VALUES = ['A', 'B', 'C'];
const GOAL_COUNT = 3;

const MonitoringEdit = ({ data, onChange, supportPlanData }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [refreshKey, setRefreshKey]   = useState(0);
  const [addingRow, setAddingRow]     = useState(null);
  const [addText, setAddText]         = useState('');
  const addInputRef = useRef(null);

  /* 1회용 항목 상태 */
  const [oneTimeRow, setOneTimeRow]   = useState(null);
  const [oneTimeText, setOneTimeText] = useState('');
  const oneTimeRef = useRef(null);

  /* 1회용 편집 상태 */
  const [editingOneTime, setEditingOneTime]   = useState(null); // { rowIdx, idx }
  const [editOneTimeText, setEditOneTimeText] = useState('');

  const satisfaction = useMemo(() => getMergedPhrases('satisfaction'), [refreshKey]);

  const updateRow = (rowIdx, field, value) => {
    const rows = data.rows || Array.from({ length: GOAL_COUNT }, () => ({}));
    const updated = rows.map((r, i) => (i === rowIdx ? { ...r, [field]: value } : r));
    onChange('rows', updated);
  };

  const toggleSatisfaction = (rowIdx, text) => {
    const rows = data.rows || Array.from({ length: GOAL_COUNT }, () => ({}));
    const row  = rows[rowIdx] || {};
    const list = row.satisfactionTexts || [];
    const updated = list.includes(text)
      ? list.filter((p) => p !== text)
      : [...list, text];
    updateRow(rowIdx, 'satisfactionTexts', updated);
  };

  const deletePhrase = (rowIdx, item) => {
    const text = item[lang];
    if (isDefaultSat(item)) {
      hidePhrase('satisfaction', item);
    } else {
      const current = getItem('customPhrases', {});
      setItem('customPhrases', {
        ...current,
        satisfaction: (current.satisfaction || []).filter((p) => !(p.ko === item.ko && p.ja === item.ja)),
      });
    }
    setRefreshKey((k) => k + 1);
    const rows = data.rows || Array.from({ length: GOAL_COUNT }, () => ({}));
    const updated2 = rows.map((r, i) =>
      i === rowIdx ? { ...r, satisfactionTexts: (r.satisfactionTexts || []).filter((t) => t !== text) } : r
    );
    onChange('rows', updated2);
  };

  const addPhrase = (rowIdx) => {
    const text = addText.trim();
    if (!text) return;
    const entry = lang === 'ko' ? { ko: text, ja: '' } : { ko: '', ja: text };
    const current = getItem('customPhrases', {});
    const updated  = { ...current, satisfaction: [...(current.satisfaction || []), entry] };
    setItem('customPhrases', updated);
    setRefreshKey((k) => k + 1);
    toggleSatisfaction(rowIdx, text);
    setAddText('');
    setAddingRow(null);
  };

  useEffect(() => {
    if (addingRow !== null) setTimeout(() => addInputRef.current?.focus(), 30);
  }, [addingRow]);

  useEffect(() => {
    if (oneTimeRow !== null) setTimeout(() => oneTimeRef.current?.focus(), 30);
  }, [oneTimeRow]);

  /* ── 1회용 항목 핸들러 ── */
  const addOneTimeItem = (rowIdx) => {
    const text = oneTimeText.trim();
    if (!text) { setOneTimeRow(null); return; }
    const rows = data.rows || Array.from({ length: GOAL_COUNT }, () => ({}));
    const items = rows[rowIdx]?.customItems || [];
    updateRow(rowIdx, 'customItems', [...items, text]);
    setOneTimeText('');
    setOneTimeRow(null);
  };

  const deleteOneTimeItem = (rowIdx, idx) => {
    const rows = data.rows || Array.from({ length: GOAL_COUNT }, () => ({}));
    const items = rows[rowIdx]?.customItems || [];
    updateRow(rowIdx, 'customItems', items.filter((_, i) => i !== idx));
    if (editingOneTime?.rowIdx === rowIdx && editingOneTime?.idx === idx) setEditingOneTime(null);
  };

  const startEditOneTime = (rowIdx, idx) => {
    const rows = data.rows || Array.from({ length: GOAL_COUNT }, () => ({}));
    setEditingOneTime({ rowIdx, idx });
    setEditOneTimeText((rows[rowIdx]?.customItems || [])[idx] || '');
  };

  const saveOneTimeEdit = (rowIdx, idx) => {
    const text = editOneTimeText.trim();
    if (!text) {
      deleteOneTimeItem(rowIdx, idx);
    } else {
      const rows = data.rows || Array.from({ length: GOAL_COUNT }, () => ({}));
      const items = [...(rows[rowIdx]?.customItems || [])];
      items[idx] = text;
      updateRow(rowIdx, 'customItems', items);
    }
    setEditingOneTime(null);
  };

  const rows        = data.rows || Array.from({ length: GOAL_COUNT }, () => ({}));
  const linkedGoals = supportPlanData?.shortTermGoals || [];
  const visibleSat  = satisfaction.filter(item => item[lang]);

  return (
    <div className={styles.formBody}>

      {/* 연도・월 */}
      <section className={styles.section} data-qa="edit-monitoring-yearmonth">
        <h2 className={styles.sectionTitle}>{t('doc.monitoring.yearMonth')}</h2>
        <div className={styles.yearMonthRow}>
          <input className={styles.inputSmall} type="text" placeholder="2025" maxLength={4}
            value={data.year || ''} onChange={(e) => onChange('year', e.target.value)} />
          <span className={styles.yearMonthLabel}>{t('doc.monitoring.year')}</span>
          <input className={styles.inputSmall} type="text" placeholder="6" maxLength={2}
            value={data.month || ''} onChange={(e) => onChange('month', e.target.value)} />
          <span className={styles.yearMonthLabel}>{t('doc.monitoring.month')}</span>
        </div>
      </section>

      {/* 목표 행 1~3 */}
      {Array.from({ length: GOAL_COUNT }, (_, idx) => (
        <section key={idx} className={styles.section} data-qa={`edit-monitoring-row-${idx + 1}`}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionNum}>{idx + 1}</span>
            {t('doc.monitoring.supportGoal')}
          </h2>

          {linkedGoals[idx] ? (
            <div className={styles.autoLinked}>
              <span className={styles.autoLinkedBadge}>{t('edit.autoLinked')}</span>
              <p className={styles.autoLinkedText}>{linkedGoals[idx]}</p>
            </div>
          ) : (
            <textarea className={styles.textarea} placeholder={t('edit.customPlaceholder')}
              value={rows[idx]?.goalText || ''} onChange={(e) => updateRow(idx, 'goalText', e.target.value)} rows={2} />
          )}

          <p className={styles.subLabel}>{t('doc.monitoring.satisfaction')}</p>
          <div className={styles.achieveRow}>
            {ACHIEVE_VALUES.map((val, aIdx) => (
              <button key={val}
                className={`${styles.achieveBtn} ${rows[idx]?.achieve === val ? styles.achieveSelected : ''}`}
                onClick={() => updateRow(idx, 'achieve', val)}>
                {t(`doc.monitoring.${ACHIEVE_KEYS[aIdx]}`)}
              </button>
            ))}
          </div>

          {/* 감상 문구 그리드 + 1회용 입력 */}
          <div className={styles.phraseGrid}>
            <div className={styles.gridLabel}>
              <span>{t('doc.monitoring.satisfaction')}</span>
              {addingRow === idx ? (
                <div className={styles.addInlineWrap} onClick={(e) => e.stopPropagation()}>
                  <input
                    ref={addInputRef}
                    className={styles.addInlineInput}
                    placeholder={lang === 'ko' ? '새 문구 입력...' : '新しい文言を入力...'}
                    value={addText}
                    onChange={(e) => setAddText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addPhrase(idx);
                      if (e.key === 'Escape') { setAddingRow(null); setAddText(''); }
                    }}
                    tabIndex={-1}
                  />
                  <button className={styles.addInlineConfirm} onClick={() => addPhrase(idx)} tabIndex={-1}>✓</button>
                  <button className={styles.addInlineCancel} onClick={() => { setAddingRow(null); setAddText(''); }} tabIndex={-1}>✕</button>
                </div>
              ) : (
                <button className={styles.addPhraseBtn} tabIndex={-1}
                  onClick={(e) => { e.stopPropagation(); setAddingRow(idx); setAddText(''); }}
                  title={lang === 'ko' ? '문구 추가' : '文言を追加'}>+</button>
              )}
            </div>
            {visibleSat.map((item, sIdx) => {
              const text = item[lang];
              const isSelected = (rows[idx]?.satisfactionTexts || []).includes(text);
              return (
                <button key={sIdx}
                  className={`${styles.phraseBtn} ${isSelected ? styles.selected : ''}`}
                  onClick={() => toggleSatisfaction(idx, text)}>
                  {text}
                  <span
                    className={styles.deletePhraseBadge}
                    onClick={(e) => { e.stopPropagation(); deletePhrase(idx, item); }}
                  >✕</span>
                </button>
              );
            })}

            {/* 1회용 항목 */}
            <div className={styles.oneTimeArea}>
              {(rows[idx]?.customItems || []).map((text, i) => (
                editingOneTime?.rowIdx === idx && editingOneTime?.idx === i ? (
                  <div key={i} className={styles.addInlineWrap} onClick={(e) => e.stopPropagation()}>
                    <input
                      autoFocus
                      className={styles.addInlineInput}
                      value={editOneTimeText}
                      onChange={(e) => setEditOneTimeText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveOneTimeEdit(idx, i);
                        if (e.key === 'Escape') setEditingOneTime(null);
                      }}
                      tabIndex={-1}
                    />
                    <button className={styles.addInlineConfirm} onClick={() => saveOneTimeEdit(idx, i)} tabIndex={-1}>✓</button>
                    <button className={styles.addInlineCancel} onClick={() => setEditingOneTime(null)} tabIndex={-1}>✕</button>
                  </div>
                ) : (
                  <button key={i}
                    className={`${styles.phraseBtn} ${styles.oneTimeChip}`}
                    onClick={() => startEditOneTime(idx, i)}
                    tabIndex={-1}>
                    ✏ {text}
                    <span className={styles.deletePhraseBadge}
                      onClick={(e) => { e.stopPropagation(); deleteOneTimeItem(idx, i); }}>✕</span>
                  </button>
                )
              ))}
              {oneTimeRow === idx ? (
                <div className={styles.addInlineWrap} onClick={(e) => e.stopPropagation()}>
                  <input
                    ref={oneTimeRef}
                    className={styles.addInlineInput}
                    placeholder={lang === 'ko' ? '이 분을 위한 내용 입력...' : 'この方のための内容を入力...'}
                    value={oneTimeText}
                    onChange={(e) => setOneTimeText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addOneTimeItem(idx);
                      if (e.key === 'Escape') { setOneTimeRow(null); setOneTimeText(''); }
                    }}
                    tabIndex={-1}
                  />
                  <button className={styles.addInlineConfirm} onClick={() => addOneTimeItem(idx)} tabIndex={-1}>✓</button>
                  <button className={styles.addInlineCancel} onClick={() => { setOneTimeRow(null); setOneTimeText(''); }} tabIndex={-1}>✕</button>
                </div>
              ) : (
                <button
                  className={styles.oneTimeInputTrigger}
                  onClick={(e) => { e.stopPropagation(); setOneTimeRow(idx); setOneTimeText(''); }}
                  tabIndex={-1}
                >
                  {lang === 'ko' ? '+ 이 분을 위한 내용 직접 입력...' : '+ この方のための内容を直接入力...'}
                </button>
              )}
            </div>
          </div>

          <p className={styles.subLabel}>{t('doc.monitoring.contentChange')}</p>
          <textarea className={styles.textarea} placeholder={t('edit.customPlaceholder')}
            value={rows[idx]?.contentChange || ''} onChange={(e) => updateRow(idx, 'contentChange', e.target.value)} rows={3} />
        </section>
      ))}

      {/* 계획 변경 여부 */}
      <section className={styles.section} data-qa="edit-monitoring-planchange">
        <h2 className={styles.sectionTitle}>{t('doc.monitoring.planChange')}</h2>
        <div className={styles.toggleRow}>
          <button className={`${styles.toggleBtn} ${data.planChanged === true ? styles.toggleActive : ''}`}
            onClick={() => onChange('planChanged', true)}>{t('doc.monitoring.planChangeYes')}</button>
          <button className={`${styles.toggleBtn} ${data.planChanged === false || data.planChanged === undefined ? styles.toggleActive : ''}`}
            onClick={() => onChange('planChanged', false)}>{t('doc.monitoring.planChangeNo')}</button>
        </div>
      </section>

    </div>
  );
};

export default MonitoringEdit;
