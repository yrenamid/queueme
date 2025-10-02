
// Staff routes: list/create/update/delete staff (owner only)
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const { listStaff, createStaff, updateStaff, deleteStaff } = require('../controllers/staffController');


router.get('/', auth, role(['owner']), listStaff);
router.post('/', auth, role(['owner']), createStaff);
router.put('/:id', auth, role(['owner']), updateStaff);
router.delete('/:id', auth, role(['owner']), deleteStaff);

module.exports = router;
