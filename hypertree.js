
/**
 * That queue contains all the node indexes which should be augmented. 
 * This is done by the function augmentNode() which is called periodically
 * via processAugmentQueue().
 * 
 * @see processAugmentQueue()
 */
var augmentQueue = [ ];

/**
 * When processAugmentQueue is active, this contains the currently augmented
 * node.
 * 
 * @see processAugmentQueue()
 */
var augmentingNode = false;

/**
 * Node id of the node which currently is centered.
 */
var centerNodeId;

/**
 * Hypertree instance. This is created in main runner method.
 */
var ht;

/**
 * Process the augment Queue to augment the nodes one by one. This procedure
 * is called periodically.
 * 
 * @see augmentQueue
 * @see augmentNode(node)
 */
function processAugmentQueue() {
	var prospect = false;
	while (augmentQueue.length 
			&& (!prospect || prospect.augmented)) {
		prospect = augmentQueue.shift();
	}
	augmentingNode = prospect;
	if (augmentingNode) {
		augmentNode(augmentingNode);
	} else {
		augmentingNode = false;
		window.setTimeout("processAugmentQueue()", Config.augmentInterval);
	}
}

/**
 * This function augments the given node.
 * 
 * @param node node which should be augmented
 * @see augmentNodeCallback(id, data)
 * @see augmentQueue
 */
function augmentNode(node) { 
	if ((centerNodeId != node.id && node.data.augmented) 
			|| node.data.neighboursAdded) {
		// node is already augmented / neighbours already loaded
		if (centerNodeId == node.id) {
			ht.onClick(node.id);
		}
		return;
	}
	node.data.augmented = true;
	node.data.loader(node.id);
}

/**
 * This function is a callback function for the asynchronous ajax request
 * initiated by augmentNode()
 * 
 * @param id id of the node
 * @param data json data from the server
 * @see augmentNode(node)
 */
function augmentNodeCallback(id, data) {
	var index = getIndexById(id);
	if (index < 0) {
		return;
	}
	var node = graph[index];
	node.data.displayed = [ ];
	node.data.sameAs = [ ];
	// Evaluating
	for (var i in data) {
		binding = data[i];
		switch (binding.p.value) {
		case Config.sameAsType: // Add to sameAs list
			node.data.sameAs.push(binding.o.value);
			break;
		case Config.displayName: // Update display name
			node.name = binding.o.value;
			break;
		default: // Display this binding on mouseover
			node.data.displayed.push(binding);
		}
	}
	graph[index] = node;
	updateNodeName(node.id, node.name);
	if (augmentingNode.id == id) {
		window.setTimeout("processAugmentQueue()", Config.augmentInterval);
	}
}

/**
 * Updates the name of a node in ht graph datastructure and in UI.
 * 
 * @param id node id of the node which should be updated
 * @param name new name of the node
 */
function updateNodeName(id, name) {
	ht.graph.nodes[id].name = name;
	$("div#infovis div" + jq(id)).html(name);
}

/**
 * Get the node index in graph datastructures of the specific node.
 * 
 * @param id id of the node
 * @return the index in the graph array
 */
function getIndexById(id) {
	var index = 0;
	// Look up id so that we can realize parallel ajax requests. 
	// We assume that there are not so much nodes that this is a 
	// performance issue.
	for (; index < graph.length && graph[index].id != id; index++);
	if (index >= graph.length) {
		return -1;
	}
	return index;
}

/**
 * Get node object from graph datastructure by id.
 * 
 * @param id id to search for
 * @return node object (element in graph) or false if it not exists
 */
function getNodeById(id) {
	for (var i in graph) {
		if (graph[i].id == id) {
			return graph[i];
		}
	}
	return false;
}

/**
 * Try to return the id of a node in graph which is described by the given
 * id. This means it works through all the sameAs-Lists to determine which
 * id is used instead.
 * 
 * @param id valid id in graph
 * @return valid id in graph or false if it not exists
 */
function getId(id) {
	for (var i in graph) {
		var node = graph[i];
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
}

/**
 * Center the given node and replot.
 *  
 * @param node
 */
function centerNode(node) {
	centerNodeId = node.id;
	augmentNode(node);
	if (!node.data.neighboursAdded) {
		node.data.neighboursAdded = true;
		node.data.traverser(node.id);
	} else {
		ht.onClick(node.id);
	}
}

/**
 * This function is a callback function for the asynchronous ajax request
 * initiated by centerNode()
 * 
 * @param id id of the node
 * @param data json data from the server
 * @see centerNode(node)
 */
function centerNodeCallback(id, data) {
	var index = getIndexById(id);
	if (index < 0) {
		return;
	}
	var node = graph[index];
	var neighboursAdded = false;
	// Evaluating
	for (var i in data) {
		binding = data[i];
		var neighbour = getId(binding.friendURI.value);
		if (neighbour) { // Neighbour already exists
			node.adjacencies.push(neighbour);
		} else {
			if (centerNodeId == id && !node.data.neighborsAdded) {
				neighboursAdded = true;
				var neighbourNode = { // Create new node
						id : binding.friendURI.value,
						name : binding.friendURI.value,
						adjacencies : [ ],
						data : {
							loader : contentLoaders[binding.friendURI.type],
							traverser : traversers[binding.friendURI.type],
							augmented: false,
							neighboursAdded : false
						}
				};
				graph.push(neighbourNode); // Add it to the graph
				augmentQueue.push(neighbourNode); // Add it to queue
				node.adjacencies.push(binding.friendURI.value);
			}
		}
	}
	graph[index] = node;
	if (neighboursAdded) {
		ht.op.morph(graph, {
			type: "fade:con",
			fps: 20,
			duration: 1000,
			hideLabels: true,
			onComplete: function(){
			Log.write("morph complete!");
			ht.onClick(id);
		}
		});
	} else {
		ht.onClick(id);
	}
}

/**
 * Main runner method.
 */
$(document).ready(function() {
	
	// Following code is jit specific, so it does not use jquery
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
    ht = new Hypertree(canvas, {
        //Change node and edge styles such as
        //color, width and dimensions.
        Node: {
            dim: 9,
            color: "#f00"
        },
        
        Edge: {
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
        		centerNode(getNodeById(node.id));
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

            } else if(node._depth == 2){
                style.fontSize = "0.7em";
                style.color = "#00c";

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
            var node = Graph.Util.getClosestNodeToOrigin(ht.graph, "pos");
            var html = "<h4>" + node.name + "</h4>";
            html += "<b>Connections:</b><ul>";
            Graph.Util.eachAdjacency(node, function(adj){
                var child = adj.nodeTo;
                if (child.data) {
                    html += '<li><a href="javascript:centerNode(getNodeById(\''
                    	+ child.id 
                    	+ '\'));">' + child.name + " " + "</a></li>";
                }
            });
            html += "</ul>";
            var dataNode = getNodeById(node.id);
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
    
    ht.loadJSON(graph);
    // compute positions and plot.
    ht.refresh();
    // end
    ht.controller.onAfterCompute();
    
    centerNode(graph[0]);
    
    processAugmentQueue();
});