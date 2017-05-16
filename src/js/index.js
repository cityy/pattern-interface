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


/*
var dragWindow = function(){
    return {
        move : function(divid,xpos,ypos){
            divid.style.left = xpos + 'px';
            divid.style.top = ypos + 'px';
        },
        startMoving : function(divid,container,evt){
            evt = evt || window.event;
            var posX = evt.clientX,
                posY = evt.clientY,
            divTop = divid.style.top,
            divLeft = divid.style.left,
            eWi = parseInt(divid.style.width),
            eHe = parseInt(divid.style.height),
            cWi = parseInt(document.getElementById(container).style.width),
            cHe = parseInt(document.getElementById(container).style.height);
            document.getElementById(container).style.cursor='move';
            divTop = divTop.replace('px','');
            divLeft = divLeft.replace('px','');
            var diffX = posX - divLeft,
                diffY = posY - divTop;
            document.onmousemove = function(evt){
                evt = evt || window.event;
                var posX = evt.clientX,
                    posY = evt.clientY,
                    aX = posX - diffX,
                    aY = posY - diffY;
                    if (aX < 0) aX = 0;
                    if (aY < 0) aY = 0;
                    if (aX + eWi > cWi) aX = cWi - eWi;
                    if (aY + eHe > cHe) aY = cHe -eHe;
                mydragg.move(divid,aX,aY);
            }
        },
        stopMoving : function(container){
            var a = document.createElement('script');
            document.getElementById(container).style.cursor='default';
            document.onmousemove = function(){}
        },
    }
}();

var editWindow = document.getElementById('editWindow');
editWindow.addEventListener("mousedown", dragWindow.startMoving(this, 'container', event));
editWindow.addEventListener("mouseup", dragWindow.stopMoving('container'));*/


/*$(document).click(function(e) {
    if (e.shiftKey) {
        //alert("shift+click")
        console.log(clickobj);
    } 
});*/