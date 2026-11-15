// Race 2 Race - Web phone test: TAP TO START overlay + tilt steering for iPhone Safari (and Android Chrome).
// iOS only gives motion data after DeviceMotionEvent.requestPermission(), and only from inside a tap, so the game
// sits under a "TAP TO START" button; the tap asks for permission, starts listening, unlocks the sound, and the
// way the phone is held at that moment becomes "straight ahead". main.gd reads window.r2rTilt() every frame
// (degrees the phone is turned round the screen's axis; positive = turned clockwise = steer right; 999 = no data)
// and calls window.r2rCalibrate() again at CONTINUE. ?tiltinvert=1 in the address swaps left and right.
(function () {
  var s = { on: false, gx: 0, gy: 0, nx: 0, ny: -1, have: false };
  var invert = /[?&]tiltinvert=1/.test(location.search) ? -1 : 1;

  function onMotion(e) {
    var g = e.accelerationIncludingGravity;
    if (!g || g.x === null || g.y === null) return;
    s.gx = g.x; s.gy = g.y; s.have = true;
  }
  window.r2rCalibrate = function () {
    var m = Math.hypot(s.gx, s.gy);
    if (s.have && m > 2) { s.nx = s.gx / m; s.ny = s.gy / m; s.on = true; }
  };
  window.r2rTilt = function () {
    if (!s.on) return 999;
    var m = Math.hypot(s.gx, s.gy);
    if (m < 2) return 0;                      // lying flat: no steering
    var cx = s.gx / m, cy = s.gy / m;
    return invert * Math.atan2(s.nx * cy - s.ny * cx, s.nx * cx + s.ny * cy) * 180 / Math.PI;
  };

  function build() {
    var css = document.createElement("style");
    css.textContent =
      "#r2r-start{position:fixed;inset:0;z-index:1000;display:flex;flex-direction:column;align-items:center;justify-content:center;" +
      "background:rgba(40,20,70,.82);color:#fff;font:700 22px -apple-system,system-ui,sans-serif;text-align:center;padding:24px}" +
      "#r2r-start button{font:800 30px -apple-system,system-ui,sans-serif;padding:22px 40px;border:0;border-radius:22px;" +
      "background:#ffd23f;color:#3a1d6e;margin:18px 0;box-shadow:0 6px 0 #c79b00}" +
      "#r2r-start small{font-weight:500;opacity:.85;max-width:520px;line-height:1.35}" +
      "#r2r-rotate{display:none;position:fixed;inset:0;z-index:1001;background:#2a1450;color:#fff;align-items:center;" +
      "justify-content:center;text-align:center;font:700 24px -apple-system,system-ui,sans-serif;padding:30px}" +
      "@media (orientation:portrait){#r2r-rotate{display:flex}}";
    document.head.appendChild(css);
    var rot = document.createElement("div");
    rot.id = "r2r-rotate";
    rot.innerHTML = "Turn your phone sideways<br>to race 📱↻";
    document.body.appendChild(rot);
    var ov = document.createElement("div");
    ov.id = "r2r-start";
    ov.innerHTML = "<div>RACE 2 RACE</div><button id='r2r-go'>TAP TO START</button>" +
      "<small>Hold the phone sideways like a steering wheel, then tap.<br>Turn it to steer. " +
      "Your phone will ask to use motion: tap Allow.<br>BRAKE and BOOST are on screen.</small>";
    document.body.appendChild(ov);
    document.getElementById("r2r-go").addEventListener("click", function () {
      var start = function () {
        window.addEventListener("devicemotion", onMotion);
        ov.style.display = "none";
        window.r2rStarted = true;          // the game (paused under the overlay) starts its intro now
        setTimeout(window.r2rCalibrate, 400);
        setTimeout(window.r2rCalibrate, 1200);   // (again, in case the first reading came late)
        var c = document.querySelector("canvas"); if (c) c.focus();
      };
      if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
        DeviceMotionEvent.requestPermission().then(start, start);   // iPhone: must be asked inside the tap
      } else {
        start();
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
})();
