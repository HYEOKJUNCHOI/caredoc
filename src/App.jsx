/* App — 라우팅 + 글로벌 레이아웃
   - Header는 모든 페이지에 공통 표시
   - 각 페이지는 Outlet이 아닌 Routes로 직접 매핑 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Home from './pages/Home/Home';
import Select from './pages/Select/Select';
import Edit from './pages/Edit/Edit';
import Preview from './pages/Preview/Preview';
import PrintAll from './pages/Preview/PrintAll';
import Admin from './pages/Admin/Admin';
import UserForm from './pages/UserForm/UserForm';

function App() {
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
