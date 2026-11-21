// Race 2 Race - Web phone test: TAP TO START overlay + tilt steering for iPhone Safari (and Android Chrome).
// iOS only gives motion data after DeviceMotionEvent.requestPermission(), and only from inside a tap, so the game
// sits under a "TAP TO START" button; the tap asks for permission, starts listening, unlocks the sound, and the
// way the phone is held at that moment becomes "straight ahead". main.gd reads window.r2rTilt() every frame
// (degrees the phone is turned round the screen's axis; positive = turned clockwise = steer right; 999 = no data)
// and calls window.r2rCalibrate() again at CONTINUE. ?tiltinvert=1 in the address swaps left and right.
// Block 3 menus (Nov 16 2026): the overlay is built HIDDEN. The game shows it when it wants the tap: the menu at its
// TAP TO START step (after the intro), main.gd when a race is opened directly. window.r2rShowStart() shows it.
// Section 57 (Nov 21 2026): window.r2rShowStart("title") = the menus' TITLE SCENE is behind it: the overlay is then
// see-through and the whole page is the button (the game draws its own pulsing TAP TO START; only the one-line
// motion hint is shown, at the very bottom). The tap still happens on the page, as iPhones need for the tilt sensor.
(function () {
  var wantStart = false;
  var wantLook = "";
  window.r2rShowStart = function (look) {
    wantStart = true;
    wantLook = look === "title" ? "title" : "";
    var o = document.getElementById("r2r-start");
    if (o) o.className = wantLook;
    if (o && !window.r2rStarted) o.style.display = "flex";
  };
  // Nov 17 2026 (the kart "veered right" on the iPhone): fx/fy = the sensor with the hands' shake taken out (about
  // 0.05 s), it steers; sx/sy = how the phone has been held over the last half second, "straight ahead" is taken from it.
  var s = { on: false, gx: 0, gy: 0, nx: 0, ny: -1, have: false, fx: 0, fy: 0, sx: 0, sy: 0, t: 0 };
  var invert = /[?&]tiltinvert=1/.test(location.search) ? -1 : 1;

  function onMotion(e) {
    var g = e.accelerationIncludingGravity;
    if (!g || g.x === null || g.y === null) return;
    var now = (window.performance && performance.now) ? performance.now() : Date.now();
    var dt = Math.min(Math.max((now - s.t) / 1000, 0), 0.1);
    s.t = now;
    if (!s.have) { s.fx = s.sx = g.x; s.fy = s.sy = g.y; }
    else {
      var a = 1 - Math.exp(-dt / 0.05), b = 1 - Math.exp(-dt / 0.5);
      s.fx += (g.x - s.fx) * a; s.fy += (g.y - s.fy) * a;
      s.sx += (g.x - s.sx) * b; s.sy += (g.y - s.sy) * b;
    }
    s.gx = g.x; s.gy = g.y; s.have = true;
  }
  window.r2rCalibrate = function () {
    var m = Math.hypot(s.sx, s.sy);
    if (s.have && m > 2) { s.nx = s.sx / m; s.ny = s.sy / m; s.on = true; }
  };
  window.r2rTilt = function () {
    if (!s.on) return 999;
    var m = Math.hypot(s.fx, s.fy);
    if (m < 2) return 0;                      // lying flat: no steering
    var cx = s.fx / m, cy = s.fy / m;
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
      "#r2r-start.title{background:transparent;justify-content:flex-end;padding:0}" +
      "#r2r-start.title>div{display:none}" +
      "#r2r-start.title button{position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0;border-radius:0;" +
      "background:transparent;box-shadow:none;color:transparent;outline:none;-webkit-tap-highlight-color:transparent}" +
      "#r2r-start.title small{position:relative;pointer-events:none;font-size:11px;opacity:.75;max-width:none;margin:0 0 2px;" +
      "text-shadow:0 1px 2px #2a1450}" +
      "#r2r-start.title small .long{display:none}" +
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
      "<small><span class='long'>Hold the phone sideways like a steering wheel, then tap.<br>Turn it to steer. </span>" +
      "Your phone will ask to use motion: tap Allow.<span class='long'><br>BRAKE and BOOST are on screen.</span></small>";
    ov.className = wantLook;
    ov.style.display = wantStart ? "flex" : "none";
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
