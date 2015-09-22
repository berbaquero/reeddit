/* global
 Menu,
 Anim,
 is,
 UI
 */

var Modal = (function() {

	let showing = false;

	const setShowing = (shown) => {
		showing = shown;
	};

	const isShowing = () => showing;

	var show = function(template, callback, config) {
		var delay = 1;
		if (!is.largeScreen && Menu.isShowing()) {
			Menu.move(UI.Move.LEFT);
			delay = 301;
		}
		setTimeout(function() {
			if (isShowing()) {
				return;
			}
			var modal = $('<div/>').attr({id: 'modal', tabindex: '0', class: 'modal'}),
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
			modal.focus();
			switchKeyListener(true);
			setShowing(true);
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
		setShowing(false);
		setTimeout(function() {
			modal.remove();
			switchKeyListener(false);
		}, 301);
	};

	var showImageViewer = function(imageURL) {
		var imageViewer = '<img class="image-viewer centered-transform" src="' + imageURL + '">',
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
		initListeners: initListeners,
		isShowing: isShowing
	};

})();
