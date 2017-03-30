require('dotenv').config();

var express = require('express');
var bodyParser = require('body-parser')
var pg = require('pg');

const port = process.env.PORT;
const connectionString = process.env.DATABASE_URL;
const localApiKey = process.env.API_KEY;

const app = express();
const router = express.Router();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


app.get('/v1/quotes/random', (req, res, next) => {
  const results = [];
  // Get a Postgres client from the connection pool
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('select id,quote from quotes ORDER BY random() limit 1');
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

app.get('/v1/quotes', (req, res, next) => {
  const results = [];
  // Get a Postgres client from the connection pool
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('select id,quote from quotes ORDER BY id ASC');
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

app.post('/v1/quotes', (req, res, next) => {

    if (req.header('apikey') == localApiKey)
     {
      const results = [];
      // Grab data from http request
      const data = {quote: req.body.quote};
      // Get a Postgres client from the connection pool

      pg.connect(connectionString, (err, client, done) => {
        // Handle connection errors
        if(err) {
          done();
          console.log("[ERROR]"+err);
          return res.status(500).json({success: false, data: err});
        }
        // SQL Query > Insert Data
        client.query('INSERT INTO quotes(quote) values($1)',
        [data.quote]);
        // SQL Query > Select Data
        const query = client.query('SELECT * FROM quotes ORDER BY id ASC');
        // Stream results back one row at a time
        query.on('row', (row) => {
          results.push(row);
        });
        // After all data is returned, close connection and return results
        query.on('end', () => {
          done();
          return res.json(results);
        });
      });
    }

  else 
    {
        res.json({message: 'invalid key'});
    }


});

app.put('/v1/quotes/:quote_id', (req, res, next) => {
  if (req.header('apikey') == localApiKey)
      {
        const results = [];
        // Grab data from the URL parameters
        const id = req.params.quote_id;
        // Grab data from http request
        const data = {quote: req.body.quote};
        // Get a Postgres client from the connection pool
        pg.connect(connectionString, (err, client, done) => {
          // Handle connection errors
          if(err) {
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err});
          }
          // SQL Query > Update Data
          client.query('UPDATE quotes SET quote=($1) WHERE id=($2)',
          [data.quote, id]);
          // SQL Query > Select Data
          const query = client.query("SELECT * FROM quotes ORDER BY id ASC");
          // Stream results back one row at a time
          query.on('row', (row) => {
            results.push(row);
          });
          // After all data is returned, close connection and return results
          query.on('end', function() {
            done();
            return res.json(results);
          });
        });
      }
      else 
      {
          res.json({message: 'invalid key'});
      }     
});

app.delete('/v1/quotes/:quote_id', (req, res, next) => {
     if (req.header('apikey') == localApiKey)
     {
        const results = [];
        // Grab data from the URL parameters
        const id = req.params.quote_id;
        // Get a Postgres client from the connection pool
        pg.connect(connectionString, (err, client, done) => {
          // Handle connection errors
          if(err) {
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err});
          }
          // SQL Query > Delete Data
          client.query('DELETE FROM quotes WHERE id=($1)', [id]);
          // SQL Query > Select Data
          var query = client.query('SELECT * FROM quotes ORDER BY id ASC');
          // Stream results back one row at a time
          query.on('row', (row) => {
            results.push(row);
          });
          // After all data is returned, close connection and return results
          query.on('end', () => {
            done();
            return res.json(results);
          });
        });
     }
    else 
    {
        res.json({message: 'invalid key'});
    }
});

app.listen(port);
