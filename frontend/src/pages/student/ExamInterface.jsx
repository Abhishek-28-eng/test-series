import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Clock, Info, ChevronRight, Bookmark, XCircle, AlertTriangle } from 'lucide-react';
import { useAntiCheat } from './useAntiCheat';

export const ExamInterface = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt]           = useState(null);
  const [sections, setSections]         = useState([]);
  const [questions, setQuestions]       = useState([]);
  const [answers, setAnswers]           = useState({});
  const [selected, setSelected]         = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading]           = useState(true);

  const [activeSectionId, setActiveSectionId]         = useState(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm]     = useState(false);
  const [showMobilePalette, setShowMobilePalette]     = useState(false);

  const timerRef     = useRef(null);
  const attemptRef   = useRef(null);
  const selectedRef  = useRef(selected);
  const answersRef   = useRef(answers);
  const questionsRef = useRef(questions);

  useEffect(() => { selectedRef.current  = selected;  }, [selected]);
  useEffect(() => { answersRef.current   = answers;   }, [answers]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  /* ── Anti-cheat ── */
  const { violations, maxViolations, warningVisible, warningMsg, dismissWarning } = useAntiCheat(
    () => forceSubmitRef.current?.(),
    !loading
  );
  const forceSubmitRef = useRef(null);

  useEffect(() => {
    initAttempt();
    return () => clearInterval(timerRef.current);
  }, [testId]);

  /* ── Init ── */
  const initAttempt = async () => {
    try {
      const res = await api.post('/attempts/start', { testId: parseInt(testId) });
      if (!res.data.success) {
        toast.error(res.data.message || 'Could not load test');
        navigate('/dashboard');
        return;
      }

      const { attempt: att, test: testData, answers: attAnswers } = res.data.data;
      setAttempt(att);
      attemptRef.current = att;

      const secs = testData?.examConfig?.sections || [];
      setSections(secs);

      const elapsedSec  = Math.floor((Date.now() - new Date(att.startTime).getTime()) / 1000);
      const totalSec    = (testData?.examConfig?.duration || 180) * 60;
      const initialTime = Math.max(0, totalSec - elapsedSec);
      setTimeRemaining(initialTime);

      const qRes = await api.get(`/questions/test/${testId}`);
      const fetchedQs = qRes.data.data || [];

      if (fetchedQs.length === 0) {
        toast.error('This test has no questions yet. Please contact your admin.');
        navigate('/dashboard');
        return;
      }

      setQuestions(fetchedQs);

      if (secs.length > 0) {
        setActiveSectionId(secs[0].id);
      } else if (fetchedQs.length > 0) {
        setActiveSectionId(parseInt(fetchedQs[0].sectionId));
      }

      const ansMap = {};
      const selMap = {};
      attAnswers.forEach(a => {
        ansMap[a.questionId] = a;
        if (a.selectedOption) selMap[a.questionId] = a.selectedOption;
        if (a.numericAnswer !== null && a.numericAnswer !== undefined) selMap[a.questionId] = a.numericAnswer;
      });
      setAnswers(ansMap);
      setSelected(selMap);

      startTimer(initialTime);
    } catch (error) {
      console.error('Init error:', error);
      toast.error(error.response?.data?.message || 'Failed to initialize exam');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  /* ── Timer ── */
  const startTimer = (initialTime) => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAutoSubmit = async () => {
    toast('Time is up! Auto-submitting...', { icon: '⏳' });
    await forceSubmit();
  };

  /* ── Auto-Save every 30s ── */
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(async () => {
      const currentSelected = selectedRef.current;
      const currentAnswers  = answersRef.current;
      const currentQs       = questionsRef.current;
      const promises = [];
      let savedCount = 0;

      Object.keys(currentSelected).forEach(qId => {
        const val = currentSelected[qId];
        if (val === undefined || val === null || val === '') return;
        const ans = currentAnswers[qId];
        const q   = currentQs.find(qu => parseInt(qu.id) === parseInt(qId));
        if (!q) return;
        const isNumerical = q.questionType === 'NUMERICAL';
        let isDirty = false;
        if (!ans) isDirty = true;
        else if (isNumerical  ? ans.numericAnswer !== parseFloat(val) : ans.selectedOption !== val) isDirty = true;
        if (isDirty) {
          const payload = {
            selectedOption: !isNumerical ? val : null,
            numericAnswer:  isNumerical  ? parseFloat(val) : null,
          };
          const status = (ans && ans.status !== 'NOT_VISITED' && ans.status !== 'NOT_ANSWERED') ? ans.status : 'ANSWERED';
          promises.push(handleSaveAnswer(qId, status, payload, true));
          savedCount++;
        }
      });

      if (promises.length > 0) {
        await Promise.all(promises);
        toast.success(`Auto-saved ${savedCount} answer(s)`, { id: 'autosave', position: 'bottom-right', duration: 2000 });
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loading]);

  /* ── Save answer ── */
  const handleSaveAnswer = async (questionId, status, payload = {}, isSilent = false) => {
    const att = attemptRef.current;
    if (!att) return;
    try {
      const { data } = await api.post('/attempts/save-answer', { attemptId: att.id, questionId, status, ...payload });
      if (data.success) setAnswers(prev => ({ ...prev, [questionId]: data.data }));
    } catch (error) {
      if (!isSilent) toast.error('Failed to save answer');
    }
  };

  /* ── Derived data ── */
  const currentSectionQuestions = questions.filter(q =>
    parseInt(q.sectionId ?? q.section?.id) === parseInt(activeSectionId)
  );
  const currentQuestion = currentSectionQuestions[activeQuestionIndex] || null;

  /* ── Actions ── */
  const onSelectOption = (opt) => {
    if (!currentQuestion) return;
    setSelected(prev => ({ ...prev, [currentQuestion.id]: opt }));
  };

  const onSaveAndNext = async () => {
    if (!currentQuestion) return;
    const sel = selected[currentQuestion.id];
    const isNumerical = currentQuestion.questionType === 'NUMERICAL';
    const hasAns = isNumerical ? (sel !== undefined && sel !== '' && sel !== null) : !!sel;
    await handleSaveAnswer(currentQuestion.id, hasAns ? 'ANSWERED' : 'NOT_ANSWERED', {
      selectedOption: !isNumerical ? (sel || null) : null,
      numericAnswer:  isNumerical  ? (parseFloat(sel) || null) : null,
    });
    goNext();
  };

  const onMarkForReview = async () => {
    if (!currentQuestion) return;
    const sel = selected[currentQuestion.id];
    const isNumerical = currentQuestion.questionType === 'NUMERICAL';
    await handleSaveAnswer(currentQuestion.id, 'MARKED_REVIEW', {
      selectedOption: !isNumerical ? (sel || null) : null,
      numericAnswer:  isNumerical  ? (parseFloat(sel) || null) : null,
    });
    goNext();
  };

  const onClearResponse = async () => {
    if (!currentQuestion) return;
    setSelected(prev => { const n = { ...prev }; delete n[currentQuestion.id]; return n; });
    await handleSaveAnswer(currentQuestion.id, 'NOT_ANSWERED', { selectedOption: null, numericAnswer: null });
  };

  const goNext = () => {
    if (activeQuestionIndex < currentSectionQuestions.length - 1) {
      setActiveQuestionIndex(prev => prev + 1);
    } else {
      const secIdx = sections.findIndex(s => parseInt(s.id) === parseInt(activeSectionId));
      if (secIdx < sections.length - 1) {
        setActiveSectionId(sections[secIdx + 1].id);
        setActiveQuestionIndex(0);
      } else {
        toast('This is the last question.');
      }
    }
  };

  const forceSubmit = async () => {
    clearInterval(timerRef.current);
    const att = attemptRef.current;
    if (!att) return;
    try {
      const { data } = await api.post('/attempts/submit', { attemptId: att.id });
      if (data.success) {
        toast.success('Test submitted successfully!');
        navigate(`/result/${att.id}`);
      }
    } catch (error) {
      toast.error('Failed to submit test');
    }
  };
  forceSubmitRef.current = forceSubmit;

  /* ── Helpers ── */
  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const getPaletteClass = (qId) => {
    const ans = answers[qId];
    if (!ans || ans.status === 'NOT_VISITED') return 'not-visited';
    if (ans.status === 'ANSWERED' || ans.status === 'ANSWERED_MARKED_REVIEW') return 'answered';
    if (ans.status === 'MARKED_REVIEW') return 'marked-review';
    return 'not-answered';
  };

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  return (
    /* Exam is a standalone full-screen page — NO MainLayout, NO bottom nav */
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Exam Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: '#fff', borderBottom: '1px solid var(--card-border)',
        padding: '0 16px', height: 58,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexShrink: 0,
      }}>
        <div style={{
          fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15,
          color: 'var(--navy)', maxWidth: '45%',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {attempt?.test?.title || 'Exam'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {violations > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', background: '#fef2f2',
              border: '1px solid #fecaca', borderRadius: 6,
              fontSize: 12, fontWeight: 700, color: '#dc2626',
            }}>
              <AlertTriangle size={12} />
              {violations}/{maxViolations}
            </div>
          )}

          <div className={`timer-box ${timeRemaining < 300 ? 'danger' : timeRemaining < 600 ? 'warning' : ''}`}
            style={{ padding: '6px 10px' }}>
            <Clock size={15} />
            <span className="timer-value" style={{ fontSize: 15 }}>{formatTime(timeRemaining)}</span>
          </div>

          <button className="btn btn-primary btn-sm" onClick={() => setShowSubmitConfirm(true)}>
            Submit
          </button>

          {/* Mobile palette toggle — only visible on small screens */}
          <button
            onClick={() => setShowMobilePalette(v => !v)}
            style={{
              display: 'none', // shown via CSS media query class below
              background: 'var(--bg-3)', border: 'none', borderRadius: 6,
              padding: 8, cursor: 'pointer', color: 'var(--text-2)',
            }}
            className="exam-palette-toggle"
          >
            <Info size={18} />
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, padding: '16px 20px 24px', maxWidth: 1380, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* Section Tabs */}
        {sections.length > 1 && (
          <div className="tabs" style={{ marginBottom: 16 }}>
            {sections.map(sec => (
              <button
                key={sec.id}
                className={`tab-btn ${parseInt(activeSectionId) === parseInt(sec.id) ? 'active' : ''}`}
                onClick={() => { setActiveSectionId(sec.id); setActiveQuestionIndex(0); }}
              >
                {sec.subject}
              </button>
            ))}
          </div>
        )}

        {/* Exam Layout */}
        <div className="exam-layout">

          {/* ── Question Panel ── */}
          <div className="question-panel" style={{ display: 'flex', flexDirection: 'column' }}>

            <div className="question-header">
              <span className="question-number">
                Question {activeQuestionIndex + 1} of {currentSectionQuestions.length}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="badge badge-success">+{currentQuestion?.marks ?? 0}</span>
                <span className="badge badge-danger">-{currentQuestion?.negativeMarks ?? 0}</span>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              {currentQuestion ? (
                <>
                  <div className="question-text">{currentQuestion.questionText}</div>

                  {currentQuestion.questionType === 'MCQ' ? (
                    <div className="options-list">
                      {['A', 'B', 'C', 'D'].map(opt => {
                        const optText = currentQuestion[`option${opt}`];
                        if (!optText) return null;
                        const isSelected = selected[currentQuestion.id] === opt;
                        return (
                          <div
                            key={opt}
                            className={`option-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => onSelectOption(opt)}
                          >
                            <span className="option-label">{opt}</span>
                            <span>{optText}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="form-group" style={{ maxWidth: 320 }}>
                      <label className="form-label">Enter Numerical Answer</label>
                      <input
                        type="number"
                        step="any"
                        className="form-input"
                        placeholder="Type your answer here"
                        value={selected[currentQuestion.id] ?? ''}
                        onChange={e => setSelected(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted text-center py-12">No questions in this section.</div>
              )}
            </div>

            <div className="separator" style={{ margin: '20px 0 0' }}></div>

            {/* Action buttons */}
            {currentQuestion && (
              <div className="exam-action-bar">
                <div className="exam-action-left">
                  <button className="btn btn-secondary btn-sm" onClick={onMarkForReview}>
                    <Bookmark size={14} /> <span className="exam-btn-label">Mark &amp; Next</span>
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={onClearResponse}>
                    <XCircle size={14} /> Clear
                  </button>
                </div>
                <button className="btn btn-primary" onClick={onSaveAndNext}>
                  Save &amp; Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* ── Question Palette ── */}
          <div className={`palette-panel ${showMobilePalette ? 'mobile-show' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 className="palette-title" style={{ margin: 0 }}>Question Palette</h3>
              <button
                onClick={() => setShowMobilePalette(false)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-2)', lineHeight: 1, padding: '0 4px' }}
              >&times;</button>
            </div>

            <div className="palette-legend">
              <div className="palette-legend-item"><div className="palette-dot" style={{ background: 'var(--success)' }}></div> Answered</div>
              <div className="palette-legend-item"><div className="palette-dot" style={{ background: 'var(--danger)' }}></div> Not Answered</div>
              <div className="palette-legend-item"><div className="palette-dot" style={{ background: 'var(--warning)' }}></div> Review</div>
              <div className="palette-legend-item"><div className="palette-dot" style={{ background: 'var(--bg-3)' }}></div> Not Visited</div>
            </div>

            <div className="palette-grid">
              {currentSectionQuestions.map((q, idx) => (
                <button
                  key={q.id}
                  className={`palette-btn ${getPaletteClass(q.id)} ${activeQuestionIndex === idx ? 'active' : ''}`}
                  onClick={() => { setActiveQuestionIndex(idx); setShowMobilePalette(false); }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 10 }}>
                Section Stats
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: 'var(--success-bg)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--success)' }}>
                    {currentSectionQuestions.filter(q => answers[q.id]?.status === 'ANSWERED').length}
                  </div>
                  <div style={{ color: 'var(--success)', fontWeight: 600 }}>Answered</div>
                </div>
                <div style={{ background: 'var(--danger-bg)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--danger)' }}>
                    {currentSectionQuestions.filter(q => !answers[q.id] || answers[q.id]?.status === 'NOT_VISITED').length}
                  </div>
                  <div style={{ color: 'var(--danger)', fontWeight: 600 }}>Remaining</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile palette backdrop */}
      {showMobilePalette && (
        <div
          onClick={() => setShowMobilePalette(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            zIndex: 299, backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── Submit Confirm Modal — centered, NOT bottom sheet ── */}
      {showSubmitConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(13,30,61,0.65)',
            backdropFilter: 'blur(6px)', zIndex: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
          onClick={() => setShowSubmitConfirm(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 20, padding: '32px 28px',
              maxWidth: 400, width: '100%', textAlign: 'center',
              boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
              animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ margin: '0 0 10px', fontSize: 20, fontFamily: "'Poppins', sans-serif" }}>Submit Exam?</h3>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
              Are you sure you want to submit? You cannot change answers after submission.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-ghost flex-1 justify-center" style={{ flex: 1 }} onClick={() => setShowSubmitConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-primary flex-1 justify-center" style={{ flex: 1 }} onClick={forceSubmit}>
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Anti-Cheat Warning Overlay ── */}
      {warningVisible && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, maxWidth: 420, width: '100%',
            textAlign: 'center', padding: '36px 28px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
            }}>
              <AlertTriangle size={30} style={{ color: '#dc2626' }} />
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 800, color: '#111827', fontFamily: "'Poppins', sans-serif" }}>
              Integrity Violation
            </h2>
            <p style={{ margin: '0 0 8px', fontSize: 14, color: '#4b5563', lineHeight: 1.6 }}>{warningMsg}</p>
            <p style={{ margin: '0 0 24px', fontSize: 13, fontWeight: 700, color: '#dc2626' }}>
              Warning {violations}/{maxViolations} — {maxViolations - violations} more will auto-submit your exam.
            </p>
            <button
              onClick={dismissWarning}
              style={{
                width: '100%', padding: '12px', background: '#dc2626',
                border: 'none', borderRadius: 10, fontSize: 14,
                fontWeight: 700, color: '#fff', cursor: 'pointer',
              }}
            >
              I Understand — Return to Exam
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
