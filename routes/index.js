var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

	if(req.user){
		console.log('Current user: ' + req.user.username);
	}
	else{
		console.log('Noone is logged in');
	}
  res.render('index', { title: 'A Pattern Interface' });
});

module.exports = router;
