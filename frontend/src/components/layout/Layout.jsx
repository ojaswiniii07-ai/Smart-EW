import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="app-shell">
      {/* Sidebar first: it owns the brand and spans both grid rows,
          which also puts navigation ahead of the header in tab order. */}
      <Sidebar />
      <Header />
      <main className="app-content" id="main-content">
        <Outlet />
      </main>
    </div>
  );
}
