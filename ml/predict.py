from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import os

app = FastAPI(
    title="KCET ML Prediction API",
    description="RandomForest-based cutoff predictor for KCET counselling",
    version="1.0.0",
)

# ── CORS ────────────────────────────────────────────────────────────────────────
# Allow the Next.js frontend (local + deployed) to call this API.
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Also allow any Vercel preview / production URLs via env var
vercel_url = os.environ.get("FRONTEND_URL")
if vercel_url:
    origins.append(vercel_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load trained model ──────────────────────────────────────────────────────────
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
model = joblib.load(os.path.join(MODEL_DIR, "kcet_model.pkl"))
encoders = joblib.load(os.path.join(MODEL_DIR, "encoders.pkl"))


# ── Request schema ──────────────────────────────────────────────────────────────
class PredictionRequest(BaseModel):
    year: int
    category: str
    quota: str
    branch_name: str
    college_name: str


# ── Routes ──────────────────────────────────────────────────────────────────────
@app.get("/")
def home():
    return {
        "status": "healthy",
        "message": "KCET ML API Running",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(data: PredictionRequest):
    try:
        category = encoders["category"].transform([data.category])[0]
        quota = encoders["quota"].transform([data.quota])[0]
        branch = encoders["branch_name"].transform([data.branch_name])[0]
        college = encoders["college_name"].transform([data.college_name])[0]
    except (ValueError, KeyError) as e:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown label for encoder: {str(e)}",
        )

    features = pd.DataFrame(
        [[data.year, category, quota, branch, college]],
        columns=["year", "category", "quota", "branch_name", "college_name"],
    )

    prediction = model.predict(features)

    return {
        "predicted_cutoff": int(prediction[0]),
    }