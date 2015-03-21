var wideScreenBP = window.matchMedia("(min-width: 1000px)"),
	largeScreenBP = window.matchMedia("(min-width: 490px)"),
	UA = window.navigator.userAgent;

var is = (function() {

	// Do detection
	var isDesktop = !/iPhone|iPod|iPad|Android|Mobile/.test(UA),
		isiPad = /iPad/.test(UA),
		isiPhone = /iP(hone|od)/.test(UA);

	return {

		wideScreen: wideScreenBP.matches,

		largeScreen: largeScreenBP.matches,

		desktop: isDesktop,

		mobile: !isDesktop,

		iPhone: isiPhone,

		iPad: isiPad,

		iOS7: ((isiPhone || isiPad) && parseInt(UA.match(/ OS (\d+)_/i)[1], 10) >= 7)
	};

})();
