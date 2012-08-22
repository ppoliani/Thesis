/*A class representing which provides usedull utility functions*/
function Util() {

}

/*Override the prototype*/
Util.prototype = {
	constructor : Util,

	/**auxiliary function that removes duplicates from arrays*/
	removeDuplicatesFromArray : function(arr) {
		var i, len = arr.length, out = [], obj = {};

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

	/*performs a form validation*/
	validateForm : function(formId, options) {
		var validator = $(formId).validate(options);

		return validator.form();
	}
}
