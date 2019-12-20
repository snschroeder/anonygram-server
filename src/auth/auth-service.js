const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const AuthService = {
  getUser: (db, username) => {
    return db('users')
      .select('*')
      .where({ username })
      .first();
  },

  validatePassword: (db, username, password) => {
    return AuthService.getUser(db, username).then((user) => {
      return bcryptjs.compare(password, user.password);
    });
  },

  createJWT: (subject, payload) => {
    return jwt.sign(payload, config.JWT_SECRET, {
      subject,
      expiresIn: '1h',
      algorithm: 'HS256',
    });
  },

  verifyJWT: (token) => {
    return jwt.verify(token, config.JWT_SECRET, {
      algorithm: 'HS256',
    });
  },
};

module.exports = AuthService;
