process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';

require('dotenv').config();
const chai = require('chai');
chai.use(require('chai-fs'));
const supertest = require('supertest');

global.chai = chai;
global.supertest = supertest;
