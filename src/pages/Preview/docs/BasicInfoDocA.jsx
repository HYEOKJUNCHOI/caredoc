/* 基本情報 — A面 (좌측 컬럼) */

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

const BasicInfoDocA = ({ d }) => {
  const pad = (arr, n) => { const a = arr || []; return a.length >= n ? a : [...a, ...Array(n - a.length).fill({})]; };
  const medicalRows     = pad(d?.medicalRows,     4);
  const pastServiceRows = pad(d?.pastServiceRows, 3);

  /* 주거상황 선택지 표시 헬퍼 — 선택된 항목만 동그라미 */
  const selOpt = (val, opt) =>
    val === opt
      ? <span key={opt} className={s.circled} style={{ fontWeight: 'bold' }}>{opt}</span>
      : <span key={opt}>{opt}</span>;

  const RESIDENCE_OPTS = ['持家', '賃貸共同住宅', 'グループホーム等', 'その他'];

  const nameKana  = d?.nameKana  || '';
  const nameKanji = d?.nameKanji || '';

  return (
    <div className={s.leftCol}>

      {/* 긴급연락처 — プロフィール 위 */}
      <div className={s.emergencyRow}>
        <span className={s.emLabel}>緊急時の連絡先</span>
        <span className={s.emValue}>
          {d?.emergencyName || '　'}
          {d?.emergencyRelation ? `（${d.emergencyRelation}）` : ''}
        </span>
        <span style={{ borderLeft: '0.5px solid #000', alignSelf: 'stretch' }} />
        <span className={s.emValue}>{d?.emergencyPhone || '　'}</span>
        <span className={s.bloodLabel}>血液型</span>
        <span className={s.bloodValue}>{d?.bloodType || '　'}</span>
      </div>

      {/* ── プロフィール ── */}
      <div className={s.section}>
        <div className={s.sideLabel}>プロフィール</div>
        <div className={s.sectionBody}>

          {/* ふりがな */}
          <div className={s.row} style={{ minHeight: 16 }}>
            <div className={s.fieldLabel}>ふりがな</div>
            <div className={s.fieldValue} style={{ fontSize: '7pt', color: '#666' }}>{nameKana || '　'}</div>
          </div>
          {/* 氏名 */}
          <div className={s.row}>
            <div className={s.fieldLabel}>氏　名</div>
            <div className={s.fieldValue} style={{ fontSize: '9pt', fontWeight: 600 }}>{nameKanji || '　'}</div>
          </div>
          {/* 生年月日・性別 */}
          <div className={s.row}>
            <div className={s.fieldLabel}>生年月日</div>
            <div className={s.fieldValue} style={{ flex: 1 }}>
              {toJaEra(d?.birthDate) || '　'}
              {calcAge(d?.birthDate) !== '' ? `（${calcAge(d?.birthDate)}歳）` : ''}
            </div>
            <div className={s.fieldLabel} style={{ borderLeft: '0.5px solid #000' }}>性別</div>
            <div className={s.fieldValue} style={{ minWidth: 72, justifyContent: 'center' }}>
              {d?.gender === '男性'
                ? <><span className={s.circled}>男性</span>・<span>女性</span></>
                : d?.gender === '女性'
                ? <><span>男性</span>・<span className={s.circled}>女性</span></>
                : <span>男性・女性</span>}
            </div>
          </div>
          {/* 住所 */}
          <div className={s.row}>
            <div className={s.fieldLabel}>住　所</div>
            <div className={s.fieldValue}>{d?.address || '　'}</div>
          </div>
          {/* 住居状況 */}
          <div className={s.row}>
            <div className={s.fieldLabel}>住居状況</div>
            <div className={s.fieldValue} style={{ gap: 3 }}>
              {RESIDENCE_OPTS.map((opt, i) => (
                <span key={opt}>
                  {selOpt(d?.residenceType, opt)}
                  {i < RESIDENCE_OPTS.length - 1 ? '・' : ''}
                </span>
              ))}
            </div>
          </div>
          {/* 電話 */}
          <div className={s.row}>
            <div className={s.fieldLabel}>電　話</div>
            <div className={s.fieldValue}>
              自宅・ホーム：{d?.phoneOffice || d?.phoneHome || '　'}
              携帯：（本人）：{d?.phoneMobile || '　'}
            </div>
          </div>

          {/* 家族状況 + 제노그램 */}
          <div style={{ display: 'flex', height: 160, flexShrink: 0, borderBottom: '0.5px solid #000' }}>
            <div className={s.fieldLabel} style={{ width: '14.5%', fontWeight: 'bold', fontSize: '7.5pt', justifyContent: 'center', alignSelf: 'stretch', whiteSpace: 'normal', textAlign: 'center', wordBreak: 'break-all' }}>
              家族状況
            </div>
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: -7 }}>
                <GenogramSVG members={d?.familyMembers || []} selfGender={d?.gender || '女性'} compact />
              </div>
              <div style={{ writingMode: 'vertical-rl', fontSize: '7pt', padding: '2px 4px', marginRight: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>ジェノグラム</div>
            </div>
          </div>

          {/* 障害の状況 */}
          <div style={{ display: 'flex', flexShrink: 0, borderBottom: '0.5px solid #000' }}>
            <div className={s.fieldLabel} style={{ width: '14.5%', fontWeight: 'bold', fontSize: '7.5pt', justifyContent: 'center', alignSelf: 'stretch', whiteSpace: 'normal', textAlign: 'center', wordBreak: 'break-all' }}>
              障害の状況
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', minHeight: 22, borderBottom: '0.5px solid #000', alignItems: 'stretch' }}>
                <div style={{ width: '17%', background: '#f5f5f5', borderRight: '0.5px solid #000', fontSize: '7.5pt', fontWeight: 600, padding: '2px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>障害・疾病名</div>
                <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px', display: 'flex', alignItems: 'center' }}>{d?.disabilityNames?.length ? d.disabilityNames.join('、') : (d?.disabilityName || '　')}</div>
              </div>
              <div style={{ display: 'flex', minHeight: 22, borderBottom: '0.5px solid #000', alignItems: 'stretch' }}>
                <div style={{ width: '17%', background: '#f5f5f5', borderRight: '0.5px solid #000', fontSize: '7.5pt', fontWeight: 600, padding: '2px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>手　帳</div>
                <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px', display: 'flex', alignItems: 'center' }}>{d?.notebookType || '　'}{d?.notebookLevel ? `　${d.notebookLevel}` : ''}</div>
              </div>
              <div style={{ display: 'flex', minHeight: 22, borderBottom: '0.5px solid #000', alignItems: 'stretch' }}>
                <div style={{ width: '17%', background: '#f5f5f5', borderRight: '0.5px solid #000', fontSize: '7.5pt', fontWeight: 600, padding: '2px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>障害年金</div>
                <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px', display: 'flex', alignItems: 'center' }}>{d?.disabilityPension ? `${d.disabilityPension}　級` : '　'}</div>
              </div>
              <div style={{ display: 'flex', minHeight: 22, alignItems: 'stretch' }}>
                <div style={{ width: '17%', background: '#f5f5f5', borderRight: '0.5px solid #000', fontSize: '7.5pt', fontWeight: 600, padding: '2px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>概　況</div>
                <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px', display: 'flex', alignItems: 'center' }}>{d?.disabilityOverview || '　'}</div>
              </div>
            </div>
          </div>

          {/* 介護保険 */}
          <div style={{ display: 'flex', minHeight: 28, flexShrink: 0, borderBottom: '0.5px solid #000', alignItems: 'stretch' }}>
            <div className={s.fieldLabel} style={{ width: '14.5%', justifyContent: 'center' }}>介護保険</div>
            <div style={{ width: '22%', fontSize: '8.5pt', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 6, borderRight: '0.5px solid #000' }}>
              {d?.careInsurance === '有'
                ? <><span className={s.circled}>有</span>・<span>（無）</span></>
                : d?.careInsurance === '無'
                ? <><span>有</span>・<span className={s.circled}>（無）</span></>
                : <span>有・（無）</span>}
            </div>
            <div style={{ width: '14%', background: '#f5f5f5', borderRight: '0.5px solid #000', fontSize: '7.5pt', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>介護度</div>
            <div style={{ flex: 1, fontSize: '8.5pt', padding: '2px 6px', display: 'flex', alignItems: 'center' }}>{d?.careLevel || '　'}</div>
          </div>

          {/* 医療機関服薬状況 */}
          <div style={{ display: 'flex', flexShrink: 0 }}>
            <div className={s.fieldLabel} style={{ width: '14.5%', fontWeight: 'bold', fontSize: '7pt', justifyContent: 'center', alignSelf: 'stretch', whiteSpace: 'normal', textAlign: 'center', wordBreak: 'keep-all', lineHeight: 1.3 }}>
              医療機関<br />服薬状況
            </div>
            <div style={{ flex: 1 }}>
              <table className={s.medTable}>
                <thead>
                  <tr>
                    <th style={{ width: '29%' }}>病院・診療科目</th>
                    <th style={{ width: '38%' }}>主たる疾患等</th>
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
            </div>
          </div>

        </div>
      </div>

      {/* 既往 + 過去サービス */}
      <div className={s.sectionFill}>
        <div className={s.sideLabel}>既　往</div>
        <div className={s.sectionBody}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', tableLayout: 'fixed', height: '100%' }}>
            <colgroup>
              <col style={{ width: '14.5%' }} />
              <col style={{ width: '18%' }} />
              <col />
            </colgroup>
            <tbody style={{ height: '100%' }}>
              {/* 出生・乳幼児期 */}
              <tr style={{ height: 50 }}>
                <td style={{ background: '#f5f5f5', borderRight: '0.5px solid #000', borderBottom: '0.5px solid #000', padding: '2px 5px', fontSize: '7.5pt', fontWeight: 600, verticalAlign: 'middle', textAlign: 'center' }}>出生・乳幼児期</td>
                <td colSpan={2} style={{ padding: '2px 6px', borderBottom: '0.5px solid #000', verticalAlign: 'middle' }}>{d?.historyBirth || '　'}</td>
              </tr>
              {/* 就学期 */}
              <tr style={{ height: 20 }}>
                <td rowSpan={5} style={{ background: '#efefef', borderRight: '0.5px solid #000', borderBottom: '0.5px solid #000', textAlign: 'center', fontSize: '7.5pt', fontWeight: 'bold', verticalAlign: 'middle' }}>就学期</td>
                <td style={{ background: '#f5f5f5', borderRight: '0.5px solid #000', borderBottom: '0.5px solid #000', padding: '2px 5px', fontSize: '7pt', verticalAlign: 'middle' }}>保育所・幼稚園</td>
                <td style={{ padding: '2px 6px', borderBottom: '0.5px solid #000', verticalAlign: 'middle' }}>{d?.historyKindergarten || '　'}</td>
              </tr>
              <tr style={{ height: 20 }}>
                <td style={{ background: '#f5f5f5', borderRight: '0.5px solid #000', borderBottom: '0.5px solid #000', padding: '2px 5px', fontSize: '7pt', verticalAlign: 'middle' }}>小学校</td>
                <td style={{ padding: '2px 6px', borderBottom: '0.5px solid #000', verticalAlign: 'middle' }}>{d?.historyElementary || '　'}</td>
              </tr>
              <tr style={{ height: 20 }}>
                <td style={{ background: '#f5f5f5', borderRight: '0.5px solid #000', borderBottom: '0.5px solid #000', padding: '2px 5px', fontSize: '7pt', verticalAlign: 'middle' }}>中学校</td>
                <td style={{ padding: '2px 6px', borderBottom: '0.5px solid #000', verticalAlign: 'middle' }}>{d?.historyJuniorHigh || '　'}</td>
              </tr>
              <tr style={{ height: 20 }}>
                <td style={{ background: '#f5f5f5', borderRight: '0.5px solid #000', borderBottom: '0.5px solid #000', padding: '2px 5px', fontSize: '7pt', verticalAlign: 'middle' }}>高等学校</td>
                <td style={{ padding: '2px 6px', borderBottom: '0.5px solid #000', verticalAlign: 'middle' }}>{d?.historySeniorHigh || '　'}</td>
              </tr>
              <tr style={{ height: 20 }}>
                <td style={{ background: '#f5f5f5', borderRight: '0.5px solid #000', borderBottom: '0.5px solid #000', padding: '2px 5px', fontSize: '7pt', verticalAlign: 'middle' }}>その他</td>
                <td style={{ padding: '2px 6px', borderBottom: '0.5px solid #000', verticalAlign: 'middle' }}>{d?.historyOtherSchool || '　'}</td>
              </tr>
              {/* 成人期 */}
              <tr style={{ height: 40 }}>
                <td style={{ background: '#f5f5f5', borderRight: '0.5px solid #000', borderBottom: '0.5px solid #000', padding: '2px 5px', fontSize: '7.5pt', fontWeight: 600, verticalAlign: 'middle' }}>成人期</td>
                <td colSpan={2} style={{ padding: '2px 6px', borderBottom: '0.5px solid #000', verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>{d?.historyAdult ? `\n${d.historyAdult}` : '　'}</td>
              </tr>
              {/* 過去のサービス利用 */}
              <tr>
                <td style={{ background: '#f5f5f5', borderRight: '0.5px solid #000', padding: '2px 5px', fontSize: '7.5pt', fontWeight: 600, verticalAlign: 'top', lineHeight: 1.4, whiteSpace: 'pre-line' }}>{'過去の\nサービス\n利用'}</td>
                <td colSpan={2} style={{ padding: 0, verticalAlign: 'top' }}>
                  <table className={s.medTable} style={{ width: '100%' }}>
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
      </div>

    </div>
  );
};

export default BasicInfoDocA;
