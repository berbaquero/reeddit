# Reeddit

A minimalist, elastic and read-only [Reddit](http://reddit.com/) web app client, that lets you create "Channels", which groups as many subreddits as you want into one stream.

* #### Minimalist
While aiming for simplicity, Reeddit cares to show you only the most important information from the posts and comments. No upvotes or points.

* #### Elastic
Reeddit has 3 different elastic layouts - you can use it on any window size. So it's comfortable to use on a smartphone, tablet or desktop.

* #### Read-only
Being a personal side-project of mine, Reeddit can be used for browsing subreddits and viewing links/post and its comments, but not for voting or commenting... for now ;) -- However, the subreddits and channels you add are saved locally, so you don't lose any of that data.

* #### Channels
Channels let you group subreddits into one stream, so you can browse their links in a single view, instead of having to browse each one separately. This is specially useful when you add subject-related subreddits.

For screenshots and additional info, visit [Reeddit's Homepage](http://reedditapp.com/about).

Follow the updates and send quick feedback on Twitter: [@ReedditApp](https://twitter.com/reedditapp).

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

My original intention was to create an iOS 5-optimized mobile webapp - I wanted to try the then-introduced `-webkit-overflow-scrolling: touch` property, that allows native touch scrolling for content with overflow.

On the Desktop, Reeddit is great as an [Application Shortcut](http://support.google.com/chrome/bin/answer.py?hl=en-GB&answer=95710) on Google Chrome, or as a [Fluid](http://fluidapp.com/) app on Mac, and can be installed as an Installable Web-app on latest Firefox. :D

You can also use the especially made [Reeddit for Mac](http://mac.reedditapp.com), or install it on Firefox OS from the Marketplace, [here](https://marketplace.firefox.com/app/reeddit).

### License

Licensed under the [MIT License](http://berbaquero.mit-license.org/).
