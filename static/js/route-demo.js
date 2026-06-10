/* Interactive routing demo for the Navigator case study.
 *
 * Backend: public FOSSGIS Valhalla server (https://valhalla1.openstreetmap.de),
 * which is the same routing engine used in the real project. Blocked areas are
 * sent as Valhalla `exclude_polygons`; the engine reroutes around them.
 *
 * No build step, no API key — pure browser JS on top of Leaflet.
 */
(function () {
  "use strict";

  var VALHALLA = "https://valhalla1.openstreetmap.de/route";
  var COSTING = "auto"; // faster on the public Valhalla server than "truck"
  var BLOCK_HALF_M = 70; // half edge length of a blocked square, in metres

  // Fetch JSON with an 8s timeout and up to 3 attempts on transient failures.
  // The public Valhalla server occasionally returns 502; those gateway errors
  // carry no CORS headers, so the browser surfaces them as network errors.
  function fetchRouteJSON(url, attempt) {
    attempt = attempt || 1;
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 8000);
    return fetch(url, { signal: controller.signal })
      .then(function (res) {
        clearTimeout(timer);
        if (res.status === 400) { var e = new Error("noroute"); e.code = 400; throw e; }
        if (!res.ok) { var t = new Error("server " + res.status); t.transient = true; throw t; }
        return res.json();
      })
      .catch(function (err) {
        clearTimeout(timer);
        var transient = err.transient || err.name === "AbortError" || err instanceof TypeError;
        if (transient && attempt < 3) {
          return new Promise(function (r) { setTimeout(r, 600 * attempt); })
            .then(function () { return fetchRouteJSON(url, attempt + 1); });
        }
        throw err;
      });
  }

  function init(root) {
    if (root.dataset.rdInit) return;
    root.dataset.rdInit = "1";

    var mapEl = root.querySelector("[data-map]");
    var summaryEl = root.querySelector("[data-summary]");
    var routeBtn = root.querySelector('[data-action="route"]');
    var blockBtn = root.querySelector('[data-action="block"]');
    var clearBtn = root.querySelector('[data-action="clear"]');

    // Default start/destination around Berlin (~4 km apart).
    var startLL = [52.5163, 13.3777]; // Brandenburg Gate
    var endLL = [52.4881, 13.4256]; // Tempelhofer Feld

    var map = L.map(mapEl, { zoomControl: true, scrollWheelZoom: false }).setView(
      [52.503, 13.4],
      13
    );

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a> · routing <a href="https://valhalla.openstreetmap.de">Valhalla / FOSSGIS</a>',
      }
    ).addTo(map);

    function pin(color) {
      return L.divIcon({
        className: "rd-pin",
        html: '<span style="--c:' + color + '"></span>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
    }

    var startMarker = L.marker(startLL, {
      icon: pin("#5fb36a"),
      draggable: true,
    }).addTo(map);
    var endMarker = L.marker(endLL, {
      icon: pin("#d4795f"),
      draggable: true,
    }).addTo(map);

    var routeLine = null;
    var blocks = []; // { layer, ring: [[lon,lat], ...] }
    var blocking = false;

    startMarker.on("dragend", calcRoute);
    endMarker.on("dragend", calcRoute);

    // --- blocking ---------------------------------------------------------
    function blockRing(lat, lng, half) {
      var dLat = half / 111320;
      var dLng = half / (111320 * Math.cos((lat * Math.PI) / 180));
      // Valhalla expects [lon, lat] pairs, ring closed.
      return [
        [lng - dLng, lat - dLat],
        [lng + dLng, lat - dLat],
        [lng + dLng, lat + dLat],
        [lng - dLng, lat + dLat],
        [lng - dLng, lat - dLat],
      ];
    }

    map.on("click", function (e) {
      if (!blocking) return;
      var ring = blockRing(e.latlng.lat, e.latlng.lng, BLOCK_HALF_M);
      var latlngs = ring.map(function (p) {
        return [p[1], p[0]];
      });
      var layer = L.polygon(latlngs, {
        color: "#d4795f",
        weight: 1,
        fillColor: "#d4795f",
        fillOpacity: 0.35,
      }).addTo(map);
      blocks.push({ layer: layer, ring: ring });
      calcRoute();
    });

    function setBlocking(on) {
      blocking = on;
      blockBtn.classList.toggle("is-active", on);
      blockBtn.textContent = on ? "Blocking… (click map)" : "Block streets";
      mapEl.classList.toggle("is-blocking", on);
      map.dragging[on ? "disable" : "enable"]();
    }

    blockBtn.addEventListener("click", function () {
      setBlocking(!blocking);
    });

    clearBtn.addEventListener("click", function () {
      blocks.forEach(function (b) {
        map.removeLayer(b.layer);
      });
      blocks = [];
      calcRoute();
    });

    routeBtn.addEventListener("click", calcRoute);

    // --- routing ----------------------------------------------------------
    function setSummary(html) {
      summaryEl.innerHTML = html;
    }

    var routing = false;
    var pendingRoute = false;

    function calcRoute() {
      // Coalesce rapid calls: keep one request in flight, run once more after.
      if (routing) { pendingRoute = true; return; }
      routing = true;

      var s = startMarker.getLatLng();
      var d = endMarker.getLatLng();
      var body = {
        locations: [
          { lat: s.lat, lon: s.lng },
          { lat: d.lat, lon: d.lng },
        ],
        costing: COSTING,
        directions_options: { units: "kilometers" },
      };
      if (blocks.length) {
        body.exclude_polygons = blocks.map(function (b) {
          return b.ring;
        });
      }

      routeBtn.disabled = true;
      setSummary("routing…");

      fetchRouteJSON(VALHALLA + "?json=" + encodeURIComponent(JSON.stringify(body)))
        .then(function (data) {
          var leg = data && data.trip && data.trip.legs && data.trip.legs[0];
          if (!leg) { var e = new Error("noroute"); e.code = 400; throw e; }
          drawRoute(decodePolyline(leg.shape, 6));
          var sum = data.trip.summary;
          setSummary(
            "<b>" +
              sum.length.toFixed(1) +
              " km</b> · " +
              Math.round(sum.time / 60) +
              " min" +
              (blocks.length
                ? " · " + blocks.length + " blocked"
                : "")
          );
        })
        .catch(function (err) {
          setSummary(
            err && err.code === 400
              ? "no route found — try fewer blocks"
              : "routing server busy — try again"
          );
        })
        .finally(function () {
          routeBtn.disabled = false;
          routing = false;
          if (pendingRoute) {
            pendingRoute = false;
            calcRoute();
          }
        });
    }

    var fitted = false;
    function drawRoute(latlngs) {
      if (routeLine) map.removeLayer(routeLine);
      routeLine = L.polyline(latlngs, {
        color: "#bcd0f0",
        weight: 4,
        opacity: 0.9,
      }).addTo(map);
      if (!fitted) {
        map.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
        fitted = true;
      }
    }

    // Valhalla encodes shapes as polyline6.
    function decodePolyline(str, precision) {
      var index = 0,
        lat = 0,
        lng = 0,
        coordinates = [],
        shift,
        result,
        byte,
        factor = Math.pow(10, precision || 6);
      while (index < str.length) {
        shift = 0;
        result = 0;
        do {
          byte = str.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);
        lat += result & 1 ? ~(result >> 1) : result >> 1;
        shift = 0;
        result = 0;
        do {
          byte = str.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);
        lng += result & 1 ? ~(result >> 1) : result >> 1;
        coordinates.push([lat / factor, lng / factor]);
      }
      return coordinates;
    }

    calcRoute(); // initial route on load
  }

  function boot() {
    document.querySelectorAll("[data-route-demo]").forEach(init);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
