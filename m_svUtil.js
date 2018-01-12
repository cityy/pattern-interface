//m_svHelper
//helper module to execute operations on the database

var svHelper = {
	getRID: function(node){
		return '#' + node['@rid'].cluster + ':' + node['@rid'].position;
	},
} 

var exports = module.exports = svHelper

/*app.get('/portEdges', function(req, res){
	let query = 'select from patternconnections limit -1';
	db.query(query).then(function(allEdges){
		for(let i in allEdges){
			let qPortEdges = 'create edge patternconnections cluster common_patternlanguage_patternconnections from ' + allEdges[i]['out'] + ' to ' + allEdges[i]['in'] +
							' set fromId = ' + allEdges[i]['fromId'] + ', ' +
							'toId = ' + allEdges[i]['toId'] + ', ' +
							'vId = ' + allEdges[i]['vId'] + ', ' +
							'text = "' + allEdges[i]['text'] + '"'; 
			db.query(qPortEdges);
		}
		return allEdges;
	}).then(function(allEdges){
		console.log('Ported ' + allEdges.length + ' edges.');
		res.send('Ported ' + allEdges.length + ' edges.');
	});
});*/