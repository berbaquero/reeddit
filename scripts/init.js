V.title.remove();

if (isWideScreen) V.footerPost.text(T.noLink);

M.currentSelection.loadSaved();

C.Subreddits.loadSaved();
C.Channels.loadSaved();

if (location.hash) goToCommentFromHash();

// Cargar links y marcar como activo al subreddit actual - la 1ra vez sera el 'frontPage'
doByCurrentSelection(
    function() { // En caso de ser un subreddit
        var i = M.Subreddits.list.indexOf(M.currentSelection.name);
        if (i > -1) {
            var activeSub = doc.getElementsByClassName('sub')[i];
            $(activeSub).addClass('sub-active');
        }
        // Load links
        if (M.currentSelection.name.toUpperCase() === 'frontPage'.toUpperCase()) {
            C.currentSelection.setSubreddit('frontPage');
            C.Posts.load(urlInit + "r/" + M.Subreddits.getAllString() + "/");
        } else {
            C.Posts.load(urlInit + "r/" + M.currentSelection.name + "/");
        }
        V.Actions.setSubTitle(M.currentSelection.name);
    }, function() { // If it's a channel
        var channel;
        for (var i = 0; i < M.Channels.list.length; i++) {
            channel = M.Channels.list[i];
            if (channel.name === M.currentSelection.name) {
                var active = doc.getElementsByClassName('channel')[i];
                $(active).addClass('channel-active');
                break;
            }
        }
        C.Channels.loadPosts(channel);
    });

scrollTop();

var loadMnml = store.getItem("mnml"),
    isMnml = loadMnml ? JSON.parse(loadMnml) : false;
V.Actions.switchMnml(false, isMnml);

if (!isDesktop) {
    var touch = "touchmove",
        UA = navigator.userAgent;
    $id("edit-subs").addEventListener(touch, function(e) {
        e.preventDefault();
    }, false);
    doc.getElementsByTagName('header')[0].addEventListener(touch, function(e) {
        if (showingMenu) e.preventDefault(); // Cheat temporal, para evitar que las vistas hagan overflow
    }, false);
    if (isiPad) {
        iPadScrollFix = function() {
            // This slight height change makes the menu container 'overflowy', to allow scrolling again on iPad - weird bug
            var nextHeight = '36px' === $('.menu-desc').css('height') ? '35px' : '36px';
            setTimeout(function() {
                $('.menu-desc').css('height', nextHeight);
            }, 500);
        };
		iPadScrollFix();
    }
    if (isiOS7) {
		// apply iOS 7+ theme
        if (!isMnml) V.Actions.switchMnml(true, true);
        body.classList.add("ios7");
    }
}
