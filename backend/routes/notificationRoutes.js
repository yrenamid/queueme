
// Notification routes: settings fetch/update
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const { getNotificationSettings, updateNotificationSettings } = require('../controllers/notificationController');

router.get('/settings', auth, role(['owner','manager']), getNotificationSettings);
router.put('/settings', auth, role(['owner','manager']), updateNotificationSettings);


module.exports = router;
