/* global
 Sorting,
 Posts,
 */

var SortSwitch = (function() {

	// Initial State
	var isHot = true;

	var classes = {
		'new': 'sort-switch--new'
	};

	var wrap = '';

	var el = {
		getWrap: function() {
			if (!wrap) {
				wrap = document.getElementsByClassName('sorter-wrap')[0];
			}
			return wrap;
		},
		mainSwitch: $('.js-sort-switch-main')
	};

	const initListeners = function() {
		el.mainSwitch.on('click', function(ev) {
			ev.preventDefault();
			const target = this;
			if (Posts.areLoading()) {
				return;
			}
			isHot = !isHot;
			Sorting.change(isHot ? 'hot' : 'new');
			if (isHot) {
				target.classList.remove(classes.new);
			} else {
				target.classList.add(classes.new);
			}
		});
	};

	// Exports
	return {
		el: el,
		initListeners: initListeners
	};

})();
