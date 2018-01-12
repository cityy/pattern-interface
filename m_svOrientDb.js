//OrientDB
// ====================================================================================================
// Overview of orientDB classes and clusters for common projects and user projects
// ====================================================================================================

// CLASSES:
// ''''''''
// projects                      - class that contains all projects
// patterns                      - class that contains all nodes of all projects
// patternconnections               - class that contains all edges of all projects
// patternclasses                   - class that contains all node classes of all projects

// CLUSTERS:
// '''''''''
// common_projects                  - cluster contains common projects
// common_project_patterns             - one cluster for each common project's nodes
// common_project_patternconnections   - one cluster for each common project's edges
// common_project_patternclasses       - one cluster for each common project's node classes

// user_projects                 - cluster contains user projects
// user_project_patterns            - one cluster for each user project's nodes
// user_project_patternconnections     - one cluster for each user project's edges
// user_project_patternclasses         - one cluster for each user project's node classes
// ====================================================================================================

var ODatabase = require('orientjs').ODatabase;
var db = new ODatabase({
   host:     'localhost',
   port:     2424,
   username: 'admin',
   password: 'admin',
   name:     'patternlanguage'
});

/*db.open().then(function() {
   return db.query('SELECT FROM V LIMIT 1');
}).then(function(res){
   console.log(res.length);
   db.close().then(function(){
      console.log('closed');
   });
});*/

var exports = module.exports = db;


