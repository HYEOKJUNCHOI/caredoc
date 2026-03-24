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
        <marker id="bi-arr" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <polygon points="0 0, 5 2.5, 0 5" fill="#333" />
        </marker>
      </defs>

      {/* 연결선 */}
      {items.map((_, i) => {
        const [px, py] = positions[i];
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={px} y2={py}
            stroke="#444"
            strokeWidth="0.7"
            markerEnd="url(#bi-arr)"
          />
        );
      })}

      {/* 本人 타원 */}
      <ellipse cx={cx} cy={cy} rx="24" ry="12" fill="#e8e8e8" stroke="#000" strokeWidth="0.8" />
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
    {},
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
  const medicalRows     = pad(d?.medicalRows,      5);  /* 원본 5행 */
  const pastServiceRows = pad(d?.pastServiceRows,  3);  /* 원본 3행 */
  const serviceTypeLaw  = pad(d?.serviceTypeLaw,   4);  /* 원본 4행: 共同生活援助・生活介護・居宅介護・空 */
  const serviceTypeLocal= pad(d?.serviceTypeLocal, 3);  /* 원본 3행: 日中一時支援・移動支援・空 */

  /* 주거상황 선택지 표시 헬퍼 — 선택된 항목만 동그라미, 미선택은 아주 연하게 */
  const selOpt = (val, opt) =>
    val === opt
      ? <span key={opt} className={s.circled}>{opt}</span>
      : <span key={opt} style={{ color: '#ccc', fontSize: '7pt' }}>（{opt}）</span>;

  const RESIDENCE_OPTS = ['持家', '賃貸共同住宅', 'グループホーム等', 'その他'];

  /* 셀 공통 인라인 스타일 */
  const innerBorder = { borderBottom: '0.5px solid #ccc' };
  const innerBorderR = { borderRight: '0.5px solid #ccc' };

  return (
    <div className={`${s.page} page`} data-a4-page>
      <div className={s.body}>

        {/* ══════ 좌측 컬럼 (48%) ══════ */}
        <div className={s.leftCol}>

          {/* ① 헤더: 52px */}
          <div className={s.header}>
            <div className={s.headerTitle}>基 本 情 報</div>
            <div className={s.headerRight}>
              {toJaEra(date) || '　'}<br />
              {d?.facilityName || '　'}
            </div>
          </div>

          {/* ② 긴급연락처: 22px */}
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

          {/* ③ プロフィール */}
          <div className={s.section}>
            <div className={s.sideLabel}>プロフィール</div>
            <div className={s.sectionBody}>
              {/* ふりがな: 16px */}
              <div className={s.row} style={{ minHeight: 16 }}>
                <div className={s.fieldLabel}>ふりがな</div>
                <div className={s.fieldValue} style={{ fontSize: '7pt', color: '#666' }}>{nameKana || '　'}</div>
              </div>
              {/* 氏名: 22px */}
              <div className={s.row}>
                <div className={s.fieldLabel}>氏　名</div>
                <div className={s.fieldValue} style={{ fontSize: '9pt', fontWeight: 600 }}>{nameKanji || '　'}</div>
              </div>
              {/* 生年月日・性別: 22px */}
              <div className={s.row}>
                <div className={s.fieldLabel}>生年月日</div>
                <div className={s.fieldValue} style={{ flex: 1 }}>
                  {toJaEra(d?.birthDate) || '　'}
                  {calcAge(d?.birthDate) !== '' ? `（${calcAge(d?.birthDate)}歳）` : ''}
                </div>
                <div className={s.fieldLabel} style={{ borderLeft: '0.5px solid #ccc' }}>性別</div>
                <div className={s.fieldValue} style={{ minWidth: 72, justifyContent: 'center' }}>
                  {d?.gender === '男性'
                    ? <><span className={s.circled}>男性</span>・<span style={{ color: '#ccc', fontSize: '7pt' }}>女性</span></>
                    : d?.gender === '女性'
                    ? <><span style={{ color: '#ccc', fontSize: '7pt' }}>男性</span>・<span className={s.circled}>女性</span></>
                    : <span>男性・女性</span>}
                </div>
              </div>
              {/* 住所: 22px */}
              <div className={s.row}>
                <div className={s.fieldLabel}>住　所</div>
                <div className={s.fieldValue}>{d?.address || '　'}</div>
              </div>
              {/* 住居状況: 22px */}
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
              {/* 電話: 22px */}
              <div className={s.row} style={{ borderBottom: 'none' }}>
                <div className={s.fieldLabel}>電　話</div>
                <div className={s.fieldValue}>
                  自宅・ホーム：{d?.phoneOffice || d?.phoneHome || '　'}
                  携帯：（本人）：{d?.phoneMobile || '　'}
                </div>
              </div>
            </div>
          </div>

          {/* ④ 家族状況: 180px ★ */}
          <div className={s.section} style={{ height: 180, flexShrink: 0 }}>
            <div className={s.sideLabel}>家族状況</div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 4 }}>
              <GenogramSVG members={d?.familyMembers || []} selfGender={d?.gender || '女性'} compact />
            </div>
          </div>

          {/* ⑤ 障害の状況 */}
          <div className={s.section}>
            <div className={s.sideLabel}>障害の状況</div>
            <div className={s.sectionBody}>
              <div className={s.row}>
                <div className={s.fieldLabel}>障害・疾病名</div>
                <div className={s.fieldValue}>
                  {d?.disabilityNames?.length ? d.disabilityNames.join('、') : (d?.disabilityName || '　')}
                </div>
              </div>
              <div className={s.row}>
                <div className={s.fieldLabel}>手　帳</div>
                <div className={s.fieldValue}>
                  {d?.notebookType || '　'}{d?.notebookLevel ? `　${d.notebookLevel}` : ''}
                </div>
              </div>
              <div className={s.row}>
                <div className={s.fieldLabel}>障害年金</div>
                <div className={s.fieldValue}>{d?.disabilityPension || '　'}</div>
              </div>
              <div className={s.row} style={{ borderBottom: 'none' }}>
                <div className={s.fieldLabel}>概　況</div>
                <div className={s.fieldValue}>{d?.disabilityOverview || '　'}</div>
              </div>
            </div>
          </div>

          {/* ⑥ 介護保険: 22px */}
          <div className={s.section} style={{ minHeight: 22 }}>
            <div className={s.sideLabel}>介護保険</div>
            <div className={s.sectionBody}>
              <div className={s.row} style={{ borderBottom: 'none' }}>
                <div className={s.fieldValue} style={{ gap: 10 }}>
                  {d?.careInsurance === '有'
                    ? <><span className={s.circled}>有</span>・<span style={{ color: '#ccc', fontSize: '7pt' }}>（無）</span></>
                    : d?.careInsurance === '無'
                    ? <><span style={{ color: '#ccc', fontSize: '7pt' }}>有</span>・<span className={s.circled}>（無）</span></>
                    : <span>有・無</span>}
                  　介護度：{d?.careLevel || '　'}
                </div>
              </div>
            </div>
          </div>

          {/* ⑦ 医療機関・服薬 */}
          <div className={s.section}>
            <div className={s.sideLabel}>医療機関服薬状況</div>
            <div className={s.sectionBody}>
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

          {/* ⑧ 既往 + 過去サービス: 나머지 채움 */}
          <div className={s.sectionFill}>
            <div className={s.sideLabel}>既　往</div>
            <div className={s.sectionBody}>
              {/* 出生・乳幼児期: 30px */}
              <div className={s.row} style={{ minHeight: 30 }}>
                <div className={s.historyLabel}>出生・乳幼児期</div>
                <div className={s.fieldValue}>{d?.historyBirth || '　'}</div>
              </div>
              {/* 就学期 5행: 20px each */}
              {[
                ['保育所・幼稚園', d?.historyKindergarten],
                ['小学校',         d?.historyElementary],
                ['中学校',         d?.historyJuniorHigh],
                ['高等学校',       d?.historySeniorHigh],
                ['その他',         d?.historyOtherSchool],
              ].map(([label, val]) => (
                <div key={label} className={s.row} style={{ minHeight: 20 }}>
                  <div className={s.historySubLabel}>{label}</div>
                  <div className={s.fieldValue}>{val || '　'}</div>
                </div>
              ))}
              {/* 成人期: 40px */}
              <div className={s.row} style={{ minHeight: 40 }}>
                <div className={s.historyLabel}>成人期</div>
                <div className={s.fieldValue}>{d?.historyAdult || '　'}</div>
              </div>
              {/* 過去のサービス利用: 나머지 */}
              <div className={s.rowFill} style={{ flex: 1, borderBottom: 'none' }}>
                <div className={s.historyLabel}>過去のサービス利用</div>
                <div style={{ flex: 1 }}>
                  <table className={s.medTable}>
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
                </div>
              </div>
            </div>
          </div>

        </div>{/* /leftCol */}

        {/* ══════ 우측 컬럼 (52%) ══════ */}
        <div className={s.rightCol}>

          {/* ① 現況 섹션 */}
          <div className={s.section}>
            <div className={s.sideLabel}>現　況</div>
            <div className={s.sectionBody}>

              {/* 受給者証 그룹 */}
              <div style={{ display: 'flex', ...innerBorder, flexShrink: 0 }}>
                <div className={s.certGroupLabel}>受給者証</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* 지원구분 + 인정유효기간 */}
                  <div className={s.row} style={{ minHeight: 22 }}>
                    <div className={s.certLabel} style={{ minWidth: 52 }}>支援区分</div>
                    <div className={s.certValue} style={{ minWidth: 28, ...innerBorderR }}>{d?.supportLevel || '　'}</div>
                    <div className={s.certLabel}>認定有効期間</div>
                    <div className={s.certValue} style={{ fontSize: '7.5pt' }}>{certPeriod(d?.certValidFrom, d?.certValidTo)}</div>
                  </div>
                  {/* 지급시정촌 + 교부일 */}
                  <div className={s.row} style={{ minHeight: 22 }}>
                    <div className={s.certLabel}>支給市町村</div>
                    <div className={s.certValue} style={{ ...innerBorderR }}>{d?.paymentCity || '　'}</div>
                    <div className={s.certLabel}>交付年月日</div>
                    <div className={s.certValue}>{toJaShort(d?.certIssuedDate)}</div>
                  </div>
                  {/* 번호 */}
                  <div className={s.row} style={{ minHeight: 22, borderBottom: 'none' }}>
                    <div className={s.certLabel}>番　号</div>
                    <div className={s.certValue}>{d?.certNumber || '　'}</div>
                  </div>
                </div>
              </div>

              {/* 支給決定（支援法） */}
              <div style={{ display: 'flex', ...innerBorder, flexShrink: 0 }}>
                <div className={s.certGroupLabel} style={{ fontSize: '6.5pt', whiteSpace: 'normal', lineHeight: 1.3 }}>
                  支給決定<br/>（支援法）
                </div>
                <div style={{ flex: 1 }}>
                  <table className={s.medTable}>
                    <thead><tr><th>サービス種別</th><th>支給量（当該月の日数/月）</th></tr></thead>
                    <tbody>
                      {serviceTypeLaw.map((row, i) => (
                        <tr key={i} style={{ height: 22 }}>
                          <td>{row.type || '　'}</td>
                          <td>{row.amount || '　'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 支給決定（地域生活支援事業） */}
              <div style={{ display: 'flex', ...innerBorder, flexShrink: 0 }}>
                <div className={s.certGroupLabel} style={{ fontSize: '6.5pt', whiteSpace: 'normal', lineHeight: 1.3 }}>
                  支給決定<br/>（地域生活<br/>支援事業）
                </div>
                <div style={{ flex: 1 }}>
                  <table className={s.medTable}>
                    <tbody>
                      {serviceTypeLocal.map((row, i) => (
                        <tr key={i} style={{ height: 22 }}>
                          <td>{row.type || '　'}</td>
                          <td>{row.amount || '　'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 相談支援事業所: 22px */}
              <div className={s.row} style={{ minHeight: 22, ...innerBorder }}>
                <div className={s.certLabel}>相談支援事業所</div>
                <div className={s.certValue}>{d?.consultationOffice || '　'}</div>
              </div>

              {/* 社会関係図: 160px ★ */}
              <div style={{ height: 160, flexShrink: 0, display: 'flex', flexDirection: 'column', ...innerBorder, padding: '4px 6px' }}>
                <div style={{ fontSize: '7.5pt', fontWeight: 'bold', borderBottom: '0.5px solid #ccc', paddingBottom: 2, marginBottom: 3 }}>
                  社会関係図
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SocialDiagramSVG nodes={d?.socialRelationNodes} />
                </div>
              </div>

              {/* 主たる事業所・機関: 22px */}
              <div className={s.row} style={{ minHeight: 22, ...innerBorder }}>
                <div className={s.certLabel}>主たる事業所・機関</div>
                <div className={s.certValue}>{d?.mainOffices || '　'}</div>
              </div>

              {/* その他情報: 22px */}
              <div className={s.row} style={{ minHeight: 22, borderBottom: 'none' }}>
                <div className={s.certLabel}>その他情報</div>
                <div className={s.certValue}>{d?.otherInfo || '　'}</div>
              </div>

            </div>
          </div>{/* /現況 */}

          {/* ② 主訴: 5행 × 22px */}
          <div className={s.section}>
            <div className={s.sideLabel}>当該事業所利用時の主訴</div>
            <table style={{ flex: 1, borderCollapse: 'collapse', fontSize: '8.5pt', tableLayout: 'fixed' }}>
              <tbody>
                <tr>
                  <td rowSpan={4} style={{ width: 28, textAlign: 'center', background: '#f5f5f5', borderRight: '0.5px solid #ccc', verticalAlign: 'middle', fontSize: '7.5pt', padding: '2px 3px' }}>本人</td>
                  <td style={{ width: 34, textAlign: 'center', background: '#f5f5f5', borderRight: '0.5px solid #ccc', borderBottom: '0.5px solid #ccc', padding: '2px 3px', fontSize: '7.5pt' }}>全般</td>
                  <td style={{ padding: '2px 6px', borderBottom: '0.5px solid #ccc' }}>{d?.chiefComplaintGeneral || '　'}</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', background: '#f5f5f5', borderRight: '0.5px solid #ccc', borderBottom: '0.5px solid #ccc', padding: '2px 3px', fontSize: '7.5pt' }}>就労</td>
                  <td style={{ padding: '2px 6px', borderBottom: '0.5px solid #ccc' }}>{d?.chiefComplaintWork || '　'}</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', background: '#f5f5f5', borderRight: '0.5px solid #ccc', borderBottom: '0.5px solid #ccc', padding: '2px 3px', fontSize: '7.5pt' }}>生活</td>
                  <td style={{ padding: '2px 6px', borderBottom: '0.5px solid #ccc' }}>{d?.chiefComplaintLife || '　'}</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', background: '#f5f5f5', borderRight: '0.5px solid #ccc', borderBottom: '0.5px solid #ccc', padding: '2px 3px', fontSize: '7.5pt' }}>その他</td>
                  <td style={{ padding: '2px 6px', borderBottom: '0.5px solid #ccc' }}>{d?.chiefComplaintOther || '　'}</td>
                </tr>
                <tr>
                  <td colSpan={2} style={{ textAlign: 'center', background: '#f5f5f5', borderRight: '0.5px solid #ccc', padding: '2px 3px', fontSize: '7.5pt' }}>家族</td>
                  <td style={{ padding: '2px 6px' }}>{d?.chiefComplaintFamily || '　'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ③ 備考: 나머지 채움 */}
          <div className={s.sectionFill}>
            <div className={s.sideLabel}>備　考</div>
            <div style={{ flex: 1, padding: '6px 8px', fontSize: '8.5pt', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {d?.remarks || ''}
            </div>
          </div>

        </div>{/* /rightCol */}

      </div>
    </div>
  );
};

export default BasicInfoDoc;
