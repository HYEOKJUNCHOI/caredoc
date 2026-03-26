/* 基本情報 A4 가로 렌더링
   - data: goPreview()에서 저장된 스냅샷
   - user: 이용자 정보 (name, manager)
   - writeDate: 기입 연월일 */

import s from './BasicInfo.module.css';
import GenogramSVG from '../../../components/common/GenogramSVG';

/* YYYY-MM-DD → 일본 원호(元号) 표기 변환 */
const toJaEra = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const num = y * 10000 + m * 100 + day;
  let era, ey;
  if (num >= 20190501)      { era = '令和'; ey = y - 2018; }
  else if (num >= 19890108) { era = '平成'; ey = y - 1988; }
  else if (num >= 19261225) { era = '昭和'; ey = y - 1925; }
  else                      { return `${y}年${m}月${day}日`; }
  return `${era}${ey}年${m}月${day}日`;
};

/* 나이 자동 계산 */
const calcAge = (iso) => {
  if (!iso) return '';
  const birth = new Date(iso);
  if (isNaN(birth)) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

/* YYYY-MM-DD → 令和YY年MM月DD日 단축형 */
const toJaShort = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const num = y * 10000 + m * 100 + day;
  let abbr, ey;
  if (num >= 20190501)      { abbr = 'R'; ey = y - 2018; }
  else if (num >= 19890108) { abbr = 'H'; ey = y - 1988; }
  else if (num >= 19261225) { abbr = 'S'; ey = y - 1925; }
  else                      { abbr = `${y}`; ey = ''; }
  return `${abbr}${ey}年${m}月${day}日`;
};

/* 유효기간 범위 표시 */
const certPeriod = (from, to) => {
  if (!from && !to) return '';
  return `${toJaEra(from)} 〜 ${toJaEra(to)}`;
};

/* 사회관계도 SVG — 본인을 중심으로 최대 5개 기관을 타원으로 배치 */
const SocialDiagramSVG = ({ nodes }) => {
  const items = (nodes || '')
    .split('\n')
    .map((str) => str.trim())
    .filter(Boolean)
    .slice(0, 5);

  /* 本人 위치 + 주변 기관 위치 (x, y) */
  const cx = 200, cy = 65;
  const positions = [
    [70,  32],
    [340, 32],
    [200, 108],
    [70,  105],
    [340, 105],
  ];

  const ovalRx = (text) => Math.max(28, text.length * 3.8);

  return (
    <svg
      viewBox="0 0 420 130"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
    >
      <defs>
        <marker id="arr-end" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <polygon points="0 0, 5 2.5, 0 5" fill="#333" />
        </marker>
        <marker id="arr-start" markerWidth="5" markerHeight="5" refX="1" refY="2.5" orient="auto-start-reverse">
          <polygon points="0 0, 5 2.5, 0 5" fill="#333" />
        </marker>
      </defs>

      {/* 연결선 — 양방향 화살표 */}
      {items.map((_, i) => {
        const [px, py] = positions[i];
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={px} y2={py}
            stroke="#444"
            strokeWidth="0.7"
            markerStart="url(#arr-start)"
            markerEnd="url(#arr-end)"
          />
        );
      })}

      {/* 本人 타원 — 흰색 배경, 굵은 테두리로 강조 */}
      <ellipse cx={cx} cy={cy} rx="24" ry="12" fill="#fff" stroke="#000" strokeWidth="2" />
      <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize="8" fontWeight="bold">本人</text>

      {/* 기관 타원 */}
      {items.map((item, i) => {
        const [px, py] = positions[i];
        const rx = ovalRx(item);
        return (
          <g key={i}>
            <ellipse cx={px} cy={py} rx={rx} ry="12" fill="#fff" stroke="#000" strokeWidth="0.8" />
            <text x={px} y={py + 3.5} textAnchor="middle" fontSize="7">{item}</text>
          </g>
        );
      })}
    </svg>
  );
};

/* TODO: 테스트용 샘플 데이터 — 확인 후 삭제 */
const SAMPLE_DATA = {
  nameKana: 'まつもと　ちひろ', nameKanji: '松本　千裕',
  birthDate: '1990-08-14', gender: '女性',
  address: '白浜町中嶋44', residenceType: 'グループホーム等',
  phoneOffice: '34-8811', phoneMobile: '080-8535-3857',
  emergencyName: '父', emergencyPhone: '090-6985-0202',
  facilityName: 'ふたば神島ホーム',
  disabilityName: '両下肢機能全廃（1級）、二分脊椎排便排尿障害（4級）',
  notebookType: '療育手帳　B2　身体障害者手帳', notebookLevel: '1',
  disabilityPension: '1', careInsurance: '無',
  medicalRows: [
    { hospital: 'こころの医療センター', disease: '', medication: '3食後、寝る前' },
    { hospital: '紀南病院泌尿器科', disease: '排尿障害', medication: '' },
    { hospital: '南和歌山皮膚科', disease: '真寿苑クリニック', medication: '南紀医療センター 歯科' },
    { hospital: '整形外科', disease: '高血圧', medication: 'リハビリ' },
  ],
  historyBirth: '大阪府堺市で生まれる',
  historyKindergarten: '南紀福祉センター療育園',
  historyElementary: '安居小学校ー愛徳整肢園ー南紀養護学校（小4から）',
  historyJuniorHigh: '南紀養護学校', historySeniorHigh: '〃',
  historyAdult: 'いきいき作業所ーふたば作業所（H.28.4〜）',
  pastServiceRows: [{ serviceName: '移動支援', facility: '', period: '' }, {}, {}],
  supportLevel: '4', certValidFrom: '2022-09-01', certValidTo: '2025-08-31',
  paymentCity: '白浜町', certIssuedDate: '2022-09-20', certNumber: '40100001602',
  serviceTypeLaw: [
    { type: '共同生活援助（グループホーム）', amount: '' },
    { type: '生活介護', amount: '' },
    { type: '居宅介護', amount: '36h/月（1回2hまで）2人介護可' },
    {},
  ],
  serviceTypeLocal: [
    { type: '日中一時支援（デイサービス）', amount: '2日/月' },
    { type: '移動支援（身体介護有）', amount: '7h/月' },
    {},
  ],
  consultationOffice: '西牟婁障害者支援センター　リーふ',
  socialRelationNodes: 'ヘルパー\nふたば作業所\n奥平マンション\n訪着すてっぷ',
  mainOffices: 'ふたば作業所　奥平マンション',
  otherInfo: '田辺市社協権利擁護事業利用（金銭管理）2か月に1回',
  chiefComplaintGeneral: 'いろいろなことを経験したい',
  chiefComplaintWork:    '給料をたくさん稼ぎたい',
  chiefComplaintLife:    '奥平マンションで良い。できることは自分でやる',
  chiefComplaintOther:   '長期休暇には実家に帰省するのを楽しみにしている',
  chiefComplaintFamily:  '父がホーム利用料や小口が少なくなるとお金を持ってきてくれる。',
  bloodType: 'A',
  familyMembers: [
    { id: '1', relation: '父', name: '', customRelation: '' },
    { id: '2', relation: '母', name: '', customRelation: '' },
  ],
};

const BasicInfoDoc = ({ data, user, writeDate }) => {
  /* 입력 데이터가 없으면 샘플 데이터로 표시 */
  const hasMeaningfulData = data && (data.nameKanji || data.birthDate || data.address);
  const d = hasMeaningfulData ? data : SAMPLE_DATA;

  /* 이용자 이름은 기본정보 입력값(nameKanji) 우선, 없으면 user.name */
  const nameKanji = d?.nameKanji || user?.name || '';
  const nameKana  = d?.nameKana  || '';
  const manager   = user?.manager   || '栗須康子';
  const date      = writeDate       || d?.writeDate || '';

  const pad = (arr, n) => { const a = arr || []; return a.length >= n ? a : [...a, ...Array(n - a.length).fill({})]; };
  const medicalRows     = pad(d?.medicalRows,      4);  /* 의료기관: 4행 고정 */
  const pastServiceRows = pad(d?.pastServiceRows,  3);  /* 과거서비스: 3행 고정 */
  const serviceTypeLaw  = d?.serviceTypeLaw   || [];    /* 支給決定(支援法): 입력된 만큼만 표시 */
  const serviceTypeLocal= d?.serviceTypeLocal || [];    /* 支給決定(地域): 입력된 만큼만 표시 */

  /* 주거상황 선택지 표시 헬퍼 — 선택된 항목만 동그라미, 미선택은 아주 연하게 */
  const selOpt = (val, opt) =>
    val === opt
      ? <span key={opt} className={s.circled} style={{ fontWeight: 'bold' }}>{opt}</span>
      : <span key={opt} style={{ color: '#888' }}>{opt}</span>;

  const RESIDENCE_OPTS = ['持家', '賃貸共同住宅', 'グループホーム等', 'その他'];

  /* 셀 공통 인라인 스타일 */

  return (
    <div className={`${s.page} page`} data-a4-page>

      {/* ── 헤더: A면(좌측 48%) 위에만 ── */}
      <div style={{ display: 'flex' }}>
        <div className={s.header} style={{ width: '48%' }}>
          <div className={s.headerTitle}>基 本 情 報</div>
          <div className={s.headerRight}>
            {toJaEra(date) || '　'}<br />
            {d?.facilityName || '　'}
          </div>
        </div>
      </div>

      <div className={s.body}>

        {/* ══════ 좌측 컬럼 (48%) ══════ */}
        <div className={s.leftCol}>

          {/* 긴급연락처 */}
          <div className={s.emergencyRow}>
            <span className={s.emLabel}>緊急時の連絡先</span>
            <span className={s.emValue}>
              {d?.emergencyName || '　'}
              {d?.emergencyRelation ? `（${d.emergencyRelation}）` : ''}
              {d?.emergencyPhone ? `　${d.emergencyPhone}` : ''}
            </span>
            <span className={s.bloodLabel}>血液型</span>
            <span className={s.bloodValue}>{d?.bloodType || '　'}</span>
          </div>

          {/* ── プロフィール: ふりがな〜医療機関服薬状況 전체 (1열 = プロフィール) ── */}
          <div className={s.section}>
            <div className={s.sideLabel}>プロフィール</div>
            <div className={s.sectionBody}>

              {/* 2열: ふりがな */}
              <div className={s.row} style={{ minHeight: 16 }}>
                <div className={s.fieldLabel}>ふりがな</div>
                <div className={s.fieldValue} style={{ fontSize: '7pt', color: '#666' }}>{nameKana || '　'}</div>
              </div>
              {/* 2열: 氏名 */}
              <div className={s.row}>
                <div className={s.fieldLabel}>氏　名</div>
                <div className={s.fieldValue} style={{ fontSize: '9pt', fontWeight: 600 }}>{nameKanji || '　'}</div>
              </div>
              {/* 2열: 生年月日・性別 */}
              <div className={s.row}>
                <div className={s.fieldLabel}>生年月日</div>
                <div className={s.fieldValue} style={{ flex: 1 }}>
                  {toJaEra(d?.birthDate) || '　'}
                  {calcAge(d?.birthDate) !== '' ? `（${calcAge(d?.birthDate)}歳）` : ''}
                </div>
                <div className={s.fieldLabel} style={{ borderLeft: '0.5px solid #000' }}>性別</div>
                <div className={s.fieldValue} style={{ minWidth: 72, justifyContent: 'center' }}>
                  {d?.gender === '男性'
                    ? <><span className={s.circled}>男性</span>・<span style={{ color: '#ccc', fontSize: '7pt' }}>女性</span></>
                    : d?.gender === '女性'
                    ? <><span style={{ color: '#ccc', fontSize: '7pt' }}>男性</span>・<span className={s.circled}>女性</span></>
                    : <span>男性・女性</span>}
                </div>
              </div>
              {/* 2열: 住所 */}
              <div className={s.row}>
                <div className={s.fieldLabel}>住　所</div>
                <div className={s.fieldValue}>{d?.address || '　'}</div>
              </div>
              {/* 2열: 住居状況 */}
              <div className={s.row}>
                <div className={s.fieldLabel}>住居状況</div>
                <div className={s.fieldValue} style={{ gap: 3 }}>
                  {RESIDENCE_OPTS.map((opt, i) => (
                    <span key={opt}>
                      {selOpt(d?.residenceType, opt)}
                      {i < RESIDENCE_OPTS.length - 1 ? '・' : ''}
                    </span>
                  ))}
                </div>
              </div>
              {/* 2열: 電話 */}
              <div className={s.row}>
                <div className={s.fieldLabel}>電　話</div>
                <div className={s.fieldValue}>
                  自宅・ホーム：{d?.phoneOffice || d?.phoneHome || '　'}
                  携帯：（本人）：{d?.phoneMobile || '　'}
                </div>
              </div>

              {/* 2열: 家族状況 (vertical) + 제노그램 */}
              <div style={{ display: 'flex', height: 160, flexShrink: 0, borderBottom: '0.5px solid #000' }}>
                <div className={s.fieldLabel} style={{ writingMode: 'vertical-rl', width: '14.5%', fontWeight: 'bold', fontSize: '7.5pt', letterSpacing: 2, justifyContent: 'center', alignSelf: 'stretch' }}>
                  家族状況
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 4 }}>
                  <div style={{ textAlign: 'right', fontSize: '7pt', paddingRight: 2 }}>ジェノグラム</div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <GenogramSVG members={d?.familyMembers || []} selfGender={d?.gender || '女性'} compact />
                  </div>
                </div>
              </div>

              {/* 2열: 障害の状況 (vertical) + 3열: 서브 항목들 */}
              <div style={{ display: 'flex', flexShrink: 0, borderBottom: '0.5px solid #000' }}>
                <div className={s.fieldLabel} style={{ writingMode: 'vertical-rl', width: '14.5%', fontWeight: 'bold', fontSize: '7.5pt', letterSpacing: 0, justifyContent: 'center', alignSelf: 'stretch' }}>
                  障害の状況
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', minHeight: 22, borderBottom: '0.5px solid #000', alignItems: 'stretch' }}>
                    <div style={{ width: '22%', background: '#f5f5f5', borderRight: '0.5px solid #000', fontSize: '7.5pt', fontWeight: 600, padding: '2px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>障害・疾病名</div>
                    <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px', display: 'flex', alignItems: 'center' }}>{d?.disabilityNames?.length ? d.disabilityNames.join('、') : (d?.disabilityName || '　')}</div>
                  </div>
                  <div style={{ display: 'flex', minHeight: 22, borderBottom: '0.5px solid #000', alignItems: 'stretch' }}>
                    <div style={{ width: '22%', background: '#f5f5f5', borderRight: '0.5px solid #000', fontSize: '7.5pt', fontWeight: 600, padding: '2px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>手　帳</div>
                    <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px', display: 'flex', alignItems: 'center' }}>{d?.notebookType || '　'}{d?.notebookLevel ? `　${d.notebookLevel}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', minHeight: 22, borderBottom: '0.5px solid #000', alignItems: 'stretch' }}>
                    <div style={{ width: '22%', background: '#f5f5f5', borderRight: '0.5px solid #000', fontSize: '7.5pt', fontWeight: 600, padding: '2px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>障害年金</div>
                    <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px', display: 'flex', alignItems: 'center' }}>{d?.disabilityPension || '　'}</div>
                  </div>
                  <div style={{ display: 'flex', minHeight: 22, alignItems: 'stretch' }}>
                    <div style={{ width: '22%', background: '#f5f5f5', borderRight: '0.5px solid #000', fontSize: '7.5pt', fontWeight: 600, padding: '2px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>概　況</div>
                    <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px', display: 'flex', alignItems: 'center' }}>{d?.disabilityOverview || '　'}</div>
                  </div>
                </div>
              </div>

              {/* 2열: 介護保険 | 有・無 | 介護度 | 값 */}
              <div style={{ display: 'flex', minHeight: 28, flexShrink: 0, borderBottom: '0.5px solid #000', alignItems: 'stretch' }}>
                <div className={s.fieldLabel} style={{ width: '14.5%', justifyContent: 'center' }}>介護保険</div>
                <div style={{ width: '22%', fontSize: '8.5pt', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 6, borderRight: '0.5px solid #000' }}>
                  {d?.careInsurance === '有'
                    ? <><span className={s.circled}>有</span>・<span style={{ color: '#ccc', fontSize: '7pt' }}>（無）</span></>
                    : d?.careInsurance === '無'
                    ? <><span style={{ color: '#ccc', fontSize: '7pt' }}>有</span>・<span className={s.circled}>（無）</span></>
                    : <span>有・無</span>}
                </div>
                <div style={{ width: '14%', background: '#f5f5f5', borderRight: '0.5px solid #000', fontSize: '7.5pt', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>介護度</div>
                <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px', display: 'flex', alignItems: 'center' }}>{d?.careLevel || '　'}</div>
              </div>

              {/* 2열: 医療機関服薬状況 (vertical) + 서비스 테이블 */}
              <div style={{ display: 'flex', flexShrink: 0 }}>
                <div className={s.fieldLabel} style={{ writingMode: 'vertical-rl', width: '14.5%', fontWeight: 'bold', fontSize: '6.5pt', letterSpacing: 0, justifyContent: 'center', alignSelf: 'stretch' }}>
                  医療機関服薬状況
                </div>
                <div style={{ flex: 1 }}>
                  <table className={s.medTable}>
                    <thead>
                      <tr>
                        <th style={{ width: '29%' }}>病院・診療科目</th>
                        <th style={{ width: '38%' }}>主たる疾患等</th>
                        <th>服　薬</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicalRows.map((row, i) => (
                        <tr key={i}>
                          <td>{row.hospital || '　'}</td>
                          <td>{row.disease || '　'}</td>
                          <td>{row.medication || '　'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>

          {/* ⑧ 既往 + 過去サービス: 나머지 채움 */}
          <div className={s.sectionFill}>
            <div className={s.sideLabel}>既　往</div>
            <div className={s.sectionBody}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', tableLayout: 'fixed', height: '100%' }}>
                <colgroup>
                  <col style={{ width: '22%' }} />{/* 외부 라벨: 出生・乳幼児期 / 就学期(rowspan) / 成人期 / 過去... */}
                  <col style={{ width: '16%' }} />{/* 내부 라벨: 保育所・幼稚園 등 */}
                  <col />{/* 값 */}
                </colgroup>
                <tbody>
                  {/* 出生・乳幼児期 */}
                  <tr style={{ height: 30 }}>
                    <td style={{ background: '#f5f5f5', borderRight: '0.5px solid #000', borderBottom: '0.5px solid #000', padding: '2px 5px', fontSize: '7.5pt', fontWeight: 600, verticalAlign: 'middle' }}>出生・乳幼児期</td>
                    <td colSpan={2} style={{ padding: '2px 6px', borderBottom: '0.5px solid #000', verticalAlign: 'middle' }}>{d?.historyBirth || '　'}</td>
                  </tr>
                  {/* 就学期: 5행 묶음 */}
                  <tr style={{ height: 20 }}>
                    <td rowSpan={5} style={{ background: '#efefef', borderRight: '0.5px solid #000', borderBottom: '0.5px solid #000', writingMode: 'vertical-rl', textAlign: 'center', fontSize: '7.5pt', fontWeight: 'bold', verticalAlign: 'middle', letterSpacing: 2 }}>就学期</td>
                    <td style={{ background: '#f5f5f5', borderRight: '0.5px solid #000', borderBottom: '0.5px solid #000', padding: '2px 5px', fontSize: '7pt', verticalAlign: 'middle' }}>保育所・幼稚園</td>
                    <td style={{ padding: '2px 6px', borderBottom: '0.5px solid #000', verticalAlign: 'middle' }}>{d?.historyKindergarten || '　'}</td>
                  </tr>
                  <tr style={{ height: 20 }}>
                    <td style={{ background: '#f5f5f5', borderRight: '0.5px solid #000', borderBottom: '0.5px solid #000', padding: '2px 5px', fontSize: '7pt', verticalAlign: 'middle' }}>小学校</td>
                    <td style={{ padding: '2px 6px', borderBottom: '0.5px solid #000', verticalAlign: 'middle' }}>{d?.historyElementary || '　'}</td>
                  </tr>
                  <tr style={{ height: 20 }}>
                    <td style={{ background: '#f5f5f5', borderRight: '0.5px solid #000', borderBottom: '0.5px solid #000', padding: '2px 5px', fontSize: '7pt', verticalAlign: 'middle' }}>中学校</td>
                    <td style={{ padding: '2px 6px', borderBottom: '0.5px solid #000', verticalAlign: 'middle' }}>{d?.historyJuniorHigh || '　'}</td>
                  </tr>
                  <tr style={{ height: 20 }}>
                    <td style={{ background: '#f5f5f5', borderRight: '0.5px solid #000', borderBottom: '0.5px solid #000', padding: '2px 5px', fontSize: '7pt', verticalAlign: 'middle' }}>高等学校</td>
                    <td style={{ padding: '2px 6px', borderBottom: '0.5px solid #000', verticalAlign: 'middle' }}>{d?.historySeniorHigh || '　'}</td>
                  </tr>
                  <tr style={{ height: 20 }}>
                    <td style={{ background: '#f5f5f5', borderRight: '0.5px solid #000', borderBottom: '0.5px solid #000', padding: '2px 5px', fontSize: '7pt', verticalAlign: 'middle' }}>その他</td>
                    <td style={{ padding: '2px 6px', borderBottom: '0.5px solid #000', verticalAlign: 'middle' }}>{d?.historyOtherSchool || '　'}</td>
                  </tr>
                  {/* 成人期 */}
                  <tr style={{ height: 40 }}>
                    <td style={{ background: '#f5f5f5', borderRight: '0.5px solid #000', borderBottom: '0.5px solid #000', padding: '2px 5px', fontSize: '7.5pt', fontWeight: 600, verticalAlign: 'middle' }}>成人期</td>
                    <td colSpan={2} style={{ padding: '2px 6px', borderBottom: '0.5px solid #000', verticalAlign: 'top' }}>{d?.historyAdult || '　'}</td>
                  </tr>
                  {/* 過去のサービス利用: 나머지 높이 채움 */}
                  <tr>
                    <td style={{ background: '#f5f5f5', borderRight: '0.5px solid #000', padding: '2px 5px', fontSize: '7.5pt', fontWeight: 600, verticalAlign: 'top', lineHeight: 1.4, whiteSpace: 'pre-line' }}>{'過去の\nサービス\n利用'}</td>
                    <td colSpan={2} style={{ padding: 0, verticalAlign: 'top' }}>
                      <table className={s.medTable} style={{ width: '100%' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '33%' }}>サービス名</th>
                            <th style={{ width: '34%' }}>事業所名</th>
                            <th>利用時期・期間</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pastServiceRows.map((row, i) => (
                            <tr key={i}>
                              <td>{row.serviceName || '　'}</td>
                              <td>{row.facility || '　'}</td>
                              <td>{row.period || '　'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>{/* /leftCol */}

        {/* A-B 구분선 */}
        <div className={s.colDivider} />

        {/* ══════ 우측 컬럼 (52%) ══════ */}
        <div className={s.rightCol}>

          {/* ① 現況 — 支援区分 행 포함, 受給者証/相談支援事業所/社会関係図/主たる事業所/その他情報 */}
          <div className={s.section}>
            <div className={s.sideLabel}>現　況</div>
            <div className={s.sectionBody}>

              {/* 受給者証: 支援区分/支給市町村/番号/支給決定 전체 묶음 */}
              <div style={{ display: 'flex', flexShrink: 0, borderBottom: '0.5px solid #000' }}>
                <div className={s.fieldLabel} style={{ writingMode: 'vertical-rl', width: '14.5%', justifyContent: 'center', alignSelf: 'stretch', letterSpacing: 2 }}>受給者証</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* 支援区分 | 4 | 認定有効期間 | 유효기간 — 受給者証 내부 첫 행 */}
                  <div style={{ display: 'flex', height: 22, borderBottom: '0.5px solid #000', alignItems: 'stretch' }}>
                    <div style={{ width: '20%', background: '#f5f5f5', borderRight: '0.5px solid #000', fontSize: '7.5pt', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>支援区分</div>
                    <div style={{ width: '20%', borderRight: '0.5px solid #000', fontSize: '9pt', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{d?.supportLevel || '　'}</div>
                    <div style={{ width: '28%', background: '#f5f5f5', borderRight: '0.5px solid #000', fontSize: '7.5pt', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>認定有効期間</div>
                    <div style={{ flex: 1, fontSize: '7.5pt', padding: '2px 6px 2px 8px', display: 'flex', alignItems: 'center' }}>{certPeriod(d?.certValidFrom, d?.certValidTo)}</div>
                  </div>
                  {/* 支給市町村 | 값 | 交付年月日 | 값 */}
                  <div style={{ display: 'flex', height: 22, borderBottom: '0.5px solid #000', alignItems: 'stretch' }}>
                    <div style={{ width: '20%', background: '#f5f5f5', borderRight: '0.5px solid #000', fontSize: '7.5pt', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>支給市町村</div>
                    <div style={{ width: '20%', borderRight: '0.5px solid #000', fontSize: '7.5pt', padding: '2px 6px 2px 11px', display: 'flex', alignItems: 'center' }}>{d?.paymentCity || '　'}</div>
                    <div style={{ width: '28%', background: '#f5f5f5', borderRight: '0.5px solid #000', fontSize: '7.5pt', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>交付年月日</div>
                    <div style={{ flex: 1, fontSize: '7.5pt', padding: '2px 6px 2px 11px', display: 'flex', alignItems: 'center' }}>{toJaShort(d?.certIssuedDate)}</div>
                  </div>
                  {/* 番号 | 값 */}
                  <div style={{ display: 'flex', height: 22, borderBottom: '0.5px solid #000', alignItems: 'stretch' }}>
                    <div style={{ width: '20%', background: '#f5f5f5', borderRight: '0.5px solid #000', fontSize: '7.5pt', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>番　号</div>
                    <div style={{ flex: 1, fontSize: '7.5pt', padding: '2px 11px', display: 'flex', alignItems: 'center' }}>{d?.certNumber || '　'}</div>
                  </div>
                  {/* 支給決定 통합 테이블 — 헤더 1개 + 支援法/地域 rowspan, 라벨 가로쓰기 */}
                  <table className={s.medTable} style={{ width: '100%' }}>
                    <colgroup>
                      <col style={{ width: '20%' }} />{/* 支給決定 라벨 — 위 행과 너비 통일 */}
                      <col style={{ width: '48%' }} />{/* サービス種別 */}
                      <col />{/* 支給量 */}
                    </colgroup>
                    <tbody>
                      {/* 支給決定（支援法）— 헤더 행 포함해서 rowspan 병합 */}
                      <tr style={{ height: 18 }}>
                        <td rowSpan={(serviceTypeLaw.length || 1) + 1}
                          style={{ textAlign: 'center', background: '#f5f5f5', fontSize: '6pt', fontWeight: 'bold', verticalAlign: 'middle', lineHeight: 1.3, borderRight: '0.5px solid #000', wordBreak: 'break-all', padding: '2px 4px' }}>
                          支給決定<br/>（支援法）
                        </td>
                        <th>サービス種別</th>
                        <th>支給量（当該月の日数/月）</th>
                      </tr>
                      {serviceTypeLaw.map((row, i) => (
                        <tr key={`law-${i}`} style={{ height: 22 }}>
                          <td>{row.type || '　'}</td>
                          <td>{row.amount || '　'}</td>
                        </tr>
                      ))}
                      {/* 支給決定（地域生活支援事業） */}
                      {serviceTypeLocal.map((row, i) => (
                        <tr key={`local-${i}`} style={{ height: 22 }}>
                          {i === 0 && (
                            <td rowSpan={serviceTypeLocal.length || 1}
                              style={{ textAlign: 'center', background: '#f5f5f5', fontSize: '6pt', fontWeight: 'bold', verticalAlign: 'middle', lineHeight: 1.3, wordBreak: 'break-all', padding: '2px 4px' }}>
                              支給決定<br/>（地域生活支援事業）
                            </td>
                          )}
                          <td>{row.type || '　'}</td>
                          <td>{row.amount || '　'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 相談支援事業所 */}
              <div className={s.row} style={{ minHeight: 22, borderBottom: '0.5px solid #000' }}>
                <div className={s.fieldLabel}>相談支援事業所</div>
                <div className={s.fieldValue}>{d?.consultationOffice || '　'}</div>
              </div>

              {/* 社会関係図 + 主たる事業所・機関 — 같은 bordered 섹션 안에 묶음 */}
              <div style={{ flexShrink: 0, display: 'flex', borderBottom: '0.5px solid #000' }}>
                <div className={s.fieldLabel} style={{ writingMode: 'vertical-rl', width: '14.5%', justifyContent: 'center', alignSelf: 'stretch', letterSpacing: 2 }}>社会関係図</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* SVG 다이어그램 */}
                  <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, borderBottom: '0.5px solid #000' }}>
                    <SocialDiagramSVG nodes={d?.socialRelationNodes} />
                  </div>
                  {/* 主たる事業所・機関 — SVG 아래, 같은 열 */}
                  <div style={{ display: 'flex', minHeight: 22, alignItems: 'stretch' }}>
                    <div style={{ background: '#f5f5f5', borderRight: '0.5px solid #000', fontSize: '6.5pt', fontWeight: 600, padding: '2px 50px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, whiteSpace: 'nowrap' }}>主たる事業所・機関</div>
                    <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px 2px 11px', display: 'flex', alignItems: 'center' }}>{d?.mainOffices || '　'}</div>
                  </div>
                </div>
              </div>

              {/* その他情報 */}
              <div className={s.row} style={{ minHeight: 48, borderBottom: 'none' }}>
                <div className={s.fieldLabel}>その他情報</div>
                <div className={s.fieldValue}>{d?.otherInfo || '　'}</div>
              </div>

            </div>
          </div>{/* /現況 */}

          {/* ② 当該事業所利用時の主訴 — 1열: 主訴, 2열: 本人/家族 */}
          <div className={s.section}>
            <div className={s.sideLabelSm} style={{ writingMode: 'horizontal-tb', fontSize: '6.5pt', lineHeight: 1.5, textAlign: 'center', padding: '4px 2px' }}>当該<br/>事業所<br/>利用時<br/>の主訴</div>
            <div className={s.sectionBody}>

              {/* 2열: 本人 (vertical) + 3열: 全般/就労/生活/その他 */}
              <div style={{ display: 'flex', flexShrink: 0, borderBottom: '0.5px solid #000' }}>
                <div className={s.fieldLabel} style={{ writingMode: 'vertical-rl', width: '14.5%', justifyContent: 'center', alignSelf: 'stretch', letterSpacing: 2 }}>本人</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {[
                    ['全般', d?.chiefComplaintGeneral],
                    ['就労', d?.chiefComplaintWork],
                    ['生活', d?.chiefComplaintLife],
                    ['その他', d?.chiefComplaintOther],
                  ].map(([label, val], i, arr) => (
                    <div key={label} style={{ display: 'flex', minHeight: 28, borderBottom: i < arr.length - 1 ? '0.5px solid #000' : 'none', alignItems: 'stretch' }}>
                      <div style={{ width: '22%', background: '#f5f5f5', borderRight: '0.5px solid #000', fontSize: '7.5pt', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{label}</div>
                      <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px 2px 11px', display: 'flex', alignItems: 'center' }}>{val || '　'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2열: 家族 */}
              <div className={s.row} style={{ minHeight: 28, borderBottom: 'none' }}>
                <div className={s.fieldLabel}>家族</div>
                <div className={s.fieldValue}>{d?.chiefComplaintFamily || '　'}</div>
              </div>

            </div>
          </div>

          {/* ③ 備考: 나머지 채움 */}
          <div className={s.sectionFill}>
            <div className={s.sideLabel} style={{ writingMode: 'horizontal-tb' }}>備　考</div>
            <div style={{ flex: 1, padding: '6px 8px 6px 13px', fontSize: '8.5pt', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {d?.remarks || ''}
            </div>
          </div>

        </div>{/* /rightCol */}

      </div>{/* /body */}
    </div>
  );
};

export default BasicInfoDoc;
