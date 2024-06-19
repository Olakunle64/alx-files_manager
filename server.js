const express = require('express');
// import router from './routes/index';
const routes = require('./routes');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use('/', routes);
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
