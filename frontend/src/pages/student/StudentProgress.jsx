import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { TrendingUp, BookOpen, CheckCircle, XCircle, BarChart2, Award, Clock, ArrowRight, FileText } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const fmtTime = (secs) => {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
};

const calcAccuracy = (correct, wrong) =>
  correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;

export const StudentProgress = () => {
  const navigate = useNavigate();
  const [tab, setTab]                   = useState('test');
  const [attempts, setAttempts]         = useState([]);
  const [analytics, setAnalytics]       = useState(null);
  const [selectedId, setSelectedId]     = useState('');
  const [detail, setDetail]             = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading]           = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [attRes, anaRes] = await Promise.all([
        api.get('/attempts/my'),
        api.get('/attempts/analytics'),
      ]);
      const submitted = (attRes.data.data || []).filter(
        a => a.status === 'submitted' || a.status === 'auto_submitted'
      );
      setAttempts(submitted);
      setAnalytics(anaRes.data.data);
      if (submitted.length) setSelectedId(String(submitted[0].id));
    } catch {
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    const load = async () => {
      setDetailLoading(true);
      setDetail(null);
      try {
        const res = await api.get(`/attempts/${selectedId}/result`);
        setDetail(res.data.data);
      } catch {
        toast.error('Failed to load test details');
      } finally {
        setDetailLoading(false);
      }
    };
    load();
  }, [selectedId]);

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  // ── Overall subject chart data ──────────────────────────────
  const subjects = analytics?.subjectStats ? Object.keys(analytics.subjectStats) : [];
  const chartData = subjects.map(s => ({
    name: s,
    Correct: analytics.subjectStats[s].correct,
    Wrong:   analytics.subjectStats[s].wrong,
    Skipped: analytics.subjectStats[s].skipped,
  }));

  // ── Subject breakdown for selected test ────────────────────
  const testSubjects = (() => {
    if (!detail) return {};
    const map = {};
    detail.attempt.answers.forEach(ans => {
      const subj = ans.question?.subject || ans.question?.section?.subject || 'Other';
      if (!map[subj]) map[subj] = { correct: 0, wrong: 0, skipped: 0 };
      const skipped = ans.status === 'NOT_VISITED' || ans.status === 'NOT_ANSWERED';
      if (skipped) map[subj].skipped++;
      else if (ans.isCorrect) map[subj].correct++;
      else map[subj].wrong++;
    });
    return map;
  })();

  // ── Overall totals ─────────────────────────────────────────
  const totals = subjects.reduce((acc, s) => {
    acc.correct += analytics.subjectStats[s].correct;
    acc.wrong   += analytics.subjectStats[s].wrong;
    acc.skipped += analytics.subjectStats[s].skipped;
    return acc;
  }, { correct: 0, wrong: 0, skipped: 0 });

  const overallAcc = calcAccuracy(totals.correct, totals.wrong);

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Progress</h1>
          <p className="text-muted text-sm mt-2">Test-wise reports and overall subject growth</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ maxWidth: '360px', marginBottom: '28px' }}>
        <button className={`tab-btn ${tab === 'test' ? 'active' : ''}`} onClick={() => setTab('test')}>
          <FileText size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Test Report
        </button>
        <button className={`tab-btn ${tab === 'overall' ? 'active' : ''}`} onClick={() => setTab('overall')}>
          <TrendingUp size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Overall Growth
        </button>
      </div>

      {/* ── TAB: TEST REPORT ────────────────────────────────── */}
      {tab === 'test' && (
        attempts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><BarChart2 size={48} /></div>
            <h3 className="empty-title">No Completed Tests</h3>
            <p className="empty-desc">Complete your first mock test to see a detailed report.</p>
          </div>
        ) : (
          <>
            {/* Selector row */}
            <div className="card" style={{ marginBottom: '20px', padding: '18px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Select Test</label>
                <select
                  className="form-select"
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                  style={{ flex: 1, minWidth: '220px' }}
                >
                  {attempts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.test?.title} — {new Date(a.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </option>
                  ))}
                </select>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/result/${selectedId}`)}>
                  Full Detail <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {detailLoading && <div className="loading-center"><div className="spinner"></div></div>}

            {!detailLoading && detail && (() => {
              const { attempt, summary } = detail;
              const testAcc = calcAccuracy(attempt.totalCorrect, attempt.totalWrong);

              return (
                <>
                  {/* Score Summary row */}
                  <div className="grid-4" style={{ marginBottom: '20px' }}>
                    <div className="card" style={{ textAlign: 'center' }}>
                      <div className="text-muted text-sm font-bold" style={{ marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score</div>
                      <div className="page-title text-primary">{summary.score}<span className="text-muted" style={{ fontSize: '16px' }}> /{summary.totalMarks}</span></div>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                      <div className="text-muted text-sm font-bold" style={{ marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Accuracy</div>
                      <div className="page-title">{testAcc}%</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                      <div className="text-success text-sm font-bold" style={{ marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Correct</div>
                      <div className="page-title text-success">{attempt.totalCorrect}</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                      <div className="text-danger text-sm font-bold" style={{ marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wrong</div>
                      <div className="page-title text-danger">{attempt.totalWrong}</div>
                    </div>
                  </div>

                  {/* Subject breakdown for this test */}
                  {Object.keys(testSubjects).length > 0 && (
                    <div className="card" style={{ marginBottom: '20px' }}>
                      <h3 style={{ marginBottom: '16px', fontSize: '15px', fontWeight: '700' }}>Subject Summary</h3>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Subject</th>
                              <th>Correct</th>
                              <th>Wrong</th>
                              <th>Skipped</th>
                              <th>Accuracy</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(testSubjects).map(subj => {
                              const s = testSubjects[subj];
                              const acc = calcAccuracy(s.correct, s.wrong);
                              return (
                                <tr key={subj}>
                                  <td className="font-bold">{subj}</td>
                                  <td className="text-success font-bold">{s.correct}</td>
                                  <td className="text-danger font-bold">{s.wrong}</td>
                                  <td className="text-muted">{s.skipped}</td>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <div className="progress-bar" style={{ width: '80px' }}>
                                        <div
                                          className={`progress-fill ${acc >= 70 ? 'success' : acc < 40 ? 'danger' : ''}`}
                                          style={{ width: `${acc}%` }}
                                        />
                                      </div>
                                      <span className="font-bold text-sm">{acc}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Question level table */}
                  <div className="card">
                    <div className="flex-between" style={{ marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>Question Analysis</h3>
                      <span className="badge badge-secondary">{attempt.answers.length} Questions</span>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Q No.</th>
                            <th>Subject</th>
                            <th>Type</th>
                            <th>Your Answer</th>
                            <th>Correct Answer</th>
                            <th>Marks</th>
                            <th>Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attempt.answers.map((ans, idx) => {
                            const subj = ans.question?.subject || ans.question?.section?.subject;
                            const skipped = ans.status === 'NOT_VISITED' || ans.status === 'NOT_ANSWERED';
                            return (
                              <tr
                                key={ans.id}
                                style={{
                                  background: ans.isCorrect === true
                                    ? 'rgba(22,163,74,0.04)'
                                    : ans.isCorrect === false
                                    ? 'rgba(220,38,38,0.04)'
                                    : 'transparent'
                                }}
                              >
                                <td className="font-bold">{idx + 1}</td>
                                <td><span className="badge badge-secondary">{subj || '—'}</span></td>
                                <td><span className="badge" style={{ background: 'var(--bg-3)', color: 'var(--text-2)' }}>{ans.question?.questionType || '—'}</span></td>
                                <td className="font-bold">
                                  {skipped
                                    ? <span className="text-muted" style={{ fontStyle: 'italic', fontWeight: 400 }}>Skipped</span>
                                    : (ans.selectedOption || (ans.numericAnswer ?? '—'))}
                                </td>
                                <td className="font-bold text-success">
                                  {ans.question?.questionType === 'MCQ'
                                    ? ans.question?.correctOption
                                    : (ans.question?.correctNumericAnswer ?? '—')}
                                </td>
                                <td>
                                  <span className={`font-bold ${ans.marksObtained > 0 ? 'text-success' : ans.marksObtained < 0 ? 'text-danger' : 'text-muted'}`}>
                                    {ans.marksObtained > 0 ? '+' : ''}{ans.marksObtained ?? 0}
                                  </span>
                                </td>
                                <td>
                                  {skipped
                                    ? <span className="badge" style={{ background: 'var(--bg-3)', color: 'var(--text-3)' }}>Skipped</span>
                                    : ans.isCorrect
                                    ? <span className="badge badge-success">Correct</span>
                                    : <span className="badge badge-danger">Wrong</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        )
      )}

      {/* ── TAB: OVERALL GROWTH ─────────────────────────────── */}
      {tab === 'overall' && (
        <>
          {/* Summary metrics */}
          <div className="metrics-cards" style={{ marginBottom: '24px' }}>
            <div className="metric-box box-blue">
              <div className="metric-icon"><BookOpen size={20} /></div>
              <div className="metric-data">
                <h4>Tests Completed</h4>
                <h2>{analytics?.totalTests || 0}</h2>
              </div>
            </div>
            <div className="metric-box box-indigo">
              <div className="metric-icon"><Award size={20} /></div>
              <div className="metric-data">
                <h4>Average Score</h4>
                <h2>{analytics?.averageScore || 0}</h2>
              </div>
            </div>
            <div className="metric-box" style={{ borderLeft: '4px solid var(--success)' }}>
              <div className="metric-icon" style={{ background: 'rgba(22,163,74,0.1)', color: 'var(--success)' }}><CheckCircle size={20} /></div>
              <div className="metric-data">
                <h4>Total Correct</h4>
                <h2 style={{ color: 'var(--success)' }}>{totals.correct}</h2>
              </div>
            </div>
            <div className="metric-box" style={{ borderLeft: '4px solid var(--danger)' }}>
              <div className="metric-icon" style={{ background: 'rgba(220,38,38,0.1)', color: 'var(--danger)' }}><XCircle size={20} /></div>
              <div className="metric-data">
                <h4>Overall Accuracy</h4>
                <h2>{overallAcc}%</h2>
              </div>
            </div>
          </div>

          {/* Bar chart */}
          {chartData.length > 0 ? (
            <div className="card" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '24px' }}>Subject-Wise Performance (All Tests)</h3>
              <div style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-2)', fontSize: 13 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card)', border: '1px solid var(--card-border)',
                        borderRadius: '8px', fontSize: '13px'
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '16px' }} />
                    <Bar dataKey="Correct" fill="var(--success)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Wrong"   fill="var(--danger)"  radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Skipped" fill="var(--bg-3)"    radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><BarChart2 size={48} /></div>
              <h3 className="empty-title">No Data Yet</h3>
              <p className="empty-desc">Complete tests to see your subject-wise growth here.</p>
            </div>
          )}

          {/* Score history table */}
          {attempts.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Test History</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Test</th>
                      <th>Date</th>
                      <th>Score</th>
                      <th>Accuracy</th>
                      <th>Time</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((a, idx) => {
                      const acc = calcAccuracy(a.totalCorrect, a.totalWrong);
                      return (
                        <tr key={a.id}>
                          <td className="text-muted font-bold">#{idx + 1}</td>
                          <td>
                            <div className="font-bold">{a.test?.title}</div>
                            <span className="badge badge-secondary" style={{ marginTop: '4px', fontSize: '10px' }}>{a.test?.examConfig?.displayName}</span>
                          </td>
                          <td className="text-muted text-sm">
                            {new Date(a.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td>
                            <span className={`font-bold ${a.score > 0 ? 'text-success' : 'text-danger'}`}>{a.score}</span>
                            <span className="text-muted text-xs"> /{a.test?.examConfig?.totalMarks}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="progress-bar" style={{ width: '60px' }}>
                                <div className={`progress-fill ${acc >= 70 ? 'success' : acc < 40 ? 'danger' : ''}`} style={{ width: `${acc}%` }} />
                              </div>
                              <span className="font-bold text-sm">{acc}%</span>
                            </div>
                          </td>
                          <td className="text-muted text-sm">
                            <Clock size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                            {fmtTime(a.timeTaken)}
                          </td>
                          <td>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => { setTab('test'); setSelectedId(String(a.id)); }}
                            >
                              Report <ArrowRight size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
