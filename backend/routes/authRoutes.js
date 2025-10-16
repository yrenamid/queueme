
// register business, login, logout
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { registerBusiness, login, logout, forgotPassword, resetPassword, changePassword } = require('../controllers/authController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}

const storage = multer.diskStorage({
	destination: function (req, file, cb) { cb(null, uploadDir); },
	filename: function (req, file, cb) {
		const safe = Date.now() + '_' + String(file.originalname || 'file').replace(/[^a-zA-Z0-9._-]+/g, '_');
		cb(null, safe);
	}
});
const fileFilter = (req, file, cb) => {
	const allowed = ['image/jpeg','image/png','application/pdf'];
	if (!allowed.includes(file.mimetype)) return cb(new Error('Invalid file type'), false);
	cb(null, true);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });


router.post('/register', upload.single('proof'), (err, req, res, next) => {
	if (err) {
		const msg = err.message || 'Upload error';
		return res.status(400).json({ success:false, message: msg });
	}
	next();
}, registerBusiness);
router.post('/login', login);
router.post('/logout', logout);
router.post('/change-password', auth, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


module.exports = router;
