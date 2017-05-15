var vis = require('vis');
var network;
network = {};
var nodesObj = {};
var edgesObj = {};

// =========================================================
// FUNCTIONS TO HANDLE DATABASE INTERACTION / HTTP REQUESTS
// =========================================================

function deleteAll(url, data){
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
} // deleteAll(url);

function postAll(url, data){ // url is an array
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
} // postAll(url);

function getAll(url){ // url is an array
    return new Promise( function (resolve, reject) {
        var f = {
            get: function(i){
                var promise = new Promise(function(resolve, reject){
                    var visDbReq = new XMLHttpRequest();
                    visDbReq.open('GET', url[i]);
                    visDbReq.onload = function(){
                        if (visDbReq.status === 200) { resolve(visDbReq.responseText); }
                        else { console.log('Error' + visDbReq.statusText); }
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
        // if all sub promises are done, resolve the getAll promise
        Promise.all(promises).then(function(dataArr){
            for (let i in dataArr){
                dataArr[i] = JSON.parse(dataArr[i]);
            }
            resolve( dataArr ); 
        });
    }); // return
} // getAll(url);

function updateAll(url, data){
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
} //updateAll(url, data)

// function to check what is the next id when adding a new node or edge
function getIds(dataSet){
    let newId;
    let currentIds = [];
    let currentDataCount = dataSet.length;
    if(currentDataCount > 0){ // get the currently used ids
        for (let i = 0; i < currentDataCount; i++ ) { 
            currentIds[i] = dataSet[i].vId; 
        }
        //console.log('currentIds: ' + currentIds);
        currentIds.sort(function(a,b){return b-a}); // sort currently used ids in descending order
        newId = currentIds[0] + 1; // newId is the currently highest id +1
    }
    else{ newId = 1; } // if there are no nodes, start with id=0
    //console.log('newId: ' + newId);
    return newId;
}

// =========================================================
// INITIALIZING THE GRAPH - GET ALL NODES & EDGES FROM DB
// =========================================================

getAll( ["/nodes", "/edges"] ).then(function(responseArr){
    let allNodes = responseArr[0]; // get nodes from db
    let allEdges = responseArr[1]; // get edges from db
    var nodesArray = []; // array of Node Objects
    var edgesArray = []; // array of Edge Objects

    // loop through the nodes responded by the server
    for ( let i = 0; i < allNodes.length ; i++ ){
        // create initial Nodes
        let node = {};
        node.id = allNodes[i].vId; // first nodvId = 0, second nodvId = 1, ...
        node.label = allNodes[i].label + ' id #' + allNodes[i].vId;
        nodesArray.push( node ); // append each i to the nodes Array
    } // for i < allNodes.length
    // create initial edges
    if (allEdges.length > 0) {
        for(let i = 0; i < allEdges.length; i++){
            let edge = {};
            edge.from = allEdges[i].fromId;
            edge.to = allEdges[i].toId;
            edge.id = allEdges[i].vId;
            edgesArray.push( edge );
        } // for
    } //  if i > 0
    // convert Edges and Nodes Arrays to Objects
    nodesObj = new vis.DataSet( nodesArray );
    edgesObj = new vis.DataSet( edgesArray );

    // ==================================================
    // GET THE NODE NETWORK CONTAINER DIV
    // ==================================================
    
    var container = document.getElementById('patternLanguage');

    // ==================================================
    // 05 GATHER THE NODES/EDGES DATA AND SET OPTIONS
    // ==================================================

    var data = {
        nodes: nodesObj,
        edges: edgesObj
    };

    var options = {
        interaction:{
            multiselect: true,
        },
        configure: {                 // http://visjs.org/docs/network/configure.html
            enabled: false,         // toggle the config interface
            filter: true,
           // container: undefined, // allows to put configure list in another html container
            showButton: true,       // show generation options button at the bottom of the configurator
                                    // allows to generate js objects for use in the script
        },
        nodes: {                    // http://visjs.org/docs/network/nodes.html
            shape: 'box', 
            shapeProperties:{
                borderRadius: 3,
            },
            borderWidth: 0,
            borderWidthSelected: 1,
            font: {
                face: 'Sofia Pro Soft',
                color: '#FFFFFF',
            },
            color: {
                background: '#010101',
                highlight: {
                    background: '#107896',
                    border: '#1287A8'
                }
            },
            margin: 10,             // text label margin
        },
        edges:{
            width: 12,
            selectionWidth: 0,
            color: {
                color: '#010101',
                highlight: '#107896'
            },
            scaling:{
            }
        },
        physics: {                  // http://visjs.org/docs/network/physics.html
          barnesHut: {              // for the barnesHut solver (see 'solver' module)
            avoidOverlap: 0.5,      // control the node overlap 0...1 
          }  
        },
    };

    // ==================================================
    // 06 INITIALIZE THE GRAPH USING vis.Network()
    // ==================================================

    network = new vis.Network(container, data, options);

    // NETWORK SELECT EVENTS
    network.on('selectNode', function(){ checkHudDisable(); });
    network.on('deselectNode', function(){ checkHudDisable(); });
}); //getAll()

function checkHudDisable() { // check if HUD buttons need to be disabled, depending on what is selected
    let selectedNodes = network.getSelectedNodes();

    switch(selectedNodes.length){
        /*case 0:
            $('#deleteNodes').className += ' disabled'; // disable delete
            break;*/
        case 0:
            document.getElementById("editNode").className = " disabled"; // disable edit
            document.getElementById("deleteNodes").className = " disabled"; // disable delete
            document.getElementById("connectNodes").className = " disabled"; // disable connect            
            break;
        case 1:
            $('#editNode').removeClass('disabled'); //enable Edit
            $('#deleteNodes').removeClass('disabled'); // enable delete
            break;
        case 2: 
            $("#connectNodes").removeClass('disabled'); // enable connect
            document.getElementById("editNode").className = " disabled"; // disable edit
            break;
        case 3:
            document.getElementById("connectNodes").className = " disabled"; // disable connect
            break;
        default:
            document.getElementById("editNode").className = " disabled"; // disable edit
            $('#deleteNodes').removeClass('disabled'); // enable delete
            document.getElementById("connectNodes").className = " disabled"; // disable connect
    } //switch
} // checkHudDisable();     

var exports = module.exports = {};
exports.network = network;
exports.addNode = function addNode() {
                getAll(['/nodes']).then(function(response){
                    let allNodes = response[0];
                    let newNodeId, newEdgeId;      
                    let selectedNodes = network.getSelectedNodes(); // array
                    newNodeId = getIds(allNodes);
                    // new node's data object
                    let data = { 
                        vId: newNodeId,
                        name: 'newpattern' + allNodes.length,
                        label: 'I was added to the database dynamically.'
                    };
                    // create the new node and the new edges in frontend
                    nodesObj.add({ id: data.vId, label: data.label + " id #" + data.vId }); 
                    let newSelection = [data.vId]; // add new node to selection
                    // if a node is selected, automatically connect the new node
                    if( selectedNodes.length > 0 ){ 
                        getAll(['/edges']).then(function(response){
                            let allEdges = response[0];
                            newEdgeId = getIds(allEdges);
                            //console.log('selected Nodes (from): ' + selectedNodes);
                            data.from = selectedNodes, // edges from (array)
                            data.to = newNodeId; // edges to
                            data.edgevId = newEdgeId;
                            for (let i = 0; i < selectedNodes.length; i++){
                                newSelection.push(data.from[i]);
                                data.edgevId += i;
                                edgesObj.add({id: data.edgevId, from: data.from[i], to: data.to});
                            }
                            postAll(['/nodes', '/edges'], data).then(function(response){ // save nodes and edges to backend
                                console.log(response);
                            }); //postAll(nodes,edges)
                        }); //getAll(edges)
                    } // if
                    else{ postAll(['/nodes'], data); } // or if nothing was selected, post only nodes
                    network.setSelection({nodes: newSelection,});
                    checkHudDisable();
                }); // getAll(nodes)
}

exports.deleteSelectedNode = function deleteSelectedNode(){
                    let selectedNodes = network.getSelectedNodes(); // array containing ids
                    let selectedEdges = network.getSelectedEdges();
                    let selection = network.getSelection();
                    let data = {};
                    if (selectedNodes.length > 0){
                        data = { vIds: selectedNodes }; 
                        deleteAll(['/nodes'], data).then(function(response){
                            console.log(response);
                            for (let i=0; i < selectedNodes.length; i++){
                                nodesObj.remove({id: selectedNodes[i]}); // remove each selected node in frontend
                            }      
                        });                  
                    }
                    else if (selectedEdges){
                        data = { vIds: selectedEdges }; 
                        deleteAll(['/edges'], data).then(function(response){
                            console.log(response);
                            for (let i=0; i < selectedEdges.length; i++){
                                edgesObj.remove({id: selectedEdges[i]}); // remove each selected node in frontend
                            }     
                        });
                    }
                    checkHudDisable();
}

exports.connectSelectedNodes = function connectSelectedNodes(){
                    getAll(['/edges']).then(function(response){
                        let selectedNodes = network.getSelectedNodes();
                        let allEdges = response[0];
                        //console.log(allEdges.length);
                        let newEdgvId = getIds(allEdges);
                        console.log(newEdgvId);
                        let data = { 
                            from: [ selectedNodes[0] ],
                            to: selectedNodes[1],
                            edgevId: newEdgvId,
                        }
                        postAll(['/edges'], data).then(function(response){
                            console.log( response );
                        })
                        // connect nodes in frontend
                        edgesObj.add({id: data.edgevId, from: data.from[0], to: data.to});
                    });
}

exports.editSelectedNode = function editSelectedNode(){
    let editInput = document.getElementById('editInput');
    let selectedNodeId = network.getSelectedNodes(); 
    let selectedNode = nodesObj.get(selectedNodeId);
    editInput.value = selectedNode[0].label;

    document.getElementById('SaveEditButton').onclick = function(){
        selectedNode[0].label = editInput.value;
        nodesObj.update(selectedNode);
        console.log('Saved Node ' + selectedNodeId);
        updateAll(['/nodes'], selectedNode[0]);
    }
}