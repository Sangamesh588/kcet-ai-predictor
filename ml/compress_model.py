import joblib

# Load existing model and encoders
model = joblib.load("kcet_model.pkl")
encoders = joblib.load("encoders.pkl")

# Save ultra compressed versions
joblib.dump(model, "kcet_model_ultra.pkl", compress=9)
joblib.dump(encoders, "encoders_ultra.pkl", compress=9)

print("Ultra compressed successfully!")