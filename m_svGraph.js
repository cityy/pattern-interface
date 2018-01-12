// m_svGraph
// handles sending and receiving graph data to/from the database
var db = require('./m_svOrientDb.js');
var svUtil = require('./m_svUtil.js');

var svGraph = {
	nodes: {
		getByPrj: function(req, res){
			if(req.query.common == 'false'){ // if the currentProject is not a common project
				console.log('Loading user project');
				db.select().from('cluster:_' + req.user.username + '_' + req.params.project + '_patterns').all()
					.then(function(projectPatterns){ res.send(projectPatterns); });
			}
			else{
				console.log('Loading common project');
				db.select().from('cluster:_root_' + 'commonlanguage' + '_patterns').all()
				.then(function(projectPatterns){ res.send(projectPatterns); });
			}
		}, // </ svGraph.getPrjNodes() >
		postByPrj: function( req, res ) {
			let promises = [];
			function createNode(node){
				return new Promise(function(resolve, reject){
					db.insert().into('cluster:' + req.user.username + '_' + req.params.project + '_patterns')
					.set({
						vId: node.vId,
						title: node.title,
						problem: node.problem,
						instruction: node.instruction,
						label: node.label,
						image: node.image,
						x: node.x,
						y: node.y
					}).all().then(function(record){
						resolve(record);
					});
				}); // return new promise
			}
			for(let i in req.body.nodes){
				if(req.body.nodes[i].id){ // check what format ids are submitted in
					req.body.nodes[i].vId = req.body.nodes[i].id;
				}
				promises.push( createNode(req.body.nodes[i]) )
			}
			Promise.all(promises).then(function(dataArr){ 
				res.send('Posted ' + dataArr.length + ' nodes to the database.');
			}).catch(function(err){ console.log(err) });
		}, // </ svGraph.postPrjNodes() >
		updateByPrj: function( req, res ){
			let data = req.body;
			let vId = data.id;
			if(req.file){
				data.image = req.file.path + '.jpg';
			}
			delete data.id;
			db.select().from('cluster:' + req.user.username + '_' + req.params.project + '_patterns' ).where({vId: vId}).all().then(function(selectedNode){
				let rid = '#' + selectedNode[0]['@rid'].cluster + ':' + selectedNode[0]['@rid'].position;
				db.update(rid).set(req.body).scalar();
				res.send('Updated Pattern: ' + vId);
			});
		}, // </ svGraph.updatePrjNodes() >
		deleteByPrj: function( req, res ) {
			var promises = []; // for collection of all promises
			function deleteNode(vId){ 
				return new Promise(function(resolve, reject){ // promise that deletes a vertex from orientDB
					db.select().from('cluster:' + req.user.username + '_' + req.params.project + '_patterns').where('vId=' + vId).all()
						.then(function(pattern){
							let rid = '#' + pattern[0]['@rid'].cluster + ':' + pattern[0]['@rid'].position;
							db.delete('VERTEX', 'patterns').where('@rid=' + rid).one().then(function(deletedRecord){
								resolve(vId); // promise return value
							}); // then
						}); // then
				}); // return
			} // </ deleteNode() >
			for ( var i in req.body.vIds ) { promises.push( deleteNode(req.body.vIds[i])); } // push the deleteNode promise to the promises array
			//Promise.all() resolves when all promises in the array resolved
			Promise.all(promises).then(function(dataArr){ 
				res.send('Deleted the following Patterns: ' + dataArr);
			}).catch(function(err){ console.log(err) });
		},
		updatePositions: function(req, res){
			for ( let i in req.body ){
				if (i > 0 ){
					let vId = i;
					db.select().from('patterns').where({vId: vId}).all().then(function(selectedNode){
						let rid = '#' + selectedNode[0]['@rid'].cluster + ':' + selectedNode[0]['@rid'].position;
						db.update(rid).set(req.body[i]).scalar();
					});
				}
			}
			res.send('Saved node positions after stabilizing.');
		},

		/*/ DEPRECATED FUNCTIONS
		getAll: function( req, res ){
			db.query(
				'SELECT FROM patterns',
				{
					limit: -1,
				}
				).then(function(records){
					res.send(records);
			});
		}, // </ svGraph.getAllNodes()
		updateById: function( req, res ){
			let data = req.body;
			let vId = data.id;
			delete data.id;
			db.select().from('patterns').where({vId: vId}).all().then(function(selectedNode){
				let rid = '#' + selectedNode[0]['@rid'].cluster + ':' + selectedNode[0]['@rid'].position;
				db.update(rid).set(req.body).scalar();
				res.send('Updated Pattern: ' + vId);
			});
		}, // </ svGraph.updateNodes() >
		deleteById: function( req, res ){
			var vIds = req.body.vIds; // array of ids
			var promises = []; // for collection of all promises
			function deleteNode(vId){ 
				return new Promise(function(resolve, reject){ // promise that deletes a vertex from orientDB
					db.delete('VERTEX', 'patterns').where('vId=' + vId).one();
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
		}, // </ svGraph.nodes.deleteByRid() >
		/*/

	}, // </ svGraph.nodes() >
	edges: {
		getByPrj: function( req, res ){
			if(!req.query.common){ // if the currentProject is not a common project
				db.select().from('cluster:_' + req.user.username + '_' + req.params.project + '_relations').all()
					.then(function(projectPatterns){ res.send(projectPatterns); });
			}
			else{
				db.select().from('cluster:_root_' + req.params.project + '_relations').all()
				.then(function(projectPatterns){ res.send(projectPatterns); });
			}
		}, // </ svGraph.edges.getByPrj() >
		postByPrj: function( req, res ){
			let promises = [];
			function createEdge(edge){
				return new Promise(function(resolve, reject){
					let qGetFromRid = 'select from cluster:' + req.user.username + '_' + req.params.project + '_patterns where vId = ' + edge.from ;
					let qGetToRid = 'select from cluster:' + req.user.username + '_' + req.params.project + '_patterns where vId = ' + edge.to ;
					db.query(qGetFromRid).then(function(fromRidNode){
						db.query(qGetToRid).then(function(toRidNode){
							let fromRid = '#' + fromRidNode[0]['@rid'].cluster + ':' + fromRidNode[0]['@rid'].position;
							let toRid = '#' + toRidNode[0]['@rid'].cluster + ':' + toRidNode[0]['@rid'].position;
				 			let query = 'create edge patternconnections cluster ' + req.user.username + '_' + req.params.project + '_patternconnections from ' + fromRid + ' to ' + toRid +
									' set vId=' + edge.edgevId + ', ' +
									'fromId=' + edge.from + ', ' +
									'toId=' + edge.to;
							db.query(query); // create new edge
						}); // getToId
					}).then(function(result){
						resolve(result);
					}); //then
				}); // return new promise		
			} //createEdge()
			for(let i in req.body.edges){
				if(req.body.edges[i].id){
					req.body.edges[i].edgevId = req.body.edges[i].id;
				}
				promises.push( createEdge(req.body.edges[i]) );
			} // for
			Promise.all(promises).then(function(dataArr){ 
				res.send('Posted ' + dataArr.length + ' nodes to the database.');
			}).catch(function(err){ console.log(err) });
		}, // </ svGraph.edges.postByPrj >
		deleteById: function( req, res ){
			var vIds = req.body.vIds; 
			var promises = []; // for collection of all promises
			function deleteNode(vId){ 
				return new Promise(function(resolve, reject){ // promise that deletes a vertex from orientDB
					db.delete('EDGE', 'patternconnections').where('vId=' + vId).one();
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
		}, // </ svGraph.edges.deleteById >
		updateById: function( req, res ){
			console.log(req.body);
			let data = req.body[0];
			let vId = data.id;
			delete data.id;
			db.query(
					'UPDATE EDGE patternconnections ' +
					'SET fromId=:dataFrom, toId=:dataTo ' +
					'SET text=:dataText ' +
					'WHERE vId=:vId ',
					{
						params:{
							vId: vId,
							dataFrom: data.from,
							dataTo: data.to,
							dataText: data.text,
						}
					}).then(function(){
						res.send('Swapped direction of Edge #' + vId);
					});
		}, // </ svGraph.edges.updateById() >
		
		/*/ DEPRECATED FUNCTIONS
		getAll: function( req, res ){
			db.query(
				'SELECT FROM patternconnections',
				{
					limit: -1,
				}
				).then(function(records){
					res.send(records);
				});
		}, // </ svGraph.edges.getAll() >
		/*/

	} // </ svGraph.edges >
} // svGraph obj

var exports = module.exports = svGraph;