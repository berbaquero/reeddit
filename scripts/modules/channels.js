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

var Channels = (function() {

	const defaults = {
		name: "Media",
		subs: ["movies", "television", "music", "games", "books"]
	};

	const template = {
		singleEditItem: "<div class='item-to-edit channel-to-remove' data-title='{{name}}'><p class='channel-name'>{{name}}</p><div class='btn-edit-channel' data-title='{{name}}'></div><div class='btn-remove-channel' data-title='{{name}}'></div></div>",
		single: '<li class="channel" data-title="{{name}}"><p>{{name}}</p><div>{{#subs}}<p>{{.}}</p>{{/subs}}</div></li>',
		list: '{{#.}}<li class="channel" data-title="{{name}}"><p>{{name}}</p><div>{{#subs}}<p>{{.}}</p>{{/subs}}</div></li>{{/.}}',
		formAddNew: '<div class="new-form" id="form-new-channel"><div class="form-left-corner"><div class="btn-general" id="btn-submit-channel" data-op="save">Add Channel</div></div><div class="close-form">&times;</div><input type="text" id="txt-channel" placeholder="Channel name" /><div id="subs-for-channel"><input class="field-edit-sub" type="text" placeholder="Subreddit 1" /><input class="field-edit-sub" type="text" placeholder="Subreddit 2" /><input class="field-edit-sub" type="text" placeholder="Subreddit 3" /></div><div id="btn-add-another-sub">Add additional subreddit</div></div>',
		formEditChannel: '<div class="new-form" id="form-new-channel"><div class="form-left-corner"><div class="btn-general" id="btn-submit-channel" data-op="update">Update Channel</div></div><div class="close-form">&times;</div><input type="text" id="txt-channel" placeholder="Channel name" /><div id="subs-for-channel"></div><div id="btn-add-another-sub">Add additional subreddit</div></div>'
	};

	var list = [],
		editingNow = '';

	var el = {
		menu: $("#channels")
	};

	var getList = () => list;

	var getURL = function(channel) {
		if (channel.subs.length === 1) { // Reddit API-related hack
			// If there's one subreddit in a "Channel", and this subreddit name's invalid, reddit.com responds with a search-results HTML - not json data - and throws a hard-to-catch error...
			return "r/" + channel.subs[0] + "+" + channel.subs[0]; // Repeating the one subreddit in the URL avoids this problem :)
		} else {
			return "r/" + channel.subs.join("+");
		}
	};

	var insert = function(channel) {
		list.push(channel);
		Store.setItem('channels', JSON.stringify(list));
		Backup.shouldUpdate();
	};

	var _delete = function(name) {
		for(var j = 0; j < list.length; j++) {
			if (list[j].name === name) {
				list.splice(j, 1);
				break;
			}
		}
		Store.setItem('channels', JSON.stringify(list));
		Backup.shouldUpdate();
	};

	var getByName = function(name) {
		var foundChannel;
		for(var i = 0; i < list.length; i++) {
			if (list[i].name.toLowerCase() === name.toLowerCase()) {
				foundChannel = list[i];
				break;
			}
		}
		return foundChannel;
	};

	var append = function(channel) {
		el.menu.append(Mustache.to_html(template.single, channel));
		if (Subreddits.isEditing()) {
			addToEditList(channel.name);
		}
	};

	var loadList = function() {
		el.menu.html(Mustache.to_html(template.list, list));
	};

	var detach = function(name) {
		var deletedChannel = $('.channel-to-remove[data-title="' + name + '"]');
		deletedChannel.addClass("anim-delete");
		setTimeout(function() {
			deletedChannel.remove();
		}, 200);

		$('.channel[data-title="' + name + '"]').remove();
	};

	var addToEditList = function(name) {
		$(".channel-edit-list").append(template.singleEditItem.replace(/\{\{name\}\}/g, name));
	};

	var add = function(title, subreddits) {
		var channel = {
			name: title,
			subs: subreddits
		};
		insert(channel);
		append(channel);
	};

	var loadSaved = function() { // Should only execute when first loading the app
		list = Store.getItem('channels');
		if (list) {
			list = JSON.parse(list);
		} else { // Load defaults channel(s)
			list = [defaults];
		}
		loadList();
	};

	var loadPosts = function(channel) {
		Posts.load(URLs.init + getURL(channel) + '/');
		UI.setSubTitle(channel.name);
		CurrentSelection.setChannel(channel);
	};

	var remove = function(name) {
		_delete(name);
		detach(name);
		// If it was the current selection
		if (CurrentSelection.getType() === CurrentSelection.Types.CHANNEL &&
			CurrentSelection.getName() === name) {
			CurrentSelection.setSubreddit('frontPage');
		}
	};

	var edit = function(name) {
		var channelToEdit = getByName(name);
		Modal.show(template.formEditChannel, function() {
			// Fill form with current values
			$("#txt-channel").val(channelToEdit.name);

			editingNow = channelToEdit.name;
			var $inputsContainer = $("#subs-for-channel");

			for(var i = 0, l = channelToEdit.subs.length; i < l; i++) {

				var inputTemplate = "<input class='field-edit-sub with-clear' type='text' value='{{subName}}'>";

				$inputsContainer.append(inputTemplate.replace("{{subName}}", channelToEdit.subs[i]));
			}
		});
	};

	var initListeners = function() {

		tappable("#btn-submit-channel", {
			onTap: function(e, target) {
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

				for(var i = 0; i < subs.length; i++) {
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

				switch(operation) {
					case "save":
						// Look for Channel name in the saved ones
						var savedChannel = getByName(channelName);
						if (savedChannel) { // If it's already saved
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
			onTap: function() {
				Modal.show(template.formAddNew);
			},
			activeClass: 'list-button-active'
		});

		tappable(".btn-remove-channel", {
			onTap: function(e, target) {
				remove($(target).data('title'));
			},
			activeClass: 'button-active'
		});

		tappable(".btn-edit-channel", {
			onTap: function(e, target) {
				edit(target.getAttribute('data-title'));
			},
			activeClass: 'button-active'
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
