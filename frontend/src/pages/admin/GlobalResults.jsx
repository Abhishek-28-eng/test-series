import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const GlobalResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const { data } = await api.get('/admin/results');
      if (data.success) setResults(data.data);
    } catch (error) {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Global Test Results</h1>
        <p className="text-muted text-sm mt-2">View performance of all students across all tests</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Test Title</th>
                <th>Score</th>
                <th>Accuracy</th>
                <th>Time Taken</th>
                <th>Date Attempted</th>
              </tr>
            </thead>
            <tbody>
              {results.length > 0 ? (
                results.map((res, idx) => (
                  <tr key={res.id}>
                    <td className="font-bold text-muted">#{idx + 1}</td>
                    <td>
                      <div className="font-bold">{res.user?.name}</div>
                      <div className="text-xs text-muted mt-1">{res.user?.email}</div>
                    </td>
                    <td className="font-bold">{res.test?.title}</td>
                    <td>
                      <span className={`text-${res.score > 0 ? 'success' : 'danger'} font-bold`}>
                        {res.score}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{res.accuracy}%</span>
                      </div>
                    </td>
                    <td className="text-muted">{res.timeTakenFormatted}</td>
                    <td className="text-muted">{new Date(res.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-muted">No test results generated yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
