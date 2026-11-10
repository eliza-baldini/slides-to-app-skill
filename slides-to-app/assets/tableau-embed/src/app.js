(function () {
  'use strict';

  // Origin of the embedded site, for any postMessage traffic (see references/tableau-data-app.md §5).
  var SITE_ORIGIN = '__SITE_ORIGIN__';
  var frame = document.getElementById('site');

  // Focus the deck so arrow keys and Space work without an extra click.
  frame.addEventListener('load', function () {
    try {
      frame.focus();
      frame.contentWindow.focus();
    } catch (e) {}
  });

  if (window.tableau && tableau.extensions) {
    tableau.extensions.initializeAsync().catch(function () {});
  }

  void SITE_ORIGIN;
})();
