
// Service routes: CRUD for services
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const { listServices, createService, updateService, deleteService } = require('../controllers/serviceController');

router.get('/', auth, listServices);
router.post('/', auth, role(['owner','manager']), createService);
router.put('/:id', auth, role(['owner','manager']), updateService);
router.delete('/:id', auth, role(['owner','manager']), deleteService);

module.exports = router;
