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
	isWideScreen = wideScreenBP.matches;
	isLargeScreen = largeScreenBP.matches;
    scrollTop();
    if (isLargeScreen && showingMenu) V.Actions.moveMenu(move.left);
    if (isiPad) iPadScrollFix();
}, false);

if (isiPhone && isiOS7) {
	var hasSwiped = false,
		swipeClass = 'from-swipe';
	document.addEventListener('touchstart', function(ev) {
		var touchX = ev.targetTouches[0].clientX;
		hasSwiped = (touchX < 10 || touchX > window.innerWidth - 10);
	});
	document.addEventListener('touchend', function() {
		hasSwiped = false;
	});
}

// Pseudo-hash-router
win.addEventListener('hashchange', function() {
	if (isiPhone && isiOS7) {
		// Switch `transition-duration` class,
		// to stop animation when swiping
		if (hasSwiped) {
			V.mainView.addClass(swipeClass);
			V.detailView.addClass(swipeClass);
			V.btnNavBack.addClass(swipeClass);
			V.subtitle.addClass(swipeClass);
		} else {
			V.mainView.removeClass(swipeClass);
			V.detailView.removeClass(swipeClass);
			V.btnNavBack.removeClass(swipeClass);
			V.subtitle.removeClass(swipeClass);
		}
		hasSwiped = false;
	}
	// Handle Hash Changes
    if (location.hash === "") { // To Main View
		V.Actions.backToMainView();
		V.Actions.clearSelectedLink();
        V.Actions.setDetailFooter("");
		setTimeout(function() {
			V.detailWrap.empty();
		}, isWideScreen ? 1 : 301);
    } else { // To Comment View
        goToCommentFromHash();
    }
}, false);
