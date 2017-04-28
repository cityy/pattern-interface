require('../scss/index.scss');
var vis_ = require('./vis_network.js');
window.jQuery = window.$ = require('jquery');
global.Tether = require('tether');
require('bootstrap');
require("font-awesome-webpack");
//console.log("hello world");

/*
/* ================================
/* INTERACTION WITH VIS
/* ================================
*/ 

var addNodeLink = document.getElementById("addNode");
var deleteNodesLink = document.getElementById("deleteNodes");
var connectNodesLink = document.getElementById("connectNodes");

addNodeLink.addEventListener( "click", function() {
	vis_.addNode();
}); 

deleteNodesLink.addEventListener("click", function(){
	vis_.deleteSelectedNode();
});

connectNodesLink.addEventListener("click",function(){
	vis_.connectSelectedNodes();
});


/*$(document).click(function(e) {
    if (e.shiftKey) {
        //alert("shift+click")
        console.log(clickobj);
    } 
});*/



var xhr = new XMLHttpRequest(); // create new request

xhr.onreadystatechange = function() { // Listener: when the request state changes
    if (xhr.readyState == XMLHttpRequest.DONE) { // check if the request is done
        console.log(xhr.responseText); // alert the response html
    }
}
xhr.open('GET', '/nodes', true); // initialize the request
xhr.send(null); // send the request, takes Parameters for POST requests