import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, Users, Award, User, TrendingUp } from 'lucide-react';

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <>
      <div className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)}></div>
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
        <h2>Latur <span>Pattern</span></h2>
        <p>{user.role === 'admin' ? 'Admin Panel' : 'Student Portal'}</p>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Menu</div>
        
        {user.role === 'admin' ? (
          <>
            <NavLink to="/admin" end className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
            <NavLink to="/admin/tests" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
              <FileText size={18} /> Manage Tests
            </NavLink>
            <NavLink to="/admin/students" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
              <Users size={18} /> Students
            </NavLink>
            <NavLink to="/admin/results" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
              <Award size={18} /> All Results
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/dashboard" end className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
              <User size={18} /> My Profile
            </NavLink>
            <NavLink to="/progress" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
              <TrendingUp size={18} /> My Progress
            </NavLink>
          </>
        )}
      </nav>
    </aside>
    </>
  );
};
