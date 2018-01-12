// this module handles interaction with the database
// deleteAll(), postAll(), getAll() and updateAll() take url arrays
// for multiple requests in one go: e.g. getAll(['/nodes', '/edges']);
// as a consequence they all also resolve (2 dimensional) arrays
// e.g. getall('/nodes', '/edges') will return an array containing an array of nodes and an array of edges

//backendDb is the export module object
var beDb = {
	deleteAll: function(url, data){
		return new Promise( function (resolve, reject) {
			var f = {
				post: function(i){
					var promise = new Promise( function(resolve, reject){
						var visDbReq = new XMLHttpRequest();
						visDbReq.open('DELETE', url[i], true);
						visDbReq.setRequestHeader("Content-type", "application/json; charset=utf-8");
						visDbReq.onload = function() {
							if (visDbReq.status === 200) { resolve(visDbReq.responseText); }
							else { console.log('Error' + visDbReq.statusText); } 
						} // onload()
						visDbReq.send( JSON.stringify(data) );
					}); // var promise
					return promise;
				} // post method
			} // obj f
			var promises = [];
			for (let i = 0; i < url.length; i++){
				promises.push( f.post(i) );
			}
			Promise.all(promises).then( function(dataArr){
				resolve( dataArr );
			});
		}); // return   
	}, // backendDb.deleteAll()
	postAll: function(url, data){
		return new Promise( function (resolve, reject) {
			var f = {
				post: function(i){
					var promise = new Promise(function(resolve, reject){
						var visDbReq = new XMLHttpRequest();
						visDbReq.open('POST', url[i], true);
						visDbReq.setRequestHeader("Content-type", "application/json; charset=utf-8");
						visDbReq.onload = function() {
							if (visDbReq.status === 200) { resolve(visDbReq.responseText); }
							else { console.log('Error' + visDbReq.statusText); } 
						} // onload()
						visDbReq.send( JSON.stringify(data) );
					}); // var promise
					return promise;
				} // post method
			} // obj f
			var promises = [];
			for (let i = 0; i < url.length; i++){ promises.push( f.post(i) ); }
			Promise.all(promises).then(function(dataArr){ resolve( dataArr ); });
		}); // return
	}, // backendDb.postAll();
	getAll: function(url, data){
		return new Promise( function (resolve, reject) {
			var f = {
				get: function(i){
					var promise = new Promise(function(resolve, reject){
						var visDbReq = new XMLHttpRequest();
						visDbReq.open('GET', url[i], true);
						visDbReq.onload = function(){
							if (visDbReq.status === 200 && visDbReq.responseText) { resolve(visDbReq.responseText); }
							else { reject('Error: ' + visDbReq.statusText); }
						}
						visDbReq.send(null);
					}); // var promise
					return promise;
				} // get method
			} // obj f
			// array that holds all the request promises
			var promises = []; 
			// for each requested url, push one response
			for (let i = 0; i < url.length; i++){
				promises.push( f.get(i) );
			}
			// when all sub promises are done, resolve the getAll promise
			Promise.all(promises).then(function(dataArr){
				for (let i in dataArr){
					dataArr[i] = JSON.parse(dataArr[i]);
				}
				resolve( dataArr );
			});
		}); // return
	}, //backendDb.getAll()
	updateAll: function(url, data){
		return new Promise( function (resolve, reject) {
			var f = {
				put: function(i){
					var promise = new Promise( function(resolve, reject){
						var visDbReq = new XMLHttpRequest();
						visDbReq.open('PUT', url[i], true);
						visDbReq.setRequestHeader("Content-type", "application/json; charset=utf-8");
						visDbReq.onload = function() {
						    if (visDbReq.status === 200) { resolve(visDbReq.responseText); }
						    else { console.log('Error' + visDbReq.statusText); } 
						} // onload()
						visDbReq.send( JSON.stringify(data) );
					}); // var promise
					return promise;
				} // post method
			} // obj f
			var promises = [];
			for (let i = 0; i < url.length; i++){
				promises.push( f.put(i) );
			}
			Promise.all(promises).then( function(dataArr){
				resolve( dataArr );
			});
		}); // return 
	} //backendDb.updateAll()
}

var exports = module.exports = beDb;