/* 개별지원계획서 A4 가로 렌더링
   - data: goPreview()에서 저장된 언어 확정 스냅샷
   - user: 이용자 정보 (name, manager)
   - writeDate: 기입 연월일 (YYYY-MM-DD 또는 표시용 문자열) */

/*
  [컴포넌트 개요 — 면접 설명용]
  이 파일은 '個別支援計画書(개별지원계획서)'를 A4 가로 용지 크기로 렌더링하는
  순수 표시(Presentational) 컴포넌트입니다.

  핵심 기술 포인트:
  1. Presentational Component(프레젠테이셔널 컴포넌트) 패턴
     → 이 컴포넌트는 데이터를 직접 가져오지 않고, props로만 받아서 화면에 표시합니다.
       로직(언제 데이터를 불러올지 등)은 부모 컴포넌트(Preview.jsx)가 담당합니다.
  2. 유틸리티 함수 분리 — toJaDate, rt
     → 날짜 변환, 언어 분기 처리를 컴포넌트 밖에 분리해 재사용성과 테스트 용이성을 높였습니다.
  3. 상수 배열로 반복 텍스트 관리 — NOTE_TEXTS, DISCLAIMER
     → 하드코딩된 텍스트를 배열/상수로 분리하면 내용 변경 시 한 곳만 수정하면 됩니다.
*/

import a4 from '../A4.module.css';

/*
  toJaDate(투자데이트): ISO 날짜 문자열을 일본식 연월일 표기로 변환하는 유틸리티 함수
  ─ 입력: 'YYYY-MM-DD' 형식 문자열 (예: '2024-04-01')
  ─ 출력: '2024年04月01日' 형식 문자열
  ─ 왜 분리했는가?
    → 같은 변환 로직이 여러 Doc 컴포넌트에서 반복되므로 각 파일에서 독립적으로 정의해
      의존성 없이 사용할 수 있도록 했습니다.
  ─ padStart(패드스타트): 문자열 앞에 지정 문자를 채워 자릿수를 맞춥니다.
    예: '4' → '04' (2자리)
*/
const toJaDate = (iso) => {
  if (!iso) return '年　　月　　日';
  const d = new Date(iso);
  if (isNaN(d)) return iso; /* 유효하지 않은 날짜면 원본 문자열 그대로 반환 */
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}年${m}月${day}日`;
};

/*
  NOTE_TEXTS(노트텍스츠): 특기사항에 고정으로 들어가는 텍스트 목록
  ─ 왜 배열로 분리했는가?
    → JSX 안에 긴 문자열을 직접 쓰면 가독성이 떨어지고,
      map()으로 렌더링하면 항목 추가/제거가 쉬워집니다.
*/
const NOTE_TEXTS = [
  '必要に応じて、関係機関と情報を共有することがありますので、ご了承ください。（情報は必要最小限の範囲です。）',
  '夜間定時見守りを行います（エアコン、寝具の調整等）',
  '入院時に必要な支援を行います（病院との連携や調整、洗濯物・必需品の購入などの支援）',
  '帰宅する時は家族と連絡調整をする（お互いの生活の様子を共有する）。また、緊急時の連絡先を伝えあっておく。',
];

/* DISCLAIMER(디스클레이머): 면책/안내 고정 문구. 법적 안내 문구라 변경 빈도가 낮아 상수로 분리 */
const DISCLAIMER =
  '※本計画書は、記入年月日現在における契約期間満了時までの目標と支援計画を示したものであり、状況により計画の変更及び見直しが生じる場合があります。計画の変更及び見直しが生じた場合は、再度利用者に説明し同意を得るものです。';

/*
  rt(알티): resolve text의 약자. 이중언어 객체에서 일본어 텍스트를 꺼내는 헬퍼 함수
  ─ 왜 필요한가?
    → 입력 폼에서 저장할 때 { ko: '목표', ja: '目標' } 형태로 저장될 수 있습니다.
      이 함수는 그 객체에서 ja(일본어)를 우선 추출하고,
      없으면 ko(한국어), 그것도 없으면 빈 문자열을 반환합니다.
  ─ typeof txt === 'object': 일반 문자열과 객체를 구분하는 타입 체크
*/
const rt = (txt) => typeof txt === 'object' && txt !== null ? (txt.ja || txt.ko || '') : (txt || '');

/*
  SupportPlanDoc(서포트플랜닥): 개별지원계획서 렌더링 컴포넌트
  ─ props(프롭스): 부모에서 전달받는 값들
    · data: 서류 내용 (목표, 지원 내용, 동의 정보 등)
    · user: 이용자 기본 정보 (이름, 담당자명)
    · writeDate: 기입 날짜
*/
const SupportPlanDoc = ({ data, user, writeDate }) => {
  /* Optional Chaining(옵셔널 체이닝) '?.'
     → data가 null이거나 해당 키가 없어도 에러 없이 undefined를 반환합니다.
       데이터가 아직 로드되지 않은 상태를 안전하게 처리하기 위해 사용합니다. */
  const goals   = data?.shortTermGoals  || [];
  const support = data?.supportContent  || [];

  /* Nullish Coalescing(널리시 코얼레싱) '??'
     → ?? 앞 값이 null 또는 undefined일 때만 뒤 값 사용 (false, 0 은 그대로 통과)
     notes가 없으면 모두 true(체크됨)로 기본값 설정 */
  const notes   = data?.specialNotes    ?? [true, true, true, true];

  /* 단기목표·지원내용: 각 항목을 줄바꿈으로 합쳐 단일 셀에 표시
     join('\n'): 배열 요소를 줄바꿈 문자로 연결해 하나의 문자열로 만듦 */
  const goalText    = goals.map(rt).join('\n');
  /* 지원내용: goals와 동일 방식. 없을 경우 커스텀 입력값으로 폴백 */
  const supportText = support.map(rt).join('\n') || (data?.supportContentCustom || '');

  return (
    /* data-a4-page: CSS에서 인쇄 영역을 식별하기 위한 커스텀 속성 */
    <div className={`${a4.a4Page} page`} data-a4-page>

      {/* 제목 + 우측 헤더 테이블을 한 행에 배치
          titleRow 클래스가 flexbox로 제목과 정보 테이블을 좌우로 배치 */}
      <div className={a4.titleRow}>
        <h1 className={a4.docTitle}>個別支援計画書（共同生活援助）</h1>
        <table className={a4.infoTable}>
          <tbody>
            <tr>
              <th>利用者氏名</th>
              {/* user?.name이 없으면 전각 공백('　')으로 셀을 채워 레이아웃 유지 */}
              <td>{user?.name || '　'}</td>
            </tr>
            <tr>
              <th>記入年月日</th>
              <td>{toJaDate(writeDate)}</td>
            </tr>
            <tr>
              <th>記入者名</th>
              {/* 담당자명이 없으면 고정 기본값 사용 */}
              <td>{user?.manager || '栗須康子'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 1. 본인 의향·니즈
          sectionContent 안에서 whiteSpace: pre-wrap이 적용되어 줄바꿈이 보존됩니다 */}
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

      {/* 3. 단기목표 + 지원내용 테이블
          goalText와 supportText는 위에서 배열을 '\n'으로 join한 문자열입니다 */}
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
            {/* height: '100%' — 테이블 행이 남은 공간을 모두 채우도록 설정 */}
            <tr style={{ height: '100%' }}>
              <td className={a4.goalCol}>{goalText}</td>
              <td className={a4.supportCol}>{supportText}</td>
              <td className={a4.periodCell}>①〜②　3ヵ月</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. 특기사항
          map(맵): NOTE_TEXTS 배열을 순회하며 각 항목을 <div>로 렌더링
          key(키): React가 리스트 항목을 구분하기 위해 필요한 고유 식별자 */}
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

      {/* 면책 안내 — 고정 문구 */}
      <p className={a4.disclaimer}>{DISCLAIMER}</p>

      {/* 동의란 — 이용자의 서류 동의 서명 영역 */}
      <div className={a4.consentArea}>
        <span className={a4.consentTitle}>上記の計画に同意します</span>
        <span className={a4.consentDate}>
          説明（同意）日：{toJaDate(data?.consentDate)}
        </span>
        <div className={a4.signGroup}>
          <span>同意署名</span>
          {/* consentSign(동의서명): 입력된 서명 텍스트. 없으면 빈 셀 */}
          <div className={a4.signLine}>{data?.consentSign || ''}</div>
        </div>
      </div>

    </div>
  );
};

export default SupportPlanDoc;
