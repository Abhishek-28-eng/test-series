import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';

export const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="flex items-center gap-3">
        <button className="mobile-menu-btn" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <div className="navbar-brand">
          <span className="hidden sm:inline">Latur</span> <span>Pattern</span>
        </div>
      </div>

      <div className="navbar-actions">
        {user && (
          <div className="navbar-user">
            <div className="navbar-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <span>{user.name}</span>
            <button onClick={handleLogout} className="btn btn-sm btn-ghost ml-2">
              <LogOut size={14} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
