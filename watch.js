(function(d,w){
    if (typeof Array.isArray === 'undefined') {
        Array.isArray = function(obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        }
    };
    var BASE_URL = "//projectabove.com/aa-tracker/register.js";
    var CALLBACK = "ecg_callback";
    var PARAM = "ecg";
    var footprintLifetime = 30; // days for footprint being alive
    var storagePARAM = PARAM + "TrackingData";
    var reCookie = new RegExp(PARAM + "=([^;]+)");
    var rePARAM  = new RegExp('([?&])' + PARAM + '(=([^&#]*)|&|#|$)');
    var DEBUG = false;
    var eCG = { // container for non-exposed functions (makes it easy to expose if needed).
        dateNow: function() { // convert date to a simple string. E.g. '2009-0-25',
        var m = new Date();
        return  m.getUTCFullYear() +"-"+
        m.getUTCMonth() +"-"+
        m.getUTCDate();
    },
    restoreDate: function(d) { // restores Date object from the string (see above).
        var p = d.split("-");
        return new Date(parseInt(p[0],10), parseInt(p[1],10), parseInt(p[2],10));
    },
    dateDiff: function(d1, d2) { // returns rough number of days between two dates.
        var oneDay = 24*60*60*1000;
        return Math.floor(Math.abs((d1.getTime() - d2.getTime())/(oneDay)));
    },
    isLocalStorageAvail: function() { // checks if local/session storage are supported.
        var test = 'eCG_local_storage';
        try {
            w.localStorage.setItem(test, test);
            w.localStorage.removeItem(test);
            return true;
        } catch(e) {
            return false;
        }
    },
    setFootprint: function(value, date) { // stores a footprint value into localStorage.
        if (eCG.isLocalStorageAvail()) {
            w.localStorage.setItem(storagePARAM, [value, date?date:eCG.dateNow(), eCG.dateNow()].join(","));
        }
    },
    getFootprint: function() { // gets the footprint as list: [value, date, refreshDate]
        if (eCG.isLocalStorageAvail()) {
            var r = w.localStorage.getItem(storagePARAM);
            return (r == null) ? [""] : r.split(",");
        }
    },
    hasFootprint: function() { // checks if there is a fresh footprint which was not sent recently.
        var fp = eCG.getFootprint();
        if (eCG.dateDiff(new Date(), eCG.restoreDate(fp[1])) < footprintLifetime) {
            if (DEBUG || fp[2] != eCG.dateNow()) {
                eCG.setFootprint(fp[0], fp[1]);
                return true;
            }
        }
        return false;
    },
    setCookie: function(v) { // stores value in session storage (fallback to cookies).
        if (eCG.isLocalStorageAvail()) {
            w.sessionStorage.setItem(storagePARAM, v);
        } else {
            document.cookie = PARAM + "=" + v;
        }
    },
    getCookie: function() { // gets the stored value from the session storage (fallback to cookies).
        if (eCG.isLocalStorageAvail()) {
            var r = w.sessionStorage.getItem(storagePARAM);
            return (r == null)?"":r;
        } else {
            try {
                return decodeURIComponent(document.cookie.match(reCookie)[1]);
            } catch (e) {
                return "";
            }
        }
    },
    getParam: function() { // gets the param value from the querystring.
        var results = rePARAM.exec(document.location.href);
        if (!results || !results[3]) {
            return '';
        } else {
            return decodeURIComponent(results[3].replace(/\+/g, ' '));
        }
    },
    reduceParam: function() { // removes the param from the querystring.
        var result = document.location.href.replace(rePARAM, "$1");
        result = result.replace(/\?&/, "?").replace(/&&/, "&").replace(/&$/, "");
        return result;
    },
    getData: function() { // returns tracking data stored in the session storage.
        var tdSaved = eCG.getCookie();
        if (!tdSaved) tdSaved = "";
        return tdSaved;
    },
    serialize: function(obj) { // serializes object into GET querystring.
        var str = [];
        for (var p in obj) {
            if (obj.hasOwnProperty(p)) {
                if (Array.isArray(obj[p])) {
                    for (var k in obj[p]) {
                        str.push([encodeURIComponent(p),encodeURIComponent(obj[p][k])]);
                    }
                } else if (obj[p] !== null){
                    str.push([encodeURIComponent(p),encodeURIComponent(obj[p])]);
                }
            }
        }
        for (var p in str) {
            str[p] = str[p].join("=");
        }
        return str.join("&");
    },
    send: function(obj) { // sends object via <script src=....> request.
        var n = d.getElementsByTagName("script")[0],
        s = d.createElement("script"),
        f = function() {
            n.parentNode.insertBefore(s, n);
        };
        s.type = "text/javascript";
        s.async = true;
        s.src = BASE_URL+ "?_=" + Math.random() + "&" + eCG.serialize(obj);
        if (DEBUG) {
            console.log("send:",       obj);
            console.log("serialized:", eCG.serialize(obj))
            return;
        }
        if (w.opera == "[object Opera]") {
            d.addEventListener("DOMContentLoaded", f, false);
        } else {
            f();
        }
    },
    track: function(events, sendFootprint) { // MAIN! Stores tracking data and sends it back.
        var td  = eCG.getParam();
        var tdSaved = eCG.getData();
        var tdLanded = false;
        if (DEBUG && tdSaved=="" && w.Admarkt.sample) {
            tdSaved = w.Admarkt.sample;
        }
        var onlyLanding = events?false:true;
        if (td != '') {
            window.history.replaceState(PARAM+'_landing', document.title, eCG.reduceParam());
            eCG.setCookie(td);
            tdLanded = tdSaved = td;
            if (onlyLanding) {
                events = ["landing"];
            } else {
                events.push("landing");
            }
            if (sendFootprint) {
                eCG.setFootprint(tdLanded);
            }
        }
        if (events) {
            if (tdSaved.length > 0) {
                eCG.send({ td: tdSaved, event: events });
            } else if (sendFootprint && eCG.hasFootprint()) {
                eCG.send({ td: eCG.getFootprint()[0], event: events, footprint:true });
            }
        }
    }
}
var t = function() {
    if (w.Admarkt) {
        eCG.track(w.Admarkt["events"], w.Admarkt["footprint"]);
    } else {
        eCG.track();
    }
}
if (DEBUG) { t(); }
else { try { t(); } catch(e) {} }
})(document, window);
