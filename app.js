
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
  , sys = require('sys')
  , redis_store = require('connect-redis')(express)
  , redis = require("redis").createClient();

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
  app.use(express.session({
    maxAge : new Date(Date.now() + 365*24*3600000) // 1y Session lifetime
    , store: new redis_store({client: redis})
  }));
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

app.get('/google*', function(req, res) {
  // console.log(req.session);
  var url = req._parsedUrl.pathname.replace('/google/', '').replace('/google', '').split('/');
  var api = app.set('google');
  //console.log()
  if (req.query.formatted)
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  if (!url.length || (url.length == 1 && url[0]=='')) return res.send(sys.inspect(api, false, null));

  // var dir = ''
  // var obj = api;
  // for ( ;dir = url.shift(); ) {
  //   obj = obj[dir];
  //   if (!obj) break;
  // }
  try {

    var name = url[0], resource = url[1], method = url[2], func;
    req.query.access_token = req.session.google.accessToken;///everyauth.google.user.accessToken;

    if (url.length < 3) {
      console.log(api[name]);
      if (typeof api[name] == 'function')
        func = api[name];
      else
        return res.send('false');
    } else {
      func = api[name][resource][method];
      console.log(url, api[name][resource][method].vars, req.query);    
    }

    return func(req.query, function(events) {
            res.send(sys.inspect(arguments, false, null));
          });
  } catch(e) { console.log(e) };
  res.send('false');
});

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

app.post('/auth/user', function(req, res){
  if (req.session && req.session.user)
    return res.send(req.session.user);
  res.send({});
});

app.post('/auth/login', function(req, res){

  var data = { 'assertion': req.body['assertion'], 'audience': 'http://local.example.com:3000' };
  var resp = request.post('https://verifier.login.persona.org/verify', { form: data }, function(err, res2, body){
    if (err) return res.status(500).send('');
    // console.log('login', body);
    var data = JSON.parse(body);
    req.session.user = data;
    console.log(req.session);
    res.send(data);
  });
});
 
app.post('/auth/logout', function(req, res){ 
  req.session.user = null;
  res.status(200).send('');
  //res.redirect('/')
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

var googleAPI = require('node-google-api')('AIzaSyBDhvE5ML9LMtLnaaT0WkK5xJBpaRWsO2g');
googleAPI.build(function(api) { app.set('google', api); sys.log('got google api') });

module.exports = app;