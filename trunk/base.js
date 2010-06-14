/**
 * This file contains basic elements such as helper functions or logging
 * mechanism and the configuration.
 */

/**
 * Choosen configuration.
 */
var choosenConfig = window.location.search.indexOf("config=knows") < 0
	? "reference" : "knows";

/**
 * Available configurations.
 */
var ConfigPool = {
	knows : { // Configuration for exploring foaf:knows relationships
		augmentInterval : 1000,
		nodeType : "rdf:type foaf:Person",
		edgeType : "foaf:knows",
		sameAsType : "http://www.w3.org/2002/07/owl#sameAs",
		displayName : "http://www.w3.org/2000/01/rdf-schema#label",
		queryURL : "http://localhost/hiwi/proxy.php",
		req : {
			async: false,
			accept: "application/sparql-results+json"
		},
		reqQueryField : "query",
		initialGraph : [ {
			id : "http://harth.org/andreas/foaf#ah",
			name : "http://harth.org/andreas/foaf#ah",
			adjacencies : [ ],
			data : {
				loader : uriContentLoader,
				traverser : uriTraverser,
				augmented: false,
				neighboursAdded : false
			}
		} ]
	},
	reference : { // Configuration for exploring dcterms:references relations
		augmentInterval : 500,
		nodeType : "dc:type "
			+ "<http://purl.org/dc/dcmitype/Text>",
		edgeType : "dcterms:references",
		sameAsType : "http://www.w3.org/2002/07/owl#sameAs",
		displayName : "http://www.w3.org/2000/01/rdf-schema#label",
		queryURL : "http://localhost/hiwi/proxy2.php",
		req : {
			output: "json"
		},
		reqQueryField : "query",
		initialGraph : [ {
			id : "http://dblp.l3s.de/d2r/resource/publications/books/aw/AbiteboulHV95",
			name : "http://dblp.l3s.de/d2r/resource/publications/books/aw/AbiteboulHV95",
			adjacencies : [ ],
			data : {
				loader : uriContentLoader,
				traverser : uriTraverser,
				augmented: false,
				neighboursAdded : false
			}
		} ]
	}
};

// Setting up Configuration
var Config = ConfigPool[choosenConfig];
var prefix = "PREFIX foaf: <http://xmlns.com/foaf/0.1/> \n"
	+ "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"
	+ "PREFIX dc: <http://purl.org/dc/elements/1.1/>\n"
	+ "PREFIX dcterms: <http://purl.org/dc/terms/>\n"
	+ "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n";
Config.loaderQueries = {
		"uri" : prefix + "SELECT DISTINCT ?p ?o WHERE { <%s> ?p ?o . "
			+ "FILTER (?p != " + Config.edgeType + ")} LIMIT 50"
};

Config.traverserQueries = {
		"uri" : prefix + "SELECT DISTINCT ?friendURI WHERE { \n" 
			+ "<%s> " + Config.edgeType 
			+ " ?friendURI .\n"
			+ "?friendURI " + Config.nodeType + " .\n"
			+ "} LIMIT 10"
};

/**
 * Initial graph datastructure. The first node is used for the inital 
 * centered node.
 */
var graph = Config.initialGraph;

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