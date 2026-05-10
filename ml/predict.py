from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import os

app = FastAPI(
    title="KCET ML Prediction API",
    description="HistGradientBoosting-based cutoff predictor for KCET counselling",
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
    allow_origins=["*"],
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

# ── SAFE TRANSFORM FUNCTION ─────────────────────────────────────────

def safe_transform(encoder, value):
    value = str(value).strip()

    if value not in encoder.classes_:
        return 0

    return encoder.transform([value])[0]

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

    # Fallback if model not loaded
    if model is None or encoders is None:
        return {
            "message": "ML model not deployed yet",
            "predicted_cutoff": 0
        }

    try:
        category = safe_transform(
            encoders["category"],
            data.category
        )

        quota = safe_transform(
            encoders["quota"],
            data.quota
        )

        branch = safe_transform(
            encoders["branch_name"],
            data.branch_name
        )

        college = safe_transform(
            encoders["college_name"],
            data.college_name
        )

    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Encoding error: {str(e)}",
        )

    # ── CREATE FEATURE DATAFRAME ────────────────────────────────────

    features = pd.DataFrame(
        [[
            data.year,
            category,
            quota,
            branch,
            college
        ]],
        columns=[
            "year",
            "category",
            "quota",
            "branch_name",
            "college_name",
        ],
    )

    # ── PREDICT ─────────────────────────────────────────────────────

    prediction = model.predict(features)

    return {
        "predicted_cutoff": int(prediction[0]),
        "model_used": "HistGradientBoostingRegressor"
    }