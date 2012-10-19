$(document).ready(function() {
    // Templates
    var linksTemplate = "{{#children}}<article class='linkWrap'><div class='link' data-url='{{data.url}}' data-id='{{data.id}}' target='_blank'><div class='linkInfo'><p class='linkTitle'>{{data.title}}</p><p class='linkDomain'>{{data.domain}}</p><p class='linkSub'>{{data.subreddit}}</p></div><div class='linkThumb'><div style='background-image: url({{data.thumbnail}})'></div></div></div><div class='toComments' data-id='{{data.id}}'><div></div></div></article>{{/children}}<div id='moreLinks'>More</div>",
    linksTemplateLeft = "{{#children}}<article class='linkWrap'><div class='link' data-url='{{data.url}}' data-id='{{data.id}}' target='_blank'><div class='linkThumb'><div class='marginless' style='background-image: url({{data.thumbnail}})'></div></div><div class='linkInfo thumbLeft'><p class='linkTitle'>{{data.title}}</p><p class='linkDomain'>{{data.domain}}</p><p class='linkSub'>{{data.subreddit}}</p></div></div><div class='toComments' data-id='{{data.id}}'><div class='rightArrow'></div></div></article>{{/children}}<div id='moreLinks'>More</div>",
    var linksTemplate = "{{#children}}<article class='linkWrap'><div class='link' data-url='{{data.url}}' data-id='{{data.id}}' target='_blank'><div class='linkInfo'><p class='linkTitle'>{{data.title}}</p><p class='linkDomain'>{{data.domain}}</p><p class='linkSub'>{{data.subreddit}}</p></div><div class='linkThumb'><div style='background-image: url({{data.thumbnail}})'></div></div></div><div class='toComments' data-id='{{data.id}}'><div></div></div></article>{{/children}}<div class='listButton'><span id='moreLinks'>More</span></div>",
    linksTemplateLeft = "{{#children}}<article class='linkWrap'><div class='link' data-url='{{data.url}}' data-id='{{data.id}}' target='_blank'><div class='linkThumb'><div class='marginless' style='background-image: url({{data.thumbnail}})'></div></div><div class='linkInfo thumbLeft'><p class='linkTitle'>{{data.title}}</p><p class='linkDomain'>{{data.domain}}</p><p class='linkSub'>{{data.subreddit}}</p></div></div><div class='toComments' data-id='{{data.id}}'><div class='rightArrow'></div></div></article>{{/children}}<div class='listButton'><span id='moreLinks'>More</span></div>",
    linkSummaryTemplate = "<div id='linkSummary'><a href='{{url}}' target='_blank'><p id='summaryTitle'>{{title}}</p><p id='summaryDomain'>{{domain}}</p></a></div><div id='summaryExtra'><p id='summarySub'>{{sub}}</p><p id='summaryTime'></p><p id='summaryCommentNum'>{{comments}} comments</p></div>",
    subredditsListTemplate = "<ul id='subs'>{{#subs}}<li><p class='sub'>{{name}}</p></li>{{/subs}}</ul>",
    allSubredditsTemplate = "{{#children}}<div class='subreddit'><p class='subredditTitle'>{{data.display_name}}</p><p class='subredditDesc'>{{data.public_description}}</p></div>{{/children}}",
    botonAgregarSubManualTemplate = "<div id='agregarSubManual'><span class='repliesButton' id='btnSubMan'>Insert Subreddit Manually</span></div>",
    formAgregarSubManualTemplate = '<div id="formNuevoSub"><form><input type="text" id="txtNuevoSub" placeholder="New subreddit name" autofocus /></form></div>';

    // Globales
    var ancho = $(window).width(), activeView = 1, urlInit = "http://www.reddit.com/", urlEnd = ".json?jsonp=?",
    urlLimitEnd = ".json?limit=30&jsonp=?", urlPaging = '&after=', loadedLinks = {}, posts = {}, replies = {}, currentSub = 'frontPage', mostrandoMenu = false, subreddits, store = window.localStorage, ultimoLink,
    urlLimitEnd = ".json?limit=30&jsonp=?", loadedLinks = {}, posts = {}, replies = {}, currentSub = 'frontPage', mostrandoMenu = false, subreddits, store = window.localStorage, ultimoLink,
    // Pseudo-Enums
    moverIzquierda = 1, moverDerecha = 2,
    esWideScreen = chequearWideScreen(),
    esLargeScreen = chequearLargeScreen();

    function chequearWideScreen() {
        return window.matchMedia("(min-width: 1000px)").matches;
    }

    function chequearLargeScreen() {
        return window.matchMedia("(min-width: 490px)").matches;
    }

    function loadLinks(baseUrl, fromSub, links, paging) {
        var main = $("#mainWrap");
        if (fromSub) { // Si viene de se seleccionar un subreddit
            var m = document.getElementById("mainWrap");
            m.scrollTop = 0; // Se sube al top del contenedor
            if (!links) {
                setTimeout(function () {
                    main.prepend("<p class='loading'>Cargando links...</p>");
                }, 350);
            }
        } else { // Si se está cargando inicialmente
            if (!paging) { // Si no hay paginación
                main.empty(); // Se quitan los links actuales
            } else { // Si hay paginación
                $("#moreLinks").remove(); // Sólo se quita el botón de 'More' actual
            }
            main.append("<p class='loading'>Cargando links...</p>");
        }
        if (links) { // Si ya los links fueron pedidos y devueltos
            processAndRenderLinks(links, fromSub, main);
        } else { // Si aún no se piden los links
            if (!paging) { // Si no hay paginación
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
        for (var i = 0; i < links.children.length; i++) {
            var link = links.children[i];
            if (posts[link.data.id]) { // Si ya se ha cargado este link localmente
                // Se actualizan los datos dinamicos
                posts[link.data.id].comments = link.data.num_comments;
                posts[link.data.id].time = link.data.created_utc;
            } else { // Si no se han cargado los links localmente
                posts[link.data.id] = {
                    "title": link.data.title,
                    "text": link.data.selftext,
                    "time": link.data.created_utc,
                    "domain": link.data.domain,
                    "sub": link.data.subreddit,
                    "comments": link.data.num_comments,
                    "url": link.data.url,
                    "self": link.data.is_self,
                    "link": link.data.permalink
                };
            }
            // Se cuentan los thumbnails que se pueden mostrar
            if (link.data.thumbnail || link.data.thumbnail === 'detault' || link.data.thumbnail === 'nsfw' || link.data.thumbnail === 'self') {
                numThumbs++;
            }
        }

        var html = Mustache.to_html(numThumbs > 15 ? linksTemplateLeft : linksTemplate, links);
        if (fromSub) {
            main.empty();
        } else {
            $(".loading").remove();
        }

        main.append(html); // Agrega nuevos links a la lista

        // Elimina espacio de thumbnails para aquelos links que no tienen uno válido
        var thumbs = $('.linkThumb div');
        $.each(thumbs, function(i, t) {
            var thumb = $(t);
            var bg = thumb.attr('style');
            if (bg === 'background-image: url()' || bg === 'background-image: url(default)' || bg === 'background-image: url(nsfw)' || bg === 'background-image: url(self)') {
                thumb.parent().remove();
            }
        });
    }

    function loadComments(data, baseElement, idParent) {
        var now = new Date().getTime();
        var converter = new Markdown.Converter();
        var com = $("<section/>");
        for (var i = 0; i < data.length; i++) {
            var c = data[i];
            if (c.kind !== "t1") {
                continue;
            }

            var html = converter.makeHtml(c.data.body);

            var comment = $("<div/>").addClass("commentWrap")
            .append($("<div/>").addClass("commentData")
                .append($("<div/>").addClass("commentAuthor")
                    .append($("<p/>").text(c.data.author)))
                .append($("<div/>").addClass("commentInfo")
                    .append($("<p/>").text(timeSince(now, c.data.created_utc)))))
            .append($("<div/>").addClass("commentBody").html(html));

            if (c.data.replies) {
                comment.append($("<span/>").addClass("repliesButton").attr("comment-id", c.data.id).text("See replies"));
                replies[c.data.id] = c.data.replies.data.children;
            }

            com.append(comment);
        }
        baseElement.append(com);
        if (idParent) {
            loadedLinks[idParent] = com;
        }
        $("#detailWrap a").attr("target", "_blank");
    }

    function procesarComentarios(comm) {
        var id = comm.attr("data-id");
        ensenar("#navBack");
        var detail = $("#detailWrap");
        detail.empty();

        var d = document.getElementById("detailWrap");
        d.scrollTop = 0;

        if (loadedLinks[id]) {
            detail.append(posts[id].summary);
            detail.append(loadedLinks[id]);
        } else {
            var postInfo = posts[id];
            var summaryWrap = $("<section/>");
            summaryWrap.append(Mustache.to_html(linkSummaryTemplate, postInfo));
            if (postInfo.text) {
                var summaryConverter1 = new Markdown.Converter();
                summaryWrap.append($("<div/>").attr("id", "selfText").append(summaryConverter1.makeHtml(postInfo.text)));
            }
            posts[id].summary = summaryWrap;
            detail.append(summaryWrap);
            $("#summaryTime").text(timeSince(new Date().getTime(), postInfo.time));
            var url = "http://www.reddit.com" + posts[id].link + urlEnd;
            detail.append("<p class='loading'>Cargando comentarios...</p>");
            $.getJSON(url, function(result) {
                $(".loading").remove();
                var comments = result[1].data.children;
                loadComments(comments, detail, id);
            });
        }

        if (esWideScreen) {
            $("#detailView").removeClass("fuera");
        } else {
            slideFromRight();
        }

        $("#titleHead").empty().append(title);
        $("#title").text(posts[id].title);
        $("#mainTitle").addClass('invisible');
    }

    function loadSubsList() {
        $.getJSON('./js/subs.json', function(subs) {
            var html = Mustache.to_html(subredditsListTemplate, subs);
            $("#mainMenu").append(html);
            $(".sub").first().addClass("sub-active");
            loadSavedSubs();
        });
    }

    function loadSavedSubs() {
        var subs = obtenerSubsGuardados();
        if(subs) {
            insertSubsToList(subs);
        }
    }

    window.applicationCache.addEventListener("updateready", function(e) {
        var update = window.confirm("Update descargado. Recargar para actualizar?");
        if (update) {
            window.location.reload();
        }
    });

    function changeMainTitle(title) {
        $("#subTitle").text(title);
    }

    function backToMainView(newTitle) {
        $("#navBack").addClass("invisible");
        $("#mainTitle").removeClass('invisible');
        $("#titleHead").empty().append(headerIcon);
        if (newTitle) {
            changeMainTitle(newTitle);
        }
    }

    function loadSub(sub) {
        if (sub !== currentSub) {
            var url;
            if (sub === 'frontPage') {
                url = urlInit;
            } else {
                url = urlInit + "r/" + sub + "/";
            }
            loadLinks(url, true);
            currentSub = sub;
        }
        changeMainTitle(sub);
    }

    function moverMenu(direccion) {
        if (direccion === moverIzquierda) {
            $("#container").css('-webkit-transform', 'translate3d(0px, 0px, 0px)');
            setTimeout(function() {
                mostrandoMenu = false;
            });
        }
        if (direccion === moverDerecha) {
            $("#container").css('-webkit-transform', 'translate3d(140px, 0px, 0px)');
            setTimeout(function() {
                mostrandoMenu = true;
            });
        }
    }

    function loadSubredditList() {
        if (!esLargeScreen) {
            moverMenu(moverIzquierda);
        }
        var main = $("#mainWrap");
        var m = document.getElementById("mainWrap");
        m.scrollTop = 0; // Se sube al top del contenedor
        if (subreddits) {
            main.empty().append(botonAgregarSubManualTemplate).append(subreddits);
        } else {
            main.prepend("<p class='loading'>Cargando subreddits...</p>");
            $.getJSON(urlInit + "reddits/" + urlEnd, function(list) {
                subreddits = Mustache.to_html(allSubredditsTemplate, list.data);
                main.empty().append(botonAgregarSubManualTemplate).append(subreddits);
            });
        }
        limpiarSubrSeleccionado();
    }

    function limpiarSubrSeleccionado() {
        $(".sub.sub-active").removeClass("sub-active");
    }

    function insertSubsToList(subs) {
        var subsList = $("#subs");
        if(subs instanceof Array) {
            for (var i = subs.length - 1; i >= 0; i--) {
                var sub = subs[i];
                subsList.append($("<li/>").append($("<p/>").addClass("sub").text(sub)));
            }
        } else {
            subsList.append($("<li/>").append($("<p/>").addClass("sub").addClass("sub-active").text(subs)));
        }
    }

    function obtenerSubsGuardados() {
        var subs = store.getItem("subs");
        if(subs) {
            subs = JSON.parse(subs);
            return subs;
        } else {
            return null;
        }
    }

    function mostrarIngresoSubManual() {
        if (!esLargeScreen) {
            moverMenu(moverIzquierda);
        }
        setTimeout(function() {
            var mod = $('<div/>').attr('id', 'modal');
            $('body').append(mod).append(formAgregarSubManualTemplate);
            setTimeout(function () {
                mod.css('opacity', 1);
                // $('#txtNuevoSub').focus();
            }, 1);
        }, (esLargeScreen ? 1 : 351));
    }

    $('body').on('submit', '#formNuevoSub form', function(e) {
        e.preventDefault();
        // Quitar el input modal
        var newSubr = $('#txtNuevoSub').val();
        var mod = $('#modal');
        mod.css('opacity', '');
        setTimeout(function () {
            mod.remove();
            $('#formNuevoSub').remove();
        }, 351);
        if(!newSubr) { return; } // Si no se ingresó nada, no pasa nada.
        // En caso de haber ingresado algo
        // Cargar el contenido del nuevo subrredit, de forma asincrona
        $.getJSON(urlInit + "r/" + newSubr + "/" + urlLimitEnd, function(data) {
            loadLinks("", false, data);
            changeMainTitle(newSubr);
            limpiarSubrSeleccionado();
            currentSub = newSubr;
            insertSubsToList(newSubr);
            var subs = obtenerSubsGuardados();
            if (!subs) {
                subs = [];
            }
            var alreadyIn = false;
            for (var i = subs.length - 1; i >= 0; i--) {
                if (subs[i] === newSubr) {
                    alreadyIn = true;
                    break;
                }
            }
            if (!alreadyIn) {
                subs.push(newSubr);
                store.setItem("subs", JSON.stringify(subs));
            }
        });
    });

    // Taps

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
            moverMenu(moverIzquierda);
            loadSub(sub.first().text());
            limpiarSubrSeleccionado();
            sub.addClass('sub-active');
            if (activeView === 2) {
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
            }, 350);
            backToMainView();
        }
    });

    tappable("#refresh", {
        onTap: function(e) {
            if (currentSub === 'frontPage') {
                loadLinks(urlInit);
            } else {
                loadLinks(urlInit + "r/" + currentSub + "/");
            }
        }
    });
    
    tappable(".link", {
        onTap: function(e, target) {
            var comm = $(target);
            var id = comm.attr("data-id");
            var link = posts[id];
            if (link.self || esWideScreen) {
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
            if (esWideScreen) {
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
        activeClass: 'toComments-active',
        activeClassDelay: 100
    });

    tappable("#subTitle", {
        onTap: function(e) {
            
            if (esLargeScreen) {
                return;
            }
            moverMenu(mostrandoMenu ? moverIzquierda : moverDerecha);
        },
        activeClass: 'subTitle-active'
    });

    tappable("#addNewSubr", {
        onTap: function(e) {
            loadSubredditList();
        }
    });

    tappable("#moreLinks", {
        onTap: function () {
            var url;
            if (currentSub === 'frontPage') {
                url = urlInit;
            } else {
                url = urlInit + "r/" + currentSub + "/";
            }
            loadLinks(url, false, false, '&after=' + ultimoLink);
        },
        activeClass: 'moreLinks-active'
    });

    tappable("#btnSubMan", {
        onTap: function() {
            mostrarIngresoSubManual();
        }
    });

    // Swipes

    $("#detailView").swipeRight(function() {
        
        if (esWideScreen) {
            return;
        }
        slideFromLeft();
        setTimeout(function() {
            $('#detailWrap').empty();
        }, 350);
        backToMainView();
    });

    $("#mainView").swipeRight(function() {
        
        if (esWideScreen || esLargeScreen) {
            return;
        }
        if (activeView === 1) {
            moverMenu(moverDerecha);
        }
    });

    $("#mainView").swipeLeft(function() {
        
        if (esWideScreen || esLargeScreen) {
            return;
        }
        if (mostrandoMenu) {
            moverMenu(moverIzquierda);
        }
    });

    $("#mainView").on("swipeLeft", ".link", function() {
        if (esWideScreen) {
            return;
        }
        if (!mostrandoMenu) {
            procesarComentarios($(this));
        }
    });

    $(".sub").swipeLeft(function() {
        var sub = $(this);
        var subText = sub.text();
        $(this.parent()).remove();
        var subs = obtenerSubsGuardados();
        if(subs) {
            for (var i = subs.length - 1; i >= 0; i--) {
                if(subs[i] === subText) {
                    console.log(subs[i]);
                    subs.splice(i, i);
                }
            }
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
                activeView = 1;
            }, 350);
        }, 50);
    }

    function slideFromRight() {
        var main = $("#mainView");
        var det = $("#detailView");
        det.css("left", ancho);
        setTimeout(function() {
            main.addClass("slideTransition").css('-webkit-transform', 'translate3d(-' + ancho + 'px, 0px, 0px)');
            det.addClass("slideTransition").css('-webkit-transform', 'translate3d(-' + ancho + 'px, 0px, 0px)');
            setTimeout(function () { // Quita las propiedades de transition
                det.css("left", 0).removeClass("slideTransition").removeClass("fuera").css("-webkit-transform", "");
                main.removeClass("slideTransition").addClass("fuera").css("-webkit-transform", "");
                activeView = 2;
            }, 350);
        }, 100);
    }

    function reveal(element) {
        var el = $(element);
        el.removeClass("fuera").addClass("invisible");
        setTimeout(function() {
            el.removeClass("invisible");
        });
    }

    // Metodos de vistas

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

    var d = document, body = d.body, hideBarTriggerInit = false;
    
    var supportOrientation = typeof window.orientation != 'undefined',
    getScrollTop = function() {
        return window.pageYOffset || d.compatMode === 'CSS1Compat' && d.documentElement.scrollTop || body.scrollTop || 0;
    },
    scrollTop = function() {
        if (!supportOrientation) return;
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
        esWideScreen = chequearWideScreen();
        esLargeScreen = chequearLargeScreen();
        scrollTop();
        if (esLargeScreen && mostrandoMenu) {
            moverMenu(moverIzquierda);
        }
    }, false);

    var title = $("#title"), headerIcon = $("#headerIcon");

    $("#title").remove();

    loadLinks(urlInit);
    loadSubsList();

    scrollTop();
    
    var touch = "touchmove";

    if (supportOrientation) {
        $("#addNewSub").on(touch, function(e) {
            e.preventDefault();
        }, false);

        $("header").on(touch, function(e) {
            if (mostrandoMenu) { // Cheat temporal, para evitar que las vistas hagan overflow...
                e.preventDefault();
            }
        }, false);
    }
    
    function timeSince(now, time) {

        now = (now / 1000);

        var seconds = Math.floor(now - time);

        var interval = (seconds / 31536000);

        if (interval > 1) {
            interval = Math.floor(interval);
            return interval + (interval > 1 ? " years" : " year");
        }
        interval = (seconds / 2592000);
        if (interval > 1) {
            interval = Math.floor(interval);
            return interval + (interval > 1 ? " months" : " month");
        }
        interval = (seconds / 86400);
        if (interval > 1) {
            interval = Math.floor(interval);
            return interval + (interval > 1 ? " days" : " day");
        }
        interval = (seconds / 3600);
        if (interval > 1) {
            interval = Math.floor(interval);
            return interval + (interval > 1 ? " hours" : " hour");
        }
        interval = (seconds / 60);
        if (interval > 1) {
            interval = Math.floor(interval);
            return interval + (interval > 1 ? " minutes" : " minute");
        }
        return Math.floor(seconds) + " seconds";
    }
});