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
    inactiveClassDelay: 200,
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
        V.Subreddits.insert(newSub);
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

V.detailWrap.on('click', '.comments-container a, #selftext a', function(ev) {
    var imageURL = checkImageLink(ev.target.href);
    if(imageURL) {
        ev.preventDefault();
        V.Actions.showImageViewer(imageURL);
    }
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
