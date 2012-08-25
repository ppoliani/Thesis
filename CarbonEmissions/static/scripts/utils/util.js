/*A class representing which provides usedull utility functions*/
function Util() {

}

/*Override the prototype*/
Util.prototype = {
	constructor : Util,

	/**auxiliary function that removes duplicates from arrays*/
	removeDuplicatesFromArray : function(arr) {
		var i, 
			len = arr.length, 
			out = [], 
			obj = {};

		for ( i = 0; i < len; i++) {
			obj[arr[i]] = 0;
		}

		for (i in obj) {
			out.push(i);
		}

		return out;
	},

	sleep : function(milliseconds) {
		var start = new Date().getTime();
		for (var i = 0; i < 1e7; i++) {
			if ((new Date().getTime() - start) > milliseconds) {
				break;
			}
		}
	},
	
	/*returns the maximum occurance of the same element within an array*/
	getMaxOccurance: function(arr){
		var obj = {};
		var freq = 1;
		
		for ( i = 0; i < arr.length; i++) {
			if( arr[i] in obj ){
				freq++;
			}
			obj[arr[i]] = 0;
		}	

		return freq;
	},

	/*performs a form validation*/
	validateForm : function(formId, options) {
		var validator = $(formId).validate(options);

		return validator.form();
	},
	
	/* gets array of dates between 2 dates. refer to
	 * http://stackoverflow.com/questions/4413590/javascript-get-array-of-dates-between-2-dates*/
	dateRange: function(from, to){
		var tempFrom = from.clone();
		var tempTo = to.clone();
		
    	var DA= [tempFrom.toLocaleDateString()], 
    		incr=tempFrom.getDate();
    	while(tempFrom< to){
        	from=new Date(tempFrom.setDate(++incr));
        	DA.push(tempFrom.toLocaleDateString());
    	}
    	return DA;
	},

	 daydiff: function(first, second) {
    	return (second-first)/(1000*60*60*24)
	},
	
	/*inializes an array with 0*/
	initalizeArray: function(arr, length){
		for( var i = 0; i < length; i++ ){
			arr[i] = 0;
		}
	}
}
