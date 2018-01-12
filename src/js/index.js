// FRONTEND REQUIRES
require('../scss/index.scss');
var feGraph = require('./m_frontendGraph.js');
var clUI = require('./m_clUI.js');
// BACKEND REQUIRES
var bug = require('./m_bugLog.js');
// 3RD PARTY REQUIRES
window.jQuery = window.$ = require('jquery');
global.Tether = require('tether');
global.Popper = require('popper.js');
require('bootstrap');
require("font-awesome-webpack");
//require('jquery-form');

feGraph.init().then(function(result){
	bug.log(result);
	clUI.init();
});