// JWT auth middleware: verifies Bearer token and sets req.user
const jwt = require('jsonwebtoken');
const { jwt: jwtCfg } = require('../config/configdb');


module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, jwtCfg.secret);
    req.user = decoded; // { id, business_id, role }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};
