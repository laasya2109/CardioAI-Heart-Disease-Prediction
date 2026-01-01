
// Base URL for API
const API_URL = 'http://127.0.0.1:5000';

/* --- Login --- */
async function login() {
  const u = document.getElementById("u").value;
  const p = document.getElementById("p").value;

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });

    const data = await response.json();
    if (data.success) {
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

      // Save to History (Patient Records)
      let records = JSON.parse(localStorage.getItem('patientRecords')) || [];
      records.unshift(resultPacket); // Add new record to top
      localStorage.setItem('patientRecords', JSON.stringify(records));

      window.location.href = "result.html";
    }

  } catch (error) {
    console.error("Prediction Error:", error);
    alert("Failed to get prediction. Check server console.");
  }
}

/* --- Load Records (for records.html) --- */
function loadRecords() {
  const tableBody = document.getElementById('recordsTable');
  if (!tableBody) return; // Not on records page

  const records = JSON.parse(localStorage.getItem('patientRecords')) || [];
  const totalCount = document.getElementById('totalPatients');
  const highCount = document.getElementById('highRiskCount');
  const lowCount = document.getElementById('lowRiskCount');

  // Update Stats
  if (totalCount) totalCount.innerText = records.length;
  if (highCount) highCount.innerText = records.filter(r => r.prediction === 1).length;
  if (lowCount) lowCount.innerText = records.filter(r => r.prediction === 0).length;

  // Clear and Populate Table
  tableBody.innerHTML = '';

  if (records.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No records found.</td></tr>';
    return;
  }

  records.forEach(r => {
    const riskBadge = r.prediction === 1
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
}

function viewRecord(id) {
  const records = JSON.parse(localStorage.getItem('patientRecords')) || [];
  const record = records.find(r => r.id === id);
  if (record) {
    localStorage.setItem('lastResult', JSON.stringify(record));
    window.location.href = "result.html";
  }
}

function deleteRecord(id) {
  if (confirm("Are you sure you want to delete this record?")) {
    let records = JSON.parse(localStorage.getItem('patientRecords')) || [];
    records = records.filter(r => r.id !== id);
    localStorage.setItem('patientRecords', JSON.stringify(records));
    loadRecords(); // Refresh
  }
}

// Auto-load records if on records page
document.addEventListener('DOMContentLoaded', loadRecords);
