require('newrelic');

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

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query('select id,quote from quotes ORDER BY random() limit 1');

    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

app.get('/v1/quotes', (req, res, next) => {
  const results = [];

  pg.connect(connectionString, (err, client, done) => {

    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    const query = client.query('select id,quote from quotes ORDER BY id ASC');

    query.on('row', (row) => {
      results.push(row);
    });

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

      const data = {quote: req.body.quote};

      pg.connect(connectionString, (err, client, done) => {

        if(err) {
          done();
          console.log("[ERROR]"+err);
          return res.status(500).json({success: false, data: err});
        }

        client.query('INSERT INTO quotes(quote) values($1)',
        [data.quote]);

        const query = client.query('SELECT id,quote FROM quotes ORDER BY id ASC');

        query.on('row', (row) => {
          results.push(row);
        });

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
        const id = req.params.quote_id;
        const data = {quote: req.body.quote};

        pg.connect(connectionString, (err, client, done) => {
          // Handle connection errors
          if(err) {
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err});
          }

          client.query('UPDATE quotes SET quote=($1) WHERE id=($2)',
          [data.quote, id]);

          const query = client.query("SELECT id,quote FROM quotes ORDER BY id ASC");

          query.on('row', (row) => {
            results.push(row);
          });

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

        const id = req.params.quote_id;

        pg.connect(connectionString, (err, client, done) => {

          if(err) {
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err});
          }

          client.query('DELETE FROM quotes WHERE id=($1)', [id]);

          var query = client.query('SELECT id,quote FROM quotes ORDER BY id ASC');

          query.on('row', (row) => {
            results.push(row);
          });

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
