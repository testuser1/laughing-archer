
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , everyauth = require('everyauth')
  , init_everyauth = require('./init-everyauth.js')
  , request = require('request')
  , sys = require('sys');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  init_everyauth(everyauth);
  app.set('everyauth', everyauth);
  app.use(everyauth.middleware(app));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

app.get('/google/*', function(req, res){
  var url = req.url.replace('/google/', '').split('/');
  //console.log()
  res.send(sys.inspect(url));
});

// super useful, check this https://github.com/JimmyBoh/node-google-api
// https://github.com/berryboy/google-calendar/blob/master/GoogleCalendar.js
app.get('/1google/calendar/getlist', function(req, res){

  if (!everyauth.google.user || !everyauth.google.user.accessToken)
    return res.send('');

  // https://github.com/mikeal/request
  request.get('https://www.googleapis.com/calendar/v3/users/me/calendarList?access_token='+everyauth.google.user.accessToken
    , function(err, res2, body) { 
      console.log(JSON.parse(body));
      res.send(body);
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

module.exports = app;