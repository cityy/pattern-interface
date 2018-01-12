//m_svFiles
var db = require('./m_svOrientDb.js');
var multer = require('multer' );
// set Storage options
var diagramStorage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, './public/uploads/' + req.user.username + '_' + req.params.project);
	},
	filename: function(req, file, cb){
		cb(null, req.body.vId + '_' + req.body.title + '?' + new Date().getTime() + '.jpg' ); 
	}
});

var svFiles = {
	diagramUpload: multer({storage: diagramStorage}).single('diagramImage'),
}

var exports = module.exports = svFiles;