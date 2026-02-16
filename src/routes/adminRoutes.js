const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/stats', [verifyToken, isAdmin], controller.getStats);
// Note: In API_DOCS, topics route is /api/topics, but it's listed under Commander Operations (Admin).
// However, the route is GET /api/topics. I'll put it in a separate topics route or just handle it here if the prefix matches.
// The doc says `GET /api/topics`. In server.js I didn't map /api/topics. I should.
// But for now, I'll stick to admin routes if it's admin only, or generic if shared.
// The docs put it under "Commander Operations".
// I'll map /api/topics in server.js to a topicController or reuse adminController.
// Actually, let's just make a route file for it.
// Settings
router.get('/settings', [verifyToken, isAdmin], controller.getSettings);
router.put('/settings', [verifyToken, isAdmin], controller.updateSettings);

// Staff
router.get('/staff', [verifyToken, isAdmin], controller.getStaff);
router.post('/staff', [verifyToken, isAdmin], controller.createStaff);
router.put('/staff/:id', [verifyToken, isAdmin], controller.updateStaff);
router.delete('/staff/:id', [verifyToken, isAdmin], controller.deleteStaff);

module.exports = router;
