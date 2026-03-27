/* 基本情報 — B面 (우측 컬럼) */

import s from './BasicInfo.module.css';

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

  const cx = 210, cy = 65;
  const positions = [
    [210, 14],   /* 상단 중앙 */
    [375, 52],   /* 우측 */
    [320, 114],  /* 우하 */
    [100, 114],  /* 좌하 */
    [45,  52],   /* 좌측 */
  ];

  const ovalRx = (text) => Math.max(28, text.length * 3.8);

  /* 타원 경계 위의 점 계산 — pad: 경계에서 추가로 밀어내는 거리 */
  const edgePt = (ex, ey, rx, ry, dx, dy, pad = 0) => {
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len, uy = dy / len;
    const t = 1 / Math.sqrt((ux / rx) ** 2 + (uy / ry) ** 2);
    return [ex + (t + pad) * ux, ey + (t + pad) * uy];
  };

  return (
    <svg
      viewBox="0 0 420 130"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
    >
      <defs>
        <marker id="arr-end-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="#333" />
        </marker>
        <marker id="arr-start-b" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse">
          <polygon points="0 0, 6 3, 0 6" fill="#333" />
        </marker>
      </defs>

      {/* 연결선 — 타원 경계→경계, 양방향 화살표 */}
      {items.map((item, i) => {
        const [px, py] = positions[i];
        const dx = px - cx, dy = py - cy;
        const [x1, y1] = edgePt(cx, cy, 24, 12,  dx,  dy, 5);
        const [x2, y2] = edgePt(px, py, ovalRx(item), 12, -dx, -dy);
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#444" strokeWidth="0.8"
            markerStart="url(#arr-start-b)"
            markerEnd="url(#arr-end-b)"
          />
        );
      })}

      {/* 本人 타원 */}
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

const BasicInfoDocB = ({ d }) => {
  const serviceTypeLaw   = d?.serviceTypeLaw   || [];
  const serviceTypeLocal = d?.serviceTypeLocal || [];

  return (
    <div className={s.rightCol}>

      {/* ① 現況 */}
      <div className={s.section}>
        <div className={s.sideLabel}>現　況</div>
        <div className={s.sectionBody}>

          {/* 受給者証 묶음 */}
          <div style={{ display: 'flex', flexShrink: 0 }}>
            <div className={s.fieldLabel} style={{ writingMode: 'vertical-rl', width: '14.5%', justifyContent: 'center', alignSelf: 'stretch', letterSpacing: 2 }}>受給者証</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* 支援区分 | 4 | 認定有効期間 | 유효기간 */}
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
              {/* 支給決定 통합 테이블 */}
              <table className={s.medTable} style={{ width: '100%' }}>
                <colgroup>
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '48%' }} />
                  <col />
                </colgroup>
                <tbody>
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

          {/* 社会関係図 + 主たる事業所・機関 */}
          <div style={{ flexShrink: 0, display: 'flex', borderBottom: '0.5px solid #000' }}>
            <div className={s.fieldLabel} style={{ writingMode: 'vertical-rl', width: '14.5%', justifyContent: 'center', alignSelf: 'stretch', letterSpacing: 2 }}>社会関係図</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, borderBottom: '0.5px solid #000' }}>
                <SocialDiagramSVG nodes={d?.socialRelationNodes} />
              </div>
              <div style={{ display: 'flex', minHeight: 22, alignItems: 'stretch' }}>
                <div style={{ background: '#f5f5f5', borderRight: '0.5px solid #000', fontSize: '6.5pt', fontWeight: 600, padding: '2px 50px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, whiteSpace: 'nowrap' }}>主たる事業所・機関</div>
                <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px 2px 11px', display: 'flex', alignItems: 'center' }}>{d?.mainOffices || '　'}</div>
              </div>
            </div>
          </div>

          {/* その他情報 */}
          <div className={s.row} style={{ minHeight: 48, borderBottom: '0.5px solid #000' }}>
            <div className={s.fieldLabel}>その他情報</div>
            <div className={s.fieldValue}>{d?.otherInfo || '　'}</div>
          </div>

        </div>
      </div>

      {/* ② 当該事業所利用時の主訴 */}
      <div className={s.section}>
        <div className={s.sideLabelSm} style={{ writingMode: 'horizontal-tb', fontSize: '6.5pt', lineHeight: 1.5, textAlign: 'center', padding: '4px 2px' }}>当該<br/>事業所<br/>利用時<br/>の主訴</div>
        <div className={s.sectionBody}>

          {/* 本人 */}
          <div style={{ display: 'flex', flexShrink: 0, borderBottom: '0.5px solid #000' }}>
            <div className={s.fieldLabel} style={{ writingMode: 'vertical-rl', width: '14.5%', justifyContent: 'center', alignSelf: 'stretch', letterSpacing: 2 }}>本人</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {[
                ['全般', d?.chiefComplaintGeneral],
                ['就労', d?.chiefComplaintWork],
                ['生活', d?.chiefComplaintLife],
                ['その他', d?.chiefComplaintOther],
              ].map(([label, val], i, arr) => (
                <div key={label} style={{ display: 'flex', minHeight: 40, borderBottom: i < arr.length - 1 ? '0.5px solid #000' : 'none', alignItems: 'stretch' }}>
                  <div style={{ width: '22%', background: '#f5f5f5', borderRight: '0.5px solid #000', fontSize: '7.5pt', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{label}</div>
                  <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px 2px 11px', display: 'flex', alignItems: 'center' }}>{val || '　'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 家族 */}
          <div className={s.row} style={{ minHeight: 40, borderBottom: '0.5px solid #000' }}>
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
