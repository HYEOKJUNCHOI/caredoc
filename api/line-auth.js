/* LINE Login 서버리스 함수 — Vercel API Route
   흐름:
   1. 프론트에서 LINE 인증 코드(code) 전달
   2. LINE 서버에 code → access_token 교환 요청
   3. access_token으로 LINE 프로필(userId, displayName) 취득
   4. Firebase Admin SDK로 커스텀 토큰 생성
   5. 커스텀 토큰을 프론트에 반환 → signInWithCustomToken으로 Firebase 로그인 */

import admin from 'firebase-admin';

/* Firebase Admin 초기화 — 서버리스 함수는 재사용될 수 있으므로
   이미 초기화된 경우 건너뜀 */
function initAdmin() {
  if (admin.apps.length) return;
  admin.initializeApp({
    /* FIREBASE_SERVICE_ACCOUNT: Firebase Console에서 발급한 서비스 계정 JSON 문자열
       Vercel 환경변수에 등록 필요 */
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

export default async function handler(req, res) {
  /* CORS 헤더 — 동일 도메인 요청이지만 명시적으로 허용 */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'authorization code가 없습니다.' });
  }

  try {
    /* ── STEP 1: LINE code → access_token 교환 ──
       LINE OAuth 2.0 토큰 엔드포인트에 POST 요청 */
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  'https://caredoc-navy.vercel.app/auth/line/callback',
        client_id:     '2009682092',
        client_secret: process.env.LINE_CHANNEL_SECRET,
      }).toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('[line-auth] 토큰 교환 실패:', tokenData);
      return res.status(400).json({ error: 'LINE 토큰 교환 실패', detail: tokenData });
    }

    /* ── STEP 2: access_token → LINE 프로필 취득 ── */
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileRes.json();

    if (!profile.userId) {
      console.error('[line-auth] 프로필 취득 실패:', profile);
      return res.status(400).json({ error: 'LINE 프로필 취득 실패' });
    }

    /* ── STEP 3: Firebase Custom Token 생성 ──
       uid 형식: 'line:U1234567890abcdef...'
       Google 로그인 uid와 구분하기 위해 'line:' 접두사 사용 */
    initAdmin();
    const uid = `line:${profile.userId}`;
    const customToken = await admin.auth().createCustomToken(uid);

    /* 커스텀 토큰 + 프로필 정보 반환 */
    return res.status(200).json({
      customToken,
      displayName: profile.displayName,
      pictureUrl:  profile.pictureUrl || null,
    });

  } catch (err) {
    console.error('[line-auth] 오류:', err);
    return res.status(500).json({ error: '서버 오류', detail: err.message });
  }
}
