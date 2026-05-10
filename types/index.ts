// ─── Supabase Raw Cutoff Row ──────────────────────────────────────────────────
/** Represents a single row from the `raw_cutoffs` Supabase table. */
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

// ─── ML Prediction Types ──────────────────────────────────────────────────────
/** Payload sent to the FastAPI `/predict` endpoint. */
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
}

/** Chance classification for a college relative to the student's rank. */
export type ChanceBadge = "safe" | "moderate" | "dream";

/** A single ML insight attached to a college result. */
export interface MLInsight {
  predicted_cutoff: number;
  chance: ChanceBadge;
  confidence: "high" | "medium" | "low";
  rank_gap: number; // predicted_cutoff - user_rank (positive = favorable)
}

// ─── Combined College Result ──────────────────────────────────────────────────
/** A Supabase row enriched with optional ML predictions. */
export interface CollegeResult extends RawCutoffRow {
  ml?: MLInsight | null;
}

// ─── ML Summary Stats ─────────────────────────────────────────────────────────
/** Aggregated summary of ML predictions for the results header. */
export interface MLSummaryStats {
  total: number;
  safe: number;
  moderate: number;
  dream: number;
  avgPredictedCutoff: number;
  mlAvailable: boolean;
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
