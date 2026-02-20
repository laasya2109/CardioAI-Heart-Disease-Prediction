import server
import json
import os
import sqlite3

# Context for the app
server.app.testing = True
client = server.app.test_client()

def test_flow():
    print("Starting Verification...")
    
    # Ensure DB init
    server.init_db()

    # 1. Create Record
    payload = {
        "name": "Test User",
        "age": 40,
        "sex": "Female",
        "prediction": 0,
        "score": 10,
        "date": "2026-01-01",
        "details": {"chol": 200}
    }
    
    print("Testing POST /api/records...")
    resp = client.post('/api/records', json=payload)
    if resp.status_code != 200:
        print(f"FAILED: POST returned {resp.status_code} - {resp.data}")
        exit(1)
    print("[PASS] POST /api/records")
    
    # 2. Get Records
    print("Testing GET /api/records...")
    resp = client.get('/api/records')
    if resp.status_code != 200:
        print(f"FAILED: GET returned {resp.status_code}")
        exit(1)
        
    data = resp.json
    if not isinstance(data, list):
         print("FAILED: GET did not return a list")
         exit(1)
         
    # Find our record
    record = next((r for r in data if r['name'] == "Test User"), None)
    if not record:
        print("FAILED: Could not find created record in GET response")
        print(f"Response: {data}")
        exit(1)
        
    print("[PASS] GET /api/records")
    
    # 3. Delete Record
    rec_id = record['id']
    print(f"Testing DELETE /api/records/{rec_id}...")
    resp = client.delete(f'/api/records/{rec_id}')
    if resp.status_code != 200:
        print(f"FAILED: DELETE returned {resp.status_code}")
        exit(1)
    print("[PASS] DELETE /api/records")
    
    # 4. Verify logic (Post-delete)
    resp = client.get('/api/records')
    data = resp.json
    found = any(r['id'] == rec_id for r in data)
    if found:
        print("FAILED: Record still exists after delete")
        exit(1)
    print("[PASS] Record successfully deleted")

    print("\nALL TESTS PASSED")

if __name__ == "__main__":
    try:
        test_flow()
    except Exception as e:
        print(f"Test crashed: {e}")
        exit(1)
