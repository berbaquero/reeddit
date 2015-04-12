var wideScreenBP = window.matchMedia("(min-width: 1000px)"),
	largeScreenBP = window.matchMedia("(min-width: 490px)"),
	UA = window.navigator.userAgent;

var is = (function() {

	// Do detection
	var isDesktop = !/iPhone|iPod|iPad|Android|Mobile/.test(UA),
		isiPad = /iPad/.test(UA),
		isiPhone = /iP(hone|od)/.test(UA),
		isiOS = (isiPhone || isiPad);

	var isLinkDownloadable = (() => {
		var link = document.createElement('a');
		return link.download !== undefined;
	})();

	var isMozStandalone = false;

	var testMozStandalone = () => {
		if (!window.navigator.mozApps) {
			isMozStandalone = false;
			return;
		}

		var request = window.navigator.mozApps.getSelf();
		request.onsuccess = function() {
			isMozStandalone = !!(request.result);
		};
	};

	testMozStandalone();

	return {

		wideScreen: wideScreenBP.matches,

		largeScreen: largeScreenBP.matches,

		desktop: isDesktop,

		mobile: !isDesktop,

		iPhone: isiPhone,

		iPad: isiPad,

		iOS: isiOS,

		iOS7: (isiOS && parseInt(UA.match(/ OS (\d+)_/i)[1], 10) >= 7),

		linkDownloadable: isLinkDownloadable,

		mozStandalone: isMozStandalone
	};

})();
