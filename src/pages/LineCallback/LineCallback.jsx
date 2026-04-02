/* LINE Login 콜백 페이지
   LINE OAuth2 인증 후 리디렉션되는 페이지.
   URL 파라미터에서 code를 꺼내 서버 API를 호출하고,
   받은 Firebase Custom Token으로 로그인 완료 후 홈으로 이동한다. */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../lib/firebase';

const LineCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    /* URL 파라미터 파싱
       LINE 성공 시: ?code=xxx&state=xxx
       LINE 취소 시: ?error=access_denied&... */
    const params = new URLSearchParams(window.location.search);
    const code       = params.get('code');
    const errorParam = params.get('error');

    if (errorParam) {
      setError('LINEログインがキャンセルされました。');
      return;
    }

    if (!code) {
      navigate('/', { replace: true });
      return;
    }

    /* 비동기 즉시 실행 함수 (IIFE) — useEffect 내부에서 async/await 사용 패턴 */
    (async () => {
      try {
        /* Vercel 서버리스 함수에 code 전달 → Firebase Custom Token 수신 */
        const res = await fetch(`/api/line-auth?code=${encodeURIComponent(code)}`);
        const data = await res.json();

        if (!data.customToken) {
          throw new Error(data.error || 'customToken 없음');
        }

        /* signInWithCustomToken(사인인위드커스텀토큰):
           서버가 발급한 커스텀 토큰으로 Firebase Auth 로그인
           성공하면 onAuthStateChanged가 자동으로 user 상태를 업데이트 */
        await signInWithCustomToken(auth, data.customToken);

        /* 로그인 완료 → 홈으로 이동 */
        navigate('/', { replace: true });

      } catch (e) {
        console.error('[LineCallback]', e);
        setError('ログインに失敗しました。もう一度お試しください。');
      }
    })();
  }, [navigate]);

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100svh', gap: 16 }}>
        <p style={{ color: '#e00', fontSize: 15 }}>{error}</p>
        <button
          onClick={() => navigate('/', { replace: true })}
          style={{ padding: '10px 24px', background: '#06C755', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}
        >
          戻る
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100svh', color: '#aaa', fontSize: 14 }}>
      LINEログイン処理中...
    </div>
  );
};

export default LineCallback;
