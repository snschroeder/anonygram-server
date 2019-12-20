const { JsonWebTokenError } = require('jsonwebtoken');
const AuthService = require('../auth/auth-service');

async function protectedWithJWT(req, res, next) {
  const token = req.get('Authorization');

  if (!token || !token.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'missing bearer token' });
  }

  const bearerToken = token.slice(7, token.length);

  try {
    const payload = AuthService.verifyJWT(bearerToken);
    const user = await AuthService.getUser(req.app.get('db'), payload.sub);

    if (!user) {
      return res.status(401).json({ error: 'unauthorized request' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      return res.status(401).json({ error: 'unauthorized request' });
    }
    next(error);
  }
}

async function getUserFromToken(req, res, next) {
  const token = req.get('Authorization');
  if (token && token.toLowerCase().startsWith('bearer ')) {
    try {
      const payload = AuthService.verifyJWT(token.slice(7, token.length));
      const user = await AuthService.getUser(req.app.get('db'), payload.sub);

      if (user) {
        req.user = user;
      }
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
}

module.exports = { protectedWithJWT, getUserFromToken };
