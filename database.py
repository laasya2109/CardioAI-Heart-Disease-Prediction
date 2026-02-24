import sqlite3

def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    
    # Create Users Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL -- 'Doctor' or 'Patient'
        )
    ''')
    
    # Create Records Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS Records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_username TEXT NOT NULL,
            name TEXT NOT NULL,
            age INTEGER NOT NULL,
            sex TEXT NOT NULL,
            prediction INTEGER NOT NULL,
            score INTEGER NOT NULL,
            date TEXT NOT NULL,
            details TEXT NOT NULL,
            FOREIGN KEY(patient_username) REFERENCES Users(username)
        )
    ''')

    # Create Appointments Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS Appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_username TEXT NOT NULL,
            patient_name TEXT NOT NULL,
            appointment_date TEXT NOT NULL,
            appointment_time TEXT NOT NULL,
            reason TEXT NOT NULL,
            status TEXT DEFAULT 'Scheduled',
            FOREIGN KEY(patient_username) REFERENCES Users(username)
        )
    ''')

    # Create Prescriptions Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS Prescriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_username TEXT NOT NULL,
            doctor_username TEXT NOT NULL,
            medication TEXT NOT NULL,
            dosage TEXT NOT NULL,
            frequency TEXT NOT NULL,
            date TEXT NOT NULL,
            FOREIGN KEY(patient_username) REFERENCES Users(username)
        )
    ''')

    
    # Insert default doctor if not exists
    c.execute("SELECT * FROM Users WHERE username='doctor'")
    if not c.fetchone():
        c.execute("INSERT INTO Users (username, password, role) VALUES ('doctor', 'doctor123', 'Doctor')")
        
    conn.commit()
    conn.close()
    print("Database initialized successfully.")

if __name__ == '__main__':
    init_db()
