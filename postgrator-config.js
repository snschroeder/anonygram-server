require('dotenv').config();

module.exports = {
  migrationDirectories: 'migrations',
  driver: 'pg',
  connectionString:
    process.env.NODE_ENV === 'test'
      ? process.env.TEST_DB_URL
      : process.env.DATABASE_URL,
  ssl: !!process.env.SSL,
};
