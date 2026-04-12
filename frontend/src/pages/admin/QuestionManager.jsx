import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, UploadCloud, Trash2 } from 'lucide-react';

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

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  const sectionQs = questions.filter(q => q.sectionId === activeSection);
  const currentSection = test?.examConfig?.sections.find(s => s.id === activeSection);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <button 
            className="btn btn-ghost btn-sm mb-4" 
            onClick={() => navigate('/admin/tests')}
            style={{ paddingLeft: 0, background: 'transparent' }}
          >
            <ArrowLeft size={16} /> Back to Tests
          </button>
          <h1 className="page-title">{test?.title}</h1>
          <p className="text-muted text-sm mt-2">Manage questions by section</p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold">Upload CSV</h3>
          <a href="/sample_questions.csv" download className="btn btn-sm btn-secondary">
            Download Sample CSV
          </a>
        </div>

        <div className="tabs">
          {test?.examConfig?.sections.map(section => (
            <button 
              key={section.id}
              className={`tab-btn ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.subject}
            </button>
          ))}
        </div>

        <div className={`upload-zone ${uploading ? 'opacity-50' : ''}`} onClick={() => fileInputRef.current?.click()}>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{display: 'none'}} 
            accept=".csv"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <div className="text-primary upload-icon"><UploadCloud size={48} /></div>
          <div className="upload-text">
            {uploading ? 'Uploading...' : `Click to upload CSV for ${currentSection?.subject}`}
          </div>
          <div className="upload-hint">Format must match the sample exactly</div>
        </div>

        <div className="alert alert-info mt-6 text-sm">
          <strong>Tip for numeric questions:</strong> Set `questionType` to `NUMERICAL` and provide answer in `correctNumericAnswer` column.
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4">{currentSection?.subject} Questions ({sectionQs.length})</h3>
        
        {sectionQs.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th width="60">No.</th>
                  <th>Type</th>
                  <th>Question Text</th>
                  <th>Answer</th>
                  <th>Marks</th>
                  <th width="80">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sectionQs.map((q, idx) => (
                  <tr key={q.id}>
                    <td>{idx + 1}</td>
                    <td><span className="badge badge-secondary">{q.questionType}</span></td>
                    <td>{q.questionText}</td>
                    <td className="font-bold">
                      {q.questionType === 'MCQ' ? q.correctOption : q.correctNumericAnswer}
                    </td>
                    <td>+{q.marks} / -{q.negativeMarks}</td>
                    <td>
                      <button className="btn btn-sm btn-ghost text-danger" onClick={() => handleDelete(q.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon text-muted">❓</div>
            <div className="empty-title">No questions yet</div>
            <div className="empty-desc">Upload a CSV file to add questions to this section.</div>
          </div>
        )}
      </div>
    </div>
  );
};
