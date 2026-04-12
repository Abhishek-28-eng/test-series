import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/MainLayout';

// Pages
import { Login } from './pages/Login';
// import { Register } from './pages/Register';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { TestManager } from './pages/admin/TestManager';
import { QuestionManager } from './pages/admin/QuestionManager';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ExamInterface } from './pages/student/ExamInterface';
import { Result } from './pages/student/Result';
import { StudentProfile } from './pages/student/StudentProfile';
import { StudentProgress } from './pages/student/StudentProgress';
import { StudentManager } from './pages/admin/StudentManager';
import { AdminStudentDetail } from './pages/admin/AdminStudentDetail';
import { GlobalResults } from './pages/admin/GlobalResults';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" 
          toastOptions={{
            style: { background: '#1e1e35', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
          }} 
        />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          {/* <Route path="/register" element={<Register />} /> */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Dashboard Layouts */}
          <Route element={<MainLayout />}>
            {/* Student */}
            <Route path="/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute role="student"><StudentProfile /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute role="student"><StudentProgress /></ProtectedRoute>} />
            <Route path="/result/:id" element={<ProtectedRoute role="student"><Result /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/tests" element={<ProtectedRoute role="admin"><TestManager /></ProtectedRoute>} />
            <Route path="/admin/tests/:testId/questions" element={<ProtectedRoute role="admin"><QuestionManager /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute role="admin"><StudentManager /></ProtectedRoute>} />
            <Route path="/admin/students/:studentId" element={<ProtectedRoute role="admin"><AdminStudentDetail /></ProtectedRoute>} />
            <Route path="/admin/results" element={<ProtectedRoute role="admin"><GlobalResults /></ProtectedRoute>} />
            
          </Route>

          {/* Full Screen Exam (No Layout) */}
          <Route path="/exam/:testId" element={<ProtectedRoute role="student"><ExamInterface /></ProtectedRoute>} />
          
          
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
