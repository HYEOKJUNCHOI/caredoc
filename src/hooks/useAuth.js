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
        await loadFromFirestore(firebaseUser.uid);
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
    /* COOP 헤더로 팝업 통신이 차단되어도 onAuthStateChanged가 처리 */
    signInWithPopup(auth, googleProvider).catch((e) => {
      if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        setLoginError(`エラー: ${e.code}`);
      }
      setLoginLoading(false);
    });
  };

  const logout = () => signOut(auth);

  return { user, loading, loginLoading, loginError, login, logout };
};
