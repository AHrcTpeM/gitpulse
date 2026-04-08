const express = require('express');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./api/subscription.routes');
const { notFoundHandler, globalErrorHandler } = require('./api/error.handler');
const scannerService = require('./core/services/scanner.service');

const swaggerPath = path.join(__dirname, 'api', 'swagger.yaml');
const swaggerDocument = yaml.load(swaggerPath);
const db = require('./db/db');

swaggerDocument.host = `localhost:${process.env.PORT || 3000}`; // TODO:

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'GitPulse API is running' });
});

app.use('/api', apiRoutes);
app.use(notFoundHandler);
app.use(globalErrorHandler);

const startServer = async () => {
  try {
    console.log('Running migrations...');
    await db.migrate.latest();
    console.log('Migrations completed successfully.');
    
    // Запуск фонового сканера
    scannerService.init();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
