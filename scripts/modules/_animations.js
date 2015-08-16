/* global
 El,
 UI,
 is
 */

var Anim = (function() {

	var slideFromLeft = function() {
		var show = UI.classes.showView;
		UI.el.mainView.addClass(show);
		UI.el.detailView.removeClass(show);
		UI.setCurrentView(UI.View.MAIN);
	};

	var slideFromRight = function() {
		var show = UI.classes.showView;
		UI.el.mainView.removeClass(show);
		UI.el.detailView.addClass(show);
		UI.setCurrentView(UI.View.COMMENTS);
	};

	var reveal = function(el) {
		var reveal = "anim-reveal";
		if (is.desktop) {
			el.addClass(reveal);
			setTimeout(function() {
				el.removeClass(reveal);
			}, 700);
		} else {
			setTimeout(function() {
				el.removeClass(UI.classes.invisible).addClass(reveal);
			}, 0);
		}
	};

	var shake = function(el) {
		var shake = "anim-shake";
		el.addClass(shake);
		setTimeout(function() {
			el.removeClass(shake);
		}, 350);
	};

	var shakeForm = function() {
		shake($(".new-form"));
	};

	var bounceOut = function(el, callback) {
		var bounceOut = "anim-bounce-out";
		el.addClass(bounceOut);
		if (callback) {
			setTimeout(callback, 1000);
		}
	};

	var bounceInDown = function(el) {
		el.addClass("anim-bounceInDown");
		setTimeout(function() {
			el[0].style.opacity = 1;
			el.removeClass("anim-bounceInDown");
		}, 500);
	};

	// Exports
	return {
		slideFromLeft,
		slideFromRight,
		reveal,
		shake,
		shakeForm,
		bounceOut,
		bounceInDown
	};

})();
