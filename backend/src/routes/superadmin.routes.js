const router = require('express').Router();
const { authenticate, requireSuperAdmin } = require('../middleware/auth.middleware');
const { getAllInstitutes, createInstitute, toggleInstituteStatus, deleteInstitute } = require('../controllers/superadmin.controller');

router.use(authenticate, requireSuperAdmin);

router.get('/institutes', getAllInstitutes);
router.post('/institutes', createInstitute);
router.put('/institutes/:id/toggle', toggleInstituteStatus);
router.delete('/institutes/:id', deleteInstitute);

module.exports = router;
