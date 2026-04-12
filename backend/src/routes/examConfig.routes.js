const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getAllConfigs, getConfigById, getConfigByName } = require('../controllers/examConfig.controller');

router.get('/', authenticate, getAllConfigs);
router.get('/name/:name', authenticate, getConfigByName);
router.get('/:id', authenticate, getConfigById);

module.exports = router;
