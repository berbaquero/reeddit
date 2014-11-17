function checkWideScreen() {
    return win.matchMedia("(min-width: 1000px)").matches;
}

function checkLargeScreen() {
    return win.matchMedia("(min-width: 490px)").matches;
}

function goToCommentFromHash() {
    var match = location.hash.match(/(#comments:)((?:[a-zA-Z0-9]*))/);
    if (match && match[2]) {
        var id = match[2];
        C.Comments.show(id);
    }
}

function checkImageLink(url) {
    var matching = url.match(/\.(svg|jpe?g|png|gif)(?:[?#].*)?$|(?:imgur\.com|livememe\.com)\/([^?#\/.]*)(?:[?#].*)?(?:\/)?$/);
    if (!matching) return '';
    if (matching[1]) { // normal image link
        return url;
    } else if (matching[2]) { // imgur or livememe link
        if (matching[0].slice(0, 5) === "imgur") return 'http://imgur.com/' + matching[2] + '.jpg';
        else if (matching[0].indexOf("livememe.") >= 0) return 'http://i.lvme.me/' + matching[2] + '.jpg';
        else return null;
    } else {
        return null;
    }
}

function setEditingSubs(editing) { // editing: boolean
    editingSubs = editing;
    if (isWideScreen) {
        // If it's showing the add or remove subreddits/channels panel, hide the refresh button
        var refreshBtn = $('#main-footer .footer-refresh');
        refreshBtn.css('display', editing ? 'none' : '');
    }
}

function doByCurrentSelection(caseSub, caseChannel) {
    switch (M.currentSelection.type) {
        case selection.sub:
            caseSub();
            break;
        case selection.channel:
            caseChannel();
            break;
    }
}

$('body').on('submit', '#form-new-sub form', function(e) {
    e.preventDefault();
    C.Subreddits.addFromNewForm();
});

function goToComments(id) {
    location.hash = '#comments:' + id;
}

function refreshCurrentStream() {
    if (editingSubs) return;
    doByCurrentSelection(function() { // if it's subreddit
        if (M.currentSelection.name.toUpperCase() === 'frontPage'.toUpperCase()) C.Posts.load(urlInit + "r/" + M.Subreddits.getAllString() + "/");
        else C.Posts.load(urlInit + "r/" + M.currentSelection.name + "/");
    }, function() { // if it's channel
        C.Channels.loadPosts(M.Channels.getByName(M.currentSelection.name));
    });
}

function createBackup() {
    if (updateBackup) {
        V.Actions.showModal(T.exportData, function() {
            var files = {},
                content = "{\"channels\": " + store.getItem("channels") + ", \"subreddits\": " + store.getItem("subreeddits") + "}";
            files["reedditdata.json"] = {
                "content": content
            };
            $.ajax({
                url: gists.url,
                type: "POST",
                data: JSON.stringify({
                    "description": "Reeddit User Data",
                    "public": true,
                    "files": files
                }),
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8'
                },
                success: function(response) {
                    var resp = JSON.parse(response);
                    $id("btn-save-dbx").style.display = "block"; // Show "Save to Dropbox" button only when the gist's created
                    gists.fileURL = resp.files["reedditdata.json"].raw_url;
                    updateBackup = 0;
                },
                error: function() {
                    $("#btn-save-dbx").remove();
                    $(".move-data-exp").append("<p class='msg-error'>Oh oh. Error creating your backup file. Retry later.</p>");
                    V.Actions.removeModal();
                }
            });
        });
    } else if (gists.fileURL) {
        V.Actions.showModal(T.exportData, function() {
            $id("btn-save-dbx").style.display = "block";
        });
    }
}

function chooseFromDropbox() {
    Dropbox.choose({
        success: function(file) {
            $.ajax({
                url: file[0].link,
                success: function(data) {
                    try {
                        var refresh = false;
                        if (typeof data === "string") data = JSON.parse(data);
                        if (data.subreddits) {
                            refresh = true;
                            store.setItem("subreeddits", JSON.stringify(data.subreddits));
                        }
                        if (data.channels) {
                            refresh = true;
                            store.setItem("channels", JSON.stringify(data.channels));
                        }
                        if (refresh) win.location.reload();
                    } catch (e) {
                        alert("Oops! Wrong file, maybe? - Try choosing another one.");
                    }
                }
            });
        },
        linkType: "direct",
        extensions: [".json"]
    });
}

var supportOrientation = typeof win.orientation !== 'undefined',
    getScrollTop = function() {
        return win.pageYOffset || doc.compatMode === 'CSS1Compat' && doc.documentElement.scrollTop || body.scrollTop || 0;
    },
    scrollTop = function() {
        if (!supportOrientation) return;
        body.style.height = screen.height + 'px';
        setTimeout(function() {
            win.scrollTo(0, 1);
            var top = getScrollTop();
            win.scrollTo(0, top === 1 ? 0 : 1);
            body.style.height = win.innerHeight + 'px';
        }, 1);
    };
