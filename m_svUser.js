// m_svSessions
var db = require('./m_svOrientDb.js');
var bcrypt = require('bcryptjs');
var LocalStrategy = require('passport-local').Strategy;

var svUser = {
	localSigninStrat: new LocalStrategy(
		{
			usernameField: 'username',
			passwordField: 'password',
			passReqToCallback : true
		}, //allows us to pass back the request to the callback
		function(req, username, password, done) {
			console.log(username);
			svUser.localAuth(username, password).then(function (user) {
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
			}).catch(function (err){
				console.log(err);
			});
		}
	),
	localSignupStrat: new LocalStrategy(
	  {
	  	usernameField: 'username',
	  	passwordField: 'password',
	  	passReqToCallback : true
	  }, //allows us to pass back the request to the callback
	  function(req, username, password, done) {
	    svUser.localReg(username, password).then(function ( newUser) {
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
	),
	localAuth: function(username, password){
		return new Promise ( function(resolve, reject){
			console.log('USERNAME' + username);
			db.query(
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
						console.log('USERNAME NOT FOUND.');
						reject('Username not found.');
					}
				}); //query
			}); // promise()
	}, //localAuth()
	localReg: function(username, password){
		return new Promise ( function(resolve, reject){
		// 01 get all users from the db
			db.class.get('users').then( function ( users ){
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
							//projects: ['MyLanguage'] //default project
						}).then(function(newUser){
							let query = 'alter class projects addcluster ' + newUser.username + '_Projects'
							db.query(query).then(function(){
								query = 'insert into projects cluster ' + newUser.username + '_Projects set owner = "' + newUser.username + '", name = "MyProjectLanguage", shared = false, status = "mostRecent"';
								db.query(query).then(function(){
									query = 'alter class patterns addcluster ' + newUser.username + '_MyProjectLanguage_Patterns';
									db.query(query).then(function(){
										query = 'alter class patternconnections addcluster ' + newUser.username + '_MyProjectLanguage_PatternConnections';;
										db.query(query).then(function(){
											query = 'alter class patternClasses addcluster ' + newUser.username + '_MyProjectLanguage_PatternClasses';
											db.query(query).then(function(){
												let dir = './public/uploads/' + newUser.username + '_myprojectlanguage_diagrams';
												if ( !fs.existsSync(dir) ){
												    fs.mkdirSync(dir, 0755);
												}
											});
										});
									});
								});
							});
							// create classes for the user's  default project's nodes and edges
							resolve( newUser );
						});
					}
				}); // list()
			}); // get()
		}); // Promise()
	}, // localReg()
	signout: function(req, res){
		let name = req.user.username;
		console.log("LOGGIN OUT " + req.user.username)
		req.logout();
		req.session.notice = "You have successfully been logged out " + name + "!";
		res.send(req.session.notice);
	}, // </ svUser.signout() >
	getCurrent: function(req, res){
		console.log('REQ.USER: ' + req.user);
		if(req.user){
			db.select().from('users').where({username: req.user.username}).all().then(function(user){
				res.send([user]);
			});
		}
		else{
			console.log('res.send(null)')
			res.send(null); // important to send null here to not screw up the client side data parsing
		}
	}, // </ svUser.getCurrent() >
}

var exports = module.exports = svUser;
