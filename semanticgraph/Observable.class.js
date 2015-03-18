/**
 * For all the doc see java.util.Observable in the official java api.
 * 
 * @author Felix Stahlberg
 */
function Observable() {
	
	/*
	 * Array of observers
	 */
	var observers = [ ];
	
	/*
	 * Indicates whether the object has changed
	 */
	var changed = false;
	
	/*
	 * Get the index of the given observer (-1 if it not exists)
	 */
	var getIndex = function(o) {
		for (var i = 0; i < observers.length; i++) {
			if (observers[i] == o) {
				return i;
			}
		}
		return -1;
	};
		
	
	/**
	 * @param o an observer to be added (should have implement anz
	 * 			update(arg) method.
	 * @see Observer
	 */
	this.addObserver = function(o) {
		if (-1 != getIndex(o)) {
			return false;
		}
		observers.push(o);
		return true;
	};
	
	/**
	 * @param o an observer to be added
	 * @see Observer
	 */
	this.deleteObserver = function(o) {
		var index = getIndex(o);
		if (-1 == index) {
			return false;
		}
		observers.splice(index, 1);
		return true;
	};
	
	/**
	 * @param arg any object passed through to the observers update methods
	 */
	this.notifyObservers = function(arg) {
		if (!this.hasChanged()) {
			return false;
		}
		for (var i in observers) {
			observers[i].update(this, arg);
		}
		this.clearChanged();
		return true;
	};
	
	this.setChanged = function() {
		changed = true;
	};
	
	this.clearChanged = function() {
		changed = false;
	};
	
	this.hasChanged = function() {
		return changed;
	};
}