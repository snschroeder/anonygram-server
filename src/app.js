/*******************************************************************
  IMPORTS
*******************************************************************/

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV, CLIENT_ORIGIN, DATABASE_URL } = require('./config');
const imagesRouter = require('./images/images-router');
const usersRouter = require('./users/users-router');
const authRouter = require('./auth/auth-router');
const commentsRouter = require('./comments/comments-router');
const knex = require('knex');
const validateBearerToken = require('./bin/validateBearerToken');
const errorHandler = require('./bin/errorHandler');

/*******************************************************************
  INIT
*******************************************************************/
const app = express();
const db = knex({
  client: 'pg',
  connection: DATABASE_URL,
});

/*******************************************************************
  MIDDLEWARE
*******************************************************************/
app.use(
  morgan(NODE_ENV === 'production' ? 'tiny' : 'common', {
    skip: () => NODE_ENV === 'test',
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (origin === CLIENT_ORIGIN || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);
app.use(helmet());
app.set('db', db);

/*******************************************************************
  ROUTES
*******************************************************************/
app.get('/', (req, res) => {
  // return res.sendFile(__dirname + '/index.html');
  return res.status(200).end();
});

app.use('/api/images/', imagesRouter);
app.use('/api/users/', usersRouter);
app.use('/api/auth/', authRouter);
app.use('/api/comments/', commentsRouter);

/*******************************************************************
  ERROR HANDLING
*******************************************************************/
// Catch-all 404 handler
app.use((req, res, next) => {
  const err = new Error('Path Not Found');
  err.status = 404;
  next(err); // goes to errorHandler
});
app.use(errorHandler);

/*******************************************************************
  EXPORTS
*******************************************************************/
module.exports = app;
