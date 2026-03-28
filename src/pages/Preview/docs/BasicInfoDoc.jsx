/* 基本情報 — 래퍼 컴포넌트
   A面(BasicInfoDocA)과 B面(BasicInfoDocB)을 조립한다.
   각 면을 독립 파일로 분리하여, 한쪽을 수정해도 다른 쪽에 영향 없음. */

import s from './BasicInfo.module.css';
import BasicInfoDocA from './BasicInfoDocA';
import BasicInfoDocB from './BasicInfoDocB';

/* YYYY-MM-DD → 일본 원호(元号) 표기 — 헤더 날짜 표시용 */
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

/* TODO: 테스트용 샘플 데이터 — 확인 후 삭제 */
const SAMPLE_DATA = {
  nameKana: 'まつもと　ちひろ', nameKanji: '松本　千裕',
  birthDate: '1990-08-14', gender: '女性',
  address: '白浜町中嶋44', residenceType: 'グループホーム等',
  phoneOffice: '34-8811', phoneMobile: '080-8535-3857',
  emergencyName: '父', emergencyPhone: '090-6985-0202',
  facilityName: 'ふたば神島ホーム',
  disabilityName: '両下肢機能全廃（1級）、二分脊椎排便排尿障害（4級）',
  notebookType: '療育手帳　B2　身体障害者手帳', notebookLevel: '1',
  disabilityPension: '1', careInsurance: '無',
  medicalRows: [
    { hospital: 'こころの医療センター', disease: '', medication: '3食後、寝る前' },
    { hospital: '紀南病院泌尿器科', disease: '排尿障害', medication: '' },
    { hospital: '南和歌山皮膚科', disease: '真寿苑クリニック', medication: '南紀医療センター 歯科' },
    { hospital: '整形外科', disease: '高血圧', medication: 'リハビリ' },
  ],
  historyBirth: '大阪府堺市で生まれる',
  historyKindergarten: '南紀福祉センター療育園',
  historyElementary: '安居小学校ー愛徳整肢園ー南紀養護学校（小4から）',
  historyJuniorHigh: '南紀養護学校', historySeniorHigh: '〃',
  historyAdult: 'いきいき作業所ーふたば作業所（H.28.4〜）',
  pastServiceRows: [{ serviceName: '移動支援', facility: '', period: '' }, {}, {}],
  supportLevel: '4', certValidFrom: '2022-09-01', certValidTo: '2025-08-31',
  paymentCity: '白浜町', certIssuedDate: '2022-09-20', certNumber: '40100001602',
  serviceTypeLaw: [
    { type: '共同生活援助（グループホーム）', amount: '' },
    { type: '生活介護', amount: '' },
    { type: '居宅介護', amount: '36h/月（1回2hまで）2人介護可' },
    {},
  ],
  serviceTypeLocal: [
    { type: '日中一時支援（デイサービス）', amount: '2日/月' },
    { type: '移動支援（身体介護有）', amount: '7h/月' },
    {},
  ],
  consultationOffice: '西牟婁障害者支援センター　リーふ',
  socialRelationNodes: 'ヘルパー\nふたば作業所\n奥平マンション\n訪着すてっぷ',
  mainOffices: 'ふたば作業所　奥平マンション',
  otherInfo: '田辺市社協権利擁護事業利用（金銭管理）2か月に1回',
  chiefComplaintGeneral: 'いろいろなことを経験したい',
  chiefComplaintWork:    '給料をたくさん稼ぎたい',
  chiefComplaintLife:    '奥平マンションで良い。できることは自分でやる',
  chiefComplaintOther:   '長期休暇には実家に帰省するのを楽しみにしている',
  chiefComplaintFamily:  '父がホーム利用料や小口が少なくなるとお金を持ってきてくれる。',
  bloodType: 'A',
  familyMembers: [
    { id: '1', relation: '父', name: '', customRelation: '' },
    { id: '2', relation: '母', name: '', customRelation: '' },
  ],
};

const BasicInfoDoc = ({ data, writeDate }) => {
  const hasMeaningfulData = data && (data.nameKanji || data.birthDate || data.address);
  const d = hasMeaningfulData ? data : SAMPLE_DATA;

  const date = writeDate || d?.writeDate || '';

  return (
    <div className={`${s.page} page basic-info-page`} data-a4-page>

      {/* ── 헤더: A面(좌측) 위에만 표시 ── */}
      <div style={{ display: 'flex' }}>
        <div className={s.header} style={{ width: '48%' }}>
          <div className={s.headerTitle}>基 本 情 報</div>
          <div className={s.headerRight}>
            {toJaEra(date) || '　'}<br />
            {d?.facilityName || '　'}
          </div>
        </div>
      </div>

      {/* ── 본문: A面 | 20px 접는 여백 | B面 ── */}
      <div className={s.body}>
        <BasicInfoDocA d={d} />
        <BasicInfoDocB d={d} />
      </div>

    </div>
  );
};

export default BasicInfoDoc;
