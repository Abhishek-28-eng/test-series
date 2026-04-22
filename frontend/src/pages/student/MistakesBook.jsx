import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { BookX, CheckCircle, SearchX, Clock } from 'lucide-react';
import React from 'react';

export const MistakesBook = () => {
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  
  // Filtering states
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All'); // 'All', 'wrong', 'skipped'

  useEffect(() => {
    fetchMistakes();
  }, []);

  const fetchMistakes = async () => {
    try {
      const { data } = await api.get('/attempts/mistakes');
      if (data.success) {
        setMistakes(data.data);
      }
    } catch (error) {
      toast.error('Failed to load mistakes book');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '100px 0', textAlign: 'center', color: '#6b7280' }}>
      Loading your error log...
    </div>
  );

  const subjects = ['All', ...new Set(mistakes.map(m => m.subject))];

  const filteredMistakes = mistakes.filter(m => {
    if (subjectFilter !== 'All' && m.subject !== subjectFilter) return false;
    if (typeFilter === 'wrong' && m.wasSkipped) return false;
    if (typeFilter === 'skipped' && !m.wasSkipped) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: 32, borderBottom: '1px solid #e5e7eb', paddingBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: '#111827', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookX size={24} color="#dc2626" />
          Mistakes Book (Error Log)
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Review your incorrect and skipped questions to identify weak areas.</p>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Subject:</label>
          <select 
            value={subjectFilter} 
            onChange={e => setSubjectFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', fontSize: 13 }}
          >
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Type:</label>
          <select 
            value={typeFilter} 
            onChange={e => setTypeFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', fontSize: 13 }}
          >
            <option value="All">All Erros & Skips</option>
            <option value="wrong">Incorrect Only</option>
            <option value="skipped">Skipped Only</option>
          </select>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: '#6b7280', alignSelf: 'center' }}>
          Showing {filteredMistakes.length} record{filteredMistakes.length !== 1 && 's'}
        </div>
      </div>

      {filteredMistakes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed #d1d5db', borderRadius: 6, background: '#fff' }}>
          <CheckCircle size={48} color="#16a34a" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: '0 0 8px 0' }}>No Mistakes Found!</h3>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>You don't have any incorrect or skipped questions matching these filters.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Subject</th>
                  <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Source Test</th>
                  <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Your Input</th>
                  <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Correct Answer</th>
                  <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMistakes.map((ans) => {
                  const isExpanded = expandedRow === ans.answerId;
                  return (
                    <React.Fragment key={ans.answerId}>
                      <tr 
                        onClick={() => setExpandedRow(isExpanded ? null : ans.answerId)} 
                        style={{ transition: 'background 0.2s', cursor: 'pointer', background: isExpanded ? '#f3f4f6' : 'transparent' }} 
                        onMouseOver={e => !isExpanded && (e.currentTarget.style.background = '#f9fafb')} 
                        onMouseOut={e => !isExpanded && (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '16px 24px', fontSize: 13, borderBottom: isExpanded ? 'none' : '1px solid #e5e7eb' }}>
                          <span style={{ fontWeight: 600, color: '#111827' }}>{ans.subject}</span>
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: 13, borderBottom: isExpanded ? 'none' : '1px solid #e5e7eb', color: '#4b5563' }}>
                          <div style={{ marginBottom: 4 }}>{ans.testName}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12}/> {new Date(ans.attemptDate).toLocaleDateString()}</div>
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: 13, borderBottom: isExpanded ? 'none' : '1px solid #e5e7eb' }}>
                          {ans.wasSkipped 
                            ? <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Skipped</span> 
                            : <span style={{ fontWeight: 500, color: '#dc2626' }}>{ans.selectedOption || ans.numericAnswer}</span>}
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: 13, borderBottom: isExpanded ? 'none' : '1px solid #e5e7eb', color: '#16a34a', fontWeight: 600 }}>
                          {ans.questionType === 'MCQ' ? ans.correctOption : ans.correctNumericAnswer}
                        </td>
                        <td style={{ padding: '16px 24px', borderBottom: isExpanded ? 'none' : '1px solid #e5e7eb' }}>
                          {ans.wasSkipped
                            ? <span style={{ color: '#6b7280', background: '#e5e7eb', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Omitted</span> 
                            : <span style={{ color: '#b91c1c', background: '#fef2f2', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Incorrect</span>}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr style={{ background: '#f3f4f6' }}>
                          <td colSpan={5} style={{ padding: '0 24px 24px 24px', borderBottom: '1px solid #e5e7eb' }}>
                            <div style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, padding: '20px' }}>
                              
                              <div style={{ fontSize: 14, color: '#111827', marginBottom: 16, fontWeight: 500 }}>
                                <strong>Question:</strong> {ans.questionText || 'Question text not available.'}
                              </div>
                              
                              {ans.explanation ? (
                                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderLeft: '4px solid #3b82f6', borderRadius: 4, padding: '16px' }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', marginBottom: 8 }}>Explanation / Solution:</div>
                                  <div style={{ fontSize: 13, color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                    {ans.explanation}
                                  </div>
                                </div>
                              ) : (
                                <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>No detailed solution provided for this question.</div>
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
      )}
    </div>
  );
};
