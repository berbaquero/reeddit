(function() {
	'use strict';

	// Imports
	/* global C, tappable, loadingLinks */

	var classes = {
		new: 'sort-switch--new'
	};

	// Initial State
	var isHot = true;

	tappable('.js-sort-switch-main', {
		onTap: function(ev, target) {
			if (loadingLinks) {
				return;
			}
			isHot = !isHot;
			C.Sorting.change(isHot ? 'hot' : 'new');
			if (isHot) {
				target.classList.remove(classes.new);
			} else {
				target.classList.add(classes.new);
			}
		}
	});

})();
