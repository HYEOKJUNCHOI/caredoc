/* LocalStorage 유틸리티
   - CareDoc의 모든 데이터는 localStorage에 저장
   - key prefix: 'caredoc-' 로 네임스페이스 충돌 방지 */

const PREFIX = 'caredoc-';

/* 안전하게 JSON 읽기 (파싱 실패 시 기본값 반환) */
export const getItem = (key, defaultValue = null) => {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
};

/* JSON 직렬화 후 저장 */
export const setItem = (key, value) => {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
};

/* 삭제 */
export const removeItem = (key) => {
  localStorage.removeItem(PREFIX + key);
};

/* --- 이용자 관련 헬퍼 --- */

/* 이용자 목록 가져오기 */
export const getUsers = () => getItem('users', []);

/* 이용자 저장 (전체 목록 덮어쓰기) */
export const saveUsers = (users) => setItem('users', users);

/* 현재 선택된 이용자 ID */
export const getCurrentUserId = () => getItem('currentUserId', null);
export const setCurrentUserId = (id) => setItem('currentUserId', id);

/* --- 서류 데이터 관련 헬퍼 --- */

/* 특정 이용자의 특정 서류 데이터 가져오기 */
export const getDocument = (userId, docType) => {
  const docs = getItem('documents', {});
  return docs[userId]?.[docType] || null;
};

/* 특정 이용자의 특정 서류 데이터 저장 */
export const saveDocument = (userId, docType, data) => {
  const docs = getItem('documents', {});
  if (!docs[userId]) docs[userId] = {};
  docs[userId][docType] = { ...data, updatedAt: new Date().toISOString() };
  setItem('documents', docs);
};

/* --- 문구 헬퍼 --- */
import defaultPhrases from '../data/phrases';

/* 숨긴(삭제된) 문구 목록 — { goals: [{ko,ja}], support: [...], satisfaction: [...] } */
export const getHiddenPhrases = () => getItem('hiddenPhrases', {});
export const hidePhrase = (category, item) => {
  const hidden = getHiddenPhrases();
  const list   = hidden[category] || [];
  /* 중복 방지 */
  if (list.some((p) => p.ko === item.ko && p.ja === item.ja)) return;
  setItem('hiddenPhrases', { ...hidden, [category]: [...list, { ko: item.ko, ja: item.ja }] });
};
export const restorePhrase = (category, item) => {
  const hidden  = getHiddenPhrases();
  const updated = (hidden[category] || []).filter((p) => !(p.ko === item.ko && p.ja === item.ja));
  setItem('hiddenPhrases', { ...hidden, [category]: updated });
};

/* 기본 문구 + 커스텀 문구 병합 후 숨긴 항목 제외해서 반환 */
export const getMergedPhrases = (category) => {
  const custom = getItem('customPhrases', {});
  const hidden = getHiddenPhrases()[category] || [];
  const all    = [...(defaultPhrases[category] || []), ...(custom[category] || [])];
  return all.filter((item) => !hidden.some((h) => h.ko === item.ko && h.ja === item.ja));
};

/* 현재 이용자 정보 가져오기 */
export const getCurrentUser = () => {
  const id = getCurrentUserId();
  if (!id) return null;
  return getUsers().find((u) => u.id === id) || null;
};
