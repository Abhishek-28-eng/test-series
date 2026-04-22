import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Search, Download, Award, Target, HelpCircle, Activity } from 'lucide-react';

export const GlobalResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const { data } = await api.get('/admin/results');
      if (data.success) setResults(data.data);
    } catch (error) {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const link = document.createElement('a');
    link.href = '/api/admin/results/export';
    fetch('/api/admin/results/export', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = 'global-results.csv';
        link.click();
        URL.revokeObjectURL(url);
      });
  };

  const filteredResults = results.filter(res => {
    const sq = searchQuery.toLowerCase();
    return (
      res.user?.name.toLowerCase().includes(sq) ||
      res.test?.title.toLowerCase().includes(sq) ||
      (res.user?.mobile && res.user.mobile.includes(sq))
    );
  });

  if (loading) return (
    <div className="loading-center">
      <div className="spinner" />
    </div>
  );

  return (
    <div className="fade-in">
      
      {/* Functional Page Header */}
      <div className="page-header" style={{ marginBottom: 24, borderBottom: '1px solid var(--card-border)', paddingBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827', margin: 0 }}>Result Analytics</h1>
          <p style={{ fontSize: 13, color: '#4b5563', margin: '4px 0 0 0' }}>Global monitor for all completed test assessments.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
            <input 
              type="text" 
              placeholder="Search candidate, mobile, or test..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '8px 12px 8px 30px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none', width: 240 }}
            />
          </div>

          <button 
            onClick={handleExport}
            style={{ padding: '8px 16px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={14} /> Export Dataset
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 8, overflow: 'hidden' }}>
        
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} /> Aggregate Leaderboard
          </h3>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Showing {filteredResults.length} records</span>
        </div>

        {filteredResults.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#6b7280' }}>
            <HelpCircle size={32} style={{ margin: '0 auto 12px', color: '#d1d5db' }} />
            <h3 style={{ margin: '0 0 4px 0', fontSize: 15, color: '#111827' }}>No results available</h3>
            <p style={{ margin: 0, fontSize: 13 }}>No student attempts match your criteria, or no tests are completed yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 900 }}>
              <thead>
                <tr style={{ background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', width: 60, textAlign: 'center' }}>Rank</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Candidate Detail</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Assessment Executed</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: 'center' }}>Aggregate Score</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: 'center' }}>Accuracy</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Time Spent</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((res, idx) => {
                  const acc = res.accuracy || 0;
                  const accColor = acc >= 70 ? '#10b981' : acc >= 40 ? '#f59e0b' : '#ef4444';
                  
                  return (
                    <tr key={res.id} style={{ borderBottom: '1px solid #f9fafb' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '16px', fontSize: 13, color: '#6b7280', textAlign: 'center', fontWeight: 600 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: idx < 3 ? '#fff7ed' : 'transparent', color: idx < 3 ? '#ea580c' : '#6b7280', border: idx < 3 ? '1px solid #fed7aa' : 'none', borderRadius: 4, width: 28, height: 28 }}>
                          #{idx + 1}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{res.user?.name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{res.user?.mobile || res.user?.email}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Target size={12} style={{ color: '#9ca3af' }} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{res.test?.title}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ 
                          display: 'inline-flex', padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 700,
                          background: res.score > 0 ? '#ecfdf5' : res.score < 0 ? '#fef2f2' : '#f3f4f6', 
                          color: res.score > 0 ? '#059669' : res.score < 0 ? '#dc2626' : '#6b7280',
                          border: `1px solid ${res.score > 0 ? '#a7f3d0' : res.score < 0 ? '#fecaca' : '#e5e7eb'}`
                        }}>
                          {res.score > 0 ? '+' : ''}{res.score}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: accColor }}>{acc}%</span>
                          <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${acc}%`, background: accColor }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: 12, color: '#4b5563', fontFamily: 'Inter' }}>
                        {res.timeTakenFormatted || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', fontSize: 12, color: '#6b7280' }}>
                        {new Date(res.updatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
