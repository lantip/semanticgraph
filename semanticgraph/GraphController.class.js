/**
 * This is the controller of the MVC pattern, which handles logical elements
 * like node augmentation, content loading and graph generation.
 */
function GraphController() {
	
	var model = false;
	var view = false;
	var scheduler = false;
	
	/*
	 * Node which is currently getting augmented and should be centered as soon
	 * as possible.
	 */
	var centerNodeInSpe = false;
	
	/*
	 * Callback function which should be called when this node actually
	 * becomes centered
	 */
	var centerNodeCallbackInSpe = false;

	/**
	 * Initalizations
	 */
	this.init = function(m, v) {
		model = m;
		view = v;
		model.addObserver(this);
		view.addObserver(this);
		scheduler = new AugmentationScheduler();
		var augmenter = new Augmenter();
		augmenter.init(m);
		scheduler.init(augmenter, m);
		augmenter.addObserver(this);
		augmenter.addObserver(view);
	};
	
	/*
	 * Handle centerNodeInSpe if it has Config.desiredChildren children or is
	 * completed.
	 * 
	 * @return bool TRUE if centerNodeInSpe meets the requirements and was handled
	 *  			FALSE otherwise
	 */
	var handleCenterNodeInSpe = function() {
		if (!centerNodeInSpe.data.completed
			&& centerNodeInSpe.data.children.length < Config.desiredChildren) {
			return false;
		}
		// Finally center this node
		model.setCenterNode(centerNodeInSpe);
		if (centerNodeCallbackInSpe) {
			centerNodeCallbackInSpe.onComplete(centerNodeInSpe.id,
					centerNodeInSpe);
		}
		centerNodeInSpe = false;
		centerNodeCallbackInSpe = false;
		return true;
	};
	
	/**
	 * See java.util.Observer.update() in the official java api.
	 * 
	 * @param o
	 *            the observable object
	 * @param arg
	 *            an argument passed to the notifyObservers method
	 * @see Observable
	 */
	this.update = function(o, arg) {
		switch (arg.type) {
		case "request": // GraphView reports an request
			centerNodeInSpe = model.getNode(arg.arg.nodeId);
			centerNodeCallbackInSpe = arg.arg.callbackFunction;
			scheduler.addCenteredNode(centerNodeInSpe);
			handleCenterNodeInSpe();
			break;
		case 'augmentNode': // Augmenter augmented a node
			if (arg.arg == centerNodeInSpe) {
				handleCenterNodeInSpe();
			}
			break;
		case 'nodeTypeUpdate': // Augmenter set a node type
			// Check if there is a new node type now
			if (!model.getNodeLayout(arg.arg.data.type)) {
				model.setNodeLayout(arg.arg.data.type, Config.defaultNodeLayout);
			}
			break;
		case 'nodeLayout': // Rebuild config panel
			view.rebuildConfigPanel(model.getNodeLayouts());
			break;
		}
	};
}
