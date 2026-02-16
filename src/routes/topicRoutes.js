const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController'); // Reusing for topics
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, controller.getTopics);
router.post('/:id/action', [verifyToken, isAdmin], controller.topicAction);
router.post('/', [verifyToken, isAdmin], controller.createTopic);
// Add suggestions
router.post('/:id/suggestions', [verifyToken, isAdmin], controller.addSuggestion);
// Generic update
router.patch('/:id', [verifyToken, isAdmin], controller.updateTopic);

module.exports = router;
