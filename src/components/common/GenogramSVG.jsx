/* GenogramSVG — 가족관계도 SVG 자동 렌더링
   관계 → 행(부모/형제+본인/자녀) 자동 배치
   props:
     members  : [{ id, relation, name, gender, note }]
     selfGender: '男性' | '女性' (본인 성별, 기본 女性)
     compact  : boolean (A4 문서 내 소형 렌더링) */

const R_N  = 20;   // 일반 크기 반지름 (社会関係図 기관 타원과 유사한 크기)
const R_C  = 9;    // compact 반지름 (A4 문서 내)
const HG_N = 64;   // 일반 가로 간격
const HG_C = 38;   // compact 가로 간격
const VG_N = 66;   // 일반 세로 간격
const VG_C = 38;   // compact 세로 간격

/* 관계 → 성별 자동 결정 */
const genderOf = (relation, explicit) => {
  if (explicit === 'male' || explicit === 'female') return explicit;
  if (['父', '兄', '弟', '夫'].includes(relation)) return 'male';
  if (['母', '姉', '妹', '妻'].includes(relation)) return 'female';
  return 'female'; // 기본값
};

/* 노드 모양: 男=□ 女=○ 本人=이중 원(성별 무관) / 고인=채움 */
const NodeShape = ({ cx, cy, gender, isSelf, r, deceased }) => {
  const deadFill = '#555';

  /* 본인은 성별 무관하게 이중 원 */
  if (isSelf) {
    return (
      <g>
        <ellipse cx={cx} cy={cy} rx={r + 2.5} ry={r + 2.5} fill="none" stroke="#000" strokeWidth="0.9" />
        <ellipse cx={cx} cy={cy} rx={r} ry={r} fill="#fff" stroke="#000" strokeWidth="0.9" />
      </g>
    );
  }

  if (gender === 'male') {
    const x = cx - r, y = cy - r, s = r * 2;
    return <rect x={x} y={y} width={s} height={s} fill={deceased ? deadFill : '#fff'} stroke="#000" strokeWidth="0.9" />;
  }
  return <ellipse cx={cx} cy={cy} rx={r} ry={r} fill={deceased ? deadFill : '#fff'} stroke="#000" strokeWidth="0.9" />;
};

const GenogramSVG = ({ members = [], selfGender = '女性', compact = false }) => {
  const R  = compact ? R_C  : R_N;
  const HG = compact ? HG_C : HG_N;
  const VG = compact ? VG_C : VG_N;

  /* ── 그룹 분류 ── */
  const parents   = members.filter(m => ['父', '母'].includes(m.relation));
  const leftSibs  = members.filter(m => ['兄', '姉'].includes(m.relation));
  const rightSibs = members.filter(m => ['弟', '妹'].includes(m.relation));
  const wife      = members.find(m => m.relation === '妻');
  const husband   = members.find(m => m.relation === '夫');
  const children  = members.filter(m => m.relation === '子');
  const customs   = members.filter(m => m.relation === 'カスタム');

  /* 중간 행: 兄姉 + (妻?) + 本人 + (夫?) + 弟妹 */
  const midRow = [
    ...leftSibs,
    ...(wife    ? [wife]    : []),
    { relation: '本人', isSelf: true },
    ...(husband ? [husband] : []),
    ...rightSibs,
  ];

  /* ── SVG 너비 계산 ── */
  const colCount = Math.max(midRow.length, parents.length > 0 ? 2 : 1, children.length);
  const W = Math.max(180, colCount * HG + HG);

  /* ── 행 Y 좌표 ── */
  const hasParents  = parents.length > 0;
  const hasChildren = children.length > 0;
  const yParent  = R + 2;
  const ySibling = hasParents ? yParent + VG : R + 2;
  const yChild   = hasChildren ? ySibling + VG : ySibling;
  const yCustom  = yChild + (hasChildren ? VG * 0.8 : 0);
  const svgH     = (hasChildren ? yChild : ySibling) + R + (compact ? 14 : 18) + (customs.length > 0 ? 20 : 0);

  const cx0 = W / 2;

  /* 中間行 x (本人 = cx0) */
  const selfIdx  = midRow.findIndex(m => m.isSelf);
  const midXs    = midRow.map((_, i) => cx0 + (i - selfIdx) * HG);
  const selfX    = midXs[selfIdx];

  /* 부모 x */
  const pairX    = (a, b) => [(a + b) / 2 - HG * 0.45, (a + b) / 2 + HG * 0.45];
  const parentXs = parents.length === 2
    ? pairX(selfX, selfX)
    : parents.length === 1 ? [selfX] : [];

  /* 부모 중앙 x */
  const pCx = parentXs.length === 2 ? (parentXs[0] + parentXs[1]) / 2 : parentXs[0] ?? selfX;

  /* 자녀 x */
  const childXs = children.map((_, i) => selfX + (i - (children.length - 1) / 2) * HG);

  /* 배우자 인덱스 */
  const wifeIdx    = midRow.findIndex(m => m.relation === '妻');
  const husbandIdx = midRow.findIndex(m => m.relation === '夫');

  /* 선 y 중간점 (본인→자녀) */
  const midLineY = (ySibling + R + yChild - R) / 2;

  const fs = compact ? '6.5' : '8';   // 텍스트 폰트 크기
  const selfGdr = selfGender === '男性' ? 'male' : 'female';

  return (
    <svg
      viewBox={`0 0 ${W} ${svgH}`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        /* compact(A4): 컨테이너 높이 100% + 너비 자동 → 비율 유지하며 박스를 채움
           normal(편집): 컨테이너 너비 100%로 채움 */
        height:   '100%',
        width:    compact ? 'auto' : '100%',
        maxWidth: '100%',
        display:  'block',
        overflow: 'visible',
      }}
    >

      {/* ── 부모 가로선 ── */}
      {parents.length === 2 && (
        <line x1={parentXs[0]} y1={yParent} x2={parentXs[1]} y2={yParent} stroke="#000" strokeWidth="0.8" />
      )}

      {/* ── 부모 → 형제 수직선 ── */}
      {hasParents && (
        <line x1={pCx} y1={yParent + R} x2={pCx} y2={ySibling} stroke="#000" strokeWidth="0.8" />
      )}

      {/* ── 형제 가로선 ── */}
      {midRow.length > 1 && (
        <line x1={midXs[0]} y1={ySibling} x2={midXs[midXs.length - 1]} y2={ySibling} stroke="#000" strokeWidth="0.8" />
      )}

      {/* ── 妻 이중선 ── */}
      {wife && wifeIdx >= 0 && (
        <>
          <line x1={midXs[wifeIdx] + R} y1={ySibling - 2} x2={selfX - R} y2={ySibling - 2} stroke="#000" strokeWidth="0.8" />
          <line x1={midXs[wifeIdx] + R} y1={ySibling + 2} x2={selfX - R} y2={ySibling + 2} stroke="#000" strokeWidth="0.8" />
        </>
      )}

      {/* ── 夫 이중선 ── */}
      {husband && husbandIdx >= 0 && (
        <>
          <line x1={selfX + R} y1={ySibling - 2} x2={midXs[husbandIdx] - R} y2={ySibling - 2} stroke="#000" strokeWidth="0.8" />
          <line x1={selfX + R} y1={ySibling + 2} x2={midXs[husbandIdx] - R} y2={ySibling + 2} stroke="#000" strokeWidth="0.8" />
        </>
      )}

      {/* ── 本人 → 자녀 연결선 ── */}
      {hasChildren && (
        <>
          <line x1={selfX} y1={ySibling + R} x2={selfX} y2={midLineY} stroke="#000" strokeWidth="0.8" />
          <line x1={childXs[0]} y1={midLineY} x2={childXs[childXs.length - 1]} y2={midLineY} stroke="#000" strokeWidth="0.8" />
          {childXs.map((x, i) => (
            <line key={i} x1={x} y1={midLineY} x2={x} y2={yChild - R} stroke="#000" strokeWidth="0.8" />
          ))}
        </>
      )}

      {/* ── 부모 노드 ── */}
      {parents.map((m, i) => (
        <g key={i}>
          <NodeShape cx={parentXs[i]} cy={yParent} gender={genderOf(m.relation)} isSelf={false} r={R} deceased={!!m.deceased} />
          <text x={parentXs[i]} y={yParent + R + (compact ? 8 : 10)} textAnchor="middle" fontSize={fs} fill="#000">
            {m.relation}{m.name ? `(${m.name})` : ''}
          </text>
        </g>
      ))}

      {/* ── 중간 행 노드 ── */}
      {midRow.map((m, i) => {
        const gdr = m.isSelf ? selfGdr : genderOf(m.relation, m.gender);
        const label = m.isSelf ? '本人' : `${m.relation}${m.name ? `(${m.name})` : ''}`;
        return (
          <g key={i}>
            <NodeShape cx={midXs[i]} cy={ySibling} gender={gdr} isSelf={!!m.isSelf} r={R} deceased={!!m.deceased} />
            <text x={midXs[i]} y={ySibling + R + (compact ? 8 : 10)} textAnchor="middle" fontSize={fs} fill="#000">
              {label}
            </text>
            {m.note && (
              <text x={midXs[i]} y={ySibling + R + (compact ? 16 : 20)} textAnchor="middle" fontSize={compact ? '5.5' : '7'} fill="#555">
                （{m.note}）
              </text>
            )}
          </g>
        );
      })}

      {/* ── 자녀 노드 ── */}
      {children.map((m, i) => (
        <g key={i}>
          <NodeShape cx={childXs[i]} cy={yChild} gender={genderOf(m.relation, m.gender)} isSelf={false} r={R} deceased={!!m.deceased} />
          <text x={childXs[i]} y={yChild + R + (compact ? 8 : 10)} textAnchor="middle" fontSize={fs} fill="#000">
            {'子'}{m.name ? `(${m.name})` : ''}
          </text>
        </g>
      ))}

      {/* ── 직접 입력 (カスタム) — 오른쪽 하단에 텍스트로 표시 ── */}
      {customs.map((m, i) => {
        const customLabel = m.customRelation
          ? `${m.customRelation}${m.name ? `(${m.name})` : ''}`
          : (m.name || 'カスタム');
        return (
          <text key={i} x={W - 8} y={ySibling + i * (compact ? 12 : 16)} textAnchor="end" fontSize={compact ? '6' : '7.5'} fill="#444">
            ・{customLabel}
          </text>
        );
      })}

    </svg>
  );
};

export default GenogramSVG;
