/* global
 $,
 $$,
 El,
 Anim,
 Footer,
 Header,
 Store,
 Menu,
 Modal,
 Posts,
 Comments,
 is,
 wideScreenBP,
 largeScreenBP
 */

var UI = (function() {

	const Move = {
		LEFT: 1,
		RIGHT: 2
	};

	const View = {
		MAIN: 1,
		COMMENTS: 2
	};

	const classes = { // css
		showView: "show-view",
		showMenu: "show-menu",
		mnml: "mnml",
		hide: "hide",
		swipe: 'from-swipe',
		invisible: 'invisible'
	};

	const keyCode = {
		MENU: 49, // 1
		MAIN: 50, // 2
		DETAIL: 51 // 3
	};

	const template = {
		loader: "<div class='loader'></div>",
		closeModalButton: "<a href='#close' class='close-form no-ndrln txt-cntr txt-bld'>&times;</a>"
	};

	const el = {
		body: $('body'),
		mainWrap: $('#main-wrap'),
		detailWrap: $('#detail-wrap'),
		mainView: $('.main-view'),
		detailView: $('.detail-view')
	};

	var currentView = View.MAIN;

	var getCurrentView = () => currentView;

	var setCurrentView = function(view) {
		currentView = view;
	};

	var setSubTitle = function(title) {
		Header.el.subtitleText.text(title);
		Footer.el.subTitle.text(title);
	};

	var backToMainView = function() {
		Header.el.btnNavBack
			.addClass(classes.invisible);
		Header.el.subtitle
			.removeClass(classes.invisible);
		Header.el.centerSection
			.empty()
			.append(Header.el.icon);
		Anim.slideFromLeft();
	};

	var switchDisplay = function(el, visible) {
		if (visible) {
			el.classList.add(classes.hide);
		} else {
			el.classList.remove(classes.hide);
		}
	};

	var addLoader = function(elem) {
		var loader = $("<div/>").addClass("loader");
		elem.append(loader);
		return loader;
	};

	var scrollFixLinks = function() {
		// Make links section always scrollable / Necessary when using the other Sorting options.
		var totalHeight = 0;
		// Calculate the total of link wrappers height
		var wraps = document.querySelectorAll('.link-wrap');
		for(var w = 0; w < wraps.length; w++) {
			totalHeight += wraps[w].offsetHeight;
		}
		// Get each element's static section height
		var containerHeight = document.body.offsetHeight,
			headerHeight = $$.q('header').offsetHeight,
			message = $$.q('.loader'),
			messageHeight = message ? message.offsetHeight : 0;

		var minHeight = containerHeight - headerHeight - messageHeight;

		if (totalHeight > minHeight) {
			$("#main-overflow").css('min-height', '');
		} else {
			$("#main-overflow").css('min-height', minHeight - totalHeight + 1);
		}
	};

	var supportOrientation = typeof window.orientation !== 'undefined';

	var getScrollTop = function() {
		return window.pageYOffset || document.compatMode === 'CSS1Compat' && document.documentElement.scrollTop || document.body.scrollTop || 0;
	};

	var scrollTop = function() {
		if (!supportOrientation) {
			return;
		}
		document.body.style.height = screen.height + 'px';
		setTimeout(function() {
			window.scrollTo(0, 1);
			var top = getScrollTop();
			window.scrollTo(0, top === 1 ? 0 : 1);
			document.body.style.height = window.innerHeight + 'px';
		}, 1);
	};

	var iPadScrollFix = function() {
		// This slight height change makes the menu container 'overflowy', to allow scrolling again on iPad - weird bug
		var nextHeight = '36px' === $('.menu-desc').css('height') ? '35px' : '36px';
		setTimeout(function() {
			$('.menu-desc').css('height', nextHeight);
		}, 500);
	};

	var initListeners = function() {

		// Show option to reload app after update
		if (window.applicationCache) {
			window.applicationCache.addEventListener("updateready", function() {
				var delay = 1;
				if (Menu.isShowing()) {
					Menu.move(Move.LEFT);
					delay = 301;
				}
				setTimeout(function() {
					el.mainWrap.prepend("<button class='btn blck mrgn-cntr-x mrgn-y' id='btn-update' onclick='window.location.reload();'>Reeddit updated. Press to reload</button>");
				}, delay);

			}, false);
		}

		// Do stuff after finishing resizing the windows
		window.addEventListener("resizeend", function() {
			is.wideScreen = wideScreenBP.matches;
			is.largeScreen = largeScreenBP.matches;
			scrollTop();
			if (is.largeScreen && Menu.isShowing()) {
				Menu.move(Move.LEFT);
			}
			if (is.iPad) {
				iPadScrollFix();
			}
		}, false);

		if (is.iPhone && is.iOS7) {
			var hasSwiped = false;
			document.addEventListener('touchstart', function(ev) {
				var touchX = ev.targetTouches[0].clientX;
				hasSwiped = (touchX < 20 || touchX > window.innerWidth - 20);
			});
			document.addEventListener('touchend', function() {
				hasSwiped = false;
			});
		}

		// Pseudo-hash-router
		window.addEventListener('hashchange', function() {
			if (is.iPhone && is.iOS7) {
				// Switch `transition-duration` class,
				// to stop animation when swiping
				if (hasSwiped) {
					el.mainView.addClass(classes.swipe);
					el.detailView.addClass(classes.swipe);
					Header.el.btnNavBack.addClass(classes.swipe);
					Header.el.subtitle.addClass(classes.swipe);
				} else {
					el.mainView.removeClass(classes.swipe);
					el.detailView.removeClass(classes.swipe);
					Header.el.btnNavBack.removeClass(classes.swipe);
					Header.el.subtitle.removeClass(classes.swipe);
				}
				hasSwiped = false;
			}
			// Handle Hash Changes
			if (location.hash === "") { // To Main View
				backToMainView();
				Posts.clearSelected();
				Footer.setPostTitle();
				setTimeout(function() {
					el.detailWrap.empty();
				}, is.wideScreen ? 1 : 301);
			} else { // To Comment View
				Comments.navigateFromHash();
			}
		}, false);

		// Presses

		UI.el.body.on('click', '.js-btn-refresh', function(ev) {
			ev.preventDefault();
			var origin = this.dataset.origin;
			switch(origin) {
				case 'footer-main':
					Posts.refreshStream();
					break;
				case 'footer-detail':
					if (!Comments.getCurrentThread()) {
						return;
					}
					Comments.show(Comments.getCurrentThread(), true);
					break;
				default:
					if (currentView === View.COMMENTS) {
						if (!Comments.getCurrentThread()) {
							return;
						}
						Comments.show(Comments.getCurrentThread(), true);
					}
					if (currentView === View.MAIN) {
						Posts.refreshStream();
					}
			}
		});

		el.body.on('click', '.close-form', (ev) => {
			ev.preventDefault();
			Modal.remove();
		});

		// Swipes
		if (is.mobile) {
			if (!(is.iPhone && is.iOS7)) {
				el.detailView.swipeRight(function() {
					if (is.wideScreen) {
						return;
					}
					location.hash = "#";
				});
			}

			el.mainView.swipeRight(function() {
				if ((!is.desktop && Posts.areLoading()) || is.largeScreen) {
					return;
				}
				if (currentView === View.MAIN) {
					Menu.move(Move.RIGHT);
				}
			});

			el.mainView.swipeLeft(function() {
				if ((!is.desktop && Posts.areLoading()) || is.largeScreen) {
					return;
				}
				if (Menu.isShowing()) {
					Menu.move(Move.LEFT);
				}
			});

			el.mainView.on("swipeLeft", ".link", function() {
				if (is.wideScreen) {
					return;
				}
				if (!Menu.isShowing()) {
					var id = $(this).data("id");
					Comments.updateHash(id);
				}
			});
		}

		// Keys

		el.body.on('keydown', (ev) => {

			if (Modal.isShowing()) {
				return;
			}

			switch(ev.which) {
				case keyCode.MENU:
					if (!is.largeScreen) { // Mobile
						if (getCurrentView() === View.MAIN) {
							Menu.move(Move.RIGHT);
						} else {
							return;
						}
					}
					Menu.el.mainMenu.focus();
					break;
				case keyCode.MAIN:
					if (!is.largeScreen) { // Mobile
						if (getCurrentView() === View.MAIN) {
							Menu.move(Move.LEFT);
						} else {
							window.location.hash = '';
						}
					}
					el.mainWrap.focus();
					break;
				case keyCode.DETAIL:
					if (!is.largeScreen && getCurrentView() === View.MAIN) {
						return;
					}
					el.detailWrap.focus();
					break;
			}
		});
	};

	// Exports
	return {
		el: el,
		classes: classes,
		View: View,
		Move: Move,
		template: template,
		initListeners: initListeners,
		setCurrentView: setCurrentView,
		getCurrentView: getCurrentView,
		setSubTitle: setSubTitle,
		scrollTop: scrollTop,
		iPadScrollFix: iPadScrollFix,
		scrollFixLinks: scrollFixLinks,
		addLoader: addLoader,
		backToMainView: backToMainView,
		switchDisplay: switchDisplay
	};

})();
