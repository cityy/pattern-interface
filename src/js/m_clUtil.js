//m_clUtil

var clUtil = {
	getChild: function(node, searchterm){
		let attrType = null;
		switch(searchterm[0]){
			case '#': attrType = 'id';
								console.log('Looking for Child by ' + attrType);
								break;
			case '.': attrType = 'class';
			console.log('Looking for Child by ' + attrType);
								break;
			default: console.log(searchterm + 'is not a valid searchterm. Use a .class or an #id.');
							 return null;
							 break;
		}
		var find = function(layer){
			let nextLayer = [];
			for(let i = 0; i < layer.length; i++){
				if(layer[i].getAttribute(attrType)){
					if( layer[i].getAttribute(attrType).includes(searchterm.slice(1)) || 
							layer[i].getAttribute(attrType).includes(searchterm.toLowerCase().slice(1)) ) {
								return layer[i];
					}
					else if(layer[i].childNodes){
						for(let j = 0; j < layer[i].childNodes.length; j++) { nextLayer.push(layer[i].childNodes[j]);}
					}
				}
				else if(layer[i].childNodes){
						for(let j = 0; j < layer[i].childNodes.length; j++) { nextLayer.push(layer[i].childNodes[j]);}
				}
			}
			if(nextLayer.length){ return find(nextLayer); }
			else{ return console.log('No child with given ' + attrType + ' found. \n' + nextLayer) }
		} // </ find() >
		return find(node.childNodes);
	},
	blink:{
		nodes:[],
		start: function(node){
			clUtil.blink.nodes.push(node);
			let prevVis = node.style.visibility;
			var hide = function(){
				for(let i = 0; i < clUtil.blink.nodes.length; i++){
					if(node === clUtil.blink.nodes[i]){
						node.style.visibility = 'hidden';
						window.setTimeout(function(){
							show();
						}, 300);
					}
				}
			}
			var show = function(){
				node.style.visibility = prevVis;
				window.setTimeout(function(){
					hide();
				}, 300);
			}
			show();
		}, // start
		stop: function(node){
			for(let i = 0; i < clUtil.blink.nodes.length; i++){
				if(node === clUtil.blink.nodes[i]){
					clUtil.blink.nodes = clUtil.blink.nodes.splice(i, 1);
				}
			}
		} // stop
	},
	remSpace: function(str) {
		return str.split(' ').join('');
	},
}

var exports = module.exports = clUtil;