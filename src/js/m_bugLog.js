var bug = {
	logging: true,
	log: function(params){
	    if(this.logging){
	        let bugLogMsg = '// bugLog()===========================\n// ';
	        for(let i in params){
	            bugLogMsg += params[i] + ' ';
	        }
	        console.log(bugLogMsg);
	    }		
	}
}

var exports = module.exports = bug;