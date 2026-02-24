
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
    mobile: document.getElementById('mobileNumber') ? document.getElementById('mobileNumber').value : "",
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
                <td style="display: flex; gap: 8px;">
                    <button onclick="viewRecord(${r.id})" style="border: none; background: #10B981; color: white; padding: 6px 15px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 5px;">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <!-- Prescription Button -->
                    <button onclick="openPrescriptionModal('${r.patient_username}', '${r.name}')" style="border: none; background: var(--primary); color: white; padding: 6px 15px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 5px;">
                        <i class="fas fa-pills"></i> Rx
                    </button>
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
      if (healthScoreEl) healthScoreEl.textContent = latest.score + "%";

      const circleEl = document.getElementById('healthCircle');
      if (circleEl) {
        circleEl.style.stroke = latest.score > 50 ? "#DC2626" : "#10B981";
        circleEl.setAttribute('stroke-dasharray', `${latest.score}, 100`);
      }

      const tipEl = document.getElementById('dailyTip');
      const consultContainer = document.getElementById('consultButtonContainer');
      const consultLink = document.getElementById('consultLink');

      if (tipEl) {
        if (latest.score > 50) {
          tipEl.innerHTML = `<i class="far fa-lightbulb"></i> Your risk is high. Please consult your doctor.`;

          if (consultContainer && consultLink) {
            consultContainer.style.display = 'block';
            consultLink.href = 'appointment.html';
          }
        } else {
          tipEl.innerHTML = `<i class="far fa-lightbulb"></i> Great! Maintain a healthy lifestyle.`;
          if (consultContainer) consultContainer.style.display = 'none';
        }
      }

      const details = latest.details || {};
      const vbp = document.getElementById('v_bp');
      if (vbp && details.trestbps) vbp.innerText = details.trestbps;

      const vchol = document.getElementById('v_chol');
      if (vchol && details.chol) vchol.innerText = details.chol;

      const vhr = document.getElementById('v_hr');
      if (vhr && details.thalach) vhr.innerText = details.thalach;

      // Load History
      const historyContainer = document.getElementById('historyContainer');
      if (historyContainer) {
        historyContainer.innerHTML = '';
        if (myRecords.length <= 1) {
          historyContainer.innerHTML = '<div style="text-align: center; color: var(--text-light); padding: 20px;">No previous assessments found.</div>';
        } else {
          const historyRecords = myRecords.slice(1);
          historyRecords.forEach(r => {
            const riskColor = r.score > 50 ? '#DC2626' : '#10B981';
            const riskBg = r.score > 50 ? '#FEF2F2' : '#ECFDF5';
            const riskText = r.score > 50 ? 'High Risk' : 'Low Risk';
            historyContainer.innerHTML += `
                      <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border: 1px solid var(--border); border-radius: 8px;">
                          <div>
                              <div style="font-weight: 600; color: var(--text-main); font-size: 1.05rem;"><i class="far fa-calendar-alt" style="color: var(--primary); margin-right: 5px;"></i> ${r.date}</div>
                              <div style="font-size: 0.9rem; color: var(--text-light); margin-top: 5px;">Risk Score: <strong style="color: var(--secondary);">${r.score}%</strong></div>
                          </div>
                          <div style="background: ${riskBg}; color: ${riskColor}; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                              ${riskText}
                          </div>
                      </div>
                  `;
          });
        }
      }

      // Risk Trend Chart
      const trendCtx = document.getElementById('riskTrendChart');
      if (trendCtx && myRecords.length > 0) {
        // Get records chronologically (oldest to newest)
        const chartRecords = [...myRecords].reverse();
        const labels = chartRecords.map(r => r.date);
        const dataPoints = chartRecords.map(r => r.score);

        new Chart(trendCtx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Heart Risk Score (%)',
              data: dataPoints,
              borderColor: '#12C2E9', // Primary brand color
              backgroundColor: 'rgba(18, 194, 233, 0.15)',
              borderWidth: 3,
              pointBackgroundColor: '#F64F59', // Accent color
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)'
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            },
            plugins: {
              legend: {
                display: false // Hide as we have the title above
              },
              tooltip: {
                backgroundColor: '#0F2027',
                padding: 12,
                titleFont: { size: 14, family: 'Outfit' },
                bodyFont: { size: 14, family: 'Outfit' },
                callbacks: {
                  label: function (context) {
                    return ' Risk: ' + context.parsed.y + '%';
                  }
                }
              }
            }
          }
        });
      }
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

/* --- Appointments Logic --- */
async function scheduleAppointment() {
  const date = document.getElementById('appDate').value;
  const time = document.getElementById('appTime').value;
  const reason = document.getElementById('appReason').value;

  if (!date || !time || !reason) {
    alert("Please fill in all the fields.");
    return;
  }

  const patient_username = localStorage.getItem('currentUser');
  // Find patient name from records or set to default
  let patient_name = 'Patient';
  try {
    const response = await fetch(`${API_URL}/get_records`);
    const records = await response.json();
    const myRecs = records.filter(r => r.patient_username === patient_username);
    if (myRecs.length > 0) patient_name = myRecs[0].name;
  } catch (e) { }

  try {
    const response = await fetch(`${API_URL}/schedule_appointment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientUsername: patient_username,
        patientName: patient_name,
        date: date,
        time: time,
        reason: reason
      })
    });
    const data = await response.json();
    if (data.success) {
      alert("Appointment successfully scheduled!");
      window.location.href = "patient_dashboard.html";
    } else {
      alert("Failed to schedule: " + data.error);
    }
  } catch (error) {
    console.error("Schedule error:", error);
    alert("Failed to connect to the server to schedule appointment.");
  }
}

/* --- Prescriptions --- */
function openPrescriptionModal(username, name) {
  const modal = document.getElementById('prescriptionModal');
  if (modal) {
    document.getElementById('prescPatientUsername').value = username;
    document.getElementById('prescPatientName').innerText = name;
    modal.classList.remove('hidden');
    modal.style.display = 'flex'; // Ensure it flexes
  }
}

function closePrescriptionModal() {
  const modal = document.getElementById('prescriptionModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
    // Clear inputs
    document.getElementById('prescMedication').value = '';
    document.getElementById('prescDosage').value = '';
    document.getElementById('prescFrequency').value = '';
  }
}

async function submitPrescription() {
  const username = document.getElementById('prescPatientUsername').value;
  const medication = document.getElementById('prescMedication').value;
  const dosage = document.getElementById('prescDosage').value;
  const frequency = document.getElementById('prescFrequency').value;
  const doctor = localStorage.getItem('currentUser');

  if (!medication || !dosage || !frequency) {
    alert("Please fill in all prescription details.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/add_prescription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientUsername: username,
        doctorUsername: doctor,
        medication: medication,
        dosage: dosage,
        frequency: frequency
      })
    });

    const data = await response.json();
    if (data.success) {
      alert("Prescription added successfully!");
      closePrescriptionModal();
    } else {
      alert("Failed to add prescription: " + data.error);
    }
  } catch (error) {
    console.error("Prescription error:", error);
    alert("Failed to connect to the server.");
  }
}

async function loadPrescriptions() {
  const container = document.getElementById('patientPrescriptionsContainer');
  if (!container) return; // Only on patient dashboard

  const user = localStorage.getItem('currentUser');

  try {
    const response = await fetch(`${API_URL}/get_prescriptions`);
    const allPrescriptions = await response.json();

    const myPrescriptions = allPrescriptions.filter(p => p.patient_username === user);

    container.innerHTML = '';

    if (myPrescriptions.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: var(--text-light); padding: 20px;">No current medications.</div>';
      return;
    }

    myPrescriptions.forEach(p => {
      container.innerHTML += `
        <div style="padding: 15px; border: 1px solid var(--border); border-radius: 8px; background: #fff4f4; border-left: 4px solid #EF4444; margin-bottom: 5px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <strong style="color: #B91C1C; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-capsules"></i> ${p.medication}
              </strong>
              <div style="color: var(--text-main); font-size: 0.95rem; margin-top: 5px;"><strong>Dosage:</strong> ${p.dosage}</div>
              <div style="color: var(--text-main); font-size: 0.95rem; margin-top: 2px;"><strong>Frequency:</strong> ${p.frequency}</div>
              <div style="color: var(--text-light); font-size: 0.8rem; margin-top: 8px;">Prescribed on: ${p.date}</div>
            </div>
            <span style="background: white; padding: 4px 8px; border-radius: 4px; border: 1px solid #FECACA; font-size: 0.8rem; color: #DC2626;">Active</span>
          </div>
        </div>
      `;
    });

  } catch (error) {
    console.error("Fetch prescriptions error:", error);
    container.innerHTML = '<div style="text-align: center; color: var(--text-light); padding: 20px;">Failed to load medications.</div>';
  }
}

async function loadAppointments() {
  const role = localStorage.getItem('currentRole');
  const user = localStorage.getItem('currentUser');

  const patientContainer = document.getElementById('patientAppointmentsContainer');
  const doctorContainer = document.getElementById('doctorAppointmentsContainer');

  try {
    // We fetch records to get the mobile number of the patients
    let recordsData = [];
    try {
      const recRes = await fetch(`${API_URL}/get_records`);
      recordsData = await recRes.json();
    } catch (e) { }

    const response = await fetch(`${API_URL}/get_appointments`);
    let appointments = await response.json();

    if (role === 'Patient') {
      appointments = appointments.filter(a => a.patient_username === user);
      if (patientContainer) {
        patientContainer.innerHTML = '';
        if (appointments.length === 0) {
          patientContainer.innerHTML = '<div style="text-align: center; color: var(--text-light); padding: 20px;">No upcoming appointments.</div>';
        } else {
          appointments.forEach(app => {
            // Find patient's mobile number
            const matchingRecords = recordsData.filter(r => r.patient_username === app.patient_username);
            let mobileDisplay = "";
            if (matchingRecords.length > 0 && matchingRecords[0].details && matchingRecords[0].details.mobile) {
              mobileDisplay = `<div style="font-size: 0.95rem; color: var(--text-main); margin-bottom: 5px;"><i class="fas fa-phone" style="color: var(--primary); width: 20px;"></i> ${matchingRecords[0].details.mobile}</div>`;
            }

            patientContainer.innerHTML += `
              <div style="padding: 15px; border: 1px solid var(--border); border-radius: 8px; background: #f8fafc;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <strong style="color: var(--secondary);"><i class="far fa-calendar-alt"></i> ${app.appointment_date} at ${app.appointment_time}</strong>
                  <span style="background: #E0F7FA; color: var(--primary); padding: 5px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">${app.status || 'Scheduled'}</span>
                </div>
                ${mobileDisplay}
                <div style="font-size: 0.95rem; color: var(--text-main);"><strong>Reason:</strong> ${app.reason}</div>
              </div>
            `;
          });
        }
      }
    } else if (role === 'Doctor') {
      if (doctorContainer) {
        doctorContainer.innerHTML = '';
        if (appointments.length === 0) {
          doctorContainer.innerHTML = '<div style="text-align: center; grid-column: 1 / -1; color: var(--text-light); padding: 20px;">No upcoming appointments.</div>';
        } else {
          appointments.forEach(app => {
            // Find patient's mobile number
            const matchingRecords = recordsData.filter(r => r.patient_username === app.patient_username);
            let mobileDisplay = "";
            if (matchingRecords.length > 0 && matchingRecords[0].details && matchingRecords[0].details.mobile) {
              mobileDisplay = `<div style="margin-bottom: 10px; font-size: 0.95rem; color: var(--text-main);"><i class="fas fa-phone" style="color: var(--primary); width: 20px;"></i> ${matchingRecords[0].details.mobile}</div>`;
            }

            doctorContainer.innerHTML += `
              <div style="padding: 20px; border: 1px solid var(--border); border-radius: 12px; background: white; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                <h4 style="color: var(--secondary); margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                  <div style="width: 30px; height: 30px; background: #E0F7FA; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary);"><i class="far fa-user"></i></div>
                  ${app.patient_name}
                </h4>
                <div style="margin-bottom: 10px; font-size: 0.95rem; color: var(--text-main);"><i class="far fa-calendar-alt" style="color: var(--primary); width: 20px;"></i> ${app.appointment_date}</div>
                <div style="margin-bottom: 10px; font-size: 0.95rem; color: var(--text-main);"><i class="far fa-clock" style="color: var(--primary); width: 20px;"></i> ${app.appointment_time}</div>
                ${mobileDisplay}
                <div style="font-size: 0.9rem; color: var(--text-light); background: #f8fafc; padding: 10px; border-radius: 6px; margin-top: 15px;"><strong>Reason:</strong> ${app.reason}</div>
              </div>
            `;
          });
        }
      }
    }
  } catch (error) {
    console.error("Fetch appointments error:", error);
    if (patientContainer) patientContainer.innerHTML = '<div style="text-align: center; color: var(--text-light); padding: 20px;">Failed to load appointments.</div>';
    if (doctorContainer) doctorContainer.innerHTML = '<div style="text-align: center; grid-column: 1 / -1; color: var(--text-light); padding: 20px;">Failed to load appointments.</div>';
  }
}
