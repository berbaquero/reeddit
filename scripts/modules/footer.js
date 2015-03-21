/* global
 $,
 UI
 */

var Footer = (function() {

	var refreshButton = '';

	const noLink = "No Post Selected";

	var el = {
		detail: $('#detail-footer'),
		postTitle: $('#footer-post'),
		subTitle: $('#footer-sub'),

		getRefreshButton: function() {
			if (!refreshButton) {
				refreshButton = document.querySelector('#main-footer .footer-refresh');
			}
			return refreshButton;
		}
	};

	var setPostTitle = function(title) {
		el.postTitle.text(title ? title : noLink);
		var buttons = el.detail.find('.btn-footer');
		if (title) {
			buttons.removeClass(UI.classes.hide);
		} else {
			buttons.addClass(UI.classes.hide);
		}
	};

	// Exports
	return {
		el: el,
		setPostTitle: setPostTitle
	};

})();
