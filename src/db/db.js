import knex from 'knex';
import knexConfig from './knexfile.js';

const env = process.env.NODE_ENV || 'dev';
const db = knex(knexConfig[env]);

export default db;
