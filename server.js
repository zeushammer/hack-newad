'use strict';

var express = require('express');
var config = require('config');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var marklogic = require('marklogic');
var _ = require('lodash');

// create connection to marklogic
var db = marklogic.createDatabaseClient(config.marklogic.connection);

var app = express();

io.on('connection', function (socket) {
  console.log('a user connected');
  socket.on('disconnect', function () {
    console.log('a user disconnected');
  })
});

var ads;

// load adverts
db.documents.read('/docs/ads.json').result(function (document) {
  ads = document[0].content;
});

// socket timer
var socketTimer = setInterval(function () {
  if (!_.isEmpty(ads)) {
    serveAd();
  }
}, config.socket.interval);

// serve ad
var serveAd = function () {
  var ad = _.sample(ads);
  console.log('emitting ad:', ad);
  io.emit('advert', ad);
};

app.get('*', function (req, res) {
  res.sendfile('public/index.html');
});

app.listen(config.app.port, function () {
  console.log('Server running at: ' + config.app.port);
});
