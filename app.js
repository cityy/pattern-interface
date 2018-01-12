// ===============================================================================
// DEPENDENCIES
// ===============================================================================
// == 3RD PARTY DEPENDENCIES
var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mkdirp = require('mkdirp');
var passport = require('passport');
// == INTERNAL DEPENDENCIES
var svUtil = require('./m_svUtil.js');
var svGraph = require('./m_svGraph.js');
var svUser = require('./m_svUser.js');
var svPrj = require('./m_svProjects.js');
var svFiles = require('./m_svFiles');
var db = require('./m_svOrientDb.js');
var index = require('./routes/index');
// == EXPRESS APP INITIALIZATION
var app = express();
// ===============================================================================
// MIDDLEWARE FOR ALL ROUTES
// ===============================================================================
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: 'supernova', saveUninitialized: true, resave: true}));
app.use(passport.initialize());
app.use(passport.session());
// ===============================================================================
// VIEW ENGINE SETUP
// ===============================================================================
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// ===============================================================================
// PASSPORT SESSION SETUP
// ===============================================================================
passport.serializeUser(function(user, done) {
	console.log("serializing " + user.username);
	done(null, user);
});
passport.deserializeUser(function(obj, done) {
	console.log("deserializing " + obj);
	done(null, obj);
});
// Use the LocalStrategy within Passport to login/"signin" 
passport.use('local-signin', svUser.localSigninStrat); //passport.use('local-signin')
// Use the LocalStrategy within Passport to register/"signup" users.
passport.use('local-signup', svUser.localSignupStrat);
// ===============================================================================
// ROUTE SPECIFIC MIDDLEWARE
// ===============================================================================
app.use('/', index);
// ===============================================================================
// ROUTE HANDLERS - GRAPH RELATED
// ===============================================================================
// NODES
// == GET NODES FOR SPECIFIC PROJECT 
app.get('/nodes/:project?', svGraph.nodes.getByPrj);
// == POST NODES TO CURRENT PROJECT
app.post('/nodes/:project', svGraph.nodes.postByPrj);
// == UPDATE NODE BY PROJECT AND ID
app.put('/nodes/:project', svFiles.diagramUpload, svGraph.nodes.updateByPrj);
// == DELETE NODES FROM PROJECT
app.delete('/nodes/:project', svGraph.nodes.deleteByPrj);
// == UPDATE POSITIONS FOR CURRENTLY DRAWN NODES 
app.put('/positions', svGraph.nodes.updatePositions);
// == DELETE NODES BY ID (DEPRECATED)
//app.delete('/nodes', svGraph.nodes.deleteById); 
// == UPDATE NODE BY ID (DEPRECATED)
// app.put('/nodes', svGraph.nodes.updateById);
// == GET ALL NODES (DEPRECATED)
// app.get('/nodes', svGraph.nodes.getById);
// EDGES =========================================================================
// GET EDGES BY PROJECT
app.get('/edges/:project?', svGraph.edges.getByPrj);
// == POST EDGES TO PROJECT
app.post('/edges/:project?', svGraph.edges.postByPrj);
// == DELETE EDGES BY ID
app.delete('/edges', svGraph.edges.deleteById);
// == UPDATE EDGES BY ID
app.put('/edges', svGraph.edges.updateById);
// == GET ALL EDGES (DEPRECATED)
// app.get('/edges', svGraph.edges.getAll);

// ====================================================================================================
// ROUTE HANDLERS - USERS: SIGNIN; SIGNOUT; SIGNUP
// ====================================================================================================
// PASSPORT LOCAL SIGNUP
app.post('/local-reg', passport.authenticate('local-signup', { 
			failureRedirect: '/',
			failureFlash: false }));
// == PASSPORT LOCAL SIGNIN
app.post('/login', passport.authenticate('local-signin', { 
			failureRedirect: '/loginFailure', 
			failureFlash: false }), function(req, res){
	res.send(req.user.username);
});
app.get('/loginFailure', function(req, res){
			console.log(req.body);
			res.send('Login Failed');
});
// == PASSPORT SIGNOUT
app.get('/logout', svUser.signout);
// == GET THE CURRENT USER
app.get('/user', svUser.getCurrent);
// ====================================================================================================
// ROUTE HANDLES - PROJECT RELATED
// ====================================================================================================
// == POST A NEW  USER PROJECT
app.post('/projects', svPrj.post);
// == GET ALL USER PROJECTS
app.get('/projects', svPrj.getAll);
// == UPDATE PROJECT
app.put('/projects', svPrj.update);
// == DELETE PROJECT
app.delete('/projects/:targetProject', svPrj.delete)
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
