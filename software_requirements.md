# 1.6.4 Software Requirements

### Frontend Technologies
- **HTML5** - Provides the structural skeleton for the application, including the Dashboard, Prediction Input Forms, and Result pages.
- **CSS3** - Used for custom styling and responsive layout design (`style.css`), ensuring a clean user interface.
- **JavaScript (ES6+)** - Handles client-side logic, DOM manipulation, and user interactions (`app.js`).
- **Fetch API** - Manages asynchronous HTTP requests to the Flask backend for real-time predictions.

### Backend / Application Logic
- **Flask (Python)** - A lightweight WSGI web application framework used to serve the application and handle API endpoints (`server.py`).
- **Python 3.x** - The core programming language server-side logic and ML integration.
- **Joblib** - Used for efficient serialization and deserialization of the trained Machine Learning model.

### Data Handling & Analytics
- **Pandas** - Powerful data manipulation library used for processing the heart disease dataset (`heart.csv`) and formatting input data.
- **CSV Data Storage** - Uses structured CSV files for dataset management and model training data.

### AI & Prediction Technologies
- **Scikit-Learn** - The primary machine learning library used for building and training the predictive model.
- **Random Forest Classifier** - The specific ensemble learning method used to predict heart disease risk based on patient attributes.
- **NumPy** - Fundamental package for scientific computing, used for numerical operations on data arrays.

### Development Tools
- **Visual Studio Code** - The primary Integrated Development Environment (IDE) for coding and debugging.
- **Git** - Version control system for tracking changes and source code management.
- **Pip** - Package installer for Python, used to manage backend dependencies.
