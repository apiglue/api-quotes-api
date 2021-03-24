require('newrelic');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const fs = require('fs');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const logger = require('./config/logger');
const dbClient = require('./db/postgres');

const port = process.env.PORT || 3000;
const localApiKey = process.env.API_KEY;

const app = express();

app.use(helmet());

app.use(express.json());// app.use(expressLogger);

app.get('/oas', (req, res, next) => {
  const file = 'swagger.json';

  if (!fs.existsSync(file)) {
    logger.error('Swagger file not found');
    return res.status(500).send();
  }

  // Read the file and do anything you want
  const content = fs.readFileSync(file, 'utf-8');

  return res.status(200).send(JSON.parse(content));
});

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

// APIKEY required for all other methods
app.use((req, res, next) => {
  if (req.header('apikey') === localApiKey) {
    next();
  } else {
    res.status(401);
    res.json({ message: 'invalid api key' });
  }
});
app.get('/v1/quotes', (req, res, next) => {
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
app.post('/v1/quotes', body('quote').isString(), (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json();
  }

  dbClient.query('INSERT INTO quotes(quote) values($1)', [req.body.quote], (err) => {
    if (err) {
      logger.error(`Query error: ${err}`);
      return res.status(500).send();
    }
    return res.status(201).send();
  });
});

app.get('/v1/quotes/:quote_id([0-9]+)', (req, res, next) => {
  const quoteId = req.params.quote_id;

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
app.put('/v1/quotes/:quote_id([0-9]+)', body('quote').isString(), (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json();
  }

  const id = req.params.quote_id;
  const { quote } = req.body;

  dbClient.query('UPDATE quotes SET quote=($1) WHERE id=($2)', [quote, id], (err) => {
    if (err) {
      logger.error(`Query error: ${err}`);
      return res.status(500).send();
    }
    return res.status(204).send();
  });
});
app.delete('/v1/quotes/:quote_id([0-9]+)', (req, res, next) => {
  const id = req.params.quote_id;
  dbClient.query('DELETE FROM quotes WHERE id=($1)', [id], (err) => {
    if (err) {
      logger.error(`Query error: ${err}`);
      return res.status(500).send();
    }
    return res.status(204).send();
  });
});

// RUN
app.listen(port);
logger.info(`Server up on port: ${port}`);
