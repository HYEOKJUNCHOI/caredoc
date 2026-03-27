/* 기본정보 입력 폼
   좌측: 프로필·가족·장애·의료·기왕력·과거서비스
   우측: 수급자증·사회관계·주訴·비고 */

import { useCallback, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Edit.module.css';
import GenogramSVG from '../../components/common/GenogramSVG';

/* 시설명 선택지 */
const FACILITY_OPTIONS = ['生馬ホーム', '奥平ホーム'];

/* 가족 관계 선택지 */
const RELATION_OPTIONS = ['父', '母', '兄', '姉', '弟', '妹', '夫', '妻', '子', 'カスタム'];

/* 한 명만 존재할 수 있는 관계 (중복 불가) */
const UNIQUE_RELATIONS = new Set(['父', '母', '夫', '妻']);

/* kuroshiro 싱글톤 — 최초 1회만 초기화 (kuromoji 사전 ~8MB 로딩) */
let _kuroshiro = null;
const getKuroshiro = async () => {
  if (_kuroshiro) return _kuroshiro;
  const [{ default: Kuroshiro }, { default: KuromojiAnalyzer }] = await Promise.all([
    import('kuroshiro'),
    import('kuroshiro-analyzer-kuromoji'),
  ]);
  _kuroshiro = new Kuroshiro();
  await _kuroshiro.init(new KuromojiAnalyzer());
  return _kuroshiro;
};

/* 반복 행 초기값 헬퍼 */
const initRows = (data, key, count, empty) =>
  data[key]?.length ? data[key] : Array.from({ length: count }, () => ({ ...empty }));

/* 라디오 느낌의 옵션 토글 버튼 */
const ToggleOptions = ({ options, value, onChange }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
    {options.map((opt) => (
      <button
        key={opt}
        type="button"
        tabIndex={-1}
        onClick={() => onChange(value === opt ? '' : opt)}
        style={{
          padding: '3px 10px',
          fontSize: '13px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          background: value === opt ? '#333' : '#fff',
          color: value === opt ? '#fff' : '#333',
          cursor: 'pointer',
        }}
      >
        {opt}
      </button>
    ))}
  </div>
);

const BasicInfoEdit = ({ data, onChange }) => {
  const { i18n } = useTranslation();
  const isJa = i18n.language === 'ja';

  /* 시설명 직접 입력 모드 */
  const [facilityCustomMode, setFacilityCustomMode] = useState(
    () => !!data.facilityName && !FACILITY_OPTIONS.includes(data.facilityName)
  );

  /* ── 장애·질병명 CRUD ── */
  const [disabilityNames, setDisabilityNames] = useState(() => {
    if (data.disabilityNames?.length) return data.disabilityNames;
    return ['精神障害'];
  });
  const [testLoading, setTestLoading] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [addingDisability, setAddingDisability] = useState(false);
  const [addDisabilityText, setAddDisabilityText] = useState('');
  const [editingDisabilityIdx, setEditingDisabilityIdx] = useState(null);
  const [editDisabilityText, setEditDisabilityText] = useState('');
  const disabilityAddRef = useRef(null);

  /* 장애명 변경 시 부모에 동기화 */
  useEffect(() => {
    onChange('disabilityNames', disabilityNames);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabilityNames]);

  useEffect(() => {
    if (addingDisability) setTimeout(() => disabilityAddRef.current?.focus(), 30);
  }, [addingDisability]);

  const addDisabilityName = () => {
    const text = addDisabilityText.trim();
    if (!text) { setAddingDisability(false); return; }
    const updated = [...disabilityNames, text];
    setDisabilityNames(updated);
    setAddDisabilityText('');
    setAddingDisability(false);
  };

  const deleteDisabilityName = (idx) => {
    setDisabilityNames(disabilityNames.filter((_, i) => i !== idx));
    if (editingDisabilityIdx === idx) setEditingDisabilityIdx(null);
  };

  const startEditDisability = (idx) => {
    setEditingDisabilityIdx(idx);
    setEditDisabilityText(disabilityNames[idx] || '');
  };

  const saveDisabilityEdit = (idx) => {
    const text = editDisabilityText.trim();
    if (!text) {
      deleteDisabilityName(idx);
    } else {
      const updated = [...disabilityNames];
      updated[idx] = text;
      setDisabilityNames(updated);
    }
    setEditingDisabilityIdx(null);
  };

  /* ── 후리가나 후보 생성 ──
     1) IME 입력 시 한자 변환 전 히라가나를 캡처 (사용자 의도 독음)
     2) 필드 blur 시 kuroshiro로 사전 독음 추가
     → 최대 2개 후보를 chips로 표시, 클릭하면 ふりがな 필드에 주입 */
  const [furiCandidate, setFuriCandidate] = useState('');
  const [furiLoading, setFuriLoading] = useState(false);

  /* 氏名 필드에서 포커스가 벗어날 때 완성된 한자를 kuroshiro로 변환 → 후보 1개 표시 */
  const handleKanjiBlur = useCallback(async (kanji) => {
    if (!kanji) { setFuriCandidate(''); return; }
    setFuriLoading(true);
    try {
      const k = await getKuroshiro();
      const result = await k.convert(kanji, { to: 'hiragana' });
      const plain = result.replace(/<[^>]+>/g, '').trim();
      setFuriCandidate(plain || '');
    } catch (_) {}
    finally { setFuriLoading(false); }
  }, []);

  /* 후보 클릭 → ふりがな 주입 */
  const selectFurigana = (reading) => {
    onChange('nameKana', reading);
    setFuriCandidate('');
  };

  /* 언어에 따라 라벨 전환 — 일본어 모드: 일본어만 / 한국어 모드: 한국어（日本語）*/
  const lbl = (ko, jp) => isJa ? jp : `${ko}（${jp}）`;

  /* 가족 멤버 조작 헬퍼 */
  const familyMembers = data.familyMembers || [];
  /* 이미 사용된 중복 불가 관계 집합 */
  const usedUnique = new Set(
    familyMembers.filter((m) => UNIQUE_RELATIONS.has(m.relation)).map((m) => m.relation)
  );

  /* 추가 시 기본값: 아직 안 쓴 중복 불가 관계 우선 → 없으면 兄 */
  const nextDefaultRelation = () => {
    for (const r of RELATION_OPTIONS) {
      if (UNIQUE_RELATIONS.has(r) && !usedUnique.has(r)) return r;
    }
    return '兄';
  };

  const addMember = () => {
    onChange('familyMembers', [
      ...familyMembers,
      { id: Date.now().toString(), relation: nextDefaultRelation(), name: '', customRelation: '' },
    ]);
  };

  /* 특정 행의 드롭다운에서 보여줄 옵션:
     - 중복 불가 항목은 다른 행에서 이미 쓰고 있으면 숨김
     - 단, 현재 행 자신이 선택한 값은 항상 표시 */
  const availableOptions = (currentId, currentRelation) =>
    RELATION_OPTIONS.filter((opt) => {
      if (!UNIQUE_RELATIONS.has(opt)) return true;            // 중복 가능 → 항상 표시
      if (opt === currentRelation) return true;               // 내 현재 값 → 표시
      return !usedUnique.has(opt);                            // 다른 행에서 미사용 → 표시
    });
  const updateMember = (id, field, val) => {
    onChange('familyMembers', familyMembers.map((m) => m.id === id ? { ...m, [field]: val } : m));
  };
  const removeMember = (id) => {
    onChange('familyMembers', familyMembers.filter((m) => m.id !== id));
  };

  /* 반복 행 업데이트 헬퍼 */
  const updateRow = (key, idx, field, val) => {
    const rows = initRows(data, key, key === 'medicalRows' ? 3 : key === 'pastServiceRows' ? 3 : 3,
      key === 'medicalRows' ? { hospital: '', disease: '', medication: '' }
      : key === 'pastServiceRows' ? { serviceName: '', facility: '', period: '' }
      : { type: '', amount: '' }
    );
    const updated = rows.map((r, i) => i === idx ? { ...r, [field]: val } : r);
    onChange(key, updated);
  };

  const medicalRows     = initRows(data, 'medicalRows',     3, { hospital: '', disease: '', medication: '' });
  const pastServiceRows = initRows(data, 'pastServiceRows', 3, { serviceName: '', facility: '', period: '' });
  const serviceTypeLaw  = initRows(data, 'serviceTypeLaw',  3, { type: '', amount: '' });
  const serviceTypeLocal= initRows(data, 'serviceTypeLocal',3, { type: '', amount: '' });

  /* ── 테스트 데이터 일괄 입력 ──
     개인정보(이름·생년월일·전화)는 무작위, 나머지는 공통값 사용 */
  const fillTestData = () => {
    const pool = [
      ['田中　一郎', 'たなか　いちろう', '男性'],
      ['山田　太郎', 'やまだ　たろう',   '男性'],
      ['佐藤　健二', 'さとう　けんじ',   '男性'],
      ['鈴木　正志', 'すずき　まさし',   '男性'],
      ['中村　浩三', 'なかむら　こうぞう','男性'],
      ['山本　花子', 'やまもと　はなこ', '女性'],
      ['小林　由美', 'こばやし　ゆみ',   '女性'],
      ['加藤　幸子', 'かとう　さちこ',   '女性'],
      ['伊藤　雅子', 'いとう　まさこ',   '女性'],
      ['渡辺　里美', 'わたなべ　さとみ', '女性'],
    ];
    const emPool = [
      ['父', '田中　次郎'], ['母', '山本　幸子'], ['兄', '佐藤　一男'],
      ['姉', '鈴木　和子'], ['夫', '中村　博'],   ['妻', '加藤　美智子'],
    ];
    const rnd = (max) => Math.floor(Math.random() * max);
    const rndPhone = (prefix = '0') =>
      `${prefix}${String(rnd(90) + 10)}-${String(rnd(9000) + 1000)}-${String(rnd(9000) + 1000)}`;

    const [kanji, kana, gender] = pool[rnd(pool.length)];
    const [emRelation, emName]  = emPool[rnd(emPool.length)];
    const year  = 1960 + rnd(35);
    const month = String(rnd(12) + 1).padStart(2, '0');
    const day   = String(rnd(28) + 1).padStart(2, '0');

    /* 개인정보 — 무작위 */
    onChange('nameKanji',        kanji);
    onChange('nameKana',         kana);
    onChange('gender',           gender);
    onChange('birthDate',        `${year}-${month}-${day}`);
    onChange('phoneMobile',      `080-${String(rnd(9000) + 1000)}-${String(rnd(9000) + 1000)}`);
    onChange('phoneOffice',      rndPhone());
    onChange('emergencyName',    emName);
    onChange('emergencyRelation',emRelation);
    onChange('emergencyPhone',   `090-${String(rnd(9000) + 1000)}-${String(rnd(9000) + 1000)}`);

    /* 공통 고정값 */
    onChange('facilityName',     '生馬ホーム');
    onChange('address',          '白浜町中嶋44');
    onChange('residenceType',    'グループホーム等');
    onChange('disabilityName',   '両下肢機能全廃（1級）、二分脊椎排便排尿障害（4級）');
    onChange('notebookType',     '療育手帳');
    onChange('notebookLevel',    'B2');
    onChange('disabilityPension','1級');
    onChange('careInsurance',    '無');
    onChange('disabilityOverview',   '車椅子を使用しており、日常生活全般に介助が必要。意思疎通は良好で、自分の意見をしっかりと伝えられる。');
    onChange('careLevel',            '');
    onChange('medicalRows', [
      { hospital: 'こころの医療センター', disease: '統合失調症',   medication: '3食後、寝る前' },
      { hospital: '紀南病院泌尿器科',     disease: '排尿障害',     medication: '導尿（自己）' },
      { hospital: '南和歌山医療センター', disease: '高血圧',       medication: '朝1錠' },
      { hospital: '南紀整形外科',         disease: '脊椎側弯症',   medication: 'リハビリ週1回' },
    ]);
    onChange('historyBirth',         '大阪府堺市にて出生。出生時より二分脊椎の診断を受ける。');
    onChange('historyKindergarten',  '南紀福祉センター療育園（3歳〜6歳）');
    onChange('historyElementary',    '安居小学校入学後、愛徳整肢園へ転院。小4より南紀養護学校へ転校。');
    onChange('historyJuniorHigh',    '南紀養護学校中学部');
    onChange('historySeniorHigh',    '南紀養護学校高等部');
    onChange('historyOtherSchool',   '');
    onChange('historyAdult',         'いきいき作業所（H.20〜H.27）→ふたば作業所（H.28.4〜現在）');
    onChange('pastServiceRows', [
      { serviceName: '移動支援',   facility: 'すてっぷ',       period: 'H.28〜現在' },
      { serviceName: '日中一時支援', facility: '奥平デイサービス', period: 'R.2〜現在' },
      { serviceName: '居宅介護',   facility: 'ヘルパーステーション白浜', period: 'R.3〜現在' },
    ]);
    onChange('supportLevel',    '4');
    onChange('certValidFrom',   '2022-09-01');
    onChange('certValidTo',     '2025-08-31');
    onChange('paymentCity',     '白浜町');
    onChange('certIssuedDate',  '2022-09-20');
    onChange('certNumber',      `401${String(rnd(90000000) + 10000000)}`);
    onChange('serviceTypeLaw', [
      { type: '共同生活援助（グループホーム）', amount: '' },
      { type: '生活介護',                       amount: '' },
      { type: '居宅介護',                       amount: '36h/月（1回2hまで）' },
    ]);
    onChange('serviceTypeLocal', [
      { type: '日中一時支援（デイサービス）', amount: '2日/月' },
      { type: '移動支援（身体介護有）',       amount: '7h/月' },
      { type: '',                               amount: '' },
    ]);
    onChange('consultationOffice',   '西牟婁障害者支援センター　リーふ');
    onChange('socialRelationNodes',  'ヘルパー\nふたば作業所\n奥平マンション\n訪着すてっぷ');
    onChange('mainOffices',          'ふたば作業所　奥平マンション');
    onChange('otherInfo',            '田辺市社協権利擁護事業利用（金銭管理）2か月に1回');
    onChange('chiefComplaintGeneral','いろいろなことを経験したい');
    onChange('chiefComplaintWork',   '給料をたくさん稼ぎたい');
    onChange('chiefComplaintLife',   '奥平マンションで良い。できることは自分でやる');
    onChange('chiefComplaintOther',  '長期休暇には実家に帰省するのを楽しみにしている');
    onChange('chiefComplaintFamily', '家族が定期的に様子を見にきてくれる。');
    onChange('remarks',              '毎月第3木曜日にケース会議を実施。緊急時は施設長へ連絡すること。');
    onChange('bloodType', ['A','B','O','AB'][rnd(4)]);
    onChange('familyMembers', [
      { id: '1', relation: '父', name: '', customRelation: '' },
      { id: '2', relation: '母', name: '', customRelation: '' },
    ]);

    /* 로컬 상태 동기화 */
    setDisabilityNames(['両下肢機能全廃（1級）', '二分脊椎排便排尿障害（4級）']);
    setFacilityCustomMode(false);
  };

  /* 테스트 데이터 전체 초기화 */
  const clearTestData = () => {
    const fields = [
      'nameKanji','nameKana','gender','birthDate','phoneMobile','phoneOffice',
      'emergencyName','emergencyRelation','emergencyPhone','facilityName',
      'address','residenceType','disabilityName','disabilityOverview',
      'notebookType','notebookLevel','disabilityPension','careInsurance','careLevel',
      'historyBirth','historyKindergarten','historyElementary','historyJuniorHigh',
      'historySeniorHigh','historyOtherSchool','historyAdult',
      'supportLevel','certValidFrom','certValidTo','paymentCity','certIssuedDate','certNumber',
      'consultationOffice','socialRelationNodes','mainOffices','otherInfo',
      'chiefComplaintGeneral','chiefComplaintWork','chiefComplaintLife',
      'chiefComplaintOther','chiefComplaintFamily','bloodType','remarks',
    ];
    fields.forEach(f => onChange(f, ''));
    onChange('medicalRows',     [{},{},{},{}]);
    onChange('pastServiceRows', [{},{},{}]);
    onChange('serviceTypeLaw',  [{}]);
    onChange('serviceTypeLocal',[{}]);
    onChange('familyMembers',   []);
    setDisabilityNames([]);
    setFacilityCustomMode(false);
  };

  const inp = (field, placeholder = '', rows = 0) => rows > 0 ? (
    <textarea
      className={styles.textarea}
      rows={rows}
      placeholder={placeholder}
      value={data[field] || ''}
      onChange={(e) => onChange(field, e.target.value)}
      tabIndex={-1}
    />
  ) : (
    <input
      className={styles.input}
      type="text"
      placeholder={placeholder}
      value={data[field] || ''}
      onChange={(e) => onChange(field, e.target.value)}
      tabIndex={-1}
    />
  );

  const dateInp = (field) => (
    <input
      className={styles.input}
      type="date"
      value={data[field] || ''}
      onChange={(e) => onChange(field, e.target.value)}
      tabIndex={-1}
      onFocus={(e) => { try { e.target.showPicker(); } catch (_) {} }}
    />
  );

  return (
    <div className={styles.formBody}>

      {/* ── 테스트 데이터 로딩 오버레이 ── */}
      {testLoading && (
        <div className={styles.testLoadingOverlay}>
          <div className={styles.testLoadingSpinner} />
          <span>{isJa ? 'データを入力中...' : '데이터 입력 중...'}</span>
        </div>
      )}

      {/* ── 테스트 데이터 슬라이드 토글 ── */}
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

      {/* ── 상단 공통 ── */}
      <section className={styles.section} data-qa="edit-section-basic-top">
        <h2 className={styles.sectionTitle} style={{ marginBottom: 8 }}>{isJa ? '基本 / 緊急連絡先' : '基本 / 긴급연락처'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('시설명', '施設名')}</label>
            <select
              className={styles.input}
              value={facilityCustomMode ? '__custom__' : (data.facilityName || '')}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setFacilityCustomMode(true);
                  onChange('facilityName', '');
                } else {
                  setFacilityCustomMode(false);
                  onChange('facilityName', e.target.value);
                }
              }}
              tabIndex={-1}
            >
              <option value="" disabled hidden>{isJa ? '選択してください' : '선택해주세요'}</option>
              {FACILITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
              <option value="__custom__">{isJa ? '直接入力' : '직접 입력'}</option>
            </select>
            {facilityCustomMode && (
              <input
                className={styles.input}
                style={{ marginTop: 6 }}
                placeholder={isJa ? '施設名を入力...' : '시설명 입력...'}
                value={data.facilityName || ''}
                onChange={(e) => onChange('facilityName', e.target.value)}
                autoFocus
              />
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('혈액형', '血液型')}</label>
            <ToggleOptions
              options={['A', 'B', 'O', 'AB', '不明']}
              value={data.bloodType || ''}
              onChange={(v) => onChange('bloodType', v)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('긴급연락처 성명', '緊急時の連絡先')}</label>
            {inp('emergencyName', isJa ? '氏名を入力' : '성명 입력')}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('관계', '関係')}</label>
            {inp('emergencyRelation', isJa ? '続柄を入力' : '관계 입력')}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('전화번호', '電話番号')}</label>
            {inp('emergencyPhone', isJa ? '電話番号を入力' : '전화번호 입력')}
          </div>
        </div>
      </section>

      {/* ── 프로필 ── */}
      <section className={styles.section} data-qa="edit-section-profile">
        <h2 className={styles.sectionTitle} style={{ marginBottom: 8 }}>プロフィール</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('성명 한자', '氏名')}</label>
            <input
              className={styles.input}
              type="text"
              placeholder={isJa ? '氏名（漢字）を入力' : '성명(한자) 입력'}
              value={data.nameKanji || ''}
              onChange={(e) => onChange('nameKanji', e.target.value)}
              onBlur={(e) => handleKanjiBlur(e.target.value)}
              tabIndex={-1}
            />
            {/* 후리가나 후보 — blur 시 kuroshiro 변환 결과 */}
            {(furiLoading || furiCandidate) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: '#aaa' }}>{isJa ? '候補：' : '후보:'}</span>
                {furiLoading
                  ? <span style={{ fontSize: 11, color: '#bbb' }}>変換中…</span>
                  : <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => selectFurigana(furiCandidate)}
                      style={{
                        padding: '2px 14px',
                        fontSize: 13,
                        border: '1px solid #5a9',
                        borderRadius: 14,
                        background: '#f2faf6',
                        color: '#2a7a55',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >{furiCandidate}</button>
                }
              </div>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('성명 후리가나', 'ふりがな')}</label>
            {inp('nameKana', isJa ? 'ふりがなを入力' : '후리가나 입력')}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('생년월일', '生年月日')}</label>
            {dateInp('birthDate')}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('성별', '性別')}</label>
            <ToggleOptions
              options={['男性', '女性']}
              value={data.gender || ''}
              onChange={(v) => onChange('gender', v)}
            />
          </div>
          <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.fieldLabel}>{lbl('주소', '住所')}</label>
            {inp('address', isJa ? '住所を入力' : '주소 입력')}
          </div>
          <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.fieldLabel}>{lbl('주거상황', '住居状況')}</label>
            <ToggleOptions
              options={['持家', '賃貸共同住宅', 'グループホーム等', 'その他']}
              value={data.residenceType || ''}
              onChange={(v) => onChange('residenceType', v)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('전화 자택', '自宅電話')}</label>
            {inp('phoneHome')}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('전화 홈', 'ホーム電話')}</label>
            {inp('phoneOffice', isJa ? '番号を入力' : '번호 입력')}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('휴대전화', '携帯電話')}</label>
            {inp('phoneMobile')}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('이메일', 'メールアドレス')}</label>
            {inp('email')}
          </div>
        </div>
      </section>

      {/* ── 가족 상황 (제노그램) ── */}
      <section className={styles.section} data-qa="edit-section-family">
        <h2 className={styles.sectionTitle} style={{ marginBottom: 6 }}>家族状況</h2>
        <p style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
          {isJa
            ? '関係を選んで名前（任意）を入力してください。'
            : '관계를 선택하고 이름(선택)을 입력하세요. 순서는 자동 정렬됩니다.'}
        </p>

        {familyMembers.map((m) => (
          <div key={m.id} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            {/* 고인 체크박스 — 체크 시 제노그램 심볼이 채워짐 */}
            <input
              type="checkbox"
              checked={!!m.deceased}
              onChange={(e) => updateMember(m.id, 'deceased', e.target.checked)}
              tabIndex={-1}
              title={isJa ? '故人' : '고인'}
              style={{ width: 16, height: 16, accentColor: '#555', cursor: 'pointer', flexShrink: 0 }}
            />

            {/* 관계 드롭다운 — 이미 추가된 중복 불가 관계는 숨김 */}
            <select
              value={m.relation}
              onChange={(e) => updateMember(m.id, 'relation', e.target.value)}
              tabIndex={-1}
              style={{ padding: '5px 8px', fontSize: 13, border: '1px solid #ccc', borderRadius: 4, minWidth: 110 }}
            >
              {availableOptions(m.id, m.relation).map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'カスタム' ? (isJa ? 'カスタム（直接入力）' : 'カスタム（직접입력）') : opt}
                </option>
              ))}
            </select>

            {/* 직접입력 시 관계명 필드 */}
            {m.relation === 'カスタム' && (
              <input
                className={styles.input}
                placeholder={isJa ? '関係名' : '관계명'}
                value={m.customRelation || ''}
                onChange={(e) => updateMember(m.id, 'customRelation', e.target.value)}
                tabIndex={-1}
                style={{ width: 80 }}
              />
            )}

            {/* 이름 */}
            <input
              className={styles.input}
              placeholder={isJa ? '名前' : '이름（名前）'}
              value={m.name || ''}
              onChange={(e) => updateMember(m.id, 'name', e.target.value)}
              tabIndex={-1}
              style={{ flex: 1 }}
            />

            {/* 삭제 */}
            <button
              type="button"
              tabIndex={-1}
              onClick={() => removeMember(m.id)}
              style={{ padding: '4px 10px', fontSize: 13, border: '1px solid #ddd', borderRadius: 4, background: '#fff', color: '#aaa', cursor: 'pointer', flexShrink: 0 }}
            >✕</button>
          </div>
        ))}

        <button
          type="button"
          tabIndex={-1}
          onClick={addMember}
          style={{ padding: '6px 18px', fontSize: 13, border: '1px solid #ccc', borderRadius: 4, background: '#f9f9f9', cursor: 'pointer', marginBottom: 10, marginLeft: 30 }}
        >{isJa ? '＋ 追加' : '＋ 추가'}</button>

        {familyMembers.length > 0 && (
          <div style={{ border: '1px solid #eee', borderRadius: 6, padding: '10px', background: '#fafafa', marginTop: 4, height: 210 }}>
            <GenogramSVG members={familyMembers} selfGender={data.gender || '女性'} />
          </div>
        )}
      </section>

      {/* ── 장애 상황 ── */}
      <div className={styles.spBox} data-qa="edit-section-disability">
        <div className={styles.spBoxHeader}>障害の状況</div>
        <div className={styles.spBoxBody}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.fieldLabel}>{lbl('장애·질병명', '障害・疾病名')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              {disabilityNames.map((name, idx) => (
                editingDisabilityIdx === idx ? (
                  <div key={idx} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input
                      autoFocus
                      className={styles.input}
                      value={editDisabilityText}
                      onChange={(e) => setEditDisabilityText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveDisabilityEdit(idx);
                        if (e.key === 'Escape') setEditingDisabilityIdx(null);
                      }}
                      tabIndex={-1}
                      style={{ minWidth: 120 }}
                    />
                    <button type="button" tabIndex={-1} onClick={() => saveDisabilityEdit(idx)}
                      style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #5a9', borderRadius: 4, background: '#f2faf6', cursor: 'pointer' }}>✓</button>
                    <button type="button" tabIndex={-1} onClick={() => setEditingDisabilityIdx(null)}
                      style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4, background: '#fff', cursor: 'pointer' }}>✕</button>
                  </div>
                ) : (
                  <span key={idx} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', border: '1px solid #bbb', borderRadius: 14,
                    background: '#f7f7f7', fontSize: 13, cursor: 'pointer',
                  }}>
                    <span onClick={() => startEditDisability(idx)} style={{ cursor: 'text' }}>{name}</span>
                    <span onClick={() => deleteDisabilityName(idx)} style={{ color: '#aaa', cursor: 'pointer', marginLeft: 2 }}>✕</span>
                  </span>
                )
              ))}
            </div>
            {addingDisability ? (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  ref={disabilityAddRef}
                  className={styles.input}
                  placeholder={isJa ? '疾病名を入力...' : '질병명 입력...'}
                  value={addDisabilityText}
                  onChange={(e) => setAddDisabilityText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addDisabilityName();
                    if (e.key === 'Escape') { setAddingDisability(false); setAddDisabilityText(''); }
                  }}
                  tabIndex={-1}
                  style={{ minWidth: 140 }}
                />
                <button type="button" tabIndex={-1} onClick={addDisabilityName}
                  style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #5a9', borderRadius: 4, background: '#f2faf6', cursor: 'pointer' }}>✓</button>
                <button type="button" tabIndex={-1} onClick={() => { setAddingDisability(false); setAddDisabilityText(''); }}
                  style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4, background: '#fff', cursor: 'pointer' }}>✕</button>
              </div>
            ) : (
              <button type="button" tabIndex={-1} onClick={() => { setAddingDisability(true); setAddDisabilityText(''); }}
                style={{ padding: '4px 14px', fontSize: 12, border: '1px solid #ccc', borderRadius: 4, background: '#fff', cursor: 'pointer' }}>
                + {isJa ? '追加' : '추가'}
              </button>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('수첩 종류', '手帳種別')}</label>
            <ToggleOptions
              options={['療育手帳', '精神障害手帳', '身体障害手帳']}
              value={data.notebookType || ''}
              onChange={(v) => onChange('notebookType', v)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('수첩 등급', '等級')}</label>
            {inp('notebookLevel', isJa ? '等級を入力（例：B2）' : '등급 입력')}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('장애연금', '障害年金')}</label>
            <ToggleOptions
              options={['1級', '2級', 'なし']}
              value={data.disabilityPension || ''}
              onChange={(v) => onChange('disabilityPension', v)}
            />
          </div>
          <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.fieldLabel}>{lbl('개요', '概況')}</label>
            {inp('disabilityOverview', '', 3)}
          </div>
        </div>
        </div>
      </div>

      {/* ── 개호보험 ── */}
      <section className={styles.section} data-qa="edit-section-care">
        <h2 className={styles.sectionTitle} style={{ marginBottom: 8 }}>介護保険</h2>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('개호보험', '介護保険')}</label>
            <ToggleOptions
              options={['有', '無']}
              value={data.careInsurance || ''}
              onChange={(v) => onChange('careInsurance', v)}
            />
          </div>
          <div className={styles.field} style={{ flex: 1 }}>
            <label className={styles.fieldLabel}>{lbl('개호도', '介護度')}</label>
            {inp('careLevel')}
          </div>
        </div>
      </section>

      {/* ── 의료기관·복약 ── */}
      <section className={styles.section} data-qa="edit-section-medical">
        <h2 className={styles.sectionTitle} style={{ marginBottom: 8 }}>医療機関・服薬状況</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={thStyle}>{lbl('병원·진료과목', '病院・診療科目')}</th>
                <th style={thStyle}>{lbl('주요 질환', '主たる疾患等')}</th>
                <th style={thStyle}>{lbl('복약', '服薬')}</th>
              </tr>
            </thead>
            <tbody>
              {medicalRows.map((row, i) => (
                <tr key={i}>
                  <td style={tdStyle}>
                    <input className={styles.input} value={row.hospital || ''} onChange={(e) => updateRow('medicalRows', i, 'hospital', e.target.value)} tabIndex={-1} placeholder={isJa ? '病院名を入力' : '병원명 입력'} />
                  </td>
                  <td style={tdStyle}>
                    <input className={styles.input} value={row.disease || ''} onChange={(e) => updateRow('medicalRows', i, 'disease', e.target.value)} tabIndex={-1} />
                  </td>
                  <td style={tdStyle}>
                    <input className={styles.input} value={row.medication || ''} onChange={(e) => updateRow('medicalRows', i, 'medication', e.target.value)} tabIndex={-1} placeholder={isJa ? '服薬情報を入力' : '복약 정보 입력'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 기왕력 ── */}
      <section className={styles.section} data-qa="edit-section-history">
        <h2 className={styles.sectionTitle} style={{ marginBottom: 8 }}>既往</h2>
        <div style={{ display: 'grid', gap: '10px' }}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('출생·영유아기', '出生・乳幼児期')}</label>
            {inp('historyBirth', '', 2)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              ['historyKindergarten', lbl('보육원·유치원', '保育所・幼稚園')],
              ['historyElementary',   lbl('초등학교', '小学校')],
              ['historyJuniorHigh',   lbl('중학교', '中学校')],
              ['historySeniorHigh',   lbl('고등학교', '高等学校')],
              ['historyOtherSchool',  lbl('기타', 'その他')],
            ].map(([key, label]) => (
              <div key={key} className={styles.field}>
                <label className={styles.fieldLabel}>{label}</label>
                {inp(key)}
              </div>
            ))}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('성인기', '成人期')}</label>
            {inp('historyAdult', '', 3)}
          </div>
        </div>
      </section>

      {/* ── 과거 서비스 이용 ── */}
      <section className={styles.section} data-qa="edit-section-past-service">
        <h2 className={styles.sectionTitle} style={{ marginBottom: 8 }}>過去のサービス利用</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={thStyle}>{lbl('서비스명', 'サービス名')}</th>
                <th style={thStyle}>{lbl('사업소명', '事業所名')}</th>
                <th style={thStyle}>{lbl('이용시기·기간', '利用時期・利用期間')}</th>
              </tr>
            </thead>
            <tbody>
              {pastServiceRows.map((row, i) => (
                <tr key={i}>
                  <td style={tdStyle}><input className={styles.input} value={row.serviceName || ''} onChange={(e) => updateRow('pastServiceRows', i, 'serviceName', e.target.value)} tabIndex={-1} /></td>
                  <td style={tdStyle}><input className={styles.input} value={row.facility || ''} onChange={(e) => updateRow('pastServiceRows', i, 'facility', e.target.value)} tabIndex={-1} placeholder={isJa ? '事業所名を入力' : '사업소명 입력'} /></td>
                  <td style={tdStyle}><input className={styles.input} value={row.period || ''} onChange={(e) => updateRow('pastServiceRows', i, 'period', e.target.value)} tabIndex={-1} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 수급자증 ── */}
      <section className={styles.section} data-qa="edit-section-cert">
        <h2 className={styles.sectionTitle} style={{ marginBottom: 8 }}>受給者証</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('지원구분', '支援区分')}</label>
            <ToggleOptions
              options={['1', '2', '3', '4', '5', '6']}
              value={data.supportLevel || ''}
              onChange={(v) => onChange('supportLevel', v)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('번호', '番号')}</label>
            {inp('certNumber', isJa ? '受給者証番号を入力' : '수급자증 번호 입력')}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('인정유효기간 시작', '認定有効期間 開始')}</label>
            {dateInp('certValidFrom')}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('인정유효기간 종료', '認定有効期間 終了')}</label>
            {dateInp('certValidTo')}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('지급 시정촌', '支給市町村')}</label>
            {inp('paymentCity', isJa ? '市町村名を入力' : '시정촌명 입력')}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('교부 연월일', '交付年月日')}</label>
            {dateInp('certIssuedDate')}
          </div>
        </div>

        {/* 서비스 종별 (지원법) */}
        <h3 style={{ fontSize: '13px', margin: '14px 0 6px', color: '#555' }}>サービス種別（支援法）</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={thStyle}>{lbl('서비스 종별', 'サービス種別')}</th>
              <th style={thStyle}>{lbl('지급량', '支給量 / 日数/月')}</th>
            </tr>
          </thead>
          <tbody>
            {serviceTypeLaw.map((row, i) => (
              <tr key={i}>
                <td style={tdStyle}><input className={styles.input} value={row.type || ''} onChange={(e) => updateRow('serviceTypeLaw', i, 'type', e.target.value)} tabIndex={-1} placeholder={isJa ? 'サービス種別を入力' : '서비스 종별 입력'} /></td>
                <td style={tdStyle}><input className={styles.input} value={row.amount || ''} onChange={(e) => updateRow('serviceTypeLaw', i, 'amount', e.target.value)} tabIndex={-1} /></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 서비스 종별 (지역생활지원) */}
        <h3 style={{ fontSize: '13px', margin: '14px 0 6px', color: '#555' }}>サービス種別（地域生活支援事業）</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={thStyle}>{lbl('서비스 종별', 'サービス種別')}</th>
              <th style={thStyle}>{lbl('지급량', '支給量')}</th>
            </tr>
          </thead>
          <tbody>
            {serviceTypeLocal.map((row, i) => (
              <tr key={i}>
                <td style={tdStyle}><input className={styles.input} value={row.type || ''} onChange={(e) => updateRow('serviceTypeLocal', i, 'type', e.target.value)} tabIndex={-1} /></td>
                <td style={tdStyle}><input className={styles.input} value={row.amount || ''} onChange={(e) => updateRow('serviceTypeLocal', i, 'amount', e.target.value)} tabIndex={-1} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── 상담지원사업소 ── */}
      <section className={styles.section} data-qa="edit-section-consultation">
        <h2 className={styles.sectionTitle} style={{ marginBottom: 8 }}>相談支援事業所</h2>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>{lbl('상담지원사업소명', '事業所名')}</label>
          {inp('consultationOffice', isJa ? '事業所名を入力' : '사업소명 입력')}
        </div>
      </section>

      {/* ── 사회관계도 ── */}
      <section className={styles.section} data-qa="edit-section-social">
        <h2 className={styles.sectionTitle} style={{ marginBottom: 8 }}>社会関係図</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('관계 기관명 (한 줄에 하나씩)', '関係機関名（1行に1つ）')}</label>
            {inp('socialRelationNodes', isJa ? '関係機関名を入力（1行に1つ）' : '관계기관명 입력（한 줄에 하나씩）', 4)}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('주요 사업소·기관', '主たる事業所・機関')}</label>
            {inp('mainOffices', isJa ? '主たる事業所・機関名を入力' : '주요 사업소·기관명 입력', 4)}
          </div>
        </div>
        <div className={styles.field} style={{ marginTop: '10px' }}>
          <label className={styles.fieldLabel}>{lbl('기타 정보', 'その他情報')}</label>
          {inp('otherInfo', isJa ? 'その他の情報を入力' : '기타 정보 입력', 2)}
        </div>
      </section>

      {/* ── 주訴 ── */}
      <section className={styles.section} data-qa="edit-section-complaint">
        <h2 className={styles.sectionTitle} style={{ marginBottom: 8 }}>当該事業所利用時の主訴</h2>
        <div style={{ display: 'grid', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              ['chiefComplaintGeneral', lbl('본인 전반', '本人 全般')],
              ['chiefComplaintWork',    lbl('본인 취로', '本人 就労')],
              ['chiefComplaintLife',    lbl('본인 생활', '本人 生活')],
              ['chiefComplaintOther',   lbl('본인 기타', '本人 その他')],
            ].map(([key, label]) => (
              <div key={key} className={styles.field}>
                <label className={styles.fieldLabel}>{label}</label>
                {inp(key)}
              </div>
            ))}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('가족', '家族')}</label>
            {inp('chiefComplaintFamily', isJa ? '家族の主訴を入力' : '가족 주訴 입력')}
          </div>
        </div>
      </section>

      {/* ── 비고 ── */}
      <section className={styles.section} data-qa="edit-section-remarks">
        <h2 className={styles.sectionTitle} style={{ marginBottom: 8 }}>備考</h2>
        <div className={styles.field}>
          {inp('remarks', '', 4)}
        </div>
      </section>

    </div>
  );
};

/* 인라인 테이블 공통 스타일 */
const thStyle = {
  border: '1px solid #ddd',
  padding: '6px 8px',
  textAlign: 'left',
  fontWeight: '600',
  fontSize: '12px',
  whiteSpace: 'nowrap',
};
const tdStyle = {
  border: '1px solid #eee',
  padding: '4px',
};

export default BasicInfoEdit;
