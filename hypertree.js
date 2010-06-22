/**
 * This file contains the HyperTreeController. This class cares about all the
 * graph related stuff outside the actual library.
 * 
 * @author Felix Stahlberg
 */

var HypertreeController = {
		
	/**
	 * Hypertree instance (initalized by init()).
	 */
	_ht : false,
	
	/**
	 * Current config (created by Configurator).
	 */
	_config : false,
	
	/**
	 * Graph data structure.
	 */
	_graph : false,
	
	/**
	 * Whether the controller is busy by morphing or traversing. 
	 */
	_busy : false,
		
	/**
	 * That queue contains all the node indexes which should be augmented. 
	 * This is done by the function augmentNode() which is called periodically
	 * via processAugmentQueue().
	 * 
	 * @see processAugmentQueue()
	 */
	_augmentQueue : [ ],

	/**
	 * When processAugmentQueue is active, this contains the currently augmented
	 * node.
	 * 
	 * @see processAugmentQueue()
	 */
	_augmentingNode : false,

	/**
	 * Node id of the node which currently is centered.
	 */
	_centerNodeId : false,
	
	/**
	 * This init method has to be called before any action with the
	 * graph could be performed. It is a good idea to invoke that method in
	 * a $(document).ready() function. Please note that the size of infoviz
	 * has to be set already.
	 */
	init : function() {
		// Following code is jit specific, so it does not use jquery often
	    var infovis = document.getElementById('infovis');
	    var w = infovis.offsetWidth - 50, h = infovis.offsetHeight - 50;
	    
	    //init canvas
	    //Create a new canvas instance.
	    var canvas = new Canvas('mycanvas', {
	        'injectInto': 'infovis',
	        'width': w,
	        'height': h
	    });
	    //end
	    var style = document.getElementById('mycanvas').style;
	    style.marginLeft = style.marginTop = "25px";
	    //init Hypertree
	    this._ht = new Hypertree(canvas, {
	        //Change node and edge styles such as
	        //color, width and dimensions.
	        Node: {
	    		'overridable': true,
	            dim: 9,
	            color: "#f00"
	        },
	        
	        Edge: {
	        	'overridable': true,
	            lineWidth: 2,
	            color: "#088"
	        },
	        
	        onBeforeCompute: function(node){
	            Log.write("centering");
	        },
	        //Attach event handlers and add text to the
	        //labels. This method is only triggered on label
	        //creation
	        onCreateLabel: function(domElement, node){
	        	$(domElement).html(node.name);
	        	$(domElement).click(function() {
	        		HypertreeController.centerNode(
	        				HypertreeController.getNodeById(node.id)
	        		);
	        	});
	        },
	        //Change node styles when labels are placed
	        //or moved.
	        onPlaceLabel: function(domElement, node){
	            var style = domElement.style;
	            style.display = '';
	            style.cursor = 'pointer';
	            if (node._depth <= 1) {
	                style.fontSize = "0.8em";
	                style.color = "#008";
	            } else {
	                style.display = 'none';
	            }
	
	            var left = parseInt(style.left);
	            var w = domElement.offsetWidth;
	            style.left = (left - w / 2) + 'px';
	        },
	        
	        onAfterCompute: function(){
	            Log.write("done");
	            
	            //Build the right column relations list.
	            //This is done by collecting the information (stored in the data property) 
	            //for all the nodes adjacent to the centered node.
	            var node = Graph.Util.getClosestNodeToOrigin(
	            		HypertreeController._ht.graph, "pos");
	            var html = "<h4>" + node.name + "</h4>";
	            html += "<b>Connections:</b><ul>";
	            Graph.Util.eachAdjacency(node, function(adj){
	                var child = adj.nodeTo;
	                if (child.data) {
	                    html += '<li><strong>' + adj.data.config.name
	                    	+ '</strong> <a href="javascript:'
	                    	+ "HypertreeController.centerNode("
	                    	+ "HypertreeController.getNodeById('"
	                    	+ child.id 
	                    	+ '\'));">' + child.name + " " + "</a></li>";
	                }
	            });
	            html += "</ul>";
	            var dataNode = HypertreeController.getNodeById(node.id);
	            if (dataNode && dataNode.data.augmented 
	            		&& dataNode.data.displayed) {
		            html += "<b>Data:</b><ul>";
		            for (var i in node.data.displayed) {
		            	var binding = node.data.displayed[i];
		            	html += "<li>" 
		            		+ trimURI(binding.p.value)
		            		+ " <strong>";
		            	switch (binding.o.type) {
		            	case 'uri':
		            		html += '<a href="' + binding.o.value + '" title="'
		            		+ binding.o.value + '">'
		            		+ trimURI(binding.o.value) + "</a>";
		            		break;
		            	default:
		            		html += binding.o.value;
		            	}
		            	html += "</strong></li>";
		            }
		            html += "</ul>";
	            }
	            $('div#inner-details').html(html);
	        }
	    });
	    
	    this.loadConfig();
	    
	    this._processAugmentQueue();
	},
	
	/**
	 * Refreshes the hypertree and apply the config given by the current
	 * Configurator.
	 */
	loadConfig : function() {
		var config = CoreConfig.configurator.getConfig();
		
		// Errors
		if (!config) {
			Log.write("Invalid configuration");
			return;
		}
		if (!config.startNode || !config.startNodeType) {
			Log.write("Invalid start node");
			return;
		}
		if (!config.nodeTypes[config.startNodeType]) {
			Log.write("Invalid start node type");
		}
		if (!config.nodeTypes.length || config.nodeTypes.length) {
			Log.write("No nodes or edges");
		}
		
		// process
		this._augmentingNode = false;
		this._augmentQueue = [ ];
		this._busy = false;
		this._centerNodeId = false;
		
		this._config = config;
		
		this._graph = [
		               this.createNode(config.startNode, config.startNodeType)
		                ];
		
		this._ht.loadJSON(this._graph);
	    // compute positions and plot.
	    this._ht.refresh();
	    // end
	    this._ht.controller.onAfterCompute();
	    
	    this.centerNode(this._graph[0]);
	},

	/**
	 * Process the augment Queue to augment the nodes one by one. This procedure
	 * is called periodically.
	 * 
	 * @see augmentQueue
	 * @see augmentNode(node)
	 */
	_processAugmentQueue : function() {
		var prospect = false;
		while (HypertreeController._augmentQueue.length 
				&& (!prospect || prospect.augmented)) {
			prospect = HypertreeController._augmentQueue.shift();
		}
		HypertreeController._augmentingNode = prospect;
		if (HypertreeController._augmentingNode) {
			HypertreeController._augmentNode(HypertreeController._augmentingNode);
		} else {
			HypertreeController._augmentingNode = false;
			window.setTimeout("HypertreeController._processAugmentQueue()", 
					CoreConfig.augmentInterval);
		}
	},

	/**
	 * This function augments the given node.
	 * 
	 * @param node node which should be augmented
	 * @see augmentNodeCallback(id, data)
	 * @see _augmentQueue
	 */
	_augmentNode : function(node) { 
		if ((HypertreeController._centerNodeId != node.id && node.data.augmented) 
				|| node.data.neighboursAdded) {
			// node is already augmented / neighbours already loaded
			if (HypertreeController._centerNodeId == node.id) {
				HypertreeController._ht.onClick(node.id);
			}
			return;
		}
		node.data.augmented = true;
		node.data.config.contentLoader(node);
	},

	/**
	 * This function is a callback function for the asynchronous ajax request
	 * initiated by augmentNode()
	 * 
	 * @param id id of the node
	 * @param data json data from the server
	 * @see augmentNode(node)
	 */
	augmentNodeCallback : function(node, data) {
		node.data.displayed = [ ];
		node.data.sameAs = [ ];
		// Evaluating
		for (var i in data) {
			binding = data[i];
			switch (binding.p.value) {
			case node.data.config.sameAsType: // Add to sameAs list
				node.data.sameAs.push(binding.o.value);
				break;
			case node.data.config.displayName: // Update display name
				node.name = node.data.config.displayNameFormatter(
						binding.o.value);
				break;
			default: // Display this binding on mouseover
				node.data.displayed.push(binding);
			}
		}
		HypertreeController._updateNodeName(node.id, node.name);
		if (HypertreeController._augmentingNode.id == node.id) {
			window.setTimeout("HypertreeController._processAugmentQueue()", 
					CoreConfig.augmentInterval);
		}
	},

	/**
	 * Updates the name of a node in ht graph datastructure and in UI.
	 * 
	 * @param id node id of the node which should be updated
	 * @param name new name of the node
	 */
	_updateNodeName : function(id, name) {
		if (this._ht.graph.nodes[id]) {
			/*var el = document.getElementById(jq(id).substr(2));
            var left = parseInt(el.style.left);
            var w = el.offsetWidth;
            el.style.left = (left - w / 2) + 'px';*/
			$("div#infovis div" + jq(id)).html(name);
			this._ht.graph.nodes[id].name = name;
		}
	},

	/**
	 * Get the node index in graph datastructures of the specific node.
	 * 
	 * @param id id of the node
	 * @return the index in the graph array
	 */
	_getIndexById : function(id) {
		var index = 0;
		// Look up id so that we can realize parallel ajax requests. 
		// We assume that there are not so much nodes that this is a 
		// performance issue.
		for (; index < this._graph.length && this._graph[index].id != id; 
					index++);
		if (index >= this._graph.length) {
			return -1;
		}
		return index;
	},

	/**
	 * Get node object from graph datastructure by id.
	 * 
	 * @param id id to search for
	 * @return node object (element in graph) or false if it not exists
	 */
	getNodeById : function(id) {
		for (var i in this._graph) {
			if (this._graph[i].id == id) {
				return this._graph[i];
			}
		}
		return false;
	},

	/**
	 * Try to return the id of a node in graph which is described by the given
	 * id. This means it works through all the sameAs-Lists to determine which
	 * id is used instead.
	 * 
	 * @param id valid id in graph
	 * @return valid id in graph or false if it not exists
	 */
	_getId : function(id) {
		for (var i in this._graph) {
			var node = this._graph[i];
			if (node.id == id) {
				return id;
			}
			if (!node.data.sameAs) {
				continue;
			}
			for (var j in node.data.sameAs) {
				if (id == node.data.sameAs[j]) {
					return node.id;
				}
			}
		}
		return false;
	},
	
	/**
	 * Create a new node which can be added to the graph datastructure
	 * Hypertree*Controller*.
	 * 
	 * @param nodeId id of the new node
	 * @param nodeType type of the new node
	 * @return node object
	 */
	createNode : function(nodeId, nodeType) {
		return {
			id : nodeId,
			name : nodeId,
			adjacencies : [ ],
			data : {
				type : nodeType,
				"$color": HypertreeController._config.nodeTypes[nodeType].color,
				"$type": HypertreeController._config.nodeTypes[nodeType].style,
				config : AvailableConfigs.nodeTypes[nodeType],
				server : HypertreeController._config.nodeTypes[nodeType].server,
				outgoingEdges : HypertreeController
					._config.nodeTypes[nodeType].outgoingEdges,
				augmented: false,
				neighboursAdded : 0
			}
		};
	},

	/**
	 * Center the given node and replot.
	 *  
	 * @param node
	 */
	centerNode : function(node) {
		if (this._busy) {
			return false;
		}
		this._busy = true;
		this._centerNodeId = node.id;
		this._augmentNode(node);
		if (!node.data.neighboursAdded) {
			var traversed = false;
			for (var edgeId in node.data.outgoingEdges) {
				traversed = true;
				node.data.outgoingEdges[edgeId].traverser(node, edgeId);
			}
			if (!traversed) { // no outgoing Edges -> no traversation
				HypertreeController.centerHypertreeNode(node);
			}
		} else {
			HypertreeController.centerHypertreeNode(node);
		}
	},
	
	/**
	 * Center node in canvas.
	 * 
	 * @param node node which should be centered
	 */
	centerHypertreeNode : function(node) {
		this._ht.onClick(node.id);
		this._busy = false;
	},
	
	/**
	 * This function is a callback function for the asynchronous ajax request
	 * initiated by centerNode()
	 * 
	 * @param node from which should be traversed
	 * @param data json data from the server
	 * @param edgeId id of the edge
	 * @see centerNode(node)
	 */
	centerNodeCallback : function(node, data, edgeId) {
		var neighboursAdded = false;
		var neighbourNodeType = node.data.outgoingEdges[edgeId].toType;
		var edgeStyle = node.data.outgoingEdges[edgeId].style;
		var edgeColor = node.data.outgoingEdges[edgeId].color;
		// Evaluating
		for (var i in data) {
			binding = data[i];
			var neighbour = HypertreeController._getId(binding.adj.value);
			if (neighbour) { // Neighbour already exists
				node.adjacencies.push({
					nodeTo : neighbour,
					data : {
						"$type" : edgeStyle,
						"$color" : edgeColor,
						config : node.data.outgoingEdges[edgeId]
					}
				});
			} else {
				if (HypertreeController._centerNodeId == node.id) {
					neighboursAdded = true;
					var neighbourNode = HypertreeController.createNode(
							binding.adj.value, neighbourNodeType);
					// Add it to the graph
					HypertreeController._graph.push(neighbourNode);
					// Add it to queue
					HypertreeController._augmentQueue.push(neighbourNode);
					node.adjacencies.push({
						nodeTo : binding.adj.value,
						data : {
							"$type" : edgeStyle,
							"$color" : edgeColor,
							config : node.data.outgoingEdges[edgeId]
						}
					});
				}
			}
		}
		// Only if this is the last traversion
		if (++node.data.neighboursAdded >= node.data.outgoingEdges.length) {
			HypertreeController._ht.op.morph(HypertreeController._graph, {
				type: "fade:con",
				fps: 20,
				duration: 1000,
				hideLabels: true,
				onComplete: function(){
					Log.write("morph complete!");
					HypertreeController.centerHypertreeNode(node);
				}
			});
		}
	}
};