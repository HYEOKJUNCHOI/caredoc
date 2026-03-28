/* Firestore ↔ localStorage 동기화 유틸
   - loadFromFirestore : 앱 시작 시 Firestore → localStorage
   - saveToFirestore   : 데이터 저장 시 Firestore에 병렬 기록 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const PREFIX = 'caredoc-';
const ls = {
  get: (key, def = null) => {
    try { const r = localStorage.getItem(PREFIX + key); return r ? JSON.parse(r) : def; } catch { return def; }
  },
  set: (key, val) => localStorage.setItem(PREFIX + key, JSON.stringify(val)),
};

/* Firestore 경로: users/{uid}/data/{key} */
const ref = (uid, key) => doc(db, 'users', uid, 'data', key);

/* 앱 시작 시 Firestore → localStorage 동기화 */
export const loadFromFirestore = async (uid) => {
  const keys = ['users', 'documents', 'customPhrases', 'hiddenPhrases'];
  await Promise.all(keys.map(async (key) => {
    try {
      const snap = await getDoc(ref(uid, key));
      if (snap.exists()) ls.set(key, snap.data().value);
    } catch (e) {
      console.warn(`Firestore load 실패 [${key}]:`, e);
    }
  }));
};

/* 데이터 변경 시 Firestore에 기록 */
export const saveToFirestore = async (uid, key, value) => {
  if (!uid) return;
  try {
    await setDoc(ref(uid, key), { value, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.warn(`Firestore save 실패 [${key}]:`, e);
  }
};
