/* global
 Posts,
 Mustache,
 El,
 Footer,
 timeSince,
 Markdown,
 UI
 */

var LinkSummary = (function() {

	const template = `
		<section id='link-summary'>
			<a href='{{url}}' target='_blank'>
				<p id='summary-title'>{{title}}</p>
				<p id='summary-domain'>{{domain}}</p>
				{{#over_18}}
				<span class='link-label summary-label nsfw'>NSFW</span>
				{{/over_18}}
				{{#stickied}}
				<span class='link-label summary-label stickied'>Stickied</span>
				{{/stickied}}
			</a>
			<div id='summary-footer'>
				<p id='summary-author'>by {{author}}</p>
				<a class='btn-general' id='share-tw' target='_blank' href='https://twitter.com/intent/tweet?text=\"{{encodedTitle}}\" —&url={{url}}&via=ReedditApp&related=ReedditApp'>Tweet</a>
			</div>
			<div id='summary-extra'>
				<p id='summary-sub'>{{subreddit}}</p>
				<p id='summary-time'></p>
				<a id='summary-comment-num' title='See comments on reddit.com' href='http://reddit.com{{link}}' target='_blank'>{{num_comments}} comments</a>
			</div>
		</section>`;

	var setPostSummary = function(data, postID) {
		if (!data.link) {
			data.link = data.permalink;
		}
		// Main content
		var summaryHTML = Mustache.to_html(template, data);
		// Check for type of post
		if (data.selftext) { // If it's a self-post
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
		} else { // if it's an image
			var linkURL = Posts.getList()[postID].url;
			var imageLink = checkImageLink(linkURL);
			if (imageLink) { // If it's an image link
				summaryHTML += '<section class="preview-container">' +
				'<img class="image-preview" src="' + imageLink + '" />' +
				'</section>';
			} else { // if it's a YouTube video
				var youTubeID = getYouTubeVideoIDfromURL(linkURL);
				if (youTubeID) {
					summaryHTML += '<section class="preview-container">' +
					'<a href="' + linkURL + '" target="_blank">' +
					'<img class="video-preview" src="http://img.youtube.com/vi/' + youTubeID + '/hqdefault.jpg" />' +
					'</a></section>';
				}
			}
		}
		summaryHTML += "<section id='comments-container'></section>";
		UI.el.detailWrap.append(summaryHTML);
		updatePostTime(data.created_utc);
		Posts.getList()[postID].summary = summaryHTML;
		Footer.el.postTitle.text(data.title);
	};

	var updatePostSummary = function(data, postID) {
		$("#summary-comment-num").text(data.num_comments + (data.num_comments === 1 ? ' comment' : ' comments'));
		// Time ago
		updatePostTime(data.created_utc);
		Posts.getList()[postID].num_comments = data.num_comments;
		Posts.getList()[postID].created_utc = data.created_utc;
	};

	var updatePostTime = function(time) {
		$("#summary-time").text(timeSince(new Date().getTime(), time));
	};

	var checkImageLink = function(url) {
		var matching = url.match(/\.(svg|jpe?g|png|gifv?)(?:[?#].*)?$|(?:imgur\.com|livememe\.com)\/([^?#\/.]*)(?:[?#].*)?(?:\/)?$/);
		if (!matching) {
			return '';
		}
		if (matching[1]) { // normal image link
			if (url.indexOf('.gifv') > 0) {
				url = url.replace('.gifv', '.gif');
			}
			return url;
		} else if (matching[2]) { // imgur or livememe link
			if (matching[0].slice(0, 5) === "imgur") {
				return 'http://imgur.com/' + matching[2] + '.jpg';
			} else if (matching[0].indexOf("livememe.") >= 0) {
				return 'http://i.lvme.me/' + matching[2] + '.jpg';
			} else {
				return null;
			}
		} else {
			return null;
		}
	};

	var getYouTubeVideoIDfromURL = function(url) {
		var matching = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
		if (!matching) {
			return '';
		}
		else {
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
