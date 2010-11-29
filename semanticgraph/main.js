/**
 * This file contains the sole main runner method which kicks off all the
 * initalization stuff.
 * 
 * @author Felix Stahlberg
 */

$(document).ready(function() {
	// Resize html elements depending on the window size.
	var size = getWindowSize();
	$("div#left-col").height(size[1] - 69);
	$("div#infovis").height(size[1] - 35).width(size[0] - 280);
	
	var semanticGraph = new SemanticGraph("infovis", "inner-details",
			"config-panel");
	semanticGraph.init();
	
	$("input#reload-button").click(function() {
		semanticGraph.reload();
	});
	
	$("#config-panel-header").click(function() {
		$("#config-panel").slideToggle("fast");
	});
});