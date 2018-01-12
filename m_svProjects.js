//m_svProjects
var db = require('./m_svOrientDb.js');
var svUtil = require('./m_svUtil.js');

var svPrj = {
	getAll: function(req, res){
		if(!req.user){
			db.select().from('projects').where({common: 'true'}).all().then(function(commonProjects){
				console.log('get/projects: Sending common Projects:' + commonProjects[0]);
				res.send(commonProjects);
			});		
		}
		else{
			db.select().from('projects').where({owner: 'common'}).all().then(function(commonProjects){
				db.select().from('projects').where({owner: req.user.username}).all().then(function(userProjects){
					db.select().from('projects').where({collaborators: req.user.username}).all().then(function(collabProjects){
						let projects = commonProjects.concat(userProjects, collabProjects);
						console.log('get/projects: Sending user projects + common projects:' + projects[0]);
						res.send(projects);
					})
				});	// select from user projects
			}); // select from common projects
		} //else
	}, // </ svPrj.getAll() >
	post: function(req, res){
		let copyPattern = function(srcPattern, user, tarProject){
			return new Promise(function(resolve, reject){
				db.insert().into('cluster:_' + user + '_' + tarProject + '_patterns').set({
					vId: srcPattern.vId,
					title: srcPattern.title,
					problem: srcPattern.problem,
					instruction: srcPattern.instruction,
					label: srcPattern.label,
					image: srcPattern.image,
					x: srcPattern.x,
					y: srcPattern.y,
				}).all().then(function(newPattern){
					resolve('Copied Pattern' + newPattern.title);
				});
			});
		}

		let copyRelation = function(srcRelation, user, tarProject){
			return new Promise(function(resolve, reject){
				db.select().from('cluster:_' + user + '_' + tarProject + '_patterns').where({vId: srcRelation.fromId}).one().then(function(fromNode){
					db.select().from('cluster:_' + user + '_' + tarProject + '_patterns').where({vId: srcRelation.toId}).one().then(function(toNode){
						// console.log(fromNode);
						// console.log(toNode);
						db.create('EDGE', "patternconnections CLUSTER " + '_' + user + '_' + tarProject + '_relations')
							.from(svUtil.getRID(fromNode)).to(svUtil.getRID(toNode)).set({
								vid: srcRelation.vId,
								fromId: srcRelation.fromId,
								toId: srcRelation.toId,
								text: srcRelation.text,
						}).one().then(function(newRelation){
							resolve( 'Created new relation from Pattern ' + newRelation.fromId + ' to Pattern' + newRelation.toId + '.');
						});
					});
				});
			});
		}
		let promiseArr  = [];
		db.insert().into('cluster:_' + req.user.username + '_prjs').set({
			title: req.body.projectTitle, 
			status: 'mostRecent',
			owner: req.user.username,
		}).all().then(function(value){
			db.query('ALTER CLASS patterns ADDCLUSTER _' + req.user.username + '_' + req.body.projectTitle + '_patterns').then(function(cluster){
				db.query('ALTER CLASS patternconnections ADDCLUSTER _' + req.user.username + '_' + req.body.projectTitle + '_relations').then(function(cluster){
					db.query('ALTER CLASS patternClasses ADDCLUSTER _' + req.user.username + '_' + req.body.projectTitle + '_tags' ).then(function(cluster){
						db.select().from('cluster:_' + req.user.username + '_' + req.body.inheritProject + '_patterns').all().then(function(patterns){
							for(let i in patterns){
								promiseArr.push(copyPattern(patterns[i], req.user.username, req.body.projectTitle));
							}
							Promise.all(promiseArr).then(function(){
								db.select().from('cluster:_'  + req.user.username + '_' + req.body.inheritProject + '_relations').all().then(function(relations){
									promiseArr = [];
									for( let i in relations ){
										promiseArr.push(copyRelation(relations[i], req.user.username, req.body.projectTitle));
									}
									Promise.all(promiseArr).then(function(){
										res.send('Created new project');
									});
								});
							});
						});
					});
				});
			});
		});
	}, // </ svPrj.post() >
	update: function( req, res ){
		db.select().from('projects').where({owner: req.user.username, title: req.body.prevPrjTitle}).one().then(function(prjToUpdate){
			let rid = '#' + prjToUpdate['@rid'].cluster + ':' + prjToUpdate['@rid'].position;
			db.update(rid).set({title: req.body.updatedPrjTitle}).one().then( function(updatedPrj){
				res.send('Updated Project: ' + updatedPrj.title);
			});
		});
	}, // </ svPrj.update() >
	delete: function( req, res ){
		db.delete('VERTEX', 'projects').where({owner: req.user.username, title:req.params.targetProject}).one().then(function(deletedPrj){
			db.query('ALTER CLASS patterns REMOVECLUSTER _' + req.user.username + '_' + req.params.targetProject + '_patterns').then(function(val){
				db.query('DROP CLUSTER _'  + req.user.username + '_' + req.params.targetProject + '_patterns').then(function(val){
					db.query('ALTER CLASS patternconnections REMOVECLUSTER _' + req.user.username + '_' + req.params.targetProject + '_relations').then(function(val){
						db.query('DROP CLUSTER _' + req.user.username + '_' + req.params.targetProject + '_relations').then(function(val){
							db.query('ALTER CLASS patternClasses REMOVECLUSTER _' + req.user.username + '_' + req.params.targetProject + '_tags').then(function(val){
								db.query('DROP CLUSTER _' + req.user.username + '_' + req.params.targetProject + '_tags').then(function(val){
									res.send('Deleted project ' + req.params.targetProject + ' by user ' + req.user.username );
								});
							});
						});
					});
				});
			});
		})
	}, // </ svPrj.delete() >
}

var exports = module.exports = svPrj;