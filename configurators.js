/**
 * Configurators set up the final configuration of semanticgraph. They use
 * AvailableConfigs to extract a certain set of parameters and initiate the
 * displaying process.
 * 
 * @author Felix Stahlberg
 */

var Configurators = {
	
	/**
	 * This configurator do not interact with the user to determine parameters.
	 * Instead you can here set up a static configuration which is used all
	 * the time.
	 */
	simple : {
		init : function() {
			$("div#config-panel-header").hide();
		},
		getConfig : function() {
		}
	},
	
	/**
	 * This configurator uses a configuration panel and presents all the
	 * available configuration parmaters to the user. Therefore the config
	 * can be adjusted dynamically.
	 */
	panel : {
		
		/**
		 * Determines whether the panel is currently displayed or not.
		 */
		_displayed : false,
		
		/**
		 * Track the state of the config panel.
		 */
		state : {
			relations : [ ],
			nodes : [ ],
			edges : [ ],
			startNodeType : false
		},
		
		/**
		 * This function is called in $(document).ready(). Therefore the
		 * relation list is loaded and eventhandler are registrated.
		 */
		init : function() {
		
			// Click handler for header
			$("#config-panel-header").click(function() {
				this._displayed = !this._displayed;
				if (this._displayed) {
					$('#config-panel').slideDown("fast");
					$('#config-panel-header').html("Hide Configuration");
				} else {
					$('#config-panel').slideUp("fast");
					$('#config-panel-header').html("Show Configuration");
				}
			});
			
			// Build relation list and state variable
			var html = '';
			for (var rel in AvailableConfigs.edgeTypes) {
				this.addEdge(rel);
				this.addNode(AvailableConfigs.edgeTypes[rel].fromType);
				this.addNode(AvailableConfigs.edgeTypes[rel].toType);
				var id = 'config-panel-rel-' + rel;
				html += '<li><input type="checkbox" id="' + id
					+ '" /> <label for="' + id + '">' + rel + '</label></li>';
			}
			$("ul#config-relation-list").html(html);
			
			$("ul#config-relation-list input").change(function() {
				Configurators.panel.state.relations = [ ];
				$("ul#config-relation-list input:checked ").each(function(){
					Configurators.panel.state.relations.push(
							$(this).attr("id").substr(17));
				});
				Configurators.panel.consistentState();
			});
			
			// Select first relation by default
			$("ul#config-relation-list input:first").attr("checked",
					"checked").change();
		},
		
		/**
		 * Extract the graph config from the current state. This method is
		 * called by HyperTree.
		 * 
		 * @return config data structure if the input values are valid,
		 * 			false otherwise
		 */
		getConfig : function() {
			var config = {
				nodeTypes : { },
				edgeTypes : { },
				startNode : $("input#start-node").val(),
				startNodeType : $("#start-node-type").val()
			};
			// Copy from AvailableConfigs
			var mapping = {
				edges : "edgeTypes",
				nodes : "nodeTypes"
			};
			for (var src in mapping) {
				for (var id in this.state[src]) {
					if (this.state[src][id].displayed) {
						config[mapping[src]][id] = { };
						for (var field in 
								AvailableConfigs[mapping[src]][id]) {
							config[mapping[src]][id][field] =
								AvailableConfigs[mapping[src]][id][field];
						}
						config[mapping[src]][id]["style"] =
							this.state[src][id]["style"];
						config[mapping[src]][id]["color"] =
							AvailableConfigs.colors[
							                  this.state[src][id]["color"]];
						config[mapping[src]][id]["server"] =
							AvailableConfigs.servers[
							                  this.state[src][id]["server"]];
					}
				}
			}
			// Set outgoingEdges to nodes
			for (var nodeId in config.nodeTypes) {
				var outgoingEdges = [ ];
				for (var edgeId in config.edgeTypes) {
					if (config.edgeTypes[edgeId].fromType == nodeId) {
						outgoingEdges[edgeId] = config.edgeTypes[edgeId];
					}
				}
				config.nodeTypes[nodeId].outgoingEdges = outgoingEdges;
			}
			return config;
		},
		
		/**
		 * Add a node specified by its id to state.node, but only if it does
		 * not exists already.
		 * 
		 * @param id of the node
		 */
		addNode : function(id) {
			for (var i in this.state.nodes) {
				if (id == i) {
					return;
				}
			}
			this.state.nodes[id] = {
				name: AvailableConfigs.nodeTypes[id].name,
				style: AvailableConfigs.nodeTypes[id].defaultStyle,
				server: AvailableConfigs.nodeTypes[id].defaultServer,
				color: CoreConfig.defaultNodeColor,
				displayed: false
			};
		},
		
		/**
		 * Add an edge specified by its id to state.edge.
		 * 
		 * @param id of the edge
		 */
		addEdge : function(id) {
			this.state.edges[id] = {
				name: AvailableConfigs.edgeTypes[id].name,
				style: AvailableConfigs.edgeTypes[id].defaultStyle,
				server: AvailableConfigs.edgeTypes[id].defaultServer,
				color: CoreConfig.defaultEdgeColor,
				displayed: false
			};
		},
		
		/**
		 * Make the state variable consistent and update the UI. This method
		 * is usually called when the set of used relations is changed and
		 * state.relation is already updated.
		 */
		consistentState : function() {
			// Set false to all appearance of displayed
			for (var i in this.state.edges) {
				this.state.edges[i].displayed = false;
			}
			for (var i in this.state.nodes) {
				this.state.nodes[i].displayed = false;
			}
			// Select useful edges and nodes
			for (var i in this.state.relations) {
				var rel = this.state.relations[i];
				this.state.edges[rel].displayed = true;
				this.state.nodes[AvailableConfigs.edgeTypes[rel].fromType]
				                 .displayed = true;
				this.state.nodes[AvailableConfigs.edgeTypes[rel].toType]
				                 .displayed = true;
			}
			
			// Refresh node and edge config panels and set up startNodeType -
			// Selectbox
			var html = '';
			for (var i in this.state.edges) {
				if (this.state.edges[i].displayed) {
					html += this.createEdgeListElement(i,
								this.state.edges[i]);
				}
			}
			$("ul#config-edges-list").html(html);
			html = '';
			var newStartNodeType = false;
			var displayedNodes = { };
			for (var i in this.state.nodes) {
				if (this.state.nodes[i].displayed) {
					// Set start node type to an optimal value
					if (!newStartNodeType || i == this.state.startNodeType) {
						newStartNodeType = i;
					}
					displayedNodes[i] = this.state.nodes[i]; 
					// Expand configuration panel
					html += this.createNodeListElement(i,
								this.state.nodes[i]);
				}
			}
			$("ul#config-nodes-list").html(html);
			this.state.startNodeType = newStartNodeType;
			$("#start-node-type-holder").html(this.createSelectBox(
					"start-node-type", displayedNodes, newStartNodeType));
			$("select#start-node-type").change(function() {
				Configurators.panel.state.startNodeType = $(this).val();
			});
			
			// Registrate eventhandler of new input- and select-elements
			$("ul#config-nodes-list input, ul#config-nodes-list select,"
			 + "ul#config-edges-list input, ul#config-edges-list select")
			 .change(function() {
				 // Update Configurators.panel.state
				 var params = $(this).attr("id").split('-');
				 Configurators.panel.state
				 	[params[2]][params[4]][params[3]] = $(this).val();
			});
		},
		
		/**
		 * Returns the html source of a control element which is used to
		 * configure the graph element node. We assume this elements
		 * are inside of an ul-tag.
		 * 
		 * @param id of the element (necessary to set html-ids)
		 * @param el graph element which should be used
		 * @return html code
		 */
		createNodeListElement : function(id, el) {
			var html = '<li><em>' + el.name + "</em> is displayed as "
				+ this.createSelectBox("config-panel-nodes-color-" + id,
					AvailableConfigs.colors, el.color) + " "
				+ this.createSelectBox("config-panel-nodes-style-" + id,
					AvailableConfigs.nodeStyles, el.style);
			if (AvailableConfigs.nodeTypes[id].contentLoader 
					!= ContentLoaders.none) {
				html += " and loaded from "
				+ this.createSelectBox("config-panel-nodes-server-" + id,
					AvailableConfigs.servers, el.server);
			}
			return html + ".</li>";
		},
		
		/**
		 * Returns the html source of a control element which is used to
		 * configure the graph element edge. We assume this elements
		 * are inside of an ul-tag.
		 * 
		 * @param id of the element (necessary to set html-ids)
		 * @param el graph element which should be used
		 * @return html code
		 */
		createEdgeListElement : function(id, el) {
			var html = '<li><em>' + el.name + "</em> is displayed as "
				+ this.createSelectBox("config-panel-edges-color-" + id,
					AvailableConfigs.colors, el.color) + " "
				+ this.createSelectBox("config-panel-edges-style-" + id,
					AvailableConfigs.edgeStyles, el.style);
			if (AvailableConfigs.edgeTypes[id].contentLoader 
					!= ContentLoaders.none) {
				html += " and loaded from "
				+ this.createSelectBox("config-panel-edges-server-" + id,
					AvailableConfigs.servers, el.server);
			}
			return html + ".</li>";
		},
		
		/**
		 * Returns the html source of a select box.
		 * 
		 * @param id of the selectbox
		 * @param data an array with keys which are used for the values
		 * @param sel set this to specify the selected entry
		 * @return html code
		 */
		createSelectBox : function(id, data, sel) {
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
		}
	}
};