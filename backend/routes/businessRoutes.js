
// Business routes: profile fetch/update and listing
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const { getBusinessProfile, updateBusiness, listBusinesses } = require('../controllers/businessController');

router.get('/', auth, role(['owner','manager']), getBusinessProfile);
router.put('/', auth, role(['owner','manager']), updateBusiness);
router.get('/all', auth, listBusinesses);

module.exports = router;
