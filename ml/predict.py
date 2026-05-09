from fastapi import FastAPI
import pandas as pd
import joblib

app = FastAPI()

# Load trained model
model = joblib.load("kcet_model.pkl")
encoders = joblib.load("encoders.pkl")

@app.get("/")
def home():
    return {
        "message": "KCET ML API Running"
    }

@app.post("/predict")
def predict(data: dict):

    category = encoders["category"].transform([
        data["category"]
    ])[0]

    quota = encoders["quota"].transform([
        data["quota"]
    ])[0]

    branch = encoders["branch_name"].transform([
        data["branch_name"]
    ])[0]

    college = encoders["college_name"].transform([
        data["college_name"]
    ])[0]

    features = pd.DataFrame([[
        data["year"],
        category,
        quota,
        branch,
        college
    ]], columns=[
        "year",
        "category",
        "quota",
        "branch_name",
        "college_name"
    ])

    prediction = model.predict(features)

    return {
        "predicted_cutoff": int(prediction[0])
    }