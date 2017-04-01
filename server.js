require('newrelic');

require('dotenv').config();

var express = require('express');
var bodyParser = require('body-parser')
var pg = require('pg');

const port = process.env.PORT;
const connectionString = process.env.DATABASE_URL;
const localApiKey = process.env.API_KEY;

const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.route('/v1/quotes')
  .post(function (req, res, next) {

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

          client.query('INSERT INTO quotes(quote) values($1)',[data.quote]);

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


  })
  .get(function (req, res, next) {
      if (req.header('apikey') == localApiKey)
      {
          const results = [];

          pg.connect(connectionString, (err, client, done) => {

            if(err) {
              done();
              console.log(err);
              return res.status(500).json({success: false, data: err});
            }

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

app.route('/v1/quotes/:quote_id([0-9]+)')
  .get(function (req, res, next)  {

      const results = [];
      const quote_id = req.params.quote_id;

      pg.connect(connectionString, (err, client, done) => {

        if(err) {
          done();
          console.log(err);
          return res.status(500).json({success: false, data: err});
        }           

        if (quote_id=='random')
        {
          var query = client.query('SELECT id,quote FROM quotes ORDER BY random() limit 1');               
        }
        else
        {
          var query = client.query('SELECT id,quote FROM quotes WHERE id=($1)',[quote_id]);
        }

        query.on('row', (row) => {
          results.push(row);
        });

        query.on('end', () => {
          done();
          return res.json(results);
        });
      });

  })
  .put(function (req, res, next) {
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

            client.query('UPDATE quotes SET quote=($1) WHERE id=($2)',[data.quote, id]);

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
  })
  .delete(function (req, res, next) {
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

app.route('/v1/quotes/random')
  .get(function (req, res, next)  {
    
      const results = [];
      const quote_id = req.params.quote_id;

      pg.connect(connectionString, (err, client, done) => {

        if(err) {
          done();
          console.log(err);
          return res.status(500).json({success: false, data: err});
        }

        var query = client.query('SELECT quote FROM quotes ORDER BY random() limit 1');               

        query.on('row', (row) => {
          results.push(row);
        });

        query.on('end', () => {
          done();
          return res.json(results);
        });
      });      
  });


app.listen(port);
