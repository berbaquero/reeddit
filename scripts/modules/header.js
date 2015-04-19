/* global
 $,
 is,
 tappable,
 Menu,
 Posts,
 UI
 */

var Header = (function() {

	let el = {
		subtitle: $('#main-title'),
		subtitleText: $('#sub-title'),
		centerSection: $('#title-head'),
		postTitle: $('#title'),
		icon: $('#header-icon'),
		btnNavBack: $('#nav-back')
	};

	var initListeners = function() {

		tappable(".btn-to-main", {
			onTap: function() {
				location.hash = "#";
			}
		});

		tappable("#sub-title", {
			onTap: function() {
				if (is.mobile && Posts.areLoading()) {
					return;
				}
				Menu.move(Menu.isShowing() ? UI.Move.LEFT : UI.Move.RIGHT);
			}
		});
	};

	// Exports
	return {
		el: el,
		initListeners: initListeners
	};

})();
