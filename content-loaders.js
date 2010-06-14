/**
 * There are different loaders for node data. Which of them should be choosen
 * to load a certain type of node is saved in the global contentLoaders variable
 * on the bottom of this file.
 */

/**
 * General content loader for query based node types.
 * 
 * @param type the node type
 * @param id node id which should be augmented 
 */
function queryLoader(query, id, callbackFunction) {
	var req = Config.req;
	req[Config.reqQueryField] = String.sprintf(query, id);
	$.getJSON(Config.queryURL,
		req,
		function(data) {
			callbackFunction(id, data.results.bindings);
		});
}

/**
 * Content loader of node type "uri".
 * 
 * @param id node id which should be augmented
 */
function uriContentLoader(id) {
	return queryLoader(Config.loaderQueries["uri"], id, augmentNodeCallback);
}

/**
 * Content loader of node type "bnode".
 * 
 * @param id node id which should be augmented
 */
function bnodeContentLoader(id) {
	Log.write("Loading bnodes is not implemented");
	return false;
}

/**
 * Traverser of node type "uri".
 * 
 * @param id node id which should be traversed
 */
function uriTraverser(id) {
	return queryLoader(Config.traverserQueries["uri"], id, centerNodeCallback);
}

/**
 * Traverser of node type "bnode".
 * 
 * @param id node id which should be augmented
 */
function bnodeTraverser(id) {
	Log.write("Traversing bnodes is not implemented");
	return false;
}

/**
 * Content loaders of available node types.
 */
var contentLoaders = {
	"uri": uriContentLoader,
	"bnode": bnodeContentLoader
};

/**
 * Traversers of available node types.
 */
var traversers = {
	"uri": uriTraverser,
	"bnode": bnodeTraverser
};