/* global $, M, V, C, tappable, loadingLinks,
loadingComments, urlInit, doByCurrentSelection,
goToComments, openPost, getCommentHash, showingMenu,
isWideScreen, isDesktop */

var Posts = {

	template: "{{#children}}" +
	"<article class='link-wrap'>" +
	"<div class='link js-link' data-id='{{data.id}}'>" +
	"<div class='link-thumb'>" +
	"<div style='background-image: url({{data.thumbnail}})'></div>" +
	"</div>" +
	"<div class='link-info'>" +
	"<a href='{{data.url}}' data-id='{{data.id}}' target='_blank' class='link-title js-post-title'>{{data.title}}</a>" +
	"<p class='link-domain'>{{data.domain}}</p>" +
	"<p class='link-sub'>{{data.subreddit}}</p>" +
	"{{#data.over_18}}<span class='link-label nsfw'>NSFW</span>{{/data.over_18}}" +
	"{{#data.stickied}}<span class='link-label stickied'>Stickied</span>{{/data.stickied}}" +
	"</div>" +
	"</div>" +
	"<div class='to-comments' data-id='{{data.id}}'>" +
	"<div class='comments-icon'></div>" +
	"</div>" +
	"</article>" +
	"{{/children}}" +
	"<button id='btn-load-more-posts' class='btn-block btn-general'>More</button>" +
	"<div id='main-overflow'></div>",

	el: {
		moreButton: function() {
			return $('#btn-load-more-posts');
		}
	},

	load: function(baseUrl, paging) {
		if (loadingLinks) {
			return;
		}
		loadingLinks = true;
		loadingComments = false;
		setEditingSubs(false);
		var main = V.mainWrap;
		if (paging) {
			Posts.el.moreButton().remove(); // remove current button
			main.append(T.loader);
		} else {
			V.mainWrap[0].scrollTop = 0; // to container top
			setTimeout(function() {
				main.prepend(T.loader);
			}, showingMenu ? 301 : 1);
			paging = ''; // empty string, to avoid pagination
		}
		$.ajax({
			dataType: 'jsonp',
			url: baseUrl + C.Sorting.get() + urlLimitEnd + paging,
			success: function(result) {
				Posts.show(result, paging);
			},
			error: function() {
				loadingLinks = false;
				$('.loader').addClass("loader-error").text('Error loading links. Refresh to try again.');
			}
		});
	},

	loadFromManualInput: function(loadedLinks) {
		Posts.show(loadedLinks);
		V.mainWrap[0].scrollTop = 0;
		setEditingSubs(false);
	},

	render: function(links, paging) { // links: API raw data
		var linksCount = links.children.length,
			main = V.mainWrap;

		if (paging) $(".loader").remove();
		else {
			if (isDesktop) {
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
			} else main.prepend('<div class="loader loader-error">No Links available.</div><div id="main-overflow"></div>');
		} else {
			// Add new links to the list
			main.append(Mustache.to_html(Posts.template, links));

			// Remove thumbnail space for those links with invalid backgrounds.
			var thumbs = $('.link-thumb > div'),
				bgImg = 'background-image: ';
			for(var i = 0; i < thumbs.length; i++) {
				var thumb = $(thumbs[i]),
					bg = thumb.attr('style');
				if (bg === bgImg + 'url()' || bg === bgImg + 'url(default)' || bg === bgImg + 'url(nsfw)' || bg === bgImg + 'url(self)') thumb.parent().remove();
			}
		}
		if (linksCount < 30) {
			// Remove 'More links' button if there are less than 30 links
			Posts.el.moreButton().remove();
		}
		if (!isDesktop) {
			V.Misc.scrollFixLinks();
		}
		if (!paging) {
			V.Anims.reveal(main);
		}
	},

	show: function(result, paging) {
		var links = result.data;
		loadingLinks = false;
		Posts.idLast = links.after;

		Posts.render(links, paging);
		Posts.setList(links);
		if (isWideScreen) {
			var id = getCommentHash();
			if (id) {
				V.Actions.setSelectedLink(id);
			}
		}
	},

	list: {},

	setList: function(posts) {
		for(var i = 0; i < posts.children.length; i++) {
			var post = posts.children[i];
			if (Posts.list[post.data.id]) { // if already cached
				Posts.list[post.data.id].num_comments = post.data.num_comments;
				Posts.list[post.data.id].created_utc = post.data.created_utc;
			} else { // if not yet cached
				Posts.list[post.data.id] = {
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
	},

	idLast: ''
};

tappable(".js-link", {
	onTap: function(e, target) {
		if (!isWideScreen) {
			return;
		}
		var id = target.getAttribute('data-id');
		goToComments(id);
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
		openPost(url, id);
	},
	allowClick: false
});

tappable(".to-comments", {
	onTap: function(e, target) {
		var id = target.getAttribute('data-id');
		goToComments(id);
	},
	activeClass: 'button-active',
	activeClassDelay: 100
});

tappable('#btn-load-more-posts', {
	onTap: function() {
		doByCurrentSelection(function() {
			var url;
			if (M.currentSelection.name.toLowerCase() === 'frontpage') {
				url = urlInit + "r/" + M.Subreddits.getAllSubsString() + "/";
			} else {
				url = urlInit + "r/" + M.currentSelection.name + "/";
			}
			Posts.load(url, '&after=' + Posts.idLast);
		}, function() {
			var channel = M.Channels.getByName(M.currentSelection.name);
			Posts.load(urlInit + M.Channels.getURL(channel) + '/', '&after=' + Posts.idLast);
		});
	}
});
