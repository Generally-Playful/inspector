// --- Globals ---
let capture; // p5.Video capture object
let started = false; // True when camera is running
let results = []; // Array of detection results
let overlayImg = null; // Output image from API
let autoMode = false; // Auto-detect mode
let lastRun = 0; // Last detection timestamp
const INTERVAL_MS = 1000; // 1 fps when auto mode is on

let canvasAspect = 4 / 3; // Default aspect ratio
let deviceAspect = window.innerWidth / window.innerHeight;
let baseWidth = 480;
let baseHeight = 640;

let scannedFrame = null;


// Flow Control
// --- App States ---
const STATE = {
  IDLE: "idle",           // Waiting for camera/user
  CAPTURING: "capturing", // Capturing video frame
  PROCESSING: "processing", // Sending frame, waiting for API
  REVIEW: "review"        // Showing results
};

let appState;


// --- p5 Setup ---


function setup() {
  updateDeviceAspect();
  setupCamera();
  setupUI();
  appState = STATE.IDLE;
}


// --- Main Draw Loop ---
function draw() {

  if (!started) return;
  background(0);

  
  switch (appState) {
    case STATE.IDLE:
      drawIdle();
      break;
    case STATE.CAPTURING:
      drawCapturing();
      break;
    case STATE.PROCESSING:
      drawProcessing();
      break;
    case STATE.REVIEW:
      drawReview();
      break;
  }
  
  /* 
  if (autoMode && millis() - lastRun > INTERVAL_MS) {
    onScan();
  }
  */

}

// --- Canvas Setup ---


function setupCanvas() {
  createCanvas(baseWidth, baseHeight);
  canvasAspect = baseWidth / baseHeight;
}


// --- UI Setup ---
function setupUI() {
  const scanBtn = document.getElementById("scan");
  scanBtn.addEventListener("click", onScan);

  const autoBtn = document.getElementById("auto");
  autoBtn.addEventListener("click", toggleAutoMode);

  const cameraBtn = document.getElementById('cameraBtn');
  cameraBtn.addEventListener('click', switchToCamera);
}

function switchToCamera(){
    appState = STATE.CAPTURING;
}


// --- Detect Once (API Call) ---
async function onScan() {
  lastRun = millis();
  setMsg("Scanning…");
  try {
    const base64 = getCurrentFrameBase64();
    
    saveCurrentFrame();
    appState = STATE.PROCESSING;
    
    const data = await fetchApiInfer(base64);
    parseApiResponse(data);
    setMsg(`Found ${results.length} object(s)`);
    appState = STATE.REVIEW;

  } catch (err) {
    console.error(err);
    setMsg("Error: see console");
    appState = STATE.IDLE;
  }

}

// --- Get Current Frame as Base64 ---
function getCurrentFrameBase64() {
  const tmpCanvas = document.createElement("canvas");
 tmpCanvas.width = capture.width;
 tmpCanvas.height = capture.height;

  const ctx = tmpCanvas.getContext("2d");
  ctx.drawImage(capture.elt, 0, 0);
    
  return tmpCanvas.toDataURL("image/jpeg", 0.6);
}

// --- Fetch API Infer ---
async function fetchApiInfer(base64) {
  const resp = await fetch("/api/infer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: { type: "base64", value: base64 } })
  });
  const text = await resp.text();
  console.log('Raw API response:', text);
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('Failed to parse API response as JSON: ' + e);
  }
  return data;
}

// --- Parse API Response ---
function parseApiResponse(data) {
  let predictions = [];
  overlayImg = null;
  if (data && Array.isArray(data.outputs) && data.outputs.length > 0) {
    const output = data.outputs[0];
    if (output && output.predictions && Array.isArray(output.predictions.predictions)) {
      predictions = output.predictions.predictions;
    }
    if (output && output.output_image && output.output_image.value) {
      const base64 = output.output_image.value;
      overlayImg = loadImage(
        'data:image/jpeg;base64,' + base64,
        () => console.log('Overlay image loaded'),
        (err) => console.error('Failed to load overlay image', err)
      );
    }
  }
  results = Array.isArray(predictions) ? predictions : [];
}

// --- Toggle Auto Mode ---
function toggleAutoMode() {
  autoMode = !autoMode;
  const autoBtn = document.getElementById("auto");
  autoBtn.textContent = `Auto: ${autoMode ? "On" : "Off"}`;
}

// --- Set Status Message ---
function setMsg(t) {
  document.getElementById("msg").textContent = t;
}

// --- Window Resize Handler ---


function windowResized() {
  updateDeviceAspect();
  setupCamera();
}

// --- Update Device Aspect ---
function updateDeviceAspect() {
  deviceAspect = window.innerWidth / window.innerHeight;
}

// --- Save current frame as p5.Image for review ---
function saveCurrentFrame() {
  // Create a p5.Image from the current video frame
  scannedFrame = createImage(capture.width, capture.height);
  scannedFrame.copy(capture, 0, 0, capture.width, capture.height, 0, 0, capture.width, capture.height);
}
