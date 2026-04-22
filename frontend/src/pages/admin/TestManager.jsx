import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, List, Play, Search, FileText } from 'lucide-react';

export const TestManager = () => {
  const [tests, setTests] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    examConfigId: '',
    description: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [testsRes, configsRes] = await Promise.all([
        api.get('/tests'),
        api.get('/exam-configs')
      ]);
      setTests(testsRes.data.data);
      setConfigs(configsRes.data.data);
      
      if (configsRes.data.data.length > 0) {
        setFormData(prev => ({ ...prev, examConfigId: configsRes.data.data[0].id }));
      }
    } catch (error) {
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/tests', formData);
      if (data.success) {
        toast.success('Test created successfully');
        setShowModal(false);
        fetchData();
        setFormData({ title: '', examConfigId: configs[0]?.id, description: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create test');
    }
  };

  const handlePublish = async (id) => {
    try {
      const { data } = await api.put(`/tests/${id}/publish`);
      if (data.success) {
        toast.success('Test published successfully');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to publish test');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this test?')) return;
    try {
      const { data } = await api.delete(`/tests/${id}`);
      if (data.success) {
        toast.success('Test deleted');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete test');
    }
  };

  const filteredTests = tests.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return (
    <div className="loading-center">
      <div className="spinner" />
    </div>
  );

  return (
    <div className="fade-in">
      
      {/* Function-focused Page Header */}
      <div className="page-header" style={{ marginBottom: 24, borderBottom: '1px solid var(--card-border)', paddingBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827', margin: 0 }}>Assessments</h1>
          <p style={{ fontSize: 13, color: '#4b5563', margin: '4px 0 0 0' }}>Manage mock tests and publish them to students.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
            <input 
              type="text" 
              placeholder="Search tests..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '8px 12px 8px 30px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none', width: 220 }}
            />
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            style={{ padding: '8px 16px', background: '#f97316', border: '1px solid #ea6c0a', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} /> Create Assessment
          </button>
        </div>
      </div>

      {/* Tests Content List/Grid */}
      <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 8, overflow: 'hidden' }}>
        {filteredTests.length === 0 ? (
           <div style={{ padding: '60px 20px', textAlign: 'center', color: '#6b7280' }}>
             <FileText size={32} style={{ margin: '0 auto 12px' }} />
             <h3 style={{ margin: '0 0 4px 0', fontSize: 15, color: '#111827' }}>No tests found</h3>
             <p style={{ margin: 0, fontSize: 13 }}>Create a new test or adjust your search.</p>
           </div>
        ) : (
           <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Assessment</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Configuration</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map(test => (
                  <tr key={test.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '16px', maxWidth: 300 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{test.title}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {test.description || 'No description provided.'}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                        {test.examConfig?.displayName}
                      </span>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>
                        {test.examConfig?.duration} mins • {test.examConfig?.totalMarks} marks
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                        background: test.status === 'published' ? '#ecfdf5' : '#fff7ed', 
                        color: test.status === 'published' ? '#059669' : '#d97706',
                        border: `1px solid ${test.status === 'published' ? '#a7f3d0' : '#fde68a'}`
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: test.status === 'published' ? '#10b981' : '#f59e0b' }} />
                        {test.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => navigate(`/admin/tests/${test.id}/questions`)}
                          style={{ padding: '6px 12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#374151', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <List size={14} /> Questions
                        </button>
                        
                        {test.status === 'draft' && (
                          <button 
                            onClick={() => handlePublish(test.id)}
                            style={{ padding: '6px 12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#059669', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Play size={14} /> Publish
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleDelete(test.id)}
                          style={{ padding: '6px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#ef4444', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Delete Assessment"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Standard B2B Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.6)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 8, width: '100%', maxWidth: 480, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' }}>Create Assessment</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>&times;</button>
            </div>
            
            <form onSubmit={handleCreateTest} style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Test Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Weekly Full Syllabus - Set A"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Configuration Blueprint</label>
                <select 
                  required
                  value={formData.examConfigId}
                  onChange={e => setFormData({...formData, examConfigId: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                >
                  {configs.map(config => (
                    <option key={config.id} value={config.id}>
                      {config.displayName} ({config.totalMarks}mk / {config.duration}m)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Description / Instructions</label>
                <textarea 
                  placeholder="Internal notes or student-facing instructions..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#f97316', border: '1px solid #ea6c0a', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#fff', cursor: 'pointer' }}>Create Assessment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
