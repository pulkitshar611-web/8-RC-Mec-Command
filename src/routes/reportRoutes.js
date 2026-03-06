const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/', verifyToken, reportController.createReport);
router.get('/', verifyToken, reportController.getAllReports);
// IMPORTANT: Static routes must come BEFORE dynamic /:id routes
router.get('/my-history', verifyToken, reportController.getMyHistory);
router.get('/:id/pdf', verifyToken, adminController.exportReportPDF);
router.delete('/:id', verifyToken, reportController.deleteReport);

module.exports = router;
