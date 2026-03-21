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

const BasicInfoDoc = ({ data, user, writeDate }) => {
  /* 이용자 이름은 기본정보 입력값(nameKanji) 우선, 없으면 user.name */
  const nameKanji = data?.nameKanji || user?.name || '';
  const nameKana  = data?.nameKana  || '';
  const manager   = user?.manager   || '栗須康子';
  const date      = writeDate       || data?.writeDate || '';

  const medicalRows     = data?.medicalRows     || [{}, {}, {}];
  const pastServiceRows = data?.pastServiceRows  || [{}, {}, {}];
  const serviceTypeLaw  = data?.serviceTypeLaw   || [{}, {}, {}];
  const serviceTypeLocal= data?.serviceTypeLocal || [{}, {}, {}];

  /* 주거상황 선택지 표시 헬퍼 */
  const residenceDisplay = (selected, opt) =>
    selected === opt
      ? <span key={opt} style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{opt}</span>
      : <span key={opt} style={{ color: '#555' }}>（{opt}）</span>;

  const residenceOpts = ['持家', '賃貸共同住宅', 'グループホーム等', 'その他'];

  return (
    <div className={`${s.page} page`} data-a4-page>

      {/* ── 문서 헤더 ── */}
      <div className={s.docHeader}>
        <div className={s.docTitle}>基 本 情 報</div>
        <div className={s.docHeaderRight}>
          {toJaEra(date) || '　'}<br />
          {data?.facilityName || '　'}
        </div>
      </div>

      {/* ── 본문 2컬럼 ── */}
      <div className={s.docBody}>

        {/* ══════════ 좌측 컬럼 ══════════ */}
        <div className={s.leftCol}>

          {/* 긴급연락처 스트립 */}
          <div className={s.emergencyStrip}>
            <span className={s.emLabel}>緊急時の連絡先</span>
            <span className={s.emValue}>
              {data?.emergencyName || '　'}
              {data?.emergencyRelation ? `（${data.emergencyRelation}）` : ''}
              {data?.emergencyPhone ? `　${data.emergencyPhone}` : ''}
            </span>
            <span className={s.bloodLabel}>血液型</span>
            <span className={s.bloodValue}>{data?.bloodType || '　'}</span>
          </div>

          {/* プロフィール */}
          <div className={s.sectionRow}>
            <div className={s.sideLabel}>プロフィール</div>
            <div className={s.sectionContent}>
              <div className={s.fieldRow}>
                <div className={s.fieldLabel}>氏 名</div>
                <div className={s.fieldValue}>
                  <div className={s.nameGroup}>
                    <span>{nameKana}</span>
                    <span>{nameKanji}</span>
                  </div>
                </div>
              </div>
              <div className={s.fieldRow}>
                <div className={s.fieldLabel}>生年月日</div>
                <div className={s.fieldValue}>
                  {toJaEra(data?.birthDate) || '　'}
                  {calcAge(data?.birthDate) !== '' ? `（${calcAge(data?.birthDate)}歳）` : ''}
                  &nbsp;&nbsp;性別&nbsp;&nbsp;
                  {data?.gender === '男性'
                    ? <><span className={s.genderSelected}>男性</span>・<span>（女性）</span></>
                    : data?.gender === '女性'
                    ? <><span>男性</span>・<span className={s.genderSelected}>（女性）</span></>
                    : <span>男性・女性</span>
                  }
                </div>
              </div>
              <div className={s.fieldRow}>
                <div className={s.fieldLabel}>住 所</div>
                <div className={s.fieldValue}>{data?.address || '　'}</div>
              </div>
              <div className={s.fieldRow}>
                <div className={s.fieldLabel}>住居状況</div>
                <div className={s.fieldValue} style={{ gap: '4px' }}>
                  {residenceOpts.map((opt, i) => (
                    <span key={opt}>
                      {residenceDisplay(data?.residenceType, opt)}
                      {i < residenceOpts.length - 1 ? '・' : ''}
                    </span>
                  ))}
                </div>
              </div>
              <div className={s.fieldRow}>
                <div className={s.fieldLabel}>電 話</div>
                <div className={s.fieldValue} style={{ fontSize: '6.5pt', flexWrap: 'wrap', gap: '6px' }}>
                  <span>自宅：{data?.phoneHome || '　'}</span>
                  <span>ホーム：{data?.phoneOffice || '　'}</span>
                  <span>携帯：{data?.phoneMobile || '　'}</span>
                  <span>メール：{data?.email || '　'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 家族状況 — 제노그램 SVG */}
          <div className={s.familyRow}>
            <div className={s.sideLabel}>家族状況</div>
            {/* 높이 100% 컨테이너 → SVG가 높이 기준으로 비율 유지하며 채움 */}
            <div style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', overflow: 'hidden' }}>
              <GenogramSVG
                members={data?.familyMembers || []}
                selfGender={data?.gender || '女性'}
                compact
              />
            </div>
          </div>

          {/* 障害の状況 */}
          <div className={s.sectionRow}>
            <div className={s.sideLabel}>障害の状況</div>
            <div className={s.sectionContent}>
              <div className={s.fieldRow}>
                <div className={s.fieldLabel}>障害・疾病名</div>
                <div className={s.fieldValue}>{data?.disabilityName || '　'}</div>
              </div>
              <div className={s.fieldRow}>
                <div className={s.fieldLabel}>手 帳</div>
                <div className={s.fieldValue}>
                  {data?.notebookType || '　'}
                  {data?.notebookLevel ? `　${data.notebookLevel}　級` : ''}
                </div>
              </div>
              <div className={s.fieldRow}>
                <div className={s.fieldLabel}>障害年金</div>
                <div className={s.fieldValue}>{data?.disabilityPension || '　'}　{data?.disabilityPension ? '級' : ''}</div>
              </div>
              <div className={s.fieldRow} style={{ minHeight: '24px' }}>
                <div className={s.fieldLabel}>概 況</div>
                <div className={s.fieldValue}>{data?.disabilityOverview || '　'}</div>
              </div>
            </div>
          </div>

          {/* 介護保険 */}
          <div className={s.sectionRow}>
            <div className={s.sideLabel} style={{ fontSize: '6pt' }}>介護保険</div>
            <div className={s.sectionContent}>
              <div className={s.fieldRow} style={{ minHeight: '20px' }}>
                <div className={s.fieldValue} style={{ gap: '12px' }}>
                  {data?.careInsurance === '有'
                    ? <><span className={s.genderSelected}>有</span>・<span>（無）</span></>
                    : data?.careInsurance === '無'
                    ? <><span>有</span>・<span className={s.genderSelected}>（無）</span></>
                    : <span>有・無</span>
                  }
                  <span>介護度：{data?.careLevel || '　'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 医療機関・服薬状況 */}
          <div className={s.sectionRow}>
            <div className={s.sideLabel} style={{ fontSize: '5.5pt' }}>医療機関服薬状況</div>
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
                <div className={s.historyValue}>{data?.historyBirth || '　'}</div>
              </div>
              <div className={s.historyRow}>
                <div className={s.historyLabel}>就学期</div>
                <div className={s.schoolGrid}>
                  {[
                    ['保育所・幼稚園', data?.historyKindergarten],
                    ['小学校',         data?.historyElementary],
                    ['中学校',         data?.historyJuniorHigh],
                    ['高等学校',       data?.historySeniorHigh],
                    ['その他',         data?.historyOtherSchool],
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
                <div className={s.historyValue}>{data?.historyAdult || '　'}</div>
              </div>
              {/* 過去のサービス利用 */}
              <div className={s.historyRow} style={{ flex: 1 }}>
                <div className={s.historyLabel} style={{ fontSize: '5.5pt' }}>過去のサービス利用</div>
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

          {/* 現況 — 수급자증 + 상담지원사업소 */}
          <div className={s.certWrapper}>
            <div className={s.sideLabel}>現　況</div>
            <div className={s.certContent}>

              {/* 수급자증 상단 */}
              <div className={s.certRow}>
                <div className={s.certLabel}>受給者証</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* 지원구분 + 인정유효기간 */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #d0d0d0', minHeight: '19px' }}>
                    <span className={s.certLabel} style={{ minWidth: '44px' }}>支援区分</span>
                    <span className={s.certValue} style={{ minWidth: '20px', borderRight: '1px solid #d0d0d0' }}>
                      {data?.supportLevel || '　'}
                    </span>
                    <span className={s.certLabel}>認定有効期間</span>
                    <span className={s.certValue}>{certPeriod(data?.certValidFrom, data?.certValidTo)}</span>
                  </div>
                  {/* 지급 시정촌 + 교부일 */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #d0d0d0', minHeight: '19px' }}>
                    <span className={s.certLabel}>支給市町村</span>
                    <span className={s.certValue} style={{ borderRight: '1px solid #d0d0d0' }}>
                      {data?.paymentCity || '　'}
                    </span>
                    <span className={s.certLabel}>交付年月日</span>
                    <span className={s.certValue}>{toJaShort(data?.certIssuedDate)}</span>
                  </div>
                  {/* 번호 */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #d0d0d0', minHeight: '19px' }}>
                    <span className={s.certLabel}>番 号</span>
                    <span className={s.certValue}>{data?.certNumber || '　'}</span>
                  </div>
                </div>
              </div>

              {/* 서비스 종별 (지원법) */}
              <div style={{ display: 'flex', borderBottom: '1px solid #d0d0d0', flexShrink: 0 }}>
                <div className={s.certLabel} style={{ minWidth: '32px', writingMode: 'vertical-rl', textAlign: 'center', fontSize: '6pt', padding: '3px 2px' }}>支給決定（支援法）</div>
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

              {/* 서비스 종별 (지역생활지원) */}
              <div style={{ display: 'flex', borderBottom: '1px solid #d0d0d0', flexShrink: 0 }}>
                <div className={s.certLabel} style={{ minWidth: '32px', writingMode: 'vertical-rl', textAlign: 'center', fontSize: '6pt', padding: '3px 2px' }}>支給決定（地域生活支援事業）</div>
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

              {/* 상담지원사업소 */}
              <div style={{ display: 'flex', borderBottom: '1px solid #000', minHeight: '22px', flexShrink: 0 }}>
                <span className={s.certLabel} style={{ fontSize: '6pt' }}>相談支援事業所</span>
                <span className={s.certValue}>{data?.consultationOffice || '　'}</span>
              </div>

            </div>
          </div>{/* /certWrapper */}

          {/* 사회관계도 */}
          <div className={s.socialSection}>
            <div className={s.socialSectionLabel}>社会関係図</div>
            <div className={s.socialDiagramArea}>
              <SocialDiagramSVG nodes={data?.socialRelationNodes} />
            </div>
            {data?.mainOffices && (
              <div className={s.mainOfficesRow}>
                <span style={{ fontWeight: 'bold', fontSize: '6pt' }}>主たる事業所・機関：</span>
                {data.mainOffices}
              </div>
            )}
          </div>

          {/* 기타 정보 */}
          <div className={s.otherInfoRow}>
            <span className={s.certLabel}>その他情報</span>
            <span className={s.certValue}>{data?.otherInfo || '　'}</span>
          </div>

          {/* 주訴 */}
          <div className={s.complaintSection}>
            <div className={s.complaintHeaderRow}>当該事業所利用時の主訴</div>
            {[
              ['本人', '全般', data?.chiefComplaintGeneral],
              ['',     '就労', data?.chiefComplaintWork],
              ['',     '生活', data?.chiefComplaintLife],
              ['',     'その他', data?.chiefComplaintOther],
            ].map(([who, sub, val], i) => (
              <div key={i} className={s.complaintRow}>
                {who && <span className={s.complaintWho}>{who}</span>}
                {!who && <span className={s.complaintWho} />}
                <span className={s.complaintSub}>{sub}</span>
                <span className={s.complaintValue}>{val || '　'}</span>
              </div>
            ))}
            <div className={s.complaintRow}>
              <span className={s.complaintWho}>家族</span>
              <span className={s.complaintValue} style={{ borderLeft: 'none' }}>
                {data?.chiefComplaintFamily || '　'}
              </span>
            </div>
          </div>

          {/* 비고 */}
          <div className={s.remarksSection}>
            <div className={s.remarksSectionLabel}>備 考</div>
            <div className={s.remarksContent}>{data?.remarks || '　'}</div>
          </div>

        </div>{/* /rightCol */}

      </div>{/* /docBody */}

    </div>
  );
};

export default BasicInfoDoc;
