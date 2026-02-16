const express = require('express');
const router = express.Router();
const controller = require('../controllers/reportController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/', verifyToken, controller.createReport);
router.get('/', verifyToken, controller.getAllReports);
router.get('/my-history', verifyToken, controller.getMyHistory);

module.exports = router;
