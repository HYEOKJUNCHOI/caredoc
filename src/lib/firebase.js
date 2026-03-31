/* Firebase 초기화 — Auth + Firestore */

/* ============================================================
   [면접 설명 포인트] firebase.js 역할
   - Firebase SDK를 초기화하고 앱 전체에서 사용할 서비스 인스턴스를 내보낸다.
   - 인증(Auth)과 데이터베이스(Firestore) 두 가지 서비스를 사용.

   [보안 포인트]
   - API 키 등 민감한 값은 .env 파일에 보관하고, import.meta.env로 접근.
   - Vite(바이트)의 환경변수는 반드시 VITE_ 접두사를 붙여야 클라이언트에서 읽힘.
   - .env 파일은 .gitignore에 등록하여 GitHub에 올라가지 않도록 해야 함.

   [서비스 설명]
   - Firebase Auth(파이어베이스 어스): Google, 이메일 등 다양한 방식의 로그인 처리
   - Firestore(파이어스토어): NoSQL 클라우드 데이터베이스 — 실시간 동기화 지원
   ============================================================ */

/* initializeApp(이니셜라이즈앱): Firebase 프로젝트를 초기화하는 함수
   반환된 app 객체로 Auth, Firestore 등 각 서비스를 꺼낸다 */
import { initializeApp } from 'firebase/app';

/* getAuth(겟어스): Firebase Authentication 인스턴스 반환
   GoogleAuthProvider(구글어스프로바이더): Google OAuth 로그인 제공자 */
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

/* getFirestore(겟파이어스토어): Firestore 데이터베이스 인스턴스 반환 */
import { getFirestore } from 'firebase/firestore';

/* firebaseConfig(파이어베이스컨피그): Firebase 프로젝트 식별 설정
   import.meta.env(임포트메타엔브): Vite 환경변수에서 값을 읽는 방법
   모든 VITE_ 접두사 변수는 빌드 시 번들에 포함됨 */
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

/* Firebase 앱 초기화 — 이 객체를 기반으로 각 서비스 인스턴스를 생성 */
const app = initializeApp(firebaseConfig);

/* export(익스포트): 다른 파일에서 import해서 사용할 수 있도록 내보냄
   auth    : 로그인/로그아웃 처리에 사용 (useAuth.js에서 import)
   db      : Firestore 읽기/쓰기에 사용 (firestoreSync.js에서 import)
   googleProvider: Google 로그인 버튼에 사용 (useAuth.js에서 직접 생성하므로 현재 미사용) */
export const auth           = getAuth(app);
export const db             = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
