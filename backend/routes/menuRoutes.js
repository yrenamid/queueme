
//CRUD for menu items
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const { listMenu, createMenuItem, updateMenuItem, deleteMenuItem } = require('../controllers/menuController');

router.get('/', auth, listMenu);
router.post('/', auth, role(['owner','manager']), createMenuItem);
router.put('/:id', auth, role(['owner','manager']), updateMenuItem);
router.delete('/:id', auth, role(['owner','manager']), deleteMenuItem);

module.exports = router;
