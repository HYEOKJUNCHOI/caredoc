/* Google OAuth2 인증 훅 */
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { loadFromFirestore } from '../lib/firestoreSync';

const PREFIX = 'caredoc-';

export const useAuth = () => {
  const [user, setUser]       = useState(undefined); /* undefined = 로딩 중 */
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /* 리다이렉트 로그인 결과 처리 */
    getRedirectResult(auth).catch(() => {});

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        /* Firebase UID를 localStorage에 저장 → storage.js에서 참조 */
        localStorage.setItem(PREFIX + 'firebaseUid', JSON.stringify(firebaseUser.uid));
        /* Firestore → localStorage 동기화 */
        await loadFromFirestore(firebaseUser.uid);
      } else {
        localStorage.removeItem(PREFIX + 'firebaseUid');
      }
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = () => signInWithRedirect(auth, googleProvider);
  const logout = () => signOut(auth);

  return { user, loading, login, logout };
};
