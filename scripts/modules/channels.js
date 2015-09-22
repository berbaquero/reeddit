/* global
 Posts,
 Subreddits,
 Anim,
 UI,
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

	const singleItemTemplate = '<a href="#{{name}}" class="channel pad-x no-ndrln blck" data-title="{{name}}"><div class="channel__title">{{name}}</div><div class="pad-x">{{#subs}}<div class="channel__sub txt-cap txt-ellps">{{.}}</div>{{/subs}}</div></a>';

	const tmpltButtonAddAnotherSub = '<button class="w-100" id="btn-add-another-sub">Add additional subreddit</button>';

	const template = {
		singleEditItem: "<div class='item-to-edit flx channel-to-remove' data-title='{{name}}'><p class='sub-name w-85 txt-cap txt-bld channel-name'>{{name}}</p><a href='#edit' class='flx flx-cntr-x flx-cntr-y w-15 no-ndrln clr-current btn-edit-channel icon-pencil' data-title='{{name}}'></a><a href='#remove' class='flx flx-cntr-x flx-cntr-y w-15 no-ndrln clr-current btn-remove-channel icon-trashcan' data-title='{{name}}'></a></div>",
		single: singleItemTemplate,
		list: `{{#.}}${singleItemTemplate}{{/.}}`,
		formAddNew: `<div class="new-form" id="form-new-channel"><div class="form-left-corner"><button class="btn" id="btn-submit-channel" data-op="save">Add Channel</button></div>${UI.template.closeModalButton}<input type="text" id="txt-channel" placeholder="Channel name" /><div id="subs-for-channel"><input class="field-edit-sub" type="text" placeholder="Subreddit 1" /><input class="field-edit-sub" type="text" placeholder="Subreddit 2" /><input class="field-edit-sub" type="text" placeholder="Subreddit 3" /></div>${tmpltButtonAddAnotherSub}</div>`,
		formEditChannel: `<div class="new-form" id="form-new-channel"><div class="form-left-corner"><button class="btn" id="btn-submit-channel" data-op="update">Update Channel</button></div>${UI.template.closeModalButton}<input type="text" id="txt-channel" placeholder="Channel name" /><div id="subs-for-channel"></div>${tmpltButtonAddAnotherSub}</div>`
	};

	var list = [],
		editingNow = '';

	var el = {
		menu: $("#channels")
	};

	var getList = () => list;

	var getURL = function(channel) {
		if (channel.subs.length === 1) { // [1] Reddit API-related hack
			return "r/" + channel.subs[0] + "+" + channel.subs[0];
		} else {
			return "r/" + channel.subs.join("+");
		}
	};
	// [1] If there's one subreddit in a "Channel",
	// and this subreddit name's invalid,
	// reddit.com responds with a search-results HTML - not json data
	// and throws a hard-to-catch error...
	// Repeating the one subreddit in the URL avoids this problem :)


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

			channelToEdit.subs.map((sub) => {
				const inputTemplate = `<input class='field-edit-sub with-clear' type='text' value='${sub}'>`;
				$inputsContainer.append(inputTemplate);
			});
		});
	};

	var initListeners = function() {

		UI.el.body.on('click', "#btn-submit-channel", (ev) => {
			const target = ev.target;
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
			$(".form-left-corner").append("<div class='clr-white txt-bld channel-added-msg'>'" + channelName + "' " + operation + "d. Cool!</div>");

			Anim.bounceOut($(".new-form"), Modal.remove);
		});

		UI.el.mainWrap.on('click', '#btn-add-channel', () => {
				Modal.show(template.formAddNew);
		});

		UI.el.mainWrap.on('click', '.btn-remove-channel', function(ev) {
			ev.preventDefault();
			remove(this.dataset.title);
		});

		UI.el.mainWrap.on('click', '.btn-edit-channel', function(ev) {
			ev.preventDefault();
			edit(this.dataset.title);
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
