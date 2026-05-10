export interface MLPredictionRequest {
  year: number
  category: string
  quota: string
  branch_name: string
  college_name: string
}

export interface MLPredictionResponse {
  predicted_cutoff: number
  model_used?: string
}

export async function predictCutoff(
  data: MLPredictionRequest
): Promise<MLPredictionResponse> {
  try {
    const response = await fetch(
      "https://kcet-ai-predictor-1.onrender.com/predict",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      throw new Error("ML prediction failed")
    }

    const result = await response.json()

    return result
  } catch (error) {
    console.error("ML Prediction Error:", error)

    return {
      predicted_cutoff: 0,
    }
  }
}