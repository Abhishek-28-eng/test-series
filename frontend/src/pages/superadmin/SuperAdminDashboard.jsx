import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Building2, Plus, Power, KeyRound, CheckCircle, XCircle } from 'lucide-react';

export const SuperAdminDashboard = () => {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', code: '', adminName: '', adminMobile: '', adminPassword: ''
  });

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const fetchInstitutes = async () => {
    try {
      const { data } = await api.get('/superadmin/institutes');
      if (data.success) {
        setInstitutes(data.data);
      }
    } catch (err) {
      toast.error('Failed to load institutes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/superadmin/institutes', formData);
      if (data.success) {
        toast.success(`Institute ${data.data.institute.name} onboarded!`);
        setFormData({ name: '', code: '', adminName: '', adminMobile: '', adminPassword: '' });
        setShowAddModal(false);
        fetchInstitutes();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create institute');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'disable' : 'enable'} this institute?`)) return;
    try {
      const { data } = await api.put(`/superadmin/institutes/${id}/toggle`);
      if (data.success) {
        toast.success(data.message);
        fetchInstitutes();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  return (
    <div className="fade-in admin-manager-container">
      <div className="manager-header-block">
        <div className="manager-header-content">
          <h1 className="manager-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={24} style={{ color: 'var(--primary)' }} />
            Super Admin: Institute Onboarding
          </h1>
          <p className="manager-subtitle">Manage multi-tenant SaaS clients and generate credentials.</p>
        </div>
        <div className="manager-header-actions">
          <button className="btn btn-primary premium-btn" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> <span>Onboard Institute</span>
          </button>
        </div>
      </div>

      <div className="manager-content">
        <div className="premium-table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Institute Name & Code</th>
                  <th>Status</th>
                  <th>Students</th>
                  <th>Staff</th>
                  <th>Registered On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {institutes.map(inst => (
                  <tr key={inst.id} className="premium-row">
                    <td>
                      <div className="user-profile-cell">
                        <div className="user-avatar" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                          {inst.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-info">
                          <h4 className="user-name">{inst.name}</h4>
                          <div className="user-contact">
                            <span className="badge badge-outline">Code: {inst.code}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {inst.isActive ? 
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><CheckCircle size={12}/> Active</span> 
                        : 
                        <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><XCircle size={12}/> Disabled</span>
                      }
                    </td>
                    <td><strong>{inst.totalStudents}</strong></td>
                    <td><strong>{inst.totalAdmins}</strong></td>
                    <td><span className="text-muted text-sm">{new Date(inst.createdAt).toLocaleDateString()}</span></td>
                    <td>
                      {inst.code !== 'DEFAULT' && (
                        <button title={inst.isActive ? "Disable Institute" : "Enable Institute"} 
                          className={`btn btn-sm btn-ghost ${inst.isActive ? 'text-danger' : 'text-success'}`} 
                          onClick={() => handleToggleStatus(inst.id, inst.isActive)}>
                          <Power size={14}/> {inst.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {institutes.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }} className="text-muted">
                      No institutes onboarded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content" style={{ maxWidth: '600px' }}>
            <div className="premium-modal-header">
              <div><h2>Onboard New Institute</h2><p>Provision isolated environment & admin credentials</p></div>
              <button className="premium-close" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form className="premium-form" onSubmit={handleCreate}>
              <h4 className="mb-4 text-primary" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10 }}>1. Institute Details</h4>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Institute Name *</label>
                  <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Apex Academy" />
                </div>
                <div className="form-group">
                  <label className="form-label">Institute Code * (Must be Unique)</label>
                  <input type="text" className="form-input" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="e.g. APEX24" />
                </div>
              </div>
              
              <h4 className="mt-4 mb-4 text-primary" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10 }}>2. Primary Admin Credentials</h4>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Admin Name *</label>
                  <input type="text" className="form-input" required value={formData.adminName} onChange={e => setFormData({...formData, adminName: e.target.value})} placeholder="Admin full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Admin Mobile * (Login ID)</label>
                  <input type="text" className="form-input" required value={formData.adminMobile} onChange={e => setFormData({...formData, adminMobile: e.target.value})} placeholder="10-digit mobile" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Admin Password *</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{ position: 'absolute', top: 10, left: 12, color: 'rgba(255,255,255,0.4)' }}/>
                  <input type="text" className="form-input" style={{ paddingLeft: 35 }} required value={formData.adminPassword} onChange={e => setFormData({...formData, adminPassword: e.target.value})} placeholder="Create a secure password" />
                </div>
              </div>

              <div className="premium-modal-footer mt-4">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate Credentials & Onboard</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
