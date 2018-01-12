var vis = require('vis');
var bug = require('./m_bugLog.js');
var beDb = require('./m_backendDb.js');
var clUI = require('./m_clUI.js')
var clUsr = require('./m_clUser.js');

// =========================================================
// UI ELEMENTS
// TODO: UNCLUTTER ALL FRONTEND/GRAPH JUNK
// =========================================================
// let userprojects = document.getElementById('userprojects');
// var loginNoticeDismiss = document.getElementById('loginDismiss');
// loginNoticeDismiss.addEventListener('click', function(){
//     currentProject = userprojects.options[userprojects.selectedIndex].text;
// });

(function(){
	var feGraph = {
		options: { // network options - http://visjs.org/docs/network/
			layout: {
				hierarchical:{
					enabled: false, 
					levelSeparation: 300, 
					nodeSpacing: 2000, 
					sortMethod: 'directed', 
				},
			}, // layout
			interaction: { multiselect: true, },
			nodes: {
				brokenImage: '/uploads/' + '000-newNode.jpg',
				widthConstraint:{
					//   enabled: true,
					minimum: 150,
					maximum: 190,
				},
				//shape: 'circularImage',
				shape: 'circle',
				size: 150,
				shapeProperties:{ interpolation: false, },
				chosen:{ 
					label: false, 
					node: function(values, id, selected, hovering) {
									values.borderWidth = 20;
									values.borderColor = '#1287A8';
					}, 
				},
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
				smooth:{ enabled: false, roundness: 0.1, type: 'diagonalCross', },
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
		}, //feGraph.options
		meta: { // meta, selection states, canvas etc. - http://visjs.org/docs/network
			container: document.getElementById('patternLanguage'),
			network: undefined,
			project: {
				current: {},
				getCurrent: function(){
					// GET THE INITIAL PROJECT FROM THE DATABASE
					// 01 by default use first retrived project as current
					// 02 check if there is a most recently used project
					return new Promise( function(resolve, reject){
						beDb.getAll(['/projects']).then( 
							function(projects){ // projects is a 2D arr of objs, contains common, user and collab projects
								feGraph.meta.project.current.title = projects[0][0].title; 
								feGraph.meta.project.current.projectid = projects[0][0].projectid; 
								feGraph.meta.project.current.common = projects[0][0].common; 
								// for(let i in projects[0]){ 
								// 	if(projects[0][i].status === 'mostRecent'){ feGraph.meta.project.current = projects[0][i].name; }
								// }
								resolve( feGraph.meta.project.current );
							}); // then.(...)
						} 
					); // return new Promise
				}, // feGraph.meta.project.getCurrent();
			}, // feGraph.meta.project()
			setShapeCircle: function(){ feGraph.meta.network.setOptions({nodes:{shape: 'circle', font:{vadjust: 130 }}}); },
			setShapeCircularImage: function(){ feGraph.meta.network.setOptions({nodes:{shape: 'circularImage', font:{vadjust: 5 }}}); },
			focusSelected: function(selectedNodes){
				feGraph.meta.setShapeCircle();
				if(selectedNodes[0].prevX){
					feGraph.meta.network.moveTo({
						position:{x: selectedNodes[0].prevX, y: selectedNodes[0].prevY},
						scale: 0.451,
						animation:{ duration: 500, },
					});
				}
				else{
					feGraph.meta.network.moveTo({
						position:{x: selectedNodes[0].x, y: selectedNodes[0].y},
						scale: 0.451,
						animation:{ duration: 500, },
					});
				}
			}, // movetoSelected
			init: function(projectData){
				// INITIALIZE THE GRAPH
				return new Promise( function(resolve, reject) {
					feGraph.meta.network = new vis.Network(feGraph.meta.container, projectData, feGraph.options);
					resolve( feGraph.meta.network );
				});
			}, // feGraph.meta.init();
			initEvents: function( network ){
				// ON SELECT
				// 00 update available buttons in the hud
				// 01 track selected nodes
				// 02 track selected edges
				network.on('select', function(selection){
					clUI.updateHud(selection);
					let selectedNodes = feGraph.data.nodes.get(selection.nodes);
					let selectedEdges = feGraph.data.edges.get(selection.edges);
					if(selection.nodes.length === 1){ 
						feGraph.meta.focusSelected(selectedNodes);
						feGraph.data.unhighlight(); feGraph.data.highlight(selection.nodes, feGraph.data.getConnected(selection)); 
						clUI.showPattern(selectedNodes[0]);
					}
					else if(selection.nodes.length === 2 || selection.edges.length === 1){
						clUI.showRelation(selectedNodes, selectedEdges);
					}
					else{ feGraph.data.unhighlight(); clUI.hidePattern(); clUI.hideRelation(); }
				});
				// ON MOUSE DRAG END
				// if a node is selected
				// 01 UPDATE SELECTED NODE's POSITION IN CASE IT WAS MOVED
				// 02 SEND UPDATED POSITION TO DATABASE
				// 03 RESET CONNECTED NodeS IN FRONTEND
				feGraph.meta.network.on('dragEnd', function(selection){ 
					if(selection.nodes.length > 0){
						updateNodePosition(selection); 
						let selectedNodes = frontend.data.nodes.get(selection.nodes);
						let data = feGraph.meta.network.getPositions();
						beDb.updateAll(['/positions'], data).then(function(response){
							console.log(response);
						});
						feGraph.data.unhighlight();
					}
				});
				// ON CANVAS ZOOM
				// for performance reasons:
				// 01 IF ZOOM SCALE IS > 0.45, DRAW CIRCULAR IMAGES
				// 02 IF ZOOM SCALE IS < 0.45 DRAW JUST CIRCLES
				feGraph.meta.network.on('zoom', function(zoom){
					if(zoom.scale > 0.45){ feGraph.meta.setShapeCircularImage(); }
					else{ feGraph.meta.setShapeCircle(); }
				});
				// ON ANIMATION FINISHED
				// 01 ENABLE CIRCULAR IMAGE SHAPE
				feGraph.meta.network.on('animationFinished', function(){ 
					feGraph.meta.setShapeCircularImage(); 
				});
			}, // feGraph.meta.initEvents();
		}, // feGraph.meta
		data: { 
			// nodes and edges datasets - http://visjs.org/docs/data/dataset.html
			// data methods
			nodes: undefined, 
			edges: undefined, 
			highlightedNodes: [],
			highlightedEdges: [],
			convertDbNodes: function(dbNodes){ // convert nodes sent from the db to visjs format
		    let nodesArray = [];
		    for ( let i = 0; i < dbNodes.length ; i++ ){ // create initial Nodes
		        let node = {};
		        node.id = dbNodes[i].vId; // first nodvId = 0, second nodvId = 1, ...
		        node.x = dbNodes[i].x;
		        node.y = dbNodes[i].y;
		        node.label = dbNodes[i].label;
		        node.title = dbNodes[i].title;
		        node.problem = dbNodes[i].problem;
		        node.image = dbNodes[i].image;
		        node.instruction = dbNodes[i].instruction;
		        nodesArray.push( node ); // append each i to the nodes Array
		    } // for i < dbNodes.length
		    return nodesArray; // array of nodes in vis format
			}, //feGraph.data.convertDbNodes()
			convertDbEdges: function(dbEdges){
		    let edgesArray = [];
		    if (dbEdges.length > 0) {
		        for(let i = 0; i < dbEdges.length; i++){
		            let edge = {};
		            edge.from = dbEdges[i].fromId;
		            edge.to = dbEdges[i].toId;
		            edge.id = dbEdges[i].vId;
		            edge.text = dbEdges[i].text;
		            edgesArray.push( edge );
		        } // for
		    } //  if i > 0
		    return edgesArray;
			}, //feGraph.data.convertDbEdges()
			getNextId: function(dataSet) {
				// function to check what is the next id when adding a new node or edge
				// 01 get the currently used ids
				let nextId;
				let currentIds = [];
				let currentDataCount = dataSet.length;
				if(currentDataCount > 0){ 
					for (let i = 0; i < currentDataCount; i++ ) { 
					currentIds[i] = dataSet[i].vId; 
				}
				currentIds.sort(function(a,b){return b-a}); // sort currently used ids in descending order
				nextId = currentIds[0] + 1; // newId is the currently highest id +1
				}
				else{ nextId = 1; } // if there are no nodes, start with id=1
				return nextId;
			}, // feGraph.data.getNextId()
			updateNodePosition: function(selection){
				// record new node position
				if(selection.nodes.length > 0){
					let draggedNode = feGraph.data.nodes.get(selection.nodes); // array
					for(let i in draggedNode){
						draggedNode[i].x = selection.pointer.canvas.x;
						draggedNode[i].y = selection.pointer.canvas.y;
					}
					feGraph.data.nodes.update(draggedNode);
				}
			}, // feGraph.data.updateNodePosition();
			getConnecting: function(selection){ // returns the edge connecting two nodes
		    let selectedEdges = feGraph.data.edges.get(selection.edges);
		    let selectedNodes = feGraph.data.nodes.get(selection.nodes);
				for(let i = 0; i < selectedEdges.length; i++){
					if(selectedNodes[0].id === selectedEdges[i].from || selectedNodes[0].id === selectedEdges[i].to){
						if(selectedNodes[1].id === selectedEdges[i].from || selectedNodes[1].id === selectedEdges[i].to){
							 return selectedEdges[i]; // return the relationEdge
						}
					} // if
				} // for
			}, // feGraph.data.getConnecting()
			getConnected: function(selection){
				// highlight connected nodes and edges black
				// gather connected nodes in a circle around the selected node
				let connectedNodeIds = feGraph.meta.network.getConnectedNodes(selection.nodes[0]);
				let connectedNodes = feGraph.data.nodes.get(connectedNodeIds);
				//let selectedNodes = feGraph.data.nodes.get(selection.nodes);
				let connectedEdgeIds = feGraph.meta.network.getConnectedEdges(selection.nodes[0]);
				let connectedEdges = feGraph.data.edges.get(connectedEdgeIds);

				return [connectedNodes, connectedEdges];
			}, // feGraph.data.getConnectedNodes()
			highlight: function(selectedNodes, dataArr){ // data is an array: [nodes, edges]
				for(let i in dataArr[0]){ // NODES
					let gatherAngle = ( (360/dataArr[0].length)*i ) / 180 * Math.PI;
					feGraph.data.highlightedNodes[i] = {};
					feGraph.data.highlightedNodes[i].id = dataArr[0][i].id;
					feGraph.data.highlightedNodes[i].prevX = dataArr[0][i].x;
					feGraph.data.highlightedNodes[i].prevY = dataArr[0][i].y;
					feGraph.data.highlightedNodes[i].color = {border: '#010101', background: '#010101'};
					feGraph.data.highlightedNodes[i].x = feGraph.data.nodes.get(selectedNodes)[0].x + ( Math.cos(gatherAngle) * (400 + dataArr[0].length*30) ) /*+ ( Math.cos(gatherAngle) )*Math.pow(connectedNodeIds.length, 3)*0.05*/;
					feGraph.data.highlightedNodes[i].y = feGraph.data.nodes.get(selectedNodes)[0].y + ( Math.sin(gatherAngle) * (400 + dataArr[0].length*30) ) /*+ ( Math.cos(gatherAngle) )*Math.pow(connectedNodeIds.length, 3)*0.05*/;
				}
				for(let i in dataArr[1]){ // EDGES
					feGraph.data.highlightedEdges[i] = {};
					feGraph.data.highlightedEdges[i].id = dataArr[1][i].id;
					feGraph.data.highlightedEdges[i].color = {color: '#010101'};
					feGraph.data.highlightedEdges[i].width = 8;
				}
				feGraph.data.nodes.update(feGraph.data.highlightedNodes);
				feGraph.data.edges.update(feGraph.data.highlightedEdges);
			}, // feGraph.data.highlight()
			unhighlight: function(){
				for (let i in feGraph.data.highlightedNodes){
					//console.log(feGraph.data.highlightedNodes);
					//feGraph.data.highlightedNodes[i] = {};
					feGraph.data.highlightedNodes[i].x = feGraph.data.highlightedNodes[i].prevX;
					feGraph.data.highlightedNodes[i].y = feGraph.data.highlightedNodes[i].prevY;
					feGraph.data.highlightedNodes[i].color = {border: '#EFEFEF', background: '#EFEFEF'};
				}
				for (let i in feGraph.data.highlightedEdges){
					feGraph.data.highlightedEdges[i].color = {color: '#DEDEDE'};
					feGraph.data.highlightedEdges[i].width = 1;
				}
				// update to unhighlight previously highlighted nodes and edges
				feGraph.data.nodes.update(feGraph.data.highlightedNodes);
				feGraph.data.edges.update(feGraph.data.highlightedEdges);
				// clear highlighted nodes and edges
				feGraph.data.highlightedEdges=[];
				feGraph.data.highlightedEdges=[];
			}, // feGraph.data.unhighlight()
			addNode: function(){
				// ADD A NEW NODE TO THE GRAPH
				// IF FUNCTION WAS TRIGGERED BY DOUBLE  CLICK, BASE NODE LOCATION ON CLICK LOCATION
				// IF A NODE IS SELECTED; BASE NODE LOCATION ON LOCATION OF SELECTED NODE
				// CONNECT SELECTED NODE AND NEW NODE
				let selection = feGraph.meta.network.getSelection();
				beDb.getAll(['/nodes' + '/'+ trargetProject]).then( function(response){
					let newNodeId, newEdgeId;
					newNodeId = getNextId(response[0]);
					bug.log('newNodeId', newNodeId);
					let data = { nodes: [], edges: [],};
					data.nodes[0] = { // data of the new node
						vId: newNodeId,
						title: 'New Pattern #' + newNodeId,
						problem: 'New Problem ' + newNodeId,
						instruction: 'New Instruction ' + newNodeId,
						label: 'New Pattern #' + newNodeId,
						image: '/uploads/' + '000-newNode.jpg',
						x: 0, // default position if there are no nodes on the canvas
						y: 0,
					};

					if(params){ // if click location parameters are handed, use them for new node position
						data.nodes[0].x = params.clickX;
						data.nodes[0].y = params.clickY;
						if ( selection.nodes.length > 0 ){ // create a distance if there's a selected node
							data.nodes[0].y += 1000;
						}
					}
					else if(selection.nodes.length){ // if a node is selected, add new node near selected node
						let selectedNode = feGraph.data.nodes.get(selection.nodes[0]);
						data.nodes[0].x = selectedNode.x;
						data.nodes[0].y = selectedNode.y + 1000;
					}
					// create the new node and the new edges in frontend
					feGraph.data.nodes.add({ 
						id: data.nodes[0].vId, 
						title: data.nodes[0].title, 
						problem: data.nodes[0].problem, 
						instruction: data.nodes[0].instruction, 
						label: data.nodes[0].label,
						image: data.nodes[0].image,
						x: data.nodes[0].x,
						y: data.nodes[0].y,
					}); 

					// if a node is selected, automatically connect the new node
					if(selection.nodes.length){ 
						beDb.getAll(['/edges' + '/' + trargetProject]).then(function(response){
							newEdgeId = getIds(response[0]);
							bug.log('New Edge Id', newEdgeId);
							data.edges[0].from = selection.nodes, // edges from (array)
							data.edges[0].to = newNodeId; // edges to
							data.edges[0].edgevId = [];
							for (let i = 0; i < selection.nodes.length; i++){
								data.edgevId.push(newEdgeId+i);
								feGraph.data.edges.add({id: data.edges[i].edgevId, from: data.edges[i].from, to: data.edges[i].to});
							}
							console.log('Current dataset to push to db: ' + data);
							beDb.postAll(['/nodes/' + targetProject, '/edges' + '/' + targetProject], data).then(function(response){ // save nodes and edges to backend
								console.log(response);
								feGraph.meta.network.unselectAll();
								feGraph.meta.network.setSelection({nodes: [data.nodes[0].vId], edges: data.edge[0].edgevId});
								feGraph.data.editNode();
							}); //beDb.postAll(nodes,edges)
						}); //beDb.getAll(edges)
					} // if
					else{ // or if nothing was selected, post only the new node 
						console.log('Current dataset to push to db: ' + data);
						beDb.postAll(['/nodes/' + targetProject], data).then( function(response){
							console.log( response );
							feGraph.meta.network.unselectAll();
							feGraph.meta.network.setSelection({nodes: [data.nodes[0].vId]});
							feGraph.data.editNode();
						}); 
					} 
				}); // beDb.getAll(nodes)
			}, // feGraph.data.addNode()
			updateNode: function(nodeContent, diagramFile){ // nodeContent is an obj 
				//document.getElementById('saveEditButton').addEventListener('submit', function(e){
				event.preventDefault();
				let selectedNode = feGraph.data.nodes.get(feGraph.meta.network.getSelectedNodes())[0]; 
				let updateNode = {
					vId: selectedNode.vId,
					title: nodeContent.title,
					problem: nodeContent.observation,
					instruction: nodeContent.instruction,
				};
				if( diagramFile ){
					diagramFile.append('vId', selectedNode.vId);
					duagramFile.append('previousImage', selectedNode.image);
					diagramFile.append('currentProject', bePrj.current);
					diagramFile.append('currentUser', clUsr.current);
					// if there is a diagram FormData obj handed
					// 01 upload the image file to rename it on the server
					$.ajax({
						type: 'POST',
						processData: false,
						contentType: false,
						data: diagramFile,
						url: '/imgUpload',
						dataType : 'json',
						success: function(newDiagramUrl){
							updateNode.image = newDiagramUrl;
							beDb.updateAll(['/nodes/' + bePrj.current], updateNode);
							feGraph.data.nodes.update([updateNode]);
						}
					});
				}
				else{
					feGraph.data.nodes.update([updatedNode]); // update node on frontend
					console.log('Saved Node ' + selectedNodeId);
					beDb.updateAll(['/nodes/' + bePrj.current], updatedNode); // update node on DB     
				}
				patternEdit.style.display = 'none';
				patternTitle.innerHTML = updatedNode.title;
				patternObservation.innerHTML = updatedNode.problem;
				patternInstruction.innerHTML = updatedNode.instruction;
				patternContent.style.display = 'block';
				document.getElementById('uploadInput').value == "";
				//return false;
			}, // feGraph.data.updateNode()
			updateEdge: function(relationText){
				// UPDATE A PATTERN RELATION EDGE IN THE GRAPH
				// 01 edge between two selected nodes 
				// 02 directly selected edge
				let relationEdge;
				if(selection.nodes.length === 2){
					relationEdge = feGraph.data.getConnecting(feGraph.meta.network.getSelection()); // get the connecting edge between the two nodes
				}
				else if(selection.edges.length){
					relationEdge = feGraph.data.edges.get(feGraph.meta.network.getSelectedEdges());
				}
				relationEdge.text = relationText;
				feGraph.data.edges.update([relationEdge]);
				beDb.updateAll(['/edges/' + feGraph.meta.project.current], [relationEdge]);
			}, // feGraph.data.updateEdge()
			delete: function(selection){
				if (selection.nodes){
					let data = { vIds: selection.nodes }; 
					beDb.deleteAll(['/nodes/' + feGraph.meta.project.current], data).then(function(response){
						console.log(response);
						for (let i=0; i < selection.nodes.length; i++){
							feGraph.data.nodes.remove({id: selection.nodes[i]}); // remove each selected node in frontend
						}
					});
				}
				else if (selection.edges){
					let data = { vIds: selection.edges }; 
					beDb.deleteAll(['/edges/' + feGraph.meta.project.current], data).then(function(response){
						console.log(response);
						for (let i=0; i < selection.edges.length; i++){
							feGraph.data.edges.remove({id: selection.edges[i]}); // remove each selected node in frontend
						}
					});
				}
			}, // feGraph.data.delete()
			connectNodes: function(selectedNodes){
				// CONNECT TWO NODES WITH A NEW EDGE
				beDb.getAll(['/edges/' + feGraph.meta.project.current]).then(function(response){
					let allEdges = response[0];
					console.log(selection.nodes);
					let newEdgvId = getNextId(allEdges);
					console.log(newEdgvId);
					let data = { 
						edges: [{ 
							from: selectedNodes[0],
							to: selectedNodes[1],
							edgevId: newEdgvId,
						}],
					};
				beDb.postAll(['/edges/' + feGraph.meta.project.current], data).then(function(response){
					console.log(response);
				})
				// connect nodes in frontend
				feGraph.data.edges.add({id: data.edges[0].edgevId, from: data.edges[0].from, to: data.edges[0].to});
				feGraph.meta.network.setSelection({edges: [data.edges[0].edgevId] }, {unselectAll: false});
				});
			}, // feGraph.data.connectNodes()
			inverseEdge: function(selectedEdges){
		    let edgesArr = feGraph.data.edges.get(selectedEdges);
		    for(let i in edgesArr){
		        let temp = edgesArr[i].to;
		        edgesArr[i].to = edgesArr[i].from;
		        edgesArr[i].from = temp;
		    }
		    feGraph.data.edges.update(edgesArr);
		    beDb.updateAll(['/edges'], edgesArr);
			}, // feGraph.data.inverseEdge()
			init: function( currentProject ){
				// INITIALIZES THE DATA FOR THE CURRENT PROJECT
				// 01 get all nodes and edges for the current project from database
				// 02 convert nodes and edges from db to visjs format
				// 03 construct visjs DataSets
				return new Promise( function(resolve, reject){
					bug.log(['Initializing Graph Data for project: ', currentProject.title]);
					let projectData = '?projectid=' + currentProject.projectid + '&common=' +  currentProject.common;
					beDb.getAll( ["/nodes/" + currentProject.title.replace(/\s+/, "").toLowerCase() + projectData, 
												"/edges/" + currentProject.title.replace(/\s+/, "").toLowerCase() + projectData ] ).then(function(responseArr){
						let allNodes = feGraph.data.convertDbNodes(responseArr[0]); 
						let allEdges = feGraph.data.convertDbEdges(responseArr[1]); 
						feGraph.data.nodes = new vis.DataSet( allNodes );
						feGraph.data.edges = new vis.DataSet( allEdges );
						resolve( {nodes: feGraph.data.nodes, edges: feGraph.data.edges } );
					});
				});
			}, // feGraph.data.init()
		},
		init: function(){
			// RUN INITIALIZATION FOR DATA, GRAPH AND EVENTS -- ASYNC
			// 01 find out what the initial user project is
			// 02 initialize the graph data (nodes and edges)
			// 03 create the graph network from the initialized data
			// 04 set up interaction/manipulation events
			return new Promise( function(resolve, reject){
				feGraph.meta.project.getCurrent().then( feGraph.data.init )
					.then( feGraph.meta.init )
					.then( function(network){
							feGraph.meta.initEvents(network); 
							resolve('Initialized Graph');
						});
			}); // return new Promise
		}, // feGraph.init();
		load: function(){
			// INITIALIZE A NEW GRAPH WHEN CHANGING THE CURRENT PROJECT
			// **TODO**
		},
		publicAPI: function(){
			return {
				init: feGraph.init,
				addNode: feGraph.addNode,
			};
		}
	} // feGraph (obj)

	var exports = module.exports = feGraph.publicAPI();
})(vis, bug, beDb, clUI, clUsr)


// ==================================================
// MIGRATE WIHT frontendUI 
// ==================================================
/*function showPatternContent(selectedNode){
    patternEdit.style.display = 'none';
    patternTitle.innerHTML = selectedNode.title;
    patternObservation.innerHTML = selectedNode.problem;
    patternInstruction.innerHTML = selectedNode.instruction;
    patternContentDiagram.setAttribute('src', '../uploads/' + selectedNode.image);
    patternRelation.style.display = 'none';
    patternWindow.style.display = 'block';
    patternContent.style.display = 'block';
} // MOVE THIS TO FRONTENDUI - only fetch data from feGraph
  // i.e. getPatterncontent() in feGraph and showPatternContent in frontendUI
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
// ==================================================
// MIGRATE WIHT frontendUI  ^^^^^^^^^^^^^^^^^^^^^^^^
// ==================================================
*/

// ==================================================
// HANDLE PATTERN CLASSES
// ==================================================

/*var patternClassSelect = document.getElementById('patternClassSelect');
patternClassSelect.addEventListener('change', function(){
    //alert('the consequences will never be the same');
    //console.log(patternClassSelect.options[patternClassSelect.selectedIndex].id);
    if(patternClassSelect.options[patternClassSelect.selectedIndex].id === 'managePatternClasses'){
        console.log('manage the damn classes');
        patternEdit.style.display = 'none';
        patternClassEdit.style.display = 'block';
    }
});*/

/*
MOVE THIS TO DEBUG MODULE?
visjsInterface.feedDebugger = function(){
    let allVisIds = nodesObj.getIds()
    document.getElementById('d_CurrentNodeIdsVis').innerHTML = '[' + allVisIds.length + ']: ' + allVisIds;
    beDb.getAll(['/nodes/' + currentProject]).then(function(response){
            let allIds = [];
            for(let i in response[0]){
                allIds.push(response[0][i].vId);
            }
            allIds.sort(function(a,b){return a-b});
            document.getElementById('d_CurrentNodeIdsOrient').innerHTML = '[' + allIds.length + ']: ' + allIds;
    });
}*/

/*visjsInterface.createDefaultProjectNetwork = function(){
    // take all nodes from the common network (should be current) and post them to the default project
    let data = {
        nodes:[],
        edges:[]
    };
    let currentProject = 'MyProjectLanguage'; // this only gets called when a user registers so the current project will always be the default 'MyProjectLanguage'
    data.nodes = nodesObj.get(); // all nodes
    data.edges = edgesObj.get(); // all edges

    beDb.postAll(['/nodes/' + currentProject], data).then( function(responseNodes){
        console.log(responseNodes);
        beDb.postAll(['/edges/' + currentProject], data).then( function(responseEdges){
            console.log(responseEdges);
        });
    });
};

visjsInterface.destroyCurrentNetwork = function(){
    network.nodes.clear();
    network.edges.clear();
}*/