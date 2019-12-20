require('dotenv').config();
const app = require('../app');

// to execute the job:
// node -e 'require("./src/jobs/resetkarma-job").resetKarma()'

function resetKarma() {
  const db = app.get('db');
  db('users')
    .update({ karma_balance: 25 })
    .then(() => process.exit());
}

module.exports = {
  resetKarma,
};
