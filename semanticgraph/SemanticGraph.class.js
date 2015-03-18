/**
 * Represents the interface to semantic graph. Builds up the MVC architecture
 * and hides it from the outside point of view.
 */
function SemanticGraph(gPanel, iPanel, cPanel) {
	this.model = new GraphModel();
	this.view = new GraphView(gPanel, iPanel, cPanel);
	this.controller = new GraphController();
	
	/**
	 * Calls initalization functions of the current MVC instances.
	 */
	this.init = function() {
		this.model.init();
		this.controller.init(this.model, this.view);
		this.view.init(this.model);
	};
	
	/**
	 * Reload the view.
	 */
	this.reload = function() {
		this.view.reload();
	};
}