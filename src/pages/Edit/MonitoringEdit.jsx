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
  const isJa = lang === 'ja';

  const [testMode, setTestMode]       = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const testModeRef = useRef(false);
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

  /* 테스트 더미데이터 */
  const fillTestData = () => {
    onChange('_testMode', true);
    const goalTexts = [
      'けがをしないように気をつけて生活する',
      '体調の変化に気をつけて生活する',
      'おだやかに生活をする',
    ];
    const achieveVals = ['A', 'B', 'A'];
    const satTexts = [
      '日常生活において大きな問題なく過ごせている。本人も前向きに取り組んでいる。',
      '体調の変化に都度対応し、安定した状態を維持できている。',
      '穏やかに日々を過ごせており、表情も明るい。',
    ];
    const contentTexts = [
      '引き続き夜間の見守りと声かけ支援を継続する。',
      '服薬管理・受診同行支援を継続する。',
      'レクリエーション参加を促し、生活の質向上を図る。',
    ];
    const testRows = Array.from({ length: GOAL_COUNT }, (_, i) => ({
      goalText: goalTexts[i],
      achieve: achieveVals[i],
      satisfactionText: satTexts[i],
      contentChange: contentTexts[i],
    }));
    onChange('year', '2025');
    onChange('month', '3');
    onChange('rows', testRows);
    onChange('planChanged', false);
    onChange('meetingOpinion', '今月も安定した生活が継続できている。引き続き現在の支援方針を継続する。');
  };

  const clearTestData = () => {
    onChange('_testMode', false);
    onChange('year', '');
    onChange('month', '');
    onChange('rows', Array.from({ length: GOAL_COUNT }, () => ({})));
    onChange('planChanged', undefined);
    onChange('meetingOpinion', '');
  };

  /* 페이지 이탈 시 테스트 데이터 정리 */
  useEffect(() => {
    return () => { if (testModeRef.current) clearTestData(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.formBody} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 20px 80px' }}>

      {/* 테스트 데이터 로딩 오버레이 */}
      {testLoading && (
        <div className={styles.testLoadingOverlay}>
          <div className={styles.testLoadingSpinner} />
          <span>{isJa ? 'データを入力中...' : '데이터 입력 중...'}</span>
        </div>
      )}

      {/* 테스트 데이터 토글 */}
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
                testModeRef.current = next;
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

      {/* 연도・월 */}
      <div className={styles.spBox} data-qa="edit-monitoring-yearmonth">
        <div className={styles.spBoxHeader}>{t('doc.monitoring.yearMonth')}</div>
        <div className={styles.spBoxBody}>
          <div className={styles.yearMonthRow}>
            <input className={styles.inputSmall} type="text" maxLength={4}
              value={data.year || ''} onChange={(e) => onChange('year', e.target.value)} />
            <span className={styles.yearMonthLabel}>{t('doc.monitoring.year')}</span>
            <input className={styles.inputSmall} type="text" maxLength={2}
              value={data.month || ''} onChange={(e) => onChange('month', e.target.value)} />
            <span className={styles.yearMonthLabel}>{t('doc.monitoring.month')}</span>
          </div>
        </div>
      </div>

      {/* 목표 행 1~3 */}
      {Array.from({ length: GOAL_COUNT }, (_, idx) => {
        return (
        <div key={idx} className={styles.spBox} data-qa={`edit-monitoring-row-${idx + 1}`}>
          <div className={styles.spBoxHeader}>
            <span className={styles.spBoxNum}>{idx + 1}</span>
            {t('doc.monitoring.supportGoal')}
          </div>
          <div className={styles.spBoxBody}>

          {linkedGoals.length > 0 && (
            <div className={styles.goalChipGrid}>
              {linkedGoals.map((goal, gIdx) => {
                const text = typeof goal === 'object' ? (goal[lang] || goal.ja || goal.ko || '') : (goal || '');
                if (!text) return null;
                const circled = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'][gIdx] || String(gIdx + 1);
                const isSelected = rows[idx]?.goalText === text;
                return (
                  <button key={gIdx}
                    className={`${styles.goalChipBtn} ${isSelected ? styles.goalChipSelected : ''}`}
                    onClick={() => updateRow(idx, 'goalText', isSelected ? '' : text)}>
                    <span className={styles.goalChipNum}>{circled}</span>
                    {text}
                  </button>
                );
              })}
            </div>
          )}
          <textarea className={styles.textarea} placeholder={t('edit.customPlaceholder')}
            value={rows[idx]?.goalText || ''} onChange={(e) => updateRow(idx, 'goalText', e.target.value)} rows={2} />

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

          <textarea className={styles.textarea} placeholder={t('edit.customPlaceholder')}
            value={rows[idx]?.satisfactionText || ''} onChange={(e) => updateRow(idx, 'satisfactionText', e.target.value)} rows={3} />

          <p className={styles.subLabel}>{t('doc.monitoring.contentChange')}</p>
          <textarea className={styles.textarea} placeholder={t('edit.customPlaceholder')}
            value={rows[idx]?.contentChange || ''} onChange={(e) => updateRow(idx, 'contentChange', e.target.value)} rows={3} />
          </div>
        </div>
        );
      })}

      {/* 계획 변경 여부 */}
      <div className={styles.spBox} data-qa="edit-monitoring-planchange">
        <div className={styles.spBoxHeader}>{t('doc.monitoring.planChange')}</div>
        <div className={styles.spBoxBody}>
          <div className={styles.toggleRow}>
            <button className={`${styles.toggleBtn} ${data.planChanged === true ? styles.toggleActive : ''}`}
              onClick={() => onChange('planChanged', true)}>{t('doc.monitoring.planChangeYes')}</button>
            <button className={`${styles.toggleBtn} ${data.planChanged === false || data.planChanged === undefined ? styles.toggleActive : ''}`}
              onClick={() => onChange('planChanged', false)}>{t('doc.monitoring.planChangeNo')}</button>
          </div>
        </div>
      </div>

      {/* モニタリング・支援 의견 */}
      <div className={styles.spBox} data-qa="edit-monitoring-opinion">
        <div className={styles.spBoxHeader}>モニタリング・支援</div>
        <div className={styles.spBoxBody}>
          <textarea className={styles.textarea} rows={3}
            placeholder={t('edit.customPlaceholder')}
            value={data.meetingOpinion || ''}
            onChange={(e) => onChange('meetingOpinion', e.target.value)} />
        </div>
      </div>

    </div>
  );
};

export default MonitoringEdit;
