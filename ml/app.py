import gradio as gr
import joblib
import pandas as pd

# Load model and encoders
model = joblib.load("kcet_model.pkl")
encoders = joblib.load("encoders.pkl")

def predict_cutoff(year, category, quota, branch_name, college_name):

    category_encoded = encoders["category"].transform([category])[0]
    quota_encoded = encoders["quota"].transform([quota])[0]
    branch_encoded = encoders["branch_name"].transform([branch_name])[0]
    college_encoded = encoders["college_name"].transform([college_name])[0]

    features = pd.DataFrame([[
        year,
        category_encoded,
        quota_encoded,
        branch_encoded,
        college_encoded
    ]], columns=[
        "year",
        "category",
        "quota",
        "branch_name",
        "college_name"
    ])

    prediction = model.predict(features)

    return int(prediction[0])

demo = gr.Interface(
    fn=predict_cutoff,
    inputs=[
        gr.Number(label="Year"),
        gr.Textbox(label="Category"),
        gr.Textbox(label="Quota"),
        gr.Textbox(label="Branch Name"),
        gr.Textbox(label="College Name"),
    ],
    outputs=gr.Number(label="Predicted Cutoff"),
    title="KCET AI Predictor"
)

demo.launch()