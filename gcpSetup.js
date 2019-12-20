require('dotenv').config()
const fs = require('fs')

fs.writeFile(
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
  process.env.GCP_FILE,
  err => {}
)
