var container = document.getElementById('container');

if (navigator.standalone) {

    var popppJS = document.createElement("script"), scrollFix = document.createElement("script"),
    tappable = document.createElement("script"), swipe = document.createElement("script"),
    mustache = document.createElement("script"), jQuery = document.createElement("script");

    popppJS.src = "js/poppp.js";
    scrollFix.src = "js/scrollfix.js";
    tappable.src = "js/tappable.js";
    swipe.src = "js/swipe.js";
    mustache.src = "js/mustache.js";
    jQuery.src = "//ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js";

    container.innerHTML = '<div class="view" id="mainView"><div id="wrapper"></div></div><div class="view fuera" id="detailView"></div>';

    document.body.appendChild(jQuery);
    document.body.appendChild(scrollFix);
    document.body.appendChild(mustache);
    document.body.appendChild(tappable);
    document.body.appendChild(swipe);
    document.body.appendChild(popppJS);

} else {

    var link = document.createElement("link");

    link.rel = "stylesheet";
    link.href = "css/bienvenida.css";

    document.head.appendChild(link);

    var section = document.createElement("section"),
    pIcon = document.createElement("p"), pMessage = document.createElement("p"),
    icon = document.createElement("div");

    pIcon.innerHTML = "<img src='img/miniphone.png' />";
    pIcon.setAttribute("id", "miniphone");

    pMessage.setAttribute("id", "mensaje");
    pMessage.innerHTML = "Agr&eacute;game al Home Screen, desde Safari, para instalar en el iPhone";

    section.appendChild(pIcon);
    section.appendChild(pMessage);

    container.appendChild(section);

    icon.className = "arrow";

    container.appendChild(icon);
}