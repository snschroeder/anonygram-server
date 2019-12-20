const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Comments Endpoints', () => {
  let db = helpers.setupTestDB(app);
  const mockUsers = helpers.mockUsers();
  const mockSubmissions = helpers.mockSubmissions();
  const mockComments = helpers.mockComments();

  // ensure clean db tables for tests before, and after every test runs
  before('clean db', () => helpers.truncateAllTables(db));
  afterEach('clean db', () => helpers.truncateAllTables(db));
  after('kill db connection', () => db.destroy());

  // seed db with data
  beforeEach('insert users, submissions, and comments', async () => {
    await helpers.seedUsers(db, mockUsers);
    await helpers.seedSubmissions(db, mockSubmissions);
    await helpers.seedComments(db, mockComments);
  });
  it('GET return 404 when invalid submission id param', () => {
    return supertest(app)
      .get('/api/comments/9999999')
      .expect(404, { error: { message: 'Submission does not exist' } });
  });
  it('GET returns 200 and returns comments for given id', () => {
    const expectedComments = [
      {
        comment_id: 'b398a65c-b219-4a52-aa54-3423e70aaecf',
        comment_text: 'some comment 3',
        submission_id: 1,
        user_id: '53d25d5f-a033-40b3-a253-84172a514973',
      },
      {
        comment_id: '3d6e2144-57bd-43a7-a8f0-d690a5e491d0',
        comment_text: 'some comment 1',
        submission_id: 1,
        user_id: '53d25d5f-a033-40b3-a253-84172a514973',
      },
      {
        comment_id: '066c875c-248c-4c54-8e29-fd1af2579877',
        comment_text: 'some comment 2',
        submission_id: 1,
        user_id: 'cc5fe585-8682-4499-a04e-6255b42116c1',
      },
    ];

    return supertest(app)
      .get('/api/comments/1')
      .expect(200)
      .then((res) => {
        chai
          .expect(res.body[0])
          .to.have.keys([
            'comment_id',
            'comment_text',
            'submission_id',
            'user_id',
            'comment_timestamp',
          ]);
        const results = res.body.map((comment) => {
          delete comment.comment_timestamp;
          return comment;
        });
        chai.expect(results).to.be.a('array');
        chai.expect(results).to.eql(expectedComments);
      });
  });
  it('POST returns 400 and error when missing valid bearer token', () => {
    const testComment = {
      comment_text: 'some test comment',
      submission_id: 1,
      user_id: '53d25d5f-a033-40b3-a253-84172a514973',
    };

    return supertest(app)
      .post('/api/comments/1')
      .send(testComment)
      .expect(401, { error: 'missing bearer token' });
  });
  it('POST returns 201 and new comment is created', () => {
    const testComment = {
      comment_text: 'some test comment',
      submission_id: 1,
      user_id: '53d25d5f-a033-40b3-a253-84172a514973',
    };

    return supertest(app)
      .post('/api/comments/1')
      .set('Authorization', helpers.makeAuthHeader(mockUsers[0]))
      .send(testComment)
      .expect(201)
      .then((res) => {
        chai
          .expect(res.body)
          .to.have.keys(
            'comment_id',
            'comment_text',
            'comment_timestamp',
            'submission_id',
            'user_id'
          );
        chai.expect(res.body).to.include(testComment);
      });
  });
  const postParams = {
    user_id: '53d25d5f-a033-40b3-a253-84172a514973',
    comment_text: 'some text',
  };

  Object.keys(postParams).forEach((param) => {
    it(`POST returns 400 when ${param} not provided`, () => {
      const testBody = postParams;
      delete testBody[param];
      return supertest(app)
        .post('/api/comments/1')
        .set('Authorization', helpers.makeAuthHeader(mockUsers[0]))
        .send(testBody)
        .expect(400, { error: { message: `Missing '${param}' in request body` } });
    });
  });
  it('POST sanitizes malicious inputs', () => {
    const maliciousBody = {
      user_id: '53d25d5f-a033-40b3-a253-84172a514973',
      comment_text: `<img src="javascript:alert('yo')" />`,
    };

    return supertest(app)
      .post('/api/comments/1')
      .set('Authorization', helpers.makeAuthHeader(mockUsers[0]))
      .send(maliciousBody)
      .then((res) => chai.expect(res.body.comment_text).to.eql(`<img src />`));
  });
});
