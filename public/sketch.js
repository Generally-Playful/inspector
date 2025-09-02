// --- Globals ---
let canvas;
let capture; // p5.Video capture object
let started = false; // True when camera is running
let results = []; // Array of detection results
let overlayImg = null; // Output image from API
let autoMode = false; // Auto-detect mode
let lastRun = 0; // Last detection timestamp
const INTERVAL_MS = 1000; // 1 fps when auto mode is on
const CV_IMG_SIZE = 512;



let deviceAspect = window.innerWidth / window.innerHeight;


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
  setupCanvas();
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
  canvas = createCanvas(window.innerWidth, window.innerHeight);
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
    console.log('Switching to camera mode');
    appState = STATE.CAPTURING;
}


// --- Detect Once (API Call) ---
async function onScan() {
  lastRun = millis();
  setMsg("Scanning…");
  saveCurrentFrame();
    console.log('Current frame saved for review');
  appState = STATE.PROCESSING;
    console.log("Appstate: Processing")

  try {
    const base64 = getCurrentFrameBase64();
    
    
    const data = await fetchApiInfer(base64);
    parseApiResponse(data);
    setMsg(`Found ${results.length} object(s)`);
    appState = STATE.REVIEW;
    console.log("Appstate: Review") 

  } catch (err) {
    console.error(err);
    setMsg("Error: see console");
    appState = STATE.IDLE;
  }

}

// --- Get Current Frame as Base64 ---
function getCurrentFrameBase64() {
  // Calculate the square box region
  const squareCanvasSize = Math.min(width, height);
  const squareCanvasX = (width - squareCanvasSize) / 2;
  const squareCanvasY = (height - squareCanvasSize) / 2;

  // Always output a CV_IMG_SIZE image
  const outSize = CV_IMG_SIZE;
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = outSize;
  tmpCanvas.height = outSize;

  const ctx = tmpCanvas.getContext("2d");
  ctx.drawImage(
    canvas.elt,
    squareCanvasX, squareCanvasY, squareCanvasSize, squareCanvasSize, // src
    0, 0, outSize, outSize // dest
  );

  return tmpCanvas.toDataURL("image/jpeg", 0.8);
}
// function getCurrentFrameBase64() {
//   // Shrink the image by a factor of DOWNSIZE
//   const outW = Math.floor(capture.width / DOWNSIZE);
//   const outH = Math.floor(capture.height / DOWNSIZE);
//   const tmpCanvas = document.createElement("canvas");
//   tmpCanvas.width = outW;
//   tmpCanvas.height = outH;

//   const ctx = tmpCanvas.getContext("2d");
//   ctx.drawImage(capture.elt, 0, 0, capture.width, capture.height, 0, 0, outW, outH);
  
//   return tmpCanvas.toDataURL("image/jpeg", 0.8);
// }

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
    
  buffer = createGraphics(width, height);
  buffer.copy(
      canvas,
      0, 0, width, height,
      0, 0, buffer.width, buffer.height);
  // Create a p5.Image from the current video frame
  scannedFrame = createImage(width, height);
  scannedFrame.copy(buffer, 0, 0, buffer.width, buffer.height, 0, 0, width, height);
//   scannedFrame.copy(can, 0, 0, width, capture.height, 0, 0, capture.width, capture.height);
}
