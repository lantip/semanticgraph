/**
 * This file contains the sole main runner method which kicks off all the
 * initalization stuff.
 * 
 * @author Felix Stahlberg
 */

$(document).ready(function() {
	// Register event handler
	$("input#reload-button").click(function() {
		HypertreeController.loadConfig();
	});
	
	// Resize html elements depending on the window size.
	var size = getWindowSize();
	$("div#left-col").height(size[1] - 69);
	$("div#infovis").height(size[1] - 35).width(size[0] - 250);
	
	// Initalization tasks for certain components
	CoreConfig.configurator.init();
	HypertreeController.init();
});