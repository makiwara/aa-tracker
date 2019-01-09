//
// The code below must be minified and placed inline on the HTML page.
//
// ------------------------------------------------------------------ >8
(function(d, w) {
    var nocache = "";
    nocache = "?v="+Math.random();
    var n = d.getElementsByTagName("script")[0],
        s = d.createElement("script"),
        f = function() {
            n.parentNode.insertBefore(s, n);
        };
    s.type = "text/javascript";
    s.async = true;
    s.src = "//projectabove.com/aa-tracker/watch.js"+nocache;
    if (w.opera == "[object Opera]") {
        d.addEventListener("DOMContentLoaded", f, false);
    } else {
        f();
    }
})(document, window);
// ------------------------------------------------------------------ >8
