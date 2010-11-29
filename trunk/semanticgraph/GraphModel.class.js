/**
 * This is a model of the MVC pattern, which basically contains the graph
 * data structure
 * 
 * @see Observable
 */
function GraphModel() {
	
	/*
	 * Current layouts
	 */
	var nodeLayouts = {
	};
	
	/*
	 * Graph data structure (adjacence list)
	 */
	var graph = [ ];
	
	var centerNode = false;

	/**
	 * Initalizations
	 */
	this.init = function() {
		this.setNodeLayout("unknown", Config.defaultNodeLayout);
		this.setNodeLayout("undefined", Config.defaultNodeLayout);
		this.setCenterNode(
			this.addNode(this.createNode(Config.rootNodeId,
					Formatters.uri(Config.rootNodeId)))
		);
	};
	
	/**
	 * Add a node to the graph data structure. This node is per default not
	 * adjacent to any other node.
	 * 
	 * @param Node node object to be added (Create with createNode())
	 * @param id node id to use. if this is not set, node.id is used. Use this
	 * 			to handle sameAs 
	 */
	this.addNode = function(node, id) {
		graph[id ? id : node.id] = node;
		this.setChanged();
		this.notifyObservers({
			"type": "addNode",
			"arg": node
		});
		return node;
	};
	
	/**
	 * Create a node object without adding it to the graph data structure.
	 * 
	 * @param string id ID of the new node
	 * @param string name Name of the new node
	 * @param string type node type 
	 */
	this.createNode = function(id, name, type) {
		if (!type || !this.getNodeLayout(type)) {
			type = "unknown";
		}
		var node = this.getNode(id);
		if (node) {
			return node;
		}
		node = {
			"id": id,
			"name": Formatters.shorten(name),
			"data": {
				"name" : name,
				"server": Config.servers[nodeLayouts[type]["server"]],
				"augmentOffset": 0,
				"dispChildrenOffset": 0,
				"dispChildrenCount": Config.defaultDisplayedChildrenCount,
				"type": type,
				"attrs": [ ],
				"children": [ ]
			},
			"children": [ ]
		};
		this.addNode(node);
		return node;
	};
	
	/**
	 * Getter for nodes
	 * 
	 * @param id node identifier
	 */
	this.getNode = function(id) {
		return graph[id];
	};
	
	/**
	 * Getter for center node
	 */
	this.getCenterNode = function() {
		return centerNode;
	};
	
	/**
	 * Setter for center node
	 */
	this.setCenterNode = function(node) {
		centerNode = node;
		this.setChanged();
		this.notifyObservers({
			"type": "centerNode",
			"arg": node
		});
	};
	
	/**
	 * Get an array of all node layouts
	 */
	this.getNodeLayouts = function() {
		return nodeLayouts;
	};
	
	/**
	 * Getter for node layouts
	 * 
	 * @param id node type identifier
	 */
	this.getNodeLayout = function(id) {
		return nodeLayouts[id];
	};
	
	/**
	 * Setter for node layouts. Note: the layouts are always copied.
	 * 
	 * @param id node type identifier
	 * @param layout layout to be set
	 */
	this.setNodeLayout = function(id, layout) {
		nodeLayouts[id] = copy(layout);
		nodeLayouts[id].id = id;
		nodeLayouts[id].name = trimURI(id);
		this.setChanged();
		this.notifyObservers({
			"type": "nodeLayout",
			"arg": nodeLayouts[id]
		});
	};
	
	/*
	 * Copy an one level associative array.
	 * 
	 * @param obj object to be copied
	 * @return a copy of obj
	 */
	var copy = function(obj) {
		var copy = { };
		for (var i in obj) {
			copy[i] = obj[i];
		}
		return copy;
	};
}

GraphModel.prototype = new Observable;