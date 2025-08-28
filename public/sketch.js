// p5 sketch that sends a frame to your Vercel function and draws returned boxes

let capture;
let results = [];
let autoMode = false;
let lastRun = 0;
const INTERVAL_MS = 1000; // 1 fps when auto mode is on

function setup() {
  // Smaller canvas keeps payloads light; adjust as needed
  createCanvas(480, 360);

  // Rear camera if available
  capture = createCapture({
    video: { facingMode: { ideal: "environment" }, width: { ideal: 480 }, height: { ideal: 360 } },
    audio: false
  });
  capture.size(480, 360);
  capture.hide();

  // Wire buttons
  const scanBtn = document.getElementById("scan");
  scanBtn.addEventListener("click", detectOnce);

  const autoBtn = document.getElementById("auto");
  autoBtn.addEventListener("click", () => {
    autoMode = !autoMode;
    autoBtn.textContent = `Auto: ${autoMode ? "On" : "Off"}`;
  });

  // iOS requires a user gesture before camera plays reliably
  userStartVideo();
}

function draw() {
  background(0);
  image(capture, 0, 0, width, height);

  // auto polling
  if (autoMode && millis() - lastRun > INTERVAL_MS) {
    detectOnce();
  }

  // draw boxes
  noFill();
  stroke(0, 255, 0);
  strokeWeight(2);
  textSize(12);

  for (const p of results) {
    // Roboflow typically returns center-based x,y with width,height
    const x = p.x - p.width / 2;
    const y = p.y - p.height / 2;
    rect(x, y, p.width, p.height);

    const label = `${p.class ?? p.label ?? "obj"} ${(p.confidence * 100 | 0)}%`;
    noStroke(); fill(0, 170);
    rect(x, y - 16, textWidth(label) + 10, 14, 4);
    fill(255); text(label, x + 5, y - 4);
    stroke(0, 255, 0);
  }
}

async function detectOnce() {
  lastRun = millis();
  setMsg("Scanning…");

  try {
    // Grab a frame into a temporary canvas
    const tmp = document.createElement("canvas");
    tmp.width = capture.width;
    tmp.height = capture.height;
    const ctx = tmp.getContext("2d");
    ctx.drawImage(capture.elt, 0, 0);

    // Downscale/quality helps stay under Vercel body limit (~4.5MB)
    const base64 = tmp.toDataURL("image/jpeg", 0.6);

    // Same-origin call to your Vercel function
    const resp = await fetch("/api/infer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: { type: "base64", value: base64 } })
    });

    const data = await resp.json();

    // Adjust this mapping if your Workflow JSON differs
    // Common shapes:
    // - data.outputs[0].predictions -> [{x,y,width,height,class,confidence}, ...]
    // - or data.predictions directly
    const preds =
      (data.outputs && data.outputs[0] && data.outputs[0].predictions) ||
      data.predictions ||
      [];

    results = Array.isArray(preds) ? preds : [];
    setMsg(`Found ${results.length} object(s)`);
  } catch (err) {
    console.error(err);
    setMsg("Error: see console");
  }
}

function setMsg(t) {
  document.getElementById("msg").textContent = t;
}
