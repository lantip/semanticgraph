/**
 * This is a view of the MVC pattern, which handles the user interface using
 * hypertree from the jit library.
 * 
 * @see Observable
 */

var st = false;
var view = this;

function GraphView(gPanel, iPanel, cPanel) {

	/*
	 * Panels in DOM tree.
	 */
	var graphPanel = gPanel;
	var infoPanel = iPanel;
	var configPanel = cPanel;
	
	var model = false;
	var infoPanelNode = false;

	/**
	 * Initalizations
	 */
	this.init = function(m) {
		view = this;
		model = m;
		model.addObserver(this);
		//Create a new ST instance
		this.st = new $jit.ST( {
			injectInto : graphPanel,
			transition: $jit.Trans.Quart.easeInOut,
			//set distance between node and its children  
			levelDistance : 50,
			levelsToShow: 1, 
			//offsetX : 130,
			Node : {
				overridable : true,
				type : 'stroke-rect',
				height : 20,
				width : 100,
				//canvas specific styles  
				CanvasStyles : {
					fillStyle : Config.colors["default"],
					strokeStyle : '#23A4FF',
					lineWidth : 1
				}
			},
			Edge : {
				overridable : true,
				type : 'line',
				color : '#23A4FF',
				lineWidth : 1
			},
			Label : {
				//type : Config.labelTyoe,
				style : 'bold',
				size : 10,
				color : '#333'
			},
			/* 
			 * This method gets called when a node  
			 * is clicked and its subtree has a smaller depth  
			 * than the one specified by the levelsToShow parameter.
			 */
			request : function(nodeId, level, onComplete) {
				if (level == 1) {
					view.request(nodeId, onComplete);
				} else {
					onComplete.onComplete(nodeId, [ ]);
				}
			},

			onCreateLabel : function(label, node) {
		        label.id = node.id;              
		        label.innerHTML = node.name;  
		        label.onclick = function(){
		            st.onClick(node.id);
		            view.setCenterNode(node);
		        };
				
		        //set label styles  
		        var style = label.style;  
		        style.width = 70 + 'px';  
		        style.height = 17 + 'px';              
		        style.cursor = 'pointer';  
		        style.color = '#fff';  
		        //style.backgroundColor = '#1a1a1a';  
		        style.fontSize = '0.8em';  
		        style.textAlign= 'center';  
		        style.textDecoration = 'underline';  
		        style.paddingTop = '3px';  
			},
			onPlaceLabel : function(label, node) {
				var style = label.style;
				style.width = node.getData('width') + 'px';
				style.height = node.getData('height') + 'px';
				style.color = node.getLabelData('color');
				style.fontSize = node.getLabelData('size') + 'px';
				style.textAlign = 'center';
				style.paddingTop = '3px';
			},
			
			// This method is called right before plotting
			// a node. It's useful for changing an individual node
			// style properties before plotting it.
			// The data properties prefixed with a dollar
			// sign will override the global node style properties.
			onBeforePlotNode : function(node) {
				var layout = model.getNodeLayout(node.data.type);
				node.Config.CanvasStyles.fillStyle = Config.colors[layout.color];
				node.Config.type = layout.rendering;
			},

			// This method is called right before plotting
			// an edge. It's useful for changing an individual edge
			// style properties before plotting it.
			// Edge data proprties prefixed with a dollar sign will
			// override the Edge global style properties.
			onBeforePlotLine : function(adj) {
				if (adj.nodeFrom.selected && adj.nodeTo.selected) {
					adj.data.$lineWidth = 3;
				} else {
					delete adj.data.$color;
					delete adj.data.$lineWidth;
				}
			},
			       
			onBeforeCompute : function(node) {
				Log.write("Loading " + node.name);
			},

			onAfterCompute : function() {
				Log.write("Loaded");
				view.updateDisplayedMarks();
			}  
		});
		st = this.st;
		this.rebuildConfigPanel(model.getNodeLayouts());
		this.reload();
	};
	
	/**
	 * Reload the space tree.
	 */
	this.reload = function() {
		// load json data
		this.st.loadJSON(model.getCenterNode());
		// compute node positions and layout
		this.st.compute();
		this.st.onClick(this.st.root);
		infoPanelNode = model.getCenterNode();
	};
	
	/**
	 * Update the information stored in model concerning displayed nodes.
	 */
	this.updateDisplayedMarks = function() {
		model.unmarkAllNodes();
		$("div#infovis div.node").each(function() {
			model.markNodeAsDisplayed($(this).attr("id"));
		});
	};
	
	/**
	 * Synchronize children array with the new given dispChildrenOffset and
	 * replot the canvas
	 */
	this.updateDispChildrenOffset = function(newOffset) {
		infoPanelNode.data.dispChildrenOffset = newOffset;
		updateChildrenArray(infoPanelNode);
		loadInfoPanel();
		this.st.removeSubtree(infoPanelNode.id, false, 'animate', {  
			onComplete: function() {  
				st.addSubtree(infoPanelNode, 'animate');  
			}  
		});
	};
	
	/**
	 * Request occured. Tree have to be extended. This method is called from
	 * st.request()
	 * 
	 * @see st.request() for parameter description
	 */
	this.request = function(nodeId, onComplete) {
		this.setChanged();
		this.notifyObservers({
			"type": "request",
			"arg": {
				"nodeId": nodeId,
				"callbackFunction": onComplete
			}
		});
	};
	
	/**
	 *  Rebuild the config panel based on the available node layouts.
	 *  
	 *  @param layouts array of node layouts
	 */
	this.rebuildConfigPanel = function(layouts) {
		html = "";
		for (var i in layouts) {
			html+= createLayoutListElement(layouts[i]);
		}
		$("ul#config-nodes-list").html(html);
		$("ul#config-nodes-list select").change(function() {
			var params = $(this).attr("id").split('-');
			updateNodeLayout(params[4]);
		});
	};
	
	/*
	 * Get the settings of a specific node layout from the UI and put it in
	 * model.
	 */
	var updateNodeLayout = function(id) {
		var layout = model.getNodeLayout(id);
		layout.color = $(jq("config-panel-nodes-color-" + id)).val();
		layout.rendering = $(jq("config-panel-nodes-rendering-" + id)).val();
		layout.server = $(jq("config-panel-nodes-server-" + id)).val();
		model.setNodeLayout(id, layout);
	};
	
	/*
	 * Returns the html source of a select box.
	 * 
	 * @param id of the selectbox
	 * @param data an array with keys which are used for the values
	 * @param sel set this to specify the selected entry
	 * @return html code
	 */
	var createSelectBox = function(id, data, sel) {
		var html = '<select id="' + id + '" size="1">';
		for (var i in data) {
			html += '<option';
			if (i == sel) {
				html += ' selected="selected"';
			}
			html += ' value="' + i + '">' 
			+ (data[i].name ? data[i].name : i) + '</option>';
		}
		html += '</select>';
		return html;
	};
	
	/*
	 * Returns the html source of a control element which is used to
	 * configure a node layout. We assume this elements
	 * are inside of an ul-tag.
	 * 
	 * @param id of the element (necessary to set html-ids)
	 * @param el graph element which should be used
	 * @return html code
	 */
	var createLayoutListElement = function(layout) {
		var html = '<li><em>' + layout.name + "</em> is displayed as "
			+ createSelectBox("config-panel-nodes-color-" + layout.id,
				Config.colors, layout.color) + " "
			+ createSelectBox("config-panel-nodes-rendering-" + layout.id,
				Config.nodeRenderings, layout.rendering)
			+ " and loaded from "
			+ createSelectBox("config-panel-nodes-server-" + layout.id,
				Config.servers, layout.server);
		return html + ".</li>";
	};
	
	/*
	 * Create a link for changing the dispChildrenOffset value of the current
	 * infoPanelNode.
	 * 
	 * @param string label link text
	 * @param int offset the new offset
	 */
	var createDispChildrenOffsetLink = function(label, offset) {
		return '&nbsp;<a href="javascript:view.updateDispChildrenOffset('
			+ offset + ')">' + label + '</a>&nbsp;';
	};
	
	/**
	 * Set centered node in model. Deligate the storing and notification of
	 * observers to the model.
	 * 
	 * @param node new centered node
	 */
	this.setCenterNode = function(node) {
		model.setCenterNode(model.getNode(node.id));
	};

	/**
	 * See java.util.Observer.update() in the official java api.
	 * 
	 * @param o the observable object
	 * @param arg an argument passed to the notifyObservers method
	 * @see Observable
	 */
	this.update = function(o, arg) {
		switch (arg.type) {
		case "centerNode": // GraphModel set a new centered node
			infoPanelNode = arg.arg;
			loadInfoPanel();
			break;
		case 'augmentNode': // Augmenter augmented a node
			if (arg.arg == infoPanelNode) {
				loadInfoPanel();
			}
			break;
		case 'nodeNameUpdate': // Augmenter get a valid node name
			$("div#infovis div" + jq(arg.arg.id)).html(arg.arg.name);
			break;
		case 'nodeTypeUpdate': // Augmenter get a node type
			if ($("div#infovis div" + jq(arg.arg.id)).length) {
				st.graph.nodes[arg.arg.id].data.type = arg.arg.data.type;
				st.plot();
			}
			break;
		case 'nodeLayout': // Node layouts has changed. Replot relevant nodes
			st.plot();
			break;
		}
	};
	
	/*
	 * Load content of infoPanelNode into the info panel.
	 */
	var loadInfoPanel = function() {
		// Build the right column relations list.
		// This is done by collecting the information (stored in the data property) 
		// for all the nodes adjacent to the centered node.
        var html = "<h4>" + infoPanelNode.data.name + "</h4>";
        var maxDispChildIndex = Math.min(infoPanelNode.data.children.length,
    			infoPanelNode.data.dispChildrenOffset 
    			+ infoPanelNode.data.dispChildrenCount);
        html += "<b>Connections:</b><p>";
        if (infoPanelNode.data.dispChildrenOffset > 0) {
        	html += createDispChildrenOffsetLink("&laquo;", 0);
        }
        if (infoPanelNode.data.dispChildrenOffset 
        		- infoPanelNode.data.dispChildrenCount > 0) {
        	html += createDispChildrenOffsetLink("&lsaquo;", 
        			infoPanelNode.data.dispChildrenOffset 
            		- infoPanelNode.data.dispChildrenCount);
        }
        html += (infoPanelNode.data.dispChildrenOffset+1) + "-" + maxDispChildIndex
    	+ " of " + infoPanelNode.data.children.length;
        if (infoPanelNode.data.dispChildrenOffset 
        		+ 2*infoPanelNode.data.dispChildrenCount < 
        		infoPanelNode.data.children.length) {
        	html += createDispChildrenOffsetLink("&rsaquo;", 
        			infoPanelNode.data.dispChildrenOffset 
            		+ infoPanelNode.data.dispChildrenCount);
        }
        if (infoPanelNode.data.dispChildrenOffset 
        		+ infoPanelNode.data.dispChildrenCount < 
        		infoPanelNode.data.children.length) {
        	html += createDispChildrenOffsetLink("&raquo;", 
        			Math.max(0, infoPanelNode.data.children.length -
        					infoPanelNode.data.dispChildrenCount));
        }
        html += "</p><ul>";
        for (var i in infoPanelNode.children) {
        	var adj = infoPanelNode.children[i];
            if (adj.data) {
                html += '<li><strong>' 
                	+ Formatters.uri(
                		infoPanelNode.data.children[
                		  parseInt(i) + infoPanelNode.data.dispChildrenOffset
                		].type)
                	+ '</strong> <a href="javascript:'
                	+ "st.onClick(\'"
                	+ adj.id
                	+ '\');">' + adj.name + " " + "</a></li>";
            }        	
        }
		html += "</ul><b>Attributes:</b><ul>";
		for (var i in infoPanelNode.data.attrs) {
			var binding = infoPanelNode.data.attrs[i];
			html += "<li>" + trimURI(binding.p.value) + " <strong>";
			switch (binding.o.type) {
			case 'uri':
				html += '<a href="' + binding.o.value + '" title="'
						+ binding.o.value + '">' + trimURI(binding.o.value)
						+ "</a>";
				break;
			default:
				html += binding.o.value;
			}
			html += "</strong></li>";
		}
		html += "</ul>";
		$("#" + infoPanel).html(html);
	};
}

GraphView.prototype = new Observable;
