/* 基本情報 — A面 (좌측 컬럼)
   레이아웃: 단일 <table border-collapse: collapse>
   - border 겹침 문제 원천 제거 (collapse가 인접 셀 border를 자동 병합)
   - 행 높이 %로 배분 → 짤림 없이 컨테이너 100% 채움
   - 외곽 1px / 내부 0.5px 자동 처리 (collapse rule: 굵은 border가 이김) */

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

/* ── border / 셀 스타일 상수 ── */
const BD = '0.5px solid #000';

/* 세로 사이드 라벨 (プロフィール, 既往) */
const sideLabel = {
  border: BD, writingMode: 'vertical-rl', textAlign: 'center',
  background: '#efefef', fontWeight: 'bold', fontSize: '7.5pt',
  letterSpacing: 2, verticalAlign: 'middle', overflow: 'hidden',
};

/* 필드 라벨 (ふりがな, 氏名 등) */
const fLabel = {
  border: BD, background: '#f5f5f5', fontWeight: 600, fontSize: '7.5pt',
  textAlign: 'center', verticalAlign: 'middle', overflow: 'hidden',
  whiteSpace: 'nowrap', padding: '2px 5px',
};

/* 필드 값 */
const fValue = {
  border: BD, fontSize: '8.5pt', padding: '2px 6px 2px 11px',
  verticalAlign: 'middle', overflow: 'hidden',
};

/* 장애 서브라벨 */
const subLabel = {
  width: '22%', background: '#f5f5f5', borderRight: BD,
  fontSize: '7.5pt', fontWeight: 600, padding: '2px 5px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, alignSelf: 'stretch',
};

/* td 내부 flex 행 (서브 구분이 있는 셀용) */
const flexRow = {
  display: 'flex', height: '100%', alignItems: 'center',
};

const BasicInfoDocA = ({ d }) => {
  const pad = (arr, n) => { const a = arr || []; return a.length >= n ? a : [...a, ...Array(n - a.length).fill({})]; };
  const medicalRows     = pad(d?.medicalRows,     4);
  const pastServiceRows = pad(d?.pastServiceRows, 3);

  /* 주거상황 선택지 표시 헬퍼 */
  const selOpt = (val, opt) =>
    val === opt
      ? <span key={opt} className={s.circled} style={{ fontWeight: 'bold' }}>{opt}</span>
      : <span key={opt}>{opt}</span>;

  const RESIDENCE_OPTS = ['持家', '賃貸共同住宅', 'グループホーム等', 'その他'];

  return (
    <div className={s.leftCol}>
      {/* ── A面 전체: 단일 table ──
          border: 1px = 외곽 프레임
          border-collapse → 내부 셀 0.5px끼리 자동 병합 → 균일한 선 굵기 */}
      <table style={{
        border: '1px solid #000',
        borderCollapse: 'collapse',
        width: '100%',
        height: '100%',
        tableLayout: 'fixed',
      }}>
        <colgroup>
          <col style={{ width: '10%' }} />
          <col style={{ width: '13%' }} />
          <col />
        </colgroup>
        <tbody>

          {/* ═══ Row 0: 緊急時の連絡先 (2%) ═══
               첫 td: border hidden → table 외곽선보다 우선순위 높아 왼쪽 빈 공간 연출
               나머지 colSpan={2}: 정상 테두리 */}
          <tr style={{ height: '2%' }}>
            {/* 왼쪽 빈 공간 — プロフィール(10%) + ふりがな라벨(13%) 합쳐서 숨김 */}
            <td colSpan={2} style={{ borderLeft: 'hidden', borderTop: 'hidden', borderRight: 'none', borderBottom: '1px solid #000', background: '#FFFBEA' }} />
            <td style={{ border: '1px solid #000', padding: 0, fontSize: '7.5pt', background: '#FFFBEA' }}>
              <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <span style={{ width: '22%', flexShrink: 0, background: '#FEF3C7', borderRight: BD, padding: '2px 4px', fontWeight: 'bold', whiteSpace: 'nowrap', alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7pt' }}>
                  緊急時の連絡先
                </span>
                <span style={{ flex: 2, padding: '2px 4px 2px 6px', fontSize: '7.5pt', borderRight: BD, alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>
                  {d?.emergencyName || '　'}
                  {d?.emergencyRelation ? `（${d.emergencyRelation}）` : ''}
                </span>
                <span style={{ flex: 1, padding: '2px 4px 2px 6px', fontSize: '7.5pt', borderRight: BD, alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>
                  {d?.emergencyPhone || '　'}
                </span>
                <span style={{ background: '#FEF3C7', borderRight: BD, padding: '2px 4px', fontWeight: 'bold', whiteSpace: 'nowrap', alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7pt' }}>
                  血液型
                </span>
                <span style={{ padding: '2px 4px', minWidth: 36, fontSize: '7.5pt', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {d?.bloodType || '　'}
                </span>
              </div>
            </td>
          </tr>

          {/* ═══ Row 1: ふりがな (1.5%) ═══ */}
          <tr style={{ height: '1.5%' }}>
            <td rowSpan={13} style={sideLabel}>プロフィール</td>
            <td style={fLabel}>ふりがな</td>
            <td style={{ ...fValue, fontSize: '7pt', color: '#666' }}>{d?.nameKana || '　'}</td>
          </tr>

          {/* ═══ Row 2: 氏名 (2%) ═══ */}
          <tr style={{ height: '2%' }}>
            <td style={fLabel}>氏　名</td>
            <td style={{ ...fValue, fontSize: '9pt', fontWeight: 600 }}>{d?.nameKanji || '　'}</td>
          </tr>

          {/* ═══ Row 3: 生年月日・性別 (2%) ═══ */}
          <tr style={{ height: '2%' }}>
            <td style={fLabel}>生年月日</td>
            <td style={{ ...fValue, padding: 0 }}>
              <div style={flexRow}>
                <div style={{ flex: 1, padding: '2px 6px 2px 11px', borderRight: BD, alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>
                  {toJaEra(d?.birthDate) || '　'}
                  {calcAge(d?.birthDate) !== '' ? `（${calcAge(d?.birthDate)}歳）` : ''}
                </div>
                <div style={{ background: '#f5f5f5', borderRight: BD, padding: '2px 5px', fontWeight: 600, fontSize: '7.5pt', textAlign: 'center', whiteSpace: 'nowrap', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>
                  性別
                </div>
                <div style={{ padding: '2px 6px', minWidth: 72, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '8.5pt' }}>
                  {d?.gender === '男性'
                    ? <><span className={s.circled}>男性</span>・<span>女性</span></>
                    : d?.gender === '女性'
                    ? <><span>男性</span>・<span className={s.circled}>女性</span></>
                    : <span>男性・女性</span>}
                </div>
              </div>
            </td>
          </tr>

          {/* ═══ Row 4: 住所 (2%) ═══ */}
          <tr style={{ height: '2%' }}>
            <td style={fLabel}>住　所</td>
            <td style={fValue}>{d?.address || '　'}</td>
          </tr>

          {/* ═══ Row 5: 住居状況 (2%) ═══ */}
          <tr style={{ height: '2%' }}>
            <td style={fLabel}>住居状況</td>
            <td style={fValue}>
              {RESIDENCE_OPTS.map((opt, i) => (
                <span key={opt}>
                  {selOpt(d?.residenceType, opt)}
                  {i < RESIDENCE_OPTS.length - 1 ? '・' : ''}
                </span>
              ))}
            </td>
          </tr>

          {/* ═══ Row 6: 電話 (2%) ═══ */}
          <tr style={{ height: '2%' }}>
            <td style={fLabel}>電　話</td>
            <td style={fValue}>
              自宅・ホーム：{d?.phoneOffice || d?.phoneHome || '　'}
              {'　'}携帯（本人）：{d?.phoneMobile || '　'}
            </td>
          </tr>

          {/* ═══ Row 7: 家族状況 (22%) ═══ */}
          <tr style={{ height: '22%' }}>
            <td style={{ ...fLabel, whiteSpace: 'normal', wordBreak: 'break-all', fontWeight: 'bold' }}>家族状況</td>
            <td style={{ ...fValue, padding: 0, overflow: 'hidden' }}>
              {/* position: relative → absolute 자식이 td 크기를 기준으로 채움
                  → SVG viewBox가 커져도 td(tr height 22%)가 늘어나지 않음 */}
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', overflow: 'hidden' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {(() => {
                      const members = d?.familyMembers || [];
                      const hasParents  = members.some(m => ['父', '母'].includes(m.relation));
                      const hasChildren = members.some(m => m.relation === '子');
                      const threeRows   = hasParents && hasChildren;
                      return (
                        <div style={{ width: '100%', height: '100%', transform: threeRows ? 'scale(0.9)' : 'none', transformOrigin: 'center center' }}>
                          <GenogramSVG members={members} selfGender={d?.gender || '女性'} compact />
                        </div>
                      );
                    })()}
                  </div>
                  <div style={{ writingMode: 'vertical-rl', fontSize: '7pt', padding: '2px 4px', marginRight: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>ジェノグラム</div>
                </div>
              </div>
            </td>
          </tr>

          {/* ═══ Row 8~11: 障害の状況 (各 3.8%) ═══ */}
          <tr style={{ height: '3.8%' }}>
            <td rowSpan={4} style={{ ...fLabel, whiteSpace: 'normal', wordBreak: 'break-all', fontWeight: 'bold' }}>障害の状況</td>
            <td style={{ ...fValue, padding: 0 }}>
              <div style={flexRow}>
                <div style={subLabel}>障害・疾病名</div>
                <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px', display: 'flex', alignItems: 'center' }}>{d?.disabilityNames?.length ? d.disabilityNames.join('、') : (d?.disabilityName || '　')}</div>
              </div>
            </td>
          </tr>
          <tr style={{ height: '3.8%' }}>
            <td style={{ ...fValue, padding: 0 }}>
              <div style={flexRow}>
                <div style={subLabel}>手　帳</div>
                <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px', display: 'flex', alignItems: 'center' }}>{d?.notebookType || '　'}{d?.notebookLevel ? `　${d.notebookLevel}` : ''}</div>
              </div>
            </td>
          </tr>
          <tr style={{ height: '3.8%' }}>
            <td style={{ ...fValue, padding: 0 }}>
              <div style={flexRow}>
                <div style={subLabel}>障害年金</div>
                <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px', display: 'flex', alignItems: 'center' }}>{d?.disabilityPension ? `${d.disabilityPension}　級` : '　'}</div>
              </div>
            </td>
          </tr>
          <tr style={{ height: '3.8%' }}>
            <td style={{ ...fValue, padding: 0 }}>
              <div style={flexRow}>
                <div style={subLabel}>概　況</div>
                <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px', display: 'flex', alignItems: 'center' }}>{d?.disabilityOverview || '　'}</div>
              </div>
            </td>
          </tr>

          {/* ═══ Row 12: 介護保険 (2.6%) ═══ */}
          <tr style={{ height: '2.6%' }}>
            <td style={fLabel}>介護保険</td>
            <td style={{ ...fValue, padding: 0 }}>
              <div style={flexRow}>
                <div style={{ width: '36%', flexShrink: 0, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 6, borderRight: BD, alignSelf: 'stretch', fontSize: '8.5pt' }}>
                  {d?.careInsurance === '有'
                    ? <><span className={s.circled}>有</span>・<span>（無）</span></>
                    : d?.careInsurance === '無'
                    ? <><span>有</span>・<span className={s.circled}>（無）</span></>
                    : <span>有・（無）</span>}
                </div>
                <div style={{ background: '#f5f5f5', borderRight: BD, fontSize: '7.5pt', fontWeight: 600, padding: '2px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' }}>介護度</div>
                <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px', display: 'flex', alignItems: 'center' }}>{d?.careLevel || '　'}</div>
              </div>
            </td>
          </tr>

          {/* ═══ Row 13: 医療機関服薬状況 (15%) ═══ */}
          <tr style={{ height: '15%' }}>
            <td style={{ ...fLabel, whiteSpace: 'normal', wordBreak: 'keep-all', lineHeight: 1.3, fontSize: '7pt', fontWeight: 'bold' }}>
              医療機関<br />服薬状況
            </td>
            <td style={{ ...fValue, padding: 0 }}>
              <table className={s.medTable} style={{ height: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '36%' }}>病院・診療科目</th>
                    <th style={{ width: '34%' }}>主たる疾患等</th>
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
            </td>
          </tr>

          {/* ═══════════════ 既往 섹션 ═══════════════ */}

          {/* ═══ Row 14: 出生・乳幼児期 (3%) ═══ */}
          <tr style={{ height: '3%' }}>
            <td rowSpan={8} style={sideLabel}>既　往</td>
            <td style={{ ...fLabel, fontSize: '7pt' }}>出生・乳幼児期</td>
            <td style={fValue}>{d?.historyBirth || '　'}</td>
          </tr>

          {/* ═══ Row 15~19: 就学期 (各 3%) ═══ */}
          {[
            ['保育所・幼稚園', d?.historyKindergarten],
            ['小学校',         d?.historyElementary],
            ['中学校',         d?.historyJuniorHigh],
            ['高等学校',       d?.historySeniorHigh],
            ['その他',         d?.historyOtherSchool],
          ].map(([label, val], i) => (
            <tr key={label} style={{ height: '3%' }}>
              {i === 0 && (
                <td rowSpan={5} style={{ ...sideLabel, fontSize: '7.5pt' }}>就学期</td>
              )}
              <td style={{ ...fValue, padding: 0 }}>
                <div style={flexRow}>
                  <div style={{ width: '25%', background: '#f5f5f5', borderRight: BD, fontSize: '7pt', padding: '1px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'stretch' }}>{label}</div>
                  <div style={{ flex: 1, padding: '1px 6px', fontSize: '8pt', display: 'flex', alignItems: 'center' }}>{val || '　'}</div>
                </div>
              </td>
            </tr>
          ))}

          {/* ═══ Row 20: 成人期 (3%) ═══ */}
          <tr style={{ height: '3%' }}>
            <td style={fLabel}>成人期</td>
            <td style={{ ...fValue, verticalAlign: 'top', paddingTop: 4, fontSize: '7.5pt' }}>{d?.historyAdult || '　'}</td>
          </tr>

          {/* ═══ Row 21: 過去のサービス利用 (8%) ═══ */}
          <tr style={{ height: '8%' }}>
            <td style={{ ...fLabel, whiteSpace: 'pre-line', lineHeight: 1.4 }}>{'過去の\nサービス\n利用'}</td>
            <td style={{ ...fValue, padding: 0 }}>
              <table className={s.medTable} style={{ height: '100%' }}>
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
  );
};

export default BasicInfoDocA;
