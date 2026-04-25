const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { createQuestion, uploadCSV, getQuestionsByTest, updateQuestion, deleteQuestion } = require('../controllers/question.controller');
const upload = require('../middleware/upload.middleware');
const { body } = require('express-validator');

const questionValidation = [
  body('testId').isInt({ min: 1 }).withMessage('Valid testId required'),
  body('sectionId').isInt({ min: 1 }).withMessage('Valid sectionId required'),
  body('subject').notEmpty().withMessage('subject is required'),
  body('questionText').notEmpty().withMessage('questionText is required'),
  body('marks').isFloat({ min: 0.5 }).withMessage('marks must be positive'),
];

router.get('/test/:testId', authenticate, getQuestionsByTest);
router.post('/', authenticate, requireAdmin, questionValidation, createQuestion);
router.post('/upload-csv', authenticate, requireAdmin, upload.single('file'), uploadCSV);
router.delete('/:id', authenticate, requireAdmin, deleteQuestion);
router.put('/:id', authenticate, requireAdmin, updateQuestion);

module.exports = router;
