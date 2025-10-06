
//get and update business settings
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const { getSettings, updateSettings } = require('../controllers/settingsController');

router.get('/', auth, role(['owner','manager']), getSettings);
router.put('/', auth, role(['owner','manager']), updateSettings);

module.exports = router;
