/**
 * Formatters are used to format string outputs on screen. They are referenced
 * by AvailableConfig fields to specify how to display strings related to
 * nodes or edges.
 * 
 * @author Felix Stahlberg
 */

var Formatters = {
	
	/**
	 * Simply returns the string itself.
	 * 
	 * @param str the string to format
	 * @return the exactly same string
	 */
	raw : function (str) {
		return str;
	},
	
	/**
	 * Extract most important substring from an URI (after last slash).
	 * 
	 * @param str the string to format
	 * @return the string cut of all characters before the last slash
	 */
	uri : function (str) {
		return trimURI(str);
	},
	
	/**
	 * Shorten a node name to fit in the box
	 * 
	 * @param str the string to shorten
	 * @return a string with at most Config.maxNodeNameLength characters
	 */
	shorten : function (str) {
		return (str.length < Config.maxNodeNameLength) ?
				str : (str.substr(0, Config.maxNodeNameLength - 2) + "..");
	},
	
	/**
	 * Returns a null-string unconditionally.
	 * 
	 * @param str the string to format (not used)
	 * @return ""
	 */
	none : function (str) {
		return "";
	}
};