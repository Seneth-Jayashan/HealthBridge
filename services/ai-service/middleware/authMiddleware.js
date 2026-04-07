const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    console.log("REQ HEADERS COOKIE:", req.headers.cookie);
    console.log("REQ COOKIES:", req.cookies);
  try {
    const token =
      req.cookies?.hb_access_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };