import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Users, FileText, CheckCircle, TrendingUp, Calendar, ChevronRight, Activity, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  return (
    <div className="fade-in admin-dashbaord-container">
      
      {/* Premium Welcome Header Layout */}
      <div className="admin-header-panel">
        <div className="header-content">
          <div className="date-pill">
            <Calendar size={14} /> <span>{currentDate}</span>
          </div>
          <h1 className="welcome-title">Good to see you, {user?.name?.split(' ')[0]}</h1>
          <p className="welcome-subtitle">Here is what's happening across your Latur Pattern platform today.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/admin/tests')}>
            <Zap size={16} /> Create New Test
          </button>
        </div>
      </div>

      {/* Asymmetric Split Layout instead of standard 4 grid block */}
      <div className="admin-layout-split">
        
        {/* Main Column */}
        <div className="admin-main-col">
          
          <div className="metrics-group">
            <h3 className="section-heading">Platform Architecture</h3>
            
            <div className="metrics-cards">
              <div className="metric-box box-blue">
                <div className="metric-icon"><Users size={20} /></div>
                <div className="metric-data">
                  <h4>Total Enrolled Students</h4>
                  <h2>{stats?.totalStudents || 0}</h2>
                </div>
              </div>
              
              <div className="metric-box box-indigo">
                <div className="metric-icon"><FileText size={20} /></div>
                <div className="metric-data">
                  <h4>Published & Draft Tests</h4>
                  <h2>{stats?.totalTests || 0}</h2>
                </div>
              </div>
            </div>
          </div>

          <div className="metrics-group mt-6">
            <div className="flex-between mb-4">
              <h3 className="section-heading mb-0">Recent Activity Log</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/results')}>
                View All <ChevronRight size={14} />
              </button>
            </div>
            
            <div className="activity-list card">
              {stats?.recentAttempts?.length > 0 ? (
                stats.recentAttempts.map(attempt => (
                  <div className="activity-row" key={attempt.id}>
                    <div className="activity-avatar">
                      {attempt.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="activity-details">
                      <h4>{attempt.user?.name} <span>completed</span> {attempt.test?.title}</h4>
                      <p className="text-muted">{attempt.user?.email}</p>
                    </div>
                    <div className="activity-score">
                      <div className={`score-badge ${attempt.score > 0 ? 'score-good' : 'score-bad'}`}>
                        {attempt.score} Points
                      </div>
                      <small className="text-muted">{new Date(attempt.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state py-8">
                  <p className="text-muted text-sm">No activity recorded yet.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Side Column */}
        <div className="admin-side-col">
          
          <div className="side-card performance-card">
            <h3 className="section-heading">Global Performance</h3>
            <div className="perf-circle">
              <div className="circle-content">
                <Activity size={24} className="text-success mb-2" />
                <span className="perf-num">{stats?.avgScore || 0}</span>
                <span className="perf-label">Avg. Score</span>
              </div>
            </div>
            
            <div className="perf-stats">
              <div className="p-stat">
                <span className="p-val">{stats?.totalAttempts || 0}</span>
                <span className="p-lab">Total Submissions</span>
              </div>
            </div>
          </div>

          <div className="side-card info-card mt-6">
            <h3 className="section-heading">Quick Tips</h3>
            <ul className="info-list">
              <li>Keep test descriptions concise but informative for students.</li>
              <li>Upload numerical questions with exact answers to ensure grading correctness.</li>
              <li>Monitor global performance to adjust the difficulty curve of your mock tests.</li>
            </ul>
          </div>
          
        </div>
      </div>
    </div>
  );
};
