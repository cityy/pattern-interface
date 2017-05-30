var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var bcrypt = require('bcryptjs');
const fs = require('fs');

var index = require('./routes/index');
//var users = require('./routes/users');

var app = express();
var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy;
var multer = require('multer');
var storage = multer.diskStorage({
	destination: function(req, file, cb){
		cb(null, './public/uploads/');
	},
	filename: function(req, file, cb){
		cb(null,file.fieldname);
	}
});
var upload = multer({storage: storage});

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
app.use(session({secret: 'supernova', saveUninitialized: true, resave: true}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', index);
//app.use('/users', users);

// Session-persisted message middleware
/*app.use( function(req, res, next){
  var err = req.session.error,
      msg = req.session.notice,
      success = req.session.success;

  delete req.session.error;
  delete req.session.success;
  delete req.session.notice;

  if (err) res.locals.error = err;
  if (msg) res.locals.notice = msg;
  if (success) res.locals.success = success;

  next();
});*/



// ====================================================================================================
// Passport Strategies
// ====================================================================================================

// Passport session setup.
passport.serializeUser(function(user, done) {
  console.log("serializing " + user.username);
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  console.log("deserializing " + obj);
  done(null, obj);
});
// Use the LocalStrategy within Passport to login/"signin" 
passport.use('local-signin', new LocalStrategy(
  {
  	usernameField: 'username',
  	passwordField: 'password',
  	passReqToCallback : true
  }, //allows us to pass back the request to the callback
  function(req, username, password, done) {
    localAuth(username, password)
    .then(function (user) {
      if (user) {
        console.log("LOGGED IN AS: " + user.username);
        req.session.success = 'You are successfully logged in ' + user.username + '!';
        return done(null, user);
      }
      if (!user) {
        console.log("COULD NOT LOG IN");
        req.session.error = 'Could not log user in. Please try again.'; //inform user could not log them in
        return done(null, false);
      }
    })
    .catch(function (err){
      console.log(err);
    });
    //console.log(req, username, password);
  }
));

function localAuth(username, password){
	return new Promise ( function(resolve, reject){
		oDB.db.query(
			'select from users' + ' where username=:username',
			{params:{
				username: username
			}}).then(function(user){ // user is an array
				if(user){
					let hash = user[0].password; // password from db
					console.log( 'Found user ' + user[0].username );
					if( bcrypt.compareSync(password, hash) ){ resolve(user[0]); }
					else{reject('Authentication failed, wrong password.');}
				}
				else{
					reject('Username not found.');
				}
			}); //query
		}); // promise()
} //localAuth()

// Use the LocalStrategy within Passport to register/"signup" users.
passport.use('local-signup', new LocalStrategy(
  {
  	usernameField: 'username',
  	passwordField: 'password',
  	passReqToCallback : true
  }, //allows us to pass back the request to the callback
  function(req, username, password, done) {
    localReg(username, password).then(function ( newUser) {
      if (newUser) {
        console.log("REGISTERED: " + newUser.username);
        //console.log(req);
        req.session.success = 'You are successfully registered and logged in ' + newUser.username + '!';
        //console.log('req.session.success: ' + req.session.success);
        done(null, newUser);
      }
      if (!newUser) {
        console.log("COULD NOT REGISTER");
        req.session.error = 'That Username is already in use, please try a different one.'; //inform newUser could not log them in
        done(null, false);
      }
    }).catch(function (err){
      done(err);
    }); // localReg()
  } // function()
));

function localReg (username, password){
	return new Promise ( function(resolve, reject){
	// 01 get all users from the db
		oDB.db.class.get('users').then( function ( users ){
			users.list().then(function(records){ // records[]
				// 02 check if the new username is taken
				let usernameTaken = false;
				let newId = 0;
				for(let i in records){
					//console.log(records[i]);
					if(records[i].username === username ) { usernameTaken = true; }
					// find the current highest user id
					if( records[i].uId > newId) {
						newId = records[i].uId;
					} 
				} // for
				newId++;
				console.log('Records from query ' + records);
				records.sort(function(a,b){return b-a});
				console.log('Records after sort ' + records);
				console.log('New uID: ' + newId);
				if ( usernameTaken ) { reject('Username is already taken!'); }
				else{
					// 03 create new user
					let hash = bcrypt.hashSync(password, 8);
					users.create({
						username: username,
						password: hash,
						uId: newId,
						projects: ['My Language'] //default project
					}).then(function(newUser){
						resolve( newUser );
					});
				}
			}); // list()
		}); // get()
	}); // Promise()
} // localReg()


// ====================================================================================================
// VisJs Data Routes
// ====================================================================================================

// NODES GET
app.get('/nodes', function(req, res){ // request for all the nodes
	oDB.db.class.get('pattern').then( function(pattern){
		pattern.list().then( function(records){ // promises records of class pattern, records is an associative array
			res.send( records );
		});
	}); // db.class.get('pattern')
});

// NODES POST
app.post('/nodes', function(req, res){
	console.log(req.body);
	oDB.db.class.get('pattern').then(function(pattern){
		pattern.create({
			vId: req.body.vId,
			title: req.body.title,
			problem: req.body.problem,
			instruction: req.body.instruction,
			label: req.body.label,
			image: req.body.image,
			x: req.body.x,
			y: req.body.y,
		}).then( function(newPattern) {
			//res.send(newPattern.image);
			res.send('Pattern ' + newPattern.title + ' with the id ' + newPattern.vId + ' added to the database.');
		});
	});
});

// NODES PUT
app.put('/nodes', function(req, res){
	let data = req.body;
	let vId = data.id;
	delete data.id;
	oDB.db.select().from('pattern').where({vId: vId}).all().then(function(selectedNode){
		let rid = '#' + selectedNode[0]['@rid'].cluster + ':' + selectedNode[0]['@rid'].position;
		oDB.db.update(rid).set(req.body).scalar();
		res.send('Updated Pattern: ' + vId);
	});
});

// NODES DELETE
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

// EDGES GET
app.get('/edges', function(req, res){
	oDB.db.class.get('patternconnections').then(function(patternconnections){
		patternconnections.list().then(function(records){
			res.send( records );
		});
	});
});

// EDGES POST
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

// EDGES DELETE
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

// NETWORK POSITIONS PUT
app.put('/positions', function(req,res){
	for ( let i in req.body ){
		if (i > 0 ){
			let vId = i;
			oDB.db.select().from('pattern').where({vId: vId}).all().then(function(selectedNode){
				let rid = '#' + selectedNode[0]['@rid'].cluster + ':' + selectedNode[0]['@rid'].position;
				oDB.db.update(rid).set(req.body[i]).scalar();
			});
		}
		//else{console.log('Skipping UI Node');}
	}
	res.send('Saved node positions after stabilizing.');
})

// ====================================================================================================
// File Upload Routes
// ====================================================================================================

// IMAGES POST (NODE ICONS)
app.post('/imgUpload', upload.single('diagramImage'), function(req, res, next){
	let filename = req.file.filename;
	req.file.filename = req.body.vId + '-' + filename + '.jpg';
	fs.rename( req.file.destination + filename, req.file.destination + req.file.filename, function(){
		console.log('Renamed file to: '+ req.filename);
		fs.readFile(req.file.destination + req.file.filename, 'utf8', function(err, data){
			res.send(req.file.filename);
		});
	});
});

// ====================================================================================================
// User Login Routes
// ====================================================================================================

// PASSPORT LOCAL SIGNUP
app.post('/local-reg', passport.authenticate('local-signup', { 
											failureRedirect: '/',
											failureFlash: false}), function(req, res){
	res.send(req.user.username);
});

// PASSPORT LOCAL SIGNIN
app.post('/login', passport.authenticate('local-signin', { 
											failureRedirect: '/',
											failureFlash: false}), function(req, res){
	res.send(req.user.username);
});

// PASSPORT SIGNOUT
app.get('/logout', function(req, res){
  let name = req.user.username;
  console.log("LOGGIN OUT " + req.user.username)
  req.logout();
  req.session.notice = "You have successfully been logged out " + name + "!";
  res.send(req.session.notice);
});

app.get('/user', function(req, res){
	if(req.user){
		res.send(req.user.username);
	}
	else{
		res.send(null);
	}
});

// ====================================================================================================
// User Project Routes
// ====================================================================================================

app.post('/projects', function(req, res){
	let newProject = req.body.projectTitle;

	oDB.db.query(
		'update users' + ' add projects=:newProject ' + 'where username=:username',
		{params:{
			username: req.user.username,
			newProject: newProject,
		}}).then(function(){
				res.send('New project ' + newProject + ' added to user ' + req.user.username);
		});
}); // post('/project')

app.get('/projects', function(req, res){
	oDB.db.query(
		'select from users' + ' where username=:username',
		{ params: {username: req.user.username, } } )
		.then(function(user){
			console.log( user[0] ) ;
			res.send(user[0].projects );
		})
});

// ====================================================================================================
// Error Handling
// ====================================================================================================

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
