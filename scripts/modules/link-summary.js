/* global
 Posts,
 Mustache,
 El,
 Footer,
 timeSince,
 Markdown,
 UI,
 Modal
 */

var LinkSummary = (function() {

	const template = `
		<section id='link-summary'>
			<a href='{{url}}'
			   target='_blank'
			   class='no-ndrln'>
				<span id='summary-title'
					  class='pad-x txt-bld blck'>{{title}}</span>
				<span id='summary-domain'
					  class='pad-x txt-bld'>{{domain}}</span>
				{{#over_18}}
				<span class='link-label txt-bld summary-label nsfw'>NSFW</span>
				{{/over_18}}
				{{#stickied}}
				<span class='link-label txt-bld summary-label stickied'>Stickied</span>
				{{/stickied}}
			</a>
			<div id='summary-footer'>
				<span id='summary-author'
					  class='pad-x txt-bld'>by {{author}}</span>
				<a class='btn mrgn-x no-ndrln'
				   id='share-tw'
				   target='_blank'
				   href='https://twitter.com/intent/tweet?text=\"{{encodedTitle}}\" —&url={{url}}&via=ReedditApp&related=ReedditApp'>Tweet</a>
			</div>
			<div class='ls-extra flx flx-spc-btwn-x txt-bld'>
				<span class='w-33'
					  id='summary-sub'>{{subreddit}}</span>
				<span class='w-33 txt-cntr'
					  id='summary-time'></span>
				<a class='w-33 no-ndrln txt-r clr-current'
				   id='summary-comment-num'
				   title='See comments on reddit.com'
				   href='http://reddit.com{{link}}'
				   target='_blank'>{{num_comments}} comments</a>
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
			summaryHTML += "<section id='selftext' class='pad-x mrgn-x mrgn-y'>" + selfText + "</section>";
		} else { // if it's an image
			var linkURL = Posts.getList()[postID].url;
			var imageLink = checkImageLink(linkURL);
			if (imageLink) { // If it's an image link
				summaryHTML +=
					'<a href="#preview" class="preview-container blck js-img-preview" data-img="' + imageLink + '">' +
					'<img class="image-preview" src="' + imageLink + '" />' +
					'</a>';
			} else { // if it's a YouTube video
				var youTubeID = getYouTubeVideoIDfromURL(linkURL);
				if (youTubeID) {
					summaryHTML +=
						`<a class="preview-container blck" 
								href="${linkURL}" 
								target="_blank">
						 <img class="video-preview" 
						      src="//img.youtube.com/vi/${youTubeID}/hqdefault.jpg"/>
						 </a>`;
				} else { // if it's a Gfycat or RedGifs link
					var gfycatID = getGfycatIDfromURL(linkURL);
					var redGifsID = getRedGifsIDfromURL(linkURL);
					if (gfycatID) {
						summaryHTML +=
							"<div style='position:relative; padding-bottom:56.69%'>" +
							"<iframe src='https://gfycat.com/ifr/" + gfycatID + "' frameborder='0' scrolling='no' width='100%' height='100%' style='position:absolute;top:0;left:0;' allowfullscreen></iframe>" +
							"</div>";
					} else if (redGifsID) {
						summaryHTML +=
							"<div style='position:relative; padding-bottom:56.69%'>" +
							"<iframe src='https://redgifs.com/ifr/" + redGifsID + "' frameborder='0' scrolling='no' width='100%' height='100%' style='position:absolute;top:0;left:0;' allowfullscreen></iframe>" +
							"</div>";
					}
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
		var matching = url.match(/\.(svg|jpe?g|png|gifv?)(?:[?#].*)?$|(?:imgur\.com|livememe\.com|reddituploads\.com)\/([^?#\/.]*)(?:[?#].*)?(?:\/)?$/);
		if (!matching) {
			return '';
		}
		if (matching[1]) { // normal image link
			if (url.indexOf('.gifv') > 0) {
				url = url.replace('.gifv', '.gif');
			}
			if (url.indexOf('imgur.com') >= 0) {
				url = url.replace(/^htt(p|ps):/, '');
			}
			return url;
		} else if (matching[2]) {
			if (matching[0].slice(0, 5) === "imgur") { // imgur
				return `//imgur.com/${matching[2]}.jpg`;
			} else if (matching[0].indexOf("livememe.") >= 0) { // livememe
				return `http://i.lvme.me/${matching[2]}.jpg`;
			} else if (matching[0].indexOf("reddituploads.") >= 0) { // reddit media
        return matching.input;
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

	var getGfycatIDfromURL = function getGfycatIDfromURL(url) {
		var matching = url.match(/gfycat.com\/(gifs\/detail\/)?(\w+)/i);
		if (!matching) {
			return '';
		} else {
			if (matching && matching.length > 2) {
				return matching[2];
			} else {
				return null;
			}
		}
	};

	var getRedGifsIDfromURL = function getRedGifsIDfromURL(url) {
		var matching = url.match(/redgifs.com\/(?:(?:ifr|watch)\/)(\w+)/i);
		if (!matching) {
			return '';
		} else {
			if (matching && matching.length > 1) {
				console.log(matching[1]);
				return matching[1];
			} else {
				return null;
			}
		}
	};

	const initListeners = () => {
		UI.el.detailWrap.on('click', '.js-img-preview', function(ev) {
			ev.preventDefault();
			Modal.showImageViewer(this.dataset.img);
		});
	};

	// Exports
	return {
		setPostSummary: setPostSummary,
		updatePostSummary: updatePostSummary,
		checkImageLink: checkImageLink,
		initListeners: initListeners
	};

})();
