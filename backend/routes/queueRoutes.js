
// list, join, status updates, details update, and bulk call
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const { joinQueue, listQueue, updateQueueStatus, updateQueueDetails, callSelectedCustomers } = require('../controllers/queueController');

router.get('/', auth, listQueue);
router.post('/join', auth, role(['owner','manager','cashier']), joinQueue);
router.patch('/:id/status', auth, role(['owner','manager','cashier']), updateQueueStatus);
router.put('/:id', auth, role(['owner','manager','cashier']), updateQueueDetails);
router.post('/call-selected', auth, role(['owner','manager','cashier']), callSelectedCustomers);

module.exports = router;
