/* global
 El,
 tappable,
 Channels,
 Subreddits,
 Modal,
 UI,
 is,
 CurrentSelection
 */

var Menu = (function() {

	const el = {
		mainMenu: $('#main-menu')
	};

	var showing = false;

	var isShowing = () => showing;

	const template = {
		about: "<div class='new-form about-reeddit'><div class='close-form'>&times;</div><ul><li><a href='/about/' target='_blank'>Reeddit Homepage</a></li><li><a href='https://github.com/berbaquero/reeddit' target='_blank'>GitHub Project</a></li></ul><p><a href='https://twitter.com/reedditapp'>@ReedditApp</a></p><p>Built by <a href='http://berbaquero.com' target='_blank'>Bernardo Baquero Stand</a></p></div>"
	};

	const subSelectedClass = 'sub--selected',
		channelSelectedClass = 'channel--selected';


	var move = function(direction) {
		if (is.iPhone && is.iOS7) {
			UI.el.mainView.removeClass(UI.classes.swipe);
			UI.el.detailView.removeClass(UI.classes.swipe);
		}
		if (direction === UI.Move.LEFT) {
			UI.el.mainView.removeClass(UI.classes.showMenu);
			setTimeout(function() {
				showing = false;
			});
		}
		if (direction === UI.Move.RIGHT) {
			UI.el.mainView.addClass(UI.classes.showMenu);
			setTimeout(function() {
				showing = true;
			});
		}
	};

	var markSelected = function(params /* {type, el, name, update} */) {
		var {type, el, name, update} = params;

		if (update) {
			cleanSelected();
		}

		var isChannel = (type && type === 'channel');

		if (el) {
			el.classList.add(isChannel ? channelSelectedClass : subSelectedClass);
			return;
		}

		if (name) {
			let selector = isChannel ?
			'.channel[data-title="' + name + '"]' :
			'.sub[data-name="' + name + '"]';

			var activeSub = document.querySelector(selector);
			activeSub.classList.add(isChannel ? channelSelectedClass : subSelectedClass);
		}
	};

	var cleanSelected = function() {
		$(".sub.sub--selected").removeClass(subSelectedClass);
		$(".channel.channel--selected").removeClass(channelSelectedClass);
	};

	var initListeners = function() {

		tappable('.channel', {
			onTap: function(e, target) {
				var channelName = target.getAttribute('data-title');
				Menu.move(UI.Move.LEFT);
				if (channelName === CurrentSelection.getName() && !Subreddits.isEditing()) {
					return;
				}
				Menu.markSelected({type: 'channel', el: target, update: true});
				if (UI.getCurrentView() === UI.View.COMMENTS) {
					UI.backToMainView();
				}
				Channels.loadPosts(Channels.getByName(channelName));
			},
			activeClassDelay: 100,
			activeClass: "channel--active"
		});

		el.mainMenu.on('click', '.sub', function(ev) {
			ev.preventDefault();
			const target = ev.target;
			var subredditName = $(target).first().text();
			Menu.move(UI.Move.LEFT);
			Subreddits.loadPosts(subredditName);
			markSelected({el: target, update: true});
			if (UI.getCurrentView() === UI.View.COMMENTS) {
				UI.backToMainView();
			}
		});

		tappable("#btn-new-sub", {
			onTap: function() {
				Modal.show(Subreddits.template.formInsert);
			}
		});

		tappable("#btn-new-channel", {
			onTap: function() {
				Modal.show(Channels.template.formAddNew);
			}
		});

		tappable("#btn-add-subs", {
			onTap: Subreddits.loadForAdding
		});

		tappable("#btn-edit-subs", {
			onTap: Subreddits.loadForEditing
		});

		tappable("#about", {
			onTap: function() {
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
