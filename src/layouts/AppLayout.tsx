import { NavLink, Outlet } from 'react-router-dom';
import { FileText, Users } from 'lucide-react';

export function AppLayout() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink className="brand" to="/invoices">
            <span className="brand-mark"><FileText size={19} /></span>
            <span>Melden<span className="brand-light">.billing</span></span>
          </NavLink>
          <nav className="main-nav" aria-label="Main navigation">
            <NavLink to="/invoices" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <FileText size={17} /> Invoices
            </NavLink>
            <NavLink to="/customers" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Users size={17} /> Customers
            </NavLink>
          </nav>
          <div className="topbar-meta"><span className="online-dot" /> Workspace</div>
        </div>
      </header>
      <main className="main-content"><Outlet /></main>
      <footer className="app-footer">Melden Billing <span>Simple invoicing for your business</span></footer>
    </div>
  );
}
