'use strict';

var express = require('express');
var config = require('config');
var http = require('http').Server(app);
// var io = require('socket.io')(server);
var io = require('socket.io')(http);
var marklogic = require('marklogic');
var _ = require('lodash');

// create connection to marklogic
var db = marklogic.createDatabaseClient(config.marklogic.connection);

var app = express();

app.use(express.static(__dirname + '/public'));

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
// var socketTimer = setInterval(function () {
//   if (!_.isEmpty(ads)) {
//     serveRandomAd();
//   }
// }, config.socket.interval);

// serves random ad
var serveRandomAd = function () {
  var ad = _.sample(ads);
  console.log('emitting ad:', ad);
  io.emit('advert', ad);
};

// serves ad by ad id
var serveAd = function (id) {
  console.log('finding ad:', id);
  // var ad = _.find(ads, _.property('id', id));
  var ad = _.find(ads, function (currAd) {
    return currAd.id == id;
  });
  console.log('returning ad:', ad);
  io.emit('advert', ad);
  return ad;
};

// trigger management
app.get('/connect', function (req, res, next) {
  res.sendFile(__dirname + '/public/connect.html');
});

// format: /trigger?id=14
app.all('/trigger', function (req, res, next) {
  var id = req.query.id;
  console.log('trigger ad:', id);
  var ad = serveAd(id) || null;
  if (ad) {
    res.send({
      status: 200,
      ad: ad
    });
  } else {
    res.send({
      status: 400
    });
  }
});

app.get('/', function (req, res, next) {
  res.sendFile(__dirname = '/public/index.html');
});

app.get('*', function (req, res) {
  res.sendFile(__dirname + '/public/error.html');
});

// start http server (express)
app.listen(config.app.port, function () {
  console.log('Server listening on: ' + config.app.port);
});

// start socket server (http)
http.listen(config.socket.port, function () {
  console.log('Socket listening on: ' + config.socket.port);
});
