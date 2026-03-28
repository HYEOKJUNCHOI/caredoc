/* Google OAuth2 인증 훅 — GSI(Google Identity Services) + signInWithCredential */
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { loadFromFirestore } from '../lib/firestoreSync';

const PREFIX = 'caredoc-';
const GOOGLE_CLIENT_ID = '425112887582-n0g4ufp2jfmd0ms03adneds2a852gdkm.apps.googleusercontent.com';

export const useAuth = () => {
  const [user, setUser]             = useState(undefined);
  const [loading, setLoading]       = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  /* Firebase Auth 표준 팝업 로그인 */
  const loginWithGoogle = async () => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' }); // 기본적으로 계정 선택창 띄움
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error('[useAuth] signInWithPopup 에러:', e.code);
      if (e.code === 'auth/popup-closed-by-user') {
        setLoginError('ログインがキャンセルされました。');
      } else {
        setLoginError('ログインに失敗しました。もう一度お試しください。');
      }
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    /* Firebase 인증 상태 감지 */
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        localStorage.setItem(PREFIX + 'firebaseUid', JSON.stringify(firebaseUser.uid));
        try {
          await Promise.race([
            loadFromFirestore(firebaseUser.uid),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000)),
          ]);
        } catch (e) { console.warn('Firestore 로드 실패:', e.message); }
      } else {
        localStorage.removeItem(PREFIX + 'firebaseUid');
      }
      setUser(firebaseUser);
      setLoading(false);
      setLoginLoading(false);
    });

    return () => unsub();
  }, []);

  const logout = () => signOut(auth);

  return { user, loading, loginLoading, loginError, loginWithGoogle, logout };
};
