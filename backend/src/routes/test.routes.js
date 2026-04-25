const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const {
  getAllTests, getTestById, createTest, publishTest, scheduleTest, updateTest, deleteTest, getTestAnalytics
} = require('../controllers/test.controller');
const { body } = require('express-validator');

const createTestValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('examConfigId').isInt({ min: 1 }).withMessage('Valid examConfigId required'),
];

// Public after auth
router.get('/', authenticate, getAllTests);
router.get('/:id', authenticate, getTestById);

// Admin only
router.get('/analytics/all', authenticate, requireAdmin, getTestAnalytics);
router.post('/', authenticate, requireAdmin, createTestValidation, createTest);
router.put('/:id/publish',   authenticate, requireAdmin, publishTest);
router.put('/:id/schedule',  authenticate, requireAdmin, scheduleTest);
router.put('/:id',           authenticate, requireAdmin, updateTest);
router.delete('/:id',        authenticate, requireAdmin, deleteTest);

module.exports = router;
