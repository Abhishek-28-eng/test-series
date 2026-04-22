import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, Bell, GraduationCap } from 'lucide-react';

export const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      {/* Left: hamburger + brand */}
      <div className="flex items-center gap-3">
        <button className="mobile-menu-btn" onClick={onMenuClick} aria-label="Open navigation">
          <Menu size={22} />
        </button>
        <div className="navbar-brand">
          <GraduationCap size={20} color="var(--orange)" />
          <span>TestSeries</span><span style={{ color: 'var(--orange)', marginLeft: 4 }}>Pro</span>
        </div>
      </div>

      {/* Right: user pill */}
      <div className="navbar-actions">
        {user && (
          <div className="navbar-user">
            <div className="navbar-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline" style={{ fontWeight: 600, fontSize: 13.5 }}>
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-sm hidden sm:inline"
              style={{ padding: '5px 10px', gap: 5, marginLeft: 2, borderRadius: 8, border: 'none', fontSize: 12.5 }}
              title="Logout"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
