
// dashboard stats, queue summary, overview, recent activity, and series
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const { getDashboardStats, getQueueSummary, getOverviewMetrics, getRecentActivity, getAnalyticsSeries } = require('../controllers/analyticsController');

router.get('/dashboard', auth, role(['owner','manager']), getDashboardStats);
router.get('/queue-summary', auth, role(['owner','manager']), getQueueSummary);
router.get('/overview', auth, role(['owner','manager']), getOverviewMetrics);
router.get('/recent-activity', auth, role(['owner','manager']), getRecentActivity);
router.get('/series', auth, role(['owner','manager']), getAnalyticsSeries);

module.exports = router;
