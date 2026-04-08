const knex = require('knex');
const knexConfig = require('./knexfile');

const env = process.env.NODE_ENV || 'dev';
const db = knex(knexConfig[env]);

module.exports = db;
