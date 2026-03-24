/* 모니터링기록표 A4 가로 렌더링
   원본 용지 4컬럼 구조:
   번호 | 支援目標 | 支援目標に対し事業所がとりくんだこと... | 本人の満足度・感想等(ABC+텍스트) */

import a4 from '../A4.module.css';

const rt = (txt) => typeof txt === 'object' && txt !== null ? (txt.ja || txt.ko || '') : (txt || '');

const ACHIEVE_OPTS = [
  { val: 'A', label: 'よくできた' },
  { val: 'B', label: 'まあまあできた' },
  { val: 'C', label: 'できなかった' },
];

/* YYYY-MM-DD → 令和YY年MM月DD日 */
const toJaDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  const num = y * 10000 + m * 100 + day;
  let era, ey;
  if (num >= 20190501)      { era = '令和'; ey = y - 2018; }
  else if (num >= 19890108) { era = '平成'; ey = y - 1988; }
  else                      { era = '昭和'; ey = y - 1925; }
  return `${era}${ey}年${m}月${day}日`;
};

const MonitoringDoc = ({ data, user, writeDate }) => {
  const rows = data?.rows || Array.from({ length: 3 }, () => ({}));
  const dateStr = writeDate ? toJaDate(writeDate)
    : (data?.year && data?.month ? `${data.year}年 ${data.month}月` : '');

  return (
    <div className={a4.a4Page} data-a4-page>

      {/* 제목 */}
      <div className={a4.titleRow}>
        <h1 className={a4.docTitle}>モニタリング記録表</h1>
      </div>

      {/* 헤더 — 테이블 형식 */}
      <table className={a4.monHeaderTable} style={{ marginBottom: 6 }}>
        <tbody>
          <tr>
            <th>利用者氏名</th>
            <td style={{ minWidth: 90 }}>{user?.name || '　'}</td>
            <th>記入者名</th>
            <td style={{ minWidth: 90 }}>{user?.manager || '　'}</td>
            <th>記入日</th>
            <td style={{ minWidth: 110 }}>{dateStr}</td>
          </tr>
        </tbody>
      </table>

      {/* 본문 테이블 — 4컬럼 */}
      <table className={a4.monTable} style={{ flex: 1 }}>
        <thead>
          <tr>
            <th className={a4.monNumCol}></th>
            <th className={a4.monGoalCol}>支援目標</th>
            <th className={a4.monContentCol}>
              支援目標に対し事業所がとりくんだこと<br />
              本人の状況・支援をしたことによる変化<br />
              仕事・遊び・活動等の内容具体的に
            </th>
            <th className={a4.monSatCol}>本人の満足度・感想等</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td className={a4.monNumCell}>{idx + 1}</td>
              <td style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {row.goalText || ''}
              </td>
              <td style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {row.contentChange || ''}
              </td>
              <td style={{ verticalAlign: 'top' }}>
                {/* ABC 선택 — 선택된 것은 ○囲み */}
                <div style={{ display: 'flex', gap: 6, fontSize: '7.5pt', marginBottom: 4, flexWrap: 'wrap' }}>
                  {ACHIEVE_OPTS.map(({ val, label }) => {
                    const sel = row.achieve === val;
                    return (
                      <span key={val} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap' }}>
                        <span style={sel ? {
                          display: 'inline-block',
                          border: '1px solid #000',
                          borderRadius: '50%',
                          width: '1.4em', height: '1.4em',
                          lineHeight: '1.4em',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          flexShrink: 0,
                        } : { color: '#888' }}>{val}</span>
                        <span style={{ color: sel ? '#000' : '#aaa' }}>{label}</span>
                      </span>
                    );
                  })}
                </div>
                {/* 만족도 텍스트 */}
                {row.satisfactionText && (
                  <div style={{ fontSize: '8pt', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{row.satisfactionText}</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 하단 — 계획변경 + 의견란 */}
      <div className={a4.monFooter}>
        <div className={a4.monFooterLabel}>計画作成会議の意見欄</div>
        <div className={a4.monFooterBody}>
          <div className={a4.monPlanRow}>
            <span style={{ fontWeight: 'bold', marginRight: 8 }}>支援計画の変更</span>
            {data?.planChanged === true ? (
              <>
                <span className={a4.monCircled}>有</span>
                <span style={{ color: '#aaa' }}>・無</span>
              </>
            ) : (
              <>
                <span style={{ color: '#aaa' }}>有・</span>
                <span className={a4.monCircled}>無</span>
              </>
            )}
          </div>
          <div style={{ flex: 1 }} />
        </div>
      </div>

    </div>
  );
};

export default MonitoringDoc;
