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

var Subreddits = (function() {

	var defaults = ["frontPage", "all", "pics", "IAmA", "AskReddit", "worldNews", "todayilearned", "tech", "science", "reactiongifs", "books", "explainLikeImFive", "videos", "AdviceAnimals", "funny", "aww", "earthporn"],
		list = [],
		idLast = '',
		editing = false,
		loadedSubs;

	var template = {
		list: "{{#.}}<li data-name='{{.}}' class='sub'>{{.}}</li>{{/.}}",
		toEditList: "<p class='edit-subs-title'>Subreddits</p><ul class='remove-list'>{{#.}}<div class='item-to-edit sub-to-remove' data-name='{{.}}'><p>{{.}}</p><div class='btn-remove-subreddit' data-name='{{.}}'></div></div>{{/.}}</ul>",
		toAddList: "{{#children}}<div class='subreddit'><div><p class='subreddit-title'>{{data.display_name}}</p><p class='subreddit-desc'>{{data.public_description}}</p></div><div class='btn-add-sub'><div></div></div></div>{{/children}}",
		loadMoreSubsButton: "<button class='btn-block btn-simple' id='btn-more-subs'>More</button>",
		formInsert: '<div class="new-form" id="form-new-sub"><div class="form-left-corner"><div class="btn-general" id="btn-add-new-sub">Add Subreddit</div></div><div class="close-form">&times;</div><form><input type="text" id="txt-new-sub" placeholder="New subreddit name" /></form></div>',
		topButtonsForAdding: "<div class='top-buttons'><div id='btn-sub-man'>Insert Manually</div><div id='btn-add-channel'>Create Channel</div></div>"
	};

	var el = {
		list: $("#subs")
	};

	var getList = () => list;

	var isEditing = () => editing;

	var insert = function(sub) {
		list.push(sub);
		Store.setItem("subreeddits", JSON.stringify(list));
		Backup.shouldUpdate();
	};

	var _delete = function(sub) {
		var idx = list.indexOf(sub);
		list.splice(idx, 1);
		Store.setItem("subreeddits", JSON.stringify(list));
		Backup.shouldUpdate();
	};

	var append = function(subs) {
		if (subs instanceof Array) {
			el.list.append(Mustache.to_html(template.list, subs));
		} else {
			el.list.append($("<li/>").attr("data-name", subs).addClass("sub").text(subs));
		}
	};

	var detach = function(sub) {
		var deletedSub = $(".sub-to-remove[data-name='" + sub + "']");
		deletedSub.addClass("anim-delete");
		setTimeout(function() {
			deletedSub.remove();
		}, 200);

		el.list.find(".sub[data-name=" + sub + "]").remove();
	};

	var setList = function(subs) {
		list = subs;
		Store.setItem("subreeddits", JSON.stringify(list));
		Backup.shouldUpdate();
	};

	var listHasSub = function(newSub) {
		if (list) {
			newSub = newSub.toLowerCase();
			for(var i = list.length; --i;) {
				var sub = list[i];
				if (sub.toLowerCase() === newSub) {
					return true;
				}
			}
			return false;
		}
		return false;
	};

	var getAllSubsString = function() {
		var allSubs = '',
			frontPage = 'frontpage',
			all = 'all';
		for(var i = 0; i < list.length; i++) {
			var sub = list[i].toLowerCase();
			if (sub === frontPage ||
				sub === all) {
				continue;
			}
			allSubs += sub + '+';
		}
		return allSubs.substring(0, allSubs.length - 1);
	};

	var loadSaved = function() { // Only should execute when first loading the app
		var subs = Store.getItem("subreeddits");
		if (subs) {
			subs = JSON.parse(subs);
		}
		list = subs;
		if (!list) { // If it hasn't been loaded to the 'local Store', save defaults subreddits
			setList(defaults);
		}
		append(list);
	};

	var loadPosts = function(sub) {
		if (sub !== CurrentSelection.getName() || editing) {
			var url;
			if (sub.toLowerCase() === 'frontpage') {
				url = URLs.init + "r/" + getAllSubsString() + "/";
			} else {
				url = URLs.init + "r/" + sub + "/";
			}
			Posts.load(url);
			CurrentSelection.setSubreddit(sub);
		}
		UI.setSubTitle(sub);
	};

	var remove = function(sub) {
		_delete(sub);
		detach(sub);
		if (CurrentSelection.getType() === CurrentSelection.Types.SUB &&
			CurrentSelection.getName() === sub) { // If it was the current selection
			CurrentSelection.setSubreddit('frontPage');
		}
	};

	var add = function(newSub) {
		if (listHasSub(newSub)) {
			return;
		}
		insert(newSub);
		append(newSub);
	};

	var addFromNewForm = function() {
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
			dataType: 'jsonp',
			success: function(data) {
				Posts.loadFromManualInput(data);
				UI.setSubTitle(subName);
				CurrentSelection.setSubreddit(subName);
				add(subName);
				Menu.markSelected({
					name: subName,
					update: true
				});
			},
			error: function() {
				alert('Oh, the subreddit you entered is not valid...');
			}
		});
	};

	var setEditing = function(/* boolean */ newEditing) {
		if (newEditing === editing) {
			return;
		}
		editing = newEditing;
		if (is.wideScreen) {
			UI.switchDisplay(Footer.el.getRefreshButton(), newEditing);
			UI.switchDisplay(SortSwitch.el.getWrap(), newEditing);
		}
	};

	var loadForAdding = function() {
		if (!is.largeScreen) {
			Menu.move(UI.Move.LEFT);
		}
		if (UI.getCurrentView() === UI.View.COMMENTS) {
			UI.backToMainView();
		}

		setTimeout(function() {
			UI.el.mainWrap[0].scrollTop = 0; // Go to the container top
			var main = UI.el.mainWrap;
			if (loadedSubs) {
				main.empty().append(template.topButtonsForAdding).append(loadedSubs).append(template.loadMoreSubsButton);
			} else {
				main.prepend(UI.template.loader).prepend(template.topButtonsForAdding);
				$.ajax({
					url: URLs.init + "reddits/.json?limit=50&jsonp=?",
					dataType: 'jsonp',
					success: function(list) {
						idLast = list.data.after;
						loadedSubs = Mustache.to_html(template.toAddList, list.data);
						main.empty().append(template.topButtonsForAdding).append(loadedSubs).append(template.loadMoreSubsButton);
					},
					error: function() {
						$('.loader').addClass("loader-error").text('Error loading subreddits.');
					}
				});
			}
			Posts.setLoading(false);
		}, is.largeScreen ? 1 : 301);
		Menu.cleanSelected();
		UI.setSubTitle("Add Subs");
		setEditing(true);
	};

	var loadForEditing = function() {
		if (!is.largeScreen) {
			Menu.move(UI.Move.LEFT);
		}
		if (UI.getCurrentView() === UI.View.COMMENTS) {
			UI.backToMainView();
		}

		setTimeout(function() {
			UI.el.mainWrap[0].scrollTop = 0; // Up to container top
			var htmlSubs = Mustache.to_html(template.toEditList, list);
			var htmlChannels = '',
				channelsList = Channels.getList();

			if (channelsList && channelsList.length > 0) {
				htmlChannels = Mustache.to_html("<p class='edit-subs-title'>Channels</p><ul class='remove-list channel-edit-list'>{{#.}} " + Channels.template.singleEditItem + "{{/.}}</ul>", channelsList);
			}

			var html = '<div id="remove-wrap">' + htmlChannels + htmlSubs + "</div>";
			setTimeout(function() { // Intentional delay / fix for iOS
				UI.el.mainWrap.html(html);
			}, 10);

			Menu.cleanSelected();
			Posts.setLoading(false);

		}, is.largeScreen ? 1 : 301);

		UI.setSubTitle('Edit Subs');
		setEditing(true);
	};

	var initListeners = function() {

		// New Subreddit Form
		UI.el.body.on('submit', '#form-new-sub form', function(e) {
			e.preventDefault();
			addFromNewForm();
		});

		tappable("#btn-add-new-sub", {
			onTap: addFromNewForm
		});

		tappable("#btn-add-another-sub", {
			onTap: function() {
				var container = $("#subs-for-channel");
				container.append("<input type='text' placeholder='Extra subreddit'/>");
				container[0].scrollTop = container.height();
			},
			activeClass: "btn-general-active"
		});

		tappable("#btn-sub-man", {
			onTap: function() {
				Modal.show(template.formInsert);
			},
			activeClass: 'list-button-active'
		});

		tappable('#btn-more-subs', {
			onTap: function(e, target) {
				$(target).parent().remove();
				var main = UI.el.mainWrap;
				main.append(UI.template.loader);
				$.ajax({
					url: URLs.init + 'reddits/' + URLs.end + '&after=' + idLast,
					dataType: 'jsonp',
					success: function(list) {
						var newSubs = Mustache.to_html(template.toAddList, list.data);
						idLast = list.data.after;
						$('.loader', main).remove();
						main.append(newSubs).append(template.loadMoreSubsButton);
						loadedSubs = loadedSubs + newSubs;
					},
					error: function() {
						$('.loader').addClass('loader-error').text('Error loading more subreddits.');
					}
				});
			}
		});

		tappable('.btn-add-sub', {
			onTap: function(e, target) {
				var parent = $(target).parent(),
					subTitle = $(".subreddit-title", parent);
				subTitle.css("color", "#2b9900"); // 'adding sub' little UI feedback
				var newSub = subTitle.text();
				add(newSub);
			},
			activeClass: 'button-active'
		});

		tappable(".btn-remove-subreddit", {
			onTap: function(e, target) {
				remove($(target).data('name'));
			},
			activeClass: 'button-active'
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
