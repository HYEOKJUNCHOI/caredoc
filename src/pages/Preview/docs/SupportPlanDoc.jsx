/* 개별지원계획서 A4 가로 렌더링
   - data: goPreview()에서 저장된 언어 확정 스냅샷
   - user: 이용자 정보 (name, manager)
   - writeDate: 기입 연월일 (YYYY-MM-DD 또는 표시용 문자열) */

import a4 from '../A4.module.css';

/* YYYY-MM-DD → 令和XX年 MM月 DD日 형식으로 변환 */
const toJaDate = (iso) => {
  if (!iso) return '年　　月　　日';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}年${m}月${day}日`;
};

const NOTE_TEXTS = [
  '必要に応じて、関係機関と情報を共有することがありますので、ご了承ください。（情報は必要最小限の範囲です。）',
  '夜間定時見守りを行います（エアコン、寝具の調整等）',
  '入院時に必要な支援を行います（病院との連携や調整、洗濯物・必需品の購入などの支援）',
  '帰宅する時は家族と連絡調整をする（お互いの生活の様子を共有する）。また、緊急時の連絡先を伝えあっておく。',
];

const DISCLAIMER =
  '※本計画書は、記入年月日現在における契約期間満了時までの目標と支援計画を示したものであり、状況により計画の変更及び見直しが生じる場合があります。計画の変更及び見直しが生じた場合は、再度利用者に説明し同意を得るものです。';

/* {ko, ja} 이중언어 객체 → 일본어 문자열로 변환 */
const rt = (txt) => typeof txt === 'object' && txt !== null ? (txt.ja || txt.ko || '') : (txt || '');

const SupportPlanDoc = ({ data, user, writeDate }) => {
  const goals   = data?.shortTermGoals  || [];
  const support = data?.supportContent  || [];
  const notes   = data?.specialNotes    ?? [true, true, true, true];

  /* 단기목표·지원내용: 각 항목을 줄바꿈으로 합쳐 단일 셀에 표시 */
  const goalText    = goals.map(rt).join('\n');
  const supportText = support.map(rt).join('\n') || (data?.supportContentCustom || '');

  return (
    <div className={`${a4.a4Page} page`} data-a4-page>

      {/* 제목 + 우측 헤더 테이블을 한 행에 배치 */}
      <div className={a4.titleRow}>
        <h1 className={a4.docTitle}>個別支援計画書（共同生活援助）</h1>
        <table className={a4.infoTable}>
          <tbody>
            <tr>
              <th>利用者氏名</th>
              <td>{user?.name || '　'}</td>
            </tr>
            <tr>
              <th>記入年月日</th>
              <td>{toJaDate(writeDate)}</td>
            </tr>
            <tr>
              <th>記入者名</th>
              <td>{user?.manager || '栗須康子'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 1. 본인 의향·니즈 */}
      <div className={a4.section}>
        <div className={a4.sectionLabel}>
          <span className={a4.sectionNum}>1</span>
          本人（家族）の意向（ニーズ）
        </div>
        <div className={a4.sectionContent}>{data?.needs || ''}</div>
      </div>

      {/* 2. 장기목표 */}
      <div className={a4.section}>
        <div className={a4.sectionLabel}>
          <span className={a4.sectionNum}>2</span>
          長期目標（総合的な援助の方針）
        </div>
        <div className={a4.sectionContent}>{data?.longTermGoal || ''}</div>
      </div>

      {/* 3. 단기목표 + 지원내용 테이블 */}
      <div className={a4.goalSection}>
        <div className={a4.goalSectionLabel}>
          <span className={a4.sectionNum}>3</span>
          短期目標及び具体的支援内容
        </div>
        <table className={a4.goalTable}>
          <thead>
            <tr>
              <th className={a4.goalCol}>短期目標</th>
              <th className={a4.supportCol}>具体的支援内容</th>
              <th className={a4.periodCol}>期間</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ height: '120px' }}>
              <td className={a4.goalCol}>{goalText}</td>
              <td className={a4.supportCol}>{supportText}</td>
              <td className={a4.periodCell}>①〜②　3ヵ月</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. 특기사항 */}
      <div className={a4.notesSection}>
        <div className={a4.notesLabel}>
          <span className={a4.sectionNum}>4</span>
          特記事項
        </div>
        <div className={a4.notesContent}>
          {NOTE_TEXTS.map((text, idx) => (
            <div key={idx} className={a4.noteItem}>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* 면책 안내 */}
      <p className={a4.disclaimer}>{DISCLAIMER}</p>

      {/* 동의란 */}
      <div className={a4.consentArea}>
        <span className={a4.consentTitle}>上記の計画に同意します</span>
        <span className={a4.consentDate}>
          説明（同意）日：{toJaDate(data?.consentDate)}
        </span>
        <div className={a4.signGroup}>
          <span>同意署名</span>
          <div className={a4.signLine}>{data?.consentSign || ''}</div>
        </div>
      </div>

    </div>
  );
};

export default SupportPlanDoc;
