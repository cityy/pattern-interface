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
			res.send( records );
		});
	});
});

// HANDLE ADDNODE REQUEST
app.post('/nodes', function(req, res){
	oDB.db.class.get('pattern').then(function(pattern){
		pattern.create({
			vId: req.body.vId,
			title: req.body.title,
			problem: req.body.problem,
			instruction: req.body.instruction,
			label: req.body.label
		}).then( function(newPattern) {
			res.send('Pattern ' + newPattern.title + ' with the id ' + newPattern.vId + ' added to the database.');
		});
	});
});

// HANDLE DELETENODES REQUEST
app.delete('/nodes', function(req, res){
	var vIds = req.body.vIds; // array of ids
	var promises = []; // for collection of all promises
	function deleteNode(vId){ 
		return new Promise(function(resolve, reject){ // promise that deletes a vertex from orientDB
			oDB.db.delete('VERTEX', 'pattern').where('vId=' + vId).one();
			resolve(vId); // promise return value
		}); 
	}
	for ( var i in vIds ) {
		promises.push( deleteNode(vIds[i])); // push the deleteNode promise to the promises array
	}
  	//Promise.all() resolves when all promises in the array resolved
	Promise.all(promises).then(function(dataArr){ 
		res.send('Deleted the following Patterns: ' + dataArr);
	}).catch(function(err){ console.log(err) });
}); // app.delete(/nodes)


app.delete('/edges', function(req, res){
	var vIds = req.body.vIds; 
	var promises = []; // for collection of all promises
	function deleteNode(vId){ 
		return new Promise(function(resolve, reject){ // promise that deletes a vertex from orientDB
			oDB.db.delete('EDGE', 'patternconnections').where('vId=' + vId).one();
			resolve(vId); // promise return value
		}); 
	}
	for ( var i in vIds ) {
		promises.push( deleteNode(vIds[i])); // push the deleteNode promise to the promises array
	}
  	//Promise.all() resolves when all promises in the array resolved
	Promise.all(promises).then(function(dataArr){ 
		res.send('Deleted the following Edges: ' + dataArr);
	}).catch(function(err){ console.log(err) });
}); // app.delete(/edges)

// HANDLE CONNECTNODES REQUESTS
app.post('/edges', function(req, res){
	console.log( req.body );
	let fromId = req.body.from; // can be an array
	let toId = req.body.to;
	let vId = req.body.edgevId; // can be an array

	var f = {
		create: function(i){
			var promise = new Promise(function(resolve, reject){
				oDB.db.select().from('pattern').where({vId: fromId[i]}).all().then(function(selectFrom){
					oDB.db.select().from('pattern').where({vId: toId}).all().then(function(selectTo){
						let fromRid = '#' + selectFrom[0]['@rid'].cluster + ':' + selectFrom[0]['@rid'].position;
						let toRid = '#' + selectTo[0]['@rid'].cluster + ':' + selectTo[0]['@rid'].position;
						console.log(vId[i]);

						oDB.db.create('EDGE', 'patternconnections').from(fromRid).to(toRid).set({ 
							fromId: fromId[i], // save nodvIds (not the rids)
							toId: toId,
							vId: vId[i]
						}).one().then( function(newEdge){
							console.log('Created edge :' + newEdge);
						}).catch(function(err){console.log(err)});
					}); // selectTo
				}); // selectFrom
			}); // var promise
		} // create: function(i)
	} // obj f
	var promises = [];
	
	for (let i = 0; i < vId.length; i++ ){ promises.push( f.create(i) ); }

	Promise.all(promises).then(function(dataArr){
		res.send('Created Edge ' + vId + ' from ' + fromId + ' to ' + toId);
	}) // Promise.all
}); //app.post(/edges)

// HANDLE EDITNODE REQUESTS
app.put('/nodes', function(req, res){
	let vId = req.body.id;
	oDB.db.select().from('pattern').where({vId: vId}).all().then(function(selectedNode){
		//console.log(selectedNode);
		let rid = '#' + selectedNode[0]['@rid'].cluster + ':' + selectedNode[0]['@rid'].position;
		oDB.db.update(rid).set(req.body).scalar();
		res.send('Updated Pattern: ' + vId);
	});
});

// HANDLE A SINGLE RECORD REQUEST
/*app.get('/nodes/:clusterId/:recordId', function(req, res){ 
	oDB.db.class.get('pattern').then( function(pattern){
		pattern.list().then( function(records){ // records is an associative array
			res.send( records );
		});
	}); // db.class.get('pattern')	
}); // app.get(/nodes/:clusterId/:recordId)*/

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
