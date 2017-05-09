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