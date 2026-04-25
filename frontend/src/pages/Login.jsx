import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Eye, EyeOff, GraduationCap, Phone, LockKeyhole } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export const Login = () => {
  const [formData, setFormData] = useState({ instituteCode: '', mobile: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/login', formData);
      if (res.data.success) {
        login(res.data.user, res.data.token);
        toast.success(`Welcome back, ${res.data.user.name?.split(' ')[0]}!`);
        navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <section className="login-panel login-panel-brand">
        <div className="login-brand-wrap">
          <div className="login-brand-header">
            <span className="login-brand-mark">
              <span className="login-brand-icon">
                <GraduationCap size={18} />
              </span>
              <span className="login-brand-name">
                TestSeries <em>Pro</em>
              </span>
            </span>
            <span className="login-brand-tag">Assessment Platform</span>
          </div>

          <div className="login-brand-copy">
            <h1>TestSeries Pro</h1>
            <p>
              A clean, reliable platform for online tests, student performance tracking,
              and institute-level exam management.
            </p>
          </div>

          <div className="login-brand-meta">
            <div className="login-brand-meta-item">
              <strong>For Students</strong>
              <span>Take scheduled tests and review results.</span>
            </div>
            <div className="login-brand-meta-item">
              <strong>For Institutes</strong>
              <span>Manage tests, questions, and performance in one place.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="login-panel login-panel-form">
        <div className="login-card-standard">
          <div className="login-card-header">
            <span className="login-card-kicker">Welcome Back</span>
            <h2>Sign in to your account</h2>
            <p>Enter your registered mobile number and password to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form-standard">
            <div className="form-group">
              <label className="form-label" htmlFor="instituteCode">
                Institute Code (Optional)
              </label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <GraduationCap size={16} />
                </span>
                <input
                  id="instituteCode"
                  type="text"
                  className="form-input login-input"
                  placeholder="Leave blank for Default Institute"
                  value={formData.instituteCode}
                  onChange={(e) => handleChange('instituteCode', e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="mobile">
                Mobile Number
              </label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <Phone size={16} />
                </span>
                <input
                  id="mobile"
                  type="tel"
                  className="form-input login-input"
                  placeholder="Enter mobile number"
                  value={formData.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <LockKeyhole size={16} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input login-input login-input-password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full login-submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="login-help-text">
            Need access? Contact your institute administrator or coordinator.
          </div>
        </div>
      </section>
    </div>
  );
};
