/* 모니터링기록표 A4 가로 렌더링 */

import a4 from '../A4.module.css';

const ACHIEVE_LABEL = { A: 'A　大変満足', B: 'B　満足', C: 'C　不満足' };

const MonitoringDoc = ({ data, user, writeDate }) => {
  const rows = data?.rows || Array.from({ length: 3 }, () => ({}));

  return (
    <div className={a4.a4Page} data-a4-page>

      <div className={a4.titleRow}>
        <h1 className={a4.docTitle}>モニタリング記録表</h1>
      </div>

      {/* 헤더 */}
      <div className={a4.monHeader}>
        <span>利用者氏名：{user?.name || '　'}</span>
        <span>記入者名：{user?.manager || '　'}</span>
        <span>
          {data?.year || '　　'}年
          &nbsp;・&nbsp;
          {data?.month || '　　'}月
        </span>
      </div>

      {/* 목표별 테이블 */}
      <table className={a4.monTable}>
        <thead>
          <tr>
            <th className={a4.monNumCol}></th>
            <th className={a4.monGoalCol}>支援目標</th>
            <th className={a4.monAchCol}>達成度</th>
            <th className={a4.monSatCol}>本人の満足度・感想</th>
            <th className={a4.monContentCol}>支援内容・状況変化及びモニタリングの所見・次への取り組み</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td className={a4.monNumCell}>{idx + 1}</td>
              <td>{row.goalText || ''}</td>
              <td className={a4.monAchCell}>{row.achieve || ''}</td>
              <td>
                {row.achieve && (
                  <div style={{ fontWeight: 'bold', marginBottom: 2 }}>
                    {ACHIEVE_LABEL[row.achieve]}
                  </div>
                )}
                {(row.satisfactionTexts || []).map((txt, i) => (
                  <div key={i}>{txt}</div>
                ))}
                {(row.customItems || []).map((txt, i) => (
                  <div key={`c${i}`}>{txt}</div>
                ))}
              </td>
              <td>{row.contentChange || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 계획 변경 여부 */}
      <div className={a4.planChangeRow}>
        <span className={a4.planLabel}>計画変更の有無</span>
        <span className={a4.planBox}>
          {data?.planChanged ? '有' : '無'}
        </span>
      </div>

    </div>
  );
};

export default MonitoringDoc;
