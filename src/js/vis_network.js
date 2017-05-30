var vis = require('vis');
var network;
network = {};
var nodesObj = {};
var edgesObj = {};
var imgDir = '../img/';

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
        node.x = allNodes[i].x;
        node.y = allNodes[i].y;
        node.label = allNodes[i].label;
        node.title = allNodes[i].title;
        node.problem = allNodes[i].problem;
        node.image = allNodes[i].image;
        node.instruction = allNodes[i].instruction;
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

    var chosenNode = function(values, id, selected, hovering) {
        values.borderWidth = 20;
        values.borderColor = '#1287A8';
    }

    var options = {
        layout: {
            hierarchical:{ enabled: false, levelSeparation: 300, nodeSpacing: 2000, sortMethod: 'directed', },
        }, // layout
        interaction:{ multiselect: true, },

        nodes: {
            shape: 'circularImage',
            size: 100,
            shapeProperties:{ interpolation: false, },
            chosen:{ label: false, node: chosenNode, },
            borderWidth: 20,
            borderWidthSelected: 15,
            labelHighlightBold: false,
            font: {
                size: 22,
                face: 'Sofia Pro Soft',
                color: '#010101',
                strokeWidth: 12,
                strokeColor: '#FFF',
                vadjust: 14,
            }, // font
            color: {
                border: '#010101',
                background: '#FFFFFF',
                highlight: { background: '#FFFFFF', border: '#1287A8' }
            }, // color
        }, // nodes

        edges:{
            smooth:{
                enabled: false,
                roundness: 0.1,
                type: 'diagonalCross',
            },
            arrows:{ to: { enabled:true, type: 'arrow' }, },
            arrowStrikethrough: true,
            width: 12,
            selectionWidth: 0,
            length: 1000,
            color: { color: '#010101', highlight: '#107896' },
        }, // edges

        physics: {
            solver: 'barnesHut',
            barnesHut:{
                avoidOverlap: 0.75,
                springLength: 400,
                centralGravity: 0,
            },
            hierarchicalRepulsion:{
                nodeDistance: 500,
                springLength: 200,
                centralGravity: 0,
            },
        }, // physics
    }; // options

    // ==================================================
    // 06 INITIALIZE THE GRAPH USING vis.Network()
    // ==================================================

    network = new vis.Network(container, data, options);

    // ==================================================
    // vis.Network() events
    // ==================================================

    network.on('selectNode', function(selection){ 
        checkHudDisable(); 
        if(selection.nodes.length < 2){
            let selectedNode = nodesObj.get(selection.nodes[0]);
            console.log(selectedNode.x);
            nodesObj.add([
                    {id: -1, label: 'Observation:\n\n' + selectedNode.problem + '\n\n', physics: true, shape: 'box', x: selectedNode.x-200, y: selectedNode.y+500, fixed: {x: true, y:true }, widthConstraint:{maximum: 400}, color:{background: '#1287A8', border: '#1287A8'}, font:{color:'#FFF', strokeWidth: 0, align: 'left'}, },
                    {id: -2, label: 'Instruction:\n\n' + selectedNode.instruction + '\n\n', physics: true, shape: 'box', x: selectedNode.x+200, y: selectedNode.y+500, fixed: {x: true, y:true }, widthConstraint:{maximum: 400}, color:{background: '#1287A8', border: '#1287A8'}, font:{color:'#FFF', strokeWidth: 0, align: 'left'}, }
                ]);
            edgesObj.add([
                    {id: -1, from: selection.nodes[0], to: -1, length: 500, color:{color: '#1287A8'}, arrows:{to:{enabled: false},}, dashes: [10,20],},
                    {id: -2, from: selection.nodes[0], to: -2, length: 500, color:{color: '#1287A8'}, arrows:{to:{enabled: false},}, dashes: [10,20],},
                ]);
            console.log(selection.nodes);
        }
        else{
            nodesObj.remove([-1,-2]);
        }
    });

    network.on('selectEdge', function(){ checkHudDisable() });

    network.on('dragEnd', function(selection){
        // record new node position
        if(selection.nodes){
            let draggedNode = nodesObj.get(selection.nodes); // array
            for(let i in draggedNode){
                draggedNode[i].x = selection.pointer.canvas.x;
                draggedNode[i].y = selection.pointer.canvas.y;
            }
            nodesObj.update(draggedNode);
        }
        checkHudDisable();
    });

    network.on('deselectEdge', function(){ checkHudDisable(); });
    
    network.on('deselectNode', function(){ 
        checkHudDisable(); 
        nodesObj.remove([-1, -2]);
        edgesObj.remove([-1, -2]);
    });

    network.on('doubleClick', function(selection){
        //if( selection.nodes.length > 0 ) { editNode(); }
            let clickLocation = { 
                clickX: selection.pointer.canvas.x,
                clickY: selection.pointer.canvas.y,
            }

            console.log('x', clickLocation.clickX);
            console.log('y', clickLocation.clickY);
            addNode(clickLocation); 
    });
    
    network.on('stabilized', function(){
        let data = network.getPositions();
        updateAll(['/positions'], data).then(function(response){
            console.log(response);
        });
    });
}); //getAll()

function checkHudDisable() { // check if HUD buttons need to be disabled, depending on what is selected
    let selectedNodes = network.getSelectedNodes();
    let selectedEdges = network.getSelectedEdges();

    switch(selectedNodes.length){
        /*case 0:
            $('#deleteNodes').className += ' disabled'; // disable delete
            break;*/
        case 0:
            document.getElementById("editNode").className = " disabled"; // disable edit
            document.getElementById("deleteNodes").className = " disabled"; // disable delete
            document.getElementById("connectNodes").className = " disabled"; // disable connect
            if(selectedEdges.length > 0){ $('#deleteNodes').removeClass('disabled'); } // enable delete for edges             
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

exports.addNode = function(){
    addNode();
};

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
                            nodesObj.remove([-1,-2]);
                            edgesObj.remove([-1,-2]);     
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
                            edgevId: [ newEdgvId ],
                        }
                        postAll(['/edges'], data).then(function(response){
                            console.log( response );
                        })
                        // connect nodes in frontend
                        edgesObj.add({id: data.edgevId[0], from: data.from[0], to: data.to});
                    });
}

exports.editSelectedNode = function editSelectedNode(){

editNode();

}


function addNode(params) {
                getAll(['/nodes']).then( function(response) {
                    let allNodes = response[0];
                    let newNodeId, newEdgeId;
                    let selectedNodes = network.getSelectedNodes(); // array
                    newNodeId = getIds(allNodes);
                    console.log('newNodeId', newNodeId);
                    // new node's data object
                    let data = { 
                        vId: newNodeId,
                        title: 'New Pattern #' + newNodeId,
                        problem: 'New Problem ' + newNodeId,
                        instruction: 'New Instruction ' + newNodeId,
                        label: '',
                        image: imgDir + '112_Entrance_transition.jpg',
                    };
                    data.label = data.title;
                    if(params){ // if click location parameters are handed, use them for new node position
                        data.x = params.clickX;
                        data.y = params.clickY;
                        if ( selectedNodes.length > 0 ){ 
                            nodesObj.remove([-1,-2]); 
                            data.y += 1000;
                        }
                    }
                    else if(selectedNodes.length > 0){ // if a node is selected, add new node near selected node
                        let selectedNode = nodesObj.get(selectedNodes[0]);
                        data.x = selectedNode.x;
                        data.y = selectedNode.y + 1000;
                        nodesObj.remove([-1,-2]);
                    }
                    else{ // in the case of no nodes on canvas
                        data.x = 0;
                        data.y = 0;
                    }
                    // create the new node and the new edges in frontend
                    nodesObj.add({ 
                        id: data.vId, 
                        title: data.title, 
                        problem: data.problem, 
                        instruction: data.instruction, 
                        label: data.label,
                        image: data.image,
                        x: data.x,
                        y: data.y,
                    }); 

                    let newSelection = [data.vId]; // add new node to selection
                    // if a node is selected, automatically connect the new node
                    if( selectedNodes.length > 0 ){ 
                        getAll(['/edges']).then(function(response){
                            let allEdges = response[0];
                            newEdgeId = getIds(allEdges);
                            console.log('New Edge Id', newEdgeId);
                            //console.log('selected Nodes (from): ' + selectedNodes);
                            data.from = selectedNodes, // edges from (array)
                            data.to = newNodeId; // edges to
                            data.edgevId = [];
                            for (let i = 0; i < selectedNodes.length; i++){
                                //newSelection.push(data.from[i]);
                                data.edgevId.push(newEdgeId+i);
                                edgesObj.add({id: data.edgevId[i], from: data.from[i], to: data.to});
                            }
                            postAll(['/nodes', '/edges'], data).then(function(response){ // save nodes and edges to backend
                                console.log(response);
                                network.unselectAll();
                                network.setSelection({nodes: newSelection, edges: data.edgevId});
                                checkHudDisable();
                                editNode();
                            }); //postAll(nodes,edges)
                        }); //getAll(edges)
                    } // if
                    else{ 
                        postAll(['/nodes'], data).then( function(response){
                            network.unselectAll();
                            network.setSelection({nodes: newSelection, edges: data.edgevId});
                            checkHudDisable();
                            console.log( response );
                            editNode();
                        }); 
                    } // or if nothing was selected, post only nodes
                }); // getAll(nodes)
}


function editNode(){
    let editWindow = document.getElementById('editWindow');
    editWindow.style.display = 'block';

    let selectedNodeId = network.getSelectedNodes(); // get array of selected nodes' ids
    let selectedNode = nodesObj.get(selectedNodeId); // array of nodes by id

    document.getElementById('patternTitleInput').value = selectedNode[0].title;
    document.getElementById('patternProblemTxtArea').value = selectedNode[0].problem;
    document.getElementById('patternInstructionTxtArea').value = selectedNode[0].instruction;
    document.getElementById('patternDiagram').src = selectedNode[0].image;

    //document.getElementById('saveEditButton').addEventListener('submit', function(e){
      $('#uploadForm').unbind('submit').bind('submit', function(event){
        event.preventDefault();
        let patternDiagram = document.getElementById('patternDiagram');

        selectedNode[0].title = document.getElementById('patternTitleInput').value;
        selectedNode[0].problem = document.getElementById('patternProblemTxtArea').value;
        selectedNode[0].instruction = document.getElementById('patternInstructionTxtArea').value;
        selectedNode[0].label = selectedNode[0].title;// + '\n\n' + selectedNode[0].problem + '\n' + selectedNode[0].instruction;

        if( document.getElementById('uploadInput').value){
            $(this).ajaxSubmit({
                data: {vId: selectedNodeId[0]},
                error: function(xhr){status('Error: ' + xhr.status);},
                success: function(response){ 
                    console.log( response );
                        patternDiagram.setAttribute('src', '../uploads/' + response + '?' + new Date().getTime());
                        selectedNode[0].image = patternDiagram.getAttribute('src');
                        nodesObj.update(selectedNode); // update node on frontend
                        console.log('Saved Node ' + selectedNodeId);
                        updateAll(['/nodes'], selectedNode[0]); // update node on DB
                }
            });
        }
        else{
            nodesObj.update(selectedNode); // update node on frontend
            console.log('Saved Node ' + selectedNodeId);
            updateAll(['/nodes'], selectedNode[0]); // update node on DB     
        }

        editWindow.style.display = 'none';
        return false;
    });

    document.getElementById('cancelEditButton').onclick = function(){
        editWindow.style.display = 'none';
        document.getElementById('saveEditButton').removeAttribute("onclick");
        document.getElementById('cancelEditButton').removeAttribute("onclick");
    }

    //return data;
}