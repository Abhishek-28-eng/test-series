import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, Phone, Clock, FileText } from 'lucide-react';

const fmtTime = (secs) => {
  if (!secs) return '—';
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
};

const calcAcc = (c, w) => c + w > 0 ? Math.round((c / (c + w)) * 100) : 0;

export const AdminStudentDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  const [student, setStudent]           = useState(null);
  const [attempts, setAttempts]         = useState([]);
  const [selectedId, setSelectedId]     = useState('');
  const [detail, setDetail]             = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading]           = useState(true);

  useEffect(() => { fetchData(); }, [studentId]);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/students/${studentId}/attempts`);
      if (res.data.success) {
        // student info is available from the first attempt or attempts list
        const all = res.data.data || [];
        const submitted = all.filter(a => a.status === 'submitted' || a.status === 'auto_submitted');
        setAttempts(submitted);
        if (submitted.length) setSelectedId(String(submitted[0].id));
        // Pull basic student info from admin students list
        const sRes = await api.get(`/admin/students`);
        if (sRes.data.success) {
          const found = sRes.data.data.find(s => String(s.id) === String(studentId));
          setStudent(found || null);
        }
      } else {
        toast.error(res.data.message || 'Failed to load attempts');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load student data');
      console.error(err);
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
        toast.error('Failed to load answer sheet');
      } finally {
        setDetailLoading(false);
      }
    };
    load();
  }, [selectedId]);

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  // Subject breakdown from selected attempt's answers
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
  const isMobile = viewportWidth <= 768;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/admin/students')}
            style={{ paddingLeft: 0, background: 'transparent', marginBottom: '8px' }}
          >
            <ArrowLeft size={16} /> Back to Students
          </button>
          <h1 className="page-title">Student Answer Sheet</h1>
          <p className="text-muted text-sm mt-2">View detailed answer sheet for any completed test</p>
        </div>
      </div>

      {/* Student Info */}
      {student && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: '20px', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', fontWeight: '800', color: '#fff', flexShrink: 0,
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              {student.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{student.name}</h2>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {student.email && (
                  <span className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={12} /> {student.email}
                  </span>
                )}
                <span className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={12} /> {student.mobile}
                </span>
                {student.classYear && <span className="badge badge-secondary">{student.classYear}</span>}
              </div>
            </div>
            <div style={{ alignSelf: isMobile ? 'flex-start' : 'auto' }}>
              <span className="text-muted text-sm">Tests Completed: </span>
              <span className="font-bold">{attempts.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* No attempts */}
      {attempts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><FileText size={48} /></div>
          <h3 className="empty-title">No Tests Completed</h3>
          <p className="empty-desc">This student has not submitted any tests yet.</p>
        </div>
      ) : (
        <>
          {/* Test Selector */}
          <div className="card" style={{ marginBottom: '20px', padding: '18px 24px' }}>
            <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', gap: '16px', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
              <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Select Test</label>
              <select
                className="form-select"
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                style={{ flex: 1, minWidth: isMobile ? '100%' : '220px' }}
              >
                {attempts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.test?.title} — {new Date(a.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {detailLoading && <div className="loading-center"><div className="spinner"></div></div>}

          {!detailLoading && detail && (() => {
            const { attempt, summary } = detail;
            const testAcc = calcAcc(attempt.totalCorrect, attempt.totalWrong);

            return (
              <>
                {/* Score cards */}
                <div className="grid-4" style={{ marginBottom: '20px' }}>
                  <div className="card" style={{ textAlign: 'center' }}>
                    <div className="text-muted text-sm font-bold" style={{ marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score</div>
                    <div className="page-title text-primary">
                      {summary.score}<span className="text-muted" style={{ fontSize: '16px' }}> /{summary.totalMarks}</span>
                    </div>
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

                {/* Subject breakdown */}
                {Object.keys(testSubjects).length > 0 && (
                  <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>
                      Subject Summary — {attempt.test?.title}
                    </h3>
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
                            const acc = calcAcc(s.correct, s.wrong);
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

                {/* Full answer sheet */}
                <div className="card">
                  <div className="flex-between" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>Full Answer Sheet</h3>
                    <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                      <span className="text-muted text-sm">
                        <Clock size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                        {fmtTime(summary.timeTaken)}
                      </span>
                      <span className="badge badge-secondary">{attempt.answers.length} Questions</span>
                    </div>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Q No.</th>
                          <th>Subject</th>
                          <th>Type</th>
                          <th>Student's Answer</th>
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
      )}
    </div>
  );
};
