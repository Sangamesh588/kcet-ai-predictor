import { NextResponse } from "next/server";

/**
 * POST /api/predict
 *
 * Server-side proxy that forwards prediction requests to the FastAPI
 * ML backend. This keeps the ML backend URL secret (not exposed to the
 * browser) and lets us add auth / rate-limiting later.
 *
 * Expected body: { year, category, quota, branch_name, college_name }
 * Returns:       { success, predicted_cutoff } or { success: false, error }
 */

const ML_BACKEND_URL =
  process.env.ML_API_URL ||
  process.env.NEXT_PUBLIC_ML_API_URL ||
  "http://127.0.0.1:8000";

const ML_TIMEOUT_MS = 10_000;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ── Validate required fields ────────────────────────────────────────
    const required = ["year", "category", "quota", "branch_name", "college_name"];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // ── Forward to FastAPI ──────────────────────────────────────────────
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

    const mlResponse = await fetch(`${ML_BACKEND_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year: Number(body.year),
        category: String(body.category),
        quota: String(body.quota),
        branch_name: String(body.branch_name),
        college_name: String(body.college_name),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!mlResponse.ok) {
      const errorText = await mlResponse.text().catch(() => "Unknown error");
      return NextResponse.json(
        {
          success: false,
          error: `ML backend returned ${mlResponse.status}`,
          detail: errorText,
        },
        { status: 502 }
      );
    }

    const mlData = await mlResponse.json();

    return NextResponse.json({
      success: true,
      predicted_cutoff: mlData.predicted_cutoff,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    const isTimeout = message.includes("abort");

    return NextResponse.json(
      {
        success: false,
        error: isTimeout ? "ML backend timed out" : message,
      },
      { status: isTimeout ? 504 : 500 }
    );
  }
}