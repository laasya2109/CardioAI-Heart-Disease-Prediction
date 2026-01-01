import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib

# Load dataset
data = pd.read_csv("heart.csv")

# Inputs and output
X = data.drop("target", axis=1)
y = data["target"]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=7
)

# Random Forest (controlled to avoid overfitting)
model = RandomForestClassifier(
    n_estimators=80,
    max_depth=4,
    min_samples_split=10,
    min_samples_leaf=5,
    random_state=7
)

# Train model
model.fit(X_train, y_train)

# Predict
y_pred = model.predict(X_test)

# Accuracy
accuracy = accuracy_score(y_test, y_pred)
print("Model Accuracy:", round(accuracy * 100, 2), "%")

# Save model
joblib.dump(model, "heart_model.pkl")
print("Model saved as heart_model.pkl")
