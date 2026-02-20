
// Base URL for API
const API_URL = 'http://127.0.0.1:5000';

/* --- Authentication & Routing --- */
function checkAuth(allowedRoles) {
  const role = localStorage.getItem('currentRole');
  const user = localStorage.getItem('currentUser');

  // Exclude login page from redirecting constantly if not logged in
  const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';

  if (!user || !role) {
    if (!isLoginPage) {
      window.location.href = "index.html";
    }
    return;
  }

  // If we are on a protected page but don't have the right role
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'Doctor') {
      window.location.href = 'home.html';
    } else if (role === 'Patient') {
      window.location.href = 'patient_dashboard.html';
    }
  }

  // Remove predict option from navigation if patient
  if (role === 'Patient') {
    document.addEventListener('DOMContentLoaded', () => {
      const predictLinks = document.querySelectorAll('a[href="predict.html"]');
      predictLinks.forEach(link => link.style.display = 'none');
    });
  }
}

function logout() {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('currentRole');
  window.location.href = "index.html";
}

/* --- Login --- */
async function login() {
  const role = document.getElementById("role") ? document.getElementById("role").value : "Doctor";
  const u = document.getElementById("u").value;
  const p = document.getElementById("p").value;

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p, role: role })
    });

    const data = await response.json();
    if (data.success) {
      localStorage.setItem('currentUser', u);
      localStorage.setItem('currentRole', role);
      window.location.href = data.redirect;
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error("Login Error:", error);
    alert("Failed to connect to server. Make sure server.py is running!");
  }
}

/* --- Predict --- */
async function predict() {
  // Gather form data
  const formData = {
    p_name: document.getElementById('p_name').value,
    patientUsername: document.getElementById('patientUsername') ? document.getElementById('patientUsername').value : "",
    patientPassword: document.getElementById('patientPassword') ? document.getElementById('patientPassword').value : "",
    age: document.getElementById('age').value,
    sex: document.getElementById('sex').value,
    cp: document.getElementById('cp').value,
    trestbps: document.getElementById('trestbps').value,
    chol: document.getElementById('chol').value,
    fbs: document.getElementById('fbs').value,
    restecg: document.getElementById('restecg').value,
    thalach: document.getElementById('thalach').value,
    exang: document.getElementById('exang').value,
    oldpeak: document.getElementById('oldpeak').value,
    slope: document.getElementById('slope').value,
    ca: document.getElementById('ca').value || 0,
    thal: document.getElementById('thal').value || 2
  };

  // Basic Validation
  for (const key in formData) {
    if (formData[key] === "") {
      alert(`Please fill in ${key}`);
      return;
    }
  }

  try {
    const response = await fetch(`${API_URL}/predict_api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (result.error) {
      alert("Error: " + result.error);
    } else {
      // Create Record Object
      const resultPacket = {
        id: Date.now(), // unique id
        name: document.getElementById('p_name').value,
        age: document.getElementById('age').value,
        sex: document.getElementById('sex').value == "1" ? "Male" : "Female",
        prediction: result.prediction,
        score: result.risk_score,
        date: new Date().toLocaleDateString(),
        details: formData // Save all inputs for the report
      };

      // Save for Result Page
      localStorage.setItem('lastResult', JSON.stringify(resultPacket));

      // The backend has now saved this directly to the SQLite Database
      // We no longer push it manually to the 'patientRecords' array.

      window.location.href = "result.html";
    }

  } catch (error) {
    console.error("Prediction Error:", error);
    alert("Failed to get prediction. Check server console.");
  }
}

/* --- Load Records (for records.html) --- */
async function loadRecords() {
  const tableBody = document.getElementById('recordsTable');
  if (!tableBody) return; // Not on records page

  try {
    const response = await fetch(`${API_URL}/get_records`);
    let records = await response.json();

    const role = localStorage.getItem('currentRole');
    const user = localStorage.getItem('currentUser');

    // Filter specifically for patients
    if (role === 'Patient') {
      records = records.filter(r => r.patient_username === user);
      // Hide doctor metrics
      const doctorBadges = document.querySelectorAll('.badge-pill');
      if (doctorBadges.length > 0) doctorBadges[0].style.display = 'none';

      const totalPatientsCard = document.getElementById('totalPatientsCard');
      if (totalPatientsCard) totalPatientsCard.style.display = 'none';
    }

    // Save globally so viewRecord doesn't need to re-fetch
    window.loadedPatientRecords = records;

    const totalCount = document.getElementById('totalPatients');
    const highCount = document.getElementById('highRiskCount');
    const lowCount = document.getElementById('lowRiskCount');

    // Update Stats
    if (totalCount) totalCount.innerText = records.length;
    if (highCount) highCount.innerText = records.filter(r => r.score > 50).length;
    if (lowCount) lowCount.innerText = records.filter(r => r.score <= 50).length;

    // Clear and Populate Table
    tableBody.innerHTML = '';

    if (records.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No records found.</td></tr>';
      return;
    }

    records.forEach(r => {
      const riskBadge = r.score > 50
        ? '<span class="status-tag tag-high">High Risk</span>'
        : '<span class="status-tag tag-low">Low Risk</span>';

      const row = `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 35px; height: 35px; background: #E0F7FA; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary);">
                            <i class="far fa-user"></i>
                        </div>
                        ${r.name}
                    </div>
                </td>
                <td>${r.age} yrs</td>
                <td>${r.sex}</td>
                <td>${riskBadge}</td>
                <td>${r.score}%</td>
                <td>${r.date}</td>
                <td>
                    <button onclick="viewRecord(${r.id})" style="border: none; background: #10B981; color: white; padding: 6px 15px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 5px;">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <!-- Optional Delete Button if you want to keep it, maybe smaller or next to it -->
                    <!-- <button onclick="deleteRecord(${r.id})" ... --> 
                </td>
            </tr>
        `;
      tableBody.innerHTML += row;
    });
  } catch (error) {
    console.error("Error fetching records:", error);
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Failed to fetch records. Make sure the server is running.</td></tr>';
  }
}

function viewRecord(id) {
  try {
    const records = window.loadedPatientRecords || [];
    // Convert both to strings to ensure matching works perfectly
    const record = records.find(r => String(r.id) === String(id));
    if (record) {
      localStorage.setItem('lastResult', JSON.stringify(record));
      window.location.href = "result.html";
    } else {
      alert("Record not found! ID: " + id);
    }
  } catch (error) {
    console.error("Error fetching record to view:", error);
    alert("Could not load record. Is the server running?");
  }
}

async function loadPatientDashboard() {
  const loggedInUser = localStorage.getItem('currentUser');
  if (!loggedInUser) return;

  try {
    const response = await fetch(`${API_URL}/get_records`);
    const allRecords = await response.json();
    const myRecords = allRecords.filter(r => r.patient_username === loggedInUser);

    if (myRecords.length > 0) {
      const latest = myRecords[0];
      const pNameEl = document.getElementById('pName');
      if (pNameEl) pNameEl.innerText = "Hello, " + latest.name;

      const healthScoreEl = document.getElementById('healthScore');
      if (healthScoreEl) healthScoreEl.innerText = latest.score + "%";

      const circleEl = document.getElementById('healthCircle');
      if (circleEl) {
        circleEl.style.stroke = latest.score > 50 ? "#DC2626" : "#10B981";
      }

      const details = latest.details || {};
      const vbp = document.getElementById('v_bp');
      if (vbp && details.trestbps) vbp.innerText = details.trestbps;

      const vchol = document.getElementById('v_chol');
      if (vchol && details.chol) vchol.innerText = details.chol;

      const vhr = document.getElementById('v_hr');
      if (vhr && details.thalach) vhr.innerText = details.thalach;
    }
  } catch (error) {
    console.error("Dashboard error:", error);
  }
}



function deleteRecord(id) {
  if (confirm("Are you sure you want to delete this record (Local only)? Backend API not yet implemented for deletion.")) {
    // Left empty for now, or implement backend delete endpoint
  }
}

// Auto-load records if on records page
document.addEventListener('DOMContentLoaded', loadRecords);

// --- Chat Widget Logic ---
function toggleChat() {
  const chatWindow = document.getElementById('chatWindow');
  if (chatWindow.style.display === 'none' || chatWindow.style.display === '') {
    chatWindow.style.display = 'flex';
  } else {
    chatWindow.style.display = 'none';
  }
}

function handleChat(event) {
  if (event.key === 'Enter') {
    sendChat();
  }
}

async function sendChat() {
  const input = document.getElementById('chatInput');
  const msgText = input.value.trim();
  if (!msgText) return;

  // 1. Add User Message to UI
  appendChatMessage(msgText, 'user');
  input.value = '';

  // 2. Fetch AI Reply from Backend
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msgText })
    });
    const data = await response.json();

    // 3. Add Bot Reply to UI
    if (data.reply) {
      appendChatMessage(data.reply, 'bot');
    }
  } catch (error) {
    console.error("Chat Error:", error);
    appendChatMessage("Sorry, I'm having trouble connecting to the server.", 'bot');
  }
}

function appendChatMessage(text, sender) {
  const chatBody = document.getElementById('chatBody');
  const msgDiv = document.createElement('div');
  msgDiv.className = `msg ${sender}`;
  msgDiv.innerText = text;
  chatBody.appendChild(msgDiv);

  // Auto-scroll downwards
  chatBody.scrollTop = chatBody.scrollHeight;
}
