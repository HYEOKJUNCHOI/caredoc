/* Google OAuth2 인증 훅 — GSI(Google Identity Services) + signInWithCredential */
import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithCredential, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { loadFromFirestore } from '../lib/firestoreSync';

const PREFIX = 'caredoc-';
const GOOGLE_CLIENT_ID = '425112887582-n0g4ufp2jfmd0ms03adneds2a852gdkm.apps.googleusercontent.com';

export const useAuth = () => {
  const [user, setUser]             = useState(undefined);
  const [loading, setLoading]       = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  /* GSI 콜백 — Google이 ID 토큰을 전달하면 Firebase에 로그인 */
  const handleCredential = useCallback(async (response) => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      const credential = GoogleAuthProvider.credential(response.credential);
      await signInWithCredential(auth, credential);
    } catch (e) {
      console.error('[useAuth] signInWithCredential 에러:', e.code);
      setLoginError('ログインに失敗しました。もう一度お試しください。');
      setLoginLoading(false);
    }
  }, []);

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
    });

    /* GSI 초기화 — 스크립트 로드 후 실행 */
    const initGSI = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      /* One Tap 자동 표시 방지 */
      window.google?.accounts.id.cancel();
    };
    if (window.google) initGSI();
    else window.addEventListener('load', initGSI);

    return () => {
      unsub();
      window.removeEventListener('load', initGSI);
    };
  }, [handleCredential]);

  const logout = () => signOut(auth);

  return { user, loading, loginLoading, loginError, logout };
};
