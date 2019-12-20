const bcryptjs = require('bcryptjs');
const REGEX_UPPER_LOWER_NUMBER_SPECIAL = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/;

const UsersService = {
  hashPass: (password) => {
    return bcryptjs.hash(password, 12);
  },

  validatePassword: (password) => {
    if (password.length < 8) {
      return 'password must be longer than 8 characters';
    }

    if (password.length > 50) {
      return 'password must be less than 50 characters';
    }

    if (password.trim() !== password) {
      return 'password must not begin or end with whitespace';
    }

    if (!REGEX_UPPER_LOWER_NUMBER_SPECIAL.test(password)) {
      return 'password must contain one upper case, lower case, number and special character';
    }

    return null;
  },

  validateUserName: (username) => {
    if (username.length < 8 || username.length > 50 || username.trim() !== username) {
      return -1;
    }

    return null;
  },

  validateNewUser: (db, username) => {
    return db('users')
      .select('*')
      .where({ username })
      .first();
  },

  createNewUser: (db, username, password) => {
    return db('users')
      .insert({ username, password })
      .then(() => {
        return db('users')
          .select('id', 'username')
          .where({ username })
          .first();
      });
  },

  updateUser(db, username, updateFields) {
    return db('users')
      .where({ username })
      .update(updateFields);
  },

  getUser(db, id) {
    return db('users')
      .select('id', 'karma_balance')
      .where({ id })
      .first();
  },
};

module.exports = UsersService;
