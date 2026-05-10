export async function predictCutoff(params: {
  year: number;
  category: string;
  quota: string;
  branch_name: string;
  college_name: string;
}): Promise<number | null> {
  try {
    const res = await fetch("https://kcet-ai-predictor-1.onrender.com/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.predicted_cutoff === "number" ? data.predicted_cutoff : null;
  } catch {
    return null;
  }
}
