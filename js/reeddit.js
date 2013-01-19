$(document).ready(function() {

    // Templates
    var linksTemplate = "{{#children}}<article class='linkWrap'><a class='link' href='{{data.url}}' data-id='{{data.id}}' target='_blank'><div class='linkInfo'><p class='linkTitle'>{{data.title}}</p><p class='linkDomain'>{{data.domain}}</p><p class='linkSub'>{{data.subreddit}}</p></div><div class='linkThumb'><div style='background-image: url({{data.thumbnail}})'></div></div></a><div class='toComments' data-id='{{data.id}}'><div></div></div></article>{{/children}}<div class='listButton'><span id='moreLinks'>More</span></div><div id='mainOverflow'></div>",
        linksTemplateLeft = "{{#children}}<article class='linkWrap'><a class='link' href='{{data.url}}' data-id='{{data.id}}' target='_blank'><div class='linkThumb'><div class='marginless' style='background-image: url({{data.thumbnail}})'></div></div><div class='linkInfo thumbLeft'><p class='linkTitle'>{{data.title}}</p><p class='linkDomain'>{{data.domain}}</p><p class='linkSub'>{{data.subreddit}}</p></div></a><div class='toComments' data-id='{{data.id}}'><div class='rightArrow'></div></div></article>{{/children}}<div class='listButton'><span id='moreLinks'>More</span></div><div id='mainOverflow'></div>",
        linkSummaryTemplate = "<section><div id='linkSummary'><a href='{{url}}' target='_blank'><p id='summaryTitle'>{{title}}</p><p id='summaryDomain'>{{domain}}</p></a><p id='summaryAuthor'>by {{author}}</p></div><div id='summaryExtra'><p id='summarySub'>{{subreddit}}</p><p id='summaryTime'></p><p id='summaryCommentNum'>{{num_comments}} comments</p></div></section>",
        allSubredditsTemplate = "{{#children}}<div class='subreddit'><div><p class='subredditTitle'>{{data.display_name}}</p><p class='subredditDesc'>{{data.public_description}}</p></div><div class='btnAddSub'><div></div></div></div>{{/children}}",
        botonAgregarSubManualTemplate = "<div id='topButtons'><div id='btnSubMan'>Insert Manually</div><div id='btnAddChannel'>Add Channel</div></div>",
        formAgregarSubManualTemplate = '<div class="newForm" id="formNuevoSub"><div class="closeForm">close</div><form><input type="text" id="txtNuevoSub" placeholder="New subreddit name" /></form></div>',
        formAddNewChannelTemplate = '<div class="newForm" id="formNewChannel"><div class="closeForm">close</div><input type="text" id="txtChannel" placeholder="Channel name" /><div id="subsForChannel"><input type="text" placeholder="Subreddit 1" /><input type="text" placeholder="Subreddit 2" /><input type="text" placeholder="Subreddit 3" /></div><div id="btnAddNewChannel">Add Channel</div></div>',
        botonCargarMasSubsTemplate = "<div class='listButton'><span id='moreSubs'>More</span></div>",
        savedSubredditsListToRemoveTemplate = "<ul class='removeList'>{{#.}}<div class='itemToRemove subToRemove'><p>{{.}}</p><div></div></div>{{/.}}</ul>",
        savedChannelsListToRemoveTemplate = "<p id='removeTitle'>Channels</p><ul class='removeList'>{{#.}}<div class='itemToRemove channelToRemove'><p>{{name}}</p><div></div></div>{{/.}}</ul>",
        channelTemplate = '<li><div class="channel"><p>{{name}}</p><div>{{#subs}}<p>{{.}}</p>{{/subs}}</div></div></li>',
        channelsTemplate = '{{#.}}' + channelTemplate + '{{/.}}',
        noLinkTemplate = "<div id='noLink'><p>No Post Selected.</div>",
        aboutTemplate = "<div class='newForm aboutReeddit'><div class='closeForm'>close</div><ul><li><a href='./about' target='_blank'>Reeddit info site</a></li><li><a href='https://github.com/berbaquero/reeddit' target='_blank'>GitHub Project</a></li></ul><p>Built by <a href='https://twitter.com/berbaquero' target='_blank'>@BerBaquero</a></p></div>";

    // Pseudo-Globals
    var ancho = $(window).width(),
        currentView = 1,
        editingSubs = false,
        urlInit = "http://www.reddit.com/",
        urlEnd = ".json?jsonp=?",
        urlLimitEnd = ".json?limit=30&jsonp=?",
        loadedLinks = {},
        posts = {},
        replies = {},
        current = {},
        channels = [],
        showingMenu = false,
        subreddits, store = window.fluid ? allCookies : window.localStorage,
        ultimoLink, ultimoSub, esModal = false,
        loadingComments = false,
        loadingLinks = false,
        hiloActual, savedSubs, isWideScreen = checkWideScreen(),
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
        };

    var defaultSubs = ["frontPage", "pics", "funny", "IAmA", "AskReddit", "worldNews", "todayilearned", "technology", "science", "atheism", "geek", "videos", "reactiongifs", "AdviceAnimals", "aww"];

    var defaultChannel = [{
        name: 'Media',
        subs: ["movies", "music", "games"],
        url: 'r/movies+music+games'
    }];

    function checkWideScreen() {
        return window.matchMedia("(min-width: 1000px)").matches;
    }

    function checkLargeScreen() {
        return window.matchMedia("(min-width: 490px)").matches;
    }

    function loadLinks(baseUrl, fromSub, links, paging) {
        var main = $("#mainWrap");
        editingSubs = false;
        loadingComments = false;
        loadingLinks = true;
        if(fromSub) { // Si viene de seleccionar un subreddit
            document.getElementById("mainWrap").scrollTop = 0; // Sube al top del contenedor
            if(!links) {
                setTimeout(function() {
                    if(loadingLinks) main.prepend("<p class='loading'>Loading links...</p>");
                }, 351);
            }
        } else { // Si se esta cargando inicialmente
            if(!paging) { // Si no hay paginacion
                main.empty(); // Se quitan los links actuales
            } else { // Si hay paginacion
                $("#moreLinks").parent().remove(); // Solo se quita el boton de 'More' actual
            }
            main.append("<p class='loading'>Loading links...</p>");
        }
        if(links) { // Si ya los links fueron pedidos y devueltos
            processAndRenderLinks(links, fromSub, main);
        } else { // Si aun no se piden los links
            if(!paging) { // Si no hay paginacion
                paging = ''; // Se pasa una cadena vacia, para no paginar
            }
            $.ajax({
                dataType: 'jsonp',
                url: baseUrl + getSorting() + urlLimitEnd + paging,
                success: function(result) {
                    processAndRenderLinks(result, fromSub, main);
                },
                error: function() {
                    $('.loading').text('Error loading links. Refresh to try again.');
                }
            });
        }
    }

    function processAndRenderLinks(result, fromSub, main) {
        var links = result.data;
        ultimoLink = links.after;
        loadingLinks = false;
        var numThumbs = 0;
        for(var i = 0; i < links.children.length; i++) {
            var link = links.children[i];
            if(posts[link.data.id]) { // Si ya se ha cargado este link localmente
                // Se actualizan los datos dinamicos
                posts[link.data.id].num_comments = link.data.num_comments;
                posts[link.data.id].created_utc = link.data.created_utc;
            } else { // Si no se han cargado los links localmente
                posts[link.data.id] = {
                    "title": link.data.title,
                    "selftext": link.data.selftext,
                    "created_utc": link.data.created_utc,
                    "domain": link.data.domain,
                    "subreddit": link.data.subreddit,
                    "num_comments": link.data.num_comments,
                    "url": link.data.url,
                    "self": link.data.is_self,
                    "link": link.data.permalink,
                    "author": link.data.author
                };
            }
            // Se cuentan los thumbnails que se pueden mostrar
            if(link.data.thumbnail || link.data.thumbnail === 'detault' || link.data.thumbnail === 'nsfw' || link.data.thumbnail === 'self') {
                numThumbs++;
            }
        }

        // If more than half of the links contains thumbnails, show them on the left.
        var html = Mustache.to_html(numThumbs > 15 ? linksTemplateLeft : linksTemplate, links);
        if(fromSub) {
            main.empty();
        } else {
            $(".loading").remove();
        }

        main.append(html); // Add new links to the list
        if(links.children.length === 0) {
            var message = document.querySelector('#mainWrap .loading');
            if(message) {
                message.innerText('No Links available.');
            } else {
                main.prepend('<p class="loading">No Links available.</p>');
            }
        } else {
            // Remove thumbnail space for those links with invalid ones.
            var thumbs = $('.linkThumb div');
            $.each(thumbs, function(i, t) {
                var thumb = $(t);
                var bg = thumb.attr('style');
                if(bg === 'background-image: url()' || bg === 'background-image: url(default)' || bg === 'background-image: url(nsfw)' || bg === 'background-image: url(self)') {
                    thumb.parent().remove();
                }
            });
        }
        // Remove 'More links' button if there are less than 30 links
        if(links.children.length < 30) {
            $('#moreLinks').parent().remove();
        }

        if(!isDesktop) {
            scrollFixLinks();
        }
    }

    function loadComments(data, baseElement, idParent) {
        var now = new Date().getTime();
        var converter = new Markdown.Converter();
        var com = $("<section/>");
        for(var i = 0; i < data.length; i++) {
            var c = data[i];

            if(c.kind !== "t1") continue;

            var html = converter.makeHtml(c.data.body);

            var isPoster = posts[hiloActual].author === c.data.author;

            var comment = $("<div/>").addClass("commentWrap").append($('<div/>').append($("<div/>").addClass("commentData").append($("<div/>").addClass(isPoster ? "commentPoster" : "commentAuthor").append($("<p/>").text(c.data.author))).append($("<div/>").addClass("commentInfo").append($("<p/>").text(timeSince(now, c.data.created_utc))))).append($("<div/>").addClass("commentBody").html(html)));

            if(c.data.replies) {
                comment.append($("<span/>").addClass("commentsButton repliesButton").attr("comment-id", c.data.id).text("See replies"));
                replies[c.data.id] = c.data.replies.data.children;
            }

            com.append(comment);
        }

        baseElement.append(com);

        if(idParent) loadedLinks[idParent] = com;

        $("#detailWrap a").attr("target", "_blank");

        if(!isDesktop) {
            scrollFixComments();
        }
    }

    function scrollFixLinks() {
        // Make links section always scrollable
        var wraps = document.querySelectorAll('.linkWrap');
        var totalHeight = 0;
        for(var w = 0; w < wraps.length; w++) {
            totalHeight += wraps[w].offsetHeight;
        }
        var containerHeight = document.querySelector('#container').offsetHeight;
        var headerHeight = document.querySelector('header').offsetHeight;
        var message = document.querySelector('#mainWrap .loading');
        var messageHeight = message ? message.offsetHeight : 0;
        var minHeight = containerHeight - headerHeight - messageHeight;
        if(totalHeight > minHeight) {
            $('#mainOverflow').css('min-height', '');
        } else {
            $('#mainOverflow').css('min-height', minHeight - totalHeight + 1);
        }
    }

    function scrollFixComments() {
        // Make comments section always scrollable
        var detailWrap = document.querySelector('#detailWrap');
        var detailWrapHeight = detailWrap.offsetHeight;
        var linkSummary = detailWrap.querySelector('section:first-child');
        var linkSummaryHeight = linkSummary.offsetHeight;
        var selfText = detailWrap.querySelector('#selfText');
        var selfTextHeight = selfText ? selfText.offsetHeight : 0;
        var imagePreview = detailWrap.querySelector('.imagePreview');
        var imagePreviewHeight = imagePreview ? imagePreview.offsetHeight : 0;
        var minHeight = detailWrapHeight - linkSummaryHeight - selfTextHeight - imagePreviewHeight + 1;
        $('#detailWrap > section + ' + (selfTextHeight > 0 ? '#selfText +' : '') + (imagePreviewHeight > 0 ? '.imagePreview +' : '') + ' section').css('min-height', minHeight);
    }

    function procesarComentarios(id, refresh) {
        var delay = 0;
        if(showingMenu) {
            moveMenu(move.left);
            delay = 351;
        }
        if(!posts[id]) return; // Quick fix for missing id
        setTimeout(function() {
            if(loadingComments && hiloActual && hiloActual === id) return;
            loadingComments = true;
            hiloActual = id;

            $("#navBack").removeClass("invisible"); // Show
            var detail = $("#detailWrap");
            detail.empty();

            document.getElementById("detailWrap").scrollTop = 0;

            if(loadedLinks[id] && !refresh) {
                detail.append(posts[id].summary);
                detail.append(loadedLinks[id]);
                updateSummaryInfo(posts[id], id);
                loadingComments = false;
            } else {
                setPostSummaryInfo(posts[id], id);
                var url = "http://www.reddit.com" + posts[id].link + urlEnd;
                detail.append("<p class='loading'>Loading comments...</p>");
                $.ajax({
                    dataType: 'jsonp',
                    url: url,
                    success: function(result) {
                        if(hiloActual !== id) return; // In case of trying to load a different thread before this one loaded.
                        updateSummaryInfo(result[0].data.children[0].data, id);
                        $(".loading").remove();
                        var comments = result[1].data.children;
                        loadComments(comments, detail, id);
                        loadingComments = false;
                    },
                    error: function() {
                        loadingComments = false;
                        var error = 'Error loading comments. Refresh to try again.';
                        if(isWideScreen) {
                            $('.loading').html(error + '<div class="commentsButton" id="wideRefresh">Refresh</div>');
                        } else {
                            $('.loading').text(error);
                        }
                    }
                });
            }

            if(!refresh) {
                if(isWideScreen) {
                    $("#detailView").removeClass("fuera");
                } else {
                    if(currentView !== view.comments) slideFromRight();
                }
            }

            if(isWideScreen) {
                // Refresh active link indicator
                $(".link.link-active").removeClass("link-active");
                $('.link[data-id="' + id + '"]').addClass('link-active');
            }

            $("#titleHead").empty().append(title);
            $("#title").text(posts[id].title);
            $("#mainTitle").addClass('invisible');
        }, delay);
    }

    function setPostSummaryInfo(data, postID) {
        // Main content
        var summaryHTML = Mustache.to_html(linkSummaryTemplate, data);
        var imageLink = checkImageLink(posts[postID].url);
        if(imageLink) { // If it's an image link
            summaryHTML += "<img class='imagePreview' src='" + imageLink + "' />";
        }
        if(data.selftext) { // If it has self-text
            var selfText;
            if(posts[postID].selftextParsed) {
                selfText = posts[postID].selftext;
            } else {
                var summaryConverter1 = new Markdown.Converter();
                selfText = summaryConverter1.makeHtml(data.selftext);
                posts[postID].selftext = selfText;
                posts[postID].selftextParsed = 1; // truey
            }
            summaryHTML += "<div id='selfText'>" + selfText + "</div>";
        }
        $("#detailWrap").append(summaryHTML);

        // Time ago
        updatePostTime(data.created_utc);

        posts[postID].summary = summaryHTML;
    }

    function updateSummaryInfo(data, postID) {
        $("#summaryCommentNum").text(data.num_comments + (data.num_comments === 1 ? ' comment' : ' comments'));
        // Time ago
        updatePostTime(data.created_utc);
        posts[postID].num_comments = data.num_comments;
        posts[postID].created_utc = data.created_utc;
    }

    function checkImageLink(url) {
        var matching = url.match(/\.(svg|jpe?g|png|gif)(?:[?#].*)?$|(?:imgur\.com|www.quickmeme\.com\/meme|qkme\.me)\/([^?#\/.]*)(?:[?#].*)?(?:\/)?$/);
        if(!matching) return '';
        if(matching[1]) { // normal image link
            return url;
        } else if(matching[2]) { // imgur link
            if(matching[0].slice(0,5)==="imgur") {
                return 'http://imgur.com/' + matching[2] + '.jpg';
            } else {
                return 'http://i.qkme.me/' + matching[2] + '.jpg';
            }
        } else {
            return null;
        }
    }

    function updatePostTime(time) {
        $("#summaryTime").text(timeSince(new Date().getTime(), time));
    }

    function doByCurrentSelection(caseSub, caseChannel) {
        switch(current.type) {
        case selection.sub:
            caseSub();
            break;
        case selection.channel:
            caseChannel();
            break;
        }
    }

    function loadSubsList() { // Only should execute when first loading the app
        savedSubs = getSavedSubs();
        if(savedSubs) {
            insertSubsToList(savedSubs);
        } else { // If it hasn't been loaded to the 'local store'
            savedSubs = defaultSubs; // save default subreddits
            insertSubsToList(savedSubs);
            store.setItem("subreeddits", JSON.stringify(savedSubs));
        }
    }

    function setCurrentSub(sub) {
        current.name = sub;
        current.type = selection.sub;
        store.setItem('currentSelection', JSON.stringify(current));
    }

    function setCurrentChannel(channel) {
        current.name = channel.name;
        current.type = selection.channel;
        store.setItem('currentSelection', JSON.stringify(current));
    }

    function getAllSubsString() {
        var allSubs = '';
        for(var i = 0; i < savedSubs.length; i++) {
            var sub = savedSubs[i];
            if(sub.toUpperCase() === 'frontPage'.toUpperCase()) continue;
            allSubs += sub + '+';
        }
        return allSubs.substring(0, allSubs.length - 1);
    }

    function setSubTitle(title) {
        $("#subTitle").text(title);
    }

    function backToMainView(newTitle) {
        $("#navBack").addClass("invisible");
        $("#mainTitle").removeClass('invisible');
        $("#titleHead").empty().append(headerIcon);
        if(newTitle) {
            setSubTitle(newTitle);
        }
    }

    function loadSub(sub) {
        if(sub !== current.name || editingSubs) {
            var url;
            if(sub.toUpperCase() === 'frontPage'.toUpperCase()) {
                url = urlInit + "r/" + getAllSubsString() + "/";
            } else {
                url = urlInit + "r/" + sub + "/";
            }
            loadLinks(url, true);
            setCurrentSub(sub);
        }
        setSubTitle(sub);
    }

    function moveMenu(direction) {
        if(direction === move.left) {
            $("#container").css({
                '-webkit-transform': transforms.translateTo0,
                'transform': transforms.translateTo0
            });
            setTimeout(function() {
                showingMenu = false;
            });
        }
        if(direction === move.right) {
            $("#container").css({
                '-webkit-transform': transforms.translateTo140,
                'transform': transforms.translateTo140
            });
            setTimeout(function() {
                showingMenu = true;
            });
        }
    }

    function loadSubredditListToAdd() {
        if(!isLargeScreen) {
            moveMenu(move.left);
        }
        if(currentView === view.comments) {
            backToMainView();
            slideFromLeft();
        }
        setTimeout(function() {
            document.getElementById("mainWrap").scrollTop = 0; // Go to the container top
            var main = $("#mainWrap");
            if(subreddits) {
                main.empty().append(botonAgregarSubManualTemplate).append(subreddits).append(botonCargarMasSubsTemplate);
            } else {
                main.prepend("<p class='loading'>Loading subreddits...</p>").prepend(botonAgregarSubManualTemplate);
                $.ajax({
                    url: urlInit + "reddits/.json?limit=50&jsonp=?",
                    dataType: 'jsonp',
                    success: function(list) {
                        ultimoSub = list.data.after;
                        subreddits = Mustache.to_html(allSubredditsTemplate, list.data);
                        main.empty().append(botonAgregarSubManualTemplate).append(subreddits).append(botonCargarMasSubsTemplate);
                    },
                    error: function() {
                        $('.loading').text('Error loading subreddits.');
                    }
                });
            }
        }, isLargeScreen ? 1 : 351);
        limpiarSubrSeleccionado();
        setSubTitle("+ Subreddits");
        editingSubs = true;
    }

    function loadSubredditListToRemove() {
        if(!isLargeScreen) {
            moveMenu(move.left);
        }
        if(currentView === view.comments) {
            backToMainView();
            slideFromLeft();
        }
        setTimeout(function() {
            document.getElementById("mainWrap").scrollTop = 0; // Up to container top
            var htmlSubs = Mustache.to_html(savedSubredditsListToRemoveTemplate, savedSubs);
            var htmlChannels = '';
            if(channels && channels.length > 0) {
                htmlChannels = Mustache.to_html(savedChannelsListToRemoveTemplate, channels);
            }
            var html = '<div id="removeWrap">' + htmlSubs + htmlChannels + "</div>";
            setTimeout(function() { // Intentional delay / fix for iOS
                document.getElementById("mainWrap").innerHTML = html;
            }, 10);
            limpiarSubrSeleccionado();
        }, isLargeScreen ? 1 : 351);
        setSubTitle('- Subreddits');
        editingSubs = true;
    }

    function limpiarSubrSeleccionado() {
        $(".sub.sub-active").removeClass("sub-active");
        $(".channel.channel-active").removeClass("channel-active");
    }

    function insertSubsToList(subs, active) {
        var subsList = $("#subs");
        if(subs instanceof Array) {
            var subListTemplate = "{{#.}}<li><p class='sub'>{{.}}</p></li>{{/.}}";
            var html = Mustache.to_html(subListTemplate, subs);
            subsList.append(html);
        } else {
            if(!listContainsSub(subs)) {
                subsList.append($("<li/>").append($("<p/>").addClass("sub").addClass((active ? "sub-active" : "")).text(subs)));
                saveSub(subs);
            }
        }
    }

    function getSavedSubs() {
        var subs = store.getItem("subreeddits");
        if(subs) {
            subs = JSON.parse(subs);
            return subs;
        } else {
            return null;
        }
    }

    function loadCurrentSelection() {
        current = store.getItem('currentSelection');
        if(current) {
            current = JSON.parse(current);
        } else {
            current = {
                name: 'frontPage',
                type: selection.sub
            };
        }
        return current;
    }

    function mostrarIngresoSubManual() {
        var delay = 1;
        if(!isLargeScreen) {
            if(showingMenu) delay = 351;
            moveMenu(move.left);
        }
        setTimeout(function() {
            if(esModal) return;
            var modal = $('<div/>').attr('id', 'modal');
            $('body').append(modal).append(formAgregarSubManualTemplate);
            esModal = true;
            setTimeout(function() {
                modal.css('opacity', 1);
                document.getElementById('txtNuevoSub').focus();
            }, 1);
        }, delay);
    }

    function showNewChannelForm() {
        var delay = 1;
        if(!isLargeScreen) {
            if(showingMenu) delay = 351;
            moveMenu(move.left);
        }
        setTimeout(function() {
            if(esModal) return;
            var modal = $('<div/>').attr('id', 'modal');
            $('body').append(modal).append(formAddNewChannelTemplate);
            esModal = true;
            setTimeout(function() {
                modal.css('opacity', 1);
                document.getElementById('txtChannel').focus();
            }, 1);
        }, delay);
    }

    function quitarModal() {
        var modal = $('#modal');
        modal.css('opacity', '');
        $('.closeForm').remove();
        $('.newForm').remove();
        esModal = false;
        setTimeout(function() {
            modal.remove();
        }, 351);
    }

    function saveSub(newSub) {
        if(!listContainsSub(newSub)) {
            savedSubs.push(newSub);
            store.setItem("subreeddits", JSON.stringify(savedSubs));
        }
    }

    function listContainsSub(sub) {
        if(savedSubs) {
            var i = savedSubs.indexOf(sub);
            return i > -1;
        }
        return false;
    }

    $('body').on('submit', '#formNuevoSub form', function(e) {
        e.preventDefault();
        var newSubr = $('#txtNuevoSub').val();
        quitarModal();
        if(!newSubr) return; // Si no se ingreso nada, no pasa nada.
        // En caso de haber ingresado algo
        // Cargar el contenido del nuevo subrredit, de forma asincrona
        $.ajax({
            url: urlInit + "r/" + newSubr + "/" + getSorting() + urlLimitEnd,
            dataType: 'jsonp',
            success: function(data) {
                loadLinks("", false, data);
                setSubTitle(newSubr);
                limpiarSubrSeleccionado();
                setCurrentSub(newSubr);
                insertSubsToList(newSubr, true);
            },
            error: function() {
                alert('Oh, the subreddit you entered is not valid...');
            }
        });
    });

    // Channel Functions

    function insertChannel(channel) {
        channels.push(channel);
        var html = Mustache.to_html(channelTemplate, channel);
        $('#channels').append(html);
        store.setItem('channels', JSON.stringify(channels));
    }

    function loadSavedChannels() { // Should only execute when first loading the app
        channels = store.getItem('channels');
        if(channels) {
            channels = JSON.parse(channels);
        } else { // Load default channel(s?)
            channels = defaultChannel;
        }
        var html = Mustache.to_html(channelsTemplate, channels);
        $('#channels').html(html);
    }

    function getChannelByName(name) {
        var foundChannel;
        for(var i = 0; i < channels.length; i++) {
            if(channels[i].name === name) {
                foundChannel = channels[i];
                break;
            }
        }
        return foundChannel;
    }

    function loadChannel(channel) {
        loadLinks(urlInit + channel.url + '/', true);
        setSubTitle(channel.name);
        setCurrentChannel(channel);
    }

    function getChannelURLfromSubs(subs) {
        var url = 'r/';
        for(var i = 0; i < subs.length; i++) {
            var sub = subs[i];
            url += sub + '+';
        }
        url = url.substring(0, url.length - 1);
        return url;
    }

    function goToComments(id) {
        location.hash = '#comments:' + id;
    }

    function refreshCurrentStream() {
        doByCurrentSelection(function() { // if it's subreddit
            if(editingSubs) {
                return;
            } else if(current.name.toUpperCase() === 'frontPage'.toUpperCase()) {
                loadLinks(urlInit + "r/" + getAllSubsString() + "/");
            } else {
                loadLinks(urlInit + "r/" + current.name + "/");
            }
        }, function() { // if it's channel
            loadChannel(getChannelByName(current.name));
        });
    }

    function getSorting() {
        return(currentSortingChoice !== 'hot' ? (currentSortingChoice + '/') : '');
    }

    function changeSorting(sorting) {
        currentSortingChoice = sorting;
        var delay = 1;
        if(showingMenu) {
            moveMenu(move.left);
            delay = 351;
        }
        setTimeout(function() {
            refreshCurrentStream();
        }, delay);
    }

    // Taps
    tappable("#btnAddNewChannel", {
        onTap: function() {
            var channelName = $('#txtChannel').val();
            if(!channelName) {
                quitarModal();
                return;
            }

            var subreddits = [];
            var subs = $('#subsForChannel input');
            for(var i = 0; i < subs.length; i++) {
                var sub = $(subs[i]).val();
                if(!sub) continue;
                subreddits.push(sub);
            }
            quitarModal();
            var channel = {};
            channel.name = channelName;
            channel.subs = subreddits;
            channel.url = getChannelURLfromSubs(subreddits);
            insertChannel(channel);
        },
        activeClass: 'listButton-active'
    });

    tappable('.channel', {
        onTap: function(e, target) {
            var channel = $(target);
            var channelName = channel.children().first().text();
            moveMenu(move.left);
            if(channelName === current.name && !editingSubs) return;
            limpiarSubrSeleccionado();
            channel.addClass('channel-active');
            if(currentView === view.comments) {
                backToMainView();
                slideFromLeft();
            }
            loadChannel(getChannelByName(channelName));

        },
        activeClassDelay: 100,
        activeClass: 'link-active'
    });

    tappable(".repliesButton", {
        onTap: function(e, target) {
            var parent = $(target);
            var commentID = parent.attr('comment-id');
            var comments = replies[commentID];
            loadComments(comments, parent.parent());
            parent.remove();
        },
        activeClass: 'repliesButton-active'
    });

    tappable(".sub", {
        onTap: function(e, target) {
            var sub = $(target);
            moveMenu(move.left);
            loadSub(sub.first().text());
            limpiarSubrSeleccionado();
            sub.addClass('sub-active');
            if(currentView === view.comments) {
                backToMainView();
                slideFromLeft();
            }
        },
        allowClick: false,
        activeClassDelay: 100,
        activeClass: 'link-active'
    });

    tappable("#navBack", {
        onTap: function(e) {
            history.back(); // Should go to "/"
        }
    });

    tappable("#refresh", {
        onTap: function(e) {
            if(currentView === view.comments) {
                if(!hiloActual) return;
                procesarComentarios(hiloActual, true);
            }
            if(currentView === view.main) {
                refreshCurrentStream();
            }
        }
    });

    tappable(".link", {
        onTap: function(e, target) {
            var comm = $(target);
            var id = comm.attr("data-id");
            var link = posts[id];
            if(link.self || isWideScreen) {
                goToComments(id);
            } else {
                var url = comm.attr("href");
                var a = document.createElement('a');
                a.setAttribute("href", url);
                a.setAttribute("target", "_blank");

                var dispatch = document.createEvent("HTMLEvents");
                dispatch.initEvent("click", true, true);
                a.dispatchEvent(dispatch);
            }
        },
        allowClick: false,
        activeClassDelay: 100,
        activeClass: 'link-active'
    });

    tappable(".toComments", {
        onTap: function(e, target) {
            var id = $(target).attr('data-id');
            goToComments(id);
        },
        activeClass: 'button-active',
        activeClassDelay: 100
    });

    tappable("#wideRefresh", {
        onTap: function() {
            if(!hiloActual) return;
            procesarComentarios(hiloActual, true);
        },
        activeClass: 'repliesButton-active'
    });

    tappable("#subTitle", {
        onTap: function(e) {
            if(isLargeScreen) {
                return;
            }
            moveMenu(showingMenu ? move.left : move.right);
        },
        activeClass: 'subTitle-active'
    });

    tappable("#addNewSubr", {
        onTap: function(e) {
            loadSubredditListToAdd();
        }
    });

    tappable("#removeSubr", {
        onTap: function(e) {
            loadSubredditListToRemove();
        }
    });

    tappable("#moreLinks", {
        onTap: function() {
            doByCurrentSelection(function() {
                var url;
                if(current.name.toUpperCase() === 'frontPage'.toUpperCase()) {
                    url = urlInit + "r/" + getAllSubsString() + "/";
                } else {
                    url = urlInit + "r/" + current.name + "/";
                }
                loadLinks(url, false, false, '&after=' + ultimoLink);
            }, function() {
                var channel = getChannelByName(current.name);
                loadLinks(urlInit + channel.url + '/', false, false, '&after=' + ultimoLink);
            });

        },
        activeClass: 'listButton-active'
    });

    tappable("#btnSubMan", {
        onTap: function() {
            mostrarIngresoSubManual();
        },
        activeClass: 'listButton-active'
    });

    tappable("#btnAddChannel", {
        onTap: function() {
            showNewChannelForm();
        },
        activeClass: 'listButton-active'
    });

    tappable('#moreSubs', {
        onTap: function(e, target) {
            $(target).parent().remove();
            var main = $('#mainWrap');
            main.append("<p class='loading'>Loading subreddits...</p>");
            $.ajax({
                url: urlInit + 'reddits/' + urlEnd + '&after=' + ultimoSub,
                dataType: 'jsonp',
                success: function(list) {
                    var nuevosSubs = Mustache.to_html(allSubredditsTemplate, list.data);
                    ultimoSub = list.data.after;
                    $('.loading', main).remove();
                    main.append(nuevosSubs).append(botonCargarMasSubsTemplate);
                    subreddits = subreddits + nuevosSubs;
                },
                error: function() {
                    $('.loading').text('Error loading more links. Refresh to try again.');
                }
            });
        },
        activeClass: 'listButton-active'
    });

    tappable('.btnAddSub', {
        onTap: function(e, target) {
            var parent = $(target).parent();
            var newSub = $('.subredditTitle', parent).text();
            insertSubsToList(newSub);
        },
        activeClass: 'button-active'
    });

    tappable(".subToRemove > div", {
        onTap: function(e, target) {
            var subParent = $(target).parent();
            var subreddit = $("p", subParent).text();
            var subsFromList = $('.sub');

            for(var i = subsFromList.length - 1; i >= 0; i--) {
                var subText = subsFromList[i].innerHTML;
                if(subText === subreddit) {
                    $(subsFromList[i]).parent().remove();
                    break;
                }
            }

            var idx = savedSubs.indexOf(subreddit);
            savedSubs.splice(idx, 1);

            store.setItem("subreeddits", JSON.stringify(savedSubs));
            subParent.remove();

            // Verificar si era la seleccion actual
            if(current.type === selection.sub) {
                if(current.name === subreddit) {
                    setCurrentSub('frontPage');
                }
            }
        },
        activeClass: 'button-active'
    });

    tappable(".channelToRemove > div", {
        onTap: function(e, target) {
            var channelParent = $(target).parent();
            var channel = $("p", channelParent).text();
            var channelsFromList = $('.channel');

            for(var i = channelsFromList.length - 1; i >= 0; i--) {
                var channelText = $('p', channelsFromList[i]).first().text();
                if(channelText === channel) {
                    $(channelsFromList[i]).parent().remove();
                    break;
                }
            }

            for(var j = 0; j < channels.length; j++) {
                if(channels[j].name === channel) {
                    channels.splice(j, 1);
                    break;
                }
            }

            store.setItem('channels', JSON.stringify(channels));
            channelParent.remove();

            // Verificar si era la seleccion actual
            if(current.type === selection.channel) {
                if(current.name === channel) {
                    setCurrentSub('frontPage');
                }
            }

        },
        activeClass: 'button-active'
    });

    tappable(".closeForm", {
        onTap: function() {
            quitarModal();
        }
    });

    tappable("#about", {
        onTap: function() {
            var delay = 1;
            if(!isLargeScreen) {
                moveMenu(move.left);
                delay = 351;
            }
            setTimeout(function() {
                if(esModal) return;
                var modal = $('<div/>').attr('id', 'modal');
                $('body').append(modal).append(aboutTemplate);
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
            var choice = $(target);
            var sortingChoice = choice.text();
            if(sortingChoice === currentSortingChoice) return;
            $('.sorting-choice').removeClass('sorting-choice');
            choice.addClass('sorting-choice');
            changeSorting(sortingChoice);
        },
        activeClass: 'link-active',
        activeClassDelay: 100
    });

    // Swipes
    $("#detailView").swipeRight(function() {
        if(isWideScreen) {
            return;
        }
        history.back(); // Should go to "/"
    });

    $("#mainView").swipeRight(function() {
        if(isWideScreen || isLargeScreen) {
            return;
        }
        if(currentView === view.main) {
            moveMenu(move.right);
        }
    });

    $("#mainView").swipeLeft(function() {
        if(isWideScreen || isLargeScreen) {
            return;
        }
        if(showingMenu) {
            moveMenu(move.left);
        }
    });

    $("#mainView").on("swipeLeft", ".link", function() {
        if(isWideScreen) {
            return;
        }
        if(!showingMenu) {
            var id = $(this).attr('data-id');
            goToComments(id);
        }
    });

    // Animaciones

    function slideFromLeft() {
        var main = $("#mainView");
        var det = $("#detailView");
        main.css("left", -ancho);
        setTimeout(function() {
            var translate = 'translate3d(' + ancho + 'px, 0px, 0px)';
            var cssTransform = {
                '-webkit-transform': translate,
                'transform': translate
            };
            main.addClass("slideTransition").css(cssTransform);
            det.addClass("slideTransition").css(cssTransform);
            setTimeout(function() {
                var cssTransformBack = {
                    '-webkit-transform': '',
                    'transform': '',
                    'left': ''
                };
                main.removeClass("slideTransition").css(cssTransformBack).removeClass("fuera");
                det.css(cssTransformBack).removeClass("slideTransition");
                $("#detailView").addClass("fuera"); // Hide
                currentView = view.main;
            }, 351);
        }, 50);
    }

    function slideFromRight() {
        var main = $("#mainView");
        var det = $("#detailView");
        det.css("left", ancho);
        setTimeout(function() {
            var translate = 'translate3d(-' + ancho + 'px, 0px, 0px)';
            var cssTransform = {
                '-webkit-transform': translate,
                'transform': translate
            };
            main.addClass("slideTransition").css(cssTransform);
            det.addClass("slideTransition").css(cssTransform);
            setTimeout(function() { // Quita las propiedades de transition
                var cssTransformBack = {
                    '-webkit-transform': '',
                    'transform': ''
                };
                det.css("left", 0).removeClass("slideTransition").removeClass("fuera").css(cssTransformBack);
                main.removeClass("slideTransition").addClass("fuera").css(cssTransformBack);
                currentView = view.comments;
            }, 351);
        }, 100);
    }

    var d = document,
        body = d.body;

    var supportOrientation = typeof window.orientation !== 'undefined',
        getScrollTop = function() {
            return window.pageYOffset || d.compatMode === 'CSS1Compat' && d.documentElement.scrollTop || body.scrollTop || 0;
        },
        scrollTop = function() {
            if(!supportOrientation) return;
            body.style.height = screen.height + 'px';
            setTimeout(function() {
                window.scrollTo(0, 1);
                var top = getScrollTop();
                window.scrollTo(0, top === 1 ? 0 : 1);
                body.style.height = window.innerHeight + 'px';
            }, 1);
        };

    // Show option to reload app after update
    if(window.applicationCache) window.applicationCache.addEventListener("updateready", function(e) {
        var delay = 1;
        if(showingMenu) {
            moveMenu(move.left);
            delay = 351;
        }
        setTimeout(function() {
            $('#mainWrap').prepend("<div id='topButtons'><div id='btnUpdate'>Reeddit updated. Click to reload</div></div>");
            tappable('#btnUpdate', {
                onTap: function() {
                    window.location.reload();
                },
                activeClass: 'listButton-active'
            });
        }, delay);
    }, false);

    // Do stuff after finishing resizing the windows
    window.addEventListener("resizeend", function() {
        ancho = $(window).width();
        isWideScreen = checkWideScreen();
        isLargeScreen = checkLargeScreen();
        scrollTop();
        if(isLargeScreen && showingMenu) {
            moveMenu(move.left);
        }
        if(isiPad) {
            scrollFix();
        }
    }, false);

    if(location.hash) location.hash = ''; // Clear hash at first app loading
    // Pseudo-hash-router
    window.addEventListener('hashchange', function() {
        if(location.hash === '') {
            var delay = 1;
            if(currentView === view.comments) {
                backToMainView();
                slideFromLeft();
                delay = 351;
            }
            if(isWideScreen) {
                $('.link.link-active').removeClass('link-active');
                $('#detailWrap').html(noLinkTemplate);
            } else {
                setTimeout(function() {
                    $('#detailWrap').empty();
                }, delay);
            }
        } else {
            var match = location.hash.match(/(#comments:)((?:[a-zA-Z0-9]*))/);
            if(match && match[2]) {
                var id = match[2];
                procesarComentarios(id);
            }
        }
    }, false);

    // App init
    var title = $("#title"),
        headerIcon = $("#headerIcon"),
        touch = "touchmove";

    $("#title").remove();

    if(isWideScreen) $('#detailWrap').html(noLinkTemplate);

    current = loadCurrentSelection();

    // Load subreddits and channels list
    loadSubsList();
    loadSavedChannels();

    // Cargar links y marcar como activo al subreddit actual - la 1ra vez sera el 'frontPage'
    doByCurrentSelection(function() { // En caso de ser un subreddit
        var i = savedSubs.indexOf(current.name);
        if(i > -1) {
            var activeSub = document.getElementsByClassName('sub')[i];
            $(activeSub).addClass('sub-active');
        }
        // Load links
        if(current.name.toUpperCase() !== 'frontPage'.toUpperCase()) {
            loadLinks(urlInit + "r/" + current.name + "/");
        } else {
            setCurrentSub('frontPage');
            loadLinks(urlInit + "r/" + getAllSubsString() + "/");
        }
        setSubTitle(current.name);
    }, function() { // If it's a channel
        var channel;
        for(var i = 0; i < channels.length; i++) {
            channel = channels[i];
            if(channel.name === current.name) {
                var active = document.getElementsByClassName('channel')[i];
                $(active).addClass('channel-active');
                break;
            }
        }
        loadChannel(channel);
    });

    scrollTop();

    if(!isDesktop) {
        document.getElementById("editSubs").addEventListener(touch, function(e) {
            e.preventDefault();
        }, false);
        document.getElementsByTagName('header')[0].addEventListener(touch, function(e) {
            if(showingMenu) { // Cheat temporal, para evitar que las vistas hagan overflow...
                e.preventDefault();
            }
        }, false);
        isiPad = /iPad/.test(navigator.userAgent);
        if(isiPad) {
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
});
