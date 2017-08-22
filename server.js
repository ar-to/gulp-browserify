const express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  path = require('path');

app.use(bodyParser.urlencoded({ extended : true }));

app.use(express.static('www'));

app.listen(3000, function() {
  console.log('Listening on port 3000');
});