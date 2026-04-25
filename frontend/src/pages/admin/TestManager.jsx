import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, List, Play, Search, FileText, Clock, X, CalendarCheck, CalendarX } from 'lucide-react';

/* ── helpers ────────────────────────────────────────────────── */
const toLocalInput = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  // datetime-local needs "YYYY-MM-DDTHH:mm"
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const fmtWindow = (isoStr) => {
  if (!isoStr) return null;
  return new Date(isoStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

const windowStatus = (test) => {
  if (!test.scheduledAt && !test.scheduledEnd) return null;
  const now = new Date();
  if (test.scheduledAt && now < new Date(test.scheduledAt)) return { label: 'Upcoming', color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' };
  if (test.scheduledEnd && now > new Date(test.scheduledEnd)) return { label: 'Closed', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
  return { label: 'Live', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' };
};

const inputStyle = {
  width: '100%', padding: '8px 12px', border: '1px solid #d1d5db',
  borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff',
};

export const TestManager = () => {
  const [tests, setTests]           = useState([]);
  const [configs, setConfigs]       = useState([]);
  const [analyticsMap, setAnalyticsMap] = useState({});
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData]     = useState({ title: '', examConfigId: '', description: '', scheduledAt: '', scheduledEnd: '' });

  /* schedule modal */
  const [schedTest, setSchedTest]   = useState(null);
  const [schedForm, setSchedForm]   = useState({ scheduledAt: '', scheduledEnd: '' });
  const [schedSaving, setSchedSaving] = useState(false);

  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [testsRes, configsRes, analyticsRes] = await Promise.all([
        api.get('/tests'), 
        api.get('/exam-configs'),
        api.get('/tests/analytics/all').catch(() => ({ data: { data: [] } }))
      ]);
      setTests(testsRes.data.data);
      setConfigs(configsRes.data.data);
      
      const aMap = {};
      (analyticsRes.data.data || []).forEach(a => { aMap[a.testId] = a; });
      setAnalyticsMap(aMap);

      if (configsRes.data.data.length > 0)
        setFormData(prev => ({ ...prev, examConfigId: configsRes.data.data[0].id }));
    } catch { toast.error('Failed to load assessments'); }
    finally { setLoading(false); }
  };

  /* create */
  const handleCreateTest = async (e) => {
    e.preventDefault();
    if (formData.scheduledAt && formData.scheduledEnd && new Date(formData.scheduledEnd) <= new Date(formData.scheduledAt)) {
      toast.error('Window end must be after window start'); return;
    }
    try {
      const { data } = await api.post('/tests', {
        title: formData.title, examConfigId: formData.examConfigId, description: formData.description,
        scheduledAt: formData.scheduledAt || null, scheduledEnd: formData.scheduledEnd || null,
      });
      if (data.success) {
        toast.success('Test created successfully');
        setShowModal(false);
        fetchData();
        setFormData({ title: '', examConfigId: configs[0]?.id, description: '', scheduledAt: '', scheduledEnd: '' });
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create test'); }
  };

  /* publish */
  const handlePublish = async (id) => {
    try {
      const { data } = await api.put(`/tests/${id}/publish`);
      if (data.success) { toast.success('Test published'); fetchData(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to publish'); }
  };

  /* delete */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this test?')) return;
    try {
      const { data } = await api.delete(`/tests/${id}`);
      if (data.success) { toast.success('Test deleted'); fetchData(); }
    } catch { toast.error('Failed to delete test'); }
  };

  /* open schedule modal */
  const openSchedule = (test) => {
    setSchedTest(test);
    setSchedForm({ scheduledAt: toLocalInput(test.scheduledAt), scheduledEnd: toLocalInput(test.scheduledEnd) });
  };

  /* save schedule */
  const handleSaveSchedule = async () => {
    if (schedForm.scheduledAt && schedForm.scheduledEnd && new Date(schedForm.scheduledEnd) <= new Date(schedForm.scheduledAt)) {
      toast.error('Window end must be after window start'); return;
    }
    setSchedSaving(true);
    try {
      const { data } = await api.put(`/tests/${schedTest.id}/schedule`, {
        scheduledAt:  schedForm.scheduledAt  || null,
        scheduledEnd: schedForm.scheduledEnd || null,
      });
      if (data.success) {
        toast.success('Schedule saved!');
        setSchedTest(null);
        fetchData();
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save schedule'); }
    finally { setSchedSaving(false); }
  };

  /* clear schedule */
  const handleClearSchedule = async () => {
    if (!window.confirm('Clear the schedule window for this test?')) return;
    setSchedSaving(true);
    try {
      await api.put(`/tests/${schedTest.id}/schedule`, { scheduledAt: null, scheduledEnd: null });
      toast.success('Schedule cleared');
      setSchedTest(null);
      fetchData();
    } catch { toast.error('Failed to clear schedule'); }
    finally { setSchedSaving(false); }
  };

  const filteredTests = tests.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="fade-in">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 24, borderBottom: '1px solid var(--card-border)', paddingBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827', margin: 0 }}>Assessments</h1>
          <p style={{ fontSize: 13, color: '#4b5563', margin: '4px 0 0 0' }}>Manage mock tests, set schedule windows, and publish to students.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
            <input type="text" placeholder="Search tests..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '8px 12px 8px 30px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none', width: 220 }} />
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ padding: '8px 16px', background: '#f97316', border: '1px solid #ea6c0a', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Create Assessment
          </button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 8, overflow: 'hidden' }}>
        {filteredTests.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#6b7280' }}>
            <FileText size={32} style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 4px 0', fontSize: 15, color: '#111827' }}>No tests found</h3>
            <p style={{ margin: 0, fontSize: 13 }}>Create a new test or adjust your search.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Assessment</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Configuration</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Schedule Window</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Analytics</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map(test => {
                  const ws = windowStatus(test);
                  return (
                    <tr key={test.id} style={{ borderBottom: '1px solid #f3f4f6' }}
                      onMouseOver={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px 16px', maxWidth: 280 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{test.title}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {test.description || 'No description provided.'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                          {test.examConfig?.displayName}
                        </span>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{test.examConfig?.duration} mins • {test.examConfig?.totalMarks} marks</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px',
                          borderRadius: 99, fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                          background: test.status === 'published' ? '#ecfdf5' : '#fff7ed',
                          color: test.status === 'published' ? '#059669' : '#d97706',
                          border: `1px solid ${test.status === 'published' ? '#a7f3d0' : '#fde68a'}`,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: test.status === 'published' ? '#10b981' : '#f59e0b' }} />
                          {test.status}
                        </span>
                      </td>
                      {/* Schedule Window cell */}
                      <td style={{ padding: '14px 16px', minWidth: 190 }}>
                        {ws ? (
                          <div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: ws.bg, color: ws.color, border: `1px solid ${ws.border}`, marginBottom: 6 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: ws.color }} />
                              {ws.label}
                            </span>
                            <div style={{ fontSize: 11, color: '#4b5563', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                              <CalendarCheck size={11} style={{ color: '#10b981' }} />
                              {fmtWindow(test.scheduledAt) || '—'}
                            </div>
                            <div style={{ fontSize: 11, color: '#4b5563', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <CalendarX size={11} style={{ color: '#ef4444' }} />
                              {fmtWindow(test.scheduledEnd) || 'No end limit'}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>No window set</span>
                        )}
                      </td>
                      {/* Analytics cell */}
                      <td style={{ padding: '14px 16px', minWidth: 140 }}>
                        {analyticsMap[test.id] ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ fontSize: 12, color: '#374151' }}>Attempts: <strong>{analyticsMap[test.id].totalAttempts}</strong></div>
                            <div style={{ fontSize: 12, color: '#374151' }}>Avg Score: <strong style={{ color: '#16a34a' }}>{analyticsMap[test.id].avgScore}</strong> <span style={{color: '#9ca3af', fontSize: 11}}>({analyticsMap[test.id].avgAccuracy}%)</span></div>
                            <div style={{ fontSize: 12, color: '#374151' }}>Completion: <strong>{analyticsMap[test.id].completionPercentage}%</strong></div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>No data yet</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button onClick={() => navigate(`/admin/tests/${test.id}/questions`)}
                            style={{ padding: '6px 10px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#374151', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <List size={13} /> Questions
                          </button>
                          {/* Schedule button */}
                          <button onClick={() => openSchedule(test)} title="Set Schedule Window"
                            style={{ padding: '6px 10px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#1d4ed8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={13} /> Schedule
                          </button>
                          {test.status === 'draft' && (
                            <button onClick={() => handlePublish(test.id)}
                              style={{ padding: '6px 10px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#059669', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Play size={13} /> Publish
                            </button>
                          )}
                          <button onClick={() => handleDelete(test.id)} title="Delete"
                            style={{ padding: '6px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#ef4444', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════ CREATE MODAL ═══════════════════════════════ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 10, width: '100%', maxWidth: 520, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>Create Assessment</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateTest} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Test Title *</label>
                <input type="text" required placeholder="e.g. Weekly Full Syllabus - Set A" value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Configuration *</label>
                <select required value={formData.examConfigId} onChange={e => setFormData({ ...formData, examConfigId: e.target.value })} style={inputStyle}>
                  {configs.map(c => <option key={c.id} value={c.id}>{c.displayName} ({c.totalMarks}mk / {c.duration}m)</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Description</label>
                <textarea placeholder="Internal notes or instructions..." value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              {/* Optional schedule at create time */}
              <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Clock size={14} style={{ color: '#4f46e5' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase' }}>Schedule Window (Optional)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Opens At</label>
                    <input type="datetime-local" value={formData.scheduledAt}
                      onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Closes At</label>
                    <input type="datetime-local" value={formData.scheduledEnd}
                      onChange={e => setFormData({ ...formData, scheduledEnd: e.target.value })} style={inputStyle} />
                  </div>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 11, color: '#9ca3af' }}>Leave blank for no restriction. Students cannot start outside this window.</p>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ padding: '8px 16px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer' }}>Cancel</button>
                <button type="submit"
                  style={{ padding: '8px 18px', background: '#f97316', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Create Assessment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════ SCHEDULE MODAL ════════════════════════════ */}
      {schedTest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 10, width: '100%', maxWidth: 460, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} style={{ color: '#4f46e5' }} /> Set Schedule Window
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>{schedTest.title}</p>
              </div>
              <button onClick={() => setSchedTest(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}><X size={18} /></button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Info banner */}
              <div style={{ padding: 12, background: '#eff6ff', borderRadius: 6, border: '1px solid #bfdbfe', fontSize: 12, color: '#1e40af', lineHeight: 1.5 }}>
                <strong>How it works:</strong> Students can only start this test between the <em>Opens At</em> and <em>Closes At</em> times. Leave a field blank to remove that restriction.
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>
                  <CalendarCheck size={13} style={{ color: '#10b981' }} /> Opens At
                </label>
                <input type="datetime-local" value={schedForm.scheduledAt}
                  onChange={e => setSchedForm(p => ({ ...p, scheduledAt: e.target.value }))} style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>
                  <CalendarX size={13} style={{ color: '#ef4444' }} /> Closes At
                </label>
                <input type="datetime-local" value={schedForm.scheduledEnd}
                  onChange={e => setSchedForm(p => ({ ...p, scheduledEnd: e.target.value }))} style={inputStyle} />
              </div>

              {/* Live preview */}
              {(schedForm.scheduledAt || schedForm.scheduledEnd) && (
                <div style={{ padding: 12, background: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Preview</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <CalendarCheck size={12} style={{ color: '#10b981' }} />
                    {schedForm.scheduledAt ? new Date(schedForm.scheduledAt).toLocaleString('en-IN', { hour12: true }) : 'No start limit'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CalendarX size={12} style={{ color: '#ef4444' }} />
                    {schedForm.scheduledEnd ? new Date(schedForm.scheduledEnd).toLocaleString('en-IN', { hour12: true }) : 'No end limit'}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
              <button onClick={handleClearSchedule} disabled={schedSaving}
                style={{ padding: '8px 14px', background: '#fff', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#dc2626', cursor: 'pointer' }}>
                Clear Window
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setSchedTest(null)}
                  style={{ padding: '8px 14px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#374151', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSaveSchedule} disabled={schedSaving}
                  style={{ padding: '8px 16px', background: schedSaving ? '#a5b4fc' : '#4f46e5', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#fff', cursor: schedSaving ? 'not-allowed' : 'pointer' }}>
                  {schedSaving ? 'Saving…' : 'Save Window'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
