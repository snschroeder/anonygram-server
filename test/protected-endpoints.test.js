const app = require('../src/app');
const TestHelpers = require('./test-helpers');

describe('Protected Endpoints', function() {
  let db = TestHelpers.setupTestDB(app);
  const mockUsers = TestHelpers.mockUsers();
  const mockSubmissions = TestHelpers.mockSubmissions();

  /*****************************************************************
    SETUP
  ******************************************************************/
  before('cleanup', () => TestHelpers.truncateAllTables(db));

  afterEach('cleanup', () => TestHelpers.truncateAllTables(db));

  after('disconnect from db', () => db.destroy());

  /*****************************************************************
    test all protected endpoints
  ******************************************************************/
  beforeEach('insert users and submissions', async () => {
    await TestHelpers.seedUsers(db, mockUsers);
    await TestHelpers.seedSubmissions(db, mockSubmissions);
  });

  const protectedEndpoints = [
    {
      name: 'PATCH /api/images/:submission_id',
      path: '/api/images/1',
      method: supertest(app).patch,
    },
    {
      name: 'DELETE /api/images/:submission_id',
      path: '/api/images/1',
      method: supertest(app).delete,
    },
    {
      name: 'POST /api/comments/:submission_id',
      path: '/api/comments/1',
      method: supertest(app).post,
    },
    {
      name: 'PUT /api/auth/',
      path: '/api/auth/',
      method: supertest(app).put,
    },
  ];

  context('Given Invalid Auth', () => {
    const expectedMsg1 = 'missing bearer token';
    const expectedMsg2 = 'unauthorized request';
    protectedEndpoints.forEach((endpoint) => {
      describe(endpoint.name, () => {
        it(`responds 401 "${expectedMsg1}" when no bearer token`, () => {
          return endpoint.method(endpoint.path).expect(401, { error: expectedMsg1 });
        });

        it(`responds 401 "${expectedMsg2}" when invalid JWT secret`, () => {
          const validUser = mockUsers[0];
          const invalidSecret = 'bad-secret';
          return endpoint
            .method(endpoint.path)
            .set('Authorization', TestHelpers.makeAuthHeader(validUser, invalidSecret))
            .expect(401, { error: expectedMsg2 });
        });

        it(`responds 401 "${expectedMsg2}" when invalid payload subject`, () => {
          const invalidUser = { username: 'user-not-existy', id: 1 };
          return endpoint
            .method(endpoint.path)
            .set('Authorization', TestHelpers.makeAuthHeader(invalidUser))
            .expect(401, { error: expectedMsg2 });
        });
      });
    });
  });
});
