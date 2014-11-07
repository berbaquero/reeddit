var doc = win.document,
    body = doc.body;

function $id(id) {
    return doc.getElementById(id);
}

function $query(query) {
    return doc.querySelector(query);
}

// Pseudo-Globals
var editingSubs = false,
    urlInit = "http://www.reddit.com/",
    urlEnd = ".json?jsonp=?",
    urlLimitEnd = ".json?limit=30&jsonp=?",
    loadedLinks = {},
    replies = {},
    showingMenu = false,
    subreddits,
    store = win.fluid ? allCookies : win.localStorage,
    isModal = false,
    loadingComments = false,
    loadingLinks = false,
    currentThread,
    isWideScreen = checkWideScreen(),
    isLargeScreen = checkLargeScreen(),
    isiPad,
    scrollFix,
    currentSortingChoice = 'hot',
    mnml = false,
    updateBackup = 1,
    gists = {
        url: "https://api.github.com/gists",
        fileURL: ''
    },
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
    css = {
        showView: "show-view",
        showMenu: "show-menu",
        mnml: "mnml",
        hide: "hide"
    },
    currentView = view.main;

var defaultSubs = ["frontPage", "pics", "IAmA", "AskReddit", "worldNews", "todayilearned", "tech", "science", "reactiongifs", "books", "explainLikeImFive", "videos", "AdviceAnimals", "funny", "aww", "earthporn"];

var defaultChannel = {
    name: "Media",
    subs: ["movies", "television", "music", "games"]
};
