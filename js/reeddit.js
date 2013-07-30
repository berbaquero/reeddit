(function(win) {

    var T = { // Templates
        Posts: "{{#children}}<article class='link-wrap'><a class='link' href='{{data.url}}' data-id='{{data.id}}' target='_blank'><div class='link-thumb'><div class='marginless' style='background-image: url({{data.thumbnail}})'></div></div><div class='link-info thumbLeft'><p class='link-title'>{{data.title}}</p><p class='link-domain'>{{data.domain}}</p><p class='link-sub'>{{data.subreddit}}</p>{{#data.over_18}}<p class='link-nsfw'>NSFW</p>{{/data.over_18}}</div></a><div class='to-comments' data-id='{{data.id}}'><div class='right-arrow'></div></div></article>{{/children}}<div class='list-button'><span id='more-links'>More</span></div><div id='main-overflow'></div>",
        Subreddits: {
            list: "{{#.}}<li data-name='{{.}}'><p class='sub'>{{.}}</p></li>{{/.}}",
            toRemoveList: "<ul class='remove-list'>{{#.}}<div class='item-to-remove sub-to-remove' data-name='{{.}}'><p>{{.}}</p><div data-name='{{.}}'></div></div>{{/.}}</ul>",
            toAddList: "{{#children}}<div class='subreddit'><div><p class='subreddit-title'>{{data.display_name}}</p><p class='subreddit-desc'>{{data.public_description}}</p></div><div class='btn-add-sub'><div></div></div></div>{{/children}}"
        },
        Channels: {
            toRemoveList: "<p id='remove-title'>Channels</p><ul class='remove-list'>{{#.}}<div class='item-to-remove channel-to-remove' data-title='{{name}}'><p>{{name}}</p><div data-title='{{name}}'></div></div>{{/.}}</ul>",
            single: '<li><div class="channel" data-title="{{name}}"><p>{{name}}</p><div>{{#subs}}<p>{{.}}</p>{{/subs}}</div></div></li>',
            list: '{{#.}}<li><div class="channel" data-title="{{name}}"><p>{{name}}</p><div>{{#subs}}<p>{{.}}</p>{{/subs}}</div></div></li>{{/.}}'
        },
        linkSummary: "<section><div id='link-summary'><a href='{{url}}' target='_blank'><p id='summary-title'>{{title}}</p><p id='summary-domain'>{{domain}}</p>{{#over_18}}<span class='link-nsfw summary-nsfw'>NSFW</span>{{/over_18}}</a><div id='summary-footer'><p id='summary-author'>by {{author}}</p><a id='share-tw' href='https://twitter.com/intent/tweet?text=\"{{encodedTitle}}\" —&url={{url}}&via=ReedditApp&related=ReedditApp'>Tweet</a></div><div id='summary-extra'><p id='summary-sub'>{{subreddit}}</p><p id='summary-time'></p><a id='summary-comment-num' href='http://reddit.com{{link}}' target='_blank'>{{num_comments}} comments</a></div></section>",
        botonAgregarSubManual: "<div id='top-buttons'><div id='btn-sub-man'>Insert Manually</div><div id='btn-add-channel'>Add Channel</div></div>",
        formAgregarSubManual: '<div class="new-form" id="form-new-sub"><div class="close-form">close</div><form><input type="text" id="txt-new-sub" placeholder="New subreddit name" /></form></div>',
        formAddNewChannel: '<div class="new-form" id="form-new-channel"><div class="close-form">close</div><input type="text" id="txt-channel" placeholder="Channel name" /><div id="subs-for-channel"><input type="text" placeholder="Subreddit 1" /><input type="text" placeholder="Subreddit 2" /><input type="text" placeholder="Subreddit 3" /></div><div id="btn-add-new-channel">Add Channel</div></div>',
        botonCargarMasSubs: "<div class='list-button'><span id='more-subs'>More</span></div>",
        noLink: "<div id='no-link'><p>No Post Selected.</div>",
        about: "<div class='new-form about-reeddit'><div class='close-form'>close</div><ul><li><a href='http://reedditapp.com/about' target='_blank'>Reeddit Homepage</a></li><li><a href='https://github.com/berbaquero/reeddit' target='_blank'>GitHub Project</a></li></ul><p>v1.5</p><p><a href='https://twitter.com/reedditapp'>@ReedditApp</a></p><p>Built by <a href='http://berbaquero.com' target='_blank'>Bernardo Baquero Stand</a></p></div>"
    };

    var doc = win.document,
        body = doc.body;

    function $id(id) {
        return doc.getElementById(id);
    }

    function $query(query) {
        return doc.querySelector(query);
    }

    // Pseudo-Globals
    var ancho = $(win).width(),
        currentView = 1,
        editingSubs = false,
        urlInit = "http://www.reddit.com/",
        urlEnd = ".json?jsonp=?",
        urlLimitEnd = ".json?limit=30&jsonp=?",
        loadedLinks = {},
        replies = {},
        showingMenu = false,
        subreddits, store = win.fluid ? allCookies : win.localStorage,
        esModal = false,
        loadingComments = false,
        loadingLinks = false,
        currentThread, isWideScreen = checkWideScreen(),
        isLargeScreen = checkLargeScreen(),
        isiPad, scrollFix, currentSortingChoice = 'hot',
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
        transforms = {
            translateTo0: 'translate3d(0px, 0px, 0px)',
            translateTo140: 'translate3d(140px, 0px, 0px)'
        },
        gui = require('nw.gui'),
        mainWindow = gui.Window.get();

    var defaultSubs = ["frontPage", "pics", "IAmA", "AskReddit", "worldNews", "todayilearned", "technology", "science", "atheism", "reactiongifs", "books", "videos", "AdviceAnimals", "funny", "aww", "earthporn"];

    var defaultChannel = {
        name: "Media",
        subs: ["movies", "games", "music"]
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
                            over_18: post.data.over_18
                        };
                    }
                }
            },
            idLast: ''
        },
        Subreddits: {
            list: [],
            add: function(sub) {
                if (!M.Subreddits.listHasSub(sub)) {
                    M.Subreddits.list.push(sub);
                    store.setItem("subreeddits", JSON.stringify(M.Subreddits.list));
                }
            },
            setList: function(subs) {
                M.Subreddits.list = subs;
                store.setItem("subreeddits", JSON.stringify(M.Subreddits.list));
            },
            remove: function(sub) {
                var idx = M.Subreddits.list.indexOf(sub);
                M.Subreddits.list.splice(idx, 1);
                store.setItem("subreeddits", JSON.stringify(M.Subreddits.list));
            },
            listHasSub: function(sub) {
                if (M.Subreddits.list) {
                    var i = M.Subreddits.list.indexOf(sub);
                    return i > -1;
                }
                return false;
            },
            getAllString: function() {
                var allSubs = '';
                for (var i = 0; i < M.Subreddits.list.length; i++) {
                    var sub = M.Subreddits.list[i];
                    if (sub.toUpperCase() === 'frontPage'.toUpperCase()) continue;
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
            },
            remove: function(name) {
                for (var j = 0; j < M.Channels.list.length; j++) {
                    if (M.Channels.list[j].name === name) {
                        M.Channels.list.splice(j, 1);
                        break;
                    }
                }
                store.setItem('channels', JSON.stringify(M.Channels.list));
            },
            getByName: function(name) {
                var foundChannel;
                for (var i = 0; i < M.Channels.list.length; i++) {
                    if (M.Channels.list[i].name === name) {
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
        mainView: $("#main-view"),
        detailView: $("#detail-view"),
        subtitle: $("#main-title"),
        subtitleText: $("#sub-title"),
        headerSection: $("#title-head"),
        title: $("#title"),
        headerIcon: $("#header-icon"),
        container: $("#container"),
        btnNavBack: $("#nav-back"),
        Channels: {
            menuContainer: $("#channels"),
            add: function(channel) {
                V.Channels.menuContainer.append(Mustache.to_html(T.Channels.single, channel));
            },
            loadList: function() {
                V.Channels.menuContainer.html(Mustache.to_html(T.Channels.list, M.Channels.list));
            },
            remove: function(name) {
                $('.channel[data-title="' + name + '"]').parent().remove();
                $('.channel-to-remove[data-title="' + name + '"]').remove();
            },
            showNewChannelForm: function() {
                var delay = 1;
                if (!isLargeScreen) {
                    if (showingMenu) delay = 351;
                    V.Actions.moveMenu(move.left);
                }
                setTimeout(function() {
                    if (esModal) return;
                    var modal = $('<div/>').attr('id', 'modal');
                    $('body').append(modal).append(T.formAddNewChannel);
                    esModal = true;
                    setTimeout(function() {
                        modal.css('opacity', 1);
                        $id('txt-channel').focus();
                    }, 1);
                }, delay);
            }
        },
        Subreddits: {
            listContainer: $("#subs"),
            insert: function(subs, active) {
                var subsList = V.Subreddits.listContainer;
                if (subs instanceof Array) {
                    subsList.append(Mustache.to_html(T.Subreddits.list, subs));
                } else {
                    if (!M.Subreddits.listHasSub(subs)) {
                        subsList.append($("<li/>").attr("data-name", subs).append($("<p/>").addClass("sub").addClass((active ? "sub-active" : "")).text(subs)));
                        M.Subreddits.add(subs);
                    }
                }
            },
            remove: function(sub) {
                $(".sub-to-remove[data-name='" + sub + "']").remove();
                $("#subs > li[data-name='" + sub + "']").remove();
            },
            cleanSelected: function() {
                $(".sub.sub-active").removeClass("sub-active");
                $(".channel.channel-active").removeClass("channel-active");
            },
            showManualInput: function() {
                var delay = 1;
                if (!isLargeScreen) {
                    if (showingMenu) delay = 351;
                    V.Actions.moveMenu(move.left);
                }
                setTimeout(function() {
                    if (esModal) return;
                    var modal = $('<div/>').attr('id', 'modal');
                    $('body').append(modal).append(T.formAgregarSubManual);
                    esModal = true;
                    setTimeout(function() {
                        modal.css('opacity', 1);
                        $id('txt-new-sub').focus();
                    }, 1);
                }, delay);
            }
        },
        Posts: {
            show: function(links, paging) { // links: API raw data
                var linksCount = links.children.length,
                    main = V.mainWrap;

                if (paging) $(".loader").remove();
                else main.empty();

                if (linksCount === 0) {
                    var message = $query('.loader');
                    if (message) {
                        message.innerText = 'No Links available.';
                        message.classList.add('loader-error');
                        main.append('<div id="#main-overflow"></div>');
                    } else main.prepend('<div class="loader loader-error">No Links available.</div><div id="main-overflow"></div>');
                } else {
                    main.append(Mustache.to_html(T.Posts, links)); // Add new links to the list

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
                if (!paging) V.Anims.reveal();
            }
        },
        Actions: {
            setSubTitle: function(title) {
                V.subtitleText.text(title);
            },
            backToMainView: function(newTitle) {
                V.btnNavBack.addClass("invisible");
                V.subtitle.removeClass("invisible");
                V.headerSection.empty().append(V.headerIcon);
                if (newTitle) V.Actions.setSubTitle(newTitle);
                V.Anims.slideFromLeft();
            },
            moveMenu: function(direction) {
                if (direction === move.left) {
                    V.container.css({
                        '-webkit-transform': transforms.translateTo0,
                        'transform': transforms.translateTo0
                    });
                    setTimeout(function() {
                        showingMenu = false;
                    });
                }
                if (direction === move.right) {
                    V.container.css({
                        '-webkit-transform': transforms.translateTo140,
                        'transform': transforms.translateTo140
                    });
                    setTimeout(function() {
                        showingMenu = true;
                    });
                }
            },
            loadForAdding: function() {
                if (!isLargeScreen) V.Actions.moveMenu(move.left);
                if (currentView === view.comments) V.Actions.backToMainView();

                setTimeout(function() {
                    $id("main-wrap").scrollTop = 0; // Go to the container top
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
                }, isLargeScreen ? 1 : 351);
                V.Subreddits.cleanSelected();
                V.Actions.setSubTitle("+ Subreddits");
                setEditingSubs(true);
            },
            loadForRemoving: function() {
                if (!isLargeScreen) V.Actions.moveMenu(move.left);
                if (currentView === view.comments) V.Actions.backToMainView();

                setTimeout(function() {
                    $id("main-wrap").scrollTop = 0; // Up to container top
                    var htmlSubs = Mustache.to_html(T.Subreddits.toRemoveList, M.Subreddits.list);
                    var htmlChannels = '';
                    if (M.Channels.list && M.Channels.list.length > 0) {
                        htmlChannels = Mustache.to_html(T.Channels.toRemoveList, M.Channels.list);
                    }
                    var html = '<div id="remove-wrap">' + htmlSubs + htmlChannels + "</div>";
                    setTimeout(function() { // Intentional delay / fix for iOS
                        $id("main-wrap").innerHTML = html;
                    }, 10);
                    V.Subreddits.cleanSelected();
                    loadingLinks = false;
                }, isLargeScreen ? 1 : 351);
                V.Actions.setSubTitle('- Subreddits');
                setEditingSubs(true);
            },
            removeModal: function() {
                var modal = $('#modal');
                modal.css('opacity', '');
                $('.close-form').remove();
                $('.new-form').remove();
                esModal = false;
                setTimeout(function() {
                    modal.remove();
                }, 351);
            }
        },
        Misc: {
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
                var containerHeight = $id('container').offsetHeight,
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
                var main = V.mainView,
                    det = V.detailView;
                main.css("left", -ancho);
                setTimeout(function() {
                    var translate = 'translate3d(' + ancho + 'px, 0px, 0px)';
                    var cssTransform = {
                        '-webkit-transform': translate,
                        'transform': translate
                    };
                    main.addClass("slide-transition").css(cssTransform);
                    det.addClass("slide-transition").css(cssTransform);
                    setTimeout(function() {
                        var cssTransformBack = {
                            '-webkit-transform': '',
                            'transform': '',
                            'left': ''
                        };
                        main.removeClass("slide-transition").css(cssTransformBack).removeClass("fuera");
                        det.css(cssTransformBack).removeClass("slide-transition");
                        V.detailView.addClass("fuera"); // Hide
                        currentView = view.main;
                    }, 351);
                }, 50);
            },
            slideFromRight: function() {
                var main = V.mainView,
                    det = V.detailView;
                det.css("left", ancho);
                setTimeout(function() {
                    var translate = 'translate3d(-' + ancho + 'px, 0px, 0px)';
                    var cssTransform = {
                        '-webkit-transform': translate,
                        'transform': translate
                    };
                    main.addClass("slide-transition").css(cssTransform);
                    det.addClass("slide-transition").css(cssTransform);
                    setTimeout(function() { // Quita las propiedades de transition
                        var cssTransformBack = {
                            '-webkit-transform': '',
                            'transform': ''
                        };
                        det.css("left", 0).removeClass("slide-transition").removeClass("fuera").css(cssTransformBack);
                        main.removeClass("slide-transition").addClass("fuera").css(cssTransformBack);
                        currentView = view.comments;
                    }, 351);
                }, 100);
            },
            reveal: function() {
                var wrap = V.mainWrap;
                wrap.addClass("anim-reveal");
                setTimeout(function() {
                    wrap.removeClass("anim-reveal");
                }, 700);
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
                    $id("main-wrap").scrollTop = 0; // Sube al top del contenedor
                    setTimeout(function() {
                        main.prepend("<div class='loader'></div>");
                    }, showingMenu ? 351 : 1);
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
                setEditingSubs(false);
            },
            show: function(result, paging) {
                var links = result.data;
                loadingLinks = false;
                M.Posts.idLast = links.after;

                V.Posts.show(links, paging);
                M.Posts.setList(links);
            }
        },
        Comments: {
            load: function(data, baseElement, idParent) {
                var now = new Date().getTime();
                var converter = new Markdown.Converter();
                var com = $("<section/>");
                for (var i = 0; i < data.length; i++) {
                    var c = data[i];

                    if (c.kind !== "t1") continue;

                    var html = converter.makeHtml(c.data.body),
                        isPoster = M.Posts.list[currentThread].author === c.data.author,
                        permalink = "http://reddit.com" + M.Posts.list[currentThread].link + c.data.id,
                        commentLink = {
                            "href": permalink,
                            "target": "_blank"
                        };

                    var comment = $("<div/>").addClass("comment-wrap").append($('<div/>').append($("<div/>").addClass("comment-data").append($("<div/>").addClass(isPoster ? "comment-poster" : "comment-author").append($("<p/>").text(c.data.author))).append($("<div/>").addClass("comment-info").append($("<a/>").attr(commentLink).text(timeSince(now, c.data.created_utc))))).append($("<div/>").addClass("comment-body").html(html)));

                    if (c.data.replies) {
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
                var delay = 0;
                if (showingMenu) {
                    V.Actions.moveMenu(move.left);
                    delay = 351;
                }
                if (!M.Posts.list[id]) return; // Quick fix for missing id
                setTimeout(function() {

                    // Stop if it hasn't finished loading this comments for the first time before trying to load them again
                    if (loadingComments && currentThread && currentThread === id) return;

                    loadingComments = true;
                    currentThread = id;

                    V.btnNavBack.removeClass("invisible"); // Show
                    var detail = V.detailWrap;
                    detail.empty();

                    $id("detail-wrap").scrollTop = 0;

                    if (loadedLinks[id] && !refresh) {
                        detail.append(M.Posts.list[id].summary);
                        detail.append(loadedLinks[id]);
                        C.Misc.updatePostSummary(M.Posts.list[id], id);
                        loadingComments = false;
                    } else {
                        C.Misc.setPostSummary(M.Posts.list[id], id);
                        var url = "http://www.reddit.com" + M.Posts.list[id].link + urlEnd;
                        detail.append("<div class='loader'></div>");
                        $.ajax({
                            dataType: 'jsonp',
                            url: url,
                            success: function(result) {
                                if (currentThread !== id) return; // In case of trying to load a different thread before this one loaded.
                                C.Misc.updatePostSummary(result[0].data.children[0].data, id);
                                $(".loader").remove();
                                var comments = result[1].data.children;
                                C.Comments.load(comments, detail, id);
                                loadingComments = false;
                            },
                            error: function() {
                                loadingComments = false;
                                var error = 'Error loading comments. Refresh to try again.';
                                if (isWideScreen) $('.loader').addClass("loader-error").html(error + '<div class="comments-button" id="wide-refresh">Refresh</div>');
                                else $('.loader').addClass("loader-error").text(error);
                                if (!isDesktop) {
                                    detail.append($("<section/>"));
                                    V.Misc.scrollFixComments();
                                }
                            }
                        });
                    }

                    if (!refresh) {
                        if (isWideScreen) V.detailView.removeClass("fuera");
                        else if (currentView !== view.comments) V.Anims.slideFromRight();
                    }

                    if (isWideScreen) {
                        // Refresh active link indicator
                        $(".link.link-active").removeClass("link-active");
                        $('.link[data-id="' + id + '"]').addClass('link-active');
                    }

                    V.headerSection.empty().append(V.title);
                    V.title.text(M.Posts.list[id].title);
                    V.subtitle.addClass('invisible');
                }, delay);
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
                    if (sub.toUpperCase() === 'frontPage'.toUpperCase()) url = urlInit + "r/" + M.Subreddits.getAllString() + "/";
                    else url = urlInit + "r/" + sub + "/";
                    C.Posts.load(url);
                    C.currentSelection.setSubreddit(sub);
                }
                V.Actions.setSubTitle(sub);
            },
            remove: function(sub) {
                M.Subreddits.remove(sub);
                V.Subreddits.remove(sub);
                if (M.currentSelection.type === selection.sub && M.currentSelection.name === sub) C.currentSelection.setSubreddit('frontPage'); // If it was the current selection
            }
        },
        Channels: {
            add: function(channel) {
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
                    delay = 351;
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
                var imageLink = checkImageLink(M.Posts.list[postID].url);
                if (imageLink) { // If it's an image link
                    summaryHTML += "<img class='image-preview' src='" + imageLink + "' />";
                }
                if (data.selftext) { // If it has selftext
                    var selfText;
                    if (M.Posts.list[postID].selftextParsed) {
                        selfText = M.Posts.list[postID].selftext;
                    } else {
                        var summaryConverter1 = new Markdown.Converter();
                        selfText = summaryConverter1.makeHtml(data.selftext);
                        M.Posts.list[postID].selftext = selfText;
                        M.Posts.list[postID].selftextParsed = true;
                    }
                    summaryHTML += "<div id='selftext'>" + selfText + "</div>";
                }
                V.detailWrap.append(summaryHTML);
                C.Misc.updatePostTime(data.created_utc);
                M.Posts.list[postID].summary = summaryHTML;
            },
            updatePostSummary: function(data, postID) {
                $id("summary-comment-num").innerText = data.num_comments + (data.num_comments === 1 ? ' comment' : ' comments');
                // Time ago
                C.Misc.updatePostTime(data.created_utc);
                M.Posts.list[postID].num_comments = data.num_comments;
                M.Posts.list[postID].created_utc = data.created_utc;
            },
            updatePostTime: function(time) {
                $id("summary-time").innerText = timeSince(new Date().getTime(), time);
            }
        }
    };

    function checkWideScreen() {
        return win.matchMedia("(min-width: 1000px)").matches;
    }

    function checkLargeScreen() {
        return win.matchMedia("(min-width: 490px)").matches;
    }

    function checkImageLink(url) {
        var matching = url.match(/\.(svg|jpe?g|png|gif)(?:[?#].*)?$|(?:imgur\.com|www.quickmeme\.com\/meme|qkme\.me)\/([^?#\/.]*)(?:[?#].*)?(?:\/)?$/);
        if (!matching) return '';
        if (matching[1]) { // normal image link
            return url;
        } else if (matching[2]) { // imgur or quickmeme link
            if (matching[0].slice(0, 5) === "imgur") return 'http://imgur.com/' + matching[2] + '.jpg';
            else return 'http://i.qkme.me/' + matching[2] + '.jpg';
        } else {
            return null;
        }
    }

    function setEditingSubs(editing) { // editing: boolean
        editingSubs = editing;
        if (isWideScreen) {
            // If it's showing the add or remove subreddits/channels panel, hide the refresh button
            var refreshButton = $query('.refresh-icon-FS');
            refreshButton.style.display = editing ? 'none' : '';
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
        var newSub = $('#txt-new-sub').val();
        V.Actions.removeModal();
        if (!newSub) return; // Si no se ingreso nada, no pasa nada.
        // En caso de haber ingresado algo, cargar el contenido del nuevo subreddit, de forma asincrona
        $.ajax({
            url: urlInit + "r/" + newSub + "/" + C.Sorting.get() + urlLimitEnd,
            dataType: 'jsonp',
            success: function(data) {
                C.Posts.loadFromManualInput(data);
                V.Actions.setSubTitle(newSub);
                V.Subreddits.cleanSelected();
                C.currentSelection.setSubreddit(newSub);
                V.Subreddits.insert(newSub, true);
            },
            error: function() {
                alert('Oh, the subreddit you entered is not valid...');
            }
        });
    });

    function goToComments(id) {
        location.hash = '#comments:' + id;
    }

    function refreshCurrentStream() {
        doByCurrentSelection(function() { // if it's subreddit
            if (M.currentSelection.name.toUpperCase() === 'frontPage'.toUpperCase()) C.Posts.load(urlInit + "r/" + M.Subreddits.getAllString() + "/");
            else C.Posts.load(urlInit + "r/" + M.currentSelection.name + "/");
        }, function() { // if it's channel
            C.Channels.loadPosts(M.Channels.getByName(M.currentSelection.name));
        });
    }

    // Taps
    tappable("#btn-add-new-channel", {
        onTap: function(e, target) {
            var btn = $(target);
            var channelName = $('#txt-channel').val();
            if (!channelName) {
                V.Actions.removeModal();
                return;
            }

            var subreddits = [];
            var subs = $('#subs-for-channel input');
            for (var i = 0; i < subs.length; i++) {
                var sub = $(subs[i]).val();
                if (!sub) continue;
                subreddits.push(sub);
            }
            var channel = {};
            channel.name = channelName;
            channel.subs = subreddits;
            C.Channels.add(channel);

            // confirmation feedback on button itself
            btn.text("Channel Added.");
            btn.css({
                "background-image": "none",
                "background-color": "#33B300",
                "color": "white"
            });
            // remove modal after a moment
            setTimeout(function() {
                V.Actions.removeModal();
            }, 1500);
        },
        activeClass: 'list-button-active'
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
        activeClass: 'link-active'
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

    tappable("#nav-back", {
        onTap: function() {
            location.hash = "#";
        }
    });

    tappable(".refresh", {
        onTap: function(e) {
            if (currentView === view.comments) {
                if (!currentThread) return;
                C.Comments.show(currentThread, true);
            }
            if (currentView === view.main && !editingSubs) {
                refreshCurrentStream();
            }
        }
    });

    tappable(".link", {
        onTap: function(e, target) {
            var comm = $(target);
            var id = comm.attr("data-id");
            var link = M.Posts.list[id];
            if (link.self || isWideScreen) {
                goToComments(id);
            } else {
                var url = comm.attr("href");
                var a = doc.createElement('a');
                a.setAttribute("href", url);
                a.setAttribute("target", "_blank");

                var dispatch = doc.createEvent("HTMLEvents");
                dispatch.initEvent("click", true, true);
                a.dispatchEvent(dispatch);
            }
        },
        allowClick: false,
        activeClassDelay: 100,
        activeClass: 'link-active'
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
            if ((!isDesktop && loadingLinks) || isLargeScreen) return;
            V.Actions.moveMenu(showingMenu ? move.left : move.right);
        },
        activeClass: 'sub-title-active'
    });

    tappable("#add-new-sub", {
        onTap: function() {
            V.Actions.loadForAdding();
        }
    });

    tappable("#remove-sub", {
        onTap: function() {
            V.Actions.loadForRemoving();
        }
    });

    tappable("#more-links", {
        onTap: function() {
            doByCurrentSelection(function() {
                var url;
                if (M.currentSelection.name.toUpperCase() === 'frontPage'.toUpperCase()) url = urlInit + "r/" + M.Subreddits.getAllString() + "/";
                else url = urlInit + "r/" + M.currentSelection.name + "/";
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
            V.Subreddits.showManualInput();
        },
        activeClass: 'list-button-active'
    });

    tappable("#btn-add-channel", {
        onTap: function() {
            V.Channels.showNewChannelForm();
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
                    $('.loader').addClass('loader-error').text('Error loading more subreddits. Refresh to try again.');
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
            V.Subreddits.insert(newSub);
        },
        activeClass: 'button-active'
    });

    tappable(".sub-to-remove > div", {
        onTap: function(e, target) {
            C.Subreddits.remove($(target).data('name'));
        },
        activeClass: 'button-active'
    });

    tappable(".channel-to-remove > div", {
        onTap: function(e, target) {
            C.Channels.remove($(target).data('title'));
        },
        activeClass: 'button-active'
    });

    tappable(".close-form", {
        onTap: function() {
            V.Actions.removeModal();
        }
    });

    tappable("#about", {
        onTap: function() {
            var delay = 1;
            if (!isLargeScreen) {
                V.Actions.moveMenu(move.left);
                delay = 351;
            }
            setTimeout(function() {
                if (esModal) return;
                var modal = $('<div/>').attr('id', 'modal');
                $('body').append(modal).append(T.about);
                esModal = true;
                setTimeout(function() {
                    modal.css('opacity', 1);
                }, 1);
            }, delay);
        },
        activeClass: 'link-active',
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

    // Swipes
    V.detailView.swipeRight(function() {
        if (isWideScreen) return;
        location.hash = "#";
    });

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

    // Show option to reload app after update
    if (win.applicationCache)
        win.applicationCache.addEventListener("updateready", function(e) {
            var delay = 1;
            if (showingMenu) {
                V.Actions.moveMenu(move.left);
                delay = 351;
            }
            setTimeout(function() {
                V.mainWrap.prepend("<div id='top-buttons'><div id='btn-update'>Reeddit updated. Press to reload</div></div>");
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
        ancho = $(win).width();
        store.setItem("win:width", ancho);
        store.setItem("win:height", $(win).height());
        isWideScreen = checkWideScreen();
        isLargeScreen = checkLargeScreen();
        scrollTop();
        if (isLargeScreen && showingMenu) V.Actions.moveMenu(move.left);
        if (isiPad) scrollFix();
    }, false);

    if (location.hash) location.hash = ''; // Clear hash at first app loading
    // Pseudo-hash-router
    win.addEventListener('hashchange', function() {
        if (location.hash === '') {
            var delay = 1;
            if (currentView === view.comments) {
                V.Actions.backToMainView();
                delay = 351;
            }
            if (isWideScreen) {
                $('.link.link-active').removeClass('link-active');
                V.detailWrap.html(T.noLink);
            } else {
                setTimeout(function() {
                    V.detailWrap.empty();
                }, delay);
            }
        } else {
            var match = location.hash.match(/(#comments:)((?:[a-zA-Z0-9]*))/);
            if (match && match[2]) {
                var id = match[2];
                C.Comments.show(id);
            }
        }
    }, false);

    // App init
    V.title.remove();

    var mainWinWidth = store.getItem("win:width");
    var mainWinHeight = store.getItem("win:height");

    if (mainWinHeight && mainWinWidth) {
        mainWindow.resizeTo(mainWinWidth, mainWinHeight);
    }

    if (isWideScreen) V.detailWrap.html(T.noLink);

    M.currentSelection.loadSaved();

    C.Subreddits.loadSaved();
    C.Channels.loadSaved();

    // Cargar links y marcar como activo al subreddit actual - la 1ra vez sera el 'frontPage'
    doByCurrentSelection(function() { // En caso de ser un subreddit
        var i = M.Subreddits.list.indexOf(M.currentSelection.name);
        if (i > -1) {
            var activeSub = doc.getElementsByClassName('sub')[i];
            $(activeSub).addClass('sub-active');
        }
        // Load links
        if (M.currentSelection.name.toUpperCase() === 'frontPage'.toUpperCase()) {
            C.currentSelection.setSubreddit('frontPage');
            C.Posts.load(urlInit + "r/" + M.Subreddits.getAllString() + "/");
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

    if (!isDesktop) {
        var touch = "touchmove";
        $id("edit-subs").addEventListener(touch, function(e) {
            e.preventDefault();
        }, false);
        doc.getElementsByTagName('header')[0].addEventListener(touch, function(e) {
            if (showingMenu) e.preventDefault(); // Cheat temporal, para evitar que las vistas hagan overflow
        }, false);
        isiPad = /iPad/.test(navigator.userAgent);
        if (isiPad) {
            scrollFix = function() {
                // This slight height change makes the menu container 'overflowy', to allow scrolling again on iPad - weird bug
                var nextHeight = '36px' === $('.menu-desc').css('height') ? '35px' : '36px';
                setTimeout(function() {
                    $('.menu-desc').css('height', nextHeight);
                }, 500);
            };
            scrollFix();
        }
    }

})(window);