import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, TrendingUp, User, Users, Award, Building2 } from 'lucide-react';

export const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  const studentNav = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Home' },
    { to: '/progress',  icon: <TrendingUp size={20} />,     label: 'Progress' },
    { to: '/mistakes',  icon: <FileText size={20} />,       label: 'Errors' },
    { to: '/profile',   icon: <User size={20} />,           label: 'Profile' },
  ];

  const adminNav = [
    { to: '/admin',         end: true, icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/admin/tests',              icon: <FileText size={20} />,        label: 'Tests' },
    { to: '/admin/students',           icon: <Users size={20} />,           label: 'Students' },
    { to: '/admin/results',            icon: <Award size={20} />,           label: 'Results' },
  ];

  const superAdminNav = [
    { to: '/superadmin', end: true, icon: <Building2 size={20} />, label: 'Institutes' },
  ];

  const mobileNav = user?.role === 'student' ? studentNav
    : user?.role === 'admin' ? adminNav
    : superAdminNav;

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="main-content">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="page fade-in">
          <Outlet />
        </main>

        {/* Mobile bottom navigation bar */}
        <nav className="mobile-bottom-nav">
          {mobileNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};
