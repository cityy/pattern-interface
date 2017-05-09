var vis = require('vis');
var currentNodeCount, network, currentIds;
network = {};
currentIds = [];
var nodesObj = {};
var edgesObj = {};

/* ==================================================
/* CREATE THE NODES & EDGES ARRAYS USING DataSet()
/* ==================================================
*/

function getAll(url){ // url is an array
    return new Promise( function (resolve, reject) {
        var f = {
            send: function(i){
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
            } // function(i)
        } // obj f

        // array that holds all the request promises
        var promises = []; 
        // for each requested url, push one response
        for (let i = 0; i < url.length; i++){
            promises.push( f.send(i) );
        }
        // if all sub promises are done, resolve the getAll promise
        Promise.all(promises).then(function(dataArr){
            resolve(dataArr); 
        });
    }); // return
} // getAll(url);



getAll( ["/nodes", "/edges"] ).then(function(responseArr){
    let allNodes = JSON.parse( responseArr[0] );
    let allEdges = JSON.parse ( responseArr[1] );
    var nodesArray = []; // array of Node Objects
    var edgesArray = []; // array of Edge Objects
    // if there is nodes, set current node counter - else set current node counter to 0
    if(allNodes.length){ currentNodeCount = allNodes.length; }
    else{ currentNodeCount = 0; }
    // loop through the nodes responded by the server
    for ( let i = 0; i < currentNodeCount; i++ ){
        // create initial Nodes
        let node = {};
        node.id = allNodes[i].id; // first nodeId = 0, second nodeId = 1, ...
        node.label = allNodes[i].label + ' id #' + allNodes[i].id;
        //console.log(node);
        nodesArray.push( node ); // append each i to the nodes Array
    } // for i < currentNodeCount
    // create initial edges
    if (allEdges) {
        for(let i = 0; i < allEdges.length; i++){
            /*console.log('EDGE:' + allEdges[i]['@rid']);
            console.log('From:' + allEdges[i].out);
            console.log('To:' + allEdges[i].in);
            console.log(JSON.stringify(allEdges[i]));*/
            let edge = {};
            edge.from = allEdges[i].fromId;
            edge.to = allEdges[i].toId;
            edgesArray.push( edge );
        } // for
    } //  if i > 0
    console.log( edgesArray );
    // convert Edges and Nodes Arrays to Objects
    nodesObj = new vis.DataSet( nodesArray );
    edgesObj = new vis.DataSet(edgesArray);

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
        // Other Modules:
        // edges: {}                // http://visjs.org/docs/network/edges.html
        // groups: {}               // http://visjs.org/docs/network/groups.html
        // interaction: {}          // http://visjs.org/docs/network/interaction.html
        // layout: {}               // http://visjs.org/docs/network/layout.html
        // manipulation: {}         // http://visjs.org/docs/network/manipulation.html
        //
        // Other Otions:
        // autoResize: true         // detect when the container is resized
        // height:
        // width:
        // locale: en               // language
        // locales:                 // custom translations
        // clickToUse:              // network only handles events when :active
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
                    let allNodes = JSON.parse( response[0] );
                    let newId;
                    // if there are nodes
                    if(currentNodeCount > 0){
                        // get the currently used ids
                        for (let i=0; i < currentNodeCount; i++ ) {
                            currentIds[i] = allNodes[i].id;
                        }
                        // sort currently used ids in descending order
                        currentIds.sort(function(a,b){return b-a});
                        newId = currentIds[0] + 1;
                    }
                    // if there are no nodes start with id=0
                    else{ newId = 0; }
                    // new node's data object
                    let data = { 
                        id: newId,
                        name: 'newpattern' + currentNodeCount,
                        label: 'I was added to the database dynamically.'
                    };

                    // create the http post request
                    let postNodeReq = new XMLHttpRequest();
                    postNodeReq.open('POST', '/nodes', true);
                    postNodeReq.setRequestHeader("Content-type", "application/json; charset=utf-8");

                    postNodeReq.addEventListener('load', function(event) {
                          if (postNodeReq.status >= 200 && postNodeReq.status < 300) {
                             console.log(postNodeReq.responseText);
                          } else {
                             console.warn(postNodeReq.statusText, postNodeReq.responseText);
                          }
                    });
                    // send the request, parameters have to be in json format
                    postNodeReq.send( JSON.stringify(data) ); 

                    // create the new node in frontend
                    nodesObj.add({ id: data.id, label: data.label + " id #" + data.id }); 
                    currentNodeCount++;

                    let selectedNodes = network.getSelectedNodes(); // array
                    let newSelection = [data.id]; // add new node to selection

                    // if a node is selected, automatically connect the new node
                    if( selectedNodes ){ 
                        for (let i = 0; i < selectedNodes.length; i++){
                            newSelection.push(selectedNodes[i]);
                            edgesObj.add({from: selectedNodes[i], to: data.id});
                        }
                    }

                    network.setSelection({nodes: newSelection,});
                    checkHudDisable();
                });
}

exports.deleteSelectedNode = function deleteSelectedNode(){
                    let selectedNodes = network.getSelectedNodes(); // array containing ids
                    let deleteNodesReq = new XMLHttpRequest();
                    let data = { ids: selectedNodes }; 

                    deleteNodesReq.open('DELETE', '/nodes', true);
                    deleteNodesReq.setRequestHeader("Content-type", "application/json; charset=utf-8");
                    deleteNodesReq.addEventListener('load', function(event) {
                          if (deleteNodesReq.status >= 200 && deleteNodesReq.status < 300) {
                             console.log(deleteNodesReq.responseText);
                          } else {
                             console.warn(deleteNodesReq.statusText, deleteNodesReq.responseText);
                          }
                    });
                    // send the request, parameters have to be in json format
                    deleteNodesReq.send( JSON.stringify(data) ); 

                    for (let i=0; i < selectedNodes.length; i++){
                        nodesObj.remove({id: selectedNodes[i]}); // remove each selected node in frontend
                        currentNodeCount--; // decrease nodecount for each deleted node
                    }
                    checkHudDisable();
                    
                }

exports.connectSelectedNodes = function connectSelectedNodes(){
                    let connectNodesReq = new XMLHttpRequest();
                    let selectedNodes = network.getSelectedNodes();
                    let data = { 
                        from: selectedNodes[0],
                        to: selectedNodes[1]
                    }
                    connectNodesReq.open('POST', '/edges', true);
                    connectNodesReq.setRequestHeader("Content-type", "application/json; charset=utf-8");

                    connectNodesReq.addEventListener('load', function(event) {
                          if (connectNodesReq.status >= 200 && connectNodesReq.status < 300) {
                             console.log(connectNodesReq.responseText);
                          } else {
                             console.warn(connectNodesReq.statusText, connectNodesReq.responseText);
                          }
                    });
                    // send the request, parameters have to be in json format
                    connectNodesReq.send( JSON.stringify(data) ); 
                    // connect nodes in frontend
                    edgesObj.add({from: data.from, to: data.to});
                }