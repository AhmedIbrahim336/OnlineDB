const express = require('express');
const cors = require('cors');
const colros = require('colors');
const databaseRouter = require('./routes/database');
const errorHandler = require('./middlewares/error');
const collectionRouter = require('./routes/collection');
const ErrorResponse = require('./utils/ErrorResponse');

const { applyCtx } = require('./middlewares/context');

const startServer = context => {
  const app = express();

  // access from anoter port
  app.use(cors());

  // To allow write data to the server
  app.use(express.json());

  app.use((req, res, next) => {
    req.context = context;
    next();
  });

  // inject the database info
  app.use(applyCtx);

  // API Routes
  app.use('/api/v1', databaseRouter);
  app.use('/api/v1', collectionRouter);

  // Error Handling
  app.use(errorHandler);
  const PORT = 9000;
  app.listen(PORT, () =>
    console.log(`Visualize you database on  http://localhost:${PORT} `.bgGreen)
  );
};

module.exports = {
  startServer,
};
