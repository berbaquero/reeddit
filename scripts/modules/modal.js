/* global
 Menu,
 Anim,
 is,
 tappable,
 UI
 */

var Modal = (function() {

	var isShown = false;

	var show = function(template, callback, config) {
		var delay = 1;
		if (!is.largeScreen && Menu.isShowing()) {
			Menu.move(UI.Move.LEFT);
			delay = 301;
		}
		setTimeout(function() {
			if (isShown) {
				return;
			}
			var modal = $('<div/>').attr('id', 'modal'),
				bounce = true;
			if (config) {
				if (config.modalClass) {
					modal.addClass(config.modalClass);
				}
				if (config.noBounce) {
					bounce = false;
				}
			}
			modal.append(template);
			UI.el.body.append(modal);
			switchKeyListener(true);
			isShown = true;
			setTimeout(function() {
				modal.css('opacity', 1);
				if (bounce) {
					Anim.bounceInDown($(".new-form"));
				}
			}, 1);
			if (callback) {
				callback();
			}
		}, delay);
	};

	var remove = function() {
		var modal = $('#modal');
		modal.css('opacity', '');
		isShown = false;
		setTimeout(function() {
			modal.remove();
			switchKeyListener(false);
		}, 301);
	};

	var showImageViewer = function(imageURL) {
		var imageViewer = '<img class="image-viewer" src="' + imageURL + '">',
			config = {
				modalClass: 'modal--closable',
				noBounce: true
			};
		Modal.show(imageViewer, false, config);
	};

	const handleKeyPress = (ev) => {
		if (ev.which === 27) {
			remove();
		}
	};

	const switchKeyListener = (flag) => {
		if (flag) {
			UI.el.body.on('keydown', handleKeyPress);
		} else {
			UI.el.body.off('keydown', handleKeyPress);
		}
	};

	var initListeners = function() {
		UI.el.body.on('click', '.modal--closable', Modal.remove);
	};

	// Exports
	return {
		show: show,
		remove: remove,
		showImageViewer: showImageViewer,
		initListeners: initListeners
	};

})();
