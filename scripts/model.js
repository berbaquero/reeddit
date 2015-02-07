var M = { // Model
    Posts: {
        list: {},
        setList: function(posts) {
            for (var i = 0; i < posts.children.length; i++) {
                var post = posts.children[i];
                if (M.Posts.list[post.data.id]) { // Si ya se ha cargado este link localmente
                    // Se actualizan los datos dinamicos
                    M.Posts.list[post.data.id].num_comments = post.data.num_comments;
                    M.Posts.list[post.data.id].created_utc = post.data.created_utc;
                } else { // Si no se han cargado los links localmente
                    M.Posts.list[post.data.id] = {
                        title: post.data.title,
                        encodedTitle: encodeURI(post.data.title),
                        selftext: post.data.selftext,
                        created_utc: post.data.created_utc,
                        domain: post.data.domain,
                        subreddit: post.data.subreddit,
                        num_comments: post.data.num_comments,
                        url: post.data.url,
                        self: post.data.is_self,
                        link: post.data.permalink,
                        author: post.data.author,
                        over_18: post.data.over_18,
                        stickied: post.data.stickied
                    };
                }
            }
        },
        idLast: ''
    },
    Subreddits: {
        list: [],
		add: function(sub) {
			M.Subreddits.list.push(sub);
			store.setItem("subreeddits", JSON.stringify(M.Subreddits.list));
			updateBackup = 1;
		},
        setList: function(subs) {
            M.Subreddits.list = subs;
            store.setItem("subreeddits", JSON.stringify(M.Subreddits.list));
            updateBackup = 1;
        },
        remove: function(sub) {
            var idx = M.Subreddits.list.indexOf(sub);
            M.Subreddits.list.splice(idx, 1);
            store.setItem("subreeddits", JSON.stringify(M.Subreddits.list));
            updateBackup = 1;
        },
		listHasSub: function(newSub) {
			if (M.Subreddits.list) {
				newSub = newSub.toLowerCase();
				for(var i = M.Subreddits.list.length; --i;) {
					var sub = M.Subreddits.list[i];
					if (sub.toLowerCase() === newSub) {
						return true;
					}
				}
				return false;
			}
			return false;
		},
        getAllString: function() {
            var allSubs = '';
            for (var i = 0; i < M.Subreddits.list.length; i++) {
                var sub = M.Subreddits.list[i];
                if (sub.toUpperCase() === 'frontPage'.toUpperCase()) continue;
                allSubs += sub + '+';
            }
            return allSubs.substring(0, allSubs.length - 1);
        },
        idLast: ''
    },
    Channels: {
        list: [],
        getURL: function(channel) {
            if (channel.subs.length === 1) { // Reddit API-related hack
                // If there's one subreddit in a "Channel", and this subreddit name's invalid, reddit.com responds with a search-results HTML - not json data - and throws a hard-to-catch error...
                return "r/" + channel.subs[0] + "+" + channel.subs[0]; // Repeating the one subreddit in the URL avoids this problem :)
            } else {
                return "r/" + channel.subs.join("+");
            }
        },
        add: function(channel) {
            M.Channels.list.push(channel);
            store.setItem('channels', JSON.stringify(M.Channels.list));
            updateBackup = 1;
        },
        remove: function(name) {
            for (var j = 0; j < M.Channels.list.length; j++) {
                if (M.Channels.list[j].name === name) {
                    M.Channels.list.splice(j, 1);
                    break;
                }
            }
            store.setItem('channels', JSON.stringify(M.Channels.list));
            updateBackup = 1;
        },
        getByName: function(name) {
            var foundChannel;
            for (var i = 0; i < M.Channels.list.length; i++) {
                if (M.Channels.list[i].name.toLowerCase() === name.toLowerCase()) {
                    foundChannel = M.Channels.list[i];
                    break;
                }
            }
            return foundChannel;
        }
    },
    currentSelection: {
        loadSaved: function() {
            var loadedSelection = store.getItem('currentSelection');
            if (loadedSelection) loadedSelection = JSON.parse(loadedSelection);
            M.currentSelection.name = loadedSelection ? loadedSelection.name : 'frontPage';
            M.currentSelection.type = loadedSelection ? loadedSelection.type : selection.sub;
        },
        setSubreddit: function(sub) {
            M.currentSelection.name = sub;
            M.currentSelection.type = selection.sub;
            store.setItem('currentSelection', JSON.stringify(M.currentSelection));
        },
        setChannel: function(channel) {
            M.currentSelection.name = channel.name;
            M.currentSelection.type = selection.channel;
            store.setItem('currentSelection', JSON.stringify(M.currentSelection));
        }
    }
};
