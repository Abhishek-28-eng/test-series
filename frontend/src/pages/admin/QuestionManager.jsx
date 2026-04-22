import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, UploadCloud, Trash2, Download, AlertCircle, HelpCircle } from 'lucide-react';

export const QuestionManager = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    fetchData();
  }, [testId]);

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
    } catch (error) {
      toast.error('Failed to load test details');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!activeSection) {
      toast.error('Please select a section first');
      return;
    }

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
          console.error("CSV Upload row errors:", data.data.errors);
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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.delete(`/questions/${id}`);
      toast.success('Question deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete question');
    }
  };

  if (loading) return (
    <div className="loading-center">
      <div className="spinner" />
    </div>
  );

  const sectionQs = questions.filter(q => q.sectionId === activeSection);
  const currentSection = test?.examConfig?.sections.find(s => s.id === activeSection);

  return (
    <div className="fade-in">
      
      {/* Structural Header */}
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
        
        {/* Upload Segment */}
        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 8, overflow: 'hidden' }}>
          
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#111827' }}>Import Interface</h3>
            <a href="/sample_questions.csv" download style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#374151', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download size={14} /> Template CSV
            </a>
          </div>

          <div style={{ padding: 20 }}>
            {/* Section Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 20, overflowX: 'auto', whiteSpace: 'nowrap' }}>
              {test?.examConfig?.sections.map(section => {
                const isActive = activeSection === section.id;
                return (
                  <button 
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    style={{ 
                      padding: '10px 16px', background: 'none', border: 'none', 
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      color: isActive ? '#f97316' : '#6b7280',
                      borderBottom: isActive ? '2px solid #f97316' : '2px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    {section.subject}
                  </button>
                );
              })}
            </div>

            {/* Upload Area */}
            <div 
              onClick={() => !uploading && fileInputRef.current?.click()}
              style={{ 
                border: '2px dashed #d1d5db', borderRadius: 8, padding: '40px 20px', 
                textAlign: 'center', cursor: uploading ? 'not-allowed' : 'pointer',
                background: '#f9fafb', opacity: uploading ? 0.6 : 1, transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}
              onMouseOver={e => !uploading && (e.currentTarget.style.borderColor = '#f97316')}
              onMouseOut={e => !uploading && (e.currentTarget.style.borderColor = '#d1d5db')}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{display: 'none'}} 
                accept=".csv"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <UploadCloud size={40} style={{ color: '#9ca3af', marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: 4 }}>
                {uploading ? 'Processing file...' : `Click to select CSV for ${currentSection?.subject}`}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Strictly follow the headers in the sample template.</div>
            </div>

            {/* Inline Hint */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, background: '#eff6ff', borderRadius: 6, border: '1px solid #bfdbfe', marginTop: 16 }}>
              <AlertCircle size={16} style={{ color: '#3b82f6', marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 12.5, color: '#1e3a8a', lineHeight: 1.5 }}>
                <strong style={{ fontWeight: 600 }}>Numerical Items:</strong> For subjective questions, verify that the <code>questionType</code> column is marked exactly as <code>NUMERICAL</code> and provide the precise answer inside the <code>correctNumericAnswer</code> column.
              </div>
            </div>
          </div>
        </div>

        {/* Existing Questions Data Table */}
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
                    <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Structure</th>
                    <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', width: '40%' }}>Question Identity</th>
                    <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Solution</th>
                    <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Credits</th>
                    <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sectionQs.map((q, idx) => (
                    <tr key={q.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
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
                        <button 
                          style={{ padding: '6px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
                          onClick={() => handleDelete(q.id)}
                          onMouseOver={e => e.currentTarget.style.background = '#fef2f2'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          title="Purge Question"
                        >
                          <Trash2 size={15} />
                        </button>
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
    </div>
  );
};
