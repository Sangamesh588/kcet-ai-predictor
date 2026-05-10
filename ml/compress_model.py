import joblib

# Load existing model and encoders
model = joblib.load("kcet_model.pkl")
encoders = joblib.load("encoders.pkl")

# Save compressed versions
joblib.dump(model, "kcet_model_small.pkl", compress=3)
joblib.dump(encoders, "encoders_small.pkl", compress=3)

print("Compressed successfully!")