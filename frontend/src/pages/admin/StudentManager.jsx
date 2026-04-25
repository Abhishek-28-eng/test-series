import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Users, Search, Mail, Phone, Plus, CheckCircle, MessageCircle,
  Copy, Trash2, KeyRound, TrendingUp, BarChart2, Eye
} from 'lucide-react';

export const StudentManager = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  const [filterClass, setFilterClass] = useState('');
  const [filterExam, setFilterExam] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentDetails, setNewStudentDetails] = useState(null);
  const [resetModal, setResetModal] = useState(null);
  const [growthModal, setGrowthModal] = useState(null);
  const [enrollModal, setEnrollModal] = useState(null);

  const [formData, setFormData] = useState({
    name: '', email: '', mobile: '', password: '',
    enrolledExamConfigs: [], classYear: '', parentMobile: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [growthLoading, setGrowthLoading] = useState(false);
  const [enrollSelected, setEnrollSelected] = useState([]);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/exam-configs'),
      ]);
      if (sRes.data.success) setStudents(sRes.data.data);
      if (cRes.data.success) setConfigs(cRes.data.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/students/register', formData);
      if (data.success) {
        toast.success('Registered!');
        setNewStudentDetails({ ...formData });
        setFormData({ name: '', email: '', mobile: '', password: '', enrolledExamConfigs: [], classYear: '', parentMobile: '' });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register');
    }
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Delete ${student.name}? All their attempts will be removed.`)) return;
    try {
      const { data } = await api.delete(`/admin/students/${student.id}`);
      if (data.success) {
        toast.success('Student deleted');
        fetchData();
      }
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Min 6 characters');
      return;
    }
    try {
      const { data } = await api.put(`/admin/students/${resetModal.id}/reset-password`, { newPassword });
      if (data.success) {
        toast.success(`Password reset for ${resetModal.name}`);
        setResetModal(null);
        setNewPassword('');
      }
    } catch {
      toast.error('Failed to reset password');
    }
  };

  const openGrowth = async (student) => {
    setGrowthLoading(true);
    setGrowthModal({ student, growth: null });
    try {
      const { data } = await api.get(`/admin/students/${student.id}/growth`);
      if (data.success) setGrowthModal({ student, growth: data.data.growth });
    } catch {
      toast.error('Failed to load growth');
    } finally {
      setGrowthLoading(false);
    }
  };

  const handleUpdateEnrollment = async () => {
    try {
      const { data } = await api.put(`/admin/students/${enrollModal.id}/enrollments`, { examConfigIds: enrollSelected });
      if (data.success) {
        toast.success('Enrollments updated');
        setEnrollModal(null);
        fetchData();
      }
    } catch {
      toast.error('Failed to update enrollments');
    }
  };

  const generateWhatsAppLink = () => {
    if (!newStudentDetails) return '#';
    const text = `Hello ${newStudentDetails.name},\n\nWelcome to Latur Pattern!\nYour admission is confirmed. Login details:\n\nPortal: ${window.location.origin}\nMobile (Login ID): ${newStudentDetails.mobile}\nPassword: ${newStudentDetails.password}\n\nBest of luck!`;
    return `https://wa.me/91${newStudentDetails.mobile}?text=${encodeURIComponent(text)}`;
  };

  const handleCopyText = () => {
    const text = `Login ID: ${newStudentDetails?.mobile}\nPassword: ${newStudentDetails?.password}\nPortal: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const handleExport = () => {
    const link = document.createElement('a');
    link.href = '/api/admin/results/export';
    fetch('/api/admin/results/export', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = 'results.csv';
        link.click();
        URL.revokeObjectURL(url);
      });
  };

  const toggleConfig = (id, arr, setArr) => {
    const idN = parseInt(id, 10);
    setArr(prev => prev.includes(idN) ? prev.filter(x => x !== idN) : [...prev, idN]);
  };

  const uniqueClasses = Array.from(new Set(students.map(s => s.classYear).filter(Boolean)));
  const isMobile = viewportWidth <= 768;

  const filteredStudents = students.filter(s => {
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch = !searchLower ||
      s.name.toLowerCase().includes(searchLower) ||
      (s.email && s.email.toLowerCase().includes(searchLower)) ||
      (s.mobile && s.mobile.includes(searchLower));

    const matchesClass = filterClass ? String(s.classYear || '') === String(filterClass) : true;

    const matchesExam = filterExam
      ? s.enrollments?.some(e =>
          String(e.examConfigId) === String(filterExam) ||
          String(e.examConfig?.id) === String(filterExam)
        )
      : true;

    return matchesSearch && matchesClass && matchesExam;
  });

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  return (
    <div className="fade-in admin-manager-container">
      <div className="manager-header-block">
        <div className="manager-header-content">
          <h1 className="manager-title">Registered Students</h1>
          <p className="manager-subtitle">Manage admissions, passwords, and enrollments.</p>
        </div>
        <div className="manager-header-actions" style={{ width: isMobile ? '100%' : 'auto', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            Export Results CSV
          </button>

          <div className="flex gap-2" style={{ width: isMobile ? '100%' : 'auto', flexDirection: isMobile ? 'column' : 'row' }}>
            <select
              className="form-input"
              style={{ width: isMobile ? '100%' : '140px', padding: '6px 10px', fontSize: '13px' }}
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
            >
              <option value="">All Classes</option>
              {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              className="form-input"
              style={{ width: isMobile ? '100%' : '160px', padding: '6px 10px', fontSize: '13px' }}
              value={filterExam}
              onChange={e => setFilterExam(e.target.value)}
            >
              <option value="">All Exams</option>
              {configs.map(cfg => (
                <option key={cfg.id} value={cfg.id}>{cfg.displayName || cfg.name}</option>
              ))}
            </select>
          </div>

          <div className="search-box" style={{ width: isMobile ? '100%' : undefined }}>
            <Search size={16} className="search-icon" />
            <input type="text" placeholder="Search students..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="search-input" />
          </div>

          <button className="btn btn-primary premium-btn" onClick={() => { setNewStudentDetails(null); setShowAddModal(true); }}>
            <Plus size={16} /> <span>Add Student</span>
          </button>
        </div>
      </div>

      <div className="manager-content">
        {filteredStudents.length === 0 ? (
          <div className="empty-state premium-empty">
            <div className="empty-icon"><Users size={48} /></div>
            <h3 className="empty-title">No students found</h3>
            <p className="empty-desc">Register a new student to get started.</p>
          </div>
        ) : (
          <div className="premium-table-card">
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredStudents.map(student => (
                  <div key={student.id} style={{ padding: '16px', borderBottom: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="user-profile-cell" style={{ alignItems: 'flex-start' }}>
                      <div className="user-avatar">{student.name.charAt(0).toUpperCase()}</div>
                      <div className="user-info" style={{ minWidth: 0 }}>
                        <h4 className="user-name">{student.name}</h4>
                        <div className="user-contact">
                          {student.email && <span className="contact-item"><Mail size={12}/> {student.email}</span>}
                          <span className="contact-item"><Phone size={12}/> {student.mobile}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted font-bold" style={{ marginBottom: 6 }}>Enrolled Exams</div>
                      <div className="flex flex-wrap gap-1">
                        {student.enrollments?.length > 0
                          ? student.enrollments.map(en => (
                              <span key={en.id} className="badge badge-secondary" style={{ fontSize: '11px' }}>
                                {en.examConfig?.displayName || en.examConfig?.name}
                              </span>
                            ))
                          : <span className="text-muted text-sm">None</span>
                        }
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div className="text-xs text-muted font-bold" style={{ marginBottom: 4 }}>Class</div>
                        <span className="text-sm">{student.classYear || '-'}</span>
                      </div>
                      <div>
                        <div className="text-xs text-muted font-bold" style={{ marginBottom: 4 }}>Joined</div>
                        <span className="text-muted text-sm">{new Date(student.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <div className="text-xs text-muted font-bold" style={{ marginBottom: 4 }}>Engagement</div>
                        <div className="text-muted text-xs" style={{ marginBottom: 2 }}>
                          <strong>{student.loginCount || 0}</strong> logins • <strong>{student.totalAttempts || 0}</strong> attempts
                        </div>
                        <div className="text-muted text-xs">
                          Last: {student.lastLoginAt ? new Date(student.lastLoginAt).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button title="View Detail" className="btn btn-sm btn-ghost text-primary" onClick={() => navigate(`/admin/students/${student.id}`)}><Eye size={14}/></button>
                      <button title="View Growth" className="btn btn-sm btn-ghost text-primary" onClick={() => openGrowth(student)}><TrendingUp size={14}/></button>
                      <button title="Manage Enrollments" className="btn btn-sm btn-ghost text-primary" onClick={() => { setEnrollModal(student); setEnrollSelected(student.enrollments?.map(e => e.examConfigId) || []); }}>Enroll</button>
                      <button title="Reset Password" className="btn btn-sm btn-ghost text-warning" onClick={() => { setResetModal(student); setNewPassword(''); }}><KeyRound size={14}/></button>
                      <button title="Delete Student" className="btn btn-sm btn-ghost text-danger" onClick={() => handleDelete(student)}><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Enrolled Exams</th>
                      <th>Class</th>
                      <th>Joined</th>
                      <th>Engagement</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => (
                      <tr key={student.id} className="premium-row">
                        <td>
                          <div className="user-profile-cell">
                            <div className="user-avatar">{student.name.charAt(0).toUpperCase()}</div>
                            <div className="user-info">
                              <h4 className="user-name">{student.name}</h4>
                              <div className="user-contact">
                                {student.email && <span className="contact-item"><Mail size={12}/> {student.email}</span>}
                                <span className="contact-item"><Phone size={12}/> {student.mobile}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {student.enrollments?.length > 0
                              ? student.enrollments.map(en => (
                                  <span key={en.id} className="badge badge-secondary" style={{ fontSize: '11px' }}>
                                    {en.examConfig?.displayName || en.examConfig?.name}
                                  </span>
                                ))
                              : <span className="text-muted text-sm">None</span>
                            }
                          </div>
                        </td>
                        <td><span className="text-sm">{student.classYear || '-'}</span></td>
                        <td><span className="text-muted text-sm">{new Date(student.createdAt).toLocaleDateString()}</span></td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div className="text-xs text-muted" title="Login Count">
                              <strong>{student.loginCount || 0}</strong> logins
                            </div>
                            <div className="text-xs text-muted" title="Last Login">
                              Last: {student.lastLoginAt ? new Date(student.lastLoginAt).toLocaleDateString() : 'Never'}
                            </div>
                            <div className="text-xs text-muted" title="Completed Attempts">
                              <strong>{student.totalAttempts || 0}</strong> attempts
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-2 flex-wrap">
                            <button title="View Detail" className="btn btn-sm btn-ghost text-primary" onClick={() => navigate(`/admin/students/${student.id}`)}><Eye size={14}/></button>
                            <button title="View Growth" className="btn btn-sm btn-ghost text-primary" onClick={() => openGrowth(student)}><TrendingUp size={14}/></button>
                            <button title="Manage Enrollments" className="btn btn-sm btn-ghost text-primary" onClick={() => { setEnrollModal(student); setEnrollSelected(student.enrollments?.map(e => e.examConfigId) || []); }}>Enroll</button>
                            <button title="Reset Password" className="btn btn-sm btn-ghost text-warning" onClick={() => { setResetModal(student); setNewPassword(''); }}><KeyRound size={14}/></button>
                            <button title="Delete Student" className="btn btn-sm btn-ghost text-danger" onClick={() => handleDelete(student)}><Trash2 size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content" style={{ maxWidth: '640px' }}>
            {!newStudentDetails ? (
              <>
                <div className="premium-modal-header">
                  <div><h2>Register Admission</h2><p>Create account & enroll in exam(s)</p></div>
                  <button className="premium-close" onClick={() => setShowAddModal(false)}>&times;</button>
                </div>
                <form className="premium-form" onSubmit={handleRegister}>
                  <div className="grid-2">
                    <div className="form-group"><label className="form-label">Full Name *</label>
                      <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Rahul Sharma" /></div>
                    <div className="form-group"><label className="form-label">Email (Optional)</label>
                      <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="student@email.com" /></div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group"><label className="form-label">Mobile * (used to login)</label>
                      <input type="text" className="form-input" required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="10-digit number" /></div>
                    <div className="form-group"><label className="form-label">Parent Mobile</label>
                      <input type="text" className="form-input" value={formData.parentMobile} onChange={e => setFormData({...formData, parentMobile: e.target.value})} placeholder="10-digit number" /></div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group"><label className="form-label">Class / Batch</label>
                      <input type="text" className="form-input" value={formData.classYear} onChange={e => setFormData({...formData, classYear: e.target.value})} placeholder="e.g. 12th Regular 2025" /></div>
                    <div className="form-group"><label className="form-label">Temporary Password *</label>
                      <input type="text" className="form-input" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="min 6 characters" /></div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Enroll in Exams (select one or more)</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {configs.map(cfg => {
                        const isSelected = formData.enrolledExamConfigs.includes(cfg.id);
                        return (
                          <button key={cfg.id} type="button" className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`} onClick={() => toggleConfig(cfg.id, formData.enrolledExamConfigs, (fn) => setFormData(prev => ({ ...prev, enrolledExamConfigs: fn(prev.enrolledExamConfigs) })))}>
                            {cfg.displayName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="premium-modal-footer">
                    <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Admit & Generate Credentials</button>
                  </div>
                </form>
              </>
            ) : (
              <div className="premium-form text-center py-8" style={{ animation: 'fadeUp 0.4s ease-out' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginBottom: 20 }}>
                  <CheckCircle size={36} />
                </div>
                <h2 className="font-bold mb-2" style={{ fontSize: '24px', color: 'var(--text-primary)' }}>Student Admitted!</h2>
                <p className="text-muted mb-6" style={{ fontSize: '15px' }}>
                  Account for <strong style={{ color: 'var(--text-primary)' }}>{newStudentDetails.name}</strong> is ready and active.
                </p>
                
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '24px', marginBottom: '24px', textAlign: 'left', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <div className="text-xs text-muted font-bold uppercase mb-4" style={{ letterSpacing: '0.5px' }}>Login Credentials</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '8px' }}>
                      <span className="text-sm text-muted">Mobile / User ID</span>
                      <span className="font-mono font-bold" style={{ color: 'var(--primary)', fontSize: '15px' }}>{newStudentDetails.mobile}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '8px' }}>
                      <span className="text-sm text-muted">Temporary Password</span>
                      <span className="font-mono font-bold" style={{ color: 'var(--primary)', fontSize: '15px' }}>{newStudentDetails.password}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <a href={generateWhatsAppLink()} target="_blank" rel="noreferrer" className="btn btn-lg justify-center" style={{ background: '#25D366', color: '#fff', border: 'none', height: '48px', fontSize: '15px', fontWeight: '600' }}>
                    <MessageCircle size={18}/> Send Credentials via WhatsApp
                  </a>
                  <button onClick={handleCopyText} className="btn justify-center" style={{ background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-primary)', height: '48px', fontSize: '15px', fontWeight: '600' }}>
                    <Copy size={16}/> Copy to Clipboard
                  </button>
                  <button onClick={() => { setShowAddModal(false); setNewStudentDetails(null); }} className="btn btn-ghost justify-center mt-2" style={{ color: 'var(--muted)' }}>
                    Done & Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {resetModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content" style={{ maxWidth: '420px' }}>
            <div className="premium-modal-header">
              <div><h2>Reset Password</h2><p>{resetModal.name}</p></div>
              <button className="premium-close" onClick={() => setResetModal(null)}>&times;</button>
            </div>
            <div className="premium-form">
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="text" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
              </div>
              <div className="premium-modal-footer">
                <button className="btn btn-ghost" onClick={() => setResetModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleResetPassword}><KeyRound size={14}/> Reset Password</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {enrollModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content" style={{ maxWidth: '440px' }}>
            <div className="premium-modal-header">
              <div><h2>Manage Enrollments</h2><p>{enrollModal.name}</p></div>
              <button className="premium-close" onClick={() => setEnrollModal(null)}>&times;</button>
            </div>
            <div className="premium-form">
              <label className="form-label mb-2">Select Exam(s) the student can access:</label>
              <div className="flex flex-wrap gap-2 mb-6">
                {configs.map(cfg => {
                  const sel = enrollSelected.includes(cfg.id);
                  return (
                    <button key={cfg.id} type="button" className={`btn btn-sm ${sel ? 'btn-primary' : 'btn-ghost'}`} onClick={() => toggleConfig(cfg.id, enrollSelected, setEnrollSelected)}>
                      {cfg.displayName}
                    </button>
                  );
                })}
              </div>
              <div className="premium-modal-footer">
                <button className="btn btn-ghost" onClick={() => setEnrollModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleUpdateEnrollment}>Save Enrollments</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {growthModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content" style={{ maxWidth: '720px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="premium-modal-header">
              <div>
                <h2>Test-wise Growth</h2>
                <p>{growthModal.student.name} - Performance over time</p>
              </div>
              <button className="premium-close" onClick={() => setGrowthModal(null)}>&times;</button>
            </div>
            <div className="premium-form">
              {growthLoading || !growthModal.growth ? (
                <div className="loading-center" style={{ height: '200px' }}><div className="spinner"></div></div>
              ) : growthModal.growth.length === 0 ? (
                <div className="empty-state"><div className="empty-icon"><BarChart2 size={40}/></div><p>No tests completed yet.</p></div>
              ) : (
                <>
                  <div className="flex gap-1 mb-6 items-end" style={{ height: '80px' }}>
                    {growthModal.growth.map((g, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                          width: '100%', background: 'var(--primary)', borderRadius: '4px 4px 0 0',
                          height: `${Math.max(g.percentage, 4)}%`, minHeight: '4px',
                          opacity: 0.6 + (i / growthModal.growth.length) * 0.4,
                        }} title={`${g.percentage}%`}></div>
                        <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{i + 1}</span>
                      </div>
                    ))}
                  </div>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Test</th>
                          <th>Score</th>
                          <th>%</th>
                          <th>Accuracy</th>
                          <th>C</th>
                          <th>W</th>
                          <th>S</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {growthModal.growth.map(g => (
                          <tr key={g.attemptNo}>
                            <td className="font-bold">{g.attemptNo}</td>
                            <td>{g.testTitle}</td>
                            <td className="font-bold">{g.score}/{g.totalMarks}</td>
                            <td>
                              <span className={`font-bold ${g.percentage >= 60 ? 'text-success' : g.percentage < 40 ? 'text-danger' : ''}`}>
                                {g.percentage}%
                              </span>
                            </td>
                            <td>{g.accuracy}%</td>
                            <td className="text-success font-bold">{g.correct}</td>
                            <td className="text-danger font-bold">{g.wrong}</td>
                            <td className="text-muted">{g.skipped}</td>
                            <td className="text-muted text-sm">{new Date(g.date).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
