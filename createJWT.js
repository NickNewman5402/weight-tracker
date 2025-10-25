// createJWT.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

function _createToken(fn, ln, id) {
  try {
    const user = { userId: id, firstName: fn, lastName: ln };
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET || 'dev-secret');
    return { accessToken };
  } catch (e) {
    return { error: e.message };
  }
}

exports.createToken = (fn, ln, id) => _createToken(fn, ln, id);

exports.isExpired = function (token) {
  try {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'dev-secret');
    return false; // token valid
  } catch {
    return true; // invalid or expired
  }
};


exports.refresh = function (token) {
  try {
    const ud = jwt.decode(token, { complete: true });
    const { userId, firstName, lastName } = ud.payload || {};
    return _createToken(firstName, lastName, userId);
  } catch (e) {
    return { error: e.message };
  }
};
