# Experimental

This is an experimental branch, to create a Mac app (OS X) version of Reeddit, using [node-webkit](https://github.com/rogerwang/node-webkit).

[Download Reeddit.app (experimental)](https://dl.dropboxusercontent.com/u/1631373/Reeddit.app.zip).

# Reeddit

A minimalist, elastic and read-only [Reddit](http://reddit.com/) web app client, that lets you create custom 'Channels' with up to 3 subreddits each.

* #### Minimalist
While aiming for simplicity, Reeddit cares to show you only the most important information from the posts and comments. No upvotes or points.

* #### Elastic
Reeddit has 3 different elastic layouts - you can use it on any window size. So it's comfortable to use on a smartphone, tablet or desktop.

* #### Read-only
Being a personal side-project of mine, Reeddit can be used for browsing subreddits and viewing links/post and its comments, but not for voting or commenting... for now ;) -- However, the subreddits and channels you add are saved locally, so you don't lose any of that data.

* #### Channels
You can group up to 3 subreddits into a Channel, so you can browse their links in a single view, instead of having to browse each one separately. This is specially useful when you add subject-related subreddits.

For screenshots and additional info, visit [Reeddit's presentation page](http://berbaquero.github.com/reeddit/about).

## Tools

To build Reeddit, I used these awesome resources:

*	[Zepto.js](http://zeptojs.com/) -- basically, jQuery for modern browsers. Lighter, and with various useful tools for mobile sites and apps.
*	[Tappable](https://github.com/cheeaun/tappable) -- Great 'tap' events handler.
*	[pagedown](http://code.google.com/p/pagedown/) -- Client-side Markdown-to-HTML conversion.
*	[Mustache.js](https://github.com/janl/mustache.js/) -- Lightweigth client-side templating.
*	[reziseend.js](https://github.com/porada/resizeend) -- Better 'resize' handler.
* 	[Iconmonstr](http://iconmonstr.com/) -- Awesome icons.

### Compatibility

For now, Reeddit works properly on recent versions of Webkit-based browsers (Chrome and Safari, desktop and mobile) - it's been tested on iOS 5+ (iPhone and iPad) and Android 4+.

I used the Flexbox module (2009 spec) for layout, and Firefox's implementation is kinda wonky. Should be getting into upgrading to the latest flexbox module spec soon.

My original intention was to create an iOS 5-optimized mobile webapp - I wanted to try the then-introduced `-webkit-overflow-scrolling: touch` property, that allows native touch scrolling for content with overflow.

On the Desktop, Reeddit is great as an [Application Shortcut](http://support.google.com/chrome/bin/answer.py?hl=en-GB&answer=95710) on Google Chrome, or as a Mac app, with [Fluid](http://fluidapp.com/), and can be installed as a Firefox App on latest Firefox. :D

### License

Licensed under the [MIT License](http://berbaquero.mit-license.org/).
