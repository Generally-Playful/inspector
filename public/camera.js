
// --- Camera Setup ---

function setupCamera() {
  // Use the same width and height as the canvas for the camera
  let camWidth = typeof baseWidth !== 'undefined' ? baseWidth : 480;
  let camHeight = typeof baseHeight !== 'undefined' ? baseHeight : 360;

  if (typeof window !== 'undefined' && typeof deviceAspect !== 'undefined') {
    camWidth = 480;
    camHeight = Math.round(camWidth / deviceAspect);
  }
  capture = createCapture({
    video: { facingMode: { ideal: "environment" }, width: { ideal: camWidth }, height: { ideal: camHeight } },
    audio: false
  }, () => {
    started = true;
    loop();
  });
  capture.size(camWidth, camHeight);
  capture.hide();
}



