import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { User, Mail, Phone, BookOpen, GraduationCap, Save, Shield } from 'lucide-react';

export const StudentProfile = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    examType: user?.examType || '',
    classYear: user?.classYear || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/profile', formData);
      toast.success('Profile updated! Please log out and back in to see all changes.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const examLabel = {
    'MHT-CET_PCM': 'MHT-CET (PCM)',
    'MHT-CET_PCB': 'MHT-CET (PCB)',
    'JEE': 'JEE Main & Advanced',
    'NEET': 'NEET-UG',
  };

  const examColors = {
    'MHT-CET_PCM': 'var(--primary)',
    'MHT-CET_PCB': 'var(--secondary)',
    'JEE': 'var(--warning)',
    'NEET': 'var(--success)',
  };

  const initial = (formData.name || 'S').charAt(0).toUpperCase();

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="text-muted text-sm mt-2">Manage your personal information and exam preferences</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* ── Left: Identity Card ──────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Avatar + Name card */}
          <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{
              width: '88px', height: '88px', borderRadius: '50%',
              background: `linear-gradient(135deg, var(--primary), var(--secondary))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', fontWeight: '800', color: '#fff',
              margin: '0 auto 16px', fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: '0 8px 24px rgba(37,99,235,0.25)'
            }}>
              {initial}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{formData.name || 'Student'}</h3>
            <p className="text-muted text-sm">{user?.email || user?.mobile}</p>

            {user?.examType && (
              <div style={{ marginTop: '16px' }}>
                <span className="badge badge-primary" style={{
                  background: `${examColors[user.examType]}18`,
                  color: examColors[user.examType],
                  fontSize: '12px', padding: '5px 14px'
                }}>
                  <GraduationCap size={12} style={{ display: 'inline', marginRight: '5px' }} />
                  {examLabel[user.examType] || user.examType}
                </span>
              </div>
            )}
          </div>

          {/* Read-only info */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <p className="section-heading" style={{ fontSize: '12px', marginBottom: '16px' }}>Account Info</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={15} color="var(--primary)" />
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</p>
                  <p style={{ fontSize: '13px', fontWeight: '600' }}>{user?.email || '—'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(8,145,178,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={15} color="var(--secondary)" />
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile</p>
                  <p style={{ fontSize: '13px', fontWeight: '600' }}>{user?.mobile || '—'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={15} color="var(--success)" />
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</p>
                  <p style={{ fontSize: '13px', fontWeight: '600', textTransform: 'capitalize' }}>{user?.role || 'Student'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Edit Form ──────────────────────── */}
        <div className="card" style={{ padding: '32px' }}>
          <p className="section-heading" style={{ marginBottom: '28px' }}>Edit Details</p>

          <form onSubmit={handleSave}>
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>

            {/* Exam Type */}
            <div className="form-group">
              <label className="form-label">Target Exam</label>
              <div style={{ position: 'relative' }}>
                <GraduationCap size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', zIndex: 1 }} />
                <select
                  className="form-select"
                  value={formData.examType}
                  onChange={e => setFormData({ ...formData, examType: e.target.value })}
                  style={{ paddingLeft: '40px' }}
                >
                  <option value="">Select your target exam...</option>
                  <option value="MHT-CET_PCM">MHT-CET (PCM)</option>
                  <option value="MHT-CET_PCB">MHT-CET (PCB)</option>
                  <option value="JEE">JEE Main & Advanced</option>
                  <option value="NEET">NEET-UG</option>
                </select>
              </div>
            </div>

            {/* Class Year */}
            <div className="form-group">
              <label className="form-label">Class / Year</label>
              <div style={{ position: 'relative' }}>
                <BookOpen size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input
                  type="text"
                  className="form-input"
                  value={formData.classYear}
                  onChange={e => setFormData({ ...formData, classYear: e.target.value })}
                  placeholder="e.g. 12th Regular, Dropperr, XI"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--card-border)', margin: '24px 0' }}></div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '11px 28px' }}>
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
