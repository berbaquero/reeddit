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

var Posts = (function() {

	const template = `
		{{#children}}
			<article class='link-wrap'>
				<div class='link pad-y pad-x js-link' data-id='{{data.id}}'>
					<div class='link-thumb'>
						<div style='background-image: url({{data.thumbnail}})'></div>
					</div>
					<div class='link-info'>
						<a href='{{data.url}}'
						   data-id='{{data.id}}'
						   target='_blank'
						   class='link-title js-post-title'>
						{{data.title}}
						</a>
						<div class='link-domain'>{{data.domain}}</div>
						<div class='link-sub'>{{data.subreddit}}</div>
						{{#data.over_18}}
						<span class='link-label nsfw'>NSFW</span>
						{{/data.over_18}}
						{{#data.stickied}}
						<span class='link-label stickied'>Stickied</span>
						{{/data.stickied}}
					</div>
				</div>
				<div class='to-comments' data-id='{{data.id}}'>
					<div class='comments-icon'></div>
				</div>
			</article>
		{{/children}}
		<button id='btn-load-more-posts' class='btn-block btn-simple'>More</button>
		<div id='main-overflow'></div>`;

	var loading = false,
		list = {},
		loaded = {},
		idLast = '';

	var el = {
		moreButton: function() {
			return $('#btn-load-more-posts');
		}
	};

	var getList = () => list;

	var getLoaded = () => loaded;

	var setLoading = function(newLoading) {
		loading = newLoading;
	};

	var areLoading = () => loading;

	var open = function(url, id) {
		var link = list[id];
		if (link.self || is.wideScreen) {
			Comments.updateHash(id);
		} else {
			triggerClick(url);
		}
	};

	var load = function(baseUrl, paging) {
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
			setTimeout(function() {
				main.prepend(UI.template.loader);
			}, Menu.isShowing() ? 301 : 1);
			paging = ''; // empty string, to avoid pagination
		}
		$.ajax({
			dataType: 'jsonp',
			url: baseUrl + Sorting.get() + URLs.limitEnd + paging,
			success: function(result) {
				show(result, paging);
			},
			error: function() {
				loading = false;
				$('.loader').addClass("loader-error").text('Error loading links. Refresh to try again.');
			}
		});
	};

	var loadFromManualInput = function(loadedLinks) {
		show(loadedLinks);
		UI.el.mainWrap[0].scrollTop = 0;
		Subreddits.setEditing(false);
	};

	var render = function(links, paging) { // links: API raw data
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
			var message = $('.loader');
			if (message) {
				message.text('No Links available.');
				message.addClass('loader-error');
				main.append('<div id="#main-overflow"></div>');
			} else {
				main.prepend('<div class="loader loader-error">No Links available.</div><div id="main-overflow"></div>');
			}
		} else {
			// Add new links to the list
			main.append(Mustache.to_html(template, links));

			// Remove thumbnail space for those links with invalid backgrounds.
			var thumbs = $('.link-thumb > div'),
				bgImg = 'background-image: ';
			for(var i = 0; i < thumbs.length; i++) {
				var thumb = $(thumbs[i]),
					bg = thumb.attr('style');
				if (bg === bgImg + 'url()' || bg === bgImg + 'url(default)' || bg === bgImg + 'url(nsfw)' || bg === bgImg + 'url(self)') {
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

	var show = function(result, paging) {
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

	var setList = function(posts) {
		for(var i = 0; i < posts.children.length; i++) {
			var post = posts.children[i];
			if (list[post.data.id]) { // if already cached
				list[post.data.id].num_comments = post.data.num_comments;
				list[post.data.id].created_utc = post.data.created_utc;
			} else { // if not yet cached
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

	var refreshStream = function() {
		if (Subreddits.isEditing()) {
			return;
		}
		CurrentSelection.execute(function() { // if it's subreddit
			if (CurrentSelection.getName().toLowerCase() === 'frontpage') {
				load(URLs.init + "r/" + Subreddits.getAllSubsString() + "/");
			} else {
				load(URLs.init + "r/" + CurrentSelection.getName() + "/");
			}
		}, function() { // if it's channel
			Channels.loadPosts(Channels.getByName(CurrentSelection.getName()));
		});
	};

	var markSelected = function(id) {
		$(".link.link-selected").removeClass("link-selected");
		$('.link[data-id="' + id + '"]').addClass('link-selected');
	};

	var clearSelected = function() {
		$('.link.link-selected').removeClass('link-selected');
	};

	var triggerClick = function(url) {
		var a = document.createElement('a');
		a.setAttribute("href", url);
		a.setAttribute("target", "_blank");

		var clickEvent = new MouseEvent("click", {
			"view": window,
			"bubbles": true,
			"cancelable": false
		});

		a.dispatchEvent(clickEvent);
	};

	var initListeners = function() {

		tappable(".js-link", {
			onTap: function(e, target) {
				if (!is.wideScreen) {
					return;
				}
				var id = target.getAttribute('data-id');
				Comments.updateHash(id);
			},
			allowClick: false,
			activeClassDelay: 100,
			inactiveClassDelay: 200,
			activeClass: 'link-active'
		});

		tappable('.js-post-title', {
			onTap: function(e) {
				var id = e.target.getAttribute('data-id'),
					url = e.target.href;
				open(url, id);
			},
			allowClick: false
		});

		tappable(".to-comments", {
			onTap: function(e, target) {
				var id = target.getAttribute('data-id');
				Comments.updateHash(id);
			},
			activeClass: 'btn-list--active',
			activeClassDelay: 100
		});

		tappable('#btn-load-more-posts', {
			onTap: function() {
				CurrentSelection.execute(function() {
					var url;
					if (CurrentSelection.getName().toLowerCase() === 'frontpage') {
						url = URLs.init + "r/" + Subreddits.getAllSubsString() + "/";
					} else {
						url = URLs.init + "r/" + CurrentSelection.getName() + "/";
					}
					load(url, '&after=' + idLast);
				}, function() {
					var channel = Channels.getByName(CurrentSelection.getName());
					load(URLs.init + Channels.getURL(channel) + '/', '&after=' + idLast);
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
