import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Mail, Phone, BookOpen, GraduationCap, Shield } from 'lucide-react';

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

  const initial = (formData.name || 'S').charAt(0).toUpperCase();

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      
      {/* Basic Navigation / Header */}
      <div style={{ marginBottom: 32, borderBottom: '1px solid #e5e7eb', paddingBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: '#111827', margin: '0 0 4px 0' }}>Profile Settings</h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>View and manage your account details.</p>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* ── Left: Identity Card ──────────────────── */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Avatar + Name card */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', padding: '24px', textAlign: 'center' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: '#0d1e3d',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', fontWeight: '600', color: '#fff',
              margin: '0 auto 16px'
            }}>
              {initial}
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>{formData.name || 'Student'}</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{user?.mobile}</p>
          </div>

          {/* Read-only info */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', padding: '20px 24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '16px', margin: 0, paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>Account Info</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Mail size={16} color="#6b7280" style={{ marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 2px 0' }}>Registered Email</p>
                  <p style={{ fontSize: '14px', color: '#111827', margin: 0 }}>{user?.email || 'Not provided'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Phone size={16} color="#6b7280" style={{ marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 2px 0' }}>Mobile Number</p>
                  <p style={{ fontSize: '14px', color: '#111827', margin: 0 }}>{user?.mobile || 'Not provided'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Shield size={16} color="#6b7280" style={{ marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 2px 0' }}>Platform Role</p>
                  <p style={{ fontSize: '14px', color: '#111827', margin: 0, textTransform: 'capitalize' }}>{user?.role || 'Student'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Edit Form ──────────────────────── */}
        <div style={{ flex: '1 1 500px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }}>
          
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>Edit Details</h2>
          </div>

          <div style={{ padding: '24px' }}>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Target Exam</label>
                <div style={{ position: 'relative' }}>
                  <GraduationCap size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 1 }} />
                  <select
                    value={formData.examType}
                    onChange={e => setFormData({ ...formData, examType: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff', appearance: 'none' }}
                  >
                    <option value="">Select your target exam...</option>
                    <option value="MHT-CET_PCM">MHT-CET (PCM)</option>
                    <option value="MHT-CET_PCB">MHT-CET (PCB)</option>
                    <option value="JEE">JEE Main & Advanced</option>
                    <option value="NEET">NEET-UG</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Batch / Class Year</label>
                <div style={{ position: 'relative' }}>
                  <BookOpen size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="text"
                    value={formData.classYear}
                    onChange={e => setFormData({ ...formData, classYear: e.target.value })}
                    placeholder="e.g. 12th Regular, Dropper, XI"
                    style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  type="submit" 
                  disabled={saving} 
                  style={{ 
                    padding: '8px 24px', background: '#0d1e3d', color: '#fff', border: 'none', borderRadius: 4, 
                    fontSize: 14, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
