const { Pool } = require('pg');
const logger = require('../config/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
module.exports = {
  query: (text, params, callback) => pool.query(text, params, (err, res) => {
    callback(err, res);
  }),
  getClient: (callback) => {
    pool.connect((err, client, done) => {
      const { query } = client;
      // monkey patch the query method to keep track of the last query executed
      client.query = (...args) => {
        client.lastQuery = args;
        return query.apply(client, args);
      };
      // set a timeout of 5 seconds, after which we will log this client's last query
      const timeout = setTimeout(() => {
        logger.error('[POSTGRES] A client has been checked out for more than 5 seconds!');
        logger.error(`POSTGRES] The last executed query on this client was: ${client.lastQuery}`);
      }, 5000);
      const release = (err) => {
        // call the actual 'done' method, returning this client to the pool
        done(err);
        // clear our timeout
        clearTimeout(timeout);
        // set the query method back to its old un-monkey-patched version
        client.query = query;
      };
      callback(err, client, release);
    });
  },
};
