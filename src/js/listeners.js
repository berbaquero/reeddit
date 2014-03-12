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
    isWideScreen = checkWideScreen();
    isLargeScreen = checkLargeScreen();
    scrollTop();
    if (isLargeScreen && showingMenu) V.Actions.moveMenu(move.left);
    if (isiPad) scrollFix();
}, false);

// Pseudo-hash-router
win.addEventListener('hashchange', function() {
    if (location.hash === "") {
        V.Actions.backToMainView();
        $('.link.link-selected').removeClass('link-selected');
        V.Actions.setDetailFooter("");
        setTimeout(function() {
            V.detailWrap.empty();
        }, isWideScreen ? 1 : 301);
    } else {
        goToCommentFromHash();
    }
}, false);