// p5 sketch that sends a frame to your Vercel function and draws returned boxes

let capture;
let started = false;
let results = [];
let overlayImg = null; // Will hold the output image from the API
let autoMode = false;
let lastRun = 0;
const INTERVAL_MS = 1000; // 1 fps when auto mode is on
let canvasAspect = 4 / 3; // Default aspect ratio
let deviceAspect = window.innerWidth / window.innerHeight;

function setup() {
  // Calculate device aspect ratio
  deviceAspect = window.innerWidth / window.innerHeight;
  // Choose a base width (downscaled for performance)
  let baseWidth = 480;
  let baseHeight = Math.round(baseWidth / deviceAspect);
  createCanvas(baseWidth, baseHeight);
  canvasAspect = baseWidth / baseHeight;

  // Rear camera if available
  capture = createCapture({
    video: { facingMode: { ideal: "environment" }, width: { ideal: 480 }, height: { ideal: 360 } },
    audio: false
  }, () =>{
    started = true;
    loop();
  }
);

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
//   userStartVideo();


  document.getElementById('startBtn').style.display = 'none';
}

function draw() {
    if(!started) return
  background(0);

  // Draw camera and overlays with correct aspect
  // Calculate the largest centered crop from capture to fit canvas aspect
  let camAspect = capture.width / capture.height;
  let drawW, drawH, sx, sy, sw, sh;
  if (camAspect > canvasAspect) {
    // Camera is wider than canvas: crop width
    sh = capture.height;
    sw = sh * canvasAspect;
    sx = (capture.width - sw) / 2;
    sy = 0;
  } else {
    // Camera is taller than canvas: crop height
    sw = capture.width;
    sh = sw / canvasAspect;
    sx = 0;
    sy = (capture.height - sh) / 2;
  }
  // Draw camera crop to fit canvas
  image(capture, 0, 0, width, height, sx, sy, sw, sh);
  // Draw overlay image if available, matching the same crop
  if (overlayImg) {
    image(overlayImg, 0, 0, width, height, sx, sy, sw, sh);
  }

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

    const text = await resp.text();
        // Debug: log the raw API response
        console.log('Raw API response:', text);
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse API response as JSON:', e);
          setMsg('Error: Invalid API response');
          return;
        }
    
        // Parse predictions and output image from new Roboflow API response structure
        let predictions = [];
        overlayImg = null;
        if (data && Array.isArray(data.outputs) && data.outputs.length > 0) {
          const output = data.outputs[0];
          if (output && output.predictions && Array.isArray(output.predictions.predictions)) {
            predictions = output.predictions.predictions;
          }
          // If output_image is present, create a p5.Image from base64
          if (output && output.output_image && output.output_image.value) {
            const base64 = output.output_image.value;
            // p5.js can load base64 images using loadImage with a data URL
            overlayImg = loadImage(
              'data:image/jpeg;base64,' + base64,
              () => console.log('Overlay image loaded'),
              (err) => console.error('Failed to load overlay image', err)
            );
          }
        }
        results = Array.isArray(predictions) ? predictions : [];
        setMsg(`Found ${results.length} object(s)`);
  } catch (err) {
    console.error(err);
    setMsg("Error: see console");
  }
}

function setMsg(t) {
  document.getElementById("msg").textContent = t;
}

function windowResized() {
  // Recalculate aspect and resize canvas
  deviceAspect = window.innerWidth / window.innerHeight;
  let baseWidth = 480;
  let baseHeight = Math.round(baseWidth / deviceAspect);
  resizeCanvas(baseWidth, baseHeight);
  canvasAspect = baseWidth / baseHeight;
}
