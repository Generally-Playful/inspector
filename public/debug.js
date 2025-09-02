
// --- Debug: Draw the 512x512 API image locally ---
let debugImg = null;
let debugImgReady = false;
function keyPressed() {
  if (key === 'd' || key === 'D') {
    // Generate the base64 image and load it as a p5.Image
    const base64 = getCurrentFrameBase64();

    loadImage(base64, img => {
      debugImg = img;
      debugImgReady = true;
      console.log('Debug image loaded');
    }, err => {
      debugImgReady = false;
      console.error('Failed to load debug image', err);
    });
  }
}

function drawDebugImage() {
  if (debugImgReady && debugImg) {
    // Draw in the top-left corner, 256x256 for visibility, using COVER fit
    image(debugImg, 
      0, 0, 256, 256, // destination rectangle
      0, 0, debugImg.width, debugImg.height*2, // source rectangle (full image)
      COVER, CENTER, CENTER // fit and alignment
    );
    // Optionally, draw a border
    noFill();
    stroke(255, 0, 0);
    strokeWeight(2);
    rect(0, 0, 256, 256);
  }
}
