const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const TOKEN_NAME = process.env.TOKEN_NAME || 'retailiq_token';

module.exports = function (req, res, next) {
  try {
    // check cookie
    let token = null;
    if (req.cookies && req.cookies[TOKEN_NAME]) token = req.cookies[TOKEN_NAME];

    // fallback to Authorization header (bearer)
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') token = parts[1];
    }

    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.verify(token, JWT_SECRET);
    // Normalize token payload for convenience: set a common `id` field
    // so controllers can always reference `req.user.id` regardless of token shape
    const normalized = { ...decoded };
    if (decoded.userId) normalized.id = decoded.userId;
    else if (decoded.supplierId) normalized.id = decoded.supplierId;
    req.user = normalized; // e.g., { id, userId?, supplierId?, role }
    next();
  } catch (err) {
    console.error('auth middleware error', err);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
