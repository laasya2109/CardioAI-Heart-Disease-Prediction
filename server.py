from flask import Flask, render_template, request, jsonify, send_from_directory
import joblib
import pandas as pd
import os

app = Flask(__name__, static_folder='.', template_folder='.')

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
    
    # Mock Login Logic
    if username == "doctor" and password == "doctor123":
        return jsonify({"success": True, "redirect": "home.html"})
    else:
        return jsonify({"success": False, "message": "Invalid doctor credentials"})

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
        return jsonify(result)
        
    except Exception as e:
        print(f"Prediction Error: {e}")
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
