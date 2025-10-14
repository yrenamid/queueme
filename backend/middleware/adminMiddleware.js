
module.exports = function adminOnly(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (!req.user.is_admin) return res.status(403).json({ success: false, message: 'Forbidden: admin only' });
  next();
};
