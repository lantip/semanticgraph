/**
 * This file contains basic elements such as helper functions or logging
 * mechanism.
 * 
 * @author Felix Stahlberg
 */

/**
 * Use this element for logging such as Log.write("message").
 */
var Log = {
	elem : false,
	write : function(text) {
		if (!this.elem) {
			this.elem = $('div#log');
		}
		this.elem.html(text);
	}
};

/**
 * A simple sprintf-implementation known from c, perl etc. Valid placeholders 
 * are %s (string), %d (numeric) and %b (boolean values). 
 * 
 * @param data String with placeholders
 * @param further parameters are used to replace the placeholders
 * @return formatted string
 * @see http://www.naden.de/blog/javascript-printf
 */
function sprintf() {
	if (sprintf.arguments.length < 2) {
		return;
	}

	var data = sprintf.arguments[0];

	for ( var k = 1; k < sprintf.arguments.length; ++k) {
		switch (typeof (sprintf.arguments[k])) {
		case 'string':
			data = data.replace(/%s/, sprintf.arguments[k]);
			break;
		case 'number':
			data = data.replace(/%d/, sprintf.arguments[k]);
			break;
		case 'boolean':
			data = data.replace(/%b/, sprintf.arguments[k] ? 'true' : 'false');
			break;
		default:
			// function | object | undefined
			break;
		}
	}
	return (data);
}

if (!String.sprintf) {
	String.sprintf = sprintf;
}

/**
 * Trim a URI to output it on a screen. This means cutting the
 * prefix url up to the last '#' or '/'.
 * 
 * @param value the value to trim
 * @return trimmed string
 */
function trimURI(value) {
	return value.substr(
			Math.max(value.lastIndexOf('#'), value.lastIndexOf('/')) + 1);
}

/**
 * Legacy from jit lib.
 */
function addEvent(obj, type, fn) {
    if (obj.addEventListener) obj.addEventListener(type, fn, false);
    else obj.attachEvent('on' + type, fn);
};

/**
 * Escape DOM IDs. Note that this node additionally escapes '/' and '#'.
 * 
 * @param id of the DOM element
 * @return valid jQuery selector
 * @see http://docs.jquery.com/Frequently_Asked_Questions#How_do_I_select_an_element_that_has_weird_characters_in_its_ID.3F
 */
function jq(myid) { 
	return '#' + myid.replace(/(:|\.|#|\/)/g,'\\$1');
}

/**
 * General content loader for query based node types.
 * 
 * @param type the node type
 * @param el element which should be augmented 
 * @param callbackFunction Use this function for callback reference of the
 * 			ajax call
 * @param params parameters which should be passed to the callbackFunction
 */
function queryLoader(query, el, callbackFunction, params) {
	var req = el.data.server.req;
	req[el.data.server.reqQueryField] = String.sprintf(query, el.id);
	$.getJSON(el.data.server.uri,
		req,
		function(data) {
			callbackFunction(el, data.results.bindings, params);
		});
}

/**
 * This function gets the size of the client window.
 * 
 * @see http://www.ajaxschmiede.de/javascript/fenstergrose-und-scrollposition-in-javascript-auslesen/
 */
function getWindowSize() {
	var myWidth = 0, myHeight = 0;

	if (typeof (window.innerWidth) == 'number') {
		//Non-IE
		myWidth = window.innerWidth;
		myHeight = window.innerHeight;
	} else if (document.documentElement
			&& (document.documentElement.clientWidth 
					|| document.documentElement.clientHeight)) {
		//IE 6+ in 'standards compliant mode'
		myWidth = document.documentElement.clientWidth;
		myHeight = document.documentElement.clientHeight;
	} else if (document.body
			&& (document.body.clientWidth || document.body.clientHeight)) {
		//IE 4 compatible
		myWidth = document.body.clientWidth;
		myHeight = document.body.clientHeight;
	}
	return [ myWidth, myHeight ];
}