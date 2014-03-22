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
        },
        loadList: function() {
            V.Channels.menuContainer.html(Mustache.to_html(T.Channels.list, M.Channels.list));
        },
        remove: function(name) {
            $('.channel[data-title="' + name + '"]').parent().remove();
            $('.channel-to-remove[data-title="' + name + '"]').remove();
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
                var message = $query('.loader');
                if (message) {
                    message.innerText = 'No Links available.';
                    message.classList.add('loader-error');
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
            V.Actions.setSubTitle("+ Subreddits");
            setEditingSubs(true);
        },
        loadForRemoving: function() {
            if (!isLargeScreen) V.Actions.moveMenu(move.left);
            if (currentView === view.comments) V.Actions.backToMainView();

            setTimeout(function() {
                V.mainWrap[0].scrollTop = 0; // Up to container top
                var htmlSubs = Mustache.to_html(T.Subreddits.toRemoveList, M.Subreddits.list);
                var htmlChannels = '';
                if (M.Channels.list && M.Channels.list.length > 0) {
                    htmlChannels = Mustache.to_html(T.Channels.toRemoveList, M.Channels.list);
                }
                var html = '<div id="remove-wrap">' + htmlSubs + htmlChannels + "</div>";
                setTimeout(function() { // Intentional delay / fix for iOS
                    V.mainWrap.html(html);
                }, 10);
                V.Subreddits.cleanSelected();
                loadingLinks = false;
            }, isLargeScreen ? 1 : 301);
            V.Actions.setSubTitle('- Subreddits');
            setEditingSubs(true);
        },
        showModal: function(template, callback) {
            var delay = 1;
            if (!isLargeScreen && showingMenu) {
                V.Actions.moveMenu(move.left);
                delay = 301;
            }
            setTimeout(function() {
                if (esModal) return;
                var modal = $('<div/>').attr('id', 'modal');
                modal.append(template);
                $('body').append(modal);
                esModal = true;
                setTimeout(function() {
                    modal.css('opacity', 1);
                    V.Anims.bounceInDown($(".new-form"));
                }, 1);
                if (callback) callback();
            }, delay);
        },
        removeModal: function() {
            var modal = $('#modal');
            modal.css('opacity', '');
            esModal = false;
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
                bntMnml.text("Mnml: on");
            } else {
                body.classList.remove(css.mnml);
                bntMnml.text("Mnml: off");
            }
            if (save) store.setItem("mnml", mnml);
        },
        setDetailFooter: function(title) {
            V.footerPost.text(title ? title : T.noLink);
            var btns = $("#detail-footer .btn-footer");
            if (title) btns.removeClass(css.hide);
            else btns.addClass(css.hide);
        }
    },
    Comments: {
        setRest: function(id, refresh) {
            var postTitle = M.Posts.list[id].title;

            if (!refresh) V.Actions.setDetailFooter(postTitle);

            if (!refresh && currentView !== view.comments) V.Anims.slideFromRight();

            if (isWideScreen) {
                // Refresh active link indicator
                $(".link.link-selected").removeClass("link-selected");
                $('.link[data-id="' + id + '"]').addClass('link-selected');
            }

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