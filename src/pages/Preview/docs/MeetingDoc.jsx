/* 작성회의록 A4 가로 렌더링 */

import a4 from '../A4.module.css';

const toJaDate = (iso) => {
  if (!iso) return '年　　月　　日';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}年${m}月${day}日`;
};

const MeetingDoc = ({ data, user, writeDate }) => {
  const rows = data?.rows || Array.from({ length: 2 }, () => ({}));

  return (
    <div className={a4.a4Page} data-a4-page>

      <div className={a4.titleRow}>
        <h1 className={a4.docTitle}>個別支援計画作成会議　会議録</h1>
      </div>

      {/* 헤더 */}
      <table className={a4.meetHeaderTable}>
        <tbody>
          <tr>
            <th>利用者氏名</th>
            <td>{user?.name || '　'}</td>
            <th>記入者名</th>
            <td>{user?.manager || '　'}</td>
            <th>記入年月日</th>
            <td>{toJaDate(writeDate)}</td>
          </tr>
          <tr>
            <th>参加者</th>
            <td colSpan={5}>{data?.participants || '　'}</td>
          </tr>
        </tbody>
      </table>

      {/* 목표별 테이블 */}
      <table className={a4.meetTable}>
        <thead>
          <tr>
            <th className={a4.meetNumCol}></th>
            <th className={a4.meetGoalCol}>支援目標（計画案）</th>
            <th className={a4.meetOpinionCol}>本人の感想等</th>
            <th className={a4.meetReviewCol}>検討内容・対応</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td className={a4.meetNumCell}>{idx + 1}</td>
              <td>{row.goalText || ''}</td>
              <td>
                {(row.opinionTexts || []).map((txt, i) => (
                  <div key={i}>{txt}</div>
                ))}
                {row.opinionCustom && <div>{row.opinionCustom}</div>}
              </td>
              <td>{row.review || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 향후 과제 */}
      <div className={a4.futureSection}>
        <div className={a4.futureLabel}>今後の課題及び確認等</div>
        <div className={a4.futureContent}>{data?.futureTask || ''}</div>
      </div>

    </div>
  );
};

export default MeetingDoc;
