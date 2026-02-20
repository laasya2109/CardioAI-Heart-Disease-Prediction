from flask import Flask, render_template, request, jsonify, send_from_directory
import joblib
import pandas as pd
import os
import sqlite3
import json
from datetime import datetime
from database import init_db

app = Flask(__name__, static_folder='.', template_folder='.')

# Ensure DB is initialized
init_db()

# Load Modell
try:
    model = joblib.load('ML/heart_model.pkl')
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'Doctor') # Default to Doctor for backward compatibility
    
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute("SELECT * FROM Users WHERE username=? AND password=? AND role=?", (username, password, role))
        user = c.fetchone()
        conn.close()
        
        if user:
            redirect_url = "home.html" if role == "Doctor" else "patient_dashboard.html"
            return jsonify({"success": True, "redirect": redirect_url})
        else:
            return jsonify({"success": False, "message": "Invalid credentials"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"})

@app.route('/predict_api', methods=['POST'])
def predict_api():
    if not model:
        return jsonify({"error": "Model not loaded"}), 500
        
    try:
        data = request.json
        # Extract features in the order the model expects
        # Based on train_model.py, columns are: age,sex,cp,trestbps,chol,fbs,restecg,thalach,exang,oldpeak,slope,ca,thal
        
        # Mapping frontend keys to model features
        features = [
            float(data['age']),
            float(data['sex']), # 1=Male, 0=Female
            float(data['cp']),
            float(data['trestbps']),
            float(data['chol']),
            float(data['fbs']), # 1 if >120 else 0
            float(data['restecg']),
            float(data['thalach']), # Max Heart Rate
            float(data['exang']), # 1=Yes, 0=No
            float(data['oldpeak'])
        ]
        
        prediction = model.predict([features])[0]
        # model.predict_proba might be available for "score" but standard RF classifier returns class
        # We'll simulate a score or use predict_proba if available
        
        risk_score = 0
        try:
            probs = model.predict_proba([features])[0]
            risk_score = int(probs[1] * 100) # Probability of class 1 (Disease)
        except:
            risk_score = 100 if prediction == 1 else 0

        result = {
            "prediction": int(prediction), # 1 or 0
            "risk_score": risk_score
        }
        
        # Form details
        patient_username = data.get('patientUsername')
        patient_password = data.get('patientPassword')
        p_name = data.get('p_name', 'Unknown')
        
        # Save to DB
        if patient_username:
            conn = sqlite3.connect('database.db')
            c = conn.cursor()
            
            is_new_patient = False
            if patient_password:
                # Insert User if not exists
                c.execute("SELECT * FROM Users WHERE username=?", (patient_username,))
                if not c.fetchone():
                    c.execute("INSERT INTO Users (username, password, role) VALUES (?, ?, 'Patient')", (patient_username, patient_password))
                    is_new_patient = True
                    
            # Insert the current actual Record
            details_str = json.dumps(data)
            date_str = datetime.now().strftime("%m/%d/%Y")
            c.execute("INSERT INTO Records (patient_username, name, age, sex, prediction, score, date, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                      (patient_username, p_name, data.get('age'), "Male" if str(data.get('sex'))=="1" else "Female", int(prediction), risk_score, date_str, details_str))
            
            # Auto-populate 2 historical records if this is a brand new patient
            if is_new_patient:
                # Mock details
                mock_details1 = json.dumps({"trestbps": "120", "chol": "190", "thalach": "145"})
                mock_details2 = json.dumps({"trestbps": "135", "chol": "210", "thalach": "130"})
                # Insert historical record 1 (Past)
                c.execute("INSERT INTO Records (patient_username, name, age, sex, prediction, score, date, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                          (patient_username, p_name, data.get('age'), "Male" if str(data.get('sex'))=="1" else "Female", 0, 30, "01/15/2026", mock_details1))
                # Insert historical record 2 (Further Past)
                c.execute("INSERT INTO Records (patient_username, name, age, sex, prediction, score, date, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                          (patient_username, p_name, data.get('age'), "Male" if str(data.get('sex'))=="1" else "Female", 1, 65, "10/05/2025", mock_details2))

            conn.commit()
            conn.close()
            
        return jsonify(result)
        
    except Exception as e:
        print(f"Prediction Error: {e}")
        return jsonify({"error": str(e)}), 400

@app.route('/get_records', methods=['GET'])
def get_records():
    # Fetch all records
    try:
        conn = sqlite3.connect('database.db')
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT * FROM Records ORDER BY id DESC")
        rows = c.fetchall()
        conn.close()
        
        records = []
        for r in rows:
            records.append({
                "id": r["id"],
                "patient_username": r["patient_username"],
                "name": r["name"],
                "age": r["age"],
                "sex": r["sex"],
                "prediction": r["prediction"],
                "score": r["score"],
                "date": r["date"],
                "details": json.loads(r["details"]) if r["details"] else {}
            })
        return jsonify(records)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
