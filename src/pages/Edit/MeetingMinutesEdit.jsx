/* 작성회의록 폼 */

import { useEffect, useRef, useState, useMemo, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { getMergedPhrases, getItem, setItem, hidePhrase, getCurrentUser, getCurrentUserId, getDocument } from '../../utils/storage';
import defaultPhrases from '../../data/phrases';
import styles from './Edit.module.css';

const isDefaultSat = (item) =>
  defaultPhrases.satisfaction?.some((d) => d.ko === item.ko && d.ja === item.ja);

const GOAL_COUNT = 2;

const FloatingPortal = ({ anchorEl, children }) => {
  const [style, setStyle] = useState({ display: 'none' });

  useLayoutEffect(() => {
    if (!anchorEl) return;
    const updatePosition = () => {
      const rect = anchorEl.getBoundingClientRect();
      const popupWidth = 260; // Approximate width based on CSS
      const isTooFarRight = rect.right + popupWidth + 20 > window.innerWidth;
      
      if (isTooFarRight) {
        setStyle({
          position: 'fixed',
          top: rect.bottom + 8,
          left: Math.max(10, rect.right - popupWidth),
          zIndex: 99999,
        });
      } else {
        setStyle({
          position: 'fixed',
          top: Math.round(rect.top + rect.height / 2),
          left: Math.round(rect.right + 6),
          transform: 'translateY(-50%)',
          zIndex: 99999,
        });
      }
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorEl]);

  if (!anchorEl) return null;

  return createPortal(
    <div style={style} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>,
    document.body
  );
};

const MeetingMinutesEdit = ({ data, onChange, supportPlanData }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isJa = lang === 'ja';

  /* 테스트 데이터 토글 상태 */
  const [testMode,    setTestMode]    = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [fixedAnchorEl, setFixedAnchorEl] = useState(null);
  const [addAnchorEl, setAddAnchorEl] = useState(null);

  const fillTestData = () => {
    onChange('extraParticipantList', ['相談支援専門員　田中一郎', '家族（母）']);
    onChange('rows', [
      {
        goalText:     'けがをしないように気をつけて生活する',
        opinionTexts: ['頑張っています'],
        opinionCustom:'特に大きな問題なく過ごせている。',
        review:       '日常的な安全確認を継続する。夜間の見守りも引き続き実施していく。',
        customItems:  [],
      },
      {
        goalText:     '体調の変化に気をつけて生活する',
        opinionTexts: ['大丈夫'],
        opinionCustom:'服薬も継続できており、体調は安定している。',
        review:       '通院同行を月1回継続。処方内容に変更があった場合は速やかに家族へ連絡する。',
        customItems:  [],
      },
    ]);
    onChange('futureTask', '引き続き現在の支援計画を継続しながら、本人の状態変化に応じて柔軟に対応していく。次回モニタリングは3ヶ月後を予定。');
  };

  const clearTestData = () => {
    onChange('extraParticipantList', []);
    onChange('rows', Array.from({ length: GOAL_COUNT }, () => ({})));
    onChange('futureTask', '');
  };

  const [refreshKey, setRefreshKey] = useState(0);
  const [addingRow, setAddingRow]   = useState(null);
  const [addText, setAddText]       = useState('');
  const addInputRef = useRef(null);

  /* 참가자 칩 상태 */
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [participantText, setParticipantText]     = useState('');
  const participantInputRef = useRef(null);

  /* 고정 참가자 편집 상태 */
  const [editingFixed, setEditingFixed]   = useState(null); // index
  const [editFixedText, setEditFixedText] = useState('');
  const editFixedRef = useRef(null);

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

  const toggleOpinion = (rowIdx, text) => {
    const rows = data.rows || Array.from({ length: GOAL_COUNT }, () => ({}));
    const row  = rows[rowIdx] || {};
    const list = row.opinionTexts || [];
    const updated = list.includes(text)
      ? list.filter((p) => p !== text)
      : [...list, text];
    updateRow(rowIdx, 'opinionTexts', updated);
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
      i === rowIdx ? { ...r, opinionTexts: (r.opinionTexts || []).filter((t) => t !== text) } : r
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
    toggleOpinion(rowIdx, text);
    setAddText('');
    setAddingRow(null);
  };

  useEffect(() => {
    if (addingRow !== null) setTimeout(() => addInputRef.current?.focus(), 30);
  }, [addingRow]);

  useEffect(() => {
    if (addingParticipant) setTimeout(() => participantInputRef.current?.focus(), 30);
  }, [addingParticipant]);

  useEffect(() => {
    if (editingFixed !== null) setTimeout(() => editFixedRef.current?.focus(), 30);
  }, [editingFixed]);

  useEffect(() => {
    if (oneTimeRow !== null) setTimeout(() => oneTimeRef.current?.focus(), 30);
  }, [oneTimeRow]);

  /* ── 고정 참가자 편집 핸들러 ── */
  const startEditFixed = (idx, currentName) => {
    setEditingFixed(idx);
    /* 이미 오버라이드가 있으면 그 값으로, 없으면 원본값으로 */
    const overrides = data.fixedParticipantOverrides || [];
    setEditFixedText(overrides[idx] ?? currentName);
  };

  const saveFixedEdit = (idx) => {
    const text = editFixedText.trim();
    const overrides = [...(data.fixedParticipantOverrides || [])];
    overrides[idx] = text || null; // 비우면 null → 원본 복원
    onChange('fixedParticipantOverrides', overrides);
    setEditingFixed(null);
  };

  /* ── 참가자 칩 핸들러 ── */
  const confirmParticipant = () => {
    const text = participantText.trim();
    if (!text) { setAddingParticipant(false); return; }
    const list = data.extraParticipantList || [];
    onChange('extraParticipantList', [...list, text]);
    setParticipantText('');
    setAddingParticipant(false);
  };

  const removeParticipant = (idx) => {
    const list = data.extraParticipantList || [];
    onChange('extraParticipantList', list.filter((_, i) => i !== idx));
  };

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

  /* 고정 참가자: 이용자 + 담당자 (오버라이드 적용) */
  const userId = getCurrentUserId();
  const currentUser = getCurrentUser();
  const basicInfoData = getDocument(userId, 'basicInfo');
  const fixedDefaults    = [basicInfoData?.nameKanji, currentUser?.name];
  const fixedOverrides   = data.fixedParticipantOverrides || [];
  /* 원본이 없으면 칩 자체를 숨기지 않고, 오버라이드 값 or 원본값 표示 */
  const fixedParticipants = fixedDefaults
    .map((def, i) => fixedOverrides[i] ?? def)
    .map((val, i) => ({ display: val, hasDefault: Boolean(fixedDefaults[i]) }))
    .filter(({ display, hasDefault }) => display || hasDefault);

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

      {/* 참가자 */}
      <div className={styles.spBox} data-qa="edit-meeting-participants">
        <div className={styles.spBoxHeader}>{t('doc.meeting.participants')}</div>
        <div className={styles.spBoxBody}>
          {/* 칩 행 + floating 인풋은 항상 칩 옆에 붙어서 표시 */}
          <div className={styles.participantChipArea}>
            {/* 고정 칩 — 항상 보임, 클릭 시 해당 칩 오른쪽에 floating 인풋 */}
            {fixedParticipants.map(({ display }, i) => (
              <span key={i} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <span className={`${styles.fixedChipEditable} ${editingFixed === i ? styles.fixedChipActive : ''}`}
                  onClick={(e) => {
                    startEditFixed(i, display);
                    setFixedAnchorEl(e.currentTarget);
                  }}
                  title={isJa ? 'クリックして編集' : '클릭하여 편집'}>
                  {display || (isJa ? '(未設定)' : '(미설정)')}
                </span>
                {editingFixed === i && (
                  <FloatingPortal anchorEl={fixedAnchorEl}>
                  <div className={styles.participantFloatingWrap} style={{ position: 'static', transform: 'none' }} onClick={(e) => e.stopPropagation()}>
                    <input
                      ref={editFixedRef}
                      className={styles.participantFloatingInput}
                      value={editFixedText}
                      onChange={(e) => setEditFixedText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveFixedEdit(i);
                        if (e.key === 'Escape') setEditingFixed(null);
                      }}
                      tabIndex={-1}
                    />
                    <button className={styles.participantFloatingConfirm} onClick={() => saveFixedEdit(i)} tabIndex={-1}>✓</button>
                    <button className={styles.participantFloatingCancel} onClick={() => setEditingFixed(null)} tabIndex={-1}>✕</button>
                  </div>
                  </FloatingPortal>
                )}
              </span>
            ))}
            {/* 추가 참가자 칩 — 항상 보임 */}
            {(data.extraParticipantList || []).map((name, i) => (
              <span key={i} className={styles.participantChip}>
                {name}
                <button className={styles.chipRemoveBtn} onClick={() => removeParticipant(i)} tabIndex={-1}>✕</button>
              </span>
            ))}
            {/* + 버튼 or floating 인풋 — 칩들 옆에 나란히 */}
            <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              {/* 모바일 가로 잘림 방지를 위해 아래쪽으로 뜨도록 CSS(Edit.module.css) 연동됨 */}
              <button className={styles.addPhraseBtn} tabIndex={-1}
                onClick={(e) => { 
                  setAddingParticipant(true); 
                  setParticipantText(''); 
                  setAddAnchorEl(e.currentTarget);
                }}
                title={lang === 'ko' ? '참가자 추가' : '参加者を追加'}>+</button>
              {addingParticipant && (
                <FloatingPortal anchorEl={addAnchorEl}>
                <div className={styles.participantFloatingWrap} style={{ position: 'static', transform: 'none' }} onClick={(e) => e.stopPropagation()}>
                  <input
                    ref={participantInputRef}
                    className={styles.participantFloatingInput}
                    placeholder={lang === 'ko' ? '참가자 이름 입력...' : '参加者名を入力...'}
                    value={participantText}
                    onChange={(e) => setParticipantText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmParticipant();
                      if (e.key === 'Escape') { setAddingParticipant(false); setParticipantText(''); }
                    }}
                    tabIndex={-1}
                  />
                  <button className={styles.participantFloatingConfirm} onClick={confirmParticipant} tabIndex={-1}>✓</button>
                  <button className={styles.participantFloatingCancel} onClick={() => { setAddingParticipant(false); setParticipantText(''); }} tabIndex={-1}>✕</button>
                </div>
                </FloatingPortal>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 목표 행 1~2 */}
      {Array.from({ length: GOAL_COUNT }, (_, idx) => {
        return (
        <div key={idx} className={styles.spBox} data-qa={`edit-meeting-row-${idx + 1}`}>
          <div className={styles.spBoxHeader}>
            <span className={styles.spBoxNum}>{idx + 1}</span>
            {t('doc.meeting.supportGoalPlan')}
          </div>
          <div className={styles.spBoxBody}>

          {/* 지원목표 ── 내부 섹션 */}
          <span className={styles.innerSectionLabel} style={{ marginTop: 0 }}>{t('doc.meeting.supportGoalPlan')}</span>
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

          {/* 본인의 감상 ── 내부 섹션 */}
          <div className={styles.innerSection}>
          <span className={styles.innerSectionLabel}>{t('doc.meeting.opinion')}</span>
          <div className={styles.phraseGrid}>
            <div className={styles.gridLabel}>
              <span></span>
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
              const isSelected = (rows[idx]?.opinionTexts || []).includes(text);
              return (
                <button key={sIdx}
                  className={`${styles.phraseBtn} ${isSelected ? styles.selected : ''}`}
                  onClick={() => toggleOpinion(idx, text)}>
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

          <textarea className={styles.textarea} placeholder={t('edit.customPlaceholder')}
            value={rows[idx]?.opinionCustom || ''} onChange={(e) => updateRow(idx, 'opinionCustom', e.target.value)} rows={2} />
          </div>{/* /innerSection 본인의 감상 */}

          {/* 검토내용·대응 ── 내부 섹션 */}
          <div className={styles.innerSection}>
          <span className={styles.innerSectionLabel}>{t('doc.meeting.review')}</span>
          <textarea className={styles.textarea} placeholder={t('edit.customPlaceholder')}
            value={rows[idx]?.review || ''} onChange={(e) => updateRow(idx, 'review', e.target.value)} rows={3} />
          </div>{/* /innerSection 검토내용 */}
          </div>
        </div>
        );
      })}

      {/* 향후 과제 */}
      <div className={styles.spBox} data-qa="edit-meeting-future">
        <div className={styles.spBoxHeader}>{t('doc.meeting.futureTask')}</div>
        <div className={styles.spBoxBody}>
          <textarea className={styles.textarea} placeholder={t('edit.customPlaceholder')}
            value={data.futureTask || ''} onChange={(e) => onChange('futureTask', e.target.value)} rows={4} />
        </div>
      </div>

    </div>
  );
};

export default MeetingMinutesEdit;
