var vis = require('vis');
var nodesObj, edgesObj, currentNodeCount, network;
network = {};

/* ==================================================
/* CREATE THE NODES & EDGES ARRAYS USING DataSet()
/* ==================================================
*/

function getNodes(url){
    return new Promise( function (resolve, reject){
        let visDbReq = new XMLHttpRequest(); // http request for getting nodes from the database
        visDbReq.open('GET', url, true); // initialize the request
        
        visDbReq.onload = function(){ // check the status
            if ( visDbReq.status == 200 ){ resolve(visDbReq.response); }
            else{ reject(Error(visDbReq.statusText)); }
        };
        visDbReq.onerror = function(){ // handle network errors
            reject(Error('Network Error'));
        };
        visDbReq.send(null); // send the request, takes Parameters for POST requests                
    });
} // getNodes(url);

getNodes('/nodes').then(function(response){
    let allNodes = JSON.parse( response );
    let nodesArray, edgesArray;
    nodesArray = []; // array of Node Objects
    edgesArray = []; // array of Edge Objects
    currentNodeCount = allNodes.length;
    //console.log( currentNodeCount );

    for ( let i = 0; i < currentNodeCount; i++ ){
        // objects to push to the nodes/edges arrays
        let node = {}; 
        let edge = {};

        // create initial Nodes
        node.id = allNodes[i].id; // first nodeId = 0, second nodeId = 1, ...
        node.label = allNodes[i].label + ' id #' + allNodes[i].id;
        //console.log(node);
        nodesArray.push( node ); // append each i to the nodes Array

        // create initial edges
        if (i > 0) {
            edge.from = i-1; // set previous node as edge start
            edge.to = i;  // set this node as edge end
            edgesArray.push( edge ); // push edge to edges Array, produces a linear connection of initial nodes
        } //  if i > 0
    } // for i < currentNodeCount
    // convert Edges and Nodes Arrays to Objects
    nodesObj = new vis.DataSet(nodesArray);
    edgesObj = new vis.DataSet(edgesArray);

    /* ==================================================
    /* GET THE NODE NETWORK CONTAINER DIV
    /* ==================================================
    */

    var container = document.getElementById('patternLanguage');

    /* ==================================================
    /* 05 GATHER THE NODES/EDGES DATA AND SET OPTIONS
    /* ==================================================
    */

    var data = {
        nodes: nodesObj,
        edges: edgesObj
    };


    var options = {
        interaction:{
            multiselect: true,
        },
        layout: {
            /*hierarchical: {
                direction: 'UD'
            }*/
        },
        // canvas option
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
                highlight: '#010101'
            },
            scaling:{
            }
        },
        physics: {                  // http://visjs.org/docs/network/physics.html
          barnesHut: {              // for the barnesHut solver (see 'solver' module)
            avoidOverlap: 0.5,      // control the node overlap 0...1 
          }  
        },
        /* Other Modules:
        /* edges: {}                // http://visjs.org/docs/network/edges.html
        /* groups: {}               // http://visjs.org/docs/network/groups.html
        /* interaction: {}          // http://visjs.org/docs/network/interaction.html
        /* layout: {}               // http://visjs.org/docs/network/layout.html
        /* manipulation: {}         // http://visjs.org/docs/network/manipulation.html
        /*
        /* Other Otions:
        /* autoResize: true         // detect when the container is resized
        /* height:
        /* width:
        /* locale: en               // language
        /* locales:                 // custom translations
        /* clickToUse:              // network only handles events when :active
        */ 

    };

    /* ==================================================
    /* 06 INITIALIZE THE GRAPH USING vis.Network()
    /* ==================================================
    */

    network = new vis.Network(container, data, options);
    //console.log(network);

    console.log(network);

    // NETWORK SELECT EVENTS
    network.on('selectNode', function(){ checkHudDisable(); });
    network.on('deselectNode', function(){ checkHudDisable(); });
}); //getNodes()


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

//MODULE EXPORTS
var exports = module.exports = {};
exports.network = network;
exports.addNode = function addNode() {
                    let newId = currentNodeCount++;
                    currentNodeCount++;
                    let selectedNodes = network.getSelectedNodes(); // array
                    let newSelection = [newId];

                    nodesObj.add({ id:newId, label: "New Pattern id:" + newId });
                    if( selectedNodes ){
                        for (let i = 0; i < selectedNodes.length; i++){
                            newSelection.push(selectedNodes[i]);
                            edgesObj.add({from: selectedNodes[i], to: newId});
                        }
                    }

                    network.setSelection({nodes: newSelection,});
                    checkHudDisable();
                };

exports.deleteSelectedNode = function deleteSelectedNode(){
                    let selectedNodes = network.getSelectedNodes();
                    for (let i=0; i < selectedNodes.length; i++){
                        nodesObj.remove({id: selectedNodes[i]});    
                    }
                    checkHudDisable();
                    
                };

exports.connectSelectedNodes = function connectSelectedNodes(){
                    if( network.getSelectedNodes() ){
                        let selectedNodes = network.getSelectedNodes();
                        let i = 0;
                        edgesObj.add({from: selectedNodes[i], to: selectedNodes[i+1]});
                    }
                };
