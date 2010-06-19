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
	 * Returns a null-string unconditionally.
	 * 
	 * @param str the string to format (not used)
	 * @return ""
	 */
	none : function (str) {
		return "";
	}
};