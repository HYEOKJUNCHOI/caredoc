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
    /* 리디렉션 후 돌아왔을 때 결과 처리 */
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        localStorage.setItem(PREFIX + 'firebaseUid', JSON.stringify(result.user.uid));
        await loadFromFirestore(result.user.uid);
      }
    }).catch((e) => {
      if (e.code !== 'auth/cancelled-popup-request') {
        setLoginError(`エラー: ${e.code}`);
      }
    });

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        localStorage.setItem(PREFIX + 'firebaseUid', JSON.stringify(firebaseUser.uid));
        await loadFromFirestore(firebaseUser.uid);
      } else {
        localStorage.removeItem(PREFIX + 'firebaseUid');
      }
      setUser(firebaseUser);
      setLoading(false);
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
