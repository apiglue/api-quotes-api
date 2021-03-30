require('./config/newrelic');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const path = require('path');
const helmet = require('helmet');

const { body, validationResult } = require('express-validator');

const dbClient = require('./db/postgres');
const { logger, pinoHttp } = require('./config/logger');
const { validateJwt, checkJwtScope, auth0Scopes } = require('./config/auth0');

const port = process.env.PORT || 3000;

const app = express();

app.use('/oas', express.static(path.join(__dirname, 'public')));
app.use(helmet());
app.use(pinoHttp);
app.use(express.json());

// NON-SECURED ROUTES
app.get('/v1/quotes/random/lametric', (req, res, next) => {
  dbClient.query('SELECT id,quote FROM quotes ORDER BY random() limit 1', (err, results) => {
    if (err) {
      logger.error(`Query error: ${err}`);
      return res.status(500).send();
    }
    if (!results) {
      logger.info('no results');
      return res.status(404).send();
    }

    return res.json({ frames: [{ text: results.rows[0].quote, icon: 25027 }] });
  });
});
app.get('/v1/quotes/random', (req, res, next) => {
  dbClient.query('SELECT id,quote FROM quotes ORDER BY random() limit 1', (err, results) => {
    if (err) {
      logger.error(`Query error: ${err}`);
      return res.status(500).send();
    }
    if (!results) {
      logger.info('no results');
      return res.status(404).send();
    }

    return res.json(results.rows[0]);
  });
});

// SECURED ENDPOINTS
app.get('/v1/quotes', validateJwt(), checkJwtScope(auth0Scopes.readOnly), (req, res, next) => {
  dbClient.query('SELECT id,quote FROM quotes ORDER BY id ASC', (err, results) => {
    if (err) {
      logger.error(`Query error: ${err}`);
      return res.status(500).send();
    }
    if (!results) {
      logger.info('no results');
      return res.status(404).send();
    }

    return res.json(results.rows);
  });
});
app.post('/v1/quotes', body('quote').isString(), validateJwt(), checkJwtScope(auth0Scopes.readWrite), (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json();
  }

  dbClient.query('INSERT INTO quotes(quote) values($1) RETURNING id', [req.body.quote], (err, results) => {
    if (err) {
      logger.error(`Query error: ${err}`);
      return res.status(500).send();
    }
    const newlyCreatedQuoteId = results.rows[0].id;
    return res.status(201).header({ Location: `/v1/quotes/${newlyCreatedQuoteId}` }).send();
  });
});
app.get('/v1/quotes/:quoteId([0-9]+)', validateJwt(), checkJwtScope(auth0Scopes.readOnly), (req, res, next) => {
  const { quoteId } = req.params;

  dbClient.query('SELECT id, quote FROM quotes WHERE id = ($1)', [quoteId], (err, results) => {
    if (err) {
      logger.error(`Query error: ${err}`);
      return res.status(500).send();
    }
    if (!results) {
      logger.info('no results');
      return res.status(404).send();
    }

    return res.json(results.rows);
  });
});
app.put('/v1/quotes/:quoteId([0-9]+)', validateJwt(), checkJwtScope(auth0Scopes.readWrite), body('quote').isString(), (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json();
  }

  const { quoteId } = req.params;
  const { quote } = req.body;

  dbClient.query('UPDATE quotes SET quote=($1) WHERE id=($2)', [quote, quoteId], (err) => {
    if (err) {
      logger.error(`Query error: ${err}`);
      return res.status(500).send();
    }
    return res.status(204).send();
  });
});
app.delete('/v1/quotes/:quoteId([0-9]+)', validateJwt(), checkJwtScope(auth0Scopes.readWrite), (req, res, next) => {
  const { quoteId } = req.params;
  dbClient.query('DELETE FROM quotes WHERE id=($1)', [quoteId], (err) => {
    if (err) {
      logger.error(`Query error: ${err}`);
      return res.status(500).send();
    }
    return res.status(204).send();
  });
});

app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send('invalid token');
  }
});

// RUN
app.listen(port);
logger.info(`Server up on port: ${port}`);
