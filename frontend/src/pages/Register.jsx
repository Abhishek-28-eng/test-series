import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', mobile: '', password: '', 
    examType: 'MHT-CET_PCM', classYear: '12', parentMobile: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (key) => (e) => setFormData({ ...formData, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.success) {
        login(res.data.user, res.data.token);
        toast.success(res.data.message);
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow auth-glow-1"></div>
      <div className="auth-glow auth-glow-2"></div>
      <div className="auth-card" style={{ maxWidth: '600px' }}>
        <div className="auth-header">
          <h1 className="auth-logo">TestSeries <span>Pro</span></h1>
          <p className="auth-subtitle">Create your student account</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" required className="form-input" value={formData.name} onChange={set('name')} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" required className="form-input" value={formData.email} onChange={set('email')} />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input type="tel" required className="form-input" value={formData.mobile} onChange={set('mobile')} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" required className="form-input" minLength={6} value={formData.password} onChange={set('password')} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Target Exam</label>
              <select className="form-select" value={formData.examType} onChange={set('examType')}>
                <option value="MHT-CET_PCM">MHT-CET (PCM)</option>
                <option value="MHT-CET_PCB">MHT-CET (PCB)</option>
                <option value="JEE">JEE Main</option>
                <option value="NEET">NEET UG</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Class / Year</label>
              <select className="form-select" value={formData.classYear} onChange={set('classYear')}>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
                <option value="dropper">Dropper</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg mt-4">
            {loading ? <span className="spinner"></span> : 'Create Account'}
          </button>
        </form>
        <div className="auth-divider">or</div>
        <p className="text-center text-sm text-muted">
          Already have an account? <Link to="/login" className="text-primary font-bold">Sign in here</Link>
        </p>
      </div>
    </div>
  );
};
