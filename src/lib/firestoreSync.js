/* Firestore ↔ localStorage 동기화 유틸
   - loadFromFirestore : 앱 시작(로그인) 시 Firestore → localStorage로 내려받기
   - saveToFirestore   : 데이터 저장 시 Firestore에 병렬 기록 */

/* ============================================================
   [면접 설명 포인트] firestoreSync.js 역할

   [설계 전략]
   - 읽기는 localStorage(빠름, 오프라인 가능)
   - 쓰기는 localStorage + Firestore 동시 기록
   - 로그인 시 Firestore → localStorage로 최신 데이터를 덮어씀
     → 다른 기기에서 변경된 데이터도 로그인 시 자동 반영됨

   [Firestore 데이터 구조]
   users/{uid}/data/users     → 이용자 목록
   users/{uid}/data/documents → 서류 데이터
   users/{uid}/data/customPhrases  → 사용자 추가 문구
   users/{uid}/data/hiddenPhrases  → 숨긴 문구

   [왜 단일 컬렉션(data)으로 묶었는가?]
   - 각 key를 별도 컬렉션으로 나누면 읽기 요청 수가 늘어나 비용이 증가.
   - 'data' 서브컬렉션 하나에 key별 문서로 저장하면 한 번의 Promise.all로 병렬 로드 가능.
   ============================================================ */

/* doc(닥): Firestore 문서 참조(Reference) 객체 생성
   getDoc(겟닥): 문서를 한 번 읽어오는 함수 (실시간 구독이 아닌 단발성 읽기)
   setDoc(셋닥): 문서를 생성하거나 덮어쓰는 함수 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

/* PREFIX(프리픽스): localStorage 키 충돌 방지용 접두사 */
const PREFIX = 'caredoc-';

/* ls(로컬스토리지 축약 헬퍼): localStorage 읽기/쓰기를 간결하게 감싼 객체
   get: JSON.parse 오류 시 def(기본값)를 반환하는 안전한 읽기
   set: JSON.stringify 후 저장하는 쓰기 */
const ls = {
  get: (key, def = null) => {
    try { const r = localStorage.getItem(PREFIX + key); return r ? JSON.parse(r) : def; } catch { return def; }
  },
  set: (key, val) => localStorage.setItem(PREFIX + key, JSON.stringify(val)),
};

/* Firestore 문서 경로 생성 헬퍼
   예: ref('abc123', 'users') → users/abc123/data/users 문서 참조 반환 */
const ref = (uid, key) => doc(db, 'users', uid, 'data', key);

/* ──────────────────────────────────────────
   loadFromFirestore(로드프롬파이어스토어)
   ─ 로그인 직후 1회 실행
   ─ Firestore에 저장된 4가지 데이터를 모두 localStorage에 덮어씀
   ─ Promise.all(프로미스올): 4개의 비동기 읽기를 병렬 실행 → 대기 시간 최소화
   ─ map(맵): 키 배열 → Promise 배열로 변환하여 Promise.all에 전달
   ────────────────────────────────────────── */
export const loadFromFirestore = async (uid) => {
  const keys = ['users', 'documents', 'customPhrases', 'hiddenPhrases'];
  /* 보안: 로그인 전 이전 사용자의 localStorage 데이터를 먼저 삭제
     다른 계정으로 로그인해도 잔류 데이터가 보이지 않도록 방지 */
  ['users', 'documents', 'customPhrases', 'hiddenPhrases', 'currentUserId'].forEach(
    (key) => localStorage.removeItem(PREFIX + key)
  );
  await Promise.all(keys.map(async (key) => {
    try {
      /* getDoc(겟닥): 해당 경로의 문서를 한 번 읽어옴 */
      const snap = await getDoc(ref(uid, key));
      /* snap.exists(스냅익스티스): 문서가 실제로 존재하는지 확인
         존재하면 snap.data().value로 값을 꺼내 localStorage에 저장 */
      if (snap.exists()) ls.set(key, snap.data().value);
    } catch (e) {
      /* 개별 키 로드 실패는 경고만 출력 — 앱 전체 로딩을 막지 않도록 catch로 처리 */
      console.warn(`Firestore load 실패 [${key}]:`, e);
    }
  }));
};

/* ──────────────────────────────────────────
   saveToFirestore(세이브투파이어스토어)
   ─ 이용자/서류 데이터가 변경될 때마다 호출됨 (storage.js에서 호출)
   ─ setDoc(셋닥): 문서가 없으면 생성, 있으면 덮어씀
   ─ updatedAt(업데이티드앳): 최종 수정 시각을 함께 기록 — 디버깅·충돌 해결에 활용
   ────────────────────────────────────────── */
export const saveToFirestore = async (uid, key, value) => {
  /* uid가 없으면 (비로그인 상태) 저장 건너뜀 */
  if (!uid) return;
  try {
    await setDoc(ref(uid, key), { value, updatedAt: new Date().toISOString() });
  } catch (e) {
    /* 저장 실패는 경고만 출력 — localStorage에는 이미 저장됐으므로 앱 동작에 지장 없음 */
    console.warn(`Firestore save 실패 [${key}]:`, e);
  }
};
