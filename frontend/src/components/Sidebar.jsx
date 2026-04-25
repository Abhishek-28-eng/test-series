import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, FileText, Users, Award, User, 
  TrendingUp, GraduationCap, LogOut, Settings, Building2 
} from 'lucide-react';

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/login');
  };

  if (!user) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-inner">
            <div className="sidebar-logo-icon">
              <GraduationCap size={22} color="#fff" />
            </div>
            <div>
              <h2>TestSeries<span style={{ marginLeft: 4 }}>Pro</span></h2>
              <span className="sidebar-role-badge">
                {user.role === 'superadmin' ? '⚡ Super Admin' : user.role === 'admin' ? '⚡ Admin Panel' : '📚 Student Portal'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>

          {user.role === 'superadmin' ? (
            <>
              <NavLink
                to="/superadmin"
                end
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Building2 size={17} />
                Institute Onboarding
              </NavLink>
            </>
          ) : user.role === 'admin' ? (
            <>
              <NavLink
                to="/admin"
                end
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <LayoutDashboard size={17} />
                Dashboard
              </NavLink>

              <NavLink
                to="/admin/tests"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <FileText size={17} />
                Manage Tests
              </NavLink>

              <NavLink
                to="/admin/students"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Users size={17} />
                Students
              </NavLink>

              <NavLink
                to="/admin/results"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Award size={17} />
                All Results
              </NavLink>

              <NavLink
                to="/admin/staff"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Settings size={17} />
                Staff Management
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/dashboard"
                end
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <LayoutDashboard size={17} />
                Dashboard
              </NavLink>

              <NavLink
                to="/profile"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <User size={17} />
                My Profile
              </NavLink>

              <NavLink
                to="/progress"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <TrendingUp size={17} />
                My Progress
              </NavLink>

              <NavLink
                to="/mistakes"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <FileText size={17} />
                Exceptions & Errors
              </NavLink>
            </>
          )}
        </nav>

        {/* Footer / User */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card" onClick={handleLogout} title="Logout">
            <div className="navbar-avatar" style={{ width: 34, height: 34, fontSize: 13 }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
                {user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Administrator' : 'Student'}
              </div>
            </div>
            <LogOut size={15} color="rgba(255,255,255,0.45)" />
          </div>
        </div>
      </aside>
    </>
  );
};
