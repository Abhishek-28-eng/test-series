const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { startAttempt, saveAnswer, submitAttempt, getMyAttempts, getAttemptResult, getAnalytics } = require('../controllers/attempt.controller');

router.get('/my', authenticate, getMyAttempts);
router.get('/analytics', authenticate, getAnalytics);
router.get('/:id/result', authenticate, getAttemptResult);
router.post('/start', authenticate, startAttempt);
router.post('/save-answer', authenticate, saveAnswer);
router.post('/submit', authenticate, submitAttempt);

module.exports = router;
