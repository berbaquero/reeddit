(function() {
	'use strict';

	// Imports
	/* global C */

	var el = {
		sorter: $('.js-sort-container')
	};

	var classes = {
		sorter: {
			hot: 'sorter--hot',
			new: 'sorter--new'
		}
	};

	var isHot = true;

	// Listeners
	el.sorter.click(function() {
		isHot = !isHot;
		// Update classnames accordingly
		el.sorter.addClass(isHot ? classes.sorter.hot : classes.sorter.new);
		el.sorter.removeClass(isHot ? classes.sorter.new : classes.sorter.hot);

		C.Sorting.change(isHot ? 'hot' : 'new');
	});

})();
