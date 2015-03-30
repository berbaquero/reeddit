(function() {
'use strict';
/* global
 El,
 UI,
 is
 */

var Anim = (function () {

	var slideFromLeft = function slideFromLeft() {
		var show = UI.classes.showView;
		UI.el.mainView.addClass(show);
		UI.el.detailView.removeClass(show);
		UI.setCurrentView(UI.View.MAIN);
	};

	var slideFromRight = function slideFromRight() {
		var show = UI.classes.showView;
		UI.el.mainView.removeClass(show);
		UI.el.detailView.addClass(show);
		UI.setCurrentView(UI.View.COMMENTS);
	};

	var reveal = (function (_reveal) {
		var _revealWrapper = function reveal(_x) {
			return _reveal.apply(this, arguments);
		};

		_revealWrapper.toString = function () {
			return _reveal.toString();
		};

		return _revealWrapper;
	})(function (el) {
		var reveal = "anim-reveal";
		if (is.desktop) {
			el.addClass(reveal);
			setTimeout(function () {
				el.removeClass(reveal);
			}, 700);
		} else {
			setTimeout(function () {
				el.removeClass("invisible").addClass(reveal);
			}, 0);
		}
	});

	var shake = (function (_shake) {
		var _shakeWrapper = function shake(_x) {
			return _shake.apply(this, arguments);
		};

		_shakeWrapper.toString = function () {
			return _shake.toString();
		};

		return _shakeWrapper;
	})(function (el) {
		var shake = "anim-shake";
		el.addClass(shake);
		setTimeout(function () {
			el.removeClass(shake);
		}, 350);
	});

	var shakeForm = function shakeForm() {
		shake($(".new-form"));
	};

	var bounceOut = (function (_bounceOut) {
		var _bounceOutWrapper = function bounceOut(_x, _x2) {
			return _bounceOut.apply(this, arguments);
		};

		_bounceOutWrapper.toString = function () {
			return _bounceOut.toString();
		};

		return _bounceOutWrapper;
	})(function (el, callback) {
		var bounceOut = "anim-bounce-out";
		el.addClass(bounceOut);
		if (callback) {
			setTimeout(callback, 1000);
		}
	});

	var bounceInDown = function bounceInDown(el) {
		el.addClass("anim-bounceInDown");
		setTimeout(function () {
			el[0].style.opacity = 1;
			el.removeClass("anim-bounceInDown");
		}, 500);
	};

	// Exports
	return {
		slideFromLeft: slideFromLeft,
		slideFromRight: slideFromRight,
		reveal: reveal,
		shake: shake,
		shakeForm: shakeForm,
		bounceOut: bounceOut,
		bounceInDown: bounceInDown
	};
})();

/* global
 $,
 $$,
 Modal,
 Dropbox,
 tappable,
 Store
 */

var Backup = (function () {

	var update = 1,
	    gists = {
		url: "https://api.github.com/gists",
		fileURL: ""
	};

	var template = {
		exportData: "<div class='new-form move-data'><div class='close-form'>&times;</div><div class='move-data-exp'><h3>Export Data</h3><p>You can back-up your local subscriptions and then import them to any other Reeddit instance, or just restore them.</p><div class='btn-general' id='btn-save-dbx'>Save to Dropbox</div></div></div>",
		importData: "<div class='new-form move-data'><div class='close-form'>&times;</div><div class='move-data-imp'><h3>Import Data</h3><p>Load the subscriptions from another Reeddit instance.</p><p>Once you choose the reeddit data file, Reeddit will refresh with the imported data.</p><div class='btn-general' id='btn-dbx-imp'>Import from Dropbox</div></div></div>"
	};

	var shouldUpdate = function shouldUpdate() {
		update = 1;
	};

	var createBackup = function createBackup() {
		if (update) {
			Modal.show(template.exportData, function () {
				var files = {},
				    content = "{\"channels\": " + Store.getItem("channels") + ", \"subreddits\": " + Store.getItem("subreeddits") + "}";

				files["reedditdata.json"] = {
					content: content
				};

				$.ajax({
					url: gists.url,
					type: "POST",
					data: JSON.stringify({
						description: "Reeddit User Data",
						"public": true,
						files: files
					}),
					headers: {
						"Content-Type": "application/json; charset=UTF-8"
					},
					success: function success(response) {
						var resp = JSON.parse(response);
						$$.id("btn-save-dbx").style.display = "block"; // Show "Save to Dropbox" button only when the gist's created
						gists.fileURL = resp.files["reedditdata.json"].raw_url;
						update = 0;
					},
					error: function error() {
						$("#btn-save-dbx").remove();
						$(".move-data-exp").append("<p class='msg-error'>Oh oh. Error creating your backup file. Retry later.</p>");
						Modal.remove();
					}
				});
			});
		} else if (gists.fileURL) {
			Modal.show(template.exportData, function () {
				$$.id("btn-save-dbx").style.display = "block";
			});
		}
	};

	var chooseFromDropbox = function chooseFromDropbox() {
		Dropbox.choose({
			success: function success(file) {
				$.ajax({
					url: file[0].link,
					success: function success(data) {
						try {
							var refresh = false;
							if (typeof data === "string") {
								data = JSON.parse(data);
							}
							if (data.subreddits) {
								refresh = true;
								Store.setItem("subreeddits", JSON.stringify(data.subreddits));
							}
							if (data.channels) {
								refresh = true;
								Store.setItem("channels", JSON.stringify(data.channels));
							}
							if (refresh) {
								window.location.reload();
							}
						} catch (e) {
							alert("Oops! Wrong file, maybe? - Try choosing another one.");
						}
					}
				});
			},
			linkType: "direct",
			extensions: [".json"]
		});
	};

	var initListeners = function initListeners() {

		tappable("#btn-save-dbx", {
			onTap: function onTap() {
				if (!gists.fileURL) {
					alert("Err. There's no backup file created...");
					return;
				}
				var options = {
					files: [{
						url: gists.fileURL,
						filename: "reedditdata.json"
					}],
					success: Modal.remove
				};
				Dropbox.save(options);
			},
			activeClass: "btn-general-active"
		});

		tappable("#btn-dbx-imp", {
			onTap: chooseFromDropbox,
			activeClass: "btn-general-active"
		});
	};

	// Exports
	return {
		initListeners: initListeners,
		chooseFromDropbox: chooseFromDropbox,
		createBackup: createBackup,
		shouldUpdate: shouldUpdate,
		templateImportData: template.importData
	};
})();

var $$ = {

	id: function id(query) {
		return document.getElementById(query);
	},

	q: function q(query) {
		return document.querySelector(query);
	}
};

var wideScreenBP = window.matchMedia("(min-width: 1000px)"),
    largeScreenBP = window.matchMedia("(min-width: 490px)"),
    UA = window.navigator.userAgent;

var is = (function () {

	// Do detection
	var isDesktop = !/iPhone|iPod|iPad|Android|Mobile/.test(UA),
	    isiPad = /iPad/.test(UA),
	    isiPhone = /iP(hone|od)/.test(UA);

	return {

		wideScreen: wideScreenBP.matches,

		largeScreen: largeScreenBP.matches,

		desktop: isDesktop,

		mobile: !isDesktop,

		iPhone: isiPhone,

		iPad: isiPad,

		iOS7: (isiPhone || isiPad) && parseInt(UA.match(/ OS (\d+)_/i)[1], 10) >= 7
	};
})();

/* global allCookies */
var Store = window.fluid ? allCookies : window.localStorage;

/* global
 $,
 $$,
 El,
 Anim,
 Footer,
 Header,
 Store,
 Menu,
 tappable,
 Modal,
 Posts,
 Comments,
 is,
 wideScreenBP,
 largeScreenBP
 */

var UI = (function () {

	var Move = {
		LEFT: 1,
		RIGHT: 2
	};

	var View = {
		MAIN: 1,
		COMMENTS: 2
	};

	var classes = { // css
		showView: "show-view",
		showMenu: "show-menu",
		mnml: "mnml",
		hide: "hide",
		swipe: "from-swipe"
	};

	var template = {
		loader: "<div class='loader'></div>"
	};

	var el = {
		body: $("body"),
		mainWrap: $("#main-wrap"),
		detailWrap: $("#detail-wrap"),
		mainView: $(".main-view"),
		detailView: $(".detail-view")
	};

	var mnmlTheme = false,
	    currentView = View.MAIN;

	var getCurrentView = function () {
		return currentView;
	};

	var setCurrentView = function setCurrentView(view) {
		currentView = view;
	};

	var setSubTitle = function setSubTitle(title) {
		Header.el.subtitleText.text(title);
		Footer.el.subTitle.text(title);
	};

	var backToMainView = function backToMainView() {
		Header.el.btnNavBack.addClass("invisible");
		Header.el.subtitle.removeClass("invisible");
		Header.el.centerSection.empty().append(Header.el.icon);
		Anim.slideFromLeft();
	};

	var switchMnml = function switchMnml(save, mode) {
		// save, mode: boolean
		if (typeof mode === "undefined") {
			mnmlTheme = !mnmlTheme;
		} else {
			mnmlTheme = mode;
		}
		var buttonMnml = $("#mnml"),
		    docBody = document.body;
		if (mnmlTheme) {
			docBody.classList.add(classes.mnml);
			buttonMnml.text("Theme: mnml");
		} else {
			docBody.classList.remove(classes.mnml);
			buttonMnml.text("Theme: Classic");
		}
		if (save) {
			Store.setItem("mnml", mnmlTheme);
		}
	};

	var switchDisplay = function switchDisplay(el, visible) {
		if (visible) {
			el.classList.add(classes.hide);
		} else {
			el.classList.remove(classes.hide);
		}
	};

	var addLoader = function addLoader(elem) {
		var loader = $("<div/>").addClass("loader");
		elem.append(loader);
		return loader;
	};

	var scrollFixComments = function scrollFixComments() {
		// Make comments section always scrollable
		var detailWrap = $$.q("#detail-wrap"),
		    detailWrapHeight = detailWrap.offsetHeight,
		    linkSummary = detailWrap.querySelector("section:first-child"),
		    linkSummaryHeight = linkSummary.offsetHeight,
		    selfText = detailWrap.querySelector("#selftext"),
		    selfTextHeight = selfText ? selfText.offsetHeight : 0,
		    imagePreview = detailWrap.querySelector(".image-preview"),
		    imagePreviewHeight = imagePreview ? imagePreview.offsetHeight : 0,
		    loader = detailWrap.querySelector(".loader"),
		    loaderHeight = loader ? loader.offsetHeight : 0;

		var minHeight = detailWrapHeight - linkSummaryHeight - selfTextHeight - imagePreviewHeight - loaderHeight + 1;
		$("#detail-wrap > section + " + (selfTextHeight > 0 ? "#selftext +" : "") + (imagePreviewHeight > 0 ? ".image-preview +" : "") + (loaderHeight > 0 ? ".loader +" : "") + " section").css("min-height", minHeight);
	};

	var scrollFixLinks = function scrollFixLinks() {
		// Make links section always scrollable / Necessary when using the other Sorting options.
		var totalHeight = 0;
		// Calculate the total of link wrappers height
		var wraps = document.querySelectorAll(".link-wrap");
		for (var w = 0; w < wraps.length; w++) {
			totalHeight += wraps[w].offsetHeight;
		}
		// Get each element's static section height
		var containerHeight = document.body.offsetHeight,
		    headerHeight = $$.q("header").offsetHeight,
		    message = $$.q(".loader"),
		    messageHeight = message ? message.offsetHeight : 0,
		    listButton = $$.q(".list-button"),
		    listButtonHeight = listButton ? listButton.offsetHeight : 0;

		var minHeight = containerHeight - headerHeight - messageHeight - listButtonHeight;

		if (totalHeight > minHeight) {
			$("#main-overflow").css("min-height", "");
		} else {
			$("#main-overflow").css("min-height", minHeight - totalHeight + 1);
		}
	};

	var supportOrientation = typeof window.orientation !== "undefined";

	var getScrollTop = function getScrollTop() {
		return window.pageYOffset || document.compatMode === "CSS1Compat" && document.documentElement.scrollTop || document.body.scrollTop || 0;
	};

	var scrollTop = function scrollTop() {
		if (!supportOrientation) {
			return;
		}
		document.body.style.height = screen.height + "px";
		setTimeout(function () {
			window.scrollTo(0, 1);
			var top = getScrollTop();
			window.scrollTo(0, top === 1 ? 0 : 1);
			document.body.style.height = window.innerHeight + "px";
		}, 1);
	};

	var iPadScrollFix = function iPadScrollFix() {
		// This slight height change makes the menu container 'overflowy', to allow scrolling again on iPad - weird bug
		var nextHeight = "36px" === $(".menu-desc").css("height") ? "35px" : "36px";
		setTimeout(function () {
			$(".menu-desc").css("height", nextHeight);
		}, 500);
	};

	var initListeners = function initListeners() {

		// Show option to reload app after update
		if (window.applicationCache) {
			window.applicationCache.addEventListener("updateready", function (e) {
				var delay = 1;
				if (Menu.isShowing()) {
					Menu.move(Move.LEFT);
					delay = 301;
				}
				setTimeout(function () {
					el.mainWrap.prepend("<div class='top-buttons'><div id='btn-update'>Reeddit updated. Press to reload</div></div>");
					tappable("#btn-update", {
						onTap: function onTap() {
							window.location.reload();
						},
						activeClass: "list-button-active"
					});
				}, delay);
			}, false);
		}

		// Do stuff after finishing resizing the windows
		window.addEventListener("resizeend", function () {
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
			document.addEventListener("touchstart", function (ev) {
				var touchX = ev.targetTouches[0].clientX;
				hasSwiped = touchX < 20 || touchX > window.innerWidth - 20;
			});
			document.addEventListener("touchend", function () {
				hasSwiped = false;
			});
		}

		// Pseudo-hash-router
		window.addEventListener("hashchange", function () {
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
			if (location.hash === "") {
				// To Main View
				backToMainView();
				Posts.clearSelected();
				Footer.setPostTitle();
				setTimeout(function () {
					el.detailWrap.empty();
				}, is.wideScreen ? 1 : 301);
			} else {
				// To Comment View
				Comments.navigateFromHash();
			}
		}, false);

		// Taps
		tappable("#mnml", {
			onTap: function onTap() {
				switchMnml(true);
			}
		});

		tappable(".btn-refresh", {
			onTap: function onTap(e) {
				var origin = e.target.getAttribute("data-origin");
				switch (origin) {
					case "footer-main":
						Posts.refreshStream();
						break;
					case "footer-detail":
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
			}
		});

		tappable(".close-form", Modal.remove);

		// Swipes
		if (is.mobile) {
			if (!(is.iPhone && is.iOS7)) {
				el.detailView.swipeRight(function () {
					if (is.wideScreen) {
						return;
					}
					location.hash = "#";
				});
			}

			el.mainView.swipeRight(function () {
				if (!is.desktop && Posts.areLoading() || is.largeScreen) {
					return;
				}
				if (currentView === View.MAIN) {
					Menu.move(Move.RIGHT);
				}
			});

			el.mainView.swipeLeft(function () {
				if (!is.desktop && Posts.areLoading() || is.largeScreen) {
					return;
				}
				if (Menu.isShowing()) {
					Menu.move(Move.LEFT);
				}
			});

			el.mainView.on("swipeLeft", ".link", function () {
				if (is.wideScreen) {
					return;
				}
				if (!Menu.isShowing()) {
					var id = $(this).data("id");
					Comments.updateHash(id);
				}
			});
		}
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
		switchMnml: switchMnml,
		scrollTop: scrollTop,
		iPadScrollFix: iPadScrollFix,
		scrollFixComments: scrollFixComments,
		scrollFixLinks: scrollFixLinks,
		addLoader: addLoader,
		backToMainView: backToMainView,
		switchDisplay: switchDisplay
	};
})();

var URLs = {
	init: "http://www.reddit.com/",
	end: ".json?jsonp=?",
	limitEnd: ".json?limit=30&jsonp=?"
};

/* global
 Posts,
 Subreddits,
 Anim,
 UI,
 tappable,
 Modal,
 is,
 Store,
 Backup,
 CurrentSelection,
 Mustache,
 URLs
 */

var Channels = (function () {

	var defaults = {
		name: "Media",
		subs: ["movies", "television", "music", "games"]
	};

	var template = {
		singleEditItem: "<div class='item-to-edit channel-to-remove' data-title='{{name}}'><p class='channel-name'>{{name}}</p><div class='btn-edit-channel' data-title='{{name}}'></div><div class='btn-remove-channel' data-title='{{name}}'></div></div>",
		single: "<li class=\"channel\" data-title=\"{{name}}\"><p>{{name}}</p><div>{{#subs}}<p>{{.}}</p>{{/subs}}</div></li>",
		list: "{{#.}}<li class=\"channel\" data-title=\"{{name}}\"><p>{{name}}</p><div>{{#subs}}<p>{{.}}</p>{{/subs}}</div></li>{{/.}}",
		formAddNew: "<div class=\"new-form\" id=\"form-new-channel\"><div class=\"form-left-corner\"><div class=\"btn-general\" id=\"btn-submit-channel\" data-op=\"save\">Add Channel</div></div><div class=\"close-form\">&times;</div><input type=\"text\" id=\"txt-channel\" placeholder=\"Channel name\" /><div id=\"subs-for-channel\"><input class=\"field-edit-sub\" type=\"text\" placeholder=\"Subreddit 1\" /><input class=\"field-edit-sub\" type=\"text\" placeholder=\"Subreddit 2\" /><input class=\"field-edit-sub\" type=\"text\" placeholder=\"Subreddit 3\" /></div><div id=\"btn-add-another-sub\">Add additional subreddit</div></div>",
		formEditChannel: "<div class=\"new-form\" id=\"form-new-channel\"><div class=\"form-left-corner\"><div class=\"btn-general\" id=\"btn-submit-channel\" data-op=\"update\">Update Channel</div></div><div class=\"close-form\">&times;</div><input type=\"text\" id=\"txt-channel\" placeholder=\"Channel name\" /><div id=\"subs-for-channel\"></div><div id=\"btn-add-another-sub\">Add additional subreddit</div></div>"
	};

	var list = [],
	    editingNow = "";

	var el = {
		menu: $("#channels")
	};

	var getList = function () {
		return list;
	};

	var getURL = function getURL(channel) {
		if (channel.subs.length === 1) {
			// Reddit API-related hack
			// If there's one subreddit in a "Channel", and this subreddit name's invalid, reddit.com responds with a search-results HTML - not json data - and throws a hard-to-catch error...
			return "r/" + channel.subs[0] + "+" + channel.subs[0]; // Repeating the one subreddit in the URL avoids this problem :)
		} else {
			return "r/" + channel.subs.join("+");
		}
	};

	var insert = function insert(channel) {
		list.push(channel);
		Store.setItem("channels", JSON.stringify(list));
		Backup.shouldUpdate();
	};

	var _delete = function _delete(name) {
		for (var j = 0; j < list.length; j++) {
			if (list[j].name === name) {
				list.splice(j, 1);
				break;
			}
		}
		Store.setItem("channels", JSON.stringify(list));
		Backup.shouldUpdate();
	};

	var getByName = function getByName(name) {
		var foundChannel;
		for (var i = 0; i < list.length; i++) {
			if (list[i].name.toLowerCase() === name.toLowerCase()) {
				foundChannel = list[i];
				break;
			}
		}
		return foundChannel;
	};

	var append = function append(channel) {
		el.menu.append(Mustache.to_html(template.single, channel));
		if (Subreddits.isEditing()) {
			addToEditList(channel.name);
		}
	};

	var loadList = function loadList() {
		el.menu.html(Mustache.to_html(template.list, list));
	};

	var detach = function detach(name) {
		var deletedChannel = $(".channel-to-remove[data-title=\"" + name + "\"]");
		deletedChannel.addClass("anim-delete");
		setTimeout(function () {
			deletedChannel.remove();
		}, 200);

		$(".channel[data-title=\"" + name + "\"]").remove();
	};

	var addToEditList = function addToEditList(name) {
		$(".channel-edit-list").append(template.singleEditItem.replace(/\{\{name\}\}/g, name));
	};

	var add = function add(title, subreddits) {
		var channel = {
			name: title,
			subs: subreddits
		};
		insert(channel);
		append(channel);
	};

	var loadSaved = function loadSaved() {
		// Should only execute when first loading the app
		list = Store.getItem("channels");
		if (list) {
			list = JSON.parse(list);
		} else {
			// Load defaults channel(s)
			list = [defaults];
		}
		loadList();
	};

	var loadPosts = function loadPosts(channel) {
		Posts.load(URLs.init + getURL(channel) + "/");
		UI.setSubTitle(channel.name);
		CurrentSelection.setChannel(channel);
	};

	var remove = function remove(name) {
		_delete(name);
		detach(name);
		// If it was the current selection
		if (CurrentSelection.getType() === CurrentSelection.Types.CHANNEL && CurrentSelection.getName() === name) {
			CurrentSelection.setSubreddit("frontPage");
		}
	};

	var edit = function edit(name) {
		var channelToEdit = getByName(name);
		Modal.show(template.formEditChannel, function () {
			// Fill form with current values
			$("#txt-channel").val(channelToEdit.name);

			editingNow = channelToEdit.name;
			var $inputsContainer = $("#subs-for-channel");

			for (var i = 0, l = channelToEdit.subs.length; i < l; i++) {

				var inputTemplate = "<input class='field-edit-sub with-clear' type='text' value='{{subName}}'>";

				$inputsContainer.append(inputTemplate.replace("{{subName}}", channelToEdit.subs[i]));
			}
		});
	};

	var initListeners = function initListeners() {

		tappable("#btn-submit-channel", {
			onTap: function onTap(e, target) {
				var txtChannelName = $("#txt-channel"),
				    operation = target.getAttribute("data-op"),
				    channelName = txtChannelName.val();

				if (!channelName) {
					txtChannelName.attr("placeholder", "Enter a Channel name!");
					Anim.shakeForm();
					return;
				}

				var subreddits = [],
				    subs = $("#subs-for-channel input");

				for (var i = 0; i < subs.length; i++) {
					var sub = $(subs[i]).val();
					if (!sub) {
						continue;
					}
					subreddits.push(sub);
				}

				if (subreddits.length === 0) {
					subs[0].placeholder = "Enter at least one subreddit!";
					Anim.shakeForm();
					return;
				}

				switch (operation) {
					case "save":
						// Look for Channel name in the saved ones
						var savedChannel = getByName(channelName);
						if (savedChannel) {
							// If it's already saved
							txtChannelName.val("");
							txtChannelName.attr("placeholder", "'" + channelName + "' already exists.");
							Anim.shakeForm();
							return;
						}
						add(channelName, subreddits);
						break;

					case "update":
						// Remove current and add new
						remove(editingNow);
						add(channelName, subreddits);
						break;
				}

				// confirmation feedback
				$(target).remove();
				$(".form-left-corner").append("<p class='channel-added-msg'>'" + channelName + "' " + operation + "d. Cool!</p>");

				Anim.bounceOut($(".new-form"), Modal.remove);
			},
			activeClass: "btn-general-active"
		});

		tappable("#btn-add-channel", {
			onTap: function onTap() {
				Modal.show(template.formAddNew);
			},
			activeClass: "list-button-active"
		});

		tappable(".btn-remove-channel", {
			onTap: function onTap(e, target) {
				remove($(target).data("title"));
			},
			activeClass: "button-active"
		});

		tappable(".btn-edit-channel", {
			onTap: function onTap(e, target) {
				edit(target.getAttribute("data-title"));
			},
			activeClass: "button-active"
		});
	};

	// Exports
	return {
		getList: getList,
		getByName: getByName,
		getURL: getURL,
		loadPosts: loadPosts,
		loadSaved: loadSaved,
		initListeners: initListeners,
		template: {
			formAddNew: template.formAddNew,
			singleEditItem: template.singleEditItem
		}
	};
})();

/* global
 $,
 El,
 Posts,
 Markdown,
 tappable,
 UI,
 LinkSummary,
 Footer,
 Header,
 Anim,
 Menu,
 Modal,
 is,
 timeSince,
 URLs
 */

var Comments = (function () {

	var loading = false,
	    replies = {},
	    currentThread;

	var setLoading = function setLoading(areLoading) {
		loading = areLoading;
	};

	var getCurrentThread = function () {
		return currentThread;
	};

	var updateHash = function updateHash(id) {
		location.hash = "#comments:" + id;
	};

	var getIdFromHash = function getIdFromHash() {
		var match = location.hash.match(/(#comments:)((?:[a-zA-Z0-9]*))/);
		if (match && match[2]) {
			return match[2];
		}
	};

	var navigateFromHash = function navigateFromHash() {
		var id = getIdFromHash();
		show(id);
		if (is.wideScreen) {
			Posts.markSelected(id);
		}
	};

	var showLoadError = function showLoadError(loader) {
		loading = false;
		var error = "Error loading comments. Refresh to try again.";
		if (is.wideScreen) {
			loader.addClass("loader-error").html(error + "<button class=\"btn-simple btn-block btn-refresh\">Refresh</button>");
		} else {
			loader.addClass("loader-error").text(error);
		}
		if (!is.desktop) {
			UI.el.detailWrap.append($("<section/>"));
			UI.scrollFixComments();
		}
	};

	var load = function load(data, baseElement, idParent) {
		var now = new Date().getTime(),
		    converter = new Markdown.Converter(),
		    com = $("<div/>").addClass("comments-level");
		for (var i = 0; i < data.length; i++) {
			var c = data[i];

			if (c.kind !== "t1") {
				continue;
			}

			var html = converter.makeHtml(c.data.body),
			    isPoster = Posts.getList()[currentThread].author === c.data.author,
			    permalink = "http://reddit.com" + Posts.getList()[currentThread].link + c.data.id,
			    commentLink = {
				href: permalink,
				target: "_blank",
				title: "See this comment on reddit.com"
			};

			var comment = $("<div/>").addClass("comment-wrap").append($("<div/>").append($("<div/>").addClass("comment-data").append($("<div/>").addClass(isPoster ? "comment-poster" : "comment-author").append($("<p/>").text(c.data.author))).append($("<div/>").addClass("comment-info").append($("<a/>").attr(commentLink).text(timeSince(now, c.data.created_utc))))).append($("<div/>").addClass("comment-body").html(html)));

			if (c.data.replies && c.data.replies.data.children[0].kind !== "more") {
				comment.append($("<button/>").addClass("btn-simple btn-block--small comments-button js-reply-button").attr("data-comment-id", c.data.id).text("See replies"));
				replies[c.data.id] = c.data.replies.data.children;
			}

			com.append(comment);
		}

		baseElement.append(com);

		if (idParent) {
			Posts.getLoaded()[idParent] = com;
		}

		UI.el.detailWrap.find("a").attr("target", "_blank");
		//$("#detail-wrap a").attr("target", "_blank");

		if (!is.desktop) {
			UI.scrollFixComments();
		}
	};

	var show = function show(id, refresh) {
		if (!Posts.getList()[id]) {
			currentThread = id;

			var loader = UI.addLoader(UI.el.detailWrap);
			loading = true;

			$.ajax({
				dataType: "jsonp",
				url: URLs.init + "comments/" + id + "/" + URLs.end,
				success: function success(result) {
					loader.remove();
					loading = false;

					Posts.setList(result[0].data);
					LinkSummary.setPostSummary(result[0].data.children[0].data, id);

					Header.el.btnNavBack.removeClass("invisible"); // Show

					setRest(id, refresh);

					load(result[1].data.children, $("#comments-container"), id);
				},
				error: function error() {
					showLoadError(loader);
				}
			});
		} else {
			var delay = 0;
			if (Menu.isShowing()) {
				Menu.move(UI.Move.LEFT);
				delay = 301;
			}
			setTimeout(function () {

				if (loading && currentThread && currentThread === id) {
					return;
				}

				loading = true;
				currentThread = id;

				Header.el.btnNavBack.removeClass("invisible"); // Show

				var detail = UI.el.detailWrap;
				detail.empty();

				UI.el.detailWrap[0].scrollTop = 0;

				if (Posts.getLoaded()[id] && !refresh) {
					detail.append(Posts.getList()[id].summary);
					$("#comments-container").append(Posts.getLoaded()[id]);
					LinkSummary.updatePostSummary(Posts.getList()[id], id);
					loading = false;
				} else {
					LinkSummary.setPostSummary(Posts.getList()[id], id);
					var url = "http://www.reddit.com" + Posts.getList()[id].link + URLs.end;

					var loader = UI.addLoader(detail);

					$.ajax({
						dataType: "jsonp",
						url: url,
						success: function success(result) {
							if (currentThread !== id) {
								// In case of trying to load a different thread before this one loaded.
								// TODO: handle this better
								return;
							}
							LinkSummary.updatePostSummary(result[0].data.children[0].data, id);
							loader.remove();
							load(result[1].data.children, $("#comments-container"), id);
							loading = false;
						},
						error: function error() {
							showLoadError(loader);
						}
					});
				}

				setRest(id, refresh);
			}, delay);
		}
	};

	var setRest = function setRest(id, refresh) {
		var postTitle = Posts.getList()[id].title;

		if (!refresh) {
			Footer.setPostTitle(postTitle);
		}

		if (!refresh && UI.getCurrentView() !== UI.View.COMMENTS) {
			Anim.slideFromRight();
		}

		Header.el.centerSection.empty().append(Header.el.postTitle);
		Header.el.postTitle.text(postTitle);
		Header.el.subtitle.addClass("invisible");
	};

	var initListeners = function initListeners() {

		UI.el.detailWrap.on("click", "#comments-container a, #selftext a", function (ev) {
			var imageURL = LinkSummary.checkImageLink(ev.target.href);
			if (imageURL) {
				ev.preventDefault();
				Modal.showImageViewer(imageURL);
			}
		});

		tappable(".js-reply-button", {
			onTap: function onTap(e, target) {
				var parent = $(target),
				    commentID = parent.attr("data-comment-id"),
				    comments = replies[commentID];
				load(comments, parent.parent());
				parent.remove();
			}
		});

		tappable(".image-preview", {
			onTap: function onTap(e, target) {
				Modal.showImageViewer(target.src);
			}
		});
	};

	// Exports
	return {
		initListeners: initListeners,
		navigateFromHash: navigateFromHash,
		getCurrentThread: getCurrentThread,
		show: show,
		updateHash: updateHash,
		setLoading: setLoading,
		getIdFromHash: getIdFromHash
	};
})();

/* global
 Store
 */

var CurrentSelection = (function () {

	var name = "",
	    type = "";

	var Types = {
		SUB: 1,
		CHANNEL: 2
	};

	var storeKey = "currentSelection";

	var getName = function () {
		return name;
	};

	var getType = function () {
		return type;
	};

	var set = function set(newName, newType) {
		name = newName;
		type = newType;
		Store.setItem(storeKey, JSON.stringify({ name: name, type: type }));
	};

	var loadSaved = function loadSaved() {
		var loadedSelection = Store.getItem(storeKey);

		if (loadedSelection) {
			loadedSelection = JSON.parse(loadedSelection);
		}

		name = loadedSelection ? loadedSelection.name : "frontPage";
		type = loadedSelection ? loadedSelection.type : Types.SUB;
	};

	var setSubreddit = function setSubreddit(sub) {
		set(sub, Types.SUB);
	};

	var setChannel = function setChannel(channel) {
		set(channel.name, Types.CHANNEL);
	};

	var execute = function execute(caseSub, caseChannel) {
		switch (type) {
			case Types.SUB:
				caseSub();
				break;
			case Types.CHANNEL:
				caseChannel();
				break;
		}
	};

	// Exports
	return {
		getName: getName,
		getType: getType,
		Types: Types,
		loadSaved: loadSaved,
		setSubreddit: setSubreddit,
		setChannel: setChannel,
		execute: execute
	};
})();

/* global
 $,
 UI
 */

var Footer = (function () {

	var refreshButton = "";

	var noLink = "No Post Selected";

	var el = {
		detail: $("#detail-footer"),
		postTitle: $("#footer-post"),
		subTitle: $("#footer-sub"),

		getRefreshButton: function getRefreshButton() {
			if (!refreshButton) {
				refreshButton = document.querySelector("#main-footer .footer-refresh");
			}
			return refreshButton;
		}
	};

	var setPostTitle = function setPostTitle(title) {
		el.postTitle.text(title ? title : noLink);
		var buttons = el.detail.find(".btn-footer");
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

/* global
 $,
 is,
 tappable,
 Menu,
 Posts,
 UI
 */

var Header = (function () {

	var el = {

		subtitle: $("#main-title"),

		subtitleText: $("#sub-title"),

		centerSection: $("#title-head"),

		postTitle: $("#title"),

		icon: $("#header-icon"),

		btnNavBack: $("#nav-back")
	};

	var initListeners = function initListeners() {

		tappable(".btn-to-main", {
			onTap: function onTap() {
				location.hash = "#";
			}
		});

		tappable("#sub-title", {
			onTap: function onTap() {
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

/* global
 Posts,
 Mustache,
 El,
 Footer,
 timeSince,
 Markdown,
 UI
 */

var LinkSummary = (function () {

	var template = "\n\t\t<section id='link-summary'>\n\t\t\t<a href='{{url}}' target='_blank'>\n\t\t\t\t<p id='summary-title'>{{title}}</p>\n\t\t\t\t<p id='summary-domain'>{{domain}}</p>\n\t\t\t\t{{#over_18}}\n\t\t\t\t<span class='link-label summary-label nsfw'>NSFW</span>\n\t\t\t\t{{/over_18}}\n\t\t\t\t{{#stickied}}\n\t\t\t\t<span class='link-label summary-label stickied'>Stickied</span>\n\t\t\t\t{{/stickied}}\n\t\t\t</a>\n\t\t\t<div id='summary-footer'>\n\t\t\t\t<p id='summary-author'>by {{author}}</p>\n\t\t\t\t<a class='btn-general' id='share-tw' target='_blank' href='https://twitter.com/intent/tweet?text=\"{{encodedTitle}}\" —&url={{url}}&via=ReedditApp&related=ReedditApp'>Tweet</a>\n\t\t\t</div>\n\t\t\t<div id='summary-extra'>\n\t\t\t\t<p id='summary-sub'>{{subreddit}}</p>\n\t\t\t\t<p id='summary-time'></p>\n\t\t\t\t<a id='summary-comment-num' title='See comments on reddit.com' href='http://reddit.com{{link}}' target='_blank'>{{num_comments}} comments</a>\n\t\t\t</div>\n\t\t</section>";

	var setPostSummary = function setPostSummary(data, postID) {
		if (!data.link) {
			data.link = data.permalink;
		}
		// Main content
		var summaryHTML = Mustache.to_html(template, data);
		// Check for type of post
		if (data.selftext) {
			// If it's a self-post
			var selfText;
			if (Posts.getList()[postID].selftextParsed) {
				selfText = Posts.getList()[postID].selftext;
			} else {
				var summaryConverter1 = new Markdown.Converter();
				selfText = summaryConverter1.makeHtml(data.selftext);
				Posts.getList()[postID].selftext = selfText;
				Posts.getList()[postID].selftextParsed = true;
			}
			summaryHTML += "<section id='selftext'>" + selfText + "</section>";
		} else {
			// if it's an image
			var linkURL = Posts.getList()[postID].url;
			var imageLink = checkImageLink(linkURL);
			if (imageLink) {
				// If it's an image link
				summaryHTML += "<section class=\"preview-container\">" + "<img class=\"image-preview\" src=\"" + imageLink + "\" />" + "</section>";
			} else {
				// if it's a YouTube video
				var youTubeID = getYouTubeVideoIDfromURL(linkURL);
				if (youTubeID) {
					summaryHTML += "<section class=\"preview-container\">" + "<a href=\"" + linkURL + "\" target=\"_blank\">" + "<img class=\"video-preview\" src=\"http://img.youtube.com/vi/" + youTubeID + "/hqdefault.jpg\" />" + "</a></section>";
				}
			}
		}
		summaryHTML += "<section id='comments-container'></section>";
		UI.el.detailWrap.append(summaryHTML);
		updatePostTime(data.created_utc);
		Posts.getList()[postID].summary = summaryHTML;
		Footer.el.postTitle.text(data.title);
	};

	var updatePostSummary = function updatePostSummary(data, postID) {
		$("#summary-comment-num").text(data.num_comments + (data.num_comments === 1 ? " comment" : " comments"));
		// Time ago
		updatePostTime(data.created_utc);
		Posts.getList()[postID].num_comments = data.num_comments;
		Posts.getList()[postID].created_utc = data.created_utc;
	};

	var updatePostTime = function updatePostTime(time) {
		$("#summary-time").text(timeSince(new Date().getTime(), time));
	};

	var checkImageLink = function checkImageLink(url) {
		var matching = url.match(/\.(svg|jpe?g|png|gif)(?:[?#].*)?$|(?:imgur\.com|livememe\.com)\/([^?#\/.]*)(?:[?#].*)?(?:\/)?$/);
		if (!matching) {
			return "";
		}
		if (matching[1]) {
			// normal image link
			return url;
		} else if (matching[2]) {
			// imgur or livememe link
			if (matching[0].slice(0, 5) === "imgur") {
				return "http://imgur.com/" + matching[2] + ".jpg";
			} else if (matching[0].indexOf("livememe.") >= 0) {
				return "http://i.lvme.me/" + matching[2] + ".jpg";
			} else {
				return null;
			}
		} else {
			return null;
		}
	};

	var getYouTubeVideoIDfromURL = function getYouTubeVideoIDfromURL(url) {
		var matching = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
		if (!matching) {
			return "";
		} else {
			if (matching[2].length === 11) {
				return matching[2];
			} else {
				return null;
			}
		}
	};

	// Exports
	return {
		setPostSummary: setPostSummary,
		updatePostSummary: updatePostSummary,
		checkImageLink: checkImageLink
	};
})();

/* global
 El,
 tappable,
 Channels,
 Subreddits,
 Modal,
 UI,
 is,
 CurrentSelection,
 Backup
 */

var Menu = (function () {

	var showing = false;

	var isShowing = function () {
		return showing;
	};

	var template = {
		about: "<div class='new-form about-reeddit'><div class='close-form'>&times;</div><ul><li><a href='/about/' target='_blank'>Reeddit Homepage</a></li><li><a href='https://github.com/berbaquero/reeddit' target='_blank'>GitHub Project</a></li></ul><p><a href='https://twitter.com/reedditapp'>@ReedditApp</a></p><p>Built by <a href='http://berbaquero.com' target='_blank'>Bernardo Baquero Stand</a></p></div>"
	};

	var move = function move(direction) {
		if (is.iPhone && is.iOS7) {
			UI.el.mainView.removeClass(UI.classes.swipe);
			UI.el.detailView.removeClass(UI.classes.swipe);
		}
		if (direction === UI.Move.LEFT) {
			UI.el.mainView.removeClass(UI.classes.showMenu);
			setTimeout(function () {
				showing = false;
			});
		}
		if (direction === UI.Move.RIGHT) {
			UI.el.mainView.addClass(UI.classes.showMenu);
			setTimeout(function () {
				showing = true;
			});
		}
	};

	var markSelected = function markSelected(params /* {type, el, name, update} */) {
		var type = params.type;
		var el = params.el;
		var name = params.name;
		var update = params.update;

		if (update) {
			cleanSelected();
		}

		var isChannel = type && type === "channel";

		if (el) {
			el.classList.add(isChannel ? "channel-active" : "sub-active");
			return;
		}

		if (name) {
			var selector = isChannel ? ".channel[data-title=\"" + name + "\"]" : ".sub[data-name=\"" + name + "\"]";

			var activeSub = document.querySelector(selector);
			activeSub.classList.add(isChannel ? "channel-active" : "sub-active");
		}
	};

	var cleanSelected = function cleanSelected() {
		$(".sub.sub-active").removeClass("sub-active");
		$(".channel.channel-active").removeClass("channel-active");
	};

	var initListeners = function initListeners() {

		tappable(".channel", {
			onTap: function onTap(e, target) {
				var channelName = target.getAttribute("data-title");
				Menu.move(UI.Move.LEFT);
				if (channelName === CurrentSelection.getName() && !Subreddits.isEditing()) {
					return;
				}
				Menu.markSelected({ type: "channel", el: target, update: true });
				if (UI.getCurrentView() === UI.View.COMMENTS) {
					UI.backToMainView();
				}
				Channels.loadPosts(Channels.getByName(channelName));
			},
			activeClassDelay: 100,
			activeClass: "link-active"
		});

		tappable(".sub", {
			onTap: function onTap(e, target) {
				var subredditName = $(target).first().text();
				Menu.move(UI.Move.LEFT);
				Subreddits.loadPosts(subredditName);
				markSelected({ el: target, update: true });
				if (UI.getCurrentView() === UI.View.COMMENTS) {
					UI.backToMainView();
				}
			},
			allowClick: false,
			activeClassDelay: 100,
			activeClass: "link-active"
		});

		tappable("#btn-new-sub", {
			onTap: function onTap() {
				Modal.show(Subreddits.template.formInsert);
			}
		});

		tappable("#btn-new-channel", {
			onTap: function onTap() {
				Modal.show(Channels.template.formAddNew);
			}
		});

		tappable("#btn-add-subs", {
			onTap: Subreddits.loadForAdding
		});

		tappable("#btn-edit-subs", {
			onTap: Subreddits.loadForEditing
		});

		tappable("#exp-data", {
			onTap: Backup.createBackup
		});

		tappable("#imp-data", {
			onTap: function onTap() {
				Modal.show(Backup.templateImportData);
			}
		});

		tappable("#about", {
			onTap: function onTap() {
				Modal.show(template.about);
			},
			activeClassDelay: 100
		});
	};

	// Exports
	return {
		isShowing: isShowing,
		initListeners: initListeners,
		move: move,
		markSelected: markSelected,
		cleanSelected: cleanSelected
	};
})();

/* global
 Menu,
 Anim,
 El,
 is,
 tappable,
 UI
 */

var Modal = (function () {

	var isShown = false;

	var show = function show(template, callback, config) {
		var delay = 1;
		if (!is.largeScreen && Menu.isShowing()) {
			Menu.move(UI.Move.LEFT);
			delay = 301;
		}
		setTimeout(function () {
			if (isShown) {
				return;
			}
			var modal = $("<div/>").attr("id", "modal"),
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
			isShown = true;
			setTimeout(function () {
				modal.css("opacity", 1);
				if (bounce) {
					Anim.bounceInDown($(".new-form"));
				}
			}, 1);
			if (callback) {
				callback();
			}
		}, delay);
	};

	var remove = function remove() {
		var modal = $("#modal");
		modal.css("opacity", "");
		isShown = false;
		setTimeout(function () {
			modal.remove();
		}, 301);
	};

	var showImageViewer = function showImageViewer(imageURL) {
		var imageViewer = "<img class=\"image-viewer\" src=\"" + imageURL + "\">",
		    config = {
			modalClass: "modal--closable",
			noBounce: true
		};
		Modal.show(imageViewer, false, config);
	};

	var initListeners = function initListeners() {

		tappable(".modal--closable", Modal.remove);
	};

	// Exports
	return {
		show: show,
		remove: remove,
		showImageViewer: showImageViewer,
		initListeners: initListeners
	};
})();

/* global
 $,
 tappable,
 is,
 El,
 UI,
 Anim,
 Mustache,
 Comments,
 Channels,
 Subreddits,
 Menu,
 CurrentSelection,
 Sorting,
 URLs
 */

var Posts = (function () {

	var template = "\n\t\t{{#children}}\n\t\t\t<article class='link-wrap'>\n\t\t\t\t<div class='link js-link' data-id='{{data.id}}'>\n\t\t\t\t\t<div class='link-thumb'>\n\t\t\t\t\t\t<div style='background-image: url({{data.thumbnail}})'></div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class='link-info'>\n\t\t\t\t\t\t<a href='{{data.url}}' data-id='{{data.id}}' target='_blank' class='link-title js-post-title'>\n\t\t\t\t\t\t{{data.title}}\n\t\t\t\t\t\t</a>\n\t\t\t\t\t\t<p class='link-domain'>{{data.domain}}</p>\n\t\t\t\t\t\t<p class='link-sub'>{{data.subreddit}}</p>\n\t\t\t\t\t\t{{#data.over_18}}\n\t\t\t\t\t\t<span class='link-label nsfw'>NSFW</span>\n\t\t\t\t\t\t{{/data.over_18}}\n\t\t\t\t\t\t{{#data.stickied}}\n\t\t\t\t\t\t<span class='link-label stickied'>Stickied</span>\n\t\t\t\t\t\t{{/data.stickied}}\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class='to-comments' data-id='{{data.id}}'>\n\t\t\t\t\t<div class='comments-icon'></div>\n\t\t\t\t</div>\n\t\t\t</article>\n\t\t{{/children}}\n\t\t<button id='btn-load-more-posts' class='btn-block btn-simple'>More</button>\n\t\t<div id='main-overflow'></div>";

	var loading = false,
	    list = {},
	    loaded = {},
	    idLast = "";

	var el = {
		moreButton: function moreButton() {
			return $("#btn-load-more-posts");
		}
	};

	var getList = function () {
		return list;
	};

	var getLoaded = function () {
		return loaded;
	};

	var setLoading = function setLoading(newLoading) {
		loading = newLoading;
	};

	var areLoading = function () {
		return loading;
	};

	var open = function open(url, id) {
		var link = list[id];
		if (link.self || is.wideScreen) {
			Comments.updateHash(id);
		} else {
			triggerClick(url);
		}
	};

	var load = function load(baseUrl, paging) {
		if (loading) {
			return;
		}
		loading = true;
		Comments.setLoading(false);
		Subreddits.setEditing(false);
		var main = UI.el.mainWrap;
		if (paging) {
			el.moreButton().remove(); // remove current button
			main.append(UI.template.loader);
		} else {
			UI.el.mainWrap[0].scrollTop = 0; // to container top
			setTimeout(function () {
				main.prepend(UI.template.loader);
			}, Menu.isShowing() ? 301 : 1);
			paging = ""; // empty string, to avoid pagination
		}
		$.ajax({
			dataType: "jsonp",
			url: baseUrl + Sorting.get() + URLs.limitEnd + paging,
			success: function success(result) {
				show(result, paging);
			},
			error: function error() {
				loading = false;
				$(".loader").addClass("loader-error").text("Error loading links. Refresh to try again.");
			}
		});
	};

	var loadFromManualInput = function loadFromManualInput(loadedLinks) {
		show(loadedLinks);
		UI.el.mainWrap[0].scrollTop = 0;
		Subreddits.setEditing(false);
	};

	var render = function render(links, paging) {
		// links: API raw data
		var linksCount = links.children.length,
		    main = UI.el.mainWrap;

		if (paging) {
			$(".loader").remove();
		} else {
			if (is.desktop) {
				main.empty();
			} else {
				main.empty().removeClass("anim-reveal").addClass("invisible");
			}
		}

		if (linksCount === 0) {
			var message = $(".loader");
			if (message) {
				message.text("No Links available.");
				message.addClass("loader-error");
				main.append("<div id=\"#main-overflow\"></div>");
			} else {
				main.prepend("<div class=\"loader loader-error\">No Links available.</div><div id=\"main-overflow\"></div>");
			}
		} else {
			// Add new links to the list
			main.append(Mustache.to_html(template, links));

			// Remove thumbnail space for those links with invalid backgrounds.
			var thumbs = $(".link-thumb > div"),
			    bgImg = "background-image: ";
			for (var i = 0; i < thumbs.length; i++) {
				var thumb = $(thumbs[i]),
				    bg = thumb.attr("style");
				if (bg === bgImg + "url()" || bg === bgImg + "url(default)" || bg === bgImg + "url(nsfw)" || bg === bgImg + "url(self)") {
					thumb.parent().remove();
				}
			}
		}
		if (linksCount < 30) {
			// Remove 'More links' button if there are less than 30 links
			el.moreButton().remove();
		}
		if (!is.desktop) {
			UI.scrollFixLinks();
		}
		if (!paging) {
			Anim.reveal(main);
		}
	};

	var show = function show(result, paging) {
		var posts = result.data;
		loading = false;
		idLast = posts.after;

		render(posts, paging);
		setList(posts);
		if (is.wideScreen) {
			var id = Comments.getIdFromHash();
			if (id) {
				markSelected(id);
			}
		}
	};

	var setList = function setList(posts) {
		for (var i = 0; i < posts.children.length; i++) {
			var post = posts.children[i];
			if (list[post.data.id]) {
				// if already cached
				list[post.data.id].num_comments = post.data.num_comments;
				list[post.data.id].created_utc = post.data.created_utc;
			} else {
				// if not yet cached
				list[post.data.id] = {
					title: post.data.title,
					encodedTitle: encodeURI(post.data.title),
					selftext: post.data.selftext,
					created_utc: post.data.created_utc,
					domain: post.data.domain,
					subreddit: post.data.subreddit,
					num_comments: post.data.num_comments,
					url: post.data.url,
					self: post.data.is_self,
					link: post.data.permalink,
					author: post.data.author,
					over_18: post.data.over_18,
					stickied: post.data.stickied
				};
			}
		}
	};

	var refreshStream = function refreshStream() {
		if (Subreddits.isEditing()) {
			return;
		}
		CurrentSelection.execute(function () {
			// if it's subreddit
			if (CurrentSelection.getName().toLowerCase() === "frontpage") {
				load(URLs.init + "r/" + Subreddits.getAllSubsString() + "/");
			} else {
				load(URLs.init + "r/" + CurrentSelection.getName() + "/");
			}
		}, function () {
			// if it's channel
			Channels.loadPosts(Channels.getByName(CurrentSelection.getName()));
		});
	};

	var markSelected = function markSelected(id) {
		$(".link.link-selected").removeClass("link-selected");
		$(".link[data-id=\"" + id + "\"]").addClass("link-selected");
	};

	var clearSelected = function clearSelected() {
		$(".link.link-selected").removeClass("link-selected");
	};

	var triggerClick = function triggerClick(url) {
		var a = document.createElement("a");
		a.setAttribute("href", url);
		a.setAttribute("target", "_blank");

		var clickEvent = new MouseEvent("click", {
			view: window,
			bubbles: true,
			cancelable: false
		});

		a.dispatchEvent(clickEvent);
	};

	var initListeners = function initListeners() {

		tappable(".js-link", {
			onTap: function onTap(e, target) {
				if (!is.wideScreen) {
					return;
				}
				var id = target.getAttribute("data-id");
				Comments.updateHash(id);
			},
			allowClick: false,
			activeClassDelay: 100,
			inactiveClassDelay: 200,
			activeClass: "link-active"
		});

		tappable(".js-post-title", {
			onTap: function onTap(e) {
				var id = e.target.getAttribute("data-id"),
				    url = e.target.href;
				open(url, id);
			},
			allowClick: false
		});

		tappable(".to-comments", {
			onTap: function onTap(e, target) {
				var id = target.getAttribute("data-id");
				Comments.updateHash(id);
			},
			activeClass: "button-active",
			activeClassDelay: 100
		});

		tappable("#btn-load-more-posts", {
			onTap: function onTap() {
				CurrentSelection.execute(function () {
					var url;
					if (CurrentSelection.getName().toLowerCase() === "frontpage") {
						url = URLs.init + "r/" + Subreddits.getAllSubsString() + "/";
					} else {
						url = URLs.init + "r/" + CurrentSelection.getName() + "/";
					}
					load(url, "&after=" + idLast);
				}, function () {
					var channel = Channels.getByName(CurrentSelection.getName());
					load(URLs.init + Channels.getURL(channel) + "/", "&after=" + idLast);
				});
			}
		});
	};

	// Exports
	return {
		initListeners: initListeners,
		load: load,
		clearSelected: clearSelected,
		refreshStream: refreshStream,
		markSelected: markSelected,
		loadFromManualInput: loadFromManualInput,
		setLoading: setLoading,
		areLoading: areLoading,
		getList: getList,
		setList: setList,
		getLoaded: getLoaded
	};
})();

/* global
 Sorting,
 Posts,
 tappable
 */

var SortSwitch = (function () {

	// Initial State
	var isHot = true;

	var classes = {
		"new": "sort-switch--new"
	};

	var wrap = "";

	var el = {
		getWrap: function getWrap() {
			if (!wrap) {
				wrap = document.getElementsByClassName("sorter-wrap")[0];
			}
			return wrap;
		}
	};

	var initListeners = function initListeners() {
		tappable(".js-sort-switch-main", {
			onTap: function onTap(ev, target) {
				if (Posts.areLoading()) {
					return;
				}
				isHot = !isHot;
				Sorting.change(isHot ? "hot" : "new");
				if (isHot) {
					target.classList.remove(classes["new"]);
				} else {
					target.classList.add(classes["new"]);
				}
			}
		});
	};

	// Exports
	return {
		el: el,
		initListeners: initListeners
	};
})();

/* global
 Menu,
 Posts,
 UI
 */

var Sorting = (function () {

	var current = "hot";

	var get = function get() {
		return current !== "hot" ? current + "/" : "";
	};

	var change = function change(sorting) {
		current = sorting;
		var delay = 1;
		if (Menu.isShowing()) {
			Menu.move(UI.Move.LEFT);
			delay = 301;
		}
		setTimeout(function () {
			Posts.refreshStream();
		}, delay);
	};

	// Exports
	return {
		get: get,
		change: change
	};
})();

/* global
 $,
 $$,
 Store,
 Mustache,
 CurrentSelection,
 UI,
 El,
 Menu,
 Anim,
 Footer,
 SortSwitch,
 is,
 tappable,
 Modal,
 Posts,
 Channels,
 Backup,
 Sorting,
 URLs
 */

var Subreddits = (function () {

	var defaults = ["frontPage", "all", "pics", "IAmA", "AskReddit", "worldNews", "todayilearned", "tech", "science", "reactiongifs", "books", "explainLikeImFive", "videos", "AdviceAnimals", "funny", "aww", "earthporn"],
	    list = [],
	    idLast = "",
	    editing = false,
	    loadedSubs;

	var template = {
		list: "{{#.}}<li data-name='{{.}}' class='sub'>{{.}}</li>{{/.}}",
		toEditList: "<p class='edit-subs-title'>Subreddits</p><ul class='remove-list'>{{#.}}<div class='item-to-edit sub-to-remove' data-name='{{.}}'><p>{{.}}</p><div class='btn-remove-subreddit' data-name='{{.}}'></div></div>{{/.}}</ul>",
		toAddList: "{{#children}}<div class='subreddit'><div><p class='subreddit-title'>{{data.display_name}}</p><p class='subreddit-desc'>{{data.public_description}}</p></div><div class='btn-add-sub'><div></div></div></div>{{/children}}",
		loadMoreSubsButton: "<button class='btn-block btn-simple' id='btn-more-subs'>More</button>",
		formInsert: "<div class=\"new-form\" id=\"form-new-sub\"><div class=\"form-left-corner\"><div class=\"btn-general\" id=\"btn-add-new-sub\">Add Subreddit</div></div><div class=\"close-form\">&times;</div><form><input type=\"text\" id=\"txt-new-sub\" placeholder=\"New subreddit name\" /></form></div>",
		topButtonsForAdding: "<div class='top-buttons'><div id='btn-sub-man'>Insert Manually</div><div id='btn-add-channel'>Create Channel</div></div>"
	};

	var el = {
		list: $("#subs")
	};

	var getList = function () {
		return list;
	};

	var isEditing = function () {
		return editing;
	};

	var insert = function insert(sub) {
		list.push(sub);
		Store.setItem("subreeddits", JSON.stringify(list));
		Backup.shouldUpdate();
	};

	var _delete = function _delete(sub) {
		var idx = list.indexOf(sub);
		list.splice(idx, 1);
		Store.setItem("subreeddits", JSON.stringify(list));
		Backup.shouldUpdate();
	};

	var append = function append(subs) {
		if (subs instanceof Array) {
			el.list.append(Mustache.to_html(template.list, subs));
		} else {
			el.list.append($("<li/>").attr("data-name", subs).addClass("sub").text(subs));
		}
	};

	var detach = function detach(sub) {
		var deletedSub = $(".sub-to-remove[data-name='" + sub + "']");
		deletedSub.addClass("anim-delete");
		setTimeout(function () {
			deletedSub.remove();
		}, 200);

		el.list.find(".sub[data-name=" + sub + "]").remove();
	};

	var setList = function setList(subs) {
		list = subs;
		Store.setItem("subreeddits", JSON.stringify(list));
		Backup.shouldUpdate();
	};

	var listHasSub = function listHasSub(newSub) {
		if (list) {
			newSub = newSub.toLowerCase();
			for (var i = list.length; --i;) {
				var sub = list[i];
				if (sub.toLowerCase() === newSub) {
					return true;
				}
			}
			return false;
		}
		return false;
	};

	var getAllSubsString = function getAllSubsString() {
		var allSubs = "",
		    frontPage = "frontpage",
		    all = "all";
		for (var i = 0; i < list.length; i++) {
			var sub = list[i].toLowerCase();
			if (sub === frontPage || sub === all) {
				continue;
			}
			allSubs += sub + "+";
		}
		return allSubs.substring(0, allSubs.length - 1);
	};

	var loadSaved = function loadSaved() {
		// Only should execute when first loading the app
		var subs = Store.getItem("subreeddits");
		if (subs) {
			subs = JSON.parse(subs);
		}
		list = subs;
		if (!list) {
			// If it hasn't been loaded to the 'local Store', save defaults subreddits
			setList(defaults);
		}
		append(list);
	};

	var loadPosts = function loadPosts(sub) {
		if (sub !== CurrentSelection.getName() || editing) {
			var url;
			if (sub.toLowerCase() === "frontpage") {
				url = URLs.init + "r/" + getAllSubsString() + "/";
			} else {
				url = URLs.init + "r/" + sub + "/";
			}
			Posts.load(url);
			CurrentSelection.setSubreddit(sub);
		}
		UI.setSubTitle(sub);
	};

	var remove = function remove(sub) {
		_delete(sub);
		detach(sub);
		if (CurrentSelection.getType() === CurrentSelection.Types.SUB && CurrentSelection.getName() === sub) {
			// If it was the current selection
			CurrentSelection.setSubreddit("frontPage");
		}
	};

	var add = function add(newSub) {
		if (listHasSub(newSub)) {
			return;
		}
		insert(newSub);
		append(newSub);
	};

	var addFromNewForm = function addFromNewForm() {
		var txtSub = $$.id("txt-new-sub"),
		    subName = txtSub.value;
		if (!subName) {
			txtSub.setAttribute("placeholder", "Enter a subreddit title!");
			Anim.shakeForm();
			return;
		}
		if (listHasSub(subName)) {
			txtSub.value = "";
			txtSub.setAttribute("placeholder", subName + " already added!");
			Anim.shakeForm();
			return;
		}

		subName = subName.trim();

		Anim.bounceOut($(".new-form"), Modal.remove);

		$.ajax({
			url: URLs.init + "r/" + subName + "/" + Sorting.get() + URLs.limitEnd,
			dataType: "jsonp",
			success: function success(data) {
				Posts.loadFromManualInput(data);
				UI.setSubTitle(subName);
				CurrentSelection.setSubreddit(subName);
				add(subName);
				Menu.markSelected({
					name: subName,
					update: true
				});
			},
			error: function error() {
				alert("Oh, the subreddit you entered is not valid...");
			}
		});
	};

	var setEditing = function setEditing( /* boolean */newEditing) {
		if (newEditing === editing) {
			return;
		}
		editing = newEditing;
		if (is.wideScreen) {
			UI.switchDisplay(Footer.el.getRefreshButton(), newEditing);
			UI.switchDisplay(SortSwitch.el.getWrap(), newEditing);
		}
	};

	var loadForAdding = function loadForAdding() {
		if (!is.largeScreen) {
			Menu.move(UI.Move.LEFT);
		}
		if (UI.getCurrentView() === UI.View.COMMENTS) {
			UI.backToMainView();
		}

		setTimeout(function () {
			UI.el.mainWrap[0].scrollTop = 0; // Go to the container top
			var main = UI.el.mainWrap;
			if (loadedSubs) {
				main.empty().append(template.topButtonsForAdding).append(loadedSubs).append(template.loadMoreSubsButton);
			} else {
				main.prepend(UI.template.loader).prepend(template.topButtonsForAdding);
				$.ajax({
					url: URLs.init + "reddits/.json?limit=50&jsonp=?",
					dataType: "jsonp",
					success: function success(list) {
						idLast = list.data.after;
						loadedSubs = Mustache.to_html(template.toAddList, list.data);
						main.empty().append(template.topButtonsForAdding).append(loadedSubs).append(template.loadMoreSubsButton);
					},
					error: function error() {
						$(".loader").addClass("loader-error").text("Error loading subreddits.");
					}
				});
			}
			Posts.setLoading(false);
		}, is.largeScreen ? 1 : 301);
		Menu.cleanSelected();
		UI.setSubTitle("Add Subs");
		setEditing(true);
	};

	var loadForEditing = function loadForEditing() {
		if (!is.largeScreen) {
			Menu.move(UI.Move.LEFT);
		}
		if (UI.getCurrentView() === UI.View.COMMENTS) {
			UI.backToMainView();
		}

		setTimeout(function () {
			UI.el.mainWrap[0].scrollTop = 0; // Up to container top
			var htmlSubs = Mustache.to_html(template.toEditList, list);
			var htmlChannels = "",
			    channelsList = Channels.getList();

			if (channelsList && channelsList.length > 0) {
				htmlChannels = Mustache.to_html("<p class='edit-subs-title'>Channels</p><ul class='remove-list channel-edit-list'>{{#.}} " + Channels.template.singleEditItem + "{{/.}}</ul>", channelsList);
			}

			var html = "<div id=\"remove-wrap\">" + htmlChannels + htmlSubs + "</div>";
			setTimeout(function () {
				// Intentional delay / fix for iOS
				UI.el.mainWrap.html(html);
			}, 10);

			Menu.cleanSelected();
			Posts.setLoading(false);
		}, is.largeScreen ? 1 : 301);

		UI.setSubTitle("Edit Subs");
		setEditing(true);
	};

	var initListeners = function initListeners() {

		// New Subreddit Form
		UI.el.body.on("submit", "#form-new-sub form", function (e) {
			e.preventDefault();
			addFromNewForm();
		});

		tappable("#btn-add-new-sub", {
			onTap: addFromNewForm
		});

		tappable("#btn-add-another-sub", {
			onTap: function onTap() {
				var container = $("#subs-for-channel");
				container.append("<input type='text' placeholder='Extra subreddit'/>");
				container[0].scrollTop = container.height();
			},
			activeClass: "btn-general-active"
		});

		tappable("#btn-sub-man", {
			onTap: function onTap() {
				Modal.show(template.formInsert);
			},
			activeClass: "list-button-active"
		});

		tappable("#btn-more-subs", {
			onTap: function onTap(e, target) {
				$(target).parent().remove();
				var main = UI.el.mainWrap;
				main.append(UI.template.loader);
				$.ajax({
					url: URLs.init + "reddits/" + URLs.end + "&after=" + idLast,
					dataType: "jsonp",
					success: function success(list) {
						var newSubs = Mustache.to_html(template.toAddList, list.data);
						idLast = list.data.after;
						$(".loader", main).remove();
						main.append(newSubs).append(template.loadMoreSubsButton);
						loadedSubs = loadedSubs + newSubs;
					},
					error: function error() {
						$(".loader").addClass("loader-error").text("Error loading more subreddits.");
					}
				});
			}
		});

		tappable(".btn-add-sub", {
			onTap: function onTap(e, target) {
				var parent = $(target).parent(),
				    subTitle = $(".subreddit-title", parent);
				subTitle.css("color", "#2b9900"); // 'adding sub' little UI feedback
				var newSub = subTitle.text();
				add(newSub);
			},
			activeClass: "button-active"
		});

		tappable(".btn-remove-subreddit", {
			onTap: function onTap(e, target) {
				remove($(target).data("name"));
			},
			activeClass: "button-active"
		});
	};

	// Exports
	return {
		getList: getList,
		getAllSubsString: getAllSubsString,
		setEditing: setEditing,
		isEditing: isEditing,
		loadPosts: loadPosts,
		loadForEditing: loadForEditing,
		loadForAdding: loadForAdding,
		loadSaved: loadSaved,
		initListeners: initListeners,
		template: {
			formInsert: template.formInsert
		}
	};
})();

/* global
 $$,
 Store,
 El,
 is,
 Comments,
 Subreddits,
 Channels,
 Posts,
 Footer,
 Header,
 Menu,
 Modal,
 SortSwitch,
 CurrentSelection,
 UI,
 Backup,
 URLs
 */

// Init all modules listeners
UI.initListeners();
Posts.initListeners();
Comments.initListeners();
Subreddits.initListeners();
Channels.initListeners();
Menu.initListeners();
Header.initListeners();
Modal.initListeners();
SortSwitch.initListeners();
Backup.initListeners();

Header.el.postTitle.remove();

if (is.wideScreen) {
	Footer.el.postTitle.text("");
}

CurrentSelection.loadSaved();

Subreddits.loadSaved();
Channels.loadSaved();

if (location.hash) {
	Comments.navigateFromHash();
}

CurrentSelection.execute(function () {
	// If it's a subreddit
	var currentSubName = CurrentSelection.getName();
	Menu.markSelected({ name: currentSubName });
	// Load links
	if (currentSubName.toUpperCase() === "frontPage".toUpperCase()) {
		CurrentSelection.setSubreddit("frontPage");
		Posts.load(URLs.init + "r/" + Subreddits.getAllSubsString() + "/");
	} else {
		Posts.load(URLs.init + "r/" + currentSubName + "/");
	}
	UI.setSubTitle(currentSubName);
}, function () {
	// If it's a channel
	var channel = Channels.getByName(CurrentSelection.getName());
	Menu.markSelected({ type: "channel", name: channel.name });
	Channels.loadPosts(channel);
});

var loadMnml = Store.getItem("mnml"),
    isMnml = loadMnml ? JSON.parse(loadMnml) : false;

UI.switchMnml(false, isMnml);

if (is.mobile) {

	UI.scrollTop();

	var touch = "touchmove";

	$$.id("edit-subs").addEventListener(touch, function (e) {
		e.preventDefault();
	}, false);

	document.getElementsByTagName("header")[0].addEventListener(touch, function (e) {
		if (Menu.isShowing()) {
			e.preventDefault();
		}
	}, false);

	if (is.iPad) {
		UI.iPadScrollFix();
	}

	if (is.iOS7) {
		// apply iOS 7+ theme
		if (!isMnml) {
			UI.switchMnml(true, true);
		}
		document.body.classList.add("ios7");
	}
}

})();