import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Users,
  FileText,
  TrendingUp,
  Activity,
  Plus,
  PlayCircle,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      if (data.success) setStats(data.data);
    } catch {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="loading-center">
      <div className="spinner" />
    </div>
  );

  const metrics = [
    { label: 'Active Students', value: stats?.totalStudents ?? 0, icon: <Users size={20} /> },
    { label: 'Total Assessments', value: stats?.totalTests ?? 0, icon: <FileText size={20} /> },
    { label: 'Exam Submissions', value: stats?.totalAttempts ?? 0, icon: <TrendingUp size={20} /> },
    { label: 'Platform Avg. Score', value: stats?.avgScore ?? 0, icon: <Activity size={20} /> }
  ];
  const isMobile = viewportWidth <= 768;

  return (
    <div className="fade-in">

      {/* Basic Page Header */}
      <div className="page-header" style={{ marginBottom: 24, borderBottom: '1px solid var(--card-border)', paddingBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-end', gap: 16, flexDirection: isMobile ? 'column' : 'row' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827', margin: 0 }}>Dashboard Overview</h1>
          <p style={{ fontSize: 13, color: '#4b5563', margin: '4px 0 0 0' }}>Monitor institution metrics and latest test submissions.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexDirection: isMobile ? 'column' : 'row', width: isMobile ? '100%' : 'auto' }}>
          <button 
            onClick={() => navigate('/admin/students')} 
            style={{ padding: '8px 16px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#374151', width: isMobile ? '100%' : 'auto' }}
          >
            <Users size={16} /> Manage Students
          </button>
          <button 
            onClick={() => navigate('/admin/tests')} 
            style={{ padding: '8px 16px', background: '#f97316', border: '1px solid #ea6c0a', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: isMobile ? '100%' : 'auto' }}
          >
            <Plus size={16} /> Create Test
          </button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#6b7280' }}>{m.label}</span>
              <div style={{ color: '#9ca3af' }}>{m.icon}</div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 600, color: '#111827', fontFamily: "'Inter', sans-serif" }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid containing Table & Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 300px', gap: 20 }}>
        
        {/* Recent Submissions Table */}
        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#111827' }}>Recent Exam Submissions</h3>
            <span style={{ fontSize: 12, color: '#f97316', cursor: 'pointer', fontWeight: 500 }} onClick={() => navigate('/admin/results')}>
              View Complete Log →
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Student</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Test Taken</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Score</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentAttempts?.length > 0 ? (
                  stats.recentAttempts.slice(0, 8).map(attempt => (
                    <tr key={attempt.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{attempt.user?.name}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{attempt.user?.mobile}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>
                        {attempt.test?.title}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                         <span style={{ display: 'inline-block', padding: '2px 8px', background: attempt.score > 0 ? '#ecfdf5' : '#fef2f2', color: attempt.score > 0 ? '#10b981' : '#ef4444', borderRadius: 4, fontSize: 12, fontWeight: 500 }}>
                           {attempt.score}
                         </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                        {new Date(attempt.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '32px 16px', textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
                      No recent submissions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Administration Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 8, padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px 0', color: '#111827' }}>Quick Actions</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div 
                onClick={() => navigate('/admin/tests')}
                style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#f97316'}
                onMouseOut={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <div style={{ background: '#fff7ed', padding: 8, borderRadius: 6, color: '#f97316' }}>
                  <PlayCircle size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Publish a Test</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>Upload questions or activate</div>
                </div>
              </div>

              <div 
                onClick={() => navigate('/admin/students')}
                style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#f97316'}
                onMouseOut={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <div style={{ background: '#f3f4f6', padding: 8, borderRadius: 6, color: '#4b5563' }}>
                  <Users size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Student Records</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>View registrations</div>
                </div>
              </div>
              
              <div 
                onClick={() => navigate('/admin/results')}
                style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#f97316'}
                onMouseOut={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <div style={{ background: '#f3f4f6', padding: 8, borderRadius: 6, color: '#4b5563' }}>
                  <Activity size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Result Analytics</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>Check performance metrics</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 8, padding: 16 }}>
             <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px 0', color: '#111827' }}>System Log</h3>
             <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
               <li style={{ display: 'flex', gap: 10, fontSize: 12.5, color: '#4b5563', alignItems: 'flex-start' }}>
                 <Clock size={14} style={{ color: '#9ca3af', marginTop: 2, flexShrink: 0 }} />
                 <span>Ensure CSV files are formatted exactly matching the sample template before upload.</span>
               </li>
               <li style={{ display: 'flex', gap: 10, fontSize: 12.5, color: '#4b5563', alignItems: 'flex-start' }}>
                 <Clock size={14} style={{ color: '#9ca3af', marginTop: 2, flexShrink: 0 }} />
                 <span>Do not alter the structure of an active test currently being attempted.</span>
               </li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
