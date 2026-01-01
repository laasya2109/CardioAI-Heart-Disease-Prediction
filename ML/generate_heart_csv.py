import pandas as pd
import random

rows = []

for _ in range(300):
    age = random.randint(29, 77)
    sex = random.randint(0, 1)
    cp = random.randint(0, 3)
    trestbps = random.randint(90, 180)
    chol = random.randint(150, 350)
    fbs = random.randint(0, 1)
    restecg = random.randint(0, 2)
    thalach = random.randint(100, 200)
    exang = random.randint(0, 1)
    oldpeak = round(random.uniform(0.0, 4.0), 1)

    # simple realistic rule for target
    risk_score = (
        (age > 55) +
        (trestbps > 140) +
        (chol > 240) +
        (thalach < 140) +
        (oldpeak > 1.5)
    )

    target = 1 if risk_score >= 3 else 0

    rows.append([
        age, sex, cp, trestbps, chol,
        fbs, restecg, thalach, exang,
        oldpeak, target
    ])

df = pd.DataFrame(rows, columns=[
    "age","sex","cp","trestbps","chol",
    "fbs","restecg","thalach","exang",
    "oldpeak","target"
])

df.to_csv("heart.csv", index=False)

print("heart.csv with 300 samples created successfully")
