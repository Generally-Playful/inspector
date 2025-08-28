
// --- Camera Setup ---



function setupCamera() {
  // Request portrait mode aspect
  let camWidth = 480;
  let camHeight = 640;
  if (typeof window !== 'undefined' && window.screen && window.screen.orientation) {
    try {
      window.screen.orientation.lock('portrait');
      console.log("Screen orientation locked to portrait");
    } catch (e) {
      // Some browsers may not support this
      console.log("Unable to lock screen orientation");
    }
  }

  capture = createCapture({
    video: { facingMode: { ideal: "environment" }, width: { ideal: camWidth }, height: { ideal: camHeight } },
    audio: false
  }, () => {
    started = true;
    // Use actual capture size, but scale down for display
    baseWidth = Math.floor(capture.width * 0.7);
    baseHeight = Math.floor(capture.height * 0.7);
    setupCanvas();
    loop();
  });
  capture.size(camWidth, camHeight);
  capture.hide();
}



