import express from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import cors from 'cors';

import apiRoutes from './api/subscription.routes.js';
import { notFoundHandler, globalErrorHandler } from './api/middlewares/error.handler.js';
import scannerService from './core/services/scanner.service.js';
import Logger from './core/utils/logger.js';
import db from './db/db.js';
import loggingMiddleware from './api/middlewares/logging.middleware.js';
import metricsMiddleware from './api/middlewares/metrics.middleware.js';
import { register } from './core/utils/metrics.js';
import { startGrpcServer } from './grpc/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerPath = path.join(__dirname, 'api', 'swagger.yaml');
const swaggerDocument = yaml.load(swaggerPath);

const url = new URL(process.env.APP_URL);
swaggerDocument.host = url.host;
swaggerDocument.schemes = [url.protocol.replace(':', '')];

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = process.env.NODE_ENV === 'prod' ? { origin: process.env.APP_URL } : {};

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(loggingMiddleware);
app.use(metricsMiddleware);
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'GitPulse API is running' });
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

app.use('/api', apiRoutes);
app.use(notFoundHandler);
app.use(globalErrorHandler);

const startServer = async () => {
  try {
    Logger.log('Bootstrap', 'Running migrations...');
    await db.migrate.latest();
    Logger.log('Bootstrap', 'Migrations completed successfully');

    scannerService.init();
    startGrpcServer();

    app.listen(PORT, () => {
      Logger.log('Bootstrap', `Server is running on http://localhost:${PORT}`);
      Logger.log('Bootstrap', `Swagger UI available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    Logger.error('Bootstrap', `Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}

export default app;
