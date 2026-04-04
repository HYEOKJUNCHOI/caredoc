/* ============================================================
   storage.js — LocalStorage 유틸리티 + Firestore 동기화
   ============================================================
   【설계 의도】
   - 읽기/쓰기는 localStorage(로컬스토리지)에서 처리 → 동기(同期, 즉시 반환), 속도 빠름
   - 쓰기 시 Firestore(파이어스토어)에도 병렬(並列) 기록 → 비동기(非同期), 클라우드 백업
   - 두 저장소를 동시에 쓰는 이유: 오프라인 환경에서도 동작시키되, 인터넷 연결 시
     클라우드와 자동 동기화하여 다기기(多機器) 접근을 가능하게 하기 위함.

   【면접 포인트】
   - "왜 localStorage와 Firestore를 함께 쓰나요?" →
     localStorage는 오프라인·빠른 읽기에, Firestore는 데이터 영속성·다기기 동기화에 활용.
   - PREFIX('caredoc-')를 붙이는 이유 →
     같은 브라우저에서 다른 앱과 키 충돌을 방지하기 위한 네임스페이스(namespace) 패턴.
   ============================================================ */

/* saveToFirestore(세이브투파이어스토어): Firestore에 저장하는 유틸 함수 */
import { saveToFirestore } from '../lib/firestoreSync';

/* firebase(파이어베이스) UID(유저 식별자)를 localStorage에서 꺼내는 헬퍼.
   JSON.parse(제이슨 파스): 문자열 → 자바스크립트 객체 변환
   try/catch(트라이/캐치): 파싱 실패(예: 값이 null)해도 앱이 죽지 않도록 방어 처리 */
const getFirebaseUid = () => {
  try { return JSON.parse(localStorage.getItem('caredoc-firebaseUid')); } catch { return null; }
};

/* PREFIX(프리픽스 : 접두사) — 모든 키 앞에 붙여 다른 앱과 키 충돌을 방지 */
const PREFIX = 'caredoc-';

/* ──────────────────────────────────────────
   getItem — 안전한 JSON 읽기
   ──────────────────────────────────────────
   【의도】 localStorage는 값을 문자열로만 저장하므로 꺼낼 때 항상 JSON.parse가 필요.
           파싱 실패 시 앱이 멈추지 않도록 try/catch로 감싸고 defaultValue를 돌려줌.
   defaultValue(디폴트밸류 : 기본값) — 값이 없거나 파싱 실패 시 대신 사용할 값 */
export const getItem = (key, defaultValue = null) => {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    /* raw(로우 : 가공 전 원본) — localStorage에서 꺼낸 그대로의 문자열 */
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
};

/* ──────────────────────────────────────────
   setItem — JSON 직렬화 후 저장
   ──────────────────────────────────────────
   JSON.stringify(제이슨 스트링이파이): 자바스크립트 객체 → 문자열 변환 (직렬화, Serialization)
   localStorage는 문자열만 저장할 수 있기 때문에 반드시 stringify 과정이 필요함. */
export const setItem = (key, value) => {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
};

/* removeItem(리무브아이템 : 항목 삭제) — PREFIX를 붙여 정확한 키를 삭제 */
export const removeItem = (key) => {
  localStorage.removeItem(PREFIX + key);
};

/* ── 이용자 관련 헬퍼 ── */

/* getUsers(겟유저스): localStorage에서 이용자 목록 배열을 읽음. 없으면 빈 배열 반환. */
export const getUsers = () => getItem('users', []);

/* saveUsers(세이브유저스): 이용자 목록 저장
   【의도】 전체 배열을 통째로 덮어씀(overwrite). 부분 업데이트가 아닌 전체 교체 방식.
   async/await(어싱크/어웨이트): 비동기 처리를 동기처럼 읽기 쉽게 작성하는 문법.
   Firestore 저장은 시간이 걸리므로 await로 완료를 기다림. */
export const saveUsers = async (users) => {
  setItem('users', users);
  /* 병렬 기록: localStorage 저장 직후 Firestore에도 동일 데이터를 기록.
     네트워크 오류로 Firestore 저장이 실패해도 localStorage에는 이미 저장됨 → 앱 동작 보장. */
  await saveToFirestore(getFirebaseUid(), 'users', users);
};

/* getCurrentUserId(겟커런트유저아이디): 현재 선택된 이용자 ID를 localStorage에서 읽음 */
export const getCurrentUserId = () => getItem('currentUserId', null);
/* setCurrentUserId(셋커런트유저아이디): 현재 이용자 ID를 localStorage에 저장 */
export const setCurrentUserId = (id) => setItem('currentUserId', id);

/* ── 서류 데이터 관련 헬퍼 ── */

/* getDocument(겟도큐먼트): 특정 이용자의 특정 서류 데이터를 읽음
   【데이터 구조】 documents = { userId: { docType: { ...data } } }
   옵셔널 체이닝(?.) — docs[userId]가 undefined여도 에러 없이 null 반환 */
export const getDocument = (userId, docType) => {
  const docs = getItem('documents', {});
  return docs[userId]?.[docType] || null;
};

/* saveDocument(세이브도큐먼트): 특정 이용자의 특정 서류 데이터 저장
   【의도】 기존 documents 전체를 읽은 뒤, 해당 userId/docType 경로만 갱신하고 다시 전체를 저장.
   스프레드 연산자({ ...data }): 기존 data 객체를 복사하면서 updatedAt 필드를 추가/덮어씀.
   updatedAt(업데이티드앳): 마지막 수정 시각을 ISO 문자열로 기록 → 버전 추적에 활용 */
export const saveDocument = async (userId, docType, data) => {
  const docs = getItem('documents', {});
  if (!docs[userId]) docs[userId] = {};
  docs[userId][docType] = { ...data, updatedAt: new Date().toISOString() };
  setItem('documents', docs);
  await saveToFirestore(getFirebaseUid(), 'documents', docs);
};

/* ── 문구 헬퍼 ── */

/* defaultPhrases(디폴트프레이지스): 앱에 기본 내장된 문구 데이터 */
import defaultPhrases from '../data/phrases';

/* getHiddenPhrases(겟히든프레이지스): 사용자가 숨긴(삭제 처리한) 문구 목록 읽기
   【데이터 구조】 hiddenPhrases = { goals: [{ko,ja}], support: [...], satisfaction: [...] } */
export const getHiddenPhrases = () => getItem('hiddenPhrases', {});

/* hidePhrase(하이드프레이즈): 특정 카테고리의 문구를 숨김 목록에 추가
   【의도】 실제 삭제가 아닌 숨김 목록에 추가하는 소프트 삭제(soft delete) 방식.
           복원(restorePhrase)이 가능하도록 원본 데이터는 유지.
   some(썸): 배열 내 조건을 만족하는 항목이 하나라도 있으면 true — 중복 삽입 방지에 활용 */
export const hidePhrase = (category, item) => {
  const hidden = getHiddenPhrases();
  const list   = hidden[category] || [];
  /* 중복 방지 — 이미 숨긴 문구를 다시 숨기지 않도록 ko, ja 쌍으로 비교 */
  if (list.some((p) => p.ko === item.ko && p.ja === item.ja)) return;
  setItem('hiddenPhrases', { ...hidden, [category]: [...list, { ko: item.ko, ja: item.ja }] });
};

/* restorePhrase(리스토어프레이즈): 숨긴 문구를 다시 표시
   filter(필터): 조건에 맞지 않는 항목만 남겨 새 배열 생성 — 숨김 목록에서 해당 항목 제거 */
export const restorePhrase = (category, item) => {
  const hidden  = getHiddenPhrases();
  const updated = (hidden[category] || []).filter((p) => !(p.ko === item.ko && p.ja === item.ja));
  setItem('hiddenPhrases', { ...hidden, [category]: updated });
};

/* getMergedPhrases(겟머지드프레이지스): 기본 문구 + 커스텀 문구를 병합하고 숨긴 항목을 제외해 반환
   【의도】 데이터 소스가 3개(기본/커스텀/숨김)이므로 이를 하나로 합산하는 로직을 모아둠.
   스프레드 연산자([...a, ...b]): 두 배열을 하나로 합치는 ES6(이에스식스) 문법.
   filter + some 조합: "숨긴 목록에 없는 항목만" 추출하는 차집합(差集合) 연산 */
export const getMergedPhrases = (category) => {
  const custom = getItem('customPhrases', {});
  const hidden = getHiddenPhrases()[category] || [];
  const all    = [...(defaultPhrases[category] || []), ...(custom[category] || [])];
  return all.filter((item) => !hidden.some((h) => h.ko === item.ko && h.ja === item.ja));
};

/* getCurrentUser(겟커런트유저): 현재 선택된 이용자 객체 전체를 반환
   【의도】 ID만 저장하고 실제 객체는 users 배열에서 find로 조회 — 데이터 정규화(normalization) 패턴.
   find(파인드): 조건을 만족하는 첫 번째 항목 반환, 없으면 undefined */
export const getCurrentUser = () => {
  const id = getCurrentUserId();
  if (!id) return null;
  return getUsers().find((u) => u.id === id) || null;
};
