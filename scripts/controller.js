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
        },
        addFromNewForm: function() {
            var txtSub = $id("txt-new-sub"),
                subName = txtSub.value;
            if (!subName) {
                txtSub.setAttribute("placeholder", "Enter a subreddit title!");
                V.Anims.shakeForm();
                return;
            }

            V.Anims.bounceOut($(".new-form"), V.Actions.removeModal);

            $.ajax({
                url: urlInit + "r/" + subName + "/" + C.Sorting.get() + urlLimitEnd,
                dataType: 'jsonp',
                success: function(data) {
                    C.Posts.loadFromManualInput(data);
                    V.Actions.setSubTitle(subName);
                    V.Subreddits.cleanSelected();
                    C.currentSelection.setSubreddit(subName);
                    V.Subreddits.insert(subName, true);
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
