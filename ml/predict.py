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

# ── CORS ─────────────────────────────────────────────────────────────

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

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

# ── MODEL LOADING ───────────────────────────────────────────────────

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

model = None
encoders = None

model_path = os.path.join(MODEL_DIR, "kcet_model.pkl")
encoder_path = os.path.join(MODEL_DIR, "encoders.pkl")

if os.path.exists(model_path):
    model = joblib.load(model_path)

if os.path.exists(encoder_path):
    encoders = joblib.load(encoder_path)

# ── REQUEST SCHEMA ──────────────────────────────────────────────────

class PredictionRequest(BaseModel):
    year: int
    category: str
    quota: str
    branch_name: str
    college_name: str

# ── ROUTES ──────────────────────────────────────────────────────────

@app.get("/")
def home():
    return {
        "status": "healthy",
        "message": "KCET ML API Running",
        "version": "1.0.0",
    }

@app.get("/health")
def health():
    return {
        "status": "ok"
    }

@app.post("/predict")
def predict(data: PredictionRequest):

    # Temporary fallback until ML model is deployed
    if model is None or encoders is None:
        return {
            "message": "ML model not deployed yet",
            "predicted_cutoff": 0
        }

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
        columns=[
            "year",
            "category",
            "quota",
            "branch_name",
            "college_name",
        ],
    )

    prediction = model.predict(features)

    return {
        "predicted_cutoff": int(prediction[0])
    }