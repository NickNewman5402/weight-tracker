const jwt = require('jsonwebtoken');
//require('dotenv').config();

// Internal helper to sign tokens
function signToken(firstName, lastName, id, expiresIn = '1h') {
  const payload = { userId: id, firstName, lastName };
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn });
}

// Create a token and return the shape your frontend expects
exports.createToken = function (fn, ln, id) {
  try {
    const jwtToken = signToken(fn, ln, id);
    return { firstName: fn, lastName: ln, id, jwtToken, error: '' };
  } catch (e) {
    return { error: e.message };
  }
};

// Return true if token is invalid or expired; false if still valid
exports.isExpired = function (tokenStr) {
  try {
    jwt.verify(tokenStr, process.env.ACCESS_TOKEN_SECRET);
    return false;
  } catch {
    return true;
  }
};

// Optional: issue a fresh token (even if the old one is expired)
exports.refresh = function (tokenStr) {
  try {
    const decoded = jwt.verify(tokenStr, process.env.ACCESS_TOKEN_SECRET, { ignoreExpiration: true });
    const { userId, firstName, lastName } = decoded;
    return signToken(firstName, lastName, userId);
  } catch {
    return '';
  }
};
