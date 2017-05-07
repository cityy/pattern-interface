var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

var oDB = require('./sv_orientdb.js');

//console.log(oDB.db);
//var vis_ = require('./src/js/vis_network.js');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
// OrientDB Routes

app.get('/nodes', function(req, res){ // request for all the nodes
	oDB.db.class.get('pattern').then( function(pattern){
		pattern.list().then( function(records){ // promises records of class pattern, records is an associative array
			//console.log ( records );
			res.send( records );
		});
	}); // db.class.get('pattern')
});

app.get('/nodes/:clusterId/:recordId', function(req, res){
	oDB.db.class.get('pattern').then( function(pattern){
		pattern.list().then( function(records){ // records is an associative array
		});
	}); // db.class.get('pattern')	
}); // app.get(/nodes/:clusterId/:recordId)


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
