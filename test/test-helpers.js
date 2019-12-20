const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const now = new Date();
const twoDaysAgo = new Date(new Date().setDate(now.getDate() - 2));
const fiveDaysAgo = new Date(new Date().setDate(now.getDate() - 5));

function setupTestDB(app) {
  let knex = require('knex');
  let db = knex({
    client: 'pg',
    connection: process.env.TEST_DB_URL,
  });
  app.set('db', db);
  return db;
}

function coordinatesGreenwich() {
  return {
    lat: '51.4825766',
    lon: '-0.0076589',
  };
}

function coordinatesQuito() {
  return {
    lat: '-0.180653',
    lon: '-78.467834',
  };
}

function mockUsers() {
  return [
    {
      id: '53d25d5f-a033-40b3-a253-84172a514973',
      username: 'test-user-1',
      password: 'password',
    },
    {
      id: 'cc5fe585-8682-4499-a04e-6255b42116c1',
      username: 'test-user-2',
      password: 'password',
    },
  ];
}

function mockSubmissions() {
  return [
    {
      id: 1,
      image_url: 'https://anonygram-images.s3.amazonaws.com/greenwich',
      image_text: 'greenwich',
      karma_total: 20,
      latitude: coordinatesGreenwich().lat,
      longitude: coordinatesGreenwich().lon,
      create_timestamp: fiveDaysAgo,
      user_id: '53d25d5f-a033-40b3-a253-84172a514973',
    },
    {
      id: 2,
      image_url: 'https://anonygram-images.s3.amazonaws.com/quito1',
      image_text: 'quito1',
      karma_total: 5,
      latitude: coordinatesQuito().lat,
      longitude: coordinatesQuito().lon,
      create_timestamp: twoDaysAgo,
      user_id: 'cc5fe585-8682-4499-a04e-6255b42116c1',
    },
    {
      id: 3,
      image_url: 'https://anonygram-images.s3.amazonaws.com/quito2',
      image_text: 'quito2',
      karma_total: 99,
      latitude: coordinatesQuito().lat,
      longitude: coordinatesQuito().lon,
      create_timestamp: now,
      user_id: 'cc5fe585-8682-4499-a04e-6255b42116c1',
    },
  ];
}

function mockComments() {
  return [
    {
      comment_id: '3d6e2144-57bd-43a7-a8f0-d690a5e491d0',
      comment_text: 'some comment 1',
      comment_timestamp: twoDaysAgo,
      submission_id: 1,
      user_id: '53d25d5f-a033-40b3-a253-84172a514973',
    },
    {
      comment_id: '066c875c-248c-4c54-8e29-fd1af2579877',
      comment_text: 'some comment 2',
      comment_timestamp: now,
      submission_id: 1,
      user_id: 'cc5fe585-8682-4499-a04e-6255b42116c1',
    },
    {
      comment_id: 'b398a65c-b219-4a52-aa54-3423e70aaecf',
      comment_text: 'some comment 3',
      comment_timestamp: now,
      submission_id: 1,
      user_id: '53d25d5f-a033-40b3-a253-84172a514973',
    },
    {
      comment_id: 'cf5cb077-fb26-456c-a4c6-9efd210cfb25',
      comment_text: 'some comment 4',
      comment_timestamp: now,
      submission_id: 2,
      user_id: '53d25d5f-a033-40b3-a253-84172a514973',
    },
    {
      comment_id: 'eb29bb25-e8e4-4c38-a9fe-067a5a37f659',
      comment_text: 'some comment 5',
      comment_timestamp: now,
      submission_id: 2,
      user_id: 'cc5fe585-8682-4499-a04e-6255b42116c1',
    },
  ];
}

function seedUsers(db, users) {
  const usersWithEncryptedPasswords = users.map((user) => ({
    ...user,
    password: bcrypt.hashSync(user.password, 1),
  }));
  return db.insert(usersWithEncryptedPasswords).into('users');
}

function seedSubmissions(db, submissions) {
  return db.insert(submissions).into('submission');
}

function seedComments(db, comments) {
  return db('comments').insert(comments);
}

function truncateAllTables(db) {
  return db.raw(
    `TRUNCATE
      comments,
      users,
      submission   
      RESTART IDENTITY CASCADE;`
  );
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ id: user.id, username: user.username }, secret, {
    subject: user.username,
    expiresIn: '1h',
    algorithm: 'HS256',
  });
  return `Bearer ${token}`;
}

module.exports = {
  setupTestDB,
  coordinatesGreenwich,
  coordinatesQuito,
  mockUsers,
  mockSubmissions,
  mockComments,
  seedUsers,
  seedSubmissions,
  seedComments,
  truncateAllTables,
  makeAuthHeader,
};
