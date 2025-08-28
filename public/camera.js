
// --- Camera Setup ---



function setupCamera() {
   capture = createCapture(VIDEO, ()=>{
    started = true;
   });

//    capture.size(window.innerWidth, window.innerHeight);
   capture.hide();

   console.log('Camera initialized with size:', capture.width, 'x', capture.height);
}



