import type {
  MLPredictionRequest,
  MLPredictionResponse,
  MLInsight,
  ChanceBadge,
  CollegeResult,
  RawCutoffRow,
  MLSummaryStats,
} from "@/types";

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Base URL of the FastAPI ML backend.
 *
 * In production set `NEXT_PUBLIC_ML_API_URL` to your Render / Railway URL.
 * Falls back to the local dev server.
 */
const ML_API_BASE =
  process.env.NEXT_PUBLIC_ML_API_URL || "http://127.0.0.1:8000";

/** Maximum time (ms) to wait for a single ML prediction before timing out. */
const ML_TIMEOUT_MS = 8_000;

/** How many concurrent ML requests to allow at once (prevents overwhelming the backend). */
const ML_CONCURRENCY_LIMIT = 5;

// ─── Chance Classification ────────────────────────────────────────────────────

/**
 * Classify a college as safe / moderate / dream based on how
 * the ML-predicted cutoff compares with the student's rank.
 *
 * - `safe`     → predicted cutoff is ≥ 2000 ranks above the student's rank
 * - `moderate` → predicted cutoff is ≥ 500 ranks above
 * - `dream`    → student is close to or below the cutoff
 */
export function classifyChance(
  userRank: number,
  predictedCutoff: number
): ChanceBadge {
  const gap = predictedCutoff - userRank;
  if (gap >= 2000) return "safe";
  if (gap >= 500) return "moderate";
  return "dream";
}

/**
 * Derive a rough confidence level based on how far the predicted
 * cutoff is from the historical cutoff.
 */
function deriveConfidence(
  predictedCutoff: number,
  historicalCutoff: number
): "high" | "medium" | "low" {
  const deviation = Math.abs(predictedCutoff - historicalCutoff);
  const pctDeviation = deviation / Math.max(historicalCutoff, 1);
  if (pctDeviation <= 0.05) return "high";
  if (pctDeviation <= 0.15) return "medium";
  return "low";
}

// ─── Single Prediction ────────────────────────────────────────────────────────

/**
 * Call the FastAPI `/predict` endpoint for one college and return the
 * `MLInsight` payload. Returns `null` on any failure so the UI can
 * gracefully degrade.
 */
async function fetchSinglePrediction(
  payload: MLPredictionRequest,
  userRank: number,
  historicalCutoff: number
): Promise<MLInsight | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

  try {
    const res = await fetch(`${ML_API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const data: MLPredictionResponse = await res.json();
    const predictedCutoff = data.predicted_cutoff;

    return {
      predicted_cutoff: predictedCutoff,
      chance: classifyChance(userRank, predictedCutoff),
      confidence: deriveConfidence(predictedCutoff, historicalCutoff),
      rank_gap: predictedCutoff - userRank,
    };
  } catch {
    // Network error, timeout, or non-JSON response — all handled silently
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Batch Processing Helper ──────────────────────────────────────────────────

/**
 * Process an array of items with limited concurrency.
 * Prevents overwhelming the ML backend with 50 simultaneous requests.
 */
async function processWithConcurrency<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  limit: number
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await processor(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Enrich an array of Supabase cutoff rows with ML predictions.
 *
 * This is the **main entry point** used by the predictor page.
 * It calls the FastAPI backend for every college (with concurrency limits)
 * and attaches an `ml` field to each result.
 *
 * If the ML backend is down, *all* results simply get `ml: null` —
 * the historical data still renders perfectly.
 */
export async function enrichWithMLPredictions(
  rows: RawCutoffRow[],
  userRank: number
): Promise<CollegeResult[]> {
  const enriched = await processWithConcurrency(
    rows,
    async (row): Promise<CollegeResult> => {
      const payload: MLPredictionRequest = {
        year: Number(row.year),
        category: row.category,
        quota: row.quota,
        branch_name: row.branch_name,
        college_name: row.college_name,
      };

      const insight = await fetchSinglePrediction(
        payload,
        userRank,
        row.cutoff_rank
      );

      return { ...row, ml: insight };
    },
    ML_CONCURRENCY_LIMIT
  );

  return enriched;
}

/**
 * Build aggregate stats from enriched results to show in the
 * results header (e.g. "12 Safe · 8 Moderate · 5 Dream").
 */
export function computeMLSummary(results: CollegeResult[]): MLSummaryStats {
  const withML = results.filter((r) => r.ml !== null && r.ml !== undefined);

  if (withML.length === 0) {
    return {
      total: results.length,
      safe: 0,
      moderate: 0,
      dream: 0,
      avgPredictedCutoff: 0,
      mlAvailable: false,
    };
  }

  let safe = 0;
  let moderate = 0;
  let dream = 0;
  let cutoffSum = 0;

  for (const r of withML) {
    if (r.ml!.chance === "safe") safe++;
    else if (r.ml!.chance === "moderate") moderate++;
    else dream++;
    cutoffSum += r.ml!.predicted_cutoff;
  }

  return {
    total: results.length,
    safe,
    moderate,
    dream,
    avgPredictedCutoff: Math.round(cutoffSum / withML.length),
    mlAvailable: true,
  };
}

/**
 * Quick health check — pings the ML backend root endpoint.
 * Returns `true` if the backend is reachable.
 */
export async function checkMLHealth(): Promise<boolean> {
  try {
    const res = await fetch(ML_API_BASE, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
