import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Target, Trophy, Clock, SearchX, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const Result = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

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

  if (loading) return (
    <div style={{ padding: '100px 0', textAlign: 'center', color: '#6b7280' }}>
      Loading analysis details...
    </div>
  );

  const { attempt, summary } = result;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
        <button 
          onClick={() => navigate('/progress')}
          style={{ background: 'none', border: 'none', padding: 0, color: '#3b82f6', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16 }}
        >
          <ArrowLeft size={14} /> Back to Reports
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#4b5563', background: '#f3f4f6', padding: '4px 8px', borderRadius: 4, marginBottom: 8, textTransform: 'uppercase' }}>
              {attempt.test?.examConfig?.displayName || attempt.test?.examConfig?.name || 'MOCK EXAM'}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: '#111827', margin: '0 0 4px 0' }}>{attempt.test?.title}</h1>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Evaluated on {new Date(attempt.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 32 }}>
        
        {/* Main Score Card */}
        <div style={{ flex: '1 1 300px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '32px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 8 }}>Total Score Achieved</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 48, fontWeight: 700, color: '#0d1e3d', lineHeight: 1 }}>
              {summary.score}
            </span>
            <span style={{ fontSize: 20, fontWeight: 600, color: '#9ca3af' }}>
              / {summary.totalMarks}
            </span>
          </div>
        </div>

        {/* Breakdown Grid */}
        <div style={{ flex: '2 1 500px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          {[
            { label: 'Accuracy', val: `${summary.accuracy}%`, color: '#0d1e3d', icon: <Target size={20} color="#6b7280" /> },
            { label: 'Valid', val: attempt.totalCorrect, color: '#16a34a', icon: <CheckCircle size={20} color="#16a34a" /> },
            { label: 'Invalid', val: attempt.totalWrong, color: '#dc2626', icon: <XCircle size={20} color="#dc2626" /> },
            { label: 'Omitted', val: attempt.totalSkipped, color: '#4b5563', icon: <SearchX size={20} color="#9ca3af" /> },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ marginBottom: 12 }}>
                {stat.icon}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>
                {stat.val}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Item Analysis Table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>Item Analysis</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#fff' }}>
              <tr>
                <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Q No.</th>
                <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Subject</th>
                <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Your Input</th>
                <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Correct Answer</th>
                <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Verification</th>
                <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Marks</th>
              </tr>
            </thead>
            <tbody>
              {attempt.answers.map((ans, idx) => {
                const skipped = !ans.selectedOption && ans.numericAnswer === null;
                const isExpanded = expandedRow === ans.id;
                
                return (
                  <React.Fragment key={ans.id}>
                    <tr onClick={() => setExpandedRow(isExpanded ? null : ans.id)} style={{ transition: 'background 0.2s', cursor: 'pointer', background: isExpanded ? '#f9fafb' : 'transparent' }} onMouseOver={e => !isExpanded && (e.currentTarget.style.background = '#f9fafb')} onMouseOut={e => !isExpanded && (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '14px 24px', fontSize: 13, borderBottom: isExpanded ? 'none' : '1px solid #e5e7eb', color: '#4b5563' }}>{idx + 1}</td>
                      <td style={{ padding: '14px 24px', fontSize: 13, borderBottom: isExpanded ? 'none' : '1px solid #e5e7eb', color: '#111827' }}>
                        <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>{ans.question?.section?.subject || 'N/A'}</span>
                      </td>
                      <td style={{ padding: '14px 24px', fontSize: 13, borderBottom: isExpanded ? 'none' : '1px solid #e5e7eb' }}>
                        {skipped 
                          ? <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Skipped</span> 
                          : <span style={{ fontWeight: 500, color: '#111827' }}>{ans.selectedOption || ans.numericAnswer}</span>}
                      </td>
                      <td style={{ padding: '14px 24px', fontSize: 13, borderBottom: isExpanded ? 'none' : '1px solid #e5e7eb', color: '#16a34a', fontWeight: 500 }}>
                        {ans.question?.questionType === 'MCQ' ? ans.question?.correctOption : ans.question?.correctNumericAnswer}
                      </td>
                      <td style={{ padding: '14px 24px', borderBottom: isExpanded ? 'none' : '1px solid #e5e7eb' }}>
                        {skipped 
                          ? <span style={{ color: '#6b7280', background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Omitted</span> 
                          : ans.isCorrect 
                          ? <span style={{ color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Valid</span> 
                          : <span style={{ color: '#b91c1c', background: '#fef2f2', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Invalid</span>}
                      </td>
                      <td style={{ padding: '14px 24px', borderBottom: isExpanded ? 'none' : '1px solid #e5e7eb' }}>
                        <span style={{ 
                          fontSize: 13, fontWeight: 600,
                          color: ans.marksObtained > 0 ? '#16a34a' : ans.marksObtained < 0 ? '#dc2626' : '#9ca3af' 
                        }}>
                          {ans.marksObtained > 0 ? '+' : ''}{ans.marksObtained}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ background: '#f9fafb' }}>
                        <td colSpan={6} style={{ padding: '0 24px 24px 24px', borderBottom: '1px solid #e5e7eb' }}>
                          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '16px' }}>
                            <div style={{ fontSize: 14, color: '#111827', marginBottom: 12, fontWeight: 500 }}>
                              <strong>Q:</strong> {ans.question?.questionText || 'Question text not available.'}
                            </div>
                            
                            {ans.question?.explanation && (
                              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 4, padding: '12px', marginTop: 12 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#065f46', textTransform: 'uppercase', marginBottom: 4 }}>Solution / Explanation:</div>
                                <div style={{ fontSize: 13, color: '#064e3b', whiteSpace: 'pre-wrap' }}>
                                  {ans.question.explanation}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
