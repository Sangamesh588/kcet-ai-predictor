import joblib

# Load original model
model = joblib.load("kcet_model.pkl")
encoders = joblib.load("encoders.pkl")

# Maximum compression
joblib.dump(model, "kcet_model_ultra.pkl", compress=9)
joblib.dump(encoders, "encoders_ultra.pkl", compress=9)

print("Ultra compression completed!")