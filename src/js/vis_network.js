var vis = require('vis');
//window.jQuery = window.$ = require('jquery');
var network;
network = {};
var nodesObj = {};
var edgesObj = {};
var imgDir = '../img/';
var container = document.getElementById('patternLanguage');
var selectedNodesArr = [];

// =========================================================
// VISJS NETWORK OPTIONS
// =========================================================

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
        widthConstraint:{
            //   enabled: true,
            minimum: 150,
            maximum: 190,
        },
        //shape: 'circularImage',
        shape: 'circle',
        size: 150,
        shapeProperties:{ interpolation: false, },
        chosen:{ label: false, node: chosenNode, },
        borderWidth: 15,
        borderWidthSelected: 15,
        labelHighlightBold: false,
        font: {
            size: 28,
            face: 'Sofia Pro Soft',
            color: '#010101',
            strokeWidth: 12,
            strokeColor: '#FFF',
            vadjust: 14,
        }, // font
        color: {
            border: '#EFEFEF',
            background: '#EFEFEF',
            highlight: { background: '#1287A8', border: '#1287A8' }
        }, // color
    }, // nodes

    edges:{
        smooth:{
            enabled: false,
            roundness: 0.1,
            type: 'diagonalCross',
        },
        arrows:{ to: { enabled: true, type: 'arrow', scaleFactor: 1.8 }, },
        arrowStrikethrough: true,
        width: 1,
        selectionWidth: 1,
        length: 1000,
        color: { color: '#DEDEDE', highlight: '#107896' },
    }, // edges

    physics: {
        enabled: false,
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

var visjsInterface = {};

function pushNodes(allNodes){
    let nodesArray = [];
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
    return nodesArray;
}

function pushEdges(allEdges){
    let edgesArray = [];
    // create initial edges
    if (allEdges.length > 0) {
        for(let i = 0; i < allEdges.length; i++){
            let edge = {};
            edge.from = allEdges[i].fromId;
            edge.to = allEdges[i].toId;
            edge.id = allEdges[i].vId;
            edge.text = allEdges[i].text;
            edgesArray.push( edge );
        } // for
    } //  if i > 0
    return edgesArray;
}

function updateNodePosition(selection){
    // record new node position
    if(selection.nodes.length > 0){
        let draggedNode = nodesObj.get(selection.nodes); // array
        for(let i in draggedNode){
            draggedNode[i].x = selection.pointer.canvas.x;
            draggedNode[i].y = selection.pointer.canvas.y;
        }
        nodesObj.update(draggedNode);
    }
}

/*visjsInterface.initProjectNetwork = function(projectname){
    return new Promise(function(resolve, reject){
        getAll(["/nodes/" + projectname, '/edges/' + projectname]).then(function(responseArr){
            let allNodes = responseArr[0];
            let allEdges = responseArr[1];
            // convert arrays returned by the db to visjs format
            var nodesArray = pushNodes(allNodes);
            var edgesArray = pushEdges(allEdges);
            // convert Edges and Nodes Arrays to visjs Objects
            nodesObj = new vis.DataSet( nodesArray );
            edgesObj = new vis.DataSet( edgesArray );
        }) // getAll()
    });
} */ // initProjectNetwork()

// =========================================================
// UI ELEMENTS
// =========================================================
let patternEdit = document.getElementById('patternEdit');
var patternClassEdit = document.getElementById('patternClassEdit');

let patternWindow = document.getElementById('patternWindow')
let patternContent = document.getElementById('patternContent');
let patternRelation = document.getElementById('patternRelation');
let patternTitle = document.getElementById('patternTitle');
let patternObservation = document.getElementById('patternObservation');
let patternInstruction = document.getElementById('patternInstruction');
let patternContentDiagram = document.getElementById('patternContentDiagram');

let patternRelationTitleA = document.getElementById('patternRelationTitleA');
let patternRelationTitleB = document.getElementById('patternRelationTitleB');
let relationText = document.getElementById('relationText');
let patternRelationDiagramA = document.getElementById('patternRelationDiagramA');
let patternRelationDiagramB = document.getElementById('patternRelationDiagramB');

let patternRelationTxtArea = document.getElementById('patternRelationTxtArea');
let relationForm = document.getElementById('relationForm');

let searchWindow = document.getElementById('searchWindow');


visjsInterface.initCommonNetwork = function(){
    return new Promise( function(resolve, reject){
        getAll( ["/nodes", "/edges"] ).then(function(responseArr){
            let allNodes = responseArr[0]; // get nodes from db
            let allEdges = responseArr[1]; // get edges from db
            // convert arrays returned by the db to visjs format
            var nodesArray = pushNodes(allNodes);
            var edgesArray = pushEdges(allEdges);
            // convert Edges and Nodes Arrays to visjs Objects
            nodesObj = new vis.DataSet( nodesArray );
            edgesObj = new vis.DataSet( edgesArray );
            // 05 GATHER THE NODES/EDGES DATA AND SET OPTIONS
            var data = {
                nodes: nodesObj,
                edges: edgesObj
            };
            // 06 INITIALIZE THE GRAPH USING vis.Network()
            network = new vis.Network(container, data, options);

            // ==================================================
            // vis.Network() events (TODO: TURN EVENT ACTIONS INTO FUNCTIONS FOR REUSE)
            // ==================================================

            var previousConnectedNodes = [];
            var previousConnectedEdges = [];
            function getConnectedNodes(selection){
                // color connected nodes black
                let connectedNodeIds = network.getConnectedNodes(selection.nodes[0]);
                let connectedNodes = nodesObj.get(connectedNodeIds);
                let selectedNodes = nodesObj.get(selection.nodes);
                let connectedEdgeIds = network.getConnectedEdges(selection.nodes[0]);
                let connectedEdges = edgesObj.get(connectedEdgeIds);
                let updateDataNodes = [];
                let updateDataEdges = [];

                for(let i in connectedNodeIds){
                    let gatherAngle = ( (360/connectedNodeIds.length)*i ) / 180 * Math.PI;
                    updateDataNodes[i] = {};
                    updateDataNodes[i].id = connectedNodes[i].id;
                    updateDataNodes[i].prevX = connectedNodes[i].x;
                    updateDataNodes[i].prevY = connectedNodes[i].y;
                    updateDataNodes[i].id = connectedNodes[i].id;
                    updateDataNodes[i].color = {border: '#010101', background: '#010101'};
                    updateDataNodes[i].x = selectedNodes[0].x + ( Math.cos(gatherAngle) * (400 + connectedNodeIds.length*30) ) /*+ ( Math.cos(gatherAngle) )*Math.pow(connectedNodeIds.length, 3)*0.05*/;
                    updateDataNodes[i].y = selectedNodes[0].y + ( Math.sin(gatherAngle) * (400 + connectedNodeIds.length*30) ) /*+ ( Math.cos(gatherAngle) )*Math.pow(connectedNodeIds.length, 3)*0.05*/;
                    previousConnectedNodes[i] = updateDataNodes[i]; // save the connected nodes in order to be able to deselct them
                }
                for(let i in connectedEdgeIds){
                    updateDataEdges[i] = {};
                    updateDataEdges[i].id = connectedEdges[i].id;
                    updateDataEdges[i].color = {color: '#010101'};
                    updateDataEdges[i].width = 8;
                    previousConnectedEdges[i] = updateDataEdges[i];
                }
                nodesObj.update(updateDataNodes);
                edgesObj.update(updateDataEdges);
                /*console.log(nodesObj);
                    for(let j = 0; j < updateData.length; j++){
                        let tempid = updateData[j].id; 
                        if( nodesObj._data[tempid] !== undefined ){
                            console.log('splicing')
                            
                        }
                    }*/
                //console.log(nodesObj._data);
            }

            function resetConnectedNodes(){
                if(previousConnectedNodes.length > 0){
                    for(let i in previousConnectedNodes){
                        previousConnectedNodes[i].color = {border: '#EFEFEF', background: '#EFEFEF'};
                        previousConnectedNodes[i].x = previousConnectedNodes[i].prevX;
                        previousConnectedNodes[i].y = previousConnectedNodes[i].prevY;
                    }
                    for(let i in previousConnectedEdges){
                        previousConnectedEdges[i].color = {color: '#DEDEDE'};
                        previousConnectedEdges[i].width = 1;
                    }
                    nodesObj.update(previousConnectedNodes);
                    edgesObj.update(previousConnectedEdges);
                    previousConnectedNodes = [];
                    previousConnectedEdges = [];
                }
            }

            function showPatternContent(selectedNode){
                patternEdit.style.display = 'none';
                patternTitle.innerHTML = selectedNode.title;
                patternObservation.innerHTML = selectedNode.problem;
                patternInstruction.innerHTML = selectedNode.instruction;
                patternContentDiagram.setAttribute('src', '../uploads/' + selectedNode.image);
                patternRelation.style.display = 'none';
                patternWindow.style.display = 'block';
                patternContent.style.display = 'block';
            }

            function hidePatternContent(){
                patternWindow.style.display = 'none';
                patternContent.style.display = 'none';
            }

            function showPatternRelation(selectedNodes, selectedEdges){
                if(selectedNodes.length === 0){
                    console.log('No nodes passed - getting nodes from Edge');
                    selectedNodes.push(nodesObj.get(selectedEdges[0].from));
                    selectedNodes.push(nodesObj.get(selectedEdges[0].to));
                    console.log(selectedNodes);
                }
                // if selectednode[0] is connected to [1]
                    // set pattern relation contents
                    // show pattern Relation
                let relationEdge;
                for(let i in selectedEdges){
                    if(selectedNodes[0].id === selectedEdges[i].from || selectedNodes[0].id === selectedEdges[i].to){
                        if(selectedNodes[1].id === selectedEdges[i].from || selectedNodes[1].id === selectedEdges[i].to){
                            relationEdge = selectedEdges[i];
                            patternContent.style.display = 'none';
                            patternRelation.style.display = 'block';
                            patternWindow.style.display = 'block';
                            console.log(selectedEdges[i].text);
                            relationText.innerHTML = relationEdge.text;
                            patternRelationTitleA.innerHTML = 'FROM: ' + nodesObj.get([relationEdge.from])[0].title;
                            patternRelationTitleB.innerHTML = 'TO: ' + nodesObj.get([relationEdge.to])[0].title;
                            patternRelationDiagramA.setAttribute('src', '../uploads/' + nodesObj.get([relationEdge.from])[0].image );
                            patternRelationDiagramB.setAttribute('src', '../uploads/' + nodesObj.get([relationEdge.to])[0].image );
                        } // if
                    } // if
                } // for
                // else: hide PatternWindow 
            }

            function moveToSelected(selectedNodes){
                networkCircleShape();
                if(selectedNodes[0].prevX){
                    network.moveTo({
                        position:{x: selectedNodes[0].prevX, y: selectedNodes[0].prevY},
                        scale: 0.451,
                        animation:{ duration: 500, },
                    });
                }
                else{
                    network.moveTo({
                        position:{x: selectedNodes[0].x, y: selectedNodes[0].y},
                        scale: 0.451,
                        animation:{ duration: 500, },
                        });
                }
            } // movetoSelected

            function networkCircleShape(){ network.setOptions({nodes:{shape: 'circle', font:{vadjust: 130 }}}); }
            function networkCircularImageShape(){ network.setOptions({nodes:{shape: 'circularImage', font:{vadjust: 5 }}}); }

            network.on('select', function(selection){
                // keep track of selected nodes
                let selectedNodes = nodesObj.get(selection.nodes);
                let selectedEdges = edgesObj.get(selection.edges);
                // keep track of selected edges
                if(selection.nodes.length === 1){ 
                    moveToSelected(selectedNodes);
                    resetConnectedNodes(); getConnectedNodes(selection); 
                    console.log(selectedNodes);
                    showPatternContent(selectedNodes[0]);
                }
                else if(selection.nodes.length === 2 || selection.edges.length === 1){
                    showPatternRelation(selectedNodes, selectedEdges);
                }
                else{ resetConnectedNodes(); hidePatternContent(); }
            });

            network.on('dragEnd', function(selection){ 
                console.log(selection);
                updateNodePosition(selection); 
                let selectedNodes = nodesObj.get(selection.nodes);
                let data = network.getPositions();
                if(selection.nodes.length > 0){
                    moveToSelected(selectedNodes);
                    resetConnectedNodes(); getConnectedNodes(selection);
                    showPatternContent(selectedNodes[0]);
                    updateAll(['/positions'], data).then(function(response){
                        console.log(response);
                    });
                }
            });

            network.on('doubleClick', function(selection){
                let clickLocation = {clickX: selection.pointer.canvas.x, clickY: selection.pointer.canvas.y,}
                visjsInterface.addNode(clickLocation); 
            });

            network.on('zoom', function(zoom){
                if(zoom.scale > 0.45){ networkCircularImageShape(); }
                else{ networkCircleShape(); }
            });

            network.on('animationFinished', function(){ networkCircularImageShape(); });

            var isSearch = false;
            window.addEventListener('keydown', function(e){
                let keyCode = e.keyCode;
                if(keyCode === 70 && document.getElementById('patternWindow').style.display === 'none' && document.getElementById('searchInput') != document.activeElement ){ // f
                    toggleSearch();
                } 
            });
            function toggleSearch(){
                    if(isSearch){
                        searchWindow.style.display = 'none';
                        isSearch = false;
                        document.getElementById('searchInput').value = '';
                    }
                    else{
                        searchWindow.style.display = 'block';
                        window.setTimeout(function(){
                            document.getElementById('searchInput').focus();
                        }, 50);
                        isSearch = true;
                    }
            }
        // submission of the search form
        document.getElementById('searchForm').addEventListener('submit', function(){
            event.preventDefault();
            let newSelection = [];
            document.getElementById('searchWindow').style.display = 'none';
            let allNodes = nodesObj.get();
            let jumpToNode;
            for(let i in allNodes){
                let currentLabel = allNodes[i].label;
                let searchInput = document.getElementById('searchInput').value;
                if(currentLabel.includes(searchInput)  || currentLabel.toLowerCase().includes( searchInput ) ){
                    console.log('Found node with id #' + allNodes[i].id + ': ' + allNodes[i].label);
                    newSelection.push(allNodes[i].id);
                    jumpToNode = allNodes[i];
                }
            }
            network.setSelection({nodes: newSelection});
            moveToSelected( nodesObj.get(network.getSelectedNodes()) );
            document.getElementById('searchInput').value = '';
            isSearch = false;
        });
        document.getElementById('cancelSearch').addEventListener('click', function(){
            toggleSearch();
        });

            resolve(network);
            //visjsInterface.network = network; // export the network object on promise resolve
        }); //getAll()
        }); // return new Promise
} // init Network


// ==================================================
// HANDLE PATTERN CLASSES
// ==================================================

var patternClassSelect = document.getElementById('patternClassSelect');
patternClassSelect.addEventListener('change', function(){
    //alert('the consequences will never be the same');
    //console.log(patternClassSelect.options[patternClassSelect.selectedIndex].id);
    if(patternClassSelect.options[patternClassSelect.selectedIndex].id === 'managePatternClasses'){
        console.log('manage the damn classes');
        patternEdit.style.display = 'none';
        patternClassEdit.style.display = 'block';
    }
});


visjsInterface.feedDebugger = function(){
    let allVisIds = nodesObj.getIds()
    document.getElementById('d_CurrentNodeIdsVis').innerHTML = '[' + allVisIds.length + ']: ' + allVisIds;
    getAll(['/nodes']).then(function(response){
            let allIds = [];
            for(let i in response[0]){
                allIds.push(response[0][i].vId);
            }
            allIds.sort(function(a,b){return a-b});
            document.getElementById('d_CurrentNodeIdsOrient').innerHTML = '[' + allIds.length + ']: ' + allIds;
    });
}

visjsInterface.deleteSelectedNodes = function(){
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
                    patternWindow.style.display = 'none';
};

visjsInterface.connectSelectedNodes = function(){
                    getAll(['/edges']).then(function(response){
                        let selectedNodes = network.getSelectedNodes();
                        let allEdges = response[0];
                        //console.log(allEdges.length);
                        console.log(selectedNodes);
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
                        network.setSelection({edges: [data.edgevId[0]] }, {unselectAll: false});
                    });
};

visjsInterface.swapEdgeDirection = function(){
    let selectedEdges = network.getSelectedEdges();
    let edgesArr = edgesObj.get(selectedEdges);
    for(let i in edgesArr){
        let temp = edgesArr[i].to;
        edgesArr[i].to = edgesArr[i].from;
        edgesArr[i].from = temp;
    }
    edgesObj.update(edgesArr);
    updateAll(['/edges'], edgesArr);
    patternRelationTitleA.innerHTML = 'FROM: ' + nodesObj.get([edgesArr[0].from])[0].title;
    patternRelationTitleB.innerHTML = 'TO: ' + nodesObj.get([edgesArr[0].to])[0].title;
    patternRelationDiagramA.setAttribute('src', '../uploads/' + nodesObj.get([edgesArr[0].from])[0].image );
    patternRelationDiagramB.setAttribute('src', '../uploads/' + nodesObj.get([edgesArr[0].to])[0].image );
    //showPatternRelation(null, edgesObj.get( network.getSelectedEdges() ) );
}

visjsInterface.addNode = function(params){
    getAll(['/nodes']).then( function(response){
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
        console.log('Params: ' + params);
        if(params){ // if click location parameters are handed, use them for new node position
            data.x = params.clickX;
            data.y = params.clickY;
            if ( selectedNodes.length > 0 ){ 
                //nodesObj.remove([-1,-2]); 
                data.y += 1000;
            }
        }
        else if(selectedNodes.length > 0){ // if a node is selected, add new node near selected node
            let selectedNode = nodesObj.get(selectedNodes[0]);
            data.x = selectedNode.x;
            data.y = selectedNode.y + 1000;
            //nodesObj.remove([-1,-2]);
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
                console.log('Current dataset to push to db: ' + data);
                postAll(['/nodes', '/edges'], data).then(function(response){ // save nodes and edges to backend
                    console.log(response);
                    network.unselectAll();
                    network.setSelection({nodes: newSelection, edges: data.edgevId});
                    visjsInterface.editSelectedNode();
                }); //postAll(nodes,edges)
            }); //getAll(edges)
        } // if
        else{ 
            console.log('Current dataset to push to db: ' + data);
            postAll(['/nodes'], data).then( function(response){
                network.unselectAll();
                network.setSelection({nodes: newSelection, edges: data.edgevId});
                console.log( response );
                visjsInterface.editSelectedNode();
            }); 
        } // or if nothing was selected, post only nodes
    }); // getAll(nodes)
};

visjsInterface.editSelectedEdge = function(){
    let selectedEdgeIds = network.getSelectedEdges();
    let selectedEdges = edgesObj.get(selectedEdgeIds);
    let selectedNodeIds = network.getSelectedNodes();
    let selectedNodes = nodesObj.get(selectedNodeIds);
    let relationEdges = [];

    // get the edge connecting the two selected nodes
    if(selectedNodes.length === 2){
        for(let i = 0; i < selectedEdges.length; i++){
            if(selectedNodes[0].id === selectedEdges[i].from || selectedNodes[0].id === selectedEdges[i].to){
                if(selectedNodes[1].id === selectedEdges[i].from || selectedNodes[1].id === selectedEdges[i].to){
                    relationEdges.push(selectedEdges[i]);
                }
            } // if
        } // for
    } // if

    document.getElementById('patternRelationTxtArea').value = relationEdges[0].text;
    relationText.innerHTML = relationEdges[0].text;

    patternContent.style.display = 'none';
    patternEdit.style.display = 'none';
    patternRelation.style.display = 'block';
    relationText.style.display = 'none';
    patternRelationTxtArea.style.display = 'block';
    relationForm.style.display = 'block';
    patternWindow.style.display = 'block';

    $('#relationForm').unbind('submit').bind('submit', function(event){
        event.preventDefault();
        relationEdges[0].text = document.getElementById('patternRelationTxtArea').value;
       
        edgesObj.update(relationEdges);
        updateAll(['/edges'], relationEdges);
        patternRelationTxtArea.style.display = 'none';
        relationForm.style.display = 'none';
        relationText.innerHTML = relationEdges[0].text;
        relationText.style.display = 'block';
        return false;
    });
}

visjsInterface.editSelectedNode = function(){
    let patternWindow = document.getElementById('patternWindow');
    let patternEdit = document.getElementById('patternEdit');
    let relationEdit = document.getElementById('relationEdit');
    let patternContent = document.getElementById('patternContent');
    let patternRelation = document.getElementById('patternRelation');
    patternContent.style.display  = 'none';
    patternRelation.style.display = 'none';
    patternEdit.style.display = 'block';
    patternWindow.style.display  = 'block';

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

        patternEdit.style.display = 'none';
        patternTitle.innerHTML = selectedNode[0].title;
        patternObservation.innerHTML = selectedNode[0].problem;
        patternInstruction.innerHTML = selectedNode[0].instruction;
        patternContent.style.display = 'block';
        document.getElementById('uploadInput').value == "";
        return false;
    });

    document.getElementById('cancelEditButton').onclick = function(){
        patternEdit.style.display = 'none';
        patternTitle.innerHTML = selectedNode[0].title;
        patternObservation.innerHTML = selectedNode[0].problem;
        patternInstruction.innerHTML = selectedNode[0].instruction;
        patternContentDiagram.setAttribute('src', '../uploads/' + selectedNode[0].image);
        patternContent.style.display = 'block';
        document.getElementById('saveEditButton').removeAttribute("onclick");
        document.getElementById('cancelEditButton').removeAttribute("onclick");
    }
    //return data;
};

visjsInterface.createDefaultProjectNetwork(){
    // take all nodes from the common network (should be current) and post them to the default project
    let data = {};
    nodesObj.get(); // all nodes
    edgesObj.get(); // all edges
    //postAll(['/nodes/proj', '/edges/proj'], data);
}

var exports = module.exports = visjsInterface;