var M = { // Model
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
        getAllSubsString: function() {
            var allSubs = '',
				frontPage = 'frontpage',
				all = 'all';
            for (var i = 0; i < M.Subreddits.list.length; i++) {
                var sub = M.Subreddits.list[i].toLowerCase();
                if (sub === frontPage ||
					sub === all) {
					continue;
				}
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
