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
    });
    return unsub;
  }, []);

  const login = async () => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, googleProvider);
      /* 팝업 결과를 명시적으로 처리해 첫 시도에서도 상태 반영 */
      if (result?.user) {
        localStorage.setItem(PREFIX + 'firebaseUid', JSON.stringify(result.user.uid));
        await loadFromFirestore(result.user.uid);
        setUser(result.user);
      }
    } catch (e) {
      /* popup 차단 등 에러 */
      if (e.code !== 'auth/popup-closed-by-user') {
        setLoginError(`エラー: ${e.code}`);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => signOut(auth);

  return { user, loading, loginLoading, loginError, login, logout };
};
