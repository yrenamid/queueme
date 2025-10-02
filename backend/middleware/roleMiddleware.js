// Role guard middleware: requires req.user.role to be in allowed roles
module.exports = function roleMiddleware(roles = []) {
  if (!Array.isArray(roles)) roles = [roles];

  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    }
    next();
  };
};
