(function () {
  "use strict";
  // Keep the native calculator inside the usable WebView rectangle.
  // The original web calculator centers an unscaled CSS grid item, which
  // can push its last row behind Android's navigation buttons.
  (function installNativeViewportFit() {
    var calc = document.getElementById('calc');
    if (!calc) return;
    var body = document.body;
    var root = document.documentElement;
    var frame = 0;
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.style.justifyContent = 'flex-start';
    body.style.alignItems = 'center';
    body.style.height = '100%';
    body.style.minHeight = '0';
    body.style.overflow = 'hidden';
    calc.style.flexShrink = '0';
    calc.style.transformOrigin = 'top center';
    calc.style.marginBottom = '0';

    function fit() {
      if (!calc.isConnected) return;
      var heights = [window.innerHeight, root.clientHeight];
      if (window.visualViewport) heights.push(window.visualViewport.height);
      var heightsOK = heights.filter(function (v) { return v > 100 && isFinite(v); });
      if (!heightsOK.length) return;
      var h = Math.min.apply(null, heightsOK);
      var widths = [window.innerWidth, root.clientWidth];
      if (window.visualViewport) widths.push(window.visualViewport.width);
      var widthsOK = widths.filter(function (v) { return v > 100 && isFinite(v); });
      var w = Math.min.apply(null, widthsOK);
      var st = getComputedStyle(body);
      h -= (parseFloat(st.paddingTop) || 0) + (parseFloat(st.paddingBottom) || 0);
      w -= (parseFloat(st.paddingLeft) || 0) + (parseFloat(st.paddingRight) || 0);
      calc.style.transform = 'none';
      calc.style.marginTop = '0';
      var intrinsicH = calc.offsetHeight;
      var intrinsicW = calc.offsetWidth;
      if (!intrinsicH || !intrinsicW) return;
      // 16px reserve for system-navigation geometry / rounding.
      var scale = Math.max(0.1, Math.min(1,
        (h - 16) / intrinsicH, (w - 8) / intrinsicW));
      calc.style.transform = 'scale(' + scale + ')';
      calc.style.marginTop = Math.max(0, (h - intrinsicH * scale) / 2) + 'px';
    }

    function scheduleFit() {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(function () { frame = 0; fit(); });
    }
    window.__bernioNativeViewportFit = scheduleFit;
    window.addEventListener('resize', scheduleFit);
    window.addEventListener('orientationchange', scheduleFit);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', scheduleFit);
    scheduleFit();
    setTimeout(scheduleFit, 200);
    setTimeout(scheduleFit, 750);
  })();
})();
