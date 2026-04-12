import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Clock, Info, ChevronRight, Bookmark, XCircle } from 'lucide-react';

export const ExamInterface = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt]           = useState(null);
  const [sections, setSections]         = useState([]);
  const [questions, setQuestions]       = useState([]);
  const [answers, setAnswers]           = useState({});   // { [questionId]: answerObj }
  const [selected, setSelected]         = useState({});   // local UI selection { [questionId]: 'A'|'B'|'C'|'D'|number }
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading]           = useState(true);

  const [activeSectionId, setActiveSectionId]     = useState(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);

  const timerRef  = useRef(null);
  const attemptRef = useRef(null); // keep a stable ref to avoid stale closure

  useEffect(() => {
    initAttempt();
    return () => clearInterval(timerRef.current);
  }, [testId]);

  /* ── Init ─────────────────────────────────────────────── */
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

      // Time remaining
      const elapsedSec  = Math.floor((Date.now() - new Date(att.startTime).getTime()) / 1000);
      const totalSec    = (testData?.examConfig?.duration || 180) * 60;
      const initialTime = Math.max(0, totalSec - elapsedSec);
      setTimeRemaining(initialTime);

      // Load questions
      const qRes = await api.get(`/questions/test/${testId}`);
      const fetchedQs = qRes.data.data || [];
      
      if (fetchedQs.length === 0) {
        toast.error('This test has no questions yet. Please contact your admin.');
        navigate('/dashboard');
        return;
      }
      
      setQuestions(fetchedQs);

      // Set first section
      if (secs.length > 0) {
        setActiveSectionId(secs[0].id);
      } else if (fetchedQs.length > 0) {
        setActiveSectionId(parseInt(fetchedQs[0].sectionId));
      }

      // Map existing answers and pre-fill local selection
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

  /* ── Timer ────────────────────────────────────────────── */
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

  /* ── Save answer to backend ───────────────────────────── */
  const handleSaveAnswer = async (questionId, status, payload = {}) => {
    const att = attemptRef.current;
    if (!att) return;
    try {
      const { data } = await api.post('/attempts/save-answer', {
        attemptId: att.id,
        questionId,
        status,
        ...payload,
      });
      if (data.success) {
        // backend returns { data: answerObj }
        setAnswers(prev => ({ ...prev, [questionId]: data.data }));
      }
    } catch (error) {
      console.error('Save answer error:', error);
      toast.error('Failed to save answer');
    }
  };

  /* ── Derived data ─────────────────────────────────────── */
  const currentSectionQuestions = questions.filter(q => {
    return parseInt(q.sectionId ?? q.section?.id) === parseInt(activeSectionId);
  });
  const currentQuestion = currentSectionQuestions[activeQuestionIndex] || null;

  /* ── Actions ──────────────────────────────────────────── */
  // User merely SELECTS an option — no network call yet
  const onSelectOption = (opt) => {
    if (!currentQuestion) return;
    setSelected(prev => ({ ...prev, [currentQuestion.id]: opt }));
  };

  // Save & Next
  const onSaveAndNext = async () => {
    if (!currentQuestion) return;
    const sel = selected[currentQuestion.id];
    const isNumerical = currentQuestion.questionType === 'NUMERICAL';

    const hasAns = isNumerical
      ? (sel !== undefined && sel !== '' && sel !== null)
      : !!sel;

    await handleSaveAnswer(currentQuestion.id, hasAns ? 'ANSWERED' : 'NOT_ANSWERED', {
      selectedOption: !isNumerical ? (sel || null) : null,
      numericAnswer:  isNumerical  ? (parseFloat(sel) || null) : null,
    });
    goNext();
  };

  // Mark for Review & Next
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

  // Clear Response
  const onClearResponse = async () => {
    if (!currentQuestion) return;
    setSelected(prev => { const n = { ...prev }; delete n[currentQuestion.id]; return n; });
    await handleSaveAnswer(currentQuestion.id, 'NOT_ANSWERED', {
      selectedOption: null,
      numericAnswer: null,
    });
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

  /* ── Helpers ──────────────────────────────────────────── */
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
    <div className="flex flex-col min-h-screen bg-bg">
      {/* ── Header ── */}
      <header className="navbar" style={{ position: 'sticky', background: '#fff', borderBottom: '1px solid var(--card-border)', zIndex: 50, padding: '0 16px' }}>
        <div className="navbar-brand" style={{ maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '15px' }}>
          {attempt?.test?.title || 'Exam'}
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className={`timer-box ${timeRemaining < 300 ? 'danger' : timeRemaining < 600 ? 'warning' : ''}`} style={{ padding: '8px 12px' }}>
            <Clock size={16} />
            <span className="timer-value" style={{ fontSize: '16px' }}>{formatTime(timeRemaining)}</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowSubmitConfirm(true)}>Submit</button>
          <button className="mobile-menu-btn" onClick={() => setShowMobilePalette(v => !v)} style={{ background: 'var(--bg-3)', borderRadius: '6px' }}>
            <Info size={18} />
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <div className="page" style={{ paddingTop: '20px' }}>

        {/* Section Tabs */}
        <div className="tabs mb-4">
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

        <div className="exam-layout">
          {/* ── Question Panel ── */}
          <div className="question-panel flex flex-col">

            <div className="question-header">
              <span className="question-number">
                Question {activeQuestionIndex + 1} of {currentSectionQuestions.length}
              </span>
              <div className="flex gap-2">
                <span className="badge badge-success">+{currentQuestion?.marks ?? 0}</span>
                <span className="badge badge-danger">-{currentQuestion?.negativeMarks ?? 0}</span>
              </div>
            </div>

            <div className="flex-1">
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
                            style={{ cursor: 'pointer' }}
                          >
                            <span className="option-label">{opt}</span>
                            <span>{optText}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="form-group" style={{ maxWidth: '320px' }}>
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

            <div className="separator mt-8"></div>

            {/* Action buttons */}
            {currentQuestion && (
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-secondary" onClick={onMarkForReview}>
                    <Bookmark size={15} /> Mark for Review &amp; Next
                  </button>
                  <button className="btn btn-ghost" onClick={onClearResponse}>
                    <XCircle size={15} /> Clear
                  </button>
                </div>
                <button className="btn btn-primary" onClick={onSaveAndNext}>
                  Save &amp; Next <ChevronRight size={17} />
                </button>
              </div>
            )}
          </div>

          {/* ── Palette ── */}
          <div className={`palette-panel ${showMobilePalette ? 'mobile-show' : ''}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="palette-title mb-0">Question Palette</h3>
              <button className="mobile-menu-btn" onClick={() => setShowMobilePalette(false)}>&times;</button>
            </div>

            <div className="palette-legend">
              <div className="palette-legend-item"><div className="palette-dot" style={{ background: 'var(--success)' }}></div> Answered</div>
              <div className="palette-legend-item"><div className="palette-dot" style={{ background: 'var(--danger)' }}></div> Not Answered</div>
              <div className="palette-legend-item"><div className="palette-dot" style={{ background: 'var(--accent)' }}></div> Review</div>
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

            <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--card-border)' }}>
              <div className="text-xs text-muted font-bold uppercase mb-2">Stats</div>
              <div className="grid-2" style={{ gap: '8px' }}>
                <div className="text-sm">Answered: {currentSectionQuestions.filter(q => answers[q.id]?.status === 'ANSWERED').length}</div>
                <div className="text-sm">Skipped: {currentSectionQuestions.filter(q => answers[q.id]?.status === 'NOT_ANSWERED').length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Submit Confirm Modal ── */}
      {showSubmitConfirm && (
        <div className="modal-overlay" onClick={() => setShowSubmitConfirm(false)}>
          <div className="modal" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="empty-icon mb-2">⚠️</div>
            <h3 className="mb-2">Submit Exam?</h3>
            <p className="text-muted text-sm mb-6">Are you sure? You cannot change answers after submission.</p>
            <div className="flex gap-3 w-full">
              <button className="btn btn-ghost flex-1 justify-center" onClick={() => setShowSubmitConfirm(false)}>Cancel</button>
              <button className="btn btn-primary flex-1 justify-center" onClick={forceSubmit}>Yes, Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
