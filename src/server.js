const app = require('./app');
const { PORT } = require('./config');

app.listen(PORT, () => {
  console.log(`Now listening on  http://localhost:${PORT} ...`)
});
