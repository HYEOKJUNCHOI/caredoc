/* 기본정보 입력 폼
   좌측: 프로필·가족·장애·의료·기왕력·과거서비스
   우측: 수급자증·사회관계·주訴·비고 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Edit.module.css';
import GenogramSVG from '../../components/common/GenogramSVG';

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

      {/* ── 상단 공통 ── */}
      <section className={styles.section} data-qa="edit-section-basic-top">
        <h2 className={styles.sectionTitle} style={{ marginBottom: 8 }}>{isJa ? '基本 / 緊急連絡先' : '基本 / 긴급연락처'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('시설명', '施設名')}</label>
            {inp('facilityName', '○○ホーム')}
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
            {inp('emergencyName', isJa ? '山田 花子' : '홍길동')}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('관계', '関係')}</label>
            {inp('emergencyRelation', '例）親戚')}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('전화번호', '電話番号')}</label>
            {inp('emergencyPhone', '000-0000-0000')}
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
              placeholder="山田 太郎"
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
            {inp('nameKana', 'やまだ たろう')}
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
            {inp('address', '例）○○市 ○○町 1-1-1')}
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
            {inp('phoneOffice', '000-0000')}
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
          style={{ padding: '6px 18px', fontSize: 13, border: '1px solid #ccc', borderRadius: 4, background: '#f9f9f9', cursor: 'pointer', marginBottom: 10 }}
        >{isJa ? '＋ 追加' : '＋ 추가'}</button>

        {/* 실시간 미리보기 — normal 모드: width 100% 사용, 컨테이너 높이 명시 필요 없음 */}
        {familyMembers.length > 0 && (
          <div style={{ border: '1px solid #eee', borderRadius: 6, padding: '12px 10px', background: '#fafafa', marginTop: 6, height: 220 }}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>{isJa ? 'プレビュー' : '미리보기'}</div>
            <div style={{ height: 188 }}>
              <GenogramSVG members={familyMembers} selfGender={data.gender || '女性'} />
            </div>
          </div>
        )}
      </section>

      {/* ── 장애 상황 ── */}
      <section className={styles.section} data-qa="edit-section-disability">
        <h2 className={styles.sectionTitle} style={{ marginBottom: 8 }}>障害の状況</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.fieldLabel}>{lbl('장애·질병명', '障害・疾病名')}</label>
            {inp('disabilityName', '例）知的障害')}
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
            {inp('notebookLevel', 'B2')}
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
      </section>

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
                    <input className={styles.input} value={row.hospital || ''} onChange={(e) => updateRow('medicalRows', i, 'hospital', e.target.value)} tabIndex={-1} placeholder={i === 0 ? '例）○○クリニック' : ''} />
                  </td>
                  <td style={tdStyle}>
                    <input className={styles.input} value={row.disease || ''} onChange={(e) => updateRow('medicalRows', i, 'disease', e.target.value)} tabIndex={-1} />
                  </td>
                  <td style={tdStyle}>
                    <input className={styles.input} value={row.medication || ''} onChange={(e) => updateRow('medicalRows', i, 'medication', e.target.value)} tabIndex={-1} placeholder={i === 0 ? '例）毎食後' : ''} />
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
                  <td style={tdStyle}><input className={styles.input} value={row.facility || ''} onChange={(e) => updateRow('pastServiceRows', i, 'facility', e.target.value)} tabIndex={-1} placeholder={i === 0 ? '例）○○事業所' : ''} /></td>
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
            {inp('certNumber', '0000000000')}
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
            {inp('paymentCity', '例）○○市町村')}
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
                <td style={tdStyle}><input className={styles.input} value={row.type || ''} onChange={(e) => updateRow('serviceTypeLaw', i, 'type', e.target.value)} tabIndex={-1} placeholder={i === 0 ? '例）共同生活援助' : ''} /></td>
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
          {inp('consultationOffice', '例）○○障害者支援センター')}
        </div>
      </section>

      {/* ── 사회관계도 ── */}
      <section className={styles.section} data-qa="edit-section-social">
        <h2 className={styles.sectionTitle} style={{ marginBottom: 8 }}>社会関係図</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('관계 기관명 (한 줄에 하나씩)', '関係機関名（1行に1つ）')}</label>
            {inp('socialRelationNodes', '例）○○作業所\n○○マンション\n○○社協', 4)}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{lbl('주요 사업소·기관', '主たる事業所・機関')}</label>
            {inp('mainOffices', '例）○○作業所 ○○マンション', 4)}
          </div>
        </div>
        <div className={styles.field} style={{ marginTop: '10px' }}>
          <label className={styles.fieldLabel}>{lbl('기타 정보', 'その他情報')}</label>
          {inp('otherInfo', '例）○○事業利用中', 2)}
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
            {inp('chiefComplaintFamily', '例）○○（続柄）の希望')}
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
