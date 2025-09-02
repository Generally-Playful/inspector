

// --- Draw States ---

function drawIdle() 
{ 
}

function drawCapturing() 
{
  drawLiveCamera();
}

function drawProcessing() 
{
  // Optionally, add processing animation or indication
  drawScannedFrame();
    
  noFill();
  stroke(255);
  strokeWeight(2);

  circle(width/2, height/2, 100);

}

function drawReview() 
{
  // Optionally, add review animation or indication
  drawScannedFrame();
  drawBoundingBoxes();

  image(overlayImg, 0, 0, width, height);
}


//////////////
//////////////


// --- Draw Live Camera (for capturing state) ---
function drawLiveCamera() {

  // Canvas and video dimensions
  let cw = width;
  let ch = height;
  let vw = capture.width;
  let vh = capture.height;

  // Calculate scale to cover canvas
  let scale = Math.max(cw / vw, ch / vh);

  // Calculate the size and position to draw the video
  let drawW = vw * scale;
  let drawH = vh * scale;
  let offsetX = (cw - drawW) / 2;
  let offsetY = (ch - drawH) / 2;

  image(capture, offsetX, offsetY, drawW, drawH);
}

// --- Draw Detection Boxes ---
function drawBoundingBoxes() {
  if (!results || results.length === 0) return;
  noFill();
  stroke(0, 255, 0);
  strokeWeight(2);
  textSize(12);
  for (const p of results) {

    console.log("P:");
    console.log(p); 
    
    drawBoundingBox(p);
    drawBoxLabel(p);
  }
}

// --- Draw Review State ---
function drawScannedFrame() {
  if (scannedFrame) {

    console.log('Scanned frame drawn:', width, height);
    image(scannedFrame, 0, 0, width, height);
  }
}

function getScreenDim() {
    let sx, sy, sw, sh;
    let camAspect = capture.width / capture.height;

    if (camAspect > canvasAspect) {
        sh = capture.height;
        sw = sh * canvasAspect;
        sx = (capture.width - sw) / 2;
        sy = 0;
    } else {
        sw = capture.width;
        sh = sw / canvasAspect;
        sx = 0;
        sy = (capture.height - sh) / 2;
    }
    return { sx, sy, sw, sh };
}

// --- Draw a Single Bounding Box ---
function drawBoundingBox(p) {
  const x = p.x - p.width / 2;
  const y = p.y - p.height / 2;
  rect(x, y, p.width, p.height);
}

// --- Draw Label for a Box ---
function drawBoxLabel(p) {
  const x = p.x - p.width / 2;
  const y = p.y - p.height / 2;
  const label = `${p.class ?? p.label ?? "obj"} ${(p.confidence * 100 | 0)}%`;
  noStroke(); fill(0, 170);
  rect(x, y - 16, textWidth(label) + 10, 14, 4);
  fill(255); text(label, x + 5, y - 4);
  stroke(0, 255, 0);
}