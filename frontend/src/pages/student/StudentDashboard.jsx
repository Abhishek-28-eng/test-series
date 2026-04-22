import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const StudentDashboard = () => {
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    try {
      const [testsRes, attemptsRes] = await Promise.all([
        api.get('/tests'),
        api.get('/attempts/my')
      ]);
      setTests(testsRes.data.data);
      setAttempts(attemptsRes.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (testId) => {
    if (!window.confirm('Are you sure you want to start this test now?')) return;
    navigate(`/exam/${testId}`);
  };

  const inProgressAttempt = attempts.find(a => a.status === 'in_progress');
  const submittedAttempts = attempts.filter(a => a.status === 'submitted' || a.status === 'auto_submitted');
  const submittedTestIds = submittedAttempts.map(a => a.testId);
  const availableTests = tests.filter(test => !submittedTestIds.includes(test.id));
  const isMobile = viewportWidth <= 768;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0', color: '#6b7280' }}>
      Loading dashboard...
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
      
      {/* Basic Navigation / Header */}
      <div style={{ marginBottom: 32, borderBottom: '1px solid #e5e7eb', paddingBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-end', flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#111827', margin: '0 0 4px 0' }}>Student Dashboard</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Logged in as {user?.name}</p>
        </div>
        <div style={{ fontSize: 13, color: '#4b5563', background: '#f3f4f6', padding: '6px 12px', borderRadius: 4, alignSelf: isMobile ? 'flex-start' : 'auto' }}>
          Target: {user?.examType?.replace('_', ' ') || 'Exam'}
        </div>
      </div>

      {/* Alert for unfinished test */}
      {inProgressAttempt && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '16px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle size={20} color="#d97706" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#92400e' }}>Active Test Session</div>
              <div style={{ fontSize: 13, color: '#b45309' }}>You have not submitted: {inProgressAttempt.test?.title}</div>
            </div>
          </div>
          <button 
            onClick={() => navigate(`/exam/${inProgressAttempt.testId}`)}
            style={{ padding: '8px 16px', background: '#d97706', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 500, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}
          >
            Resume Test
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
        
        {/* Left Column: List of tests */}
        <div style={{ flex: '1 1 600px', width: isMobile ? '100%' : 'auto' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Available Tests</h2>
          
          {availableTests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#f9fafb' }}>
              <CheckCircle2 size={32} color="#9ca3af" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 14, color: '#6b7280' }}>No pending tests available.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {availableTests.map(test => (
                <div key={test.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 16, padding: '20px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }}>
                  
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', marginBottom: 4, textTransform: 'uppercase' }}>
                      {test.examConfig?.displayName}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: '#111827', marginBottom: 8 }}>
                      {test.title}
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#6b7280', flexDirection: isMobile ? 'column' : 'row' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {test.examConfig?.duration} mins</span>
                      <span>Total Marks: {test.examConfig?.totalMarks}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleStartTest(test.id)}
                    style={{ padding: '8px 24px', background: '#0d1e3d', color: '#fff', border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 500, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}
                  >
                    Start Test
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Performance */}
        <div style={{ flex: '1 1 300px', maxWidth: isMobile ? '100%' : 400, width: isMobile ? '100%' : 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>Recent Results</h2>
            {submittedAttempts.length > 0 && (
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/progress'); }} style={{ fontSize: 13, color: '#f97316', textDecoration: 'none' }}>View All</a>
            )}
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', overflow: 'hidden' }}>
            {submittedAttempts.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
                No completed tests yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {submittedAttempts.slice(0, 5).map((attempt, index) => (
                  <div key={attempt.id} style={{
                    padding: '16px', 
                    display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 12,
                    borderBottom: index !== submittedAttempts.slice(0, 5).length - 1 ? '1px solid #e5e7eb' : 'none',
                    cursor: 'pointer'
                  }} onClick={() => navigate(`/result/${attempt.id}`)}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: 4 }}>{attempt.test?.title}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{new Date(attempt.updatedAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: isMobile ? 'left' : 'right', width: isMobile ? '100%' : 'auto' }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: attempt.score > 0 ? '#16a34a' : '#dc2626' }}>
                        {attempt.score}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>/ {attempt.test?.examConfig?.totalMarks}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};
