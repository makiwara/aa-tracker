(function() {
  var w = (function () { return this; }());
  var d = w.document;
  if (typeof Array.isArray === "undefined") {
    Array.isArray = function(obj) {
      return Object.prototype.toString.call(obj) === "[object Array]";
    };
  }
  var EVENTS = { landing: "LANDING", footprintPrefix: "ASSISTED_" };
  var BASE_URL = "//projectabove.com/aa-tracker/register.js";
  var PARAM = "ecg";
  var footprintLifetime = 30; // days for footprint being alive
  var storagePARAM = PARAM + "TrackingData";
  var reCookie = new RegExp(PARAM + "=([^;]+)");
  var rePARAM = new RegExp("([?&])" + PARAM + "(=([^&#]*)|&|#|$)");
  var DEBUG = false;
  var eCG = { // container for non-exposed functions (makes it easy to expose if needed).
    dateNow: function() { // convert date to a simple string. E.g. '2009-0-25',
      var m = new Date();
      return m.getUTCFullYear() + "-" +
      m.getUTCMonth() + "-" +
      m.getUTCDate();
    },
    restoreDate: function(d) { // restores Date object from the string (see above).
      var p = d.split("-");
      return new Date(parseInt(p[0], 10), parseInt(p[1], 10), parseInt(p[2], 10));
    },
    dateDiff: function(d1, d2) { // returns rough number of days between two dates.
      var oneDay = 24 * 60 * 60 * 1000;
      return Math.floor(Math.abs((d1.getTime() - d2.getTime()) / (oneDay)));
    },
    isLocalStorageAvail: function() { // checks if local/session storage are supported.
      var test = "eCG_local_storage";
      try {
        w.localStorage.setItem(test, test);
        w.localStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    },
    setFootprint: function(value, date) { // stores a footprint value into localStorage.
      if (eCG.isLocalStorageAvail()) {
        w.localStorage.setItem(storagePARAM, [value, date ? date : eCG.dateNow(), eCG.dateNow()].join(","));
      }
    },
    getFootprint: function() { // gets the footprint as list: [value, date, refreshDate]
      if (eCG.isLocalStorageAvail()) {
        var r = w.localStorage.getItem(storagePARAM);
        return (r === null) ? [""] : r.split(",");
      }
      return false;
    },
    hasFootprint: function() { // checks if there is a fresh footprint which was not sent recently.
      var fp = eCG.getFootprint();
      if (fp !== false && eCG.dateDiff(new Date(), eCG.restoreDate(fp[1])) < footprintLifetime) {
        if (DEBUG || fp[2] !== eCG.dateNow().toString()) {
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
        d.cookie = PARAM + "=" + v;
      }
    },
    getCookie: function() { // gets the stored value from the session storage (fallback to cookies).
      if (eCG.isLocalStorageAvail()) {
        var r = w.sessionStorage.getItem(storagePARAM);
        return (r === null) ? "" : r;
      }
      try {
        return decodeURIComponent(d.cookie.match(reCookie)[1]);
      } catch (e) {
        return "";
      }
    },
    getParam: function() { // gets the param value from the querystring.
      var results = rePARAM.exec(d.location.href);
      if (!results || !results[3]) { // third match piece is the value
        return "";
      }
      return decodeURIComponent(results[3].replace(/\+/g, " "));
    },
    reduceParam: function() { // removes the param from the querystring.
      var result = d.location.href.replace(rePARAM, "$1");
      result = result.replace(/\?&/, "?").replace(/&&/, "&").replace(/&$/, "");
      return result;
    },
    getData: function() { // returns tracking data stored in the session storage.
      var tdSaved = eCG.getCookie();
      if (!tdSaved) {
        tdSaved = "";
      }
      return tdSaved;
    },
    serialize: function(obj) { // serializes object into GET querystring.
      var str = [];
      var flattenArray = function(source, key, target) {
        for (var i in source) {
          if (source.hasOwnProperty(i)) {
            target.push([encodeURIComponent(key), encodeURIComponent(source[i])]);
          }
        }
      };
      for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
          if (Array.isArray(obj[p])) {
            flattenArray(obj[p], p, str);
          } else if (obj[p] !== null) {
            str.push([encodeURIComponent(p), encodeURIComponent(obj[p])]);
          }
        }
      }
      for (var key in str) {
        if (str.hasOwnProperty(key)) {
          str[key] = str[key].join("=");
        }
      }
      return str.join("&");
    },
    send: function(obj) { // sends object via <script src=....> request.
      var n = d.getElementsByTagName("script")[0];
      var s = d.createElement("script");
      var f = function() {
        n.parentNode.insertBefore(s, n);
      };
      s.type = "text/javascript";
      s.async = true;
      s.src = BASE_URL + "?v=" + Math.random() + "&" + eCG.serialize(obj);
      if (DEBUG) {
        w.console.log("send:", obj);
        w.console.log("serialized:", eCG.serialize(obj));
        return;
      }
      if (w.opera && w.opera.toString() === "[object Opera]") {
        d.addEventListener("DOMContentLoaded", f, false);
      } else {
        f();
      }
    },
    track: function(events, sendFootprint) { // MAIN! Stores tracking data and sends it back.
      if (!events) { events = []; }
      var td = eCG.getParam();
      var tdSaved = eCG.getData();
      if (DEBUG && tdSaved === "" && w.admarkt && w.admarkt.sample) { // for testing purposes
        tdSaved = w.admarkt.sample;
      }
      if (td !== "") { // landing with new tracking data
        w.history.replaceState(PARAM + "_landing", d.title, eCG.reduceParam());
        eCG.setCookie(td);
        eCG.setFootprint(td);
        tdSaved = td;
        events.push(EVENTS.landing);
      }
      var upperCaseEvents = function(events, prefix) {
        for (var i in events) {
          if (events.hasOwnProperty(i)) {
            events[i] = (prefix ? prefix : "") + events[i].toUpperCase();
          }
        }
        return events;
      };
      if (events.length > 0) { // have to send events
        events = upperCaseEvents(events);
        if (tdSaved !== "") { // within session
          eCG.send({ td: tdSaved, events: events });
        } else if (sendFootprint && eCG.hasFootprint()) { // 30d footprint for assisted events
          events = upperCaseEvents(events, EVENTS.footprintPrefix);
          eCG.send({ td: eCG.getFootprint()[0], events: events });
        }
      }
    }
  };
  var t = function() {
    if (w.admarkt) {
      w.admarkt.track = function(events) {
        if (!Array.isArray(events)) {
          events = [events];
        }
        return eCG.track(events);
      };
      eCG.track(w.admarkt.events, w.admarkt.footprint);
    } else {
      eCG.track();
    }
  };
  if (DEBUG) { t(); } else { try { t(); } catch (e) { return; } }
}());
