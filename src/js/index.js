require('../scss/index.scss');
var vis_ = require('./vis_network.js');
window.jQuery = window.$ = require('jquery');
global.Tether = require('tether');
require('bootstrap');
require("font-awesome-webpack");
require('jquery-form');

/*
/* ================================
/* INTERACTION WITH VIS
/* ================================
*/ 

var addNodeLink = document.getElementById("addNode");
var deleteNodesLink = document.getElementById("deleteNodes");
var connectNodesLink = document.getElementById("connectNodes");
var editNodeLink = document.getElementById('editNode');

addNodeLink.addEventListener( "click", function() { vis_.addNode(); }); 

deleteNodesLink.addEventListener("click", function(){ vis_.deleteSelectedNode(); });

connectNodesLink.addEventListener("click",function(){ vis_.connectSelectedNodes(); });

editNodeLink.addEventListener("click", function(){ 
	if ( editNodeLink.classList.contains('disabled') === false ){
		vis_.editSelectedNode();
	}
	else{
		console.log('Either no nodes selected or more than one node selected.');
	}

});

// ================================
// LOGIN / REGISTRATION THINGS
// ================================

var loginLink = document.getElementById('loginLink');
var registerLink = document.getElementById('registerLink');
var logoutLink = document.getElementById('logoutLink');
var userinfo = document.getElementById('userinfo'); 
var userNameLabel = document.getElementById('userNameLabel');
var loginRegister = document.getElementById('loginRegister');

var logoutNotice = document.getElementById('logoutNotice');
var loginNotice = document.getElementById('loginNotice');

var loginWindow = document.getElementById('loginWindow');
var loginWindowParagraphs = loginWindow.getElementsByTagName('P')[0];

var loginButton = document.getElementById('loginButton');
var registerButton = document.getElementById('registerButton');
var cancelLoginButton = document.getElementById('cancelLoginButton');
var cancelRegisterButton = document.getElementById('cancelRegisterButton');

var forgotPasswordLink = document.getElementById('forgotpassword');
var goToLoginLink = document.getElementById('goToLogin');
var goBackToLoginLink = document.getElementById('goBackToLogin'); // go back to login after logout
var goToRegisterLink = document.getElementById('goToRegister');

var logoutNoticeDismiss = document.getElementById('logoutDismiss');
var welcomeName = document.getElementById('welcomeName');
var loginNoticeDismiss = document.getElementById('loginDismiss');

var loginForm = document.getElementById('loginForm');
var registerForm = document.getElementById('registerForm');

loginLink.addEventListener('click',function(){
	logoutNotice.style.display = 'none';
	loginWindow.style.display = 'block';
	registerForm.style.display = 'none';
	loginForm.style.display = 'block';
});

registerLink.addEventListener('click', function(){
	logoutNotice.style.display = 'none';
	loginWindow.style.display = 'block';
	loginForm.style.display = 'none';
	registerForm.style.display = 'block';
})

loginWindow.addEventListener("mousedown", function(e){
	if (loginWindow !== e.target && loginWindowParagraphs !== e.target ) return;
	dragWindow.startMoving(this, 'page', e);
	e.preventDefault();
});
loginWindow.addEventListener("mouseup", function(){
	dragWindow.stopMoving('page');
});

cancelLoginButton.addEventListener('click', function(){
	loginWindow.style.display = 'none';
});
cancelRegisterButton.addEventListener('click', function(){
	loginWindow.style.display = 'none';
});

forgotPasswordLink.addEventListener('click', function(e){
	e.preventDefault();
});

goToLoginLink.addEventListener('click', function(e){
	e.preventDefault();
	registerForm.style.display = 'none';
	loginForm.style.display = 'block';
});
goToRegisterLink.addEventListener('click',function(e){
	e.preventDefault();
	loginForm.style.display = 'none';
	registerForm.style.display = 'block';
})
goBackToLoginLink.addEventListener('click', function(e){
	e.preventDefault();
	logoutNotice.style.display = 'none';
	loginForm.style.display = 'block';
});

logoutNoticeDismiss.addEventListener('click', function(e){
	e.preventDefault();
	logoutNotice.style.display = 'none';
	loginWindow.style.display = 'none';
});

loginNoticeDismiss.addEventListener('click', function(e){
	e.preventDefault();
	loginNotice.style.display = 'none';
	loginWindow.style.display = 'none';
});



// Submission of the registration form
$('#registerForm').unbind('submit').bind('submit', function(event){
	event.preventDefault();
	loginWindow.style.display = 'none';

	if( document.querySelector('#registerForm #username').value && document.querySelector('#registerForm #password').value){
	    $.ajax({
            url : '/local-reg',
            type: 'POST',
            data: $(this).serialize(),
            withCredentials: true,
            success: function (newusername) {
                console.log('User ' + newusername + ' successfully registered and logged in.');
				showUserInfo(newusername);
				document.getElementById('hud').style.display = 'block';
				refreshProjectList();
                document.getElementById('projectSelection').style.display = 'list-item';
            },
            error: function (jXHR, textStatus, errorThrown) {
                alert(errorThrown);
            }
        });
	}
});

// Submission of the login form
$('#loginForm').unbind('submit').bind('submit', function(event){
	event.preventDefault();

	if( document.querySelector('#loginForm #username').value && document.querySelector('#loginForm #password').value){
	    $.ajax({
            url : '/login',
            type: 'POST',
            data: $(this).serialize(),
            withCredentials: true,
            success: function (username) {
                console.log('User ' + username + ' successfully logged in.');
                loginForm.style.display = 'none';
                welcomeName.innerHTML = username;
                loginNotice.style.display = 'block';
                showUserInfo(username);
                refreshProjectList();
                document.getElementById('hud').style.display = 'block';
                document.getElementById('projectSelection').style.display = 'list-item';
            },
            error: function (jXHR, textStatus, errorThrown) {
                alert(errorThrown);
            }
        });
	}
});

logoutLink.addEventListener('click', function(){
	let logoutReq = new XMLHttpRequest();
	logoutReq.open('GET', '/logout', true);
    logoutReq.onload = function() {
   		if (logoutReq.status === 200) { 
   			console.log(logoutReq.responseText); 
   			hideUserInfo();
   			registerForm.style.display = 'none';
   			loginForm.style.display  = 'none';
   			loginWindow.style.display = 'block';
   			logoutNotice.style.display = 'block';
   			document.getElementById('hud').style.display = 'none';
   			document.getElementById('projectSelection').style.display = 'none';
   		}
    	else { console.log('Error' + logoutReq.statusText); } 
	} // onload()
	logoutReq.send(null);
});

function showUserInfo(username){
	loginRegister.style.display = 'none'; // disable the login link
	userinfo.style.display = 'flex'; // enable current user display
	userNameLabel.innerHTML = username; // set the name of the current user
}

function hideUserInfo(){
	userinfo.style.display = 'none'; // disable current user display
	loginRegister.style.display = 'flex'; // enable the login link
}

function getCurrentUser(){
	let userReq = new XMLHttpRequest();
	userReq.open('GET', '/user', true);
	userReq.onload = function() {
   		if (userReq.status === 200) { 
   			if(userReq.responseText){ 
   				showUserInfo(userReq.responseText);// responseText should be the current username
   				document.getElementById('hud').style.display = 'block';
   				document.getElementById('projectSelection').style.display = 'list-item';
   				refreshProjectList();
   			} 
   		}
    	else { console.log('Error' + userReq.statusText); } 
	} // onload()
	userReq.send(null);
}

document.onload = getCurrentUser();


// ==================================================
// HANDLE USER PROJECTS
// ==================================================

var addProject = document.getElementById('addProject');
var currentProject = null;
var projectOptions = [];

var projectSelect = document.getElementById('userprojects');
var newProjectTitleInput = document.getElementById('newProjectTitleInput');
var projectWindow = document.getElementById('projectWindow');
var dismissProjectWindowButton = document.getElementById('cancelProjectButton');
var saveNewProjectButton = document.getElementById('saveNewProjectButton');

userprojects.addEventListener('change', function(){
	selectProject(this);
});

addProject.addEventListener('click', function(){
   projectWindow.style.display = 'block';
});

dismissProjectWindowButton.addEventListener('click', function(){
	projectWindow.style.display = 'none';
});

// save new project to db and add it to the project selection
saveNewProjectButton.addEventListener('click', function(){
   	projectWindow.style.display = 'none';

   	let data = {
   		projectTitle: newProjectTitleInput.value
   	}
   	console.log(data);
   	// add new project to the DB
   	let newProjectReq = new XMLHttpRequest();
   	newProjectReq.open('POST', '/projects', true);
   	newProjectReq.setRequestHeader("Content-type", "application/json; charset=utf-8");
   	newProjectReq.onload = function() {
   		if (newProjectReq.status === 200) { console.log(newProjectReq.responseText);}
    	else { console.log('Error' + newProjectReq.statusText); } 
	} // onload()
	newProjectReq.send(JSON.stringify(data));
	refreshProjectList().then(function(){
		selectProject(data.projectTitle);
	});
});

function selectProject(sel){
	if(sel.options){ // if subitted parameter is a <select>
		currentProject = sel.options[sel.selectedIndex].text // get project from selected option
		console.log('Project from Selection Menu ' + currentProject);
	}
	else{ //get project from string parameter
		currentProject = sel;
		console.log('Project from String ' + currentProject);
		for(let i = 0; i < projectSelect.options.length; i++){
			console.log(projectSelect.options[i].text);
			if(projectSelect.options[i].text === currentProject){
				projectSelect.selectedIndex = i;
			}
		}
	}
	// destroy the current network
	// get all patterns and edges of the current project
		// vis_.loadProject(selectedProject);
}

function refreshProjectList(){
	return new Promise( function (resolve, reject) {
		let getProjectsReq = new XMLHttpRequest();
		getProjectsReq.open('GET', '/projects', true);
	   	getProjectsReq.onload = function() {
	   		if (getProjectsReq.status === 200) { 
	   			projectOptions = JSON.parse(getProjectsReq.responseText); //responseText should be an array of projects
				for(let i in projectOptions){
					projectOptions[i] = '<option>' + projectOptions[i] + '</option>'
				}
				document.getElementById('userprojects').innerHTML = projectOptions;
				resolve('Projects refrehsed successfully');
	   		}
	    	else { reject('Error' + getProjectsReq.statusText); } 
		} // onload()
		getProjectsReq.send(null);
	}); // return
}

// ================================
// EDIT WINDOW
// ================================

var editWindow = document.getElementById('editWindow');
var editWindowParagraphs = editWindow.getElementsByTagName('P')[0];
editWindow.addEventListener("mousedown", function(e){
	if (editWindow !== e.target && editWindowParagraphs !== e.target ) return;
	dragWindow.startMoving(this, 'page', e);
	e.preventDefault();
});
editWindow.addEventListener("mouseup", function(){
	dragWindow.stopMoving('page');
});


// ================================
// UI FUNCTIONALITY
// ================================

var dragWindow = function(){
    return {
        move : function(divid,xpos,ypos){
            divid.style.left = xpos + 'px';
            divid.style.top = ypos + 'px';
        },
        startMoving : function(divid,container,evt){
        	console.log('Mousedown');
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
            	console.log('Moving');
                evt = evt || window.event;
                var posX = evt.clientX,
                    posY = evt.clientY,
                    aX = posX - diffX,
                    aY = posY - diffY;
                    if (aX < 0) aX = 0;
                    if (aY < 0) aY = 0;
                    if (aX + eWi > cWi) aX = cWi - eWi;
                    if (aY + eHe > cHe) aY = cHe -eHe;
                dragWindow.move(divid,aX,aY);
            }
        },
        stopMoving : function(container){
        	console.log('Mouseup');
            var a = document.createElement('script');
            document.getElementById('page').style.cursor='default';
            document.onmousemove = function(){}
        },
    }
}();

/*$(document).click(function(e) {
    if (e.shiftKey) {
        //alert("shift+click")
        console.log(clickobj);
    } 
});*/