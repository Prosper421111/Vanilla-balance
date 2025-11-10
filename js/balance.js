// public/camera.js
async function uploadToFirebase(blob, name) {
  const storageRef = ref(storage, `cards/${Date.now()}-${name}.jpg`);
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
}

let baseStream = null, frontBlob = null, backBlob = null;

function stopStream(s) { if (s) s.getTracks().forEach(t => t.stop()); }

async function startDualCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    alert("Camera not supported");
    return;
  }
  stopStream(baseStream);
  try {
    baseStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    const track = baseStream.getVideoTracks()[0];
    const streamA = new MediaStream([track]);
    const streamB = new MediaStream([track]);

    document.getElementById("dualVideoFront").srcObject = streamA;
    document.getElementById("dualVideoBack").srcObject = streamB;
    document.getElementById("dualCaptureBlock").classList.remove("hidden");
  } catch (e) {
    alert("Camera access denied or not available");
  }
}

function captureFrom(video) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  return new Promise(res => canvas.toBlob(res, "image/jpeg", 0.9));
}

document.getElementById("openCameraBtn")?.addEventListener("click", startDualCamera);

document.getElementById("dualCloseBtn")?.addEventListener("click", () => {
  stopStream(baseStream);
  document.getElementById("dualCaptureBlock").classList.add("hidden");
});

document.getElementById("captureFrontBtn")?.addEventListener("click", async () => {
  frontBlob = await captureFrom(document.getElementById("dualVideoFront"));
  document.getElementById("frontPreview").src = URL.createObjectURL(frontBlob);
  document.getElementById("frontPreview").classList.remove("hidden");
});

document.getElementById("captureBackBtn")?.addEventListener("click", async () => {
  backBlob = await captureFrom(document.getElementById("dualVideoBack"));
  document.getElementById("backPreview").src = URL.createObjectURL(backBlob);
  document.getElementById("backPreview").classList.remove("hidden");
});

document.getElementById("finishAndSubmitBtn")?.addEventListener("click", async () => {
  const frontUrl = frontBlob ? await uploadToFirebase(frontBlob, "front") : "";
  const backUrl = backBlob ? await uploadToFirebase(backBlob, "back") : "";
  document.getElementById("front_image_url").value = frontUrl;
  document.getElementById("back_image_url").value = backUrl;
  stopStream(baseStream);
  document.getElementById("dualCaptureBlock").classList.add("hidden");
  document.getElementById("balanceForm").dispatchEvent(new Event("submit"));
});
