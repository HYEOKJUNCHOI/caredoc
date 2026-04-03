/* ============================================================
   useAuth.js — Google OAuth2 인증 커스텀 훅
   ============================================================
   【설계 의도】
   - 인증 관련 상태(state)와 로직을 하나의 커스텀 훅(custom hook)으로 분리.
   - 컴포넌트에서는 useAuth()를 호출하기만 하면 로그인/로그아웃/상태를 모두 사용할 수 있음.
   - 관심사 분리(Separation of Concerns): 화면 컴포넌트가 인증 로직을 직접 갖지 않아
     유지보수가 쉬워지고, 여러 컴포넌트에서 같은 인증 상태를 재사용 가능.

   【면접 포인트】
   - "왜 커스텀 훅으로 분리했나요?" →
     인증 로직은 여러 페이지에서 필요하고, 컴포넌트 안에 두면 코드가 복잡해짐.
     커스텀 훅으로 분리하면 재사용성과 테스트 용이성이 높아짐.
   - "user가 undefined인 경우와 null인 경우의 차이는?" →
     undefined = 아직 Firebase에서 인증 상태를 확인 중 (로딩 중)
     null = 확인 완료, 비로그인 상태
     null = 확인 완료, 로그인 상태 (Firebase User 객체)
   ============================================================ */

/* useState(유즈스테이트): 컴포넌트/훅 내부 상태 관리 훅 — 값이 바뀌면 리렌더 발생
   useEffect(유즈이펙트): 렌더 이후 사이드 이펙트(네트워크, 구독 등) 실행 훅 */
import { useState, useEffect } from 'react';

/* onAuthStateChanged(온어스스테이트체인지드): Firebase 인증 상태 변화를 구독(subscribe)하는 함수
   signInWithPopup(사인인위드팝업): 팝업 창으로 OAuth 로그인 시도
   GoogleAuthProvider(구글어스프로바이더): Google 로그인 제공자 객체
   signOut(사인아웃): Firebase 로그아웃 함수 */
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, setPersistence, browserSessionPersistence } from 'firebase/auth';

/* auth(어스): 초기화된 Firebase Auth 인스턴스 */
import { auth } from '../lib/firebase';

/* loadFromFirestore(로드프롬파이어스토어): 로그인 시 Firestore 데이터를 로컬로 내려받는 함수 */
import { loadFromFirestore } from '../lib/firestoreSync';

/* PREFIX(프리픽스 : 접두사) — localStorage 키 충돌 방지용 네임스페이스 */
const PREFIX = 'caredoc-';

/* GOOGLE_CLIENT_ID(구글클라이언트아이디): OAuth2 앱 식별자 — Google Cloud Console에서 발급 */
const GOOGLE_CLIENT_ID = '425112887582-n0g4ufp2jfmd0ms03adneds2a852gdkm.apps.googleusercontent.com';

/* ──────────────────────────────────────────
   useAuth — 인증 상태 커스텀 훅
   반환값:
     user         : Firebase User 객체 | null | undefined
     loading      : 초기 인증 확인 중 여부
     loginLoading : 로그인 요청 진행 중 여부
     loginError   : 로그인 실패 메시지
     loginWithGoogle : Google 로그인 실행 함수
     logout       : 로그아웃 함수
   ────────────────────────────────────────── */
export const useAuth = () => {
  /* user 초기값을 undefined로 설정 — Firebase 상태 확인 전임을 명시적으로 표현
     null이면 "비로그인 확인됨"이 되어 화면이 순간 로그인 페이지로 튀는 현상(flash) 발생 가능 */
  const [user, setUser]             = useState(undefined);

  /* loading(로딩): true = Firebase에서 인증 상태를 아직 받지 못한 중간 상태
     이 값이 true인 동안 로딩 스피너를 보여주어 미인증 화면이 깜빡이지 않도록 함 */
  const [loading, setLoading]       = useState(true);

  /* loginLoading(로그인로딩): 로그인 버튼 클릭 후 팝업이 떠있는 동안 버튼 비활성화에 사용 */
  const [loginLoading, setLoginLoading] = useState(false);

  /* loginError(로그인에러): 로그인 실패 시 사용자에게 보여줄 메시지 */
  const [loginError, setLoginError] = useState(null);

  /* ── LINE OAuth2 로그인 ──
     LINE 인증 페이지로 리디렉션. 인증 완료 후 /auth/line/callback으로 돌아온다.
     state 파라미터: sessionStorage에 저장해 CSRF 공격 방지용으로 사용 */
  const loginWithLine = () => {
    /* crypto.randomUUID(): 랜덤 UUID 생성 — state 파라미터로 사용 */
    const state = crypto.randomUUID();
    sessionStorage.setItem('lineOAuthState', state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     '2009682092',
      redirect_uri:  'https://caredoc-navy.vercel.app/auth/line/callback',
      state,
      scope:         'profile',
    });

    /* LINE 인증 페이지로 이동 */
    window.location.href = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
  };

  /* ── Firebase 표준 팝업 로그인 ──
     【의도】 Firebase에서 권장하는 signInWithPopup 방식 사용.
             팝업이 완료되면 onAuthStateChanged가 자동으로 user 상태를 업데이트하므로
             여기서는 에러 처리만 담당함. */
  const loginWithGoogle = async () => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      /* GoogleAuthProvider(구글어스프로바이더): Google OAuth를 위한 공급자 인스턴스 생성 */
      const provider = new GoogleAuthProvider();
      /* setCustomParameters(셋커스텀파라미터스): OAuth 요청 시 추가 파라미터 설정
         prompt: 'select_account' — 이미 로그인되어 있어도 계정 선택 창을 강제로 표시 */
      provider.setCustomParameters({ prompt: 'select_account' }); // 기본적으로 계정 선택창 띄움
      await signInWithPopup(auth, provider);
      /* 로그인 성공 후 setLoginLoading(false)는 onAuthStateChanged 콜백에서 처리됨 */
    } catch (e) {
      console.error('[useAuth] signInWithPopup 에러:', e.code);
      /* e.code(이코드): Firebase Auth 에러 코드 — 에러 종류를 문자열로 식별
         사용자가 팝업을 닫으면 'auth/popup-closed-by-user' 에러 발생 → 에러 메시지 분기 처리 */
      if (e.code === 'auth/popup-closed-by-user') {
        setLoginError('ログインがキャンセルされました。');
      } else {
        setLoginError('ログインに失敗しました。もう一度お試しください。');
      }
      setLoginLoading(false);
    }
  };

  /* ── Firebase 인증 상태 구독 ──
     【의도】 useEffect 안에서 onAuthStateChanged를 구독하면:
     1. 앱 첫 로드 시 Firebase가 저장된 토큰으로 자동 로그인 여부 확인
     2. 로그인/로그아웃 시마다 콜백이 자동 실행되어 user 상태 갱신
     3. 클린업 함수(unsub())로 컴포넌트 언마운트 시 구독 해제 → 메모리 누수 방지

     의존성 배열([]) — 빈 배열이므로 마운트 시 한 번만 실행됨 */
  /* 브라우저 탭/창 닫으면 자동 로그아웃 */
  useEffect(() => { setPersistence(auth, browserSessionPersistence); }, []);

  useEffect(() => {
    /* onAuthStateChanged(온어스스테이트체인지드): Firebase 인증 상태 변화를 실시간 감지하는 구독자
       반환값 unsub(언섭): 구독 해제 함수 — useEffect 클린업에서 호출 */
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        /* 로그인 성공: UID를 localStorage에 저장 → 다른 유틸 함수에서 UID를 참조할 수 있게 함 */
        localStorage.setItem(PREFIX + 'firebaseUid', JSON.stringify(firebaseUser.uid));
        try {
          /* Promise.race(프로미스레이스): 여러 Promise 중 가장 먼저 완료/실패하는 것을 따름
             【의도】 Firestore 로드가 5초 이상 걸리면 timeout Promise가 먼저 reject되어
                     앱이 무한 로딩에 빠지지 않도록 타임아웃(timeout) 안전장치 구현 */
          await Promise.race([
            loadFromFirestore(firebaseUser.uid),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000)),
          ]);
        } catch (e) { console.warn('Firestore 로드 실패:', e.message); }
      } else {
        /* 로그아웃 상태: UID를 localStorage에서 제거 */
        localStorage.removeItem(PREFIX + 'firebaseUid');
      }
      /* Firebase로부터 인증 상태 확인이 완료된 시점에 user와 loading 상태 갱신 */
      setUser(firebaseUser);
      setLoading(false);
      setLoginLoading(false);
    });

    /* 클린업(cleanup) 함수: 컴포넌트 언마운트 시 onAuthStateChanged 구독 해제
       구독을 해제하지 않으면 컴포넌트가 사라진 후에도 콜백이 실행되어 메모리 누수 발생 */
    return () => unsub();
  }, []);

  /* signOut(사인아웃): Firebase 로그아웃 — auth 인스턴스와 연결된 세션을 종료
     보안: 로그아웃 시 localStorage의 모든 앱 데이터를 즉시 삭제
     → 같은 브라우저에서 다른 사람이 로그인해도 이전 사용자 데이터가 노출되지 않음 */
  const logout = () => {
    ['users', 'documents', 'customPhrases', 'hiddenPhrases', 'currentUserId', 'firebaseUid'].forEach(
      (key) => localStorage.removeItem('caredoc-' + key)
    );
    return signOut(auth);
  };

  /* 훅 사용자가 필요한 값/함수만 선택적으로 꺼내 쓸 수 있도록 객체로 반환 */
  return { user, loading, loginLoading, loginError, loginWithGoogle, loginWithLine, logout };
};
