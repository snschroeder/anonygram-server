require('dotenv').config();
const { removeFromS3 } = require('../utils/file-util');
const app = require('../app');

// to execute the job:
// node -e 'require("./src/jobs/expiration-job").purge()'

function purge(days = 7) {
  const db = app.get('db');
  db('submission')
    .whereRaw(`create_timestamp < NOW() - INTERVAL '${days} DAYS'`)
    .del()
    .returning('*')
    .then(async (rows) => {
      try {
        await Promise.all(
          rows.map(async (row) => {
            const url = row.image_url;
            const s3ObjectKey = url.substring(url.lastIndexOf('/') + 1);
            await removeFromS3(s3ObjectKey);
          })
        );
      } catch (error) {
        console.error(error);
      }
    })
    .then(() => process.exit());
}

module.exports = {
  purge,
};
