require('newrelic');

require('dotenv').config();

var express = require('express');
var bodyParser = require('body-parser')
var pg = require('pg');
var fs = require('fs');

const port = process.env.PORT || 3000;
const connectionString = process.env.DATABASE_URL;
const localApiKey = process.env.API_KEY;

const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


app.route('/swagger')
  .get(function (req, res, next)  {

    var file="swagger.json";
    
    if(!fs.existsSync(file)) {
      console.log("File not found");
      return res.status(500).send();
    }

      // Read the file and do anything you want
    var  content = fs.readFileSync(file, 'utf-8');
    
    return res.status(200).send(JSON.parse(content)); 


});

app.route('/v1/quotes/lametric/random')
  .get(function (req, res, next)  {
    
      const results = [];

      pg.connect(connectionString, (err, client, done) => {

        if(err) {
          done();
          console.log(err);
          return res.status(500).send();
        }

        var query = client.query('SELECT id,quote FROM quotes ORDER BY random() limit 1');               
        
        query.on('error', function(err) {
          console.log('Query error: ' + err);
          return res.status(500).send();
        });

        query.on('row', (row) => {
          results.push(row);
        });

        query.on('end', function(result){
          if(result.rowCount==0) {
            done();
            return res.status(404).send();
          }
          done();
          return res.json({frames:[{text:results[0].quote,icon:25027}]});
        });
      });      
  });

app.route('/v1/quotes/random')
  .get(function (req, res, next)  {
    
      const results = [];

      pg.connect(connectionString, (err, client, done) => {

        if(err) {
          done();
          console.log(err);
          return res.status(500).send();
        }

        var query = client.query('SELECT id,quote FROM quotes ORDER BY random() limit 1');               
        
        query.on('error', function(err) {
          console.log('Query error: ' + err);
          return res.status(500).send();
        });

        query.on('row', (row) => {
          results.push(row);
        });

        query.on('end', function(result){
          if(result.rowCount==0) {
            done();
            return res.status(404).send();
          }
          done();
          return res.json(results);
        });
      });      
  });

 // APIKEY required for all other methods
app.use(function (req, res, next) {
  if (req.header('apikey') == localApiKey) {
      next();
  }
  else {
        res.status(401);
        res.json({message: 'invalid api key'});
      }
});
app.route('/v1/quotes')
  .get(function (req, res, next) {
      const results = [];

      pg.connect(connectionString, (err, client, done) => {

        if(err) {
          done();
          console.log(err);
          return res.status(500).send();
        }

        var query = client.query('SELECT id,quote FROM quotes ORDER BY id ASC');
        
        query.on('error', function(err) {
          console.log('Query error: ' + err);
          return res.status(500).send();
        });

        query.on('row', (row) => {
          results.push(row);
        });

        query.on('end', function(result){
          if(result.rowCount==0) {
            done();
            return res.status(404).send();
          }
          done();
          return res.json(results);
        });

      });
  })
  .post(function (req, res, next) {

      if (!req.body.quote)
      {
        return res.status(412).json({error: "Quote not found on body"});
      }

      const results = [];
      const data = {quote: req.body.quote};

      pg.connect(connectionString, (err, client, done) => {

        if(err) {
          done();
          console.log("[ERROR]"+err);
          return res.status(500).send();
        }

        var query = client.query('INSERT INTO quotes(quote) values($1)',[data.quote]);
        
        query.on('error', function(err) {
          console.log('Query error: ' + err);
          return res.status(500).send();
        });

        return res.status(201).send();
   
      });
  });

app.route('/v1/quotes/:quote_id([0-9]+)')
  .get(function (req, res, next)  {

      const results = [];
      const quote_id = req.params.quote_id;

      pg.connect(connectionString, (err, client, done) => {

        if(err) {
          done();
          console.log(err);
          return res.status(500).send();
        }           

        var query = client.query('SELECT id,quote FROM quotes WHERE id=($1)',[quote_id]);

        query.on('error', function(err) {
          console.log('Query error: ' + err);
          return res.status(500).send();
        });

        query.on('row', (row) => {
          results.push(row);
        });

        query.on('end', function(result){
          if(result.rowCount==0) {
            done();
            return res.status(404).send();
          }
          done();
          return res.json(results);
        });
      });

  })
  .put(function (req, res, next) {
      
      if (!req.body.quote)
      {
         return res.status(412).send();
      }

      const results = [];
      const id = req.params.quote_id;
      const data = {quote: req.body.quote};

      pg.connect(connectionString, (err, client, done) => {
        // Handle connection errors
        if(err) {
          done();
          console.log(err);
          return res.status(500).send();
        }

        client.query('UPDATE quotes SET quote=($1) WHERE id=($2)',[data.quote, id]);

        const query = client.query("SELECT id,quote FROM quotes ORDER BY id ASC");

        query.on('row', (row) => {
          results.push(row);
        });

        query.on('end', function() {
          done();
           return res.status(204).send();
        });
      });
    
  })
  .delete(function (req, res, next) {
      
      const results = [];

      const id = req.params.quote_id;

      pg.connect(connectionString, (err, client, done) => {

        if(err) {
          done();
          console.log(err);
          return res.status(500).send();
        }

        const query = client.query('DELETE FROM quotes WHERE id=($1)', [id]);
        
        query.on('end', function() {
          done();
           return res.status(204).send();
        });        

      });
  });

//RUN
app.listen(port);
console.log('Server up on port: ' + port);
