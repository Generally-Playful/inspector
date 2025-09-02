

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

  // Draw overlay image (from API) into the same square region
  // if (overlayImg) {
  //   let squareCanvasSize = Math.min(width, height);
  //   let squareCanvasX = (width - squareCanvasSize) / 2;
  //   let squareCanvasY = (height - squareCanvasSize) / 2;
  //   image(overlayImg, 
  //     squareCanvasX, squareCanvasY, 
  //     squareCanvasSize, squareCanvasSize);
  // }
  
  drawBoundingBoxes();
}


//////////////
//////////////


// --- Draw Live Camera (for capturing state) ---
function drawLiveCamera() {
  let boxSize = Math.min(width, height);
  let boxCornerX = (width - boxSize) / 2;
  let boxCornerY = (height - boxSize) / 2;

// Draw the video, center-cropped to a square region
image(
  capture,
  boxCornerX, boxCornerY, boxSize, boxSize, // destination rectangle (on canvas)
  0, 0, capture.width, capture.height, // source rectangle (full video)
  COVER, CENTER, CENTER // fit mode and alignment
);

  // Draw Decor
  noFill();
  stroke(255);
  strokeWeight(2);
  rect(boxCornerX, boxCornerY, boxSize);

}

// --- Draw Detection Boxes ---
function drawBoundingBoxes() {
  if (!results || results.length === 0) return;
  
  for (const p of results) {

    if(p.confidence <= 0.85){
      console.log("Low confidence:", p.confidence);
      continue;
    }

    // console.log("P:");
    // console.log(p); 

    drawBoundingBox(p);
    drawBoxLabel(p);
  }
}

// --- Draw Review State ---
function drawScannedFrame() {
  // if (scannedFrame) {
  //   // Draw the 512x512 scanned frame into the same square region as the live camera
  //   let squareCanvasSize = Math.min(width, height);
  //   let squareCanvasX = (width - squareCanvasSize) / 2;
  //   let squareCanvasY = (height - squareCanvasSize) / 2;

  //   image(scannedFrame, 
  //     squareCanvasX, squareCanvasY, 
  //     squareCanvasSize, squareCanvasSize,
  //     COVER, CENTER, CENTER);
  // }

  if (scannedFrame) {
    let squareCanvasSize = Math.min(width, height);
    let squareCanvasX = (width - squareCanvasSize) / 2;
    let squareCanvasY = (height - squareCanvasSize) / 2;
    
    image(scannedFrame, 
      squareCanvasX, squareCanvasY, 
      squareCanvasSize, squareCanvasSize);
  }
}

// --- Draw a Single Bounding Box ---
function drawBoundingBox(p) {

  noFill();
  strokeWeight(4);
  stroke(255, 0, 0);
  // Assume p.x, p.y, p.width, p.height are relative to 512x512 image
  // Scale to the square region on the canvas
  let squareCanvasSize = Math.min(width, height);
  let squareCanvasX = (width - squareCanvasSize) / 2;
  let squareCanvasY = (height - squareCanvasSize) / 2;

  rect(squareCanvasX, squareCanvasY, squareCanvasSize, squareCanvasSize);

  strokeWeight(2);
  stroke(0, 255, 0);
  
  const scale = squareCanvasSize / CV_IMG_SIZE;
  const x = squareCanvasX + (p.x - p.width / 2) * scale;
  const y = squareCanvasY + (p.y - p.height / 2) * scale;
  rect(x, y, p.width * scale, p.height * scale);
}

// --- Draw Label for a Box ---
function drawBoxLabel(p) {
  
  textSize(12);
  // Assume p.x, p.y, p.width, p.height are relative to 512x512 image
  // Scale to the square region on the canvas
  let squareCanvasSize = Math.min(width, height);
  let squareCanvasX = (width - squareCanvasSize) / 2;
  let squareCanvasY = (height - squareCanvasSize) / 2;


  const scale = squareCanvasSize / CV_IMG_SIZE;
  const x = squareCanvasX + (p.x - p.width / 2) * scale;
  const y = squareCanvasY + (p.y - p.height / 2) * scale;
  const label = `${p.class ?? p.label ?? "obj"} ${(p.confidence * 100 | 0)}%`;
  noStroke(); fill(0, 170);
  rect(x, y - 16, textWidth(label) + 10, 14, 4);
  fill(255); text(label, x + 5, y - 4);
  stroke(0, 255, 0);
}