import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="app-shell">
      <Header />
      <Sidebar />
      <main className="app-content" id="main-content">
        <Outlet />
      </main>
    </div>
  );
}
