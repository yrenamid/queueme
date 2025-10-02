
// Auth routes: register business, login, logout
const express = require('express');
const router = express.Router();
const { registerBusiness, login, logout } = require('../controllers/authController');

router.post('/register', registerBusiness);
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;
