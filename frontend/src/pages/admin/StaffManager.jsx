import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Settings, Plus, Mail, Phone, Trash2, KeyRound, UserCog } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const StaffManager = () => {
  const { user: currentUser } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', mobile: '', password: '' });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data } = await api.get('/admin/staff');
      if (data.success) {
        setStaff(data.data);
      }
    } catch (err) {
      toast.error('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/staff', formData);
      if (data.success) {
        toast.success('Admin created successfully!');
        setFormData({ name: '', email: '', mobile: '', password: '' });
        setShowAddModal(false);
        fetchStaff();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    }
  };

  const handleDelete = async (adminId) => {
    if (adminId === currentUser.id) {
      toast.error('You cannot delete your own account.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this admin account?')) return;
    try {
      const { data } = await api.delete(`/admin/staff/${adminId}`);
      if (data.success) {
        toast.success('Admin deleted successfully');
        fetchStaff();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete admin');
    }
  };

  const handleChangeRoleToStudent = async (adminId) => {
    if (adminId === currentUser.id) {
      toast.error('You cannot demote yourself.');
      return;
    }
    if (!window.confirm('Demote this admin to a student role?')) return;
    try {
      const { data } = await api.put(`/admin/users/${adminId}/role`, { role: 'student' });
      if (data.success) {
        toast.success('Role updated successfully');
        fetchStaff();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  return (
    <div className="fade-in admin-manager-container">
      <div className="manager-header-block">
        <div className="manager-header-content">
          <h1 className="manager-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings size={22} style={{ color: 'var(--primary)' }} />
            Staff Management
          </h1>
          <p className="manager-subtitle">Manage administrators and user roles.</p>
        </div>
        <div className="manager-header-actions">
          <button className="btn btn-primary premium-btn" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> <span>Create Admin</span>
          </button>
        </div>
      </div>

      <div className="manager-content">
        <div className="premium-table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Administrator</th>
                  <th>Created On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(admin => (
                  <tr key={admin.id} className="premium-row">
                    <td>
                      <div className="user-profile-cell">
                        <div className="user-avatar" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                          {admin.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-info">
                          <h4 className="user-name">{admin.name} {admin.id === currentUser.id && <span className="badge badge-primary ml-2">You</span>}</h4>
                          <div className="user-contact">
                            {admin.email && <span className="contact-item"><Mail size={12}/> {admin.email}</span>}
                            <span className="contact-item"><Phone size={12}/> {admin.mobile}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-muted text-sm">{new Date(admin.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td>
                      <div className="flex gap-2 flex-wrap">
                        {admin.id !== currentUser.id && (
                          <>
                            <button title="Demote to Student" className="btn btn-sm btn-ghost text-warning" onClick={() => handleChangeRoleToStudent(admin.id)}>
                              <UserCog size={14}/> Demote
                            </button>
                            <button title="Delete Admin" className="btn btn-sm btn-ghost text-danger" onClick={() => handleDelete(admin.id)}>
                              <Trash2 size={14}/>
                            </button>
                          </>
                        )}
                        {admin.id === currentUser.id && (
                          <span className="text-xs text-muted">Current Session</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '30px' }} className="text-muted">
                      No administrators found.
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
          <div className="premium-modal-content" style={{ maxWidth: '540px' }}>
            <div className="premium-modal-header">
              <div><h2>Create Administrator</h2><p>Grant admin portal access</p></div>
              <button className="premium-close" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form className="premium-form" onSubmit={handleCreate}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Admin Name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="admin@email.com" />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Mobile * (used to login)</label>
                  <input type="text" className="form-input" required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="10-digit number" />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input type="text" className="form-input" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="min 6 characters" />
                </div>
              </div>
              <div className="premium-modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
