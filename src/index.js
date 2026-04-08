const express = require('express');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./api/routes');
const { notFoundHandler, globalErrorHandler } = require('./api/errorHandler');

const swaggerPath = path.join(__dirname, 'api', 'swagger.yaml');
const swaggerDocument = yaml.load(swaggerPath);

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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});
