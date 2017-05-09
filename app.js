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


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);



// =========================
// OrientDB Routes
// =========================

// HANDLE REQUEST FOR ALL NODES
app.get('/nodes', function(req, res){ // request for all the nodes
	oDB.db.class.get('pattern').then( function(pattern){
		pattern.list().then( function(records){ // promises records of class pattern, records is an associative array
			res.send( records );
		});
	}); // db.class.get('pattern')
});

// HANDLE REQUEST FOR ALL EDGES
app.get('/edges', function(req, res){
	oDB.db.class.get('patternconnections').then(function(patternconnections){
		patternconnections.list().then(function(records){
			/*for(var i in records){
				console.log('Edge #' + i + ' with id: ' + records[i]['@rid']);
				console.log('From: #'+ records[i].out.cluster + ':' + records[i].out.position);
				console.log('To: #'+ records[i].in.cluster + ':' + records[i].in.position);
				console.log('================================');
			}*/
			res.send( records );
		});
	});
});


// HANDLE A SINGLE RECORD REQUEST
app.get('/nodes/:clusterId/:recordId', function(req, res){ 
	oDB.db.class.get('pattern').then( function(pattern){
		pattern.list().then( function(records){ // records is an associative array
			res.send( records );
		});
	}); // db.class.get('pattern')	
}); // app.get(/nodes/:clusterId/:recordId)


// HANDLE ADDNODE REQUEST
app.post('/nodes', function(req, res){
	oDB.db.class.get('pattern').then(function(pattern){
		pattern.create({
			id: req.body.id,
			name: req.body.name,
			label: req.body.label
		}).then( function(newPattern) {
			res.send('Pattern ' + newPattern.name + ' with the id ' + newPattern.id + ' added to the database.');
		});
	});
});


// HANDLE DELETENODES REQUEST
app.delete('/nodes', function(req, res){
	var ids = req.body.ids; // array of ids
	var promises = []; // for collection of all promises

	function deleteNode(id){ 
    // promise that deletes a vertex from orientDB
		return new Promise(function(resolve, reject){
			oDB.db.delete('VERTEX', 'pattern').where('id=' + id).one();
			resolve(id); // promise return value
		}); 
	}
  	// for earch id
	for ( var i in ids ) {
    // push the deleteNode promise to the promises array
		promises.push( deleteNode(ids[i]));
	}
  	//Promise.all() resolves when all promises in the array resolved
	Promise.all(promises).then(function(dataArr){ 
		res.send('Deleted the following Patterns: ' + dataArr);
	}).catch(function(err){ console.log(err) });
}); // app.delete(...)


// HANDLE CONNECTNODES REQUESTS
app.post('/edges', function(req, res){
	//console.log( req.body );

	let fromId = req.body.from;
	let toId = req.body.to;

	let fromNode = oDB.db.select().from('pattern').where({id: fromId}).all().then(function(selectFrom){
		let toNode = oDB.db.select().from('pattern').where({id: toId}).all().then(function(selectTo){
			let fromRid = '#' + selectFrom[0]['@rid'].cluster + ':' + selectFrom[0]['@rid'].position;
			let toRid = '#' + selectTo[0]['@rid'].cluster + ':' + selectTo[0]['@rid'].position;

			oDB.db.create('EDGE', 'patternconnections').from(fromRid).to(toRid).set({
				fromId: fromId,
				toId: toId,
			}).one().then( function(newEdge){
				res.send('Created Edge:' + newEdge);
			});
		});
	});
});



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
