const wideScreenBP = window.matchMedia("(min-width: 1000px)");
const largeScreenBP = window.matchMedia("(min-width: 490px)");
const UA = window.navigator.userAgent;

const is = (function() {

  // Do detection
  var isDesktop = !/iPhone|iPod|iPad|Android|Mobile/.test(UA);
  var isiPad = /iPad/.test(UA);
  var isiPhone = /iP(hone|od)/.test(UA);
  var isiOS = (isiPhone || isiPad);

  const iOSversion = (() => {
    if (!isiOS) {
      return 0;
    }
    return parseInt(UA.match(/ OS (\d+)_/i)[1], 10);
  })();

  return {
    wideScreen: wideScreenBP.matches,
    largeScreen: largeScreenBP.matches,
    desktop: isDesktop,
    mobile: !isDesktop,
    iPhone: isiPhone,
    iPad: isiPad,
    iOS: isiOS,
    iOS7: (isiOS && iOSversion >= 7),
  };

})();
