/* global
 $,
 El,
 Posts,
 Markdown,
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

const Comments = (function() {

	var loading = false,
		replies = {},
		currentThread;

	var setLoading = function(areLoading) {
		loading = areLoading;
	};

	var getCurrentThread = () => currentThread;

	var updateHash = function(id) {
		location.hash = '#comments:' + id;
	};

	var getIdFromHash = function() {
		var match = location.hash.match(/(#comments:)((?:[a-zA-Z0-9]*))/);
		if (match && match[2]) {
			return match[2];
		}
	};

	var navigateFromHash = function() {
		var id = getIdFromHash();
		show(id);
		if (is.wideScreen) {
			Posts.markSelected(id);
		}
	};

	var showLoadError = function(loader) {
		loading = false;
		var error = 'Error loading comments. Refresh to try again.';
		if (is.wideScreen) {
			loader.addClass("loader-error").html(error + '<button class="btn mrgn-cntr-x mrgn-y blck w-33 js-btn-refresh">Refresh</button>');
		}
		else {
			loader.addClass("loader-error").text(error);
		}
		if (!is.desktop) {
			UI.el.detailWrap.append($("<section/>"));
		}
	};

	var load = function(data, baseElement, idParent) {
		var now = new Date().getTime(),
			converter = new Markdown.Converter(),
			com = $("<div/>").addClass('comments-level');
		for(var i = 0; i < data.length; i++) {
			var c = data[i];

			if (c.kind !== "t1") {
				continue;
			}

			var html = converter.makeHtml(c.data.body),
				isPoster = Posts.getList()[currentThread].author === c.data.author,
				permalink = URLs.init + Posts.getList()[currentThread].link + c.data.id,
				commentLink = {
					href: permalink,
					target: "_blank",
					title: "See this comment on reddit.com",
					tabindex: "-1"
				};

			var comment =
				$("<div/>")
					.addClass("comment-wrap")
					.attr('tabindex', '0')
					.append($('<div/>')
						.append($("<div/>")
							.addClass("comment-data")
							.append($("<span/>")
								.addClass(isPoster ? "comment-poster" : "comment-author")
								.text(c.data.author))
							.append($("<a/>")
								.addClass("comment-info no-ndrln")
								.attr(commentLink)
								.text(timeSince(now, c.data.created_utc))))
						.append($("<div/>")
							.addClass("comment-body")
							.html(html)));

			if (c.data.replies &&
				c.data.replies.data.children[0].kind !== "more") {
				comment.append(
					$("<button/>")
						.addClass("btn blck mrgn-cntr-x comments-button js-reply-button")
						.attr("data-comment-id", c.data.id)
						.text("See replies")
				);
				replies[c.data.id] = c.data.replies.data.children;
			}

			com.append(comment);
		}

		baseElement.append(com);

		if (idParent) {
			Posts.getLoaded()[idParent] = com;
		}

		UI.el.detailWrap.find('a')
			.attr('target', '_blank');
	};

	var show = function(id, refresh) {
		if (!Posts.getList()[id]) {
			currentThread = id;

			var loader = UI.addLoader(UI.el.detailWrap);
			loading = true;

			$.ajax({
				dataType: 'jsonp',
				url: URLs.init + "comments/" + id + "/" + URLs.end,
				success: function(result) {
					loader.remove();
					loading = false;

					Posts.setList(result[0].data);
					LinkSummary.setPostSummary(result[0].data.children[0].data, id);

					Header.el.btnNavBack.removeClass(UI.classes.invisible); // Show

					setRest(id, refresh);

					load(result[1].data.children, $('#comments-container'), id);
				},
				error: function() {
					showLoadError(loader);
				}
			});
		} else {
			var delay = 0;
			if (Menu.isShowing()) {
				Menu.move(UI.Move.LEFT);
				delay = 301;
			}
			setTimeout(function() {

				if (loading &&
					currentThread &&
					currentThread === id) {
					return;
				}

				loading = true;
				currentThread = id;

				Header.el.btnNavBack.removeClass(UI.classes.invisible); // Show

				var detail = UI.el.detailWrap;
				detail.empty();

				UI.el.detailWrap[0].scrollTop = 0;

				if (Posts.getLoaded()[id] && !refresh) {
					detail.append(Posts.getList()[id].summary);
					$('#comments-container').append(Posts.getLoaded()[id]);
					LinkSummary.updatePostSummary(Posts.getList()[id], id);
					loading = false;
				} else {
					LinkSummary.setPostSummary(Posts.getList()[id], id);
					var url = URLs.init + Posts.getList()[id].link + URLs.end;

					var loader = UI.addLoader(detail);

					$.ajax({
						dataType: 'jsonp',
						url: url,
						success: function(result) {
							if (currentThread !== id) {
								// In case of trying to load a different thread before this one loaded.
								// TODO: handle this better
								return;
							}
							LinkSummary.updatePostSummary(result[0].data.children[0].data, id);
							loader.remove();
							load(result[1].data.children, $('#comments-container'), id);
							loading = false;
						},
						error: function() {
							showLoadError(loader);
						}
					});
				}

				setRest(id, refresh);

			}, delay);
		}
	};

	var setRest = function(id, refresh) {
		const postTitle = Posts.getList()[id].title;
		let delay = 0;

		if (!refresh) {
			Footer.setPostTitle(postTitle);
		}

		if (!refresh && UI.getCurrentView() !== UI.View.COMMENTS) {
			Anim.slideFromRight();
			delay = 301;
		}

		Header.el.centerSection.empty().append(Header.el.postTitle);
		Header.el.postTitle.text(postTitle);
		Header.el.subtitle.addClass(UI.classes.invisible);

		if (!is.wideScreen) {
			setTimeout(() => {
				UI.el.detailWrap.focus();
			}, delay);
		}
	};

	var initListeners = function() {

		UI.el.detailWrap.on('click', '#comments-container a, #selftext a', function(ev) {
			const imageURL = LinkSummary.checkImageLink(this.href);
			if (imageURL) {
				ev.preventDefault();
				Modal.showImageViewer(imageURL);
			}
		});

		UI.el.detailWrap.on('click', '.js-reply-button', function() {
			const button = $(this),
				commentID = button.attr('data-comment-id'),
				comments = replies[commentID];
			load(comments, button.parent());
			if (is.iOS) {
				$('.comment-active').removeClass('comment-active');
				button.parent().addClass('comment-active');
			}
			button.remove();
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
