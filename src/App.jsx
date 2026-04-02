/* App — 라우팅 + 인증 가드
   - 로그인 전: Landing 페이지 (단, /privacy는 누구나 접근 가능)
   - 로그인 후: 앱 전체 접근 */

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './hooks/useAuth';
import Landing from './pages/Landing/Landing';
import Header from './components/layout/Header';
import Home from './pages/Home/Home';
import Select from './pages/Select/Select';
import Edit from './pages/Edit/Edit';
import Preview from './pages/Preview/Preview';
import PrintAll from './pages/Preview/PrintAll';
import Admin from './pages/Admin/Admin';
import UserForm from './pages/UserForm/UserForm';
import Privacy from './pages/Privacy/Privacy';
import LineCallback from './pages/LineCallback/LineCallback';
import ShibaWag from './components/common/ShibaWag';

/* 인증 가드 내부 — /privacy, /auth/line/callback은 로그인 없이 접근 가능 */
const AuthGate = ({ loginLoading, loginError, loginWithGoogle, loginWithLine }) => {
  const location = useLocation();
  const { user } = useAuth();

  /* /privacy는 누구나 접근 */
  if (location.pathname === '/privacy') return <Privacy />;

  /* LINE 로그인 콜백 — 로그인 처리 중이므로 인증 불필요 */
  if (location.pathname === '/auth/line/callback') return <LineCallback />;

  /* 미로그인 → 랜딩 */
  if (!user) return <Landing loginLoading={loginLoading} loginError={loginError} loginWithGoogle={loginWithGoogle} loginWithLine={loginWithLine} />;

  /* 로그인 → 앱 */
  return (
    <>
      <Header />
      <ShibaWag />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/user/new" element={<UserForm />} />
        <Route path="/select" element={<Select />} />
        <Route path="/edit/:type" element={<Edit />} />
        <Route path="/preview/all" element={<PrintAll />} />
        <Route path="/preview/:type" element={<Preview />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  const { t } = useTranslation();
  const { loading, loginLoading, loginError, loginWithGoogle, loginWithLine } = useAuth();

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100svh', color: '#aaa', fontSize: 14 }}>
      {t('ui.loading')}
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={
          <AuthGate
            loginLoading={loginLoading}
            loginError={loginError}
            loginWithGoogle={loginWithGoogle}
            loginWithLine={loginWithLine}
          />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
