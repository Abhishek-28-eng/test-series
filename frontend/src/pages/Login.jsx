import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { BookOpen, Target, CheckCircle2, GraduationCap, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [formData, setFormData] = useState({ mobile: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', formData);
      if (res.data.success) {
        login(res.data.user, res.data.token);
        toast.success(res.data.message);
        navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f6f8', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── Top Navbar ── */}
      <header style={{ 
        backgroundColor: '#ffffff', 
        borderBottom: '1px solid #e2e8f0', 
        padding: '0 5%', 
        height: '70px',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
          <div style={{ backgroundColor: 'var(--primary)', padding: '6px', borderRadius: '8px' }}>
            <GraduationCap size={22} color="#ffffff" />
          </div>
          Latur Pattern
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, display: window.innerWidth > 600 ? 'block' : 'none' }}>
            Need help logging in?
          </span>
          <a href="#" style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Contact Support
          </a>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        
        {/* Large Layout Card */}
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth > 860 ? 'row' : 'column',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          width: '100%',
          maxWidth: '1000px',
          overflow: 'hidden'
        }}>
          
          {/* Left panel - Platform Value Info */}
          <div style={{
            flex: 1,
            backgroundColor: '#0f172a', // Deep slate/blue
            padding: '48px',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}>
            {/* Soft background pattern overlay */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: 'radial-gradient(#1e293b 2px, transparent 2px)',
              backgroundSize: '24px 24px', opacity: 0.4, zIndex: 1
            }}></div>

            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '24px', height: '3px', backgroundColor: 'var(--primary)', borderRadius: '2px' }}></div>
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8' }}>
                  Student Portal
                </span>
              </div>
              <h2 style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1.2, marginBottom: '24px', color: '#f8fafc' }}>
                Your dedicated environment for exam excellence.
              </h2>
              <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '40px', maxWidth: '340px' }}>
                Access standardized mock tests, review detailed performance analytics, and track your syllabus growth step-by-step.
              </p>
            </div>

            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: '#1e293b', padding: '10px', borderRadius: '10px' }}>
                  <Target size={20} color="#38bdf8" />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9', margin: '0 0 4px 0' }}>Realistic Mock Exams</h4>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Practice in an interface identical to the actual CBT environments.</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: '#1e293b', padding: '10px', borderRadius: '10px' }}>
                  <BookOpen size={20} color="#34d399" />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9', margin: '0 0 4px 0' }}>Instant Analytics</h4>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Pinpoint weak subjects immediately after submission.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel - Form */}
          <div style={{
            flex: 1,
            padding: '56px 48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: '#ffffff'
          }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
              Sign in
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 32px 0' }}>
              Enter your registered mobile number and password to continue.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Registered Mobile Number
                </label>
                <input 
                  type="tel" 
                  required 
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    fontSize: '15px', 
                    borderRadius: '8px', 
                    border: '1px solid #cbd5e1', 
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    backgroundColor: '#f8fafc',
                    color: '#0f172a'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.backgroundColor = '#ffffff'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                  value={formData.mobile} 
                  onChange={e => setFormData({ ...formData, mobile: e.target.value })} 
                  placeholder="e.g. 9876543210" 
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                    Password
                  </label>
                  <a href="#" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                    Forgot password?
                  </a>
                </div>
                <input 
                  type="password" 
                  required 
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    fontSize: '15px', 
                    borderRadius: '8px', 
                    border: '1px solid #cbd5e1', 
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    backgroundColor: '#f8fafc',
                    color: '#0f172a'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.backgroundColor = '#ffffff'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                  value={formData.password} 
                  onChange={e => setFormData({ ...formData, password: e.target.value })} 
                  placeholder="Enter your password" 
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px' }}>
                <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.5 }}>
                  This connection is securely encrypted. By signing in, you agree to our platform guidelines.
                </span>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  backgroundColor: loading ? '#93c5fd' : 'var(--primary)', 
                  color: '#ffffff', 
                  fontSize: '15px', 
                  fontWeight: 600, 
                  borderRadius: '8px', 
                  border: 'none', 
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '8px'
                }}
                onMouseOver={(e) => { if(!loading) e.target.style.backgroundColor = 'var(--primary-dark)'; }}
                onMouseOut={(e) => { if(!loading) e.target.style.backgroundColor = 'var(--primary)'; }}
              >
                {loading ? 'Authenticating...' : (
                  <>Sign In to Dashboard <ArrowRight size={18} /></>
                )}
              </button>
            </form>

          </div>
        </div>
      </main>

      {/* ── Bottom Footer ── */}
      <footer style={{
        padding: '24px 5%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        fontSize: '13px',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <strong>Latur Pattern Test Series</strong> &copy; {new Date().getFullYear()}
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <a href="#" style={{ color: '#64748b', textDecoration: 'none' }} onMouseOver={(e) => e.target.style.color = '#0f172a'} onMouseOut={(e) => e.target.style.color = '#64748b'}>Privacy Policy</a>
          <a href="#" style={{ color: '#64748b', textDecoration: 'none' }} onMouseOver={(e) => e.target.style.color = '#0f172a'} onMouseOut={(e) => e.target.style.color = '#64748b'}>Terms of Use</a>
          <a href="#" style={{ color: '#64748b', textDecoration: 'none' }} onMouseOver={(e) => e.target.style.color = '#0f172a'} onMouseOut={(e) => e.target.style.color = '#64748b'}>System Requirements</a>
        </div>
      </footer>

    </div>
  );
};
