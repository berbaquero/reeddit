(function() {
	'use strict';

	// Imports
	/* global C */

	var el = {
		main: $('.js-sort-switch-main'),
		wrap: $('.js-sort-switch-wrap')
	};

	var classes = {
		new: 'sort-switch--new'
	};

	// Initial State
	var isHot = true;

	el.main.click(function() {
		isHot = !isHot;
		C.Sorting.change(isHot ? 'hot' : 'new');
		if (isHot) {
			el.main.removeClass(classes.new);
		} else {
			el.main.addClass(classes.new);
		}
	});

})();
