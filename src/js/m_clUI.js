//m_clUI
var clDb = require('./m_backendDb.js');
var clGraph = require('./m_frontendGraph.js');
var clUsr = require('./m_clUser.js');
var clUtil = require('./m_clUtil.js');

(function(clDb, clGraph){
	var clUI = {
		status:{
			/*// debug window toggle
			var isDebug = false;
				window.addEventListener('keydown', function(e){
					let keyCode = e.keyCode;
					if(keyCode === 220){ // ^
						toggleDebug();
					}
			});

			//todo:
			//function toggleLogin(){};. function toggleEdit(){}; . function toggleReg(){}; . function toggleAddProject(){};
			function toggleDebug(){
			let debugInterface = document.getElementById('debugInterface');
			if(isDebug){
				debugInterface.style.display = 'none';
				isDebug = false;
			}
			else{
				visjs.feedDebugger();
				debugInterface.style.display = 'block';
				isDebug = true;
			}
			}*/
		},
		hud : {
			container : document.getElementById("hud"),
			addLink : document.getElementById("addNode"),
			deleteLink : document.getElementById("deleteNodes"),
			deleteIcon : document.getElementById("deleteNodes"),
			connectLink : document.getElementById("connectNodes"),
			connectIcon: document.getElementById("connectNodes"),
			editLink : document.getElementById('editNode'),
			editIcon : document.getElementById("editNode"),
			swapLink : document.getElementById('swapEdge'),
			update: function(selection){ // I'm clUI.hud.update(), I enable/disable hud elements depending on selections
				switch(selection.nodes.length){
					case 0:
						clUI.hud.editIcon.className = " disabled"; // disable editx
						clUI.hud.deleteIcon.className = " disabled"; // disable delete
						clUI.hud.connectIcon.className = " disabled"; // disable connect
						if(selection.edges.length > 0){ 
							$('#deleteNodes').removeClass('disabled'); 
							$('#editNode').removeClass('disabled'); //enable Edit of edges
						} // enable delete for edges             
						break;
					case 1:
						$('#editNode').removeClass('disabled'); //enable Edit
						$('#deleteNodes').removeClass('disabled'); // enable delete
						break;
					case 2: 
						$("#connectNodes").removeClass('disabled'); // enable connect
						//document.getElementById("editNode").className = " disabled"; // disable edit
						$('#editNode').removeClass('disabled'); //enable Edit of relations
						break;
					case 3:
						clUI.hud.connectIcon.className = " disabled"; // disable connect
						break;
					default:
						clUI.hud.editIcon.className = " disabled"; // disable edit
						$('#deleteNodes').removeClass('disabled'); // enable delete
						clUI.hud.connectIcon.className = " disabled"; // disable connect
		    } //switch
			}, // clUI.update()
			init: function(){
				clUI.hud.swapLink.addEventListener('click', function(){ 
					visjs.swapEdgeDirection();
					clUI.content.relationTitleFrom.innerHTML = 'FROM: ' + nodesObj.get([edgesArr[0].from])[0].title;
					clUI.content.relationTitleTo.innerHTML = 'TO: ' + nodesObj.get([edgesArr[0].to])[0].title;
					clUI.content.relationDiagramFrom.setAttribute('src', '../uploads/' + nodesObj.get([edgesArr[0].from])[0].image );
					clUI.content.relationDiagramTo.setAttribute('src', '../uploads/' + nodesObj.get([edgesArr[0].to])[0].image );
					//showPatternRelation(null, edgesObj.get( network.getSelectedEdges() ) );
				});
				clUI.hud.addLink.addEventListener( "click", function() { feGraph.addNode(); clUI.hud.update();}); 
				clUI.hud.deleteLink.addEventListener("click", function(){feGraph.deleteSelectedNodes(); clUI.hud.update(); clUI.content.container.style.display = 'none'});
				clUI.hud.connectLink.addEventListener("click",function(){ feGraph.connectSelectedNodes(); });
				clUI.hud.editLink.addEventListener("click", function(){ 
					if ( clUI.hud.editLink.classList.contains('disabled') === false ){
						if(feGraph.meta.network.getSelectedNodes().length === 0 && feGraph.meta.network.getSelectedEdges().length === 1){feGraph.editSelectedEdge(); }
						else if(feGraph.meta.network.getSelectedNodes().length === 2){ feGraph.editSelectedEdge(); }
						else{feGraph.editSelectedNode();}
					}
					else{console.log('Either no nodes selected or more than one node selected.');}
				});
			} // clUI.hud.init();
		},
		topbar : {
			loginRegister: document.getElementById('loginRegister'), // list item that holds login and reg links
			loginLink : document.getElementById('loginLink'),
			registerLink : document.getElementById('registerLink'),
			logoutLink: document.getElementById('logoutLink'),
			userinfo : document.getElementById('userinfo'),
			userNameLabel : document.getElementById('userNameLabel'),
			projectSelection : document.getElementById('projectSelection'),
			showUserInfo: function(username){
				clUI.topbar.refreshProjectList().then(function(){
					clUI.projects.current = clUI.projects.selectionbox.value;
					clUI.projects.previous = clUI.projects.selectionbox.value;
					clUI.hud.container.style.display = 'block'; // only show the hud if somebody is logged in
					clUI.topbar.projectSelection.style.display = 'list-item';
					clUI.topbar.loginRegister.style.display = 'none'; // disable the login link
					clUI.topbar.userinfo.style.display = 'flex'; // enable current user display
					clUI.topbar.userNameLabel.innerHTML = username; // set the name of the current user
				});
			}, // clUI.topbar.showuserInfo(username)
			hideUserInfo: function(){
					clUI.topbar.userinfo.style.display = 'none'; // disable current user display
					clUI.topbar.loginRegister.style.display = 'flex'; // enable the login link
			}, // clUI.topbar.hideuserInfo()
			refreshProjectList: function(){
				return new Promise( function (resolve, reject) {
					let getProjectsReq = new XMLHttpRequest();
					getProjectsReq.open('GET', '/projects', true);
				   	getProjectsReq.onload = function() {
				   		if (getProjectsReq.status === 200) { 
				   			let projects = JSON.parse(getProjectsReq.responseText); //responseText should be an array of projects
								let projectOptions = [];
							for(let i in projects){
								if(projects[i].status === 'mostRecent'){
									projectOptions[i] = '<option selected>' + projects[i].title + '</option>';
								}
								else{
									projectOptions[i] = '<option>' + projects[i].title + '</option>';
								}
							}
							projectOptions.push('<option id="manageUserProjects">Manage projects...</option>');
							document.getElementById('userprojects').innerHTML = projectOptions;
							resolve('Projects refrehsed successfully');
				   		}
				    	else { reject('Error' + getProjectsReq.statusText); } 
					} // onload()
					getProjectsReq.send(null);
				}); // return
			}, // clUI.projects.refreshList()
			init: function(){
					clUI.topbar.loginLink.addEventListener('click',function(){
						clUI.logout.success.style.display = 'none';
						clUI.login.container.style.display = 'block';
						clUI.registration.form.style.display = 'none';
						clUI.login.form.style.display = 'block';
					});
					registerLink.addEventListener('click', function(){ // register link in topbar
						clUI.logout.success.style.display = 'none';
						clUI.login.container.style.display = 'block';
						clUI.login.form.style.display = 'none';
						clUI.registration.form.style.display = 'block';
					});
					clUsr.getCurrent().then(function(currentUsername){
						console.log(currentUsername);
						currentUsername ? clUI.topbar.showUserInfo( currentUsername ) : clUI.topbar.hideUserInfo();// show the current user in the topbar
					});
			}, //clUI.topbar.init()
		}, 
		login:{
			container: document.getElementById('loginWindow'),
			containerParagraphs: document.getElementById('loginWindow').getElementsByTagName('P')[0],
			welcomeName: document.getElementById('welcomeName'),
			success: document.getElementById('loginNotice'),
			successDismiss: document.getElementById('loginDismiss'),
			submitButton: document.getElementById('loginButton'),
			cancelButton: document.getElementById('cancelLoginButton'),
			forgotPasswordLink: document.getElementById('forgotpassword'),
			goToRegistrationLink: document.getElementById('goToRegister'),
			form: document.getElementById('loginForm'),
			init: function(){
				clUI.login.container.addEventListener("mousedown", function(e){
					if (clUI.login.container !== e.target && clUI.login.containerParagraphs !== e.target ) return;
					clUI.dragWindow.startMoving(clUI.login.container, 'page', e);
					e.preventDefault();
				});
				clUI.login.container.addEventListener("mouseup", function(){ clUI.dragWindow.stopMoving('page');});
				clUI.login.cancelButton.addEventListener('click', function(){ clUI.login.container.style.display = 'none'; });
				clUI.login.forgotPasswordLink.addEventListener('click', function(e){ e.preventDefault(); });
				clUI.login.goToRegistrationLink.addEventListener('click',function(e){
					e.preventDefault();
					clUI.login.form.style.display = 'none';
					clUI.registration.form.style.display = 'block';
				});
				clUI.login.successDismiss.addEventListener('click', function(e){
					e.preventDefault();
					clUI.login.success.style.display = 'none';
					clUI.login.container.style.display = 'none';
				});
							// Submission of the login form
				$('#loginForm').unbind('submit').bind('submit', function(event){
					event.preventDefault();
					console.log('Submitting login form');
					if( document.querySelector('#loginForm #username').value && document.querySelector('#loginForm #password').value){
						clUsr.signin(this).then(function(username){
							console.log(username);
							clUI.login.form.style.display = 'none';
							clUI.login.welcomeName.innerHTML = username;
							clUI.login.success.style.display = 'block';
							clUI.topbar.showUserInfo(username);
							//clUI.topbar.refreshProjectList();
							clUI.topbar.projectSelection.style.display = 'list-item';
							clUI.hud.container.style.display = 'block';
						});
					}
				});
			}, // clUI.login.init();
		},
		logout:{
			success: document.getElementById('logoutNotice'),
			successDismiss: document.getElementById('logoutDismiss'),
			goBackToLoginLink: document.getElementById('goBackToLogin'), // go back to login after logout
			init: function(){
				clUI.logout.goBackToLoginLink.addEventListener('click', function(e){
					e.preventDefault();
					clUI.logout.success.style.display = 'none';
					clUI.login.form.style.display = 'block';
				});
				clUI.logout.successDismiss.addEventListener('click', function(e){
					e.preventDefault();
					clUI.logout.success.style.display = 'none';
					clUI.login.container.style.display = 'none';
				});
				clUI.topbar.logoutLink.addEventListener('click', function(){
					clUI.logout.submit();
				});
			}, // clUI.logout.init();
			submit: function(){
				let logoutReq = new XMLHttpRequest();
				logoutReq.open('GET', '/logout', true);
			    logoutReq.onload = function() {
			   		if (logoutReq.status === 200) { 
			   			console.log(logoutReq.responseText); 
			   			clUI.topbar.hideUserInfo();
			   			clUI.registration.form.style.display = 'none';
			   			clUI.login.form.style.display  = 'none';
			   			clUI.login.container.style.display = 'block';
			   			clUI.logout.success.style.display = 'block';
			   			clUI.hud.container.style.display = 'none';
			   			clUI.topbar.projectSelection.style.display = 'none';
			   		}
			    	else { console.log('Error' + logoutReq.statusText); } 
				} // onload()
				logoutReq.send(null);
			} // clUI.logout.submit()
		},
		registration:{
			submitButton: document.getElementById('registerButton'),
			cancelButton: document.getElementById('cancelRegisterButton'),
			form: document.getElementById('registerForm'),
			success: document.getElementById('regNotice'),
			successDismiss: document.getElementById('regDismiss'),
			welcomeNameReg: document.getElementById('welcomeNameReg'),
			goToLoginLink: document.getElementById('goToLogin'),
			init: function(){
				clUI.registration.cancelButton.addEventListener('click', function(){
					clUI.login.container.style.display = 'none';
				});
				clUI.registration.goToLoginLink.addEventListener('click', function(e){
					e.preventDefault();
					clUI.registration.form.style.display = 'none';
					clUI.login.form.style.display = 'block';
				});
				clUI.registration.successDismiss.addEventListener('click', function(e){
					e.preventDefault();
					clUI.registration.success.style.display = 'none';
					clUI.login.container.style.display = 'none';
					visjs.createDefaultProjectNetwork();
				});
				$('#registerForm').unbind('submit').bind('submit', function(event){
					event.preventDefault();
					clUI.registration.submit();
				});
			}, // clUI.registration.init();
			submit: function(){
				clUI.login.container.style.display = 'none';
				clUI.registration.form.style.display = 'none';
				if( document.querySelector('#registerForm #username').value && document.querySelector('#registerForm #password').value){
					$.ajax({
						url : '/local-reg',
						type: 'POST',
						data: $(this).serialize(),
						withCredentials: true,
						success: function (newusername) {
							console.log('User ' + newusername + ' successfully registered and logged in.');
							clUI.hud.container.style.display = 'block';
							clUI.topbar.showUserInfo(newusername);
							clUI.topbar.refreshProjectList();
							clUI.topbar.projectSelection.style.display = 'list-item';
							clUI.registration.welcomeName.innerHTML = newusername;
							clUI.registration.success.style.display = 'block';
							clUI.login.container.style.display = 'block';
						},
						error: function (jXHR, textStatus, errorThrown) {
							alert(errorThrown);
						}
					}); // $.ajax()
				} // if
			} //clUI.registration.submit()
		},
		search:{
			searchWindow: document.getElementById('searchWindow'),
			searchForm: document.getElementById('searchForm'),
			submit: function(){}
		},
		projects:{
			container: document.getElementById('projectWindow'),
			current: null,
			previous: null,
			options: [],
			selectionbox: document.getElementById('userprojects'),
			newTitleInput: document.getElementById('newProjectTitleInput'),
			doneButton: document.getElementById('doneProjectButton'),
			saveButton: document.getElementById('saveNewProjectButton'),
			manageUsername: document.getElementById('manageProjectsUser'),
			// tableHead: document.getElementById('projectsHead'),
			table: document.getElementById('projectsTable'),
			list: document.getElementById('projectlist'),
			tableFooter: document.getElementById('projectsTableFooter'),
			addButton: document.getElementById('addProjectButton'),
			projectFilter: document.getElementById('projectFilter'),
			projectList: document.getElementById('projectlist'),
			manage: function(){
				let projectArr = clUI.projects.selectionbox.options;
				for(let i = 0; i < projectArr.length-1; i++){
					clUI.projects.createProjectRow(projectArr[i].value, i);
				}
				let editIcons = document.getElementsByClassName('editProject');
				let editInputs = document.getElementsByClassName('projectEditInput');
				let deleteIcons = document.getElementsByClassName('deleteProject');
				// console.log(editIcons);
				Array.from(editIcons).forEach(function(element) {
					element.addEventListener('click', function(){
						clUI.projects.edit(this.closest('.row'));
					});
				});
				Array.from(deleteIcons).forEach(function(element) {
					element.addEventListener('click', function(){
						clUI.projects.delete(this.closest('.row'));
					});
				});
				Array.from(editInputs).forEach(function(element) {
					element.addEventListener('keydown', function(event){
						if(event.keyCode == 13 || event.which == 13) { clUI.projects.save(element.closest('.row'));}
						else if(event.keyCode == 27 || event.which == 27){clUI.projects.cancelEdit(element.closest('.row'));}
					});
				});
				clUI.projects.manageUsername.innerHTML = clUI.topbar.userNameLabel.innerHTML;
				if(clUI.projects.projectList.height >= 200 ){
					clUI.projects.projectList.style('overflow-y: scroll');
				}
				clUI.projects.container.style.display = "block";
			},
			createProjectRow: function(newProjectTitle, counter){
				let listGroupItem = document.createElement('li');
				listGroupItem.setAttribute('class', 'list-group-item');
				listGroupItem.setAttribute('id', 'list-group-item-p' + counter);
				clUI.projects.list.appendChild(listGroupItem);
				let row = document.createElement('div');
				row.setAttribute('class', 'row');
				listGroupItem.appendChild(row);
					let colProject = document.createElement('div');
					colProject.setAttribute('class', 'col-8')
					row.appendChild(colProject);
					let projectLabel = document.createElement('div');
					projectLabel.setAttribute('class', 'projectLabel');
					projectLabel.innerHTML = newProjectTitle;
					colProject.appendChild(projectLabel);
					let projectEdit = document.createElement('input');
					projectEdit.setAttribute('type', 'text');
					projectEdit.setAttribute('class', 'projectEditInput');
					projectEdit.style.display = 'none';
					colProject.appendChild(projectEdit);
						let colNodeCount = document.createElement('div');
						colNodeCount.setAttribute('class', 'col d-flex align-items-center');
						row.appendChild(colNodeCount)
							let badgeNodeCount = document.createElement('span');
							badgeNodeCount.setAttribute('class', 'badge badge-primary badge-pill');
							badgeNodeCount.setAttribute('id', 'badgeNodeCount');
							colNodeCount.appendChild(badgeNodeCount);
								let iconNode = document.createElement('i');
								iconNode.setAttribute('class', 'fa fa-circle-o');
								badgeNodeCount.appendChild(iconNode);
								let nodeCount = document.createTextNode(' 100');
								badgeNodeCount.appendChild(nodeCount);
						let colEdgeCount = document.createElement('div');
						colEdgeCount.setAttribute('class', 'col d-flex align-items-center');
						row.appendChild(colEdgeCount);
							let badgeEdgeCount = document.createElement('span');
							badgeEdgeCount.setAttribute('class', 'badge badge-primary badge-pill');
							badgeEdgeCount.setAttribute('id', 'badgeEdgeCount');
							colEdgeCount.appendChild(badgeEdgeCount);
								let iconEdge = document.createElement('i');
								iconEdge.setAttribute('class', 'fa fa-arrows-h');
								badgeEdgeCount.appendChild(iconEdge);
								let edgeCount = document.createTextNode(' 100');
								badgeEdgeCount.appendChild(edgeCount);
						let colOptions = document.createElement('div');
						colOptions.setAttribute('class', 'col d-flex align-items-center projectOptions');
						row.appendChild(colOptions);
							let iconEditProject = document.createElement('i');
							iconEditProject.setAttribute('class', 'fa fa-pencil editProject');
							colOptions.appendChild(iconEditProject);
								let iconDeleteProject = document.createElement('i');
								iconDeleteProject.setAttribute('class', 'fa fa-trash-o deleteProject');
								colOptions.appendChild(iconDeleteProject);
				return row;
			},
			select: function(sel){
				if(sel.options){ // if subitted parameter is a <select>
					clUI.projects.current = sel.options[sel.selectedIndex].text // get project from selected option
					console.log('Project from Selection Menu ' + clUI.projects.current);
				}
				else{ //get project from string parameter
					clUI.projects.current = sel;
					console.log('Project from String ' + clUI.projects.current);
					for(let i = 0; i < clUI.projects.selectionbox.options.length; i++){
						console.log(clUI.projects.selectionbox.options[i].text);
						if(clUI.projects.selectionbox.options[i].text === clUI.projects.current){
							clUI.projects.selectionbox.selectedIndex = i;
						}
					}
				}
				// destroy the current network
				//feGraph.meta.network.destroy();
				// get all patterns and edges of the current project
					// visjs.loadProject(selectedProject); // sel is the project name to select (str)
			}, // clUI.projects.select()
			add: function(newProjectTitle){
				let projects = document.getElementsByClassName('projectLabel');
				let options = [];
				for(let i = 0; i < projects.length;  i++){
					options[i] = document.createElement('option');
					options[i].text = projects[i].innerHTML;
				}
				clUI.projects.tableFooter.style.display = 'none';
				clUI.projects.doneButton.style.display = 'none';
				let thisPrjRow = clUI.projects.createProjectRow(newProjectTitle, clUI.projects.projectList.childNodes.length);
				clUtil.blink.start(clUtil.getChild(thisPrjRow, '.projectLabel'));
				clUtil.getChild(thisPrjRow,'#badgeEdgeCount').style.display = 'none';
				clUtil.getChild(thisPrjRow,'#badgeNodeCount').style.display = 'none';
				var sendToDB = function(newProjectTitle){
					let data = {
						projectTitle: newProjectTitle,
						inheritProject: clUtil.remSpace(selectInherit.options[selectInherit.selectedIndex].value.toLowerCase()),
					}
					// add new project to the DB
					let newProjectReq = new XMLHttpRequest();
					newProjectReq.open('POST', '/projects', true);
					newProjectReq.setRequestHeader("Content-type", "application/json; charset=utf-8");
					newProjectReq.onload = function() {
						if (newProjectReq.status === 200) { console.log(newProjectReq.responseText);}
						else { console.log('Error' + newProjectReq.statusText); }
					} // onload()
					newProjectReq.send(JSON.stringify(data));
					clUI.topbar.refreshProjectList().then(function(){
						clUI.projects.select(data.projectTitle);
						while (clUI.projects.list.firstChild) {
							clUI.projects.list.removeChild(clUI.projects.list.firstChild);
						}
						clUI.projects.tableFooter.style.display = 'block';
						clUI.projects.doneButton.style.display = 'block';
						clUtil.blink.stop(clUtil.getChild(thisPrjRow, '.projectLabel'));
						clUI.projects.projectFilter.value = "";
						clUI.projects.manage();
					});
				}
				let inheritOptions = function(row){
					row.parentNode.style.background = '#107896';
					let listGroupItem = document.createElement('li');
					listGroupItem.setAttribute('class', 'list-group-item');
					listGroupItem.setAttribute('id', 'list-group-item-inherit');
					listGroupItem.setAttribute('style', 'background:#107896; border-top:none; padding: 0;');
					clUI.projects.list.appendChild(listGroupItem);
					let rowInstruction = document.createElement('div');
					rowInstruction.style.padding = '0 0 0 0.6em';
					rowInstruction.innerHTML = '<p>Inherit patterns from:</p>';
					listGroupItem.appendChild(rowInstruction);
					let rowInherit = document.createElement('div');
					rowInherit.setAttribute('class', 'row');
					rowInherit.style = 'border-top: 1px solid black; margin: 0;';
					listGroupItem.appendChild(rowInherit);
					let selectCol = document.createElement('div');
					selectCol.setAttribute('class', 'col-6');
					selectCol.style.padding = "0";
					rowInherit.appendChild(selectCol);
					let confirmCol = document.createElement('div');
					confirmCol.setAttribute('class', 'col-3');
					confirmCol.style = 'padding:0; text-align: center;';
					rowInherit.appendChild(confirmCol);
					let confirmButton = document.createElement('button');
					confirmButton.innerHTML = 'Confirm';
					confirmCol.appendChild(confirmButton);
					let cancelCol = document.createElement('div');
					cancelCol.setAttribute('class', 'col-3');
					cancelCol.style = 'padding:0; text-align: center; border-left: 1px solid black;';
					rowInherit.appendChild(cancelCol);
					let cancelButton = document.createElement('button');
					cancelButton.innerHTML = 'Cancel';
					cancelCol.appendChild(cancelButton);
						let selectInherit = document.createElement('select');
						selectInherit.setAttribute('id', 'selectInherit');
						selectCol.appendChild(selectInherit);
						for(let i = 0; i < options.length;  i++){
							console.log(options[i]);
							selectInherit.appendChild(options[i]);
						}
						let none = document.createElement('option');
						none.innerHTML = '-';
						selectInherit.appendChild(none);
						confirmButton.addEventListener('click', function(){
							sendToDB(newProjectTitle);
						});
						cancelButton.addEventListener('click', function(){

						});
				}
				inheritOptions(thisPrjRow);
				// 01 create new project in database
				// 02 update selectionbox in topbar
				// clUI.projects.selectionbox.options
			}, // clUI.projects.add
			edit: function(thisPrjRow){
				if(clUtil.getChild(thisPrjRow, '.editProject').getAttribute('class') == 'fa fa-pencil editProject'){
					window.setTimeout(function(){
						clUtil.getChild(thisPrjRow, '.projectEditInput').focus();
						// clUtil.getChild(thisPrjRow,'.projectEditInput').select();
					}, 0);
					console.log('Enabling project edit');
					clUtil.getChild(thisPrjRow, '.projectLabel').style.display = "none";
					clUtil.getChild(thisPrjRow, '.projectEditInput').value = clUtil.getChild(thisPrjRow, '.projectLabel').innerHTML;
					clUtil.getChild(thisPrjRow, '.projectEditInput').style.display = "block";
					clUtil.getChild(thisPrjRow, '.editProject').setAttribute('class', 'fa fa-save editProject');
				}
				else{
					clUI.projects.save(thisPrjRow);
				}
			},
			save: function(thisPrjRow){
				console.log('Saving project edit');
				var updatePrjPromise = new Promise(function(resolve, reject){
					let data = { 
						prevPrjTitle: clUtil.getChild(thisPrjRow, '.projectLabel').innerHTML,
						updatedPrjTitle: clUtil.getChild(thisPrjRow, '.projectEditInput').value
					};
					let updatePrjReq = new XMLHttpRequest();
					updatePrjReq.open('PUT', '/projects', true);
					updatePrjReq.setRequestHeader("Content-type", "application/json; charset=utf-8");
					updatePrjReq.onload = function() {
						if (updatePrjReq.status === 200) { resolve(updatePrjReq.responseText); }
						else { reject('Error' + updatePrjReq.statusText); } 
					} // onload()
					updatePrjReq.send( JSON.stringify(data) );
				});
				updatePrjPromise.then(function(result){
					clUtil.getChild(thisPrjRow, '.projectEditInput').style.display = "none";
					clUtil.getChild(thisPrjRow, '.projectLabel').innerHTML = clUtil.getChild(thisPrjRow, '.projectEditInput').value;
					clUtil.getChild(thisPrjRow, '.projectLabel').style.display = "block";
					clUtil.getChild(thisPrjRow, '.editProject').setAttribute('class', 'fa fa-pencil editProject');
				});
			},
			cancelEdit: function(thisPrjRow){
					clUtil.getChild(thisPrjRow, '.projectEditInput').style.display = "none";
					clUtil.getChild(thisPrjRow, '.projectLabel').style.display = "block";
					clUtil.getChild(thisPrjRow, '.editProject').setAttribute('class', 'fa fa-pencil editProject');
			},
			delete: function(thisPrjRow){
				// 02 delete project from database
				let deletePrjPromise = new Promise(function(resolve, reject){
					let targetProject = clUtil.getChild(thisPrjRow, '.projectLabel').innerHTML;
					let deletePrjReq = new XMLHttpRequest();
					deletePrjReq.open('DELETE', '/projects/' + targetProject, true);
					deletePrjReq.onload = function(){
							if (deletePrjReq.status === 200) { resolve(deletePrjReq.responseText); }
							else { reject('Error' + deletePrjReq.statusText); } 
					}
					deletePrjReq.send(null);
				});

				deletePrjPromise.then(function(result){
					thisPrjRow.parentNode.parentNode.removeChild(thisPrjRow.parentNode);
					console.log(result);
				});
			},
			init: function(){
				clUI.projects.previous = clUI.projects.selectionbox.value;
				clUI.projects.selectionbox.addEventListener('change', function(){
					if(clUI.projects.selectionbox.options[clUI.projects.selectionbox.selectedIndex].id === 'manageUserProjects'){ // selected option is manage projects
						clUI.projects.manage();
					} 
					else{
						clUI.projects.select(clUI.projects.selectionbox.options[clUI.projects.selectionbox.selectedIndex]);
					}
				});
				clUI.projects.container.addEventListener("mousedown", function(e){
					console.log(e.target.tagName);
					if ( e.target.tagName != 'BUTTON' && e.target.tagName != 'INPUT' && e.target.tagName != 'I' && e.target.tagName != 'SELECT') {
						e.preventDefault();
						clUI.dragWindow.startMoving(clUI.projects.container, 'page', e);
					}
				});
				clUI.projects.container.addEventListener("mouseup", function(){
						clUI.dragWindow.stopMoving('page');
				});
				clUI.projects.doneButton.addEventListener('click', function(){
					clUI.projects.container.style.display = 'none';
					while (clUI.projects.list.firstChild) {
						clUI.projects.list.removeChild(clUI.projects.list.firstChild);
					}
					clUI.projects.selectionbox.value = clUI.projects.previous;
					clUI.projects.projectFilter.value = "";
				});
				clUI.projects.projectFilter.addEventListener('keyup', function(event){
					// console.log(this.value.length);
					if(this.value.length >= 3) {
						// this.closest('.col').style.margin = '0 0 0 0.9em';
						clUI.projects.addButton.parentNode.style.display = 'block';
						if(event.keyCode == 13 || event.which == 13) { clUI.projects.add(clUI.projects.projectFilter.value) }
						else if(event.keyCode == 27 || event.which == 27){ clUI.projects.projectFilter.value = "" }
					}
					else{
						// this.closest('.col').style.margin = '0 0.9em';
						clUI.projects.addButton.parentNode.style.display = 'none';
					}
				});
				clUI.projects.addButton.addEventListener('click', function(){
					if(clUI.projects.projectFilter.value.length >= 3) clUI.projects.add(clUI.projects.projectFilter.value);
				});
			} // clUI.projects.init()
		},
		content:{
			container: document.getElementById('patternWindow'),
			paragraphs: document.getElementById('patternWindow').getElementsByTagName('P')[0],
			pattern: document.getElementById('patternContent'),
			patternEdit: document.getElementById('patternEdit'),
			patternEditCancel: document.getElementById('cancelEditButton'),
			patternClass: document.getElementById('patternClassEdit'),
			patternTitle: document.getElementById('patternTitle'),
			patternObservation: document.getElementById('patternObservation'),
			patternInstruction: document.getElementById('patternInstruction'),
			patternDiagram: document.getElementById('patternContentDiagram'),
			patternDiagramInput: document.getElementById('uploadInput'),
			relation: document.getElementById('patternRelation'),
			relationTitleFrom: document.getElementById('patternRelationTitleA'),
			relationDiagramFrom: document.getElementById('patternRelationDiagramA'),
			relationTitleTo: document.getElementById('patternRelationTitleB'),
			relationDiagramTo: document.getElementById('patternRelationDiagramB'),
			relationText: document.getElementById('relationText'),
			relationTextEdit: document.getElementById('patternRelationTxtArea'),
			relationForm: document.getElementById('relationForm'),
			showPattern: function(selectedNode){
					patternTitle.innerHTML = selectedNode.title;
					clUI.content.patternDiagram.setAttribute('src', selectedNode.image);
					patternObservation.innerHTML = selectedNode.problem;
					patternInstruction.innerHTML = selectedNode.instruction;
					clUI.content.pattern.style.display  = 'block';
					clUI.content.relation.style.display = 'none';
					clUI.content.container.style.display  = 'block';
			},
			hidePattern: function(){
					clUI.content.pattern.style.display  = 'none';
					clUI.content.container.style.display  = 'none';
			},
			togglePatternEdit: function(){
				if(clUI.content.patternEdit.style.display === 'none'){
					clUI.content.pattern.style.display  = 'none';
					clUI.content.relation.style.display = 'none';
					let selectedNode = nodesObj.get( feGraph.meta.network.getSelectedNodes() )[0]; // array of nodes by id
					clUI.content.patternEdit.value = selectedNode.title;
					document.getElementById('patternProblemTxtArea').value = selectedNode.problem;
					document.getElementById('patternInstructionTxtArea').value = selectedNode.instruction;
					document.getElementById('patternDiagram').src = selectedNode.image;
					clUI.content.patternEdit.style.display = 'block';
					clUI.content.container.style.display  = 'block';
				}
				else{
					clUI.content.pattern.style.display  = 'block';
					clUI.content.patternEdit.style.display = 'none';
				}
			},
			submitPatternEdit: function(){
				let newDiagramImg, diagramFile;
				if( clUI.content.patternDiagramInput.value ) {
					diagramFile = new FormData();
					diagramFile.append('diagramImage', clUI.content.patternDiagramInput.files[0]);
				}
				else{
					diagrammFile = null;
				}
				newDiagramImg = feGraph.data.updateNode({
					title: clUI.content.patternTitle.value,
					observation: clUI.content.patternObservation.value, 
					instruction: clUI.content.patternInstruction.value,
				}, diagramFile);
				if( newDiagramImg ){ // if the backend returns an updated diagramImg
					//clUI.content.patternDiagram.setAttribute('src', '../uploads/' + currentUser + '_' + currentProject + '_diagrams/' + response + '?' + new Date().getTime())
				}
				clUI.content.togglePatternEdit();
			},
			cancelPatternEdit: function(/*selectedNode*/){
				clUI.content.patternEdit.style.display = 'none';
				//patternTitle.innerHTML = selectedNode[0].title;
				//patternObservation.innerHTML = selectedNode[0].problem;
				//patternInstruction.innerHTML = selectedNode[0].instruction;
				//patternContentDiagram.setAttribute('src', '../uploads/' + selectedNode[0].image);
				clUI.content.pattern.style.display = 'block';
			},
			showRelation: function(selectedNodes){
					clUI.content.pattern.style.display  = 'none';
					clUI.content.relation.style.display = 'block';
					clUI.content.container.style.display  = 'block';
			},
			hideRelation: function(){
					clUI.content.relation.style.display  = 'none';
					clUI.content.container.style.display  = 'none';
			},
			toggleRelationEdit: function(){ // create a function to toggle relation edit
				// toggle edit state for a pattern relation
				if (clUI.content.relation.style.display === 'none'){
					clUI.content.pattern.style.display = 'none';
					clUI.content.patternEdit.style.display = 'none';

					clUI.content.relationTextEdit.value = clUI.content.relationText.innerHTML;
					clUI.content.relationText.style.display = 'none';
					clUI.content.relationTextEdit.style.display = 'block';
					clUI.content.relationForm.style.display = 'block';
					clUI.content.relation.style.display = 'block';
					clUI.content.container.style.display = 'block';
				}
				else{
	        clUI.content.relationEdit.style.display = 'none';
	        clUI.content.relationForm.style.display = 'none';
	        clUI.content.relationText.style.display = 'block';
				}
			},
			submitRelationEdit: function(){
				feGraph.data.updateEdge(clUI.content.relationTextEdit.value);
				clUI.content.relationText.innerHTML = relationEdges[0].text;
				clUI.content.toggleRelationEdit();
			},
			init: function(){
				clUI.content.container.addEventListener("mousedown", function(e){
					console.log(e.target.nodename);
					if ( e.target.nodename === 'button' ) return;
					clUI.dragWindow.startMoving(clUI.content.container, 'page', e);
					e.preventDefault();
				});
				clUI.content.container.addEventListener("mouseup", function(){
					clUI.dragWindow.stopMoving('page');
				});
				$('#relationForm').unbind('submit').bind('submit', function(event){
					event.preventDefault();
					clUI.content.submitRelationEdit();
		    });
		    clUI.content.patternEditCancel.onclick = clUI.content.cancelPatternEdit();
		    // set up eventlistener for relation edit canceling
			} // clUI.content.init();
		},
		search:{
			container: document.getElementById('searchWindow'),
			form: document.getElementById('searchForm'),
			cancel: document.getElementById('cancelSearch'),
			icon: document.getElementById('searchPatternIcon'),
			input: document.getElementById('searchInput'),
			isActive: false,
			toggle: function(){
				if(clUI.search.isActive){
					clUI.search.container.style.display = 'none';
					clUI.search.isActive = false;
					clUI.search.input.value = '';
				}
				else{
					clUI.search.container.style.display.style.display = 'block';
					window.setTimeout(function(){
						clUI.search.input.focus();
					}, 50);
					clUI.search.isActive = true;
				}
			}, // clUI.search.toggle()
			submit: function(event){
				event.preventDefault();
				let newSelection = [];
				let allNodes = feGraph.data.nodes.get();
				let searchTerm = clUI.search.input.value;
				let focusNode;
				clUI.search.container.style.display = 'none';
				for(let i in allNodes){
					if(allNodes[i].label.includes(searchTerm)  || allNodes[i].label.toLowerCase().includes( searchTerm ) ){
						console.log('Found node with id #' + allNodes[i].id + ': ' + allNodes[i].label);
						newSelection.push(allNodes[i].id);
						focusNode = allNodes[i];
					}
				}
				feGraph.meta.network.setSelection({nodes: newSelection});
				focusSelected( feGraph.data.nodes.get(feGraph.meta.network.getSelectedNodes()) );
				clUI.search.input.value = '';
				clUI.search.isActive = false;
			},
			init: function(){
				window.addEventListener('keydown', function(e){ 
					let keyCode = e.keyCode;
					if(keyCode === 70 && clUI.content.container.style.display === 'none' && clUI.search.input != document.activeElement ){ // f
						clUI.search.toggle.toggle();
					} 
					else if(keyCode === 188 && clUI.content.container.style.display === 'none' && clUI.search.input != document.activeElement ){ // ,
						clUI.search.toggle.toggle();
					}
				});
				clUI.search.icon.addEventListener('click',function(){
					if(clUI.content.container.style.display === 'none' && clUI.search.input != document.activeElement){
						clUI.search.toggle();
					}
				});
				clUI.search.form.addEventListener('submit', clUI.search.submit(event));
				clUI.search.cancel.addEventListener('click', function(){ clUI.search.toggle(); });
			}, // clUI.search.init()
		},
		dragWindow: { // I'm clUI.dragWindow()
				move : function(divid,xpos,ypos){
					divid.style.left = xpos + 'px';
					divid.style.top = ypos + 'px';
				},
				startMoving : function(divid,container,evt){
					//console.log('Mousedown');
					evt = evt || window.event;
					let posX = evt.clientX;
					let posY = evt.clientY;
					let divTop = window.getComputedStyle(divid, null).getPropertyValue('top');
					let divLeft = window.getComputedStyle(divid, null).getPropertyValue('left');
					let eWi = parseInt(divid.clientWidth);
					let eHe = parseInt(divid.clientWidth);
					let cWi = parseInt(document.getElementById('page').clientWidth);
					let cHe = parseInt(document.getElementById('page').clientWidth);
					//document.getElementById(container).style.cursor='move';
					document.getElementById('page').style.cursor='move';
					divTop = divTop.replace('px','');
					divLeft = divLeft.replace('px','');
					var diffX = posX - divLeft, 
							diffY = posY - divTop;
					document.onmousemove = function(evt){
						//console.log('Moving');
						evt = evt || window.event;
						var posX = evt.clientX,
						    posY = evt.clientY,
						    aX = posX - diffX,
						    aY = posY - diffY;
						    if (aX < 0) aX = 0;
						    if (aY < 0) aY = 0;
						    if (aX + eWi > cWi) aX = cWi - eWi;
						    if (aY + eHe > cHe) aY = cHe -eHe;
						clUI.dragWindow.move(divid,aX,aY);
					}
				},
				stopMoving : function(container){
					var a = document.createElement('script');
					document.getElementById('page').style.cursor='default';
					document.onmousemove = function(){}
				},
		}, // clUI.dragWindow()
		init: function(){ // I'm clUI.init()
			clUI.hud.init();
			clUI.topbar.init();
				clUI.projects.init();
			clUI.login.init();
			clUI.logout.init();
			clUI.registration.init();
			//clUI.search.init();
			clUI.content.init();
		}, // clUI.init()
		publicAPI: function(){
			return {
				init: clUI.init,
				showPattern: clUI.content.showPattern,
				hidePattern: clUI.content.hidePattern,
				showRelation: clUI.content.showRelation,
				hideRelation: clUI.content.hideRelation,
				updateHud: clUI.hud.update,
			};
		},
	}
	var exports = module.exports = clUI.publicAPI();
})(clDb, clGraph, clUsr)