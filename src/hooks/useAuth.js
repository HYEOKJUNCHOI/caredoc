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
    console.log('[1] useEffect 시작');

    getRedirectResult(auth).then((result) => {
      console.log('[2] getRedirectResult 완료, result:', result?.user?.email ?? 'null');
    }).catch((e) => {
      console.error('[2] getRedirectResult 에러:', e.code, e.message);
      setLoginError(`エラー: ${e.code}`);
    });

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[3] onAuthStateChanged 발화, firebaseUser:', firebaseUser?.email ?? 'null');
      if (firebaseUser) {
        localStorage.setItem(PREFIX + 'firebaseUid', JSON.stringify(firebaseUser.uid));
        console.log('[4] loadFromFirestore 시작');
        try {
          await Promise.race([
            loadFromFirestore(firebaseUser.uid),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000)),
          ]);
          console.log('[5] loadFromFirestore 완료');
        } catch (e) { console.warn('[5] Firestore 로드 실패:', e.message); }
      } else {
        localStorage.removeItem(PREFIX + 'firebaseUid');
      }
      console.log('[6] setUser 호출');
      setUser(firebaseUser);
      setLoading(false);
      setLoginLoading(false);
    });
    return unsub;
  }, []);

  const login = () => {
    console.log('[LOGIN] 버튼 클릭 → signInWithRedirect 호출');
    setLoginError(null);
    setLoginLoading(true);
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    signInWithRedirect(auth, googleProvider);
  };

  const logout = () => signOut(auth);

  return { user, loading, loginLoading, loginError, login, logout };
};
