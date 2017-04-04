var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var expressValidator = require('express-validator');
var cookieParser = require('cookie-parser');

var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bodyParser = require('body-parser');
require('./config/passport')(passport); // pass passport for configuration

var flash = require('connect-flash');
var configDB = require('./config/database.js');
var mongoose = require('mongoose');
mongoose.connect(configDB.url); // connect to our database

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Handle Express Sessions
app.use(session({
    secret:'secret',
    saveUninitialized: true,
    resave: true
}));

// passport
app.use(passport.initialize());
app.use(passport.session());

//Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));


app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(flash());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

app.get('*', function(req, res, next){
    res.locals.user = req.user || null;
    next();
});

//path
var auth = require('./routes/auth/index');
var home = require('./routes/home/index');
var aboutus = require('./routes/aboutus/index');
var moneytransfer = require('./routes/moneytransfer/index');

var token = require('./routes/internationalcall/token');
var internationalcall = require('./routes/internationalcall/call');

var policiesprocedures = require('./routes/policiesprocedures/index');
var myaccount = require('./routes/myaccount/index');
var users = require('./routes/users');
var addfund = require('./routes/myaccount/addfund/index');
app.use(function(req,res,next){
    res.locals.user = req.session.user;
    next();
});
app.use('/', home);
app.use('/auth', auth);
app.use('/aboutus', aboutus);
app.use('/users', users);
app.use('/moneytransfer',isAuthenticated, moneytransfer);

app.use('/internationalcall/', internationalcall);
app.use('/internationalcall/token', token);

app.use('/policiesprocedures', policiesprocedures);
app.use('/myaccount/addfund/',isAuthenticated, addfund);
app.use('/myaccount/',isAuthenticated, myaccount);
app.use('/test', function(req, res, next){
  res.render('test');
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('500', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});
function isAuthenticated(req, res, next) {

    // do any checks you want to in here

    // CHECK THE USER STORED IN SESSION FOR A CUSTOM VARIABLE
    // you can do this however you want with whatever variables you set up
    next();
    // if (req.session.user) {
    //     next();
    // } else {
    //    res.redirect("/auth/login");
    // }
}


module.exports = app;
