/**
 * Traversers explore outgoing edges and extend the graph.
 * 
 * @author Felix Stahlberg
 */

var Traversers = {
	
	/**
	 * Traverser of type "uri".
	 * 
	 * @param node from which should be traversed
	 * @param edgeId which should be traversed
	 * @see queryLoader
	 */
	uri : function(node, edgeId) {
		return queryLoader(CoreConfig.prefix
				+ "SELECT DISTINCT ?adj WHERE { \n" 
				+ "<%s> " + edgeId 
				+ " ?adj .\n"
				+ "?adj " + node.data.outgoingEdges[edgeId].toType + " .\n"
				+ "} LIMIT 10",
			node, HypertreeController.centerNodeCallback, edgeId);
	},

	/**
	 * Traverser of type "bnode".
	 * 
	 * @param id node id which should be augmented
	 */
	bnode : function(id) {
		Log.write("Traversing bnodes is not implemented");
		return false;
	}
};
