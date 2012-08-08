$(document).ready(function() {

    var linksTemplate = "{{#children}}<article class='linkWrap'><a class='link' href='{{data.url}}' target='_blank'><div class='linkThumb' style='background-image: url({{data.thumbnail}})'></div><div class='linkInfo'><p class='linkTitle'>{{data.title}}</p><p class='linkDomain'>{{data.domain}}</p><p class='linkSub'>{{data.subreddit}}</p></div></a><div class='toComments' data-link='{{data.permalink}}' data-id='{{data.id}}'><div class='rightArrow'></div></div></article>{{/children}}";

    var linkSummaryTemplate = "<article><div id='linkSummary'><p id='summaryTitle'>{{title}}</p><div id='selfText'></div></div></article>";
    
    var page = 1, perPage = 30, ancho = 320, activeView = 1, slider, urlEnd = ".json?jsonp=?",
    loadedLinks = {}, posts = {};

    var loadLinks = function() {
        var main = $("#mainWrap");
        main.empty();
        main.append("<p class='loading'>Cargando links...</p>");
        $.getJSON("http://www.reddit.com/" + urlEnd, function(result) {
            $(".loading").remove();
            var links = result.data;
            var html = Mustache.to_html(linksTemplate, links);
            main.append(html);
            var thumbs = $('.linkThumb');
            $.each(thumbs, function(i, t) {
                var thumb = $(t);
                var bg = thumb.attr('style');
                if(bg === 'background-image: url()') {
                    thumb.remove();
                }
            });
            for(var i = 0; i < links.children.length - 1; i++) {
                var link = links.children[i];
                posts[link.data.id] = {
                    "title": link.data.title
                };
            }
        });
    }

    var loadComments = function(data, baseElement, summary, id) {
        var now = new Date().getTime();
        var converter = new Markdown.Converter();
        var com = $("<div/>");
        if(summary) {
            var summaryHTML = Mustache.to_html(linkSummaryTemplate, summary);
            com.append(summaryHTML);
            if(summary.selftext) {
                var summaryConverter1 = new Markdown.Converter();
                $("#selfText").html(summaryConverter1.makeHtml(summary.selftext));
            }
            baseElement.append(summary);
        }
        for(var i = 0; i < data.length - 1; i++) {
            var c = data[i];
            
            var html = converter.makeHtml(c.data.body);
            
            var comment = $("<article/>").addClass("commentWrap")
            .append($("<div/>").addClass("commentData")
                .append($("<div/>").addClass("commentAuthor")
                    .append($("<p/>").text(c.data.author)))
                .append($("<div/>").addClass("commentInfo")
                    .append($("<p/>").text(timeSince(now, c.data.created_utc)))))
            .append($("<div/>").addClass("commentBody").html(html));
            com.append(comment);
        }
        baseElement.append(com);
        loadedLinks[id] = com;
        $("#detailWrap a").attr("target", "_blank");
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

    window.applicationCache.addEventListener("updateready", function(e) {
        var update = window.confirm("Update descargado. Recargar para actualizar?");
        if(update) {
            window.location.reload();
        }
    });

    tappable("#navBack", {
        onTap: function(e, target) {
            slideFromLeft();
            $(target).addClass("invisible");
            $("#title").text('Tidder');
        }
    });

    tappable("#refresh", {
        onTap: function(e, target) {
            loadLinks();
        }
    });

    tappable(".toComments", {
        onTap: function(e, target) {

            var comm = $(target);
            var id = comm.attr("data-id");
            ensenar("#navBack");
            var detail = $("#detailWrap");
            detail.empty();

            var d = document.getElementById("detailWrap");
            d.scrollTop = 0;

            if (loadedLinks[id]) {
                detail.append(loadedLinks[id]);
            } else {
                var url = "http://www.reddit.com" + comm.attr("data-link") + urlEnd;
                $.getJSON(url, function(result) {                    
                    var comments = result[1].data.children;
                    var summary = result[0].data.children[0].data;
                    loadComments(comments, detail, summary, id);
                });
            }
            slideFromRight();
            $("#title").text(posts[id].title);
        },
        activeClass: 'toComments-active'
    });
    
    // Animaciones

    var slideFromLeft = function () {
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
            }, 350);
        }, 50);
        activeView = 1;
    }

    var slideFromRight = function () {
        var main = $("#mainView");
        var det = $("#detailView");
        det.css("left", ancho);
        setTimeout(function() {
            main.addClass("slideTransition").css('-webkit-transform', 'translate3d(-' + ancho + 'px, 0px, 0px)');
            det.addClass("slideTransition").css('-webkit-transform', 'translate3d(-' + ancho + 'px, 0px, 0px)');
            setTimeout(function () { // Quita las propiedades de transition            
                det.css("left", 0).removeClass("slideTransition").css("-webkit-transform", "");
                main.removeClass("slideTransition").addClass("fuera").css("-webkit-transform", "");
            }, 350);
        }, 100);
        activeView = 2;
    }

    var reveal = function(element) {
        var el = $(element);
        el.removeClass("fuera").addClass("invisible");
        setTimeout(function() {
            el.removeClass("invisible");
        });
    }

    // Metodos de vistas

    var mostrar = function (element) {
        var el = $(element);
        el.removeClass("oculto");
    }

    var sacar = function (element) {
        var el = $(element);
        el.addClass("fuera");
    }

    var ingresar = function(element) {
        var el = $(element);
        el.removeClass("fuera");
        return el;
    }

    var ocultar = function(element) {
        var el = $(element);
        el.addClass("oculto");
    }

    var ensenar = function(element) {
        var el = $(element);
        el.removeClass("invisible");
    }

    var d = document, body = d.body;

    var supportOrientation = typeof window.orientation != 'undefined',
    getScrollTop = function() {
        return window.pageYOffset || d.compatMode === 'CSS1Compat' && d.documentElement.scrollTop || body.scrollTop || 0;
    },
    scrollTop = function() {
        if (!supportOrientation) {
            return;
        } else {
            $(body).css({
                "min-height": (screen.height - 64) + 'px', 
                "position": "relative"
            });
            setTimeout(function() {
                window.scrollTo(0, 0);
                var top = getScrollTop();
                window.scrollTo(0, top === 1 ? 0 : 1);
            }, 1);
        }
    };

    loadLinks();

    scrollTop();

    $("#container").on('touchstart', function(){
        window.scrollTo(0, 1);
    });
});