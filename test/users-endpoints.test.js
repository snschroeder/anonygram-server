const app = require('../src/app');
const TestHelpers = require('./test-helpers');
const bcryptjs = require('bcryptjs');

describe('Users Endpoints', () => {
  let db = TestHelpers.setupTestDB(app);
  const mockUsers = TestHelpers.mockUsers();
  const testUser = mockUsers[0];
  const endpointPath = '/api/users';

  /*****************************************************************
    SETUP
  ******************************************************************/
  before('cleanup', () => TestHelpers.truncateAllTables(db));

  afterEach('cleanup', () => TestHelpers.truncateAllTables(db));

  after('disconnect from db', () => db.destroy());

  /*****************************************************************
    POST /api/users (User Registration)
  ******************************************************************/
  describe(`POST ${endpointPath} (User Registration)`, () => {
    beforeEach('insert users', () => TestHelpers.seedUsers(db, mockUsers));

    const requiredFields = ['username', 'password'];
    const expectedMsg1 = 'username and password are required';
    requiredFields.forEach((field) => {
      const registrationAttemptBody = {
        username: 'test_user',
        password: 'password',
      };

      it(`responds 400 "${expectedMsg1}" when '${field}' is missing`, () => {
        delete registrationAttemptBody[field];

        return supertest(app)
          .post(endpointPath)
          .send(registrationAttemptBody)
          .expect(400, { error: expectedMsg1 });
      });
    });

    context('Password Validation', () => {
      const expectedMsg1 = 'password must be longer than 8 characters';
      it(`responds 400 "${expectedMsg1}" when password is too short`, () => {
        const testRegistration = {
          username: 'test_user',
          password: '*'.repeat(7),
        };
        return supertest(app)
          .post(endpointPath)
          .send(testRegistration)
          .expect(400, { error: expectedMsg1 });
      });

      const expectedMsg2 = 'password must be less than 50 characters';
      it(`responds 400 "${expectedMsg2}" when password is too long`, () => {
        const testRegistration = {
          username: 'test_user',
          password: '*'.repeat(51),
        };
        return supertest(app)
          .post(endpointPath)
          .send(testRegistration)
          .expect(400, { error: expectedMsg2 });
      });

      const expectedMsg3 = 'password must not begin or end with whitespace';
      it(`responds 400 "${expectedMsg3}" when password begins with whitespace`, () => {
        const testRegistration = {
          username: 'test_user',
          password: ' '.concat('*'.repeat(7)),
        };
        return supertest(app)
          .post(endpointPath)
          .send(testRegistration)
          .expect(400, { error: expectedMsg3 });
      });

      it(`responds 400 "${expectedMsg3}" when password ends with whitespace`, () => {
        const testRegistration = {
          username: 'test_user',
          password: '*'.repeat(7).concat(' '),
        };
        return supertest(app)
          .post(endpointPath)
          .send(testRegistration)
          .expect(400, { error: expectedMsg3 });
      });

      const expectedMsg4 =
        'password must contain one upper case, lower case, number and special character';
      it(`responds 400 "${expectedMsg4}" when password is too simple`, () => {
        const testRegistration = {
          username: 'test_user',
          password: 'Aa123456',
        };
        return supertest(app)
          .post(endpointPath)
          .send(testRegistration)
          .expect(400, { error: expectedMsg4 });
      });
    });

    context('Username Validation', () => {
      const expectedMsg1 = 'username is invalid';
      it(`responds 400 "${expectedMsg1}" when username is already taken`, () => {
        const testRegistration = {
          username: testUser.username,
          password: 'Aa123456!',
        };
        return supertest(app)
          .post(endpointPath)
          .send(testRegistration)
          .expect(400, { error: expectedMsg1 });
      });

      it(`responds 400 "${expectedMsg1}" when username is too short`, () => {
        const testRegistration = {
          username: '*'.repeat(7),
          password: 'Aa123456!',
        };
        return supertest(app)
          .post(endpointPath)
          .send(testRegistration)
          .expect(400, { error: expectedMsg1 });
      });

      it(`responds 400 "${expectedMsg1}" when username is too long`, () => {
        const testRegistration = {
          username: '*'.repeat(51),
          password: 'Aa123456!',
        };
        return supertest(app)
          .post(endpointPath)
          .send(testRegistration)
          .expect(400, { error: expectedMsg1 });
      });

      it(`responds 400 "${expectedMsg1}" when username begins with whitespace`, () => {
        const testRegistration = {
          username: ' '.concat('*'.repeat(7)),
          password: 'Aa123456!',
        };
        return supertest(app)
          .post(endpointPath)
          .send(testRegistration)
          .expect(400, { error: expectedMsg1 });
      });

      it(`responds 400 "${expectedMsg1}" when username ends with whitespace`, () => {
        const testRegistration = {
          username: '*'.repeat(7).concat(' '),
          password: 'Aa123456!',
        };
        return supertest(app)
          .post(endpointPath)
          .send(testRegistration)
          .expect(400, { error: expectedMsg1 });
      });
    });

    context('Given Valid Registration', () => {
      it('responds 201 with { id, username }', () => {
        const testRegistration = {
          username: '*'.repeat(8),
          password: 'Aa123456!',
        };
        return supertest(app)
          .post(endpointPath)
          .send(testRegistration)
          .expect(201)
          .expect((res) => {
            chai.expect(res.body).to.have.property('id');
            chai.expect(res.body).to.have.property('username');
            chai.expect(res.body).to.not.have.property('password');
            chai.expect(res.body.id).to.have.lengthOf(36);
            chai.expect(res.body.username).to.eql(testRegistration.username);
          });
      });

      it('stores the new user in database with a hashed password', () => {
        const testRegistration = {
          username: '*'.repeat(8),
          password: 'Aa123456!',
        };
        return supertest(app)
          .post(endpointPath)
          .send(testRegistration)
          .expect((res) => {
            const { id } = res.body;
            db('users')
              .select('*')
              .where({ id })
              .first()
              .then(async (row) => {
                const { username, password } = row;
                chai.expect(username).to.eql(testRegistration.username);
                let matchingPasswords = await bcryptjs.compare(
                  testRegistration.password,
                  password
                );
                chai.expect(matchingPasswords).to.be.true;
              });
          });
      });
    });
  });

  /*****************************************************************
    GET /api/users/:user_id
  ******************************************************************/
  describe(`GET ${endpointPath}/:user_id`, () => {
    beforeEach('insert users', () => TestHelpers.seedUsers(db, mockUsers));

    const expectedMsg1 = 'user does not exist';
    it(`responds 400 "${expectedMsg1}" when user doesn't exist in the database`, () => {
      return supertest(app)
        .get(`${endpointPath}/00000000-0000-0000-0000-000000000000`)
        .expect(400, { error: expectedMsg1 });
    });

    it('responds 200 with user data { id, karma_balance }', () => {
      return supertest(app)
        .get(`${endpointPath}/53d25d5f-a033-40b3-a253-84172a514973`)
        .expect(200)
        .then((res) => {
          const expectedUserData = { ...mockUsers[0] };
          delete expectedUserData['password'];
          delete expectedUserData['username'];
          expectedUserData.karma_balance = 25;
          chai.expect(res.body).to.eql(expectedUserData);
        });
    });
  });
});
