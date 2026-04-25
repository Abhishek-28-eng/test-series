import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, UploadCloud, Trash2, Download, AlertCircle, HelpCircle, Pencil, X, Save } from 'lucide-react';

/* ─── tiny modal overlay helper ─────────────────────────────── */
const Overlay = ({ onClose, children }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16,
    }}
  >
    <div onClick={e => e.stopPropagation()}>{children}</div>
  </div>
);

/* ─── field component ────────────────────────────────────────── */
const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{label}</label>
    {children}
  </div>
);

const inputStyle = {
  padding: '8px 10px', fontSize: 13, border: '1px solid #d1d5db',
  borderRadius: 6, outline: 'none', color: '#111827', background: '#fff',
  width: '100%', boxSizing: 'border-box',
};

const EMPTY_FORM = {
  questionText: '', questionType: 'MCQ', subject: '',
  chapter: '', topic: '', difficulty: 'medium',
  optionA: '', optionB: '', optionC: '', optionD: '',
  correctOption: 'A', correctNumericAnswer: '',
  marks: '', negativeMarks: '', explanation: '',
};

export const QuestionManager = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [test, setTest]               = useState(null);
  const [questions, setQuestions]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [uploading, setUploading]     = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  /* edit modal state */
  const [editQ, setEditQ]     = useState(null);   // question being edited
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);

  useEffect(() => { fetchData(); }, [testId]);

  const fetchData = async () => {
    try {
      const [testRes, qRes] = await Promise.all([
        api.get(`/tests/${testId}`),
        api.get(`/questions/test/${testId}`)
      ]);
      setTest(testRes.data.data);
      setQuestions(qRes.data.data);
      if (testRes.data.data.examConfig?.sections?.length > 0 && !activeSection) {
        setActiveSection(testRes.data.data.examConfig.sections[0].id);
      }
    } catch {
      toast.error('Failed to load test details');
    } finally {
      setLoading(false);
    }
  };

  /* ── open edit modal ───────────────────────────────────────── */
  const openEdit = (q) => {
    setEditQ(q);
    setForm({
      questionText:        q.questionText        || '',
      questionType:        q.questionType        || 'MCQ',
      subject:             q.subject             || '',
      chapter:             q.chapter             || '',
      topic:               q.topic               || '',
      difficulty:          q.difficulty          || 'medium',
      optionA:             q.optionA             || '',
      optionB:             q.optionB             || '',
      optionC:             q.optionC             || '',
      optionD:             q.optionD             || '',
      correctOption:       q.correctOption       || 'A',
      correctNumericAnswer: q.correctNumericAnswer ?? '',
      marks:               q.marks              ?? '',
      negativeMarks:       q.negativeMarks      ?? '',
      explanation:         q.explanation         || '',
    });
  };

  const closeEdit = () => { setEditQ(null); setForm(EMPTY_FORM); };

  const handleFormChange = (key, value) =>
    setForm(prev => ({ ...prev, [key]: value }));

  /* ── save edited question ──────────────────────────────────── */
  const handleSave = async () => {
    if (!form.questionText.trim()) { toast.error('Question text is required'); return; }
    if (form.questionType === 'MCQ' && !['A','B','C','D'].includes(form.correctOption)) {
      toast.error('Select a valid correct option (A–D)'); return;
    }
    if (form.questionType === 'NUMERICAL' && form.correctNumericAnswer === '') {
      toast.error('Correct numeric answer is required'); return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        marks:               parseFloat(form.marks),
        negativeMarks:       parseFloat(form.negativeMarks) || 0,
        correctNumericAnswer: form.questionType === 'NUMERICAL' ? parseFloat(form.correctNumericAnswer) : null,
        correctOption:       form.questionType === 'MCQ' ? form.correctOption : null,
      };
      await api.put(`/questions/${editQ.id}`, payload);
      toast.success('Question updated successfully!');
      closeEdit();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update question');
    } finally {
      setSaving(false);
    }
  };

  /* ── CSV upload ────────────────────────────────────────────── */
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!activeSection) { toast.error('Please select a section first'); return; }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('testId', testId);
    formData.append('sectionId', activeSection);

    setUploading(true);
    try {
      const { data } = await api.post('/questions/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data.success) {
        toast.success(`Successfully uploaded ${data.data.successCount} questions`);
        if (data.data.failedCount > 0) {
          const firstErrorRow = data.data.errors[0];
          const errorMsg = firstErrorRow ? `Row ${firstErrorRow.row}: ${firstErrorRow.errors.join(', ')}` : 'Check format.';
          toast.error(`${data.data.failedCount} rows failed. ${errorMsg}`, { duration: 6000 });
        }
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload CSV');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ── delete ────────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.delete(`/questions/${id}`);
      toast.success('Question deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete question');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const sectionQs      = questions.filter(q => q.sectionId === activeSection);
  const currentSection = test?.examConfig?.sections.find(s => s.id === activeSection);

  return (
    <div className="fade-in">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 24, borderBottom: '1px solid var(--card-border)', paddingBottom: 16 }}>
        <div>
          <button
            onClick={() => navigate('/admin/tests')}
            style={{ padding: 0, background: 'transparent', border: 'none', color: '#6b7280', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 13, marginBottom: 12, fontWeight: 500 }}
          >
            <ArrowLeft size={14} /> Back to Tests
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827', margin: 0 }}>Item Bank: {test?.title}</h1>
            <span style={{ padding: '2px 8px', background: '#e0e7ff', color: '#4f46e5', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{test?.examConfig?.displayName}</span>
          </div>
          <p style={{ fontSize: 13, color: '#4b5563', margin: '4px 0 0 0' }}>Manage questions for each specific section using CSV upload.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 24 }}>

        {/* ── Upload Card ─────────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#111827' }}>Import Interface</h3>
            <a href="/sample_questions.csv" download style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#374151', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download size={14} /> Template CSV
            </a>
          </div>

          <div style={{ padding: 20 }}>
            {/* Section tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 20, overflowX: 'auto', whiteSpace: 'nowrap' }}>
              {test?.examConfig?.sections.map(section => {
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    style={{ padding: '10px 16px', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: isActive ? '#f97316' : '#6b7280', borderBottom: isActive ? '2px solid #f97316' : '2px solid transparent', transition: 'all 0.2s' }}
                  >
                    {section.subject}
                  </button>
                );
              })}
            </div>

            {/* Drop zone */}
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              style={{ border: '2px dashed #d1d5db', borderRadius: 8, padding: '40px 20px', textAlign: 'center', cursor: uploading ? 'not-allowed' : 'pointer', background: '#f9fafb', opacity: uploading ? 0.6 : 1, transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              onMouseOver={e => !uploading && (e.currentTarget.style.borderColor = '#f97316')}
              onMouseOut={e => !uploading && (e.currentTarget.style.borderColor = '#d1d5db')}
            >
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv" onChange={handleFileUpload} disabled={uploading} />
              <UploadCloud size={40} style={{ color: '#9ca3af', marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: 4 }}>
                {uploading ? 'Processing file...' : `Click to select CSV for ${currentSection?.subject}`}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Strictly follow the headers in the sample template.</div>
            </div>

            {/* Hint */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, background: '#eff6ff', borderRadius: 6, border: '1px solid #bfdbfe', marginTop: 16 }}>
              <AlertCircle size={16} style={{ color: '#3b82f6', marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 12.5, color: '#1e3a8a', lineHeight: 1.5 }}>
                <strong style={{ fontWeight: 600 }}>Numerical Items:</strong> For subjective questions, verify that the <code>questionType</code> column is marked exactly as <code>NUMERICAL</code> and provide the precise answer inside the <code>correctNumericAnswer</code> column.
              </div>
            </div>
          </div>
        </div>

        {/* ── Question Table ──────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#111827' }}>
              {currentSection?.subject} Directory <span style={{ color: '#6b7280', fontWeight: 500, fontSize: 13 }}>({sectionQs.length} items)</span>
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {sectionQs.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', width: 50, textAlign: 'center' }}>#</th>
                    <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', width: '40%' }}>Question</th>
                    <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Answer</th>
                    <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Marks</th>
                    <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sectionQs.map((q, idx) => (
                    <tr key={q.id} style={{ borderBottom: '1px solid #f3f4f6' }}
                      onMouseOver={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 6px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#4b5563' }}>
                          {q.questionType}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#111827' }}>
                        <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {q.questionText}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#059669' }}>
                        {q.questionType === 'MCQ' ? `Opt. ${q.correctOption}` : q.correctNumericAnswer}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>+{q.marks}</span> / <span style={{ color: '#ef4444' }}>-{q.negativeMarks}</span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 4 }}>
                          {/* Edit button */}
                          <button
                            onClick={() => openEdit(q)}
                            title="Edit Question"
                            style={{ padding: '6px', background: 'transparent', border: 'none', color: '#4f46e5', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
                            onMouseOver={e => e.currentTarget.style.background = '#eef2ff'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <Pencil size={15} />
                          </button>
                          {/* Delete button */}
                          <button
                            onClick={() => handleDelete(q.id)}
                            title="Delete Question"
                            style={{ padding: '6px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
                            onMouseOver={e => e.currentTarget.style.background = '#fef2f2'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#6b7280' }}>
                <HelpCircle size={32} style={{ margin: '0 auto 12px', color: '#d1d5db' }} />
                <h3 style={{ margin: '0 0 4px 0', fontSize: 15, color: '#111827' }}>Item bank empty</h3>
                <p style={{ margin: 0, fontSize: 13 }}>Please upload the designated CSV payload above.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════ EDIT MODAL ═══════════════════════════ */}
      {editQ && (
        <Overlay onClose={closeEdit}>
          <div style={{
            background: '#fff', borderRadius: 12, width: '100%', maxWidth: 680,
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}>
            {/* Modal header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Edit Question</h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>ID #{editQ.id} · {editQ.subject}</p>
              </div>
              <button onClick={closeEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4, borderRadius: 4, display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Question Text */}
              <Field label="Question Text *">
                <textarea
                  value={form.questionText}
                  onChange={e => handleFormChange('questionText', e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  placeholder="Enter question text..."
                />
              </Field>

              {/* Row: Type | Subject | Difficulty */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <Field label="Type">
                  <select value={form.questionType} onChange={e => handleFormChange('questionType', e.target.value)} style={inputStyle}>
                    <option value="MCQ">MCQ</option>
                    <option value="NUMERICAL">Numerical</option>
                  </select>
                </Field>
                <Field label="Subject">
                  <select value={form.subject} onChange={e => handleFormChange('subject', e.target.value)} style={inputStyle}>
                    {['Physics','Chemistry','Mathematics','Biology'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Difficulty">
                  <select value={form.difficulty} onChange={e => handleFormChange('difficulty', e.target.value)} style={inputStyle}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </Field>
              </div>

              {/* Row: Chapter | Topic */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Chapter">
                  <input value={form.chapter} onChange={e => handleFormChange('chapter', e.target.value)} style={inputStyle} placeholder="e.g. Kinematics" />
                </Field>
                <Field label="Topic">
                  <input value={form.topic} onChange={e => handleFormChange('topic', e.target.value)} style={inputStyle} placeholder="e.g. Projectile Motion" />
                </Field>
              </div>

              {/* MCQ Options */}
              {form.questionType === 'MCQ' && (
                <>
                  <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 14 }}>
                    <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Options</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {['A','B','C','D'].map(opt => (
                        <Field key={opt} label={`Option ${opt}`}>
                          <input
                            value={form[`option${opt}`]}
                            onChange={e => handleFormChange(`option${opt}`, e.target.value)}
                            style={inputStyle}
                            placeholder={`Option ${opt}`}
                          />
                        </Field>
                      ))}
                    </div>
                  </div>
                  <Field label="Correct Option *">
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['A','B','C','D'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => handleFormChange('correctOption', opt)}
                          style={{
                            flex: 1, padding: '8px', border: '2px solid',
                            borderColor: form.correctOption === opt ? '#10b981' : '#d1d5db',
                            borderRadius: 6, background: form.correctOption === opt ? '#d1fae5' : '#fff',
                            color: form.correctOption === opt ? '#065f46' : '#374151',
                            fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s',
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </Field>
                </>
              )}

              {/* Numerical answer */}
              {form.questionType === 'NUMERICAL' && (
                <Field label="Correct Numeric Answer *">
                  <input
                    type="number"
                    value={form.correctNumericAnswer}
                    onChange={e => handleFormChange('correctNumericAnswer', e.target.value)}
                    style={inputStyle}
                    placeholder="e.g. 9.8"
                    step="any"
                  />
                </Field>
              )}

              {/* Row: Marks | Negative Marks */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Marks (+) *">
                  <input type="number" value={form.marks} onChange={e => handleFormChange('marks', e.target.value)} style={inputStyle} placeholder="e.g. 4" step="0.5" min="0" />
                </Field>
                <Field label="Negative Marks (-)">
                  <input type="number" value={form.negativeMarks} onChange={e => handleFormChange('negativeMarks', e.target.value)} style={inputStyle} placeholder="e.g. 1" step="0.25" min="0" />
                </Field>
              </div>

              {/* Explanation */}
              <Field label="Explanation / Solution">
                <textarea
                  value={form.explanation}
                  onChange={e => handleFormChange('explanation', e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  placeholder="Optional: step-by-step solution..."
                />
              </Field>
            </div>

            {/* Modal footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 10, position: 'sticky', bottom: 0, background: '#fff' }}>
              <button
                onClick={closeEdit}
                style={{ padding: '8px 18px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '8px 20px', background: saving ? '#a5b4fc' : '#4f46e5', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.2s' }}
              >
                <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
};
