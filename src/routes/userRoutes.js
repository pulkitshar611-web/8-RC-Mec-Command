const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/:id', verifyToken, controller.getUser);
router.put('/:id', verifyToken, controller.updateUser);
router.get('/:id/feedback', verifyToken, controller.getFeedback);

module.exports = router;
