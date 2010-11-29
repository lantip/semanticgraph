/**
 * This is to schedule the augmentation process. It uses a modified LIFO
 * scheduling strategy since the last incomming requests are always most
 * important and starvation is not critical.
 * Consider following definitions:
 * node n is 'centered' :<=> n is centered, but not 'explored'
 * node n is 'satisfied' :<=> n has at least Config.desiredChildren
 * 							  children or all children are explored.
 * node n is 'explored' :<=> n is 'satisfied' and has at least Config.desiredAttributes
 * 							 attributes or all attributes are explored.
 * node n is 'completed' <=> all children and attributes are explored
 * The scheduler has four queues:
 * 	queue 'centered': length: 1. All centered node.
 * 	queue 'unsatisfied': All nodes not satisfied and not in 'centered'
 *  queue 'unexplored': All nodes not explored and not in 'unsatisfied'
 *  queue 'uncompleted': All nodes not completed and not in 'unexplored'
 * If a node do not meet the requirements for a queue anymore, it is added to 
 * the underlying queue. The scheduler always process the latest job in the
 * highest not empty queue.
 */
var augScheduler = false;
function AugmentationScheduler() {
	/*
	 * Queues
	 */
	var queues = [
	        [], // centered
			[], // unsatisfied
			[], // unexplored
			[] // uncompleted
	];

	/*
	 * Augmentation intervals for the queues
	 */
	var augmentIntervals = [
	        0, // centered
			500, // unsatisfied
			4000, // unexplored
			6000, // uncompleted
			1000 // idle
	];
	
	/*
	 * Current sequence number (used for timeout identifying).
	 */
	var seqNumber = 0;
	
	/*
	 * Range for sequence numbers.
	 */
	var seqMod = augmentIntervals[4];
	
	/*
	 * The processor processes the nodes offered by the scheduler. Have to 
	 * implement the method process(obj, callback). Is set by init() 
	 */
	var processor = false;
	
	/**
	 * Initalize the scheduler.
	 */
	this.init = function(target, model) {
		augScheduler = this;
		processor = target;
		model.addObserver(this);
		this.timeoutProcessing();
	};
	
	/**
	 * Add a node to the centered queue. If there is already a node in this
	 * queue, put it in 'unsatisfied'.
	 * 
	 * @param node node to be added
	 */
	this.addCenteredNode = function(node) {
		if (queues[0].length) {
			queues[1].push(queues[0].pop());
		}
		queues[0].push(node);
		this.timeoutProcessing();
	};
	
	/**
	 * Add a node to the 'unsatisfied' queue. Please note that there are no
	 * limitations how often and to how many queues a node is assigned.
	 * 
	 * @param node node to be added
	 */
	this.addNode = function(node) {
		queues[1].push(node);
	};
	
	/**
	 * Process the latest node in getCurrentQueue() queue.
	 */
	this.processQueue = function(mySeqNumber) {
		if (mySeqNumber != seqNumber) { // other timeoutProcessing call occurred in meantime
			return;
		}
		var queue = 0;
		do {
			queue = getCurrentQueue();
			if (queue >= queues.length) {
				this.timeoutProcessing();
				return;
			}
			var node = queues[queue].pop();
			var rightQueue = false; // Identifies if the node is in the right queue
			if (!node.data.completed) {
				switch (queue) {
				case 0: // centered
					rightQueue = 
						   node.data.attrs.length <= Config.desiredAttributes
						|| node.data.children.length <= Config.desiredChildren;
					break;
				case 1: // unsatisfied
					rightQueue = 
						node.data.children.length <= Config.desiredChildren;
					break;
				case 2: // unexplored
					rightQueue = 
						node.data.attrs.length <= Config.desiredAttributes;
					break;
				case 3: // uncompleted
					rightQueue = true;
				}
				if (!rightQueue) {
					queues[queue + 1].push(node);
				}
			}
		} while (!rightQueue);
		queues[queue].push(node);
		node.data.seqNumber = mySeqNumber; 
		Log.write("Augmenting " + Formatters.uri(node.id));
		processor.process(node, this.timeoutProcessing);
	};
	
	/*
	 * Set timeout for the next queue processing.
	 * 
	 * @param if you use this, the function will check the sequence number of
	 * 			the nodeand process only if it meets seqNumber
	 */
	this.timeoutProcessing = function(node) {
		if (node && node.data && node.data.seqNumber != seqNumber) {
			return;
		}
		Log.write("Finished Augmentation");
		seqNumber = (seqNumber + 1) % seqMod;
		window.setTimeout("augScheduler.processQueue(" + seqNumber + ")", 
				augmentIntervals[getCurrentQueue()]);
	};
	
	/*
	 * Get the current highest non empty queue. return 4 if there is no non
	 * empty queue.
	 */
	var getCurrentQueue = function() {
		for (var i = 0; i < 4; i++) {
			if (queues[i].length) {
				return i;
			}
		}
		return 4;
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
		case "addNode": // A node was added in GraphModel
			this.addNode(arg.arg);
			break;
		}
	};
};
