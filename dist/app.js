(function(win) {
'use strict';

var doc = win.document,
    body = doc.body;

function $id(id) {
    return doc.getElementById(id);
}

function $query(query) {
    return doc.querySelector(query);
}

// Pseudo-Globals
var editingSubs = false,
    urlInit = "http://www.reddit.com/",
    urlEnd = ".json?jsonp=?",
    urlLimitEnd = ".json?limit=30&jsonp=?",
    loadedLinks = {},
    replies = {},
    showingMenu = false,
    subreddits,
    store = win.fluid ? allCookies : win.localStorage,
    isModal = false,
    loadingComments = false,
    loadingLinks = false,
    currentThread,
    iPadScrollFix,
    currentSortingChoice = 'hot',
    mnml = false,
    updateBackup = 1,
    gists = {
        url: "https://api.github.com/gists",
        fileURL: ''
    },
    // Pseudo-Enums
    move = {
        left: 1,
        right: 2
    },
    view = {
        main: 1,
        comments: 2
    },
    selection = {
        sub: 1,
        channel: 2
    },
    css = {
        showView: "show-view",
        showMenu: "show-menu",
        mnml: "mnml",
        hide: "hide"
    },
    currentView = view.main;

var defaultSubs = ["frontPage", "all", "pics", "IAmA", "AskReddit", "worldNews", "todayilearned", "tech", "science", "reactiongifs", "books", "explainLikeImFive", "videos", "AdviceAnimals", "funny", "aww", "earthporn"];

var defaultChannel = {
    name: "Media",
    subs: ["movies", "television", "music", "games"]
};

// Breakpoints
var wideScreenBP = win.matchMedia("(min-width: 1000px)"),
	largeScreenBP = win.matchMedia("(min-width: 490px)"),
	isWideScreen = wideScreenBP.matches,
	isLargeScreen = largeScreenBP.matches;

// Browser Detection
var UA = win.navigator.userAgent,
	isMobile = !isDesktop,
	isiPhone = /iP(hone|od)/.test(UA),
	isiPad = /iPad/.test(UA),
	isiOS = isiPad || isiPhone,
	isiOS7 = isiOS && parseInt(UA.match(/ OS (\d+)_/i)[1], 10) >= 7;

var T = { // Templates
    Posts: "{{#children}}<article class='link-wrap'><div class='link js-link' data-id='{{data.id}}'><div class='link-thumb'><div style='background-image: url({{data.thumbnail}})'></div></div><div class='link-info'><a href='{{data.url}}' data-id='{{data.id}}' target='_blank' class='link-title js-post-title'>{{data.title}}</a><p class='link-domain'>{{data.domain}}</p><p class='link-sub'>{{data.subreddit}}</p>{{#data.over_18}}<span class='link-label nsfw'>NSFW</span>{{/data.over_18}}{{#data.stickied}}<span class='link-label stickied'>Stickied</span>{{/data.stickied}}</div></div><div class='to-comments' data-id='{{data.id}}'><div class='comments-icon'></div></div></article>{{/children}}<div class='list-button'><span id='more-links'>More</span></div><div id='main-overflow'></div>",
    Subreddits: {
        list: "{{#.}}<li data-name='{{.}}'><p class='sub'>{{.}}</p></li>{{/.}}",
        toEditList: "<p class='edit-subs-title'>Subreddits</p><ul class='remove-list'>{{#.}}<div class='item-to-edit sub-to-remove' data-name='{{.}}'><p>{{.}}</p><div class='btn-remove-subreddit' data-name='{{.}}'></div></div>{{/.}}</ul>",
        toAddList: "{{#children}}<div class='subreddit'><div><p class='subreddit-title'>{{data.display_name}}</p><p class='subreddit-desc'>{{data.public_description}}</p></div><div class='btn-add-sub'><div></div></div></div>{{/children}}"
    },
    Channels: {
        singleEditItem: "<div class='item-to-edit channel-to-remove' data-title='{{name}}'><p class='channel-name'>{{name}}</p><div class='btn-edit-channel' data-title='{{name}}'></div><div class='btn-remove-channel' data-title='{{name}}'></div></div>",
        single: '<li><div class="channel" data-title="{{name}}"><p>{{name}}</p><div>{{#subs}}<p>{{.}}</p>{{/subs}}</div></div></li>',
        list: '{{#.}}<li><div class="channel" data-title="{{name}}"><p>{{name}}</p><div>{{#subs}}<p>{{.}}</p>{{/subs}}</div></div></li>{{/.}}'
    },
    linkSummary: "<section id='link-summary'><a href='{{url}}' target='_blank'><p id='summary-title'>{{title}}</p><p id='summary-domain'>{{domain}}</p>{{#over_18}}<span class='link-label summary-label nsfw'>NSFW</span>{{/over_18}}{{#stickied}}<span class='link-label summary-label stickied'>Stickied</span>{{/stickied}}</a><div id='summary-footer'><p id='summary-author'>by {{author}}</p><a class='btn-general' id='share-tw' target='_blank' href='https://twitter.com/intent/tweet?text=\"{{encodedTitle}}\" —&url={{url}}&via=ReedditApp&related=ReedditApp'>Tweet</a></div><div id='summary-extra'><p id='summary-sub'>{{subreddit}}</p><p id='summary-time'></p><a id='summary-comment-num' title='See comments on reddit.com' href='http://reddit.com{{link}}' target='_blank'>{{num_comments}} comments</a></section>",
    botonAgregarSubManual: "<div class='top-buttons'><div id='btn-sub-man'>Insert Manually</div><div id='btn-add-channel'>Create Channel</div></div>",
    formAgregarSubManual: '<div class="new-form" id="form-new-sub"><div class="form-left-corner"><div class="btn-general" id="btn-add-new-sub">Add Subreddit</div></div><div class="close-form">&times;</div><form><input type="text" id="txt-new-sub" placeholder="New subreddit name" /></form></div>',
    formAddNewChannel: '<div class="new-form" id="form-new-channel"><div class="form-left-corner"><div class="btn-general" id="btn-submit-channel" data-op="save">Add Channel</div></div><div class="close-form">&times;</div><input type="text" id="txt-channel" placeholder="Channel name" /><div id="subs-for-channel"><input class="field-edit-sub" type="text" placeholder="Subreddit 1" /><input class="field-edit-sub" type="text" placeholder="Subreddit 2" /><input class="field-edit-sub" type="text" placeholder="Subreddit 3" /></div><div id="btn-add-another-sub">Add additional subreddit</div></div>',
    formEditChannel: '<div class="new-form" id="form-new-channel"><div class="form-left-corner"><div class="btn-general" id="btn-submit-channel" data-op="update">Update Channel</div></div><div class="close-form">&times;</div><input type="text" id="txt-channel" placeholder="Channel name" /><div id="subs-for-channel"></div><div id="btn-add-another-sub">Add additional subreddit</div></div>',
    botonCargarMasSubs: "<div class='list-button'><span id='more-subs'>More</span></div>",
    noLink: "No Post Selected",
    about: "<div class='new-form about-reeddit'><div class='close-form'>&times;</div><ul><li><a href='/about/' target='_blank'>Reeddit Homepage</a></li><li><a href='https://github.com/berbaquero/reeddit' target='_blank'>GitHub Project</a></li></ul><p><a href='https://twitter.com/reedditapp'>@ReedditApp</a></p><p>Built by <a href='http://berbaquero.com' target='_blank'>Bernardo Baquero Stand</a></p></div>",
    exportData: "<div class='new-form move-data'><div class='close-form'>&times;</div><div class='move-data-exp'><h3>Export Data</h3><p>You can back-up your local subscriptions and then import them to any other Reeddit instance, or just restore them.</p><div class='btn-general' id='btn-save-dbx'>Save to Dropbox</div></div></div>",
    importData: "<div class='new-form move-data'><div class='close-form'>&times;</div><div class='move-data-imp'><h3>Import Data</h3><p>Load the subscriptions from another Reeddit instance.</p><p>Once you choose the reeddit data file, Reeddit will refresh with the imported data.</p><div class='btn-general' id='btn-dbx-imp'>Import from Dropbox</div></div></div>"
};

var M = { // Model
    Posts: {
        list: {},
        setList: function(posts) {
            for (var i = 0; i < posts.children.length; i++) {
                var post = posts.children[i];
                if (M.Posts.list[post.data.id]) { // Si ya se ha cargado este link localmente
                    // Se actualizan los datos dinamicos
                    M.Posts.list[post.data.id].num_comments = post.data.num_comments;
                    M.Posts.list[post.data.id].created_utc = post.data.created_utc;
                } else { // Si no se han cargado los links localmente
                    M.Posts.list[post.data.id] = {
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
    },
    Subreddits: {
        list: [],
		add: function(sub) {
			M.Subreddits.list.push(sub);
			store.setItem("subreeddits", JSON.stringify(M.Subreddits.list));
			updateBackup = 1;
		},
        setList: function(subs) {
            M.Subreddits.list = subs;
            store.setItem("subreeddits", JSON.stringify(M.Subreddits.list));
            updateBackup = 1;
        },
        remove: function(sub) {
            var idx = M.Subreddits.list.indexOf(sub);
            M.Subreddits.list.splice(idx, 1);
            store.setItem("subreeddits", JSON.stringify(M.Subreddits.list));
            updateBackup = 1;
        },
		listHasSub: function(newSub) {
			if (M.Subreddits.list) {
				newSub = newSub.toLowerCase();
				for(var i = M.Subreddits.list.length; --i;) {
					var sub = M.Subreddits.list[i];
					if (sub.toLowerCase() === newSub) {
						return true;
					}
				}
				return false;
			}
			return false;
		},
        getAllSubsString: function() {
            var allSubs = '',
				frontPage = 'frontpage',
				all = 'all';
            for (var i = 0; i < M.Subreddits.list.length; i++) {
                var sub = M.Subreddits.list[i].toLowerCase();
                if (sub === frontPage ||
					sub === all) {
					continue;
				}
                allSubs += sub + '+';
            }
            return allSubs.substring(0, allSubs.length - 1);
        },
        idLast: ''
    },
    Channels: {
        list: [],
        getURL: function(channel) {
            if (channel.subs.length === 1) { // Reddit API-related hack
                // If there's one subreddit in a "Channel", and this subreddit name's invalid, reddit.com responds with a search-results HTML - not json data - and throws a hard-to-catch error...
                return "r/" + channel.subs[0] + "+" + channel.subs[0]; // Repeating the one subreddit in the URL avoids this problem :)
            } else {
                return "r/" + channel.subs.join("+");
            }
        },
        add: function(channel) {
            M.Channels.list.push(channel);
            store.setItem('channels', JSON.stringify(M.Channels.list));
            updateBackup = 1;
        },
        remove: function(name) {
            for (var j = 0; j < M.Channels.list.length; j++) {
                if (M.Channels.list[j].name === name) {
                    M.Channels.list.splice(j, 1);
                    break;
                }
            }
            store.setItem('channels', JSON.stringify(M.Channels.list));
            updateBackup = 1;
        },
        getByName: function(name) {
            var foundChannel;
            for (var i = 0; i < M.Channels.list.length; i++) {
                if (M.Channels.list[i].name.toLowerCase() === name.toLowerCase()) {
                    foundChannel = M.Channels.list[i];
                    break;
                }
            }
            return foundChannel;
        }
    },
    currentSelection: {
        loadSaved: function() {
            var loadedSelection = store.getItem('currentSelection');
            if (loadedSelection) loadedSelection = JSON.parse(loadedSelection);
            M.currentSelection.name = loadedSelection ? loadedSelection.name : 'frontPage';
            M.currentSelection.type = loadedSelection ? loadedSelection.type : selection.sub;
        },
        setSubreddit: function(sub) {
            M.currentSelection.name = sub;
            M.currentSelection.type = selection.sub;
            store.setItem('currentSelection', JSON.stringify(M.currentSelection));
        },
        setChannel: function(channel) {
            M.currentSelection.name = channel.name;
            M.currentSelection.type = selection.channel;
            store.setItem('currentSelection', JSON.stringify(M.currentSelection));
        }
    }
};

var V = { // View
    mainWrap: $("#main-wrap"),
    detailWrap: $("#detail-wrap"),
    mainView: $(".main-view"),
    detailView: $(".detail-view"),
    subtitle: $("#main-title"),
    subtitleText: $("#sub-title"),
    headerSection: $("#title-head"),
    title: $("#title"),
    headerIcon: $("#header-icon"),
    btnNavBack: $("#nav-back"),
    footerSub: $("#footer-sub"),
    footerPost: $("#footer-post"),
    Channels: {
        menuContainer: $("#channels"),
        add: function(channel) {
            V.Channels.menuContainer.append(Mustache.to_html(T.Channels.single, channel));
            if (editingSubs) V.Channels.addToEditList(channel.name);
        },
        loadList: function() {
            V.Channels.menuContainer.html(Mustache.to_html(T.Channels.list, M.Channels.list));
        },
        remove: function(name) {
            var deletedChannel = $('.channel-to-remove[data-title="' + name + '"]');
            deletedChannel.addClass("anim-delete");
            setTimeout(function() {
                deletedChannel.remove();
            }, 200);

            $('.channel[data-title="' + name + '"]').parent().remove();
        },
        addToEditList: function(name) {
            $(".channel-edit-list").append(T.Channels.singleEditItem.replace(/\{\{name\}\}/g, name));
        }
    },
    Subreddits: {
        listContainer: $("#subs"),
        insert: function(subs, active) {
            var subsList = V.Subreddits.listContainer;
            if (subs instanceof Array) {
                subsList.append(Mustache.to_html(T.Subreddits.list, subs));
            } else {
				subsList.append($("<li/>").attr("data-name", subs).append($("<p/>").addClass("sub").addClass((active ? "sub-active" : "")).text(subs)));
            }
        },
        remove: function(sub) {
            var deletedSub = $(".sub-to-remove[data-name='" + sub + "']");
            deletedSub.addClass("anim-delete");
            setTimeout(function() {
                deletedSub.remove();
            }, 200);

            $("#subs > li[data-name='" + sub + "']").remove();
        },
        cleanSelected: function() {
            $(".sub.sub-active").removeClass("sub-active");
            $(".channel.channel-active").removeClass("channel-active");
        }
    },
    Posts: {
        show: function(links, paging) { // links: API raw data
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
                main.append(Mustache.to_html(T.Posts, links));

                // Remove thumbnail space for those links with invalid backgrounds.
                var thumbs = $('.link-thumb > div'),
                    bgImg = 'background-image: ';
                for (var i = 0; i < thumbs.length; i++) {
                    var thumb = $(thumbs[i]),
                        bg = thumb.attr('style');
                    if (bg === bgImg + 'url()' || bg === bgImg + 'url(default)' || bg === bgImg + 'url(nsfw)' || bg === bgImg + 'url(self)') thumb.parent().remove();
                }
            }
            // Remove 'More links' button if there are less than 30 links
            if (linksCount < 30) $('more-links').parent().remove();
            if (!isDesktop) V.Misc.scrollFixLinks();
            if (!paging) V.Anims.reveal(main);
        }
    },
    Actions: {
        setSubTitle: function(title) {
            V.subtitleText.text(title);
            V.footerSub.text(title);
        },
        backToMainView: function() {
            V.btnNavBack.addClass("invisible");
            V.subtitle.removeClass("invisible");
            V.headerSection.empty().append(V.headerIcon);
            V.Anims.slideFromLeft();
        },
        moveMenu: function(direction) {
			if (isiPhone && isiOS7) {
				V.mainView.removeClass(swipeClass);
				V.detailView.removeClass(swipeClass);
			}
            if (direction === move.left) {
                V.mainView.removeClass(css.showMenu);
                setTimeout(function() {
                    showingMenu = false;
                });
            }
            if (direction === move.right) {
                V.mainView.addClass(css.showMenu);
                setTimeout(function() {
                    showingMenu = true;
                });
            }
        },
        loadForAdding: function() {
            if (!isLargeScreen) V.Actions.moveMenu(move.left);
            if (currentView === view.comments) V.Actions.backToMainView();

            setTimeout(function() {
                V.mainWrap[0].scrollTop = 0; // Go to the container top
                var main = V.mainWrap;
                if (subreddits) {
                    main.empty().append(T.botonAgregarSubManual).append(subreddits).append(T.botonCargarMasSubs);
                } else {
                    main.prepend("<div class='loader'></div>").prepend(T.botonAgregarSubManual);
                    $.ajax({
                        url: urlInit + "reddits/.json?limit=50&jsonp=?",
                        dataType: 'jsonp',
                        success: function(list) {
                            M.Subreddits.idLast = list.data.after;
                            subreddits = Mustache.to_html(T.Subreddits.toAddList, list.data);
                            main.empty().append(T.botonAgregarSubManual).append(subreddits).append(T.botonCargarMasSubs);
                        },
                        error: function() {
                            $('.loader').addClass("loader-error").text('Error loading subreddits.');
                        }
                    });
                }
                loadingLinks = false;
            }, isLargeScreen ? 1 : 301);
            V.Subreddits.cleanSelected();
            V.Actions.setSubTitle("Add Subs");
            setEditingSubs(true);
        },
        loadForEditing: function() {
            if (!isLargeScreen) V.Actions.moveMenu(move.left);
            if (currentView === view.comments) V.Actions.backToMainView();

            setTimeout(function() {
                V.mainWrap[0].scrollTop = 0; // Up to container top
                var htmlSubs = Mustache.to_html(T.Subreddits.toEditList, M.Subreddits.list);
                var htmlChannels = '';
                if (M.Channels.list && M.Channels.list.length > 0) {
                    htmlChannels = Mustache.to_html("<p class='edit-subs-title'>Channels</p><ul class='remove-list channel-edit-list'>{{#.}} " + T.Channels.singleEditItem + "{{/.}}</ul>", M.Channels.list);
                }
                var html = '<div id="remove-wrap">' + htmlChannels + htmlSubs + "</div>";
                setTimeout(function() { // Intentional delay / fix for iOS
                    V.mainWrap.html(html);
                }, 10);
                V.Subreddits.cleanSelected();
                loadingLinks = false;
            }, isLargeScreen ? 1 : 301);
            V.Actions.setSubTitle('Edit Subs');
            setEditingSubs(true);
        },
        showModal: function(template, callback, config) {
            var delay = 1;
            if (!isLargeScreen && showingMenu) {
                V.Actions.moveMenu(move.left);
                delay = 301;
            }
            setTimeout(function() {
                if (isModal) return;
                var modal = $('<div/>').attr('id', 'modal'),
                    bounce = true;
                if (config) {
                    if(config.modalClass) {
                        modal.addClass(config.modalClass);
                    }
                    if (config.noBounce) {
                        bounce = false;
                    }
                }
                modal.append(template);
                $('body').append(modal);
                isModal = true;
                setTimeout(function() {
                    modal.css('opacity', 1);
                    if (bounce) {
                        V.Anims.bounceInDown($(".new-form"));
                    }
                }, 1);
                if (callback) callback();
            }, delay);
        },
        removeModal: function() {
            var modal = $('#modal');
            modal.css('opacity', '');
            isModal = false;
            setTimeout(function() {
                modal.remove();
            }, 301);
        },
        switchMnml: function(save, mode) { // save, mode: boolean
            if (typeof mode === 'undefined') {
                mnml = !mnml;
            } else mnml = mode;
            var bntMnml = $("#mnml");
            if (mnml) {
                body.classList.add(css.mnml);
                bntMnml.text("Theme: mnml");
            } else {
                body.classList.remove(css.mnml);
                bntMnml.text("Theme: Classic");
            }
            if (save) store.setItem("mnml", mnml);
        },
        setDetailFooter: function(title) {
            V.footerPost.text(title ? title : T.noLink);
            var btns = $("#detail-footer .btn-footer");
            if (title) btns.removeClass(css.hide);
            else btns.addClass(css.hide);
        },
        showImageViewer: function(imageURL) {
            var imageViewer = '<img class="image-viewer" src="' + imageURL + '">',
                config = {
                    modalClass: 'modal--closable',
                    noBounce: true
                };
            V.Actions.showModal(imageViewer, false, config);
        },
		setSelectedLink: function(id) {
			$(".link.link-selected").removeClass("link-selected");
			$('.link[data-id="' + id + '"]').addClass('link-selected');
		},
		clearSelectedLink: function() {
			$('.link.link-selected').removeClass('link-selected');
		},
		switchDisplay: function(el, visible) {
			if (visible) {
				el.classList.add(css.hide);
			} else {
				el.classList.remove(css.hide);
			}
		}
    },
    Comments: {
        setRest: function(id, refresh) {
            var postTitle = M.Posts.list[id].title;

            if (!refresh) V.Actions.setDetailFooter(postTitle);

            if (!refresh && currentView !== view.comments) V.Anims.slideFromRight();

            V.headerSection.empty().append(V.title);
            V.title.text(postTitle);
            V.subtitle.addClass('invisible');
        },
        showLoadError: function(loader) {
            loadingComments = false;
            var error = 'Error loading comments. Refresh to try again.';
            if (isWideScreen) loader.addClass("loader-error").html(error + '<div class="comments-button" id="wide-refresh">Refresh</div>');
            else loader.addClass("loader-error").text(error);
            if (!isDesktop) {
                V.detailWrap.append($("<section/>"));
                V.Misc.scrollFixComments();
            }
        }
    },
    Misc: {
        addLoader: function(elem) {
            var loader = $("<div/>").addClass("loader");
            elem.append(loader);
            return loader;
        },
        scrollFixComments: function() {
            // Make comments section always scrollable
            var detailWrap = $query('#detail-wrap'),
                detailWrapHeight = detailWrap.offsetHeight,
                linkSummary = detailWrap.querySelector('section:first-child'),
                linkSummaryHeight = linkSummary.offsetHeight,
                selfText = detailWrap.querySelector('#selftext'),
                selfTextHeight = selfText ? selfText.offsetHeight : 0,
                imagePreview = detailWrap.querySelector('.image-preview'),
                imagePreviewHeight = imagePreview ? imagePreview.offsetHeight : 0,
                loader = detailWrap.querySelector('.loader'),
                loaderHeight = loader ? loader.offsetHeight : 0;

            var minHeight = detailWrapHeight - linkSummaryHeight - selfTextHeight - imagePreviewHeight - loaderHeight + 1;
            $('#detail-wrap > section + ' + (selfTextHeight > 0 ? '#selftext +' : '') + (imagePreviewHeight > 0 ? '.image-preview +' : '') + (loaderHeight > 0 ? '.loader +' : '') + ' section').css('min-height', minHeight);
        },
        scrollFixLinks: function() {
            // Make links section always scrollable / Necessary when using the other Sorting options.
            var totalHeight = 0;
            // Calculate the total of link wrappers heigth
            var wraps = doc.querySelectorAll('.link-wrap');
            for (var w = 0; w < wraps.length; w++) {
                totalHeight += wraps[w].offsetHeight;
            }
            // Get each element's static section heigth
            var containerHeight = body.offsetHeight,
                headerHeight = $query('header').offsetHeight,
                message = $query('.loader'),
                messageHeight = message ? message.offsetHeight : 0,
                listButton = $query('.list-button'),
                listButtonHeight = listButton ? listButton.offsetHeight : 0;

            var minHeight = containerHeight - headerHeight - messageHeight - listButtonHeight;

            if (totalHeight > minHeight) {
                $("#main-overflow").css('min-height', '');
            } else {
                $("#main-overflow").css('min-height', minHeight - totalHeight + 1);
            }
        }
    },
    Anims: {
        slideFromLeft: function() {
            var show = css.showView;
            V.mainView.addClass(show);
            V.detailView.removeClass(show);
            currentView = view.main;
        },

        slideFromRight: function() {
            var show = css.showView;
            V.mainView.removeClass(show);
            V.detailView.addClass(show);
            currentView = view.comments;
        },

        reveal: function(el) {
            var reveal = "anim-reveal";
            if (isDesktop) {
                el.addClass(reveal);
                setTimeout(function() {
                    el.removeClass(reveal);
                }, 700);
            } else {
                setTimeout(function() {
                    el.removeClass("invisible").addClass(reveal);
                }, 0);
            }
        },

        shake: function(el) {
            var shake = "anim-shake";
            el.addClass(shake);
            setTimeout(function() {
                el.removeClass(shake);
            }, 350);
        },

        shakeForm: function() {
            V.Anims.shake($(".new-form"));
        },

        bounceOut: function(el, callback) {
            var bounceOut = "anim-bounce-out";
            el.addClass(bounceOut);
            if (callback) setTimeout(callback, 1000);
        },

        bounceInDown: function(el) {
            el.addClass("anim-bounceInDown");
            setTimeout(function() {
                el[0].style.opacity = 1;
                el.removeClass("anim-bounceInDown");
            }, 500);
        }
    }
};

var C = { // "Controller"
    Posts: {
        load: function(baseUrl, paging) {
            if (loadingLinks) return;
            loadingLinks = true;
            loadingComments = false;
            setEditingSubs(false);
            var main = V.mainWrap;
            if (paging) {
                $("#more-links").parent().remove(); // Se quita el boton de 'More' actual
                main.append("<div class='loader'></div>");
            } else {
                V.mainWrap[0].scrollTop = 0; // Sube al top del contenedor
                setTimeout(function() {
                    main.prepend("<div class='loader'></div>");
                }, showingMenu ? 301 : 1);
                paging = ''; //// Si no hay paginacion, se pasa una cadena vacia, para no paginar
            }
            $.ajax({
                dataType: 'jsonp',
                url: baseUrl + C.Sorting.get() + urlLimitEnd + paging,
                success: function(result) {
                    C.Posts.show(result, paging);
                },
                error: function() {
                    loadingLinks = false;
                    $('.loader').addClass("loader-error").text('Error loading links. Refresh to try again.');
                }
            });
        },
        loadFromManualInput: function(loadedLinks) {
            C.Posts.show(loadedLinks);
            V.mainWrap[0].scrollTop = 0;
            setEditingSubs(false);
        },
        show: function(result, paging) {
            var links = result.data;
            loadingLinks = false;
            M.Posts.idLast = links.after;

            V.Posts.show(links, paging);
            M.Posts.setList(links);
			if (isWideScreen) {
				var id = getCommentHash();
				if (id) {
					V.Actions.setSelectedLink(id);
				}
			}
        }
    },
    Comments: {
        load: function(data, baseElement, idParent) {
            var now = new Date().getTime(),
                converter = new Markdown.Converter(),
                com = $("<div/>").addClass('comments-level');
            for (var i = 0; i < data.length; i++) {
                var c = data[i];

                if (c.kind !== "t1") continue;

                var html = converter.makeHtml(c.data.body),
                    isPoster = M.Posts.list[currentThread].author === c.data.author,
                    permalink = "http://reddit.com" + M.Posts.list[currentThread].link + c.data.id,
                    commentLink = {
                        "href": permalink,
                        "target": "_blank",
                        "title": "See this comment on reddit.com"
                    };

                var comment = $("<div/>").addClass("comment-wrap").append($('<div/>').append($("<div/>").addClass("comment-data").append($("<div/>").addClass(isPoster ? "comment-poster" : "comment-author").append($("<p/>").text(c.data.author))).append($("<div/>").addClass("comment-info").append($("<a/>").attr(commentLink).text(timeSince(now, c.data.created_utc))))).append($("<div/>").addClass("comment-body").html(html)));

                if (c.data.replies && c.data.replies.data.children[0].kind !== "more") {
                    comment.append($("<span/>").addClass("comments-button replies-button").attr("comment-id", c.data.id).text("See replies"));
                    replies[c.data.id] = c.data.replies.data.children;
                }

                com.append(comment);
            }

            baseElement.append(com);

            if (idParent) loadedLinks[idParent] = com;

            $("#detail-wrap a").attr("target", "_blank");

            if (!isDesktop) V.Misc.scrollFixComments();
        },
        show: function(id, refresh) {
            if (!M.Posts.list[id]) {
                currentThread = id;

                var loader = V.Misc.addLoader(V.detailWrap);
                loadingComments = true;

                $.ajax({
                    dataType: 'jsonp',
                    url: urlInit + "comments/" + id + "/" + urlEnd,
                    success: function(result) {
                        loader.remove();
                        loadingComments = false;

                        M.Posts.setList(result[0].data);
                        C.Misc.setPostSummary(result[0].data.children[0].data, id);

                        V.btnNavBack.removeClass("invisible"); // Show

                        V.Comments.setRest(id, refresh);

                        C.Comments.load(result[1].data.children, $('#comments-container'), id);
                    },
                    error: function() {
                        V.Comments.showLoadError(loader);
                    }
                });
            } else {
                var delay = 0;
                if (showingMenu) {
                    V.Actions.moveMenu(move.left);
                    delay = 301;
                }
                setTimeout(function() {

                    // Stop if it hasn't finished loading this comments for the first time before trying to load them again
                    if (loadingComments && currentThread && currentThread === id) return;

                    loadingComments = true;
                    currentThread = id;

                    V.btnNavBack.removeClass("invisible"); // Show

                    var detail = V.detailWrap;
                    detail.empty();

                    V.detailWrap[0].scrollTop = 0;

                    if (loadedLinks[id] && !refresh) {
                        detail.append(M.Posts.list[id].summary);
                        $('#comments-container').append(loadedLinks[id]);
                        C.Misc.updatePostSummary(M.Posts.list[id], id);
                        loadingComments = false;
                    } else {
                        C.Misc.setPostSummary(M.Posts.list[id], id);
                        var url = "http://www.reddit.com" + M.Posts.list[id].link + urlEnd;

                        var loader = V.Misc.addLoader(detail);

                        $.ajax({
                            dataType: 'jsonp',
                            url: url,
                            success: function(result) {
                                if (currentThread !== id) return; // In case of trying to load a different thread before this one loaded.
                                C.Misc.updatePostSummary(result[0].data.children[0].data, id);
                                loader.remove();
                                C.Comments.load(result[1].data.children, $('#comments-container'), id);
                                loadingComments = false;
                            },
                            error: function() {
                                V.Comments.showLoadError(loader);
                            }
                        });
                    }

                    V.Comments.setRest(id, refresh);

                }, delay);
            }
        }
    },
    Subreddits: {
        loadSaved: function() { // Only should execute when first loading the app
            var subs = store.getItem("subreeddits");
            if (subs) subs = JSON.parse(subs);
            M.Subreddits.list = subs;
            if (!M.Subreddits.list) M.Subreddits.setList(defaultSubs); // If it hasn't been loaded to the 'local store', save default subreddits
            V.Subreddits.insert(M.Subreddits.list);
        },
        loadPosts: function(sub) {
            if (sub !== M.currentSelection.name || editingSubs) {
                var url;
                if (sub.toLowerCase() === 'frontpage') {
					url = urlInit + "r/" + M.Subreddits.getAllSubsString() + "/";
				} else {
					url = urlInit + "r/" + sub + "/";
				}
                C.Posts.load(url);
                C.currentSelection.setSubreddit(sub);
            }
            V.Actions.setSubTitle(sub);
        },
		remove: function(sub) {
			M.Subreddits.remove(sub);
			V.Subreddits.remove(sub);
			if (M.currentSelection.type === selection.sub &&
				M.currentSelection.name === sub) { // If it was the current selection
				C.currentSelection.setSubreddit('frontPage');
			}
		},
		add: function(newSub) {
			if (M.Subreddits.listHasSub(newSub)) {
				return;
			}
			M.Subreddits.add(newSub);
			V.Subreddits.insert(newSub);
		},
        addFromNewForm: function() {
            var txtSub = $id("txt-new-sub"),
                subName = txtSub.value;
            if (!subName) {
                txtSub.setAttribute("placeholder", "Enter a subreddit title!");
                V.Anims.shakeForm();
                return;
            }
			if (M.Subreddits.listHasSub(subName)) {
				txtSub.value = "";
				txtSub.setAttribute("placeholder", subName + " already added!");
				V.Anims.shakeForm();
				return;
			}

            subName = subName.trim();

            V.Anims.bounceOut($(".new-form"), V.Actions.removeModal);

            $.ajax({
                url: urlInit + "r/" + subName + "/" + C.Sorting.get() + urlLimitEnd,
                dataType: 'jsonp',
                success: function(data) {
                    C.Posts.loadFromManualInput(data);
                    V.Actions.setSubTitle(subName);
                    V.Subreddits.cleanSelected();
                    C.currentSelection.setSubreddit(subName);
                    C.Subreddits.add(subName);
                },
                error: function() {
                    alert('Oh, the subreddit you entered is not valid...');
                }
            });
        }
    },
    Channels: {
        add: function(title, subreddits) {
            var channel = {
                name: title,
                subs: subreddits
            };
            M.Channels.add(channel);
            V.Channels.add(channel);
        },
        loadSaved: function() { // Should only execute when first loading the app
            M.Channels.list = store.getItem('channels');
            if (M.Channels.list) M.Channels.list = JSON.parse(M.Channels.list);
            else M.Channels.list = [defaultChannel]; // Load default channel(s)
            V.Channels.loadList();
        },
        loadPosts: function(channel) {
            C.Posts.load(urlInit + M.Channels.getURL(channel) + '/');
            V.Actions.setSubTitle(channel.name);
            C.currentSelection.setChannel(channel);
        },
        remove: function(name) {
            M.Channels.remove(name);
            V.Channels.remove(name);
            // If it was the current selection
            if (M.currentSelection.type === selection.channel && M.currentSelection.name === name) C.currentSelection.setSubreddit('frontPage');
        },
        edit: function(name) {
            var channelToEdit = M.Channels.getByName(name);
            V.Actions.showModal(T.formEditChannel, function() {
                // Fill form with current values
                $("#txt-channel").val(channelToEdit.name);

                M.Channels.editing = channelToEdit.name;
                var $inputsContainer = $("#subs-for-channel");

                for (var i = 0, l = channelToEdit.subs.length; i < l; i++) {

                    var inputTemplate = "<input class='field-edit-sub with-clear' type='text' value='{{subName}}'>";

                    $inputsContainer.append(inputTemplate.replace("{{subName}}", channelToEdit.subs[i]));
                }
            });
        }
    },
    currentSelection: {
        setSubreddit: function(sub) {
            M.currentSelection.setSubreddit(sub);
        },
        setChannel: function(channel) {
            M.currentSelection.setChannel(channel);
        }
    },
    Sorting: {
        get: function() {
            return (currentSortingChoice !== 'hot' ? (currentSortingChoice + '/') : '');
        },
        change: function(sorting) {
            currentSortingChoice = sorting;
            if (editingSubs) return; // No subreddit or channel selected - just change the sorting type
            // Only refresh with the new sorting, when a subreddit or channel is selected
            var delay = 1;
            if (showingMenu) {
                V.Actions.moveMenu(move.left);
                delay = 301;
            }
            setTimeout(function() {
                refreshCurrentStream();
            }, delay);
        }
    },
    Misc: {
        setPostSummary: function(data, postID) {
            // Main content
            var summaryHTML = Mustache.to_html(T.linkSummary, data);
            // Check for type of post
            if (data.selftext) { // If it's a self-post
                var selfText;
                if (M.Posts.list[postID].selftextParsed) {
                    selfText = M.Posts.list[postID].selftext;
                } else {
                    var summaryConverter1 = new Markdown.Converter();
                    selfText = summaryConverter1.makeHtml(data.selftext);
                    M.Posts.list[postID].selftext = selfText;
                    M.Posts.list[postID].selftextParsed = true;
                }
                summaryHTML += "<section id='selftext'>" + selfText + "</section>";
            } else { // if it's an image
                var linkURL = M.Posts.list[postID].url;
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
            V.detailWrap.append(summaryHTML);
            C.Misc.updatePostTime(data.created_utc);
            M.Posts.list[postID].summary = summaryHTML;
            V.footerPost.text(data.title);
        },
        updatePostSummary: function(data, postID) {
            $("#summary-comment-num").text(data.num_comments + (data.num_comments === 1 ? ' comment' : ' comments'));
            // Time ago
            C.Misc.updatePostTime(data.created_utc);
            M.Posts.list[postID].num_comments = data.num_comments;
            M.Posts.list[postID].created_utc = data.created_utc;
        },
        updatePostTime: function(time) {
            $("#summary-time").text(timeSince(new Date().getTime(), time));
        }
    }
};

/* global
	M, V, C, win, doc, body,
	SortSwitch, isWideScreen */

function triggerClick(url) {
	var a = doc.createElement('a');
	a.setAttribute("href", url);
	a.setAttribute("target", "_blank");

	var clickEvent = new MouseEvent("click", {
		"view": window,
		"bubbles": true,
		"cancelable": false
	});

	a.dispatchEvent(clickEvent);
}

function openPost(url, id) {
	var link = M.Posts.list[id];
	if (link.self || isWideScreen) {
		goToComments(id);
	} else {
		triggerClick(url);
	}
}

function getCommentHash() {
	var match = location.hash.match(/(#comments:)((?:[a-zA-Z0-9]*))/);
	if (match && match[2]) {
		return match[2];
	}
}

function goToCommentFromHash() {
	var id = getCommentHash();
	C.Comments.show(id);
	if (isWideScreen) {
		V.Actions.setSelectedLink(id);
	}
}

function checkImageLink(url) {
    var matching = url.match(/\.(svg|jpe?g|png|gif)(?:[?#].*)?$|(?:imgur\.com|livememe\.com)\/([^?#\/.]*)(?:[?#].*)?(?:\/)?$/);
    if (!matching) {
		return '';
	}
    if (matching[1]) { // normal image link
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
}

function getYouTubeVideoIDfromURL(url) {
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
}

function setEditingSubs(/* boolean */ editing) {
	if (editing === editingSubs) {
		return;
	}
    editingSubs = editing;
    if (isWideScreen) {
		V.Actions.switchDisplay(Footer.getRefreshButton(), editing);
		V.Actions.switchDisplay(SortSwitch.getWrap(), editing);
    }
}

function doByCurrentSelection(caseSub, caseChannel) {
    switch (M.currentSelection.type) {
        case selection.sub:
            caseSub();
            break;
        case selection.channel:
            caseChannel();
            break;
    }
}

$('body').on('submit', '#form-new-sub form', function(e) {
    e.preventDefault();
    C.Subreddits.addFromNewForm();
});

function goToComments(id) {
    location.hash = '#comments:' + id;
}

function refreshCurrentStream() {
    if (editingSubs) return;
    doByCurrentSelection(function() { // if it's subreddit
        if (M.currentSelection.name.toLowerCase() === 'frontpage') {
			C.Posts.load(urlInit + "r/" + M.Subreddits.getAllSubsString() + "/");
		} else {
			C.Posts.load(urlInit + "r/" + M.currentSelection.name + "/");
		}
    }, function() { // if it's channel
        C.Channels.loadPosts(M.Channels.getByName(M.currentSelection.name));
    });
}

function createBackup() {
    if (updateBackup) {
        V.Actions.showModal(T.exportData, function() {
            var files = {},
                content = "{\"channels\": " + store.getItem("channels") + ", \"subreddits\": " + store.getItem("subreeddits") + "}";
            files["reedditdata.json"] = {
                "content": content
            };
            $.ajax({
                url: gists.url,
                type: "POST",
                data: JSON.stringify({
                    "description": "Reeddit User Data",
                    "public": true,
                    "files": files
                }),
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8'
                },
                success: function(response) {
                    var resp = JSON.parse(response);
                    $id("btn-save-dbx").style.display = "block"; // Show "Save to Dropbox" button only when the gist's created
                    gists.fileURL = resp.files["reedditdata.json"].raw_url;
                    updateBackup = 0;
                },
                error: function() {
                    $("#btn-save-dbx").remove();
                    $(".move-data-exp").append("<p class='msg-error'>Oh oh. Error creating your backup file. Retry later.</p>");
                    V.Actions.removeModal();
                }
            });
        });
    } else if (gists.fileURL) {
        V.Actions.showModal(T.exportData, function() {
            $id("btn-save-dbx").style.display = "block";
        });
    }
}

function chooseFromDropbox() {
    Dropbox.choose({
        success: function(file) {
            $.ajax({
                url: file[0].link,
                success: function(data) {
                    try {
                        var refresh = false;
                        if (typeof data === "string") data = JSON.parse(data);
                        if (data.subreddits) {
                            refresh = true;
                            store.setItem("subreeddits", JSON.stringify(data.subreddits));
                        }
                        if (data.channels) {
                            refresh = true;
                            store.setItem("channels", JSON.stringify(data.channels));
                        }
                        if (refresh) win.location.reload();
                    } catch (e) {
                        alert("Oops! Wrong file, maybe? - Try choosing another one.");
                    }
                }
            });
        },
        linkType: "direct",
        extensions: [".json"]
    });
}

var supportOrientation = typeof win.orientation !== 'undefined',
    getScrollTop = function() {
        return win.pageYOffset || doc.compatMode === 'CSS1Compat' && doc.documentElement.scrollTop || body.scrollTop || 0;
    },
    scrollTop = function() {
        if (!supportOrientation) return;
        body.style.height = screen.height + 'px';
        setTimeout(function() {
            win.scrollTo(0, 1);
            var top = getScrollTop();
            win.scrollTo(0, top === 1 ? 0 : 1);
            body.style.height = win.innerHeight + 'px';
        }, 1);
    };

// Taps
tappable("#mnml", {
    onTap: function() {
        V.Actions.switchMnml(true);
    }
});

tappable("#btn-add-new-sub", {
    onTap: C.Subreddits.addFromNewForm
});

tappable("#btn-submit-channel", {
    onTap: function(e, target) {
        var txtChannelName = $("#txt-channel"),
            operation = target.getAttribute("data-op");
        var channelName = txtChannelName.val();
        if (!channelName) {
            txtChannelName.attr("placeholder", "Enter a Channel name!");
            V.Anims.shakeForm();
            return;
        }

        var subreddits = [];
        var subs = $("#subs-for-channel input");
        for (var i = 0; i < subs.length; i++) {
            var sub = $(subs[i]).val();
            if (!sub) continue;
            subreddits.push(sub);
        }
        if (subreddits.length === 0) {
            subs[0].placeholder = "Enter at least one subreddit!";
            V.Anims.shakeForm();
            return;
        }

        switch (operation) {
            case "save":
                // Look for Channel name in the saved ones
                var savedChannel = M.Channels.getByName(channelName);
                if (savedChannel) { // If it's already saved
                    txtChannelName.val("");
                    txtChannelName.attr("placeholder", "'" + channelName + "' already exists.");
                    V.Anims.shakeForm();
                    return;
                }

                C.Channels.add(channelName, subreddits);

                break;

            case "update":
                // Remove current and add new
                C.Channels.remove(M.Channels.editing);
                C.Channels.add(channelName, subreddits);

                break;
        }

        // confirmation feedback
        $(target).remove();
        $(".form-left-corner").append("<p class='channel-added-msg'>'" + channelName + "' " + operation + "d. Cool!</p>");

        V.Anims.bounceOut($(".new-form"), V.Actions.removeModal);
    },
    activeClass: "btn-general-active"
});

tappable("#btn-add-another-sub", {
    onTap: function() {
        var container = $("#subs-for-channel");
        container.append("<input type='text' placeholder='Extra subreddit'></input>");
        container[0].scrollTop = container.height();
    },
    activeClass: "btn-general-active"
});

tappable('.channel', {
    onTap: function(e, target) {
        var channel = $(target);
        var channelName = channel.data("title");
        V.Actions.moveMenu(move.left);
        if (channelName === M.currentSelection.name && !editingSubs) return;
        V.Subreddits.cleanSelected();
        channel.addClass('channel-active');
        if (currentView === view.comments) V.Actions.backToMainView();
        C.Channels.loadPosts(M.Channels.getByName(channelName));
    },
    activeClassDelay: 100,
    activeClass: "link-active"
});

tappable(".replies-button", {
    onTap: function(e, target) {
        var parent = $(target);
        var commentID = parent.attr('comment-id');
        var comments = replies[commentID];
        C.Comments.load(comments, parent.parent());
        parent.remove();
    },
    activeClass: 'replies-button-active'
});

tappable(".sub", {
    onTap: function(e, target) {
        var sub = $(target);
        V.Actions.moveMenu(move.left);
        C.Subreddits.loadPosts(sub.first().text());
        V.Subreddits.cleanSelected();
        sub.addClass('sub-active');
        if (currentView === view.comments) {
            V.Actions.backToMainView();
        }
    },
    allowClick: false,
    activeClassDelay: 100,
    activeClass: 'link-active'
});

tappable(".btn-to-main", {
    onTap: function() {
        location.hash = "#";
    }
});

tappable(".btn-refresh", {
    onTap: function(e) {
        var origin = e.target.getAttribute("data-origin");
        switch (origin) {
            case "footer-main":
                refreshCurrentStream();
                break;
            case "footer-detail":
                if (!currentThread) return;
                C.Comments.show(currentThread, true);
                break;
            default:
                if (currentView === view.comments) {
                    if (!currentThread) return;
                    C.Comments.show(currentThread, true);
                }
                if (currentView === view.main) {
                    refreshCurrentStream();
                }
        }
    }
});

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
        var id = $(target).attr('data-id');
        goToComments(id);
    },
    activeClass: 'button-active',
    activeClassDelay: 100
});

tappable("#wide-refresh", {
    onTap: function() {
        if (!currentThread) return;
        C.Comments.show(currentThread, true);
    },
    activeClass: 'replies-button-active'
});

tappable("#sub-title", {
    onTap: function() {
        if ((!isDesktop && loadingLinks)) return;
        V.Actions.moveMenu(showingMenu ? move.left : move.right);
    }
});

tappable("#btn-add-subs", {
    onTap: function() {
        V.Actions.loadForAdding();
    }
});

tappable("#btn-edit-subs", {
    onTap: function() {
        V.Actions.loadForEditing();
    }
});

tappable("#more-links", {
    onTap: function() {
        doByCurrentSelection(function() {
            var url;
            if (M.currentSelection.name.toLowerCase() === 'frontpage') {
				url = urlInit + "r/" + M.Subreddits.getAllSubsString() + "/";
			} else {
				url = urlInit + "r/" + M.currentSelection.name + "/";
			}
            C.Posts.load(url, '&after=' + M.Posts.idLast);
        }, function() {
            var channel = M.Channels.getByName(M.currentSelection.name);
            C.Posts.load(urlInit + M.Channels.getURL(channel) + '/', '&after=' + M.Posts.idLast);
        });
    },
    activeClass: 'list-button-active'
});

tappable("#btn-sub-man", {
    onTap: function() {
        V.Actions.showModal(T.formAgregarSubManual);
    },
    activeClass: 'list-button-active'
});

tappable("#btn-add-channel", {
    onTap: function() {
        V.Actions.showModal(T.formAddNewChannel);
    },
    activeClass: 'list-button-active'
});

tappable('#more-subs', {
    onTap: function(e, target) {
        $(target).parent().remove();
        var main = V.mainWrap;
        main.append("<div class='loader'></div>");
        $.ajax({
            url: urlInit + 'reddits/' + urlEnd + '&after=' + M.Subreddits.idLast,
            dataType: 'jsonp',
            success: function(list) {
                var nuevosSubs = Mustache.to_html(T.Subreddits.toAddList, list.data);
                M.Subreddits.idLast = list.data.after;
                $('.loader', main).remove();
                main.append(nuevosSubs).append(T.botonCargarMasSubs);
                subreddits = subreddits + nuevosSubs;
            },
            error: function() {
                $('.loader').addClass('loader-error').text('Error loading more subreddits.');
            }
        });
    },
    activeClass: 'list-button-active'
});

tappable('.btn-add-sub', {
    onTap: function(e, target) {
        var parent = $(target).parent(),
            subTitle = $(".subreddit-title", parent);
        subTitle.css("color", "#2b9900"); // 'adding sub' little UI feedback
        var newSub = subTitle.text();
        C.Subreddits.add(newSub);
    },
    activeClass: 'button-active'
});

tappable(".btn-remove-subreddit", {
    onTap: function(e, target) {
        C.Subreddits.remove($(target).data('name'));
    },
    activeClass: 'button-active'
});

tappable(".btn-remove-channel", {
    onTap: function(e, target) {
        C.Channels.remove($(target).data('title'));
    },
    activeClass: 'button-active'
});

tappable(".btn-edit-channel", {
    onTap: function(e, target) {
        C.Channels.edit(target.getAttribute('data-title'));
    },
    activeClass: 'button-active'
});

tappable(".close-form", V.Actions.removeModal);

tappable("#about", {
    onTap: function() {
        V.Actions.showModal(T.about);
    },
    activeClassDelay: 100
});

tappable('#sorting p', {
    onTap: function(e, target) {
        if (editingSubs && !isDesktop) return; // Block while editing subs/channels - it weirdly breaks the overflowing divs on mobile :/
        var choice = $(target);
        var sortingChoice = choice.text();
        if (sortingChoice === currentSortingChoice) return;
        $('.sorting-choice').removeClass('sorting-choice');
        choice.addClass('sorting-choice');
        C.Sorting.change(sortingChoice);
    },
    activeClass: 'link-active',
    activeClassDelay: 100
});

tappable("#exp-data", {
    onTap: createBackup
});

tappable("#imp-data", {
    onTap: function() {
        V.Actions.showModal(T.importData);
    }
});

tappable("#btn-save-dbx", {
    onTap: function() {
        if (!gists.fileURL) {
            alert("Err. There's no backup file created...");
            return;
        }
        var options = {
            files: [{
                url: gists.fileURL,
                filename: "reedditdata.json"
            }],
            success: V.Actions.removeModal
        };
        Dropbox.save(options);
    },
    activeClass: "btn-general-active"
});

tappable("#btn-dbx-imp", {
    onTap: chooseFromDropbox,
    activeClass: "btn-general-active"
});

tappable("#btn-new-sub", {
    onTap: function() {
        V.Actions.showModal(T.formAgregarSubManual);
    }
});

tappable("#btn-new-channel", {
    onTap: function() {
        V.Actions.showModal(T.formAddNewChannel);
    }
});

tappable(".image-preview", {
    onTap: function(e, target) {
        V.Actions.showImageViewer(target.src);
    }
});

tappable('.modal--closable', V.Actions.removeModal);

V.detailWrap.on('click', '#comments-container a, #selftext a', function(ev) {
    var imageURL = checkImageLink(ev.target.href);
    if(imageURL) {
        ev.preventDefault();
        V.Actions.showImageViewer(imageURL);
    }
});

// Swipes
if (isMobile) {
	if (!(isiPhone && isiOS7)) {
		V.detailView.swipeRight(function() {
			if (isWideScreen) return;
			location.hash = "#";
		});
	}

	V.mainView.swipeRight(function() {
		if ((!isDesktop && loadingLinks) || isLargeScreen) return;
		if (currentView === view.main) V.Actions.moveMenu(move.right);
	});

	V.mainView.swipeLeft(function() {
		if ((!isDesktop && loadingLinks) || isLargeScreen) return;
		if (showingMenu) V.Actions.moveMenu(move.left);
	});

	V.mainView.on("swipeLeft", ".link", function() {
		if (isWideScreen) return;
		if (!showingMenu) {
			var id = $(this).data("id");
			goToComments(id);
		}
	});
}

// Show option to reload app after update
if (win.applicationCache)
    win.applicationCache.addEventListener("updateready", function(e) {
        var delay = 1;
        if (showingMenu) {
            V.Actions.moveMenu(move.left);
            delay = 301;
        }
        setTimeout(function() {
            V.mainWrap.prepend("<div class='top-buttons'><div id='btn-update'>Reeddit updated. Press to reload</div></div>");
            tappable('#btn-update', {
                onTap: function() {
                    win.location.reload();
                },
                activeClass: 'list-button-active'
            });
        }, delay);
    }, false);

// Do stuff after finishing resizing the windows
win.addEventListener("resizeend", function() {
	isWideScreen = wideScreenBP.matches;
	isLargeScreen = largeScreenBP.matches;
    scrollTop();
    if (isLargeScreen && showingMenu) V.Actions.moveMenu(move.left);
    if (isiPad) iPadScrollFix();
}, false);

if (isiPhone && isiOS7) {
	var hasSwiped = false,
		swipeClass = 'from-swipe';
	document.addEventListener('touchstart', function(ev) {
		var touchX = ev.targetTouches[0].clientX;
		hasSwiped = (touchX < 10 || touchX > window.innerWidth - 10);
	});
	document.addEventListener('touchend', function() {
		hasSwiped = false;
	});
}

// Pseudo-hash-router
win.addEventListener('hashchange', function() {
	if (isiPhone && isiOS7) {
		// Switch `transition-duration` class,
		// to stop animation when swiping
		if (hasSwiped) {
			V.mainView.addClass(swipeClass);
			V.detailView.addClass(swipeClass);
			V.btnNavBack.addClass(swipeClass);
			V.subtitle.addClass(swipeClass);
		} else {
			V.mainView.removeClass(swipeClass);
			V.detailView.removeClass(swipeClass);
			V.btnNavBack.removeClass(swipeClass);
			V.subtitle.removeClass(swipeClass);
		}
		hasSwiped = false;
	}
	// Handle Hash Changes
    if (location.hash === "") { // To Main View
		V.Actions.backToMainView();
		V.Actions.clearSelectedLink();
        V.Actions.setDetailFooter("");
		setTimeout(function() {
			V.detailWrap.empty();
		}, isWideScreen ? 1 : 301);
    } else { // To Comment View
        goToCommentFromHash();
    }
}, false);

var Footer = {

	refreshButton: '',

	getRefreshButton: function() {
		if (!this.refreshButton) {
			this.refreshButton = document.querySelector('#main-footer .footer-refresh');
		}
		return this.refreshButton;
	}
};

/* global C, tappable, loadingLinks */

var SortSwitch = {

	// Initial State
	isHot: true,

	classes: {
		new: 'sort-switch--new'
	},

	wrap: '',

	getWrap: function() {
		if (!this.wrap) {
			this.wrap = document.getElementsByClassName('sorter-wrap')[0];
		}
		return this.wrap;
	}
};

tappable('.js-sort-switch-main', {
	onTap: function(ev, target) {
		if (loadingLinks) {
			return;
		}
		SortSwitch.isHot = !SortSwitch.isHot;
		C.Sorting.change(SortSwitch.isHot ? 'hot' : 'new');
		if (SortSwitch.isHot) {
			target.classList.remove(SortSwitch.classes.new);
		} else {
			target.classList.add(SortSwitch.classes.new);
		}
	}
});

V.title.remove();

if (isWideScreen) V.footerPost.text(T.noLink);

M.currentSelection.loadSaved();

C.Subreddits.loadSaved();
C.Channels.loadSaved();

if (location.hash) goToCommentFromHash();

// Cargar links y marcar como activo al subreddit actual - la 1ra vez sera el 'frontPage'
doByCurrentSelection(
    function() { // En caso de ser un subreddit
        var i = M.Subreddits.list.indexOf(M.currentSelection.name);
        if (i > -1) {
            var activeSub = doc.getElementsByClassName('sub')[i];
            $(activeSub).addClass('sub-active');
        }
        // Load links
        if (M.currentSelection.name.toUpperCase() === 'frontPage'.toUpperCase()) {
            C.currentSelection.setSubreddit('frontPage');
            C.Posts.load(urlInit + "r/" + M.Subreddits.getAllSubsString() + "/");
        } else {
            C.Posts.load(urlInit + "r/" + M.currentSelection.name + "/");
        }
        V.Actions.setSubTitle(M.currentSelection.name);
    }, function() { // If it's a channel
        var channel;
        for (var i = 0; i < M.Channels.list.length; i++) {
            channel = M.Channels.list[i];
            if (channel.name === M.currentSelection.name) {
                var active = doc.getElementsByClassName('channel')[i];
                $(active).addClass('channel-active');
                break;
            }
        }
        C.Channels.loadPosts(channel);
    });

scrollTop();

var loadMnml = store.getItem("mnml"),
    isMnml = loadMnml ? JSON.parse(loadMnml) : false;
V.Actions.switchMnml(false, isMnml);

if (!isDesktop) {
    var touch = "touchmove",
        UA = navigator.userAgent;
    $id("edit-subs").addEventListener(touch, function(e) {
        e.preventDefault();
    }, false);
    doc.getElementsByTagName('header')[0].addEventListener(touch, function(e) {
        if (showingMenu) e.preventDefault(); // Cheat temporal, para evitar que las vistas hagan overflow
    }, false);
    if (isiPad) {
        iPadScrollFix = function() {
            // This slight height change makes the menu container 'overflowy', to allow scrolling again on iPad - weird bug
            var nextHeight = '36px' === $('.menu-desc').css('height') ? '35px' : '36px';
            setTimeout(function() {
                $('.menu-desc').css('height', nextHeight);
            }, 500);
        };
		iPadScrollFix();
    }
    if (isiOS7) {
		// apply iOS 7+ theme
        if (!isMnml) V.Actions.switchMnml(true, true);
        body.classList.add("ios7");
    }
}

})(window);