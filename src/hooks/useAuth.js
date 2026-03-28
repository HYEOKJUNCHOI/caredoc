/* Google OAuth2 인증 훅 */
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { loadFromFirestore } from '../lib/firestoreSync';

const PREFIX = 'caredoc-';

export const useAuth = () => {
  const [user, setUser]           = useState(undefined);
  const [loading, setLoading]     = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError]     = useState(null);

  useEffect(() => {
    /* 리디렉션 후 복귀 시 결과 처리 — onAuthStateChanged보다 먼저 호출 */
    getRedirectResult(auth).then((result) => {
      if (result?.user) console.log('[useAuth] redirect 로그인 성공:', result.user.email);
    }).catch((e) => {
      console.error('[useAuth] redirect 결과 에러:', e.code, e.message);
      setLoginError(`エラー: ${e.code}`);
    });

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

  const login = () => {
    setLoginError(null);
    setLoginLoading(true);
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    signInWithRedirect(auth, googleProvider);
  };

  const logout = () => signOut(auth);

  return { user, loading, loginLoading, loginError, login, logout };
};
