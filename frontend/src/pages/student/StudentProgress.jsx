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

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0', color: '#6b7280' }}>
      Loading progress data...
    </div>
  );

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
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: '#111827', margin: '0 0 4px 0' }}>Performance Reports</h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Review your specific test submissions and overall growth analytics.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
        <button 
          onClick={() => setTab('test')} 
          style={{ 
            background: 'none', border: 'none', padding: '12px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
            borderBottom: tab === 'test' ? '2px solid #0d1e3d' : '2px solid transparent',
            color: tab === 'test' ? '#0d1e3d' : '#6b7280',
            display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          <FileText size={16} /> Test Detail Report
        </button>
        <button 
          onClick={() => setTab('overall')} 
          style={{ 
            background: 'none', border: 'none', padding: '12px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
            borderBottom: tab === 'overall' ? '2px solid #0d1e3d' : '2px solid transparent',
            color: tab === 'overall' ? '#0d1e3d' : '#6b7280',
             display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          <TrendingUp size={16} /> Aggregate Analytics
        </button>
      </div>

      {/* ── TAB: TEST REPORT ────────────────────────────────── */}
      {tab === 'test' && (
        attempts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed #d1d5db', borderRadius: 6, background: '#fff' }}>
            <BarChart2 size={48} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: '0 0 8px 0' }}>No Completed Tests</h3>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>You must submit at least one mock test to generate a performance report.</p>
          </div>
        ) : (
          <>
            {/* Selector row */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0, whiteSpace: 'nowrap' }}>Select Test Attempt</label>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                style={{ flex: 1, minWidth: '220px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', fontSize: 14 }}
              >
                {attempts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.test?.title} — {new Date(a.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </option>
                ))}
              </select>
              <button 
                onClick={() => navigate(`/result/${selectedId}`)}
                style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                Full Detail <ArrowRight size={14} />
              </button>
            </div>

            {detailLoading && <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>Loading test report...</div>}

            {!detailLoading && detail && (() => {
              const { attempt, summary } = detail;
              const testAcc = calcAccuracy(attempt.totalCorrect, attempt.totalWrong);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Score Summary row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '24px', textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 8 }}>Total Score</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#0d1e3d' }}>{summary.score}<span style={{ fontSize: 14, color: '#9ca3af' }}> /{summary.totalMarks}</span></div>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '24px', textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 8 }}>Accuracy</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#0d1e3d' }}>{testAcc}%</div>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '24px', textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', textTransform: 'uppercase', marginBottom: 8 }}>Vaild Answers</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>{attempt.totalCorrect}</div>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '24px', textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', textTransform: 'uppercase', marginBottom: 8 }}>Invalid Answers</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>{attempt.totalWrong}</div>
                    </div>
                  </div>

                  {/* Subject breakdown for this test */}
                  {Object.keys(testSubjects).length > 0 && (
                    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Subject Breakdown</h3>
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#fff' }}>
                              <th style={{ padding: '12px 20px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Subject</th>
                              <th style={{ padding: '12px 20px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Correct</th>
                              <th style={{ padding: '12px 20px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Wrong</th>
                              <th style={{ padding: '12px 20px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Skipped</th>
                              <th style={{ padding: '12px 20px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Accuracy</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(testSubjects).map(subj => {
                              const s = testSubjects[subj];
                              const acc = calcAccuracy(s.correct, s.wrong);
                              return (
                                <tr key={subj}>
                                  <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 500, color: '#111827', borderBottom: '1px solid #e5e7eb' }}>{subj}</td>
                                  <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 600, color: '#16a34a', borderBottom: '1px solid #e5e7eb' }}>{s.correct}</td>
                                  <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 600, color: '#dc2626', borderBottom: '1px solid #e5e7eb' }}>{s.wrong}</td>
                                  <td style={{ padding: '16px 20px', fontSize: 14, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{s.skipped}</td>
                                  <td style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <div style={{ width: 80, height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                                        <div style={{ width: `${acc}%`, height: '100%', background: acc >= 70 ? '#16a34a' : acc < 40 ? '#dc2626' : '#d97706' }} />
                                      </div>
                                      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{acc}%</span>
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
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Item Analysis</h3>
                      <span style={{ fontSize: 12, background: '#e5e7eb', color: '#374151', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>{attempt.answers.length} Questions</span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '12px 20px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>ID</th>
                            <th style={{ padding: '12px 20px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Subject</th>
                            <th style={{ padding: '12px 20px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Your Input</th>
                            <th style={{ padding: '12px 20px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Verified Answer</th>
                            <th style={{ padding: '12px 20px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Assigned Marks</th>
                            <th style={{ padding: '12px 20px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attempt.answers.map((ans, idx) => {
                            const subj = ans.question?.subject || ans.question?.section?.subject;
                            const skipped = ans.status === 'NOT_VISITED' || ans.status === 'NOT_ANSWERED';
                            return (
                              <tr key={ans.id}>
                                <td style={{ padding: '12px 20px', fontSize: 13, borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>{idx + 1}</td>
                                <td style={{ padding: '12px 20px', fontSize: 13, borderBottom: '1px solid #e5e7eb', color: '#111827' }}>{subj || 'N/A'}</td>
                                <td style={{ padding: '12px 20px', fontSize: 13, borderBottom: '1px solid #e5e7eb' }}>
                                  {skipped ? <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Skipped</span> : <span style={{ fontWeight: 500, color: '#111827' }}>{ans.selectedOption || ans.numericAnswer || '—'}</span>}
                                </td>
                                <td style={{ padding: '12px 20px', fontSize: 13, borderBottom: '1px solid #e5e7eb', color: '#16a34a', fontWeight: 500 }}>
                                  {ans.question?.questionType === 'MCQ' ? ans.question?.correctOption : (ans.question?.correctNumericAnswer ?? '—')}
                                </td>
                                <td style={{ padding: '12px 20px', fontSize: 13, borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: ans.marksObtained > 0 ? '#16a34a' : ans.marksObtained < 0 ? '#dc2626' : '#9ca3af' }}>
                                  {ans.marksObtained > 0 ? '+' : ''}{ans.marksObtained ?? 0}
                                </td>
                                <td style={{ padding: '12px 20px', fontSize: 13, borderBottom: '1px solid #e5e7eb' }}>
                                  {skipped 
                                    ? <span style={{ color: '#6b7280', background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Omitted</span> 
                                    : ans.isCorrect 
                                    ? <span style={{ color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Correct</span> 
                                    : <span style={{ color: '#b91c1c', background: '#fef2f2', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Incorrect</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )
      )}

      {/* ── TAB: OVERALL GROWTH ─────────────────────────────── */}
      {tab === 'overall' && (
        <>
          {/* Summary metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, background: '#f3f4f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}><BookOpen size={24} /></div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Tests Completed</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{analytics?.totalTests || 0}</div>
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, background: '#eff6ff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}><Award size={24} /></div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Average Score</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{analytics?.averageScore || 0}</div>
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, background: '#ecfdf5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}><CheckCircle size={24} /></div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Total Correct</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#16a34a' }}>{totals.correct}</div>
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, background: '#fffbeb', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}><TrendingUp size={24} /></div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Global Accuracy</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#d97706' }}>{overallAcc}%</div>
              </div>
            </div>
          </div>

          {/* Bar chart */}
          {chartData.length > 0 ? (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '24px', marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 24px 0' }}>Aggregate Subject Performance</h3>
              <div style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 13, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 16 }} />
                    <Bar dataKey="Correct" fill="#16a34a" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Wrong"   fill="#dc2626"  radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Skipped" fill="#e5e7eb"    radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
             <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed #d1d5db', borderRadius: 6, background: '#fff', marginBottom: 24 }}>
               <BarChart2 size={48} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
               <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: '0 0 8px 0' }}>Insufficient Data</h3>
               <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Visual analytics will populate here once you submit tests.</p>
             </div>
          )}

          {/* Score history table */}
          {attempts.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Submission History</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 20px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Record ID</th>
                      <th style={{ padding: '12px 20px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Assessment</th>
                      <th style={{ padding: '12px 20px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Completed On</th>
                      <th style={{ padding: '12px 20px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Score</th>
                      <th style={{ padding: '12px 20px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Accuracy</th>
                      <th style={{ padding: '12px 20px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Duration</th>
                      <th style={{ padding: '12px 20px', borderBottom: '1px solid #e5e7eb' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((a, idx) => {
                      const acc = calcAccuracy(a.totalCorrect, a.totalWrong);
                      return (
                        <tr key={a.id} style={{ transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = '#f9fafb'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '14px 20px', fontSize: 13, borderBottom: '1px solid #e5e7eb', color: '#9ca3af' }}>#{a.id.substring(0,6)}</td>
                          <td style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: 2 }}>{a.test?.title}</div>
                            <span style={{ fontSize: 11, background: '#f3f4f6', color: '#4b5563', padding: '2px 6px', borderRadius: 4 }}>{a.test?.examConfig?.displayName}</span>
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: 13, borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
                            {new Date(a.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb' }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: a.score > 0 ? '#16a34a' : '#dc2626' }}>{a.score}</span>
                            <span style={{ fontSize: 12, color: '#9ca3af' }}> /{a.test?.examConfig?.totalMarks}</span>
                          </td>
                          <td style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 60, height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ width: `${acc}%`, height: '100%', background: acc >= 70 ? '#16a34a' : acc < 40 ? '#dc2626' : '#d97706' }} />
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{acc}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: 13, borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} color="#9ca3af" /> {fmtTime(a.timeTaken)}</div>
                          </td>
                          <td style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>
                            <button
                              style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              onClick={(e) => { e.stopPropagation(); setTab('test'); setSelectedId(String(a.id)); }}
                            >
                              Analyze <ArrowRight size={14} />
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
