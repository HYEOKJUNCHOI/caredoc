/* 基本情報 — B面 (우측 컬럼)
   受給者証: 5컬럼 단일 table(border-collapse) → 선 정렬 통일
   섹션 wrapper borderBottom → 회색 사이드라벨 구분선 완성
   ※ 섹션 내 마지막 행의 borderBottom 제거 → wrapper borderBottom과 겹침(1px) 방지 */

import s from './BasicInfo.module.css';

const BD = '0.5px solid #000';

/* ── 셀 스타일 상수 ── */
const fLabel = {
  border: BD, background: '#f5f5f5', fontWeight: 600, fontSize: '7.5pt',
  textAlign: 'center', verticalAlign: 'middle', padding: '2px 5px',
  whiteSpace: 'nowrap',
};
const fValue = {
  border: BD, fontSize: '8.5pt', padding: '2px 6px 2px 8px',
  verticalAlign: 'middle',
};

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

/* YYYY-MM-DD → R7年4月1日 단축형 */
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

/* 사회관계도 SVG */
const SocialDiagramSVG = ({ nodes }) => {
  const items = (nodes || '')
    .split('\n')
    .map((str) => str.trim())
    .filter(Boolean)
    .slice(0, 5);

  const cx = 210, cy = 65;
  const positions = [
    [210, 14],
    [375, 52],
    [320, 114],
    [100, 114],
    [45,  52],
  ];

  const ovalRx = (text) => Math.max(28, text.length * 3.8);

  const edgePt = (ex, ey, rx, ry, dx, dy, pad = 0) => {
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len, uy = dy / len;
    const t = 1 / Math.sqrt((ux / rx) ** 2 + (uy / ry) ** 2);
    return [ex + (t + pad) * ux, ey + (t + pad) * uy];
  };

  return (
    <svg viewBox="0 0 420 130" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <defs>
        <marker id="arr-end-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="#333" />
        </marker>
        <marker id="arr-start-b" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse">
          <polygon points="0 0, 6 3, 0 6" fill="#333" />
        </marker>
      </defs>
      {items.map((item, i) => {
        const [px, py] = positions[i];
        const dx = px - cx, dy = py - cy;
        const [x1, y1] = edgePt(cx, cy, 24, 12,  dx,  dy, 5);
        const [x2, y2] = edgePt(px, py, ovalRx(item), 12, -dx, -dy);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#444" strokeWidth="0.8"
            markerStart="url(#arr-start-b)" markerEnd="url(#arr-end-b)" />
        );
      })}
      <ellipse cx={cx} cy={cy} rx="24" ry="12" fill="#fff" stroke="#000" strokeWidth="2" />
      <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize="8" fontWeight="bold">本人</text>
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

const BasicInfoDocB = ({ d }) => {
  const lawRows   = d?.serviceTypeLaw   || [];
  const localRows = d?.serviceTypeLocal || [];

  /* 受給者証 라벨 rowSpan: 3(정보행) + 1(法헤더) + law행 + 地域행 (각 0이면 빈행 1개) */
  const certRowSpan = 4 + (lawRows.length || 1) + (localRows.length || 1);

  return (
    <div className={s.rightCol}>

      {/* ① 現況
          borderBottom → 회색 사이드라벨 포함 전체 너비에 구분선 표시
          ※ 마지막 행(その他情報)의 borderBottom은 제거 — wrapper와 겹침 방지 */}
      <div className={s.section} style={{ borderBottom: BD }}>
        <div className={s.sideLabel}>現　況</div>
        <div className={s.sectionBody}>

          {/* 受給者証 — 5컬럼 단일 table(border-collapse)
              col1: 受給者証(14.5%) | col2: 행라벨(17%) | col3: 1번째값(17%) | col4: 2번째라벨(24%) | col5: 2번째값 */}
          <table className={s.certTable} style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '14.5%' }} />
              <col style={{ width: '17%' }} />
              <col style={{ width: '17%' }} />
              <col style={{ width: '24%' }} />
              <col />
            </colgroup>
            <tbody>

              {/* 支援区分 — 첫 행: 모든 셀 borderTop: none (rightCol 1px top border와 겹침 방지) */}
              <tr style={{ height: 22 }}>
                <td rowSpan={certRowSpan} style={{
                  ...fLabel, writingMode: 'vertical-rl', background: '#efefef',
                  fontWeight: 'bold', fontSize: '7.5pt', letterSpacing: 2, verticalAlign: 'middle',
                  borderLeft: 'none', borderTop: 'none',
                }}>受給者証</td>
                <td style={{ ...fLabel, borderTop: 'none' }}>支援区分</td>
                <td style={{ ...fValue, borderTop: 'none', textAlign: 'center', fontSize: '9pt', fontWeight: 'bold' }}>{d?.supportLevel || '　'}</td>
                <td style={{ ...fLabel, borderTop: 'none' }}>認定有効期間</td>
                <td style={{ ...fValue, borderTop: 'none', borderRight: 'none', fontSize: '7pt' }}>{certPeriod(d?.certValidFrom, d?.certValidTo)}</td>
              </tr>

              {/* 支給市町村 */}
              <tr style={{ height: 22 }}>
                <td style={fLabel}>支給市町村</td>
                <td style={fValue}>{d?.paymentCity || '　'}</td>
                <td style={fLabel}>交付年月日</td>
                <td style={{ ...fValue, borderRight: 'none', fontSize: '7.5pt' }}>{toJaShort(d?.certIssuedDate)}</td>
              </tr>

              {/* 番号 — col3+col4+col5 병합 */}
              <tr style={{ height: 22 }}>
                <td style={fLabel}>番　号</td>
                <td colSpan={3} style={{ ...fValue, borderRight: 'none' }}>{d?.certNumber || '　'}</td>
              </tr>

              {/* 支給決定(支援法) 헤더 */}
              <tr style={{ height: 18 }}>
                <td rowSpan={(lawRows.length || 1) + 1} style={{
                  ...fLabel, fontSize: '6pt', lineHeight: 1.3,
                  wordBreak: 'break-all', whiteSpace: 'normal',
                }}>支給決定<br/>（支援法）</td>
                <th colSpan={2} style={{ ...fLabel, background: '#efefef' }}>サービス種別</th>
                <th style={{ ...fLabel, background: '#efefef', whiteSpace: 'normal', fontSize: '6.5pt', borderRight: 'none' }}>支給量（当該月の日数/月）</th>
              </tr>

              {/* 支給決定(支援法) 데이터 행 */}
              {(lawRows.length ? lawRows : [{}]).map((row, i) => (
                <tr key={`law-${i}`} style={{ height: 22 }}>
                  <td colSpan={2} style={fValue}>{row.type || '　'}</td>
                  <td style={{ ...fValue, borderRight: 'none' }}>{row.amount || '　'}</td>
                </tr>
              ))}

              {/* 支給決定(地域生活支援事業) 데이터 행 */}
              {(localRows.length ? localRows : [{}]).map((row, i) => (
                <tr key={`local-${i}`} style={{ height: 22 }}>
                  {i === 0 && (
                    <td rowSpan={localRows.length || 1} style={{
                      ...fLabel, fontSize: '6pt', lineHeight: 1.3,
                      wordBreak: 'break-all', whiteSpace: 'normal',
                    }}>支給決定<br/>（地域生活<br/>支援事業）</td>
                  )}
                  <td colSpan={2} style={fValue}>{row.type || '　'}</td>
                  <td style={{ ...fValue, borderRight: 'none' }}>{row.amount || '　'}</td>
                </tr>
              ))}

            </tbody>
          </table>

          {/* 相談支援事業所 */}
          <div className={s.row} style={{ minHeight: 22 }}>
            <div className={s.fieldLabel}>相談支援事業所</div>
            <div className={s.fieldValue}>{d?.consultationOffice || '　'}</div>
          </div>

          {/* 社会関係図 + 主たる事業所・機関 */}
          <div style={{ flexShrink: 0, display: 'flex', borderBottom: BD }}>
            <div className={s.fieldLabel} style={{ writingMode: 'vertical-rl', width: '14.5%', justifyContent: 'center', alignSelf: 'stretch', letterSpacing: 2 }}>社会関係図</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, borderBottom: BD }}>
                <SocialDiagramSVG nodes={d?.socialRelationNodes} />
              </div>
              <div style={{ display: 'flex', minHeight: 22, alignItems: 'stretch' }}>
                <div style={{ background: '#f5f5f5', borderRight: BD, fontSize: '6.5pt', fontWeight: 600, padding: '2px 50px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, whiteSpace: 'nowrap' }}>主たる事業所・機関</div>
                <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px 2px 11px', display: 'flex', alignItems: 'center' }}>{d?.mainOffices || '　'}</div>
              </div>
            </div>
          </div>

          {/* その他情報 — borderBottom 제거: 섹션 wrapper의 borderBottom이 담당 */}
          <div className={s.row} style={{ minHeight: 48, borderBottom: 'none' }}>
            <div className={s.fieldLabel}>その他情報</div>
            <div className={s.fieldValue}>{d?.otherInfo || '　'}</div>
          </div>

        </div>
      </div>

      {/* ② 当該事業所利用時の主訴
          borderBottom → 구분선
          ※ 마지막 행(家族)의 borderBottom은 제거 — wrapper와 겹침 방지 */}
      <div className={s.section} style={{ borderBottom: BD }}>
        <div className={s.sideLabelSm} style={{ writingMode: 'horizontal-tb', fontSize: '6.5pt', lineHeight: 1.5, textAlign: 'center', padding: '4px 2px' }}>当該<br/>事業所<br/>利用時<br/>の主訴</div>
        <div className={s.sectionBody}>

          {/* 本人 */}
          <div style={{ display: 'flex', flexShrink: 0, borderBottom: BD }}>
            <div className={s.fieldLabel} style={{ writingMode: 'vertical-rl', width: '14.5%', justifyContent: 'center', alignSelf: 'stretch', letterSpacing: 2 }}>本人</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {[
                ['全般', d?.chiefComplaintGeneral],
                ['就労', d?.chiefComplaintWork],
                ['生活', d?.chiefComplaintLife],
                ['その他', d?.chiefComplaintOther],
              ].map(([label, val], i, arr) => (
                <div key={label} style={{ display: 'flex', minHeight: 40, borderBottom: i < arr.length - 1 ? BD : 'none', alignItems: 'stretch' }}>
                  <div style={{ width: '22%', background: '#f5f5f5', borderRight: BD, fontSize: '7.5pt', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{label}</div>
                  <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px 2px 11px', display: 'flex', alignItems: 'center' }}>{val || '　'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 家族 — borderBottom 제거: 섹션 wrapper의 borderBottom이 담당 */}
          <div className={s.row} style={{ minHeight: 40, borderBottom: 'none' }}>
            <div className={s.fieldLabel}>家族</div>
            <div className={s.fieldValue}>{d?.chiefComplaintFamily || '　'}</div>
          </div>

        </div>
      </div>

      {/* ③ 備考 */}
      <div className={s.sectionFill}>
        <div className={s.sideLabel} style={{ writingMode: 'horizontal-tb' }}>備　考</div>
        <div style={{ flex: 1, padding: '6px 8px 6px 13px', fontSize: '8.5pt', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {d?.remarks || ''}
        </div>
      </div>

    </div>
  );
};

export default BasicInfoDocB;
