const express = require('express');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./api/subscription.routes');
const { notFoundHandler, globalErrorHandler } = require('./api/middlewares/error.handler');
const scannerService = require('./core/services/scanner.service');
const Logger = require('./core/utils/logger');

const swaggerPath = path.join(__dirname, 'api', 'swagger.yaml');
const swaggerDocument = yaml.load(swaggerPath);
const db = require('./db/db');
const loggingMiddleware = require('./api/middlewares/logging.middleware');

swaggerDocument.host = `localhost:${process.env.PORT || 3000}`; // TODO:

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(loggingMiddleware);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'GitPulse API is running' });
});

app.use('/api', apiRoutes);
app.use(notFoundHandler);
app.use(globalErrorHandler);

const startServer = async () => {
  try {
    Logger.log('Bootstrap', 'Running migrations...');
    await db.migrate.latest();
    Logger.log('Bootstrap', 'Migrations completed successfully');

    // Запуск фонового сканера
    scannerService.init();

    app.listen(PORT, () => {
      Logger.log('Bootstrap', `Server is running on http://localhost:${PORT}`);
      Logger.log('Bootstrap', `Swagger UI available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    Logger.error('Bootstrap', `Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
