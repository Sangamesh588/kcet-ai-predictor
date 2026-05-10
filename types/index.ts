// ─── ML Prediction Types ──────────────────────────────────────────────────────
/** Payload sent to the FastAPI `/predict` endpoint on Render. */
export interface MLPredictionRequest {
  year: number;
  category: string;
  quota: string;
  branch_name: string;
  college_name: string;
}

/** Response returned by the FastAPI `/predict` endpoint. */
export interface MLPredictionResponse {
  predicted_cutoff: number;
  model_used?: string;
}

/** Chance classification for a college relative to the student's rank. */
export type ChanceBadge = "safe" | "moderate" | "dream";

// ─── ML Prediction Result (used in UI state) ─────────────────────────────────
/** A single ML prediction result displayed on the predictor page. */
export interface MLPredictionResult {
  college_name: string;
  branch_name: string;
  category: string;
  quota: string;
  year: number;
  predicted_cutoff: number;
  model_used?: string;
  chance: ChanceBadge;
}

// ─── Supabase Raw Cutoff Row ──────────────────────────────────────────────────
/** Represents a single row from the `raw_cutoffs` Supabase table (used for dropdowns). */
export interface RawCutoffRow {
  id?: number;
  college_name: string;
  branch_name: string;
  cutoff_rank: number;
  category: string;
  quota: string;
  subcategory?: string;
  year: number;
  round?: number;
  location?: string;
  college_type?: string;
}

// ─── Predictor Form Filters ───────────────────────────────────────────────────
/** All filter values used by the predictor form. */
export interface PredictorFilters {
  rank: string;
  category: string;
  branch: string;
  quota: string;
  year: string;
  city: string;
  rural: boolean;
  kannada: boolean;
  female: boolean;
}
export interface MLResponse {
  predicted_cutoff: number
  model_used?: string
}
export interface CollegeResult {
  id?: number
  college_name: string
  branch_name: string
  category: string
  quota: string
  cutoff_rank: number
  city?: string
  ai_prediction?: number
  prediction_source?: string
}
