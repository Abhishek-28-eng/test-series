const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const {
  getDashboard, getAllStudents, registerStudent, resetPassword, deleteStudent,
  updateEnrollments, getStudentGrowth, getAllResults, exportResults, getStudentAttempts, getStudentAnalytics,
} = require('../controllers/admin.controller');

router.get('/dashboard',                          authenticate, requireAdmin, getDashboard);
router.get('/students',                           authenticate, requireAdmin, getAllStudents);
router.post('/students/register',                 authenticate, requireAdmin, registerStudent);
router.put('/students/:id/reset-password',        authenticate, requireAdmin, resetPassword);
router.delete('/students/:id',                    authenticate, requireAdmin, deleteStudent);
router.put('/students/:id/enrollments',           authenticate, requireAdmin, updateEnrollments);
router.get('/students/:id/growth',                authenticate, requireAdmin, getStudentGrowth);
router.get('/students/:id/attempts',              authenticate, requireAdmin, getStudentAttempts);
router.get('/students/:id/analytics',             authenticate, requireAdmin, getStudentAnalytics);
router.get('/results',                            authenticate, requireAdmin, getAllResults);
router.get('/results/export',                     authenticate, requireAdmin, exportResults);

module.exports = router;
