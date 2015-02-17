/* global C, tappable, loadingLinks */

var SortSwitch = {

	// Initial State
	isHot: true,

	classes: {
		new: 'sort-switch--new'
	},

	wrap: '',

	getWrap: function() {
		if (!this.wrap) {
			this.wrap = document.getElementsByClassName('sorter-wrap')[0];
		}
		return this.wrap;
	}
};

tappable('.js-sort-switch-main', {
	onTap: function(ev, target) {
		if (loadingLinks) {
			return;
		}
		SortSwitch.isHot = !SortSwitch.isHot;
		C.Sorting.change(SortSwitch.isHot ? 'hot' : 'new');
		if (SortSwitch.isHot) {
			target.classList.remove(SortSwitch.classes.new);
		} else {
			target.classList.add(SortSwitch.classes.new);
		}
	}
});
