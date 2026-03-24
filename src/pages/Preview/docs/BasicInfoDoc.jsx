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
    .map((s) => s.trim())
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
  const residenceDisplay = (selected, opt) =>
    selected === opt
      ? <span key={opt} className={s.genderSelected}>{opt}</span>
      : <span key={opt} style={{ color: '#ccc', fontSize: '7pt' }}>（{opt}）</span>;

  const residenceOpts = ['持家', '賃貸共同住宅', 'グループホーム等', 'その他'];

  return (
    <div className={`${s.page} page`} data-a4-page>

      {/* ── 본문 2컬럼 (제목은 좌측 안에 있음 — 반접으면 표지가 됨) ── */}
      <div className={s.docBody}>

        {/* ══════════ 좌측 컬럼 ══════════ */}
        <div className={s.leftCol}>

          {/* 제목 — 좌측 절반 상단에만 표시 */}
          <div className={s.docHeader}>
            <div className={s.docTitle}>基 本 情 報</div>
            <div className={s.docHeaderRight}>
              {toJaEra(date) || '　'}<br />
              {d?.facilityName || '　'}
            </div>
          </div>

          {/* 긴급연락처 스트립 */}
          <div className={s.emergencyStrip}>
            <span className={s.emLabel}>緊急時の連絡先</span>
            <span className={s.emValue}>
              {d?.emergencyName || '　'}
              {d?.emergencyRelation ? `（${d.emergencyRelation}）` : ''}
              {d?.emergencyPhone ? `　${d.emergencyPhone}` : ''}
            </span>
            <span className={s.bloodLabel}>血液型</span>
            <span className={s.bloodValue}>{d?.bloodType || '　'}</span>
          </div>

          {/* プロフィール */}
          <div className={s.sectionRow} style={{ height: 170, flexShrink: 0, overflow: 'hidden' }}>
            <div className={s.sideLabel}>プロフィール</div>
            <div className={s.sectionContent}>
              {/* フリガナ — 氏名 셀 위에 작게 표시 (원본 양식과 동일) */}
              <div className={s.fieldRow}>
                <div className={s.fieldLabel}>氏 名</div>
                <div className={s.fieldValue} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                  <span style={{ fontSize: '7pt', color: '#555' }}>{nameKana || '　'}</span>
                  <span style={{ fontWeight: 600, fontSize: '9pt' }}>{nameKanji}</span>
                </div>
              </div>
              <div className={s.fieldRow}>
                <div className={s.fieldLabel}>生年月日</div>
                <div className={s.fieldValue} style={{ flex: 1 }}>
                  {toJaEra(d?.birthDate) || '　'}
                  {calcAge(d?.birthDate) !== '' ? `（${calcAge(d?.birthDate)}歳）` : ''}
                </div>
                <div className={s.fieldLabel} style={{ borderLeft: '1px solid #bbb', minWidth: 36 }}>性別</div>
                <div className={s.fieldValue} style={{ minWidth: 72, justifyContent: 'center' }}>
                  {d?.gender === '男性'
                    ? <><span className={s.genderSelected}>男性</span>・<span style={{ color: '#ccc', fontSize: '7pt' }}>女性</span></>
                    : d?.gender === '女性'
                    ? <><span style={{ color: '#ccc', fontSize: '7pt' }}>男性</span>・<span className={s.genderSelected}>女性</span></>
                    : <span>男性・女性</span>
                  }
                </div>
              </div>
              <div className={s.fieldRow}>
                <div className={s.fieldLabel}>住 所</div>
                <div className={s.fieldValue}>{d?.address || '　'}</div>
              </div>
              <div className={s.fieldRow}>
                <div className={s.fieldLabel}>住居状況</div>
                <div className={s.fieldValue} style={{ gap: '4px' }}>
                  {residenceOpts.map((opt, i) => (
                    <span key={opt}>
                      {residenceDisplay(d?.residenceType, opt)}
                      {i < residenceOpts.length - 1 ? '・' : ''}
                    </span>
                  ))}
                </div>
              </div>
              <div className={s.fieldRow}>
                <div className={s.fieldLabel}>電 話</div>
                <div className={s.fieldValue} style={{ flexWrap: 'wrap', gap: '10px' }}>
                  <span>自宅：ホーム：{d?.phoneOffice || d?.phoneHome || '　'}</span>
                  <span>携帯電話：（本人）：{d?.phoneMobile || '　'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 家族状況 — 제노그램 SVG */}
          <div className={s.familyRow} style={{ height: 185 }}>
            <div className={s.sideLabel}>家族状況</div>
            {/* 높이 100% 컨테이너 → SVG가 높이 기준으로 비율 유지하며 채움 */}
            <div style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', overflow: 'hidden' }}>
              <GenogramSVG
                members={d?.familyMembers || []}
                selfGender={d?.gender || '女性'}
                compact
              />
            </div>
          </div>

          {/* 障害の状況 */}
          <div className={s.sectionRow} style={{ height: 132, flexShrink: 0, overflow: 'hidden' }}>
            <div className={s.sideLabel}>障害の状況</div>
            <div className={s.sectionContent}>
              <div className={s.fieldRow}>
                <div className={s.fieldLabel}>障害・疾病名</div>
                <div className={s.fieldValue}>
                  {d?.disabilityNames?.length
                    ? d.disabilityNames.join('　')
                    : (d?.disabilityName || '精神障害')}
                </div>
              </div>
              <div className={s.fieldRow}>
                <div className={s.fieldLabel}>手 帳</div>
                <div className={s.fieldValue}>
                  {d?.notebookType || '　'}
                  {d?.notebookLevel ? `　${d.notebookLevel}　級` : ''}
                </div>
              </div>
              <div className={s.fieldRow}>
                <div className={s.fieldLabel}>障害年金</div>
                <div className={s.fieldValue}>{d?.disabilityPension || '　'}　{d?.disabilityPension ? '級' : ''}</div>
              </div>
              <div className={s.fieldRow} style={{ minHeight: '24px' }}>
                <div className={s.fieldLabel}>概 況</div>
                <div className={s.fieldValue}>{d?.disabilityOverview || '　'}</div>
              </div>
            </div>
          </div>

          {/* 介護保険 */}
          <div className={s.sectionRow} style={{ height: 42, flexShrink: 0, overflow: 'hidden' }}>
            <div className={s.sideLabel}>介護保険</div>
            <div className={s.sectionContent}>
              <div className={s.fieldRow} style={{ minHeight: '20px' }}>
                <div className={s.fieldValue} style={{ gap: '12px' }}>
                  {d?.careInsurance === '有'
                    ? <><span className={s.genderSelected}>有</span>・<span style={{ color: '#ccc', fontSize: '7pt' }}>（無）</span></>
                    : d?.careInsurance === '無'
                    ? <><span style={{ color: '#ccc', fontSize: '7pt' }}>有</span>・<span className={s.genderSelected}>（無）</span></>
                    : <span>有・無</span>
                  }
                  <span>介護度：{d?.careLevel || '　'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 医療機関・服薬状況 */}
          <div className={s.sectionRow} style={{ height: 165, flexShrink: 0, overflow: 'hidden' }}>
            <div className={s.sideLabel}>医療機関服薬状況</div>
            <div className={s.sectionContent}>
              <table className={s.table3}>
                <thead>
                  <tr>
                    <th style={{ width: '38%' }}>病院・診療科目</th>
                    <th style={{ width: '30%' }}>主たる疾患等</th>
                    <th style={{ width: '32%' }}>服 薬</th>
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

          {/* 既往 */}
          <div className={s.sectionRow}>
            <div className={s.sideLabel}>既　往</div>
            <div className={s.historyContent}>
              <div className={s.historyRow} style={{ minHeight: '28px' }}>
                <div className={s.historyLabel}>出生・乳幼児期</div>
                <div className={s.historyValue}>{d?.historyBirth || '　'}</div>
              </div>
              <div className={s.historyRow}>
                <div className={s.historyLabel}>就学期</div>
                <div className={s.schoolGrid}>
                  {[
                    ['保育所・幼稚園', d?.historyKindergarten],
                    ['小学校',         d?.historyElementary],
                    ['中学校',         d?.historyJuniorHigh],
                    ['高等学校',       d?.historySeniorHigh],
                    ['その他',         d?.historyOtherSchool],
                  ].map(([label, val]) => (
                    <div key={label} className={s.schoolRow}>
                      <span className={s.schoolLabel}>{label}</span>
                      <span className={s.schoolValue}>{val || '　'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={s.historyRow} style={{ minHeight: '28px' }}>
                <div className={s.historyLabel}>成人期</div>
                <div className={s.historyValue}>{d?.historyAdult || '　'}</div>
              </div>
              {/* 過去のサービス利用 */}
              <div className={s.historyRow} style={{ flex: 1 }}>
                <div className={s.historyLabel}>過去のサービス利用</div>
                <div style={{ flex: 1 }}>
                  <table className={s.table3} style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '30%' }}>サービス名</th>
                        <th style={{ width: '38%' }}>事業所名</th>
                        <th style={{ width: '32%' }}>利用時期・利用期間</th>
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

        {/* ══════════ 우측 컬럼 ══════════ */}
        <div className={s.rightCol}>

          {/* 現況 — 원본 양식과 동일: 現況(외부) > 受給者証(내부 세로라벨) > 서비스테이블 */}
          <div className={s.certWrapper} style={{ height: 700, flexShrink: 0, overflow: 'hidden' }}>
            <div className={s.sideLabel}>現　況</div>
            <div className={s.certContent}>

              {/* 受給者証 — 가로 라벨 (원본 양식과 동일) */}
              <div style={{ display: 'flex', borderBottom: '1px solid #d0d0d0', flexShrink: 0 }}>
                <div style={{
                  textAlign: 'center',
                  background: '#efefef', borderRight: '1px solid #bbb',
                  padding: '4px 5px', fontWeight: 'bold', fontSize: '8pt',
                  minWidth: '52px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                }}>受給者証</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

                  {/* 支援区分 + 認定有効期間 */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #d0d0d0', minHeight: '20px' }}>
                    <span className={s.certLabel} style={{ minWidth: '52px' }}>支援区分</span>
                    <span className={s.certValue} style={{ minWidth: '24px', borderRight: '1px solid #d0d0d0' }}>
                      {d?.supportLevel || '　'}
                    </span>
                    <span className={s.certLabel}>認定有効期間</span>
                    <span className={s.certValue} style={{ fontSize: '7.5pt', whiteSpace: 'nowrap', overflow: 'hidden' }}>{certPeriod(d?.certValidFrom, d?.certValidTo)}</span>
                  </div>

                  {/* 支給市町村 + 交付年月日 */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #d0d0d0', minHeight: '20px' }}>
                    <span className={s.certLabel}>支給市町村</span>
                    <span className={s.certValue} style={{ borderRight: '1px solid #d0d0d0' }}>
                      {d?.paymentCity || '　'}
                    </span>
                    <span className={s.certLabel}>交付年月日</span>
                    <span className={s.certValue}>{toJaShort(d?.certIssuedDate)}</span>
                  </div>

                  {/* 番号 */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #d0d0d0', minHeight: '20px' }}>
                    <span className={s.certLabel}>番 号</span>
                    <span className={s.certValue}>{d?.certNumber || '　'}</span>
                  </div>

                  {/* 支給決定（支援法）*/}
                  <div style={{ display: 'flex', borderBottom: '1px solid #d0d0d0', flexShrink: 0 }}>
                    <div className={s.certLabel} style={{ minWidth: '52px', textAlign: 'center', padding: '3px 4px', fontSize: '7pt', whiteSpace: 'normal', lineHeight: 1.3 }}>支給決定<br/>（支援法）</div>
                    <div style={{ flex: 1 }}>
                      <table className={s.serviceTable}>
                        <thead>
                          <tr>
                            <th>サービス種別</th>
                            <th>支給量（当該月の日数/月）</th>
                          </tr>
                        </thead>
                        <tbody>
                          {serviceTypeLaw.map((row, i) => (
                            <tr key={i}>
                              <td>{row.type || '　'}</td>
                              <td>{row.amount || '　'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 支給決定（地域生活支援事業）*/}
                  <div style={{ display: 'flex', flexShrink: 0 }}>
                    <div className={s.certLabel} style={{ minWidth: '52px', textAlign: 'center', padding: '3px 4px', fontSize: '7pt', whiteSpace: 'normal', lineHeight: 1.3 }}>支給決定<br/>（地域生活<br/>支援事業）</div>
                    <div style={{ flex: 1 }}>
                      <table className={s.serviceTable}>
                        <tbody>
                          {serviceTypeLocal.map((row, i) => (
                            <tr key={i}>
                              <td>{row.type || '　'}</td>
                              <td>{row.amount || '　'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </div>{/* /受給者証 */}

              {/* 상담지원사업소 */}
              <div style={{ display: 'flex', borderBottom: '1px solid #d0d0d0', minHeight: '22px', flexShrink: 0 }}>
                <span className={s.certLabel}>相談支援事業所</span>
                <span className={s.certValue}>{d?.consultationOffice || '　'}</span>
              </div>

              {/* 사회관계도 */}
              <div className={s.socialSection}>
                <div className={s.socialSectionLabel}>社会関係図</div>
                <div className={s.socialDiagramArea}>
                  <SocialDiagramSVG nodes={d?.socialRelationNodes} />
                </div>
                {d?.mainOffices && (
                  <div className={s.mainOfficesRow}>
                    <span style={{ fontWeight: 'bold' }}>主たる事業所・機関：</span>
                    {d.mainOffices}
                  </div>
                )}
              </div>

              {/* 기타 정보 */}
              <div style={{ display: 'flex', borderTop: '1px solid #000', minHeight: '22px', flexShrink: 0 }}>
                <span className={s.certLabel}>その他情報</span>
                <span className={s.certValue}>{d?.otherInfo || '　'}</span>
              </div>

            </div>
          </div>{/* /certWrapper */}

          {/* 주訴 — 원본 양식: 本人 rowspan 4 테이블 구조 */}
          <div style={{ display: 'flex', flexShrink: 0, borderBottom: '1px solid #000', overflow: 'hidden' }}>
            <div className={s.sideLabel}>当該事業所利用時の主訴</div>
            <table style={{ flex: 1, borderCollapse: 'collapse', fontSize: '8pt', tableLayout: 'fixed' }}>
              <tbody>
                <tr>
                  <td rowSpan={4} style={{ textAlign: 'center', width: 32, background: '#f7f7f7', borderRight: '1px solid #bbb', borderBottom: '1px solid #bbb', padding: '2px 4px', verticalAlign: 'middle', fontSize: '8pt' }}>本人</td>
                  <td style={{ width: 36, textAlign: 'center', background: '#f7f7f7', borderRight: '1px solid #bbb', borderBottom: '1px solid #d0d0d0', padding: '2px 4px' }}>全般</td>
                  <td style={{ padding: '2px 6px', borderBottom: '1px solid #d0d0d0' }}>{d?.chiefComplaintGeneral || '　'}</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', background: '#f7f7f7', borderRight: '1px solid #bbb', borderBottom: '1px solid #d0d0d0', padding: '2px 4px' }}>就労</td>
                  <td style={{ padding: '2px 6px', borderBottom: '1px solid #d0d0d0' }}>{d?.chiefComplaintWork || '　'}</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', background: '#f7f7f7', borderRight: '1px solid #bbb', borderBottom: '1px solid #d0d0d0', padding: '2px 4px' }}>生活</td>
                  <td style={{ padding: '2px 6px', borderBottom: '1px solid #d0d0d0' }}>{d?.chiefComplaintLife || '　'}</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', background: '#f7f7f7', borderRight: '1px solid #bbb', borderBottom: '1px solid #d0d0d0', padding: '2px 4px' }}>その他</td>
                  <td style={{ padding: '2px 6px', borderBottom: '1px solid #d0d0d0' }}>{d?.chiefComplaintOther || '　'}</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', background: '#f7f7f7', borderRight: '1px solid #bbb', padding: '2px 4px' }}>家族</td>
                  <td colSpan={2} style={{ padding: '2px 6px' }}>{d?.chiefComplaintFamily || '　'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 비고 — 원본 양식: 세로라벨 + 내용 */}
          <div className={s.remarksSection} style={{ flexDirection: 'row' }}>
            <div className={s.sideLabel} style={{ background: 'none', borderRight: '1px solid #000' }}>備　考</div>
            <div className={s.remarksContent}>{d?.remarks || '　'}</div>
          </div>

        </div>{/* /rightCol */}

      </div>{/* /docBody */}

    </div>
  );
};

export default BasicInfoDoc;
