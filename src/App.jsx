/* App — 라우팅 + 인증 가드
   - 로그인 전: Landing 페이지
   - 로그인 후: 앱 전체 접근 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  const { t } = useTranslation();
  const { user, loading, loginLoading, loginError, loginWithGoogle } = useAuth();

  /* 인증 상태 로딩 중 */
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100svh', color: '#aaa', fontSize: 14 }}>
      {t('ui.loading')}
    </div>
  );

  /* 미로그인 → 랜딩 페이지 */
  if (!user) return <Landing loginLoading={loginLoading} loginError={loginError} loginWithGoogle={loginWithGoogle} />;

  /* 로그인 → 앱 */
  return (
    <BrowserRouter>
      <Header />
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
    </BrowserRouter>
  );
}

export default App;
