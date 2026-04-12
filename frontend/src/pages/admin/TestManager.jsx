import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, List, Play, Search, Clock, Target, FileText, Activity } from 'lucide-react';

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
      toast.error('Failed to load data');
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

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  return (
    <div className="fade-in admin-manager-container">
      
      {/* Handcrafted Header Block */}
      <div className="manager-header-block">
        <div className="manager-header-content">
          <h1 className="manager-title">Test Directory</h1>
          <p className="manager-subtitle">Manage, create, and publish mock tests across all configurations.</p>
        </div>
        <div className="manager-header-actions">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search tests..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="btn btn-primary premium-btn" onClick={() => setShowModal(true)}>
            <Plus size={16} /> <span>Create New Test</span>
          </button>
        </div>
      </div>

      {/* Tests Content */}
      <div className="manager-content">
        {filteredTests.length === 0 ? (
           <div className="empty-state premium-empty">
             <div className="empty-icon"><FileText size={48} /></div>
             <h3 className="empty-title">No tests found</h3>
             <p className="empty-desc">Create your first test or adjust the search filter.</p>
           </div>
        ) : (
          <div className="test-grid">
            {filteredTests.map(test => (
              <div key={test.id} className="test-item-card">
                <div className="test-card-top">
                  <div className={`status-pill ${test.status === 'published' ? 'pill-published' : 'pill-draft'}`}>
                    <span className="dot"></span> {test.status}
                  </div>
                  <span className="type-badge">{test.examConfig?.displayName}</span>
                </div>
                
                <div className="test-card-body">
                  <h3>{test.title}</h3>
                  <p className="line-clamp-2">{test.description || 'No description provided.'}</p>
                </div>
                
                <div className="test-card-stats">
                  <div className="t-stat"><Clock size={14} /> <span>{test.examConfig?.duration} m</span></div>
                  <div className="t-stat"><Target size={14} /> <span>{test.examConfig?.totalMarks} mk</span></div>
                </div>

                <div className="test-card-actions">
                  <button 
                    onClick={() => navigate(`/admin/tests/${test.id}/questions`)}
                    className="action-btn action-manage"
                  >
                    <List size={16} /> Manage Items
                  </button>
                  
                  <div className="action-row">
                    {test.status === 'draft' && (
                      <button 
                        onClick={() => handlePublish(test.id)}
                        className="action-icon-btn text-success"
                        title="Publish Test"
                      >
                        <Play fill="currentColor" size={16} /> Publish
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleDelete(test.id)}
                      className="action-icon-btn text-danger"
                      title="Delete Test"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Premium Create Modal */}
      {showModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content">
            <div className="premium-modal-header">
              <div>
                <h2>Create Assessment</h2>
                <p>Configure a new mock test</p>
              </div>
              <button className="premium-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <form className="premium-form" onSubmit={handleCreateTest}>
              <div className="form-group slide-up-group" style={{animationDelay: '0.05s'}}>
                <label className="form-label">Test Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  placeholder="e.g. Full Syllabus Mock 1"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="form-group slide-up-group" style={{animationDelay: '0.1s'}}>
                <label className="form-label">Exam Configuration Blueprint</label>
                <div className="custom-select-wrapper">
                  <select 
                    className="form-select"
                    required
                    value={formData.examConfigId}
                    onChange={e => setFormData({...formData, examConfigId: e.target.value})}
                  >
                    {configs.map(config => (
                      <option key={config.id} value={config.id}>
                        {config.displayName} — {config.totalMarks} Marks / {config.duration} Mins
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group slide-up-group" style={{animationDelay: '0.15s'}}>
                <label className="form-label">Description Comments</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Notes for students about this mock test..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  rows="3"
                ></textarea>
              </div>

              <div className="premium-modal-footer slide-up-group" style={{animationDelay: '0.2s'}}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Discard</button>
                <button type="submit" className="btn btn-primary btn-lg custom-shadow">Create Assessment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
