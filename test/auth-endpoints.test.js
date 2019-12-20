const app = require('../src/app');
const AuthService = require('../src/auth/auth-service');
const TestHelpers = require('./test-helpers');

describe('Auth Endpoints', function() {
  let db = TestHelpers.setupTestDB(app);
  const mockUsers = TestHelpers.mockUsers();
  const testUser = mockUsers[0];
  const endpointPath = '/api/auth';

  /*****************************************************************
    SETUP
  ******************************************************************/
  before('cleanup', () => TestHelpers.truncateAllTables(db));

  afterEach('cleanup', () => TestHelpers.truncateAllTables(db));

  after('disconnect from db', () => db.destroy());

  /*****************************************************************
    POST /api/auth (User Login)
  ******************************************************************/
  describe(`POST ${endpointPath} (User Login)`, () => {
    beforeEach('insert users', () => TestHelpers.seedUsers(db, mockUsers));

    const requiredFields = ['username', 'password'];
    requiredFields.forEach((field) => {
      const loginAttemptBody = {
        username: testUser.username,
        password: testUser.password,
      };

      const expectedMsg1 = 'username and password are required';
      it(`responds 400 "${expectedMsg1}" when '${field}' is missing`, () => {
        delete loginAttemptBody[field];

        return supertest(app)
          .post(endpointPath)
          .send(loginAttemptBody)
          .expect(400, { error: expectedMsg1 });
      });
    });

    const expectedMsg2 = 'invalid username or password';
    it(`responds 400 "${expectedMsg2}" when bad username`, () => {
      const testLogin = { username: 'nonexistent-user', password: 'password' };
      return supertest(app)
        .post(endpointPath)
        .send(testLogin)
        .expect(400, { error: expectedMsg2 });
    });

    it(`responds 400 "${expectedMsg2}" when bad password`, () => {
      const testLogin = { username: testUser.username, password: 'incorrect' };
      return supertest(app)
        .post(endpointPath)
        .send(testLogin)
        .expect(400, { error: expectedMsg2 });
    });

    it('responds 200 and JWT auth token using secret when valid login', () => {
      const testLogin = { username: testUser.username, password: testUser.password };
      const subject = testUser.username;
      const payload = { id: testUser.id, username: testUser.username };
      return supertest(app)
        .post(endpointPath)
        .send(testLogin)
        .expect(200, {
          anonygramAuthToken: AuthService.createJWT(subject, payload),
          karma: 25,
        });
    });
  });

  /*****************************************************************
    PUT /api/auth (Token Refresh)
  ******************************************************************/
  describe(`PUT ${endpointPath} (Token Refresh)`, () => {
    beforeEach('insert users', () => TestHelpers.seedUsers(db, mockUsers));

    it('responds 200 and JWT auth token using secret', () => {
      const subject = testUser.username;
      const payload = { id: testUser.id, username: testUser.username };
      return supertest(app)
        .put(endpointPath)
        .set('Authorization', TestHelpers.makeAuthHeader(testUser))
        .expect(200, { anonygramAuthToken: AuthService.createJWT(subject, payload) });
    });
  });
});
