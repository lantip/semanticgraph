/**
 * This class is the processor of the AugmentationScheduler. It handles the
 * ajax requests and interpret the incoming data. This class is observed by the
 * controller which is notified whenever a augementation is done.
 */
var Aug = false;
function Augmenter() {
	
	var query = Config.prefix
	 +  "SELECT DISTINCT ?p ?o WHERE { <%s> ?p ?o . "
	 + "} ORDER BY ?o LIMIT %d OFFSET %d";
	
	var model = false;
	
	/**
	 * Initalizations
	 */
	this.init = function(m) {
		model = m;
		Aug = this;
	};
	
	/**
	 * This method is called by the scheduler whenever a node should be processed
	 * 
	 * @param Node node node to be processed
	 * @param Function callback function
	 */
	this.process = function(node, callbackFunction) {
		var req = node.data.server.req;
		req[node.data.server.reqQueryField] = String.sprintf(query,
				node.id, Config.augmentSteps, node.data.augmentOffset);
		node.data.augmentOffset+= Config.augmentSteps;
		$.getJSON(node.data.server.uri,
			req,
			function(data) {
				if (data && data.results && data.results.bindings) {
					Aug.processCallback(node, data.results.bindings, callbackFunction);
				} else {
					callbackFunction(node);
				}
			});
	};
	
	/**
	 * Callback function for ajax requests done in process()
	 * 
	 * @param node Node which is getting augmented
	 * @param Object data data from the server
	 * @param Function callbackFunction which is called after when we are done. 
	 */
	this.processCallback = function(node, data, callbackFunction) {
		node.data.completed = (data.length < Config.augmentSteps);
		// Evaluating
		for (var i in data) {
			var binding = data[i];
			if (Config.sameAsPredicate[binding.p.value]) {
				model.addNode(node, binding.o.value);
			} else if (Config.nodeNamePredicate[binding.p.value]) {
				node.data.name = Config.nodeNamePredicate[binding.p.value](
						binding.o.value);
				node.name = Formatters.shorten(node.data.name);
				this.setChanged();
				this.notifyObservers({
					"type": "nodeNameUpdate",
					"arg": node
				});
			} else if (Config.nodeTypePredicate[binding.p.value]) {
				node.data.type = Config.nodeTypePredicate[binding.p.value](
						binding.o.value);
				this.setChanged();
				this.notifyObservers({
					"type": "nodeTypeUpdate",
					"arg": node
				});
			}
			// Heuristic: set up objects from type uri as nodes
			else if (binding.o.type == "uri") {
				node.data.children.push({
					node : model.createNode(
						binding.o.value,
						Formatters.uri(binding.o.value)),
					type : binding.p.value
				});
			} else { // Otherwise it seemed to be a node attribute
				node.data.attrs.push(binding);
			}
		}
		updateChildrenArray(node);
		
		this.setChanged();
		this.notifyObservers({
			"type": "augmentNode",
			"arg": node
		});
		callbackFunction(node);
	};
	
}

Augmenter.prototype = new Observable;