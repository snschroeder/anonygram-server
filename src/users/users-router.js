const express = require('express');
const usersRouter = express.Router();
const UsersService = require('./users-service');
const xss = require('xss');

usersRouter.route('/').post(express.json(), async (req, res, next) => {
  let { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  username = xss(username);
  password = xss(password);

  const isValid = UsersService.validatePassword(password);

  if (isValid !== null) {
    return res.status(400).json({ error: `${isValid}` });
  }
  const usernameIsValid = await UsersService.validateUserName(username);
  const usernameExists = await UsersService.validateNewUser(req.app.get('db'), username);
  if (usernameExists || usernameIsValid !== null) {
    return res.status(400).json({ error: 'username is invalid' });
  }
  const hashedPass = await UsersService.hashPass(password);
  const newUser = await UsersService.createNewUser(
    req.app.get('db'),
    username,
    hashedPass
  );

  return res.status(201).json(newUser);
});

usersRouter.route('/:user_id').get(async (req, res, next) => {
  let user_id = req.params.user_id;
  const user = await UsersService.getUser(req.app.get('db'), user_id);

  if (!user) {
    return res.status(400).json({ error: 'user does not exist' });
  }

  return res.status(200).json(user);
});

module.exports = usersRouter;
