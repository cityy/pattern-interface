//m_clUser
//clUsr
var serialize = require('form-serialize');

(function(){
	var clUsr = {
		all: [],
		current: null, // should longterm extend this to be an object containing diff user data
		getCurrent: function(){ // I'm feUI.topbar.getUser(), I get the current username to show in the topbar
			return new Promise(function(resolve, reject){
				let userReq = new XMLHttpRequest();														// maybe send the username from backend instead of making a xhttp request here
				userReq.open('GET', '/user', true);
				userReq.onload = function() {
					if (userReq.status === 200) { 
						if(userReq.responseText){ 
							clUsr.current = JSON.parse(userReq.responseText)[0][0];
							console.log('CURRENT USER: ' + clUsr.current.username);
							resolve( clUsr.current.username );
						}
						else{ resolve(null) };
					}
					else { console.log('Error' + userReq.statusText); reject(null); } 
				} // onload()
				userReq.send(null);
			});
		}, // beUsr.getCurrent()
		signin: function( loginForm ){
			return new Promise( function(resolve, reject) {
				console.log(loginForm);
				let signinData = serialize(loginForm);
				let signinReq = new XMLHttpRequest();
				signinReq.open('POST','/login', true);
				console.log(signinData);
				signinReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				signinReq.withCredentials = true;
				//let body =  new URLSearchParams()
				signinReq.onload = function(){
					if(signinReq.status === 200 ){
							clUsr.current = signinReq.responseText;
							console.log('LOGGED IN USER: ' + signinReq.responseText);
							resolve(signinReq.responseText);
					}
					else {
						console.log('Error' + signinReq.statusText); 
						resolve(null); 
					}
				};
				signinReq.send( signinData );
			}); // promise
		},
		signout: function(){},
		signup: function(){},
		publicAPI: function(){
			return {
				getCurrent: clUsr.getCurrent,
				signin: clUsr.signin,
				signout: clUsr.signout,
				signup: clUsr.signup,
			};
		}
	};

	var exports = module.exports = clUsr.publicAPI();
})(serialize);