import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

export const Result = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [id]);

  const fetchResult = async () => {
    try {
      const { data } = await api.get(`/attempts/${id}/result`);
      if (data.success) {
        setResult(data.data);
      }
    } catch (error) {
      toast.error('Failed to load result');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  const { attempt, summary } = result;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <button 
            className="btn btn-ghost btn-sm mb-4" 
            onClick={() => navigate('/dashboard')}
            style={{ paddingLeft: 0, background: 'transparent' }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h1 className="page-title">Test Result</h1>
          <p className="text-muted text-sm mt-2">{attempt.test?.title}</p>
        </div>
      </div>

      <div className="result-score-card text-white mb-6" style={{maxWidth: '400px'}}>
        <div className="score-total uppercase tracking-widest text-xs font-bold opacity-80 mb-2">Total Score</div>
        <div className="flex items-end gap-2 text-left">
          <div className="score-big" style={{fontSize: '48px', lineHeight: 1}}>{summary.score}</div>
          <div className="text-xl font-bold opacity-80 mb-1">/ {summary.totalMarks}</div>
        </div>
      </div>

      <div className="grid-4 mb-6 text-center">
        <div className="card">
          <div className="text-muted text-sm font-bold uppercase mb-2">Accuracy</div>
          <div className="page-title">{summary.accuracy}%</div>
        </div>
        <div className="card">
          <div className="text-success text-sm font-bold uppercase mb-2">Correct</div>
          <div className="page-title text-success">{attempt.totalCorrect}</div>
        </div>
        <div className="card">
          <div className="text-danger text-sm font-bold uppercase mb-2">Incorrect</div>
          <div className="page-title text-danger">{attempt.totalWrong}</div>
        </div>
        <div className="card">
          <div className="text-muted text-sm font-bold uppercase mb-2">Skipped</div>
          <div className="page-title">{attempt.totalSkipped}</div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4">Question Analysis</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Q No.</th>
                <th>Subject</th>
                <th>Your Answer</th>
                <th>Correct Answer</th>
                <th>Marks Obtained</th>
              </tr>
            </thead>
            <tbody>
              {attempt.answers.map((ans, idx) => (
                <tr key={ans.id} style={{ background: ans.isCorrect ? 'rgba(34,197,94,0.05)' : ans.isCorrect === false ? 'rgba(239,68,68,0.05)' : 'transparent' }}>
                  <td className="font-bold">{idx + 1}</td>
                  <td><span className="badge badge-secondary">{ans.question?.section?.subject}</span></td>
                  <td className="font-bold">
                    {!ans.selectedOption && ans.numericAnswer === null 
                      ? <span className="text-muted italic">Skipped</span>
                      : ans.selectedOption || ans.numericAnswer}
                  </td>
                  <td className="font-bold">
                    {ans.question?.questionType === 'MCQ' ? ans.question?.correctOption : ans.question?.correctNumericAnswer}
                  </td>
                  <td>
                    <span className={`font-bold ${ans.marksObtained > 0 ? 'text-success' : ans.marksObtained < 0 ? 'text-danger' : 'text-muted'}`}>
                      {ans.marksObtained > 0 ? '+' : ''}{ans.marksObtained}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
