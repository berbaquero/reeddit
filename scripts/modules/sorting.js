/* global
 Menu,
 Posts,
 UI
 */

var Sorting = (function() {

	var current = 'hot';

	var get = function() {
		return (current !== 'hot' ? (current + '/') : '');
	};

	var change = function(sorting) {
		current = sorting;
		var delay = 1;
		if (Menu.isShowing()) {
			Menu.move(UI.Move.LEFT);
			delay = 301;
		}
		setTimeout(function() {
			Posts.refreshStream();
		}, delay);
	};

	// Exports
	return {
		get: get,
		change: change
	};

})();
