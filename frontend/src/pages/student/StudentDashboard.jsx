import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Play, CheckCircle, Target, Award, ArrowRight, BarChart2, Star } from 'lucide-react';

export const StudentDashboard = () => {
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
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
    if (!window.confirm('Are you ready to start? The timer will begin immediately.')) return;
    navigate(`/exam/${testId}`);
  };

  const inProgressAttempt = attempts.find(a => a.status === 'in_progress');
  const submittedAttempts = attempts.filter(a => a.status === 'submitted' || a.status === 'auto_submitted');
  const submittedTestIds = submittedAttempts.map(a => a.testId);

  const availableTests = tests.filter(test => !submittedTestIds.includes(test.id));

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  return (
    <div className="fade-in student-portal">

      {/* Premium Student Hero */}
      <div className="student-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Target size={14} /> Target: {user?.examType?.replace('_', ' ')}
          </div>
          <h1 className="hero-title">Prepare to Ace It, {user?.name?.split(' ')[0]}!</h1>
          <p className="hero-desc">Your customized test series tracks your performance and guides you towards your goal.</p>
        </div>
        <div className="hero-graphics hidden sm:flex">
          <div className="graphic-circle"></div>
          <Star className="graphic-icon" size={48} />
        </div>
      </div>

      {inProgressAttempt && (
        <div className="premium-resume-banner">
          <div className="banner-info">
            <span className="banner-pulse"></span>
            <div>
              <h4>Active Session: {inProgressAttempt.test?.title}</h4>
              <p>You have an unfinished test. Don't lose your progress!</p>
            </div>
          </div>
          <button className="btn banner-btn" onClick={() => navigate(`/exam/${inProgressAttempt.testId}`)}>
            Resume Test <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Main Dashboard Layout */}
      <div className="student-grid-layout">
        
        {/* Left Column: Upcoming/Available Tests */}
        <div className="s-main-col">
          <div className="flex-between mb-4">
            <h3 className="section-heading mb-0">Upcoming Mock Tests</h3>
            <span className="badge badge-primary premium-pill">{availableTests.length} Available</span>
          </div>

          {availableTests.length === 0 ? (
            <div className="premium-empty-box">
              <CheckCircle size={40} className="text-success mb-3" />
              <h3>All Caught Up!</h3>
              <p>You have completed all available tests. Great work.</p>
            </div>
          ) : (
            <div className="test-grid">
              {availableTests.map(test => {
                const isMHT = test.examConfig?.name?.includes('MHT');
                const isJEE = test.examConfig?.name?.includes('JEE');
                
                return (
                  <div key={test.id} className="test-item-card student-test-card">
                    <div className="test-card-top">
                      <span className={`type-badge ${isMHT ? 'badge-mht-pcm' : isJEE ? 'badge-jee' : 'badge-neet'}`}>
                        {test.examConfig?.displayName}
                      </span>
                    </div>
                    
                    <div className="test-card-body">
                      <h3>{test.title}</h3>
                      <p className="line-clamp-2">{test.description || 'Evaluate your preparation with this test.'}</p>
                    </div>
                    
                    <div className="test-card-stats student-stats">
                      <div className="t-stat"><strong>{test.examConfig?.duration}</strong><br/>Mins</div>
                      <div className="stat-divider"></div>
                      <div className="t-stat"><strong>{test.examConfig?.totalMarks}</strong><br/>Marks</div>
                    </div>

                    <button className="btn btn-primary btn-full premium-start-btn" onClick={() => handleStartTest(test.id)}>
                      <Play size={16} fill="currentColor" /> Start Now
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Performance Summary */}
        <div className="s-side-col">
          <h3 className="section-heading">Performance Log</h3>
          
          <div className="premium-history-panel">
            {submittedAttempts.length === 0 ? (
              <div className="text-center py-8 text-muted">
                <BarChart2 size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Complete tests to unlock your performance insights.</p>
              </div>
            ) : (
              <div className="history-list">
                {submittedAttempts.map((attempt) => {
                  const accuracy = attempt.totalCorrect + attempt.totalWrong > 0 
                    ? ((attempt.totalCorrect / (attempt.totalCorrect + attempt.totalWrong)) * 100).toFixed(0)
                    : 0;
                  
                  return (
                    <div className="history-card" key={attempt.id}>
                      <div className="flex-between">
                        <div className="history-info">
                          <h4>{attempt.test?.title}</h4>
                          <span className="history-date">{new Date(attempt.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="history-score-box">
                          <span className={`val ${attempt.score > 0 ? 'text-success' : 'text-danger'}`}>{attempt.score}</span>
                          <span className="lbl">/ {attempt.test?.examConfig?.totalMarks}</span>
                        </div>
                      </div>
                      
                      <div className="history-progress mt-3">
                        <div className="flex-between text-xs font-bold mb-1">
                          <span>Accuracy</span>
                          <span>{accuracy}%</span>
                        </div>
                        <div className="progress-bar mini-bar">
                          <div className={`progress-fill ${accuracy > 70 ? 'success' : accuracy < 40 ? 'danger' : ''}`} style={{ width: `${accuracy}%` }}></div>
                        </div>
                      </div>
                      
                      <button className="btn btn-ghost btn-sm btn-full mt-3 history-btn" onClick={() => navigate(`/result/${attempt.id}`)}>
                        View Detailed Report <ArrowRight size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};
