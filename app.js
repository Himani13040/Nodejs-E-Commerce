var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressHbs = require('express-handlebars');
var mongoose = require('mongoose');
var session= require('express-session');
var passport = require('passport');
var flash = require('connect-flash');
var validator = require('express-validator');
var MongoStore = require('connect-mongo')(session);

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/ShoppingCart', function (err) {
  if(err){
    return console.log(err);
  }
  return console.log('Successfully connected to MongoDB');
});

require('./config/passport');

var index = require('./routes/index');
var user = require('./routes/user');

var app = express();

app.engine('.hbs',expressHbs({defaultLayout : 'layout', extname: '.hbs'}));
app.set('view engine', '.hbs');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(validator());
app.use(cookieParser());
app.use(session( {
  secret:'supersecret',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({mongooseConnection : mongoose.connection}),
  cookie: {maxAge: 180 * 60 * 1000}
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));

app.use(function (req, res, next) {
  res.locals.login= req.isAuthenticated();
  res.locals.user= req.user;
  res.locals.session= req.session;
  next();
})

app.use('/user', user);
app.use('/', index);

app.use(function(req, res, next){
  res.render('404', { status: 404, message:'This is not the page you are looking for :( ' });
});

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});
	
app.set('port', process.env.PORT || 3001);
var server = app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + server.address().port);
});

module.exports = app;
