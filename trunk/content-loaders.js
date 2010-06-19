/**
 * Content loaders are used to augment nodes and edges.
 * 
 * @author Felix Stahlberg
 */

var ContentLoaders = {
	
	/**
	 * Query which is used to augment elements identified by uri.
	 */
	_uriQuery : false,
	
	/**
	 * Content loader which loads no content.
	 * 
	 * @param node which should be augmented (not used)
	 */
	none : function(node) {
		return true;
	},
		
	/**
	 * Content loader of type "uri".
	 * 
	 * @param node which should be augmented
	 * @see queryLoader
	 */
	uri : function(node) {
		if (!ContentLoaders._uriQuery) {// Create _uriQuery
			ContentLoaders._uriQuery = 
				CoreConfig.prefix 
				+ "SELECT DISTINCT ?p ?o WHERE { <%s> ?p ?o . ";
			for (var edgeType in AvailableConfigs.edgeTypes) {
				ContentLoaders._uriQuery += 
					"FILTER (?p != " + edgeType + ").";
			}
			ContentLoaders._uriQuery += "} LIMIT 50";
		}
		return queryLoader(ContentLoaders._uriQuery, node, 
				HypertreeController.augmentNodeCallback);
	},

	/**
	 * Content loader of type "bnode".
	 * 
	 * @param node which should be augmented
	 */
	bnode : function(node) {
		Log.write("Loading bnodes is not implemented");
		return false;
	}
};