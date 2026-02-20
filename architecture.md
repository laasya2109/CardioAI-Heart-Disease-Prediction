# 1.4.1 Modular Architecture

CardioAI follows a modular, multi-tier architecture designed to ensure scalability, reliability, and accurate health risk assessment. Each module operates independently while maintaining seamless communication with the core system components.

### 1. Presentation (User Interface) Tier
-   **Purpose**: Provides an intuitive and responsive interface for both patients and medical professionals.
-   **Technologies**: Developed using **HTML5, CSS3, and JavaScript**.
-   **Features**:
    -   Displays the landing page with project information.
    -   Provides interactive forms for entering medical parameters (Age, BP, Cholesterol, etc.).
    -   Visualizes prediction results with clear "Normal" or "High Risk" indicators.
    -   Includes a dashboard for viewing historical records (Doctor view).

### 2. Interaction & Logic Tier
-   **Purpose**: Manages application logic, routing, and data processing.
-   **Technologies**: Powered by a **Flask (Python)** backend server.
-   **Features**:
    -   Handles API requests from the frontend (e.g., `/predict_api`, `/login`).
    -   Processes user input data and formats it for the Machine Learning model.
    -   Manages authentication logic (currently mock implementation for Doctor login).
    -   Serves static assets and acts as the bridge between the UI and the Data/AI layers.

### 3. Data & Analytics Tier
-   **Purpose**: Manages datasets and handles data flow for predictions.
-   **Technologies**: **Pandas** for data manipulation, CSV based storage (MVP).
-   **Features**:
    -   Utilizes the **Heart Disease Dataset (`heart.csv`)** for model training and validation.
    -   Handles feature extraction and preprocessing (normalization of inputs like Age, Cholesterol).
    -   Generates calculated risk scores based on model probability outputs.
    -   Designed to support future integration with **SQL/NoSQL databases** for persistent patient history storage.

### 4. AI & Extensibility Tier
-   **Purpose**: Provides the core intelligence for heart disease prediction.
-   **Technologies**: **Scikit-Learn**, **Random Forest Classifier**, **Joblib**.
-   **Features**:
    -   Loads the pre-trained `heart_model.pkl` using Joblib for real-time inference.
    -   Uses a **Random Forest algorithm** to analyze complex non-linear relationships in medical data.
    -   Calculates a probabilistic risk score (0-100%) to indicate confidence levels.
    -   Built with extensibility in mind, allowing easy swapping of models (e.g., to Logistic Regression or Neural Networks) without checking the application logic.
