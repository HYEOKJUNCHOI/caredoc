/* Google OAuth2 인증 훅 */
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { loadFromFirestore } from '../lib/firestoreSync';

const PREFIX = 'caredoc-';

export const useAuth = () => {
  const [user, setUser]           = useState(undefined);
  const [loading, setLoading]     = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError]     = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        localStorage.setItem(PREFIX + 'firebaseUid', JSON.stringify(firebaseUser.uid));
        try {
          await Promise.race([
            loadFromFirestore(firebaseUser.uid),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000)),
          ]);
        } catch (e) { console.warn('Firestore 로드 실패:', e); }
      } else {
        localStorage.removeItem(PREFIX + 'firebaseUid');
      }
      setUser(firebaseUser);
      setLoading(false);
      setLoginLoading(false);
    });
    return unsub;
  }, []);

  const login = async () => {
    setLoginError(null);
    setLoginLoading(true);
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    try {
      /* 7초 안에 팝업 결과 못 받으면 auth.currentUser 직접 확인 (COOP 우회) */
      await Promise.race([
        signInWithPopup(auth, googleProvider),
        new Promise((_, rej) => setTimeout(() => rej(new Error('coop-timeout')), 7000)),
      ]);
    } catch (e) {
      if (e.message === 'coop-timeout') {
        /* COOP로 팝업 통신 차단된 경우 — 페이지 새로고침으로 auth 상태 반영 */
        window.location.reload();
        return;
      }
      if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        setLoginError(`エラー: ${e.code}`);
        setLoginLoading(false);
      }
    }
  };

  const logout = () => signOut(auth);

  return { user, loading, loginLoading, loginError, login, logout };
};
