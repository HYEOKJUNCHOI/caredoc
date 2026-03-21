/* 관리자 페이지 — 문구 관리
   - 커스텀 문구는 ko / ja 각각 별도 입력
   - 토글 시 해당 언어에 값이 있는 문구만 Edit 화면에 표시됨
   - 기본 제공 문구는 읽기 전용 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import phrases from '../../data/phrases';
import { getItem, setItem } from '../../utils/storage';
import styles from './Admin.module.css';

const CATEGORIES = ['goals', 'support', 'satisfaction'];

/* 카테고리 레이블 (i18n key 대응) */
const CAT_LABEL = {
  goals:        'edit.section.goals',
  support:      'edit.section.support',
  satisfaction: 'edit.section.satisfaction',
};

const EMPTY_INPUT = { ko: '', ja: '' };

const Admin = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [customPhrases, setCustomPhrases] = useState({});
  /* 카테고리별 입력 상태 { ko: '', ja: '' } */
  const [inputs, setInputs] = useState({
    goals: { ...EMPTY_INPUT },
    support: { ...EMPTY_INPUT },
    satisfaction: { ...EMPTY_INPUT },
  });

  useEffect(() => {
    setCustomPhrases(getItem('customPhrases', {}));
  }, []);

  /* 특정 카테고리·언어의 입력값 변경 */
  const handleInput = (cat, langKey, value) => {
    setInputs((prev) => ({
      ...prev,
      [cat]: { ...prev[cat], [langKey]: value },
    }));
  };

  /* 커스텀 문구 추가 — ko/ja 중 하나라도 있으면 저장 */
  const addPhrase = (cat) => {
    const ko = inputs[cat].ko.trim();
    const ja = inputs[cat].ja.trim();
    if (!ko && !ja) return;

    const updated = {
      ...customPhrases,
      [cat]: [...(customPhrases[cat] || []), { ko, ja }],
    };
    setCustomPhrases(updated);
    setItem('customPhrases', updated);
    setInputs((prev) => ({ ...prev, [cat]: { ...EMPTY_INPUT } }));
  };

  /* 커스텀 문구 삭제 */
  const removePhrase = (cat, idx) => {
    const updated = {
      ...customPhrases,
      [cat]: (customPhrases[cat] || []).filter((_, i) => i !== idx),
    };
    setCustomPhrases(updated);
    setItem('customPhrases', updated);
  };

  return (
    <div className={styles.container} data-qa="admin-page">
      <h1 className={styles.title}>{t('admin.title')}</h1>
      <p className={styles.desc}>
        {lang === 'ko'
          ? '문구를 추가·삭제할 수 있습니다. 일본어 문구는 日本語 토글 후 입력하세요.'
          : '文言の追加・削除ができます。'}
      </p>

      {CATEGORIES.map((cat) => (
        <section key={cat} className={styles.section} data-qa={`admin-section-${cat}`}>
          <h2 className={styles.sectionTitle}>{t(CAT_LABEL[cat])}</h2>

          {/* 기본 제공 문구 — 현재 언어만 표시 */}
          <p className={styles.listLabel}>{t('admin.default')} 문구</p>
          <div className={styles.phraseList}>
            {phrases[cat].map((item, idx) => (
              <div key={`d-${idx}`} className={styles.phraseRow}>
                <span className={styles.phraseText}>{item[lang]}</span>
                <span className={styles.defaultBadge}>{t('admin.default')}</span>
              </div>
            ))}
          </div>

          {/* 커스텀 문구 — 현재 언어 값 있는 것만 표시, 없으면 회색 안내 */}
          {(customPhrases[cat] || []).length > 0 && (
            <>
              <p className={styles.listLabel}>추가 문구</p>
              <div className={styles.phraseList}>
                {(customPhrases[cat] || []).map((item, idx) => (
                  <div key={`c-${idx}`} className={styles.phraseRow}>
                    {item[lang] ? (
                      <span className={styles.phraseText}>{item[lang]}</span>
                    ) : (
                      <span className={styles.emptyText}>
                        {lang === 'ko' ? '(한국어 미입력)' : '(日本語未入力)'}
                      </span>
                    )}
                    <button
                      className={styles.deleteBtn}
                      onClick={() => removePhrase(cat, idx)}
                    >
                      {lang === 'ko' ? '삭제' : '削除'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 새 문구 입력 — 현재 언어 칸 하나만 표시 */}
          <div className={styles.addBlock}>
            <div className={styles.inputGroup}>
              <label className={styles.langLabel}>
                {lang === 'ko' ? '🇰🇷 한국어' : '🇯🇵 日本語'}
              </label>
              <div className={styles.addRow}>
                <input
                  className={styles.addInput}
                  type="text"
                  placeholder={lang === 'ko' ? '한국어 문구 입력' : '日本語の文言を入力'}
                  value={inputs[cat][lang]}
                  onChange={(e) => handleInput(cat, lang, e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPhrase(cat)}
                />
                <button
                  className={styles.addBtn}
                  onClick={() => addPhrase(cat)}
                >
                  + {lang === 'ko' ? '추가' : '追加'}
                </button>
              </div>
            </div>
          </div>

        </section>
      ))}
    </div>
  );
};

export default Admin;
