//
// The code below must be minified and placed inline on the HTML page.
//
// ------------------------------------------------------------------ >8
(function() {
  var w = (function () { return this; }());
  var d = w.document;
  var nocache = "";
  nocache = "?v=" + Math.random();
  var n = d.getElementsByTagName("script")[0];
  var s = d.createElement("script");
  var f = function() {
    n.parentNode.insertBefore(s, n);
  };
  s.type = "text/javascript";
  s.async = true;
  s.src = "//projectabove.com/aa-tracker/watch.js" + nocache;
  if (w.opera.toString() === "[object Opera]") {
    d.addEventListener("DOMContentLoaded", f, false);
  } else {
    f();
  }
}());
// ------------------------------------------------------------------ >8
