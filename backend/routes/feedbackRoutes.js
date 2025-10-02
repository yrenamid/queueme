
// Feedback routes: public create and business feedback listing
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const { createFeedback, getBusinessFeedback } = require('../controllers/feedbackController');


router.post('/', createFeedback);


router.get('/:businessId', auth, role(['owner','manager']), getBusinessFeedback);

module.exports = router;
