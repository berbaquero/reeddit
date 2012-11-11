$(document).ready(function() {

    // Templates
    var linksTemplate = "{{#children}}<article class='linkWrap'><div class='link' data-url='{{data.url}}' data-id='{{data.id}}' target='_blank'><div class='linkInfo'><p class='linkTitle'>{{data.title}}</p><p class='linkDomain'>{{data.domain}}</p><p class='linkSub'>{{data.subreddit}}</p></div><div class='linkThumb'><div style='background-image: url({{data.thumbnail}})'></div></div></div><div class='toComments' data-id='{{data.id}}'><div></div></div></article>{{/children}}<div class='listButton'><span id='moreLinks'>More</span></div>",
        linksTemplateLeft = "{{#children}}<article class='linkWrap'><div class='link' data-url='{{data.url}}' data-id='{{data.id}}' target='_blank'><div class='linkThumb'><div class='marginless' style='background-image: url({{data.thumbnail}})'></div></div><div class='linkInfo thumbLeft'><p class='linkTitle'>{{data.title}}</p><p class='linkDomain'>{{data.domain}}</p><p class='linkSub'>{{data.subreddit}}</p></div></div><div class='toComments' data-id='{{data.id}}'><div class='rightArrow'></div></div></article>{{/children}}<div class='listButton'><span id='moreLinks'>More</span></div>",
        linkSummaryTemplate = "<section><div id='linkSummary'><a href='{{url}}' target='_blank'><p id='summaryTitle'>{{title}}</p><p id='summaryDomain'>{{domain}}</p></a></div><div id='summaryExtra'><p id='summarySub'>{{subreddit}}</p><p id='summaryTime'></p><p id='summaryCommentNum'>{{num_comments}} comments</p></div></section>",
        allSubredditsTemplate = "{{#children}}<div class='subreddit'><div><p class='subredditTitle'>{{data.display_name}}</p><p class='subredditDesc'>{{data.public_description}}</p></div><div class='btnAddSub'><div></div></div></div>{{/children}}",
        botonAgregarSubManualTemplate = "<div id='btnsAddSubs'><div id='btnSubMan'>Insert Manually</div><div id='btnAddChannel'>Add Channel</div></div>",
        formAgregarSubManualTemplate = '<div class="newForm" id="formNuevoSub"><div class="closeForm">close</div><form><input type="text" id="txtNuevoSub" placeholder="New subreddit name" /></form></div>',
        formAddNewChannelTemplate = '<div class="newForm" id="formNewChannel"><div class="closeForm">close</div><input type="text" id="txtChannel" placeholder="Channel name" /><div id="subsForChannel"><input type="text" placeholder="Subreddit 1" /><input type="text" placeholder="Subreddit 2" /><input type="text" placeholder="Subreddit 3" /></div><div id="btnAddNewChannel">Add Channel</div></div>',
        botonCargarMasSubsTemplate = "<div class='listButton'><span id='moreSubs'>More</span></div>",
        savedSubredditsListToRemoveTemplate = "<ul id='subsToRemove'>{{#.}}<div class='subToRemove'><p>{{.}}</p><div></div></div>{{/.}}</ul>",
        channelTemplate = '<li><div class="channel"><p>{{name}}</p><div>{{#subs}}<p>{{.}}</p>{{/subs}}</div></div></li>',
        channelsTemplate = '{{#.}}' + channelTemplate + '{{/.}}',
        noLinkTemplate = "<div id='noLink'><p>No Post Selected.</div>";

    // Pseudo-Globales
    var ancho = $(window).width(),
        vistaActual = 1,
        urlInit = "http://www.reddit.com/",
        urlEnd = ".json?jsonp=?",
        urlLimitEnd = ".json?limit=30&jsonp=?",
        loadedLinks = {},
        posts = {},
        replies = {},
        channels = [],
        mostrandoMenu = false,
        subreddits, store = window.fluid ? allCookies : window.localStorage,
        ultimoLink, ultimoSub, esModal = false,
        loadingComments = false,
        hiloActual, savedSubs, isWideScreen = chequearWideScreen(),
        isLargeScreen = chequearLargeScreen(),
        // Pseudo-Enums
        mover = {
            izquierda: 1,
            derecha: 2
        },
        vista = {
            principal: 1,
            comentarios: 2
        },
        selection = {
            sub: 1,
            channel: 2
        };

    var defaultSubs = ["frontPage", "pics", "funny", "IAmA", "games", "worldNews", "todayilearned", "science", "atheism", "Music", "movies", "geek", "reactiongifs"];

    var defaultChannel = [{
        name: 'Tech',
        subs: ["technology", "Apple", "Android"],
        url: 'r/technology+Apple+Android'
    }];

    function chequearWideScreen() {
        return window.matchMedia("(min-width: 1000px)").matches;
    }

    function chequearLargeScreen() {
        return window.matchMedia("(min-width: 490px)").matches;
    }

    function loadLinks(baseUrl, fromSub, links, paging) {
        var main = $("#mainWrap");
        if(fromSub) { // Si viene de se seleccionar un subreddit
            var m = document.getElementById("mainWrap");
            m.scrollTop = 0; // Se sube al top del contenedor
            if(!links) {
                setTimeout(function() {
                    main.prepend("<p class='loading'>Loading links...</p>");
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
            $.getJSON(baseUrl + urlLimitEnd + paging, function(result) {
                processAndRenderLinks(result, fromSub, main);
            });
        }
    }

    function processAndRenderLinks(result, fromSub, main) {
        var links = result.data;
        ultimoLink = links.after;
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
                    "link": link.data.permalink
                };
            }
            // Se cuentan los thumbnails que se pueden mostrar
            if(link.data.thumbnail || link.data.thumbnail === 'detault' || link.data.thumbnail === 'nsfw' || link.data.thumbnail === 'self') {
                numThumbs++;
            }
        }

        var html = Mustache.to_html(numThumbs > 15 ? linksTemplateLeft : linksTemplate, links);
        if(fromSub) {
            main.empty();
        } else {
            $(".loading").remove();
        }

        main.append(html); // Agrega nuevos links a la lista
        // Elimina espacio de thumbnails para aquelos links que no tienen uno valido
        var thumbs = $('.linkThumb div');
        $.each(thumbs, function(i, t) {
            var thumb = $(t);
            var bg = thumb.attr('style');
            if(bg === 'background-image: url()' || bg === 'background-image: url(default)' || bg === 'background-image: url(nsfw)' || bg === 'background-image: url(self)') {
                thumb.parent().remove();
            }
        });
    }

    function loadComments(data, baseElement, idParent) {
        var now = new Date().getTime();
        var converter = new Markdown.Converter();
        var com = $("<section/>");
        for(var i = 0; i < data.length; i++) {
            var c = data[i];
            if(c.kind !== "t1") {
                continue;
            }

            var html = converter.makeHtml(c.data.body);

            var comment = $("<div/>").addClass("commentWrap").append($('<div/>').append($("<div/>").addClass("commentData").append($("<div/>").addClass("commentAuthor").append($("<p/>").text(c.data.author))).append($("<div/>").addClass("commentInfo").append($("<p/>").text(timeSince(now, c.data.created_utc))))).append($("<div/>").addClass("commentBody").html(html)));

            if(c.data.replies) {
                comment.append($("<span/>").addClass("repliesButton").attr("comment-id", c.data.id).text("See replies"));
                replies[c.data.id] = c.data.replies.data.children;
            }

            com.append(comment);
        }
        baseElement.append(com);
        if(idParent) {
            loadedLinks[idParent] = com;
        }
        $("#detailWrap a").attr("target", "_blank");
    }

    function procesarComentarios(comm, refresh) {
        if(loadingComments) return;
        loadingComments = true;
        var id;
        if(refresh) {
            id = comm;
        } else {
            id = comm.attr("data-id");
        }
        hiloActual = id;

        ensenar("#navBack");
        var detail = $("#detailWrap");
        detail.empty();

        var d = document.getElementById("detailWrap");
        d.scrollTop = 0;

        if(loadedLinks[id] && !refresh) {
            detail.append(posts[id].summary);
            detail.append(loadedLinks[id]);
            updateSummaryInfo(posts[id], id);
            loadingComments = false;
        } else {
            setPostSummaryInfo(posts[id], id);
            var url = "http://www.reddit.com" + posts[id].link + urlEnd;
            detail.append("<p class='loading'>Loading comments...</p>");
            $.getJSON(url, function(result) {
                updateSummaryInfo(result[0].data.children[0].data, id);
                $(".loading").remove();
                var comments = result[1].data.children;
                loadComments(comments, detail, id);
                loadingComments = false;
            });
        }

        if(!refresh) {
            if(isWideScreen) {
                $("#detailView").removeClass("fuera");
            } else {
                slideFromRight();
            }
        }

        $("#titleHead").empty().append(title);
        $("#title").text(posts[id].title);
        $("#mainTitle").addClass('invisible');
    }

    function setPostSummaryInfo(data, postID) {
        // Contenido principal
        var summaryHTML = Mustache.to_html(linkSummaryTemplate, data);
        if(data.selftext) { // Si tiene Self-Text
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
        $("#summaryCommentNum").text(data.num_comments + (data.num_comments == 1 ? ' comment' : ' comments'));
        // Time ago
        updatePostTime(data.created_utc);
        posts[postID].num_comments = data.num_comments;
        posts[postID].created_utc = data.created_utc;
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

    function loadSubsList() { // Solo se deberia ejecutar una sola vez, al cargar la app
        savedSubs = getSavedSubs();
        if(savedSubs) {
            insertSubsToList(savedSubs);
        } else { // Si no se ha cargado al 'store'
            savedSubs = defaultSubs; // Se guardan los subreddits por defecto
            insertSubsToList(savedSubs);
            store.setItem("subreeddits", JSON.stringify(savedSubs));
        }
    }

    window.applicationCache.addEventListener("updateready", function(e) {
        var update = window.confirm("Update descargado. Recargar para actualizar?");
        if(update) {
            window.location.reload();
        }
    });

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
        if(sub !== current.name) {
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

    function moverMenu(direccion) {
        if(direccion === mover.izquierda) {
            $("#container").css('-webkit-transform', 'translate3d(0px, 0px, 0px)');
            setTimeout(function() {
                mostrandoMenu = false;
            });
        }
        if(direccion === mover.derecha) {
            $("#container").css('-webkit-transform', 'translate3d(140px, 0px, 0px)');
            setTimeout(function() {
                mostrandoMenu = true;
            });
        }
    }

    function loadSubredditListToAdd() {
        if(!isLargeScreen) {
            moverMenu(mover.izquierda);
        }
        setTimeout(function() {
            document.getElementById("mainWrap").scrollTop = 0; // Se sube al top del contenedor
            var main = $("#mainWrap");
            if(subreddits) {
                main.empty().append(botonAgregarSubManualTemplate).append(subreddits).append(botonCargarMasSubsTemplate);
            } else {
                main.prepend("<p class='loading'>Loading subreddits...</p>").prepend(botonAgregarSubManualTemplate);
                $.getJSON(urlInit + "reddits/.json?limit=50&jsonp=?", function(list) {
                    ultimoSub = list.data.after;
                    subreddits = Mustache.to_html(allSubredditsTemplate, list.data);
                    main.empty().append(botonAgregarSubManualTemplate).append(subreddits).append(botonCargarMasSubsTemplate);
                });
            }
        }, isLargeScreen ? 1 : 351);
        limpiarSubrSeleccionado();
        setSubTitle("+ Subreddits");
        current.name = "all_reddits";
        current.type = selection.sub;
    }

    function loadSubredditListToRemove() {
        if(!isLargeScreen) {
            moverMenu(mover.izquierda);
        }
        setTimeout(function() {
            document.getElementById("mainWrap").scrollTop = 0; // Se sube al top del contenedor
            var html = Mustache.to_html(savedSubredditsListToRemoveTemplate, savedSubs);
            setTimeout(function() { // Retraso a proposito / fix para iOS
                document.getElementById("mainWrap").innerHTML = html;
            }, 10);
            limpiarSubrSeleccionado();
        }, isLargeScreen ? 1 : 351);
        current.name = 'remove_subreddits';
        current.type = selection.sub;
        setSubTitle('- Subreddits');
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
        var retrasar = false;
        if(!isLargeScreen) {
            if(mostrandoMenu) retrasar = true;
            moverMenu(mover.izquierda);
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
        }, (retrasar ? 351 : 1));
    }

    function showNewChannelForm() {
        var retrasar = false;
        if(!isLargeScreen) {
            if(mostrandoMenu) retrasar = true;
            moverMenu(mover.izquierda);
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
        }, (retrasar ? 351 : 1));
    }

    function quitarModal() {
        var modal = $('#modal');
        modal.css('opacity', '');
        $('.closeForm').remove();
        $('#formNuevoSub').remove();
        $('#formNewChannel').remove();
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
        $.getJSON(urlInit + "r/" + newSubr + "/" + urlLimitEnd, function(data) {
            loadLinks("", false, data);
            setSubTitle(newSubr);
            limpiarSubrSeleccionado();
            setCurrentSub(newSubr);
            insertSubsToList(newSubr, true);
        });
    });

    function insertChannel(channel) {
        channels.push(channel);
        var html = Mustache.to_html(channelTemplate, channel);
        $('#channels').append(html);
        store.setItem('channels', JSON.stringify(channels));
    }

    function loadSavedChannels() { // Solo se debe ejecutar una vez al principio, cargando la app
        channels = store.getItem('channels');
        if(channels) {
            channels = JSON.parse(channels);
        } else { // Cargar canal(es?) por defecto
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
        loadLinks(urlInit + channel.url, true);
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
            var url = channel.attr('data-url');
            moverMenu(moverIzquierda);
            limpiarSubrSeleccionado();
            channel.addClass('channel-active');
            if(vistaActual === vistaComentarios) {
                backToMainView();
                slideFromLeft();
            }
            loadChannel(url);
            setSubTitle(channel.children().first().text());
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
            moverMenu(mover.izquierda);
            loadSub(sub.first().text());
            limpiarSubrSeleccionado();
            sub.addClass('sub-active');
            if(vistaActual === vista.comentarios) {
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
            slideFromLeft();
            setTimeout(function() {
                $('#detailWrap').empty();
            }, 351);
            backToMainView();
        }
    });

    tappable("#refresh", {
        onTap: function(e) {
            if(vistaActual == vista.comentarios) {
                if(!hiloActual) return;
                procesarComentarios(hiloActual, true);
            }
            if(vistaActual == vista.principal) {
                doByCurrentSelection(function() { // Si es Subreddit
                    if(current.name.toUpperCase() === 'frontPage'.toUpperCase()) {
                        loadLinks(urlInit + "r/" + getAllSubsString() + "/");
                    } else if(current.name === 'all_reddits' || current.name === 'remove_subreddits') {
                        return;
                    } else {
                        loadLinks(urlInit + "r/" + current.name + "/");
                    }
                }, function() { // Si es channel
                    loadChannel(getChannelByName(current.name));
                });
            }
        }
    });

    tappable(".link", {
        onTap: function(e, target) {
            var comm = $(target);
            var id = comm.attr("data-id");
            var link = posts[id];
            if(link.self || isWideScreen) {
                procesarComentarios(comm);
            } else {
                url = comm.attr("data-url");
                var a = document.createElement('a');
                a.setAttribute("href", url);
                a.setAttribute("target", "_blank");

                var dispatch = document.createEvent("HTMLEvents");
                dispatch.initEvent("click", true, true);
                a.dispatchEvent(dispatch);
            }
            $(".link.link-active").removeClass("link-active");
            if(isWideScreen) {
                comm.addClass('link-active');
            }
        },
        allowClick: false,
        activeClassDelay: 100,
        activeClass: 'link-active'
    });

    tappable(".toComments", {
        onTap: function(e, target) {
            procesarComentarios($(target));
        },
        activeClass: 'button-active',
        activeClassDelay: 100
    });

    tappable("#subTitle", {
        onTap: function(e) {

            if(isLargeScreen) {
                return;
            }
            moverMenu(mostrandoMenu ? mover.izquierda : mover.derecha);
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
                loadLinks(urlInit + channel.url, false, false, '&after=' + ultimoLink);
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
            $.getJSON(urlInit + 'reddits/' + urlEnd + '&after=' + ultimoSub, function(list) {
                var nuevosSubs = Mustache.to_html(allSubredditsTemplate, list.data);
                ultimoSub = list.data.after;
                $('.loading', main).remove();
                main.append(nuevosSubs).append(botonCargarMasSubsTemplate);
                subreddits = subreddits + nuevosSubs;
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

            for(i = savedSubs.length - 1; i >= 0; i--) {
                if(savedSubs[i] === subreddit) {
                    savedSubs.splice(i, 1);
                    break;
                }
            }
            store.setItem("subreeddits", JSON.stringify(savedSubs));
            subParent.remove();
        },
        activeClass: 'button-active'
    });

    tappable(".closeForm", {
        onTap: function() {
            quitarModal();
        }
    });

    // Swipes
    $("#detailView").swipeRight(function() {
        if(isWideScreen) {
            return;
        }
        slideFromLeft();
        setTimeout(function() {
            $('#detailWrap').empty();
        }, 351);
        backToMainView();
    });

    $("#mainView").swipeRight(function() {
        if(isWideScreen || isLargeScreen) {
            return;
        }
        if(vistaActual === vista.principal) {
            moverMenu(mover.derecha);
        }
    });

    $("#mainView").swipeLeft(function() {
        if(isWideScreen || isLargeScreen) {
            return;
        }
        if(mostrandoMenu) {
            moverMenu(mover.izquierda);
        }
    });

    $("#mainView").on("swipeLeft", ".link", function() {
        if(isWideScreen) {
            return;
        }
        if(!mostrandoMenu) {
            procesarComentarios($(this));
        }
    });

    // Animaciones

    function slideFromLeft() {
        var main = $("#mainView");
        var det = $("#detailView");
        main.css("left", -ancho);
        setTimeout(function() {
            main.addClass("slideTransition").css('-webkit-transform', 'translate3d(' + ancho + 'px, 0px, 0px)');
            det.addClass("slideTransition").css('-webkit-transform', 'translate3d(' + ancho + 'px, 0px, 0px)');
            setTimeout(function() {
                main.removeClass("slideTransition").css({
                    "-webkit-transform": "",
                    "left": ""
                }).removeClass("fuera");
                det.css({
                    "-webkit-transform": "",
                    "left": ""
                }).removeClass("slideTransition");
                sacar("#detailView");
                vistaActual = vista.principal;
            }, 351);
        }, 50);
    }

    function slideFromRight() {
        var main = $("#mainView");
        var det = $("#detailView");
        det.css("left", ancho);
        setTimeout(function() {
            main.addClass("slideTransition").css('-webkit-transform', 'translate3d(-' + ancho + 'px, 0px, 0px)');
            det.addClass("slideTransition").css('-webkit-transform', 'translate3d(-' + ancho + 'px, 0px, 0px)');
            setTimeout(function() { // Quita las propiedades de transition
                det.css("left", 0).removeClass("slideTransition").removeClass("fuera").css("-webkit-transform", "");
                main.removeClass("slideTransition").addClass("fuera").css("-webkit-transform", "");
                vistaActual = vista.comentarios;
            }, 351);
        }, 100);
    }

    // Metodos de vistas

    function reveal(element) {
        var el = $(element);
        el.removeClass("fuera").addClass("invisible");
        setTimeout(function() {
            el.removeClass("invisible");
        });
    }

    function mostrar(element) {
        var el = $(element);
        el.removeClass("oculto");
    }

    function sacar(element) {
        var el = $(element);
        el.addClass("fuera");
    }

    function ingresar(element) {
        var el = $(element);
        el.removeClass("fuera");
        return el;
    }

    function ocultar(element) {
        var el = $(element);
        el.addClass("oculto");
    }

    function ensenar(element) {
        var el = $(element);
        el.removeClass("invisible");
    }

    var d = document,
        body = d.body;

    var supportOrientation = typeof window.orientation != 'undefined',
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

    window.addEventListener("resizeend", function() {
        ancho = $(window).width();
        isWideScreen = chequearWideScreen();
        isLargeScreen = chequearLargeScreen();
        scrollTop();
        if(isLargeScreen && mostrandoMenu) {
            moverMenu(mover.izquierda);
        }
    }, false);

    // Inicio de la app
    var title = $("#title"),
        headerIcon = $("#headerIcon"),
        touch = "touchmove";

    $("#title").remove();
    $('#detailWrap').html(noLinkTemplate);

    current = loadCurrentSelection();

    // Cargar lista de subreddits y canales
    loadSubsList();
    loadSavedChannels();

    // Cargar links y marcar como activo al subreddit actual - la 1ra vez sera el 'frontPage'
    doByCurrentSelection(function() { // En caso de ser un subreddit
        var i = savedSubs.indexOf(current.name);
        if(i > -1) {
            var activeSub = document.getElementsByClassName('sub')[i];
            $(activeSub).addClass('sub-active');
        }
        // Cargar links
        if(current.name.toUpperCase() !== 'frontPage'.toUpperCase()) {
            loadLinks(urlInit + "r/" + current.name + "/");
        } else {
            setCurrentSub('frontPage');
            loadLinks(urlInit + "r/" + getAllSubsString() + "/");
        }
        setSubTitle(current.name);
    }, function() { // En caso de ser un channel
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

    // Aplicar si viene de iOS / Android
    if(/iPhone|iPod|iPad|Android/.test(navigator.userAgent)) {
        document.getElementById("editSubs").addEventListener(touch, function(e) {
            e.preventDefault();
        }, false);
        document.getElementsByTagName('header')[0].addEventListener(touch, function(e) {
            if(mostrandoMenu) { // Cheat temporal, para evitar que las vistas hagan overflow...
                e.preventDefault();
            }
        }, false);
    }
});