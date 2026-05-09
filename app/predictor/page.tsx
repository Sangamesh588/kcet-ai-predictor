"use client";

import jsPDF from "jspdf";
import Link from "next/link";
import autoTable from "jspdf-autotable";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search,
  GraduationCap,
  Trophy,
  Zap,
  Star,
  ChevronDown,
  ArrowRight,
  Building2,
  Menu,
  X,
  TrendingUp,
  Download,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
  BookOpen,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CollegeResult {
  id?: number;
  college_name: string;
  branch_name: string;
  cutoff_rank: number;
  category: string;
  round?: number;
  location?: string;
  college_type?: string;
}

type ChanceBadge = "safe" | "moderate" | "dream";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getChanceBadge(userRank: number, cutoff: number): ChanceBadge {
  const diff = cutoff - userRank;
  if (diff >= 2000) return "safe";
  if (diff >= 500) return "moderate";
  return "dream";
}

const BADGE_CONFIG: Record<ChanceBadge, { label: string; classes: string; dot: string }> = {
  safe: {
    label: "Safe",
    classes: "bg-green-50 text-green-700 border border-green-200",
    dot: "bg-green-500",
  },
  moderate: {
    label: "Moderate",
    classes: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
  },
  dream: {
    label: "Dream",
    classes: "bg-violet-50 text-violet-700 border border-violet-200",
    dot: "bg-violet-500",
  },
};

const CATEGORIES = [
  { value: "1", label: "Category 1" },
  { value: "2A", label: "Category 2A" },
  { value: "2B", label: "Category 2B" },
  { value: "3A", label: "Category 3A" },
  { value: "3B", label: "Category 3B" },
  { value: "SC", label: "SC" },
  { value: "ST", label: "ST" },
  { value: "GM", label: "General Merit" },
  { value: "GMK", label: "GM Kannada" },
];

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ menuOpen, setMenuOpen }: { menuOpen: boolean; setMenuOpen: (v: boolean) => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100"
            : "bg-white/80 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center shadow-sm group-hover:bg-green-700 transition-colors">
              <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-slate-800 text-sm tracking-tight">
              KCET<span className="text-green-600">Predict</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {["Predictor", "Colleges", "Cutoffs", "About"].map((item) => (
              <a
                key={item}
                href="#"
                className="px-3.5 py-2 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all duration-150 font-medium"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="#"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-sm font-semibold text-white hover:bg-green-700 transition-colors shadow-sm"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
        <nav
          className={`absolute top-[72px] left-4 right-4 bg-white border border-slate-100 rounded-2xl p-3 flex flex-col gap-1 shadow-xl transition-all duration-300 ${
            menuOpen ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
          }`}
        >
          {["Predictor", "Colleges", "Cutoffs", "About", "Sign in"].map((item) => (
            <a
              key={item}
              href="#"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all font-medium"
            >
              {item}
            </a>
          ))}
          <a
            href="#"
            className="mt-1 px-4 py-3 rounded-xl bg-green-600 text-sm font-semibold text-white text-center hover:bg-green-700 transition-colors"
          >
            Get Started
          </a>
        </nav>
      </div>
    </>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-white border border-slate-100 shadow-sm">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-base font-bold text-slate-800 leading-none">{value}</div>
        <div className="text-xs text-slate-500 mt-0.5 font-medium">{label}</div>
      </div>
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 animate-pulse shadow-sm">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 w-56 bg-slate-100 rounded-md" />
            <div className="h-3.5 w-36 bg-slate-100 rounded-md" />
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {[72, 64, 56].map((w) => (
            <div key={w} className="h-7 bg-slate-100 rounded-lg" style={{ width: w }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ rank }: { rank: string }) {
  return (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 mb-5">
        <Building2 className="h-7 w-7 text-slate-300" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-2">No colleges found</h3>
      <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
        No results for rank{" "}
        <span className="text-green-600 font-semibold">{rank}</span> in the selected
        category. Try adjusting your filters.
      </p>
    </div>
  );
}

// ─── College Card ─────────────────────────────────────────────────────────────

function CollegeCard({
  item,
  index,
  userRank,
}: {
  item: CollegeResult;
  index: number;
  userRank: number;
}) {
  const badge = getChanceBadge(userRank, item.cutoff_rank);
  const cfg = BADGE_CONFIG[badge];

  return (
    <div className="group relative rounded-xl border border-slate-100 bg-white p-5 hover:border-green-200 hover:shadow-md transition-all duration-200 cursor-default">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center mt-0.5">
            <BookOpen className="h-4 w-4 text-green-600" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-300 tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="text-sm font-semibold text-slate-800 leading-snug group-hover:text-green-700 transition-colors line-clamp-2 mt-0.5">
              {item.college_name}
            </h2>
            <p className="text-xs text-slate-400 mt-1 line-clamp-1 font-medium">
              {item.branch_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap flex-shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${cfg.classes}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${
                badge === "safe" ? "animate-pulse" : ""
              }`}
            />
            {cfg.label}
          </span>

          <div className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <TrendingUp className="h-3 w-3 text-green-600" />
            {item.cutoff_rank.toLocaleString()}
          </div>

          <div className="inline-flex items-center bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-lg border border-indigo-100 text-xs font-semibold">
            {item.category}
          </div>

          {item.round && (
            <div className="inline-flex items-center bg-purple-50 text-purple-700 px-2.5 py-1.5 rounded-lg border border-purple-100 text-xs font-semibold">
              Rnd {item.round}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SelectField ──────────────────────────────────────────────────────────────

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-700 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all cursor-pointer font-medium pr-9"
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ─── CheckboxField ────────────────────────────────────────────────────────────

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div
        className={`rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
          checked
            ? "bg-green-600 border-green-600"
            : "border-slate-300 bg-white group-hover:border-green-400"
        }`}
        style={{ width: 18, height: 18 }}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className="text-sm text-slate-600 font-medium group-hover:text-slate-800 transition-colors select-none">
        {label}
      </span>
    </label>
  );
}

// ─── Category Dropdown ────────────────────────────────────────────────────────

function CategoryDropdown({
  category,
  setCategory,
}: {
  category: string;
  setCategory: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedCat = CATEGORIES.find((c) => c.value === category);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div className="space-y-1.5" ref={ref}>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
        Category
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl border text-sm font-medium transition-all duration-150 ${
            open
              ? "border-green-400 bg-white ring-2 ring-green-100 text-slate-800"
              : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
          }`}
        >
          <span>{selectedCat?.label ?? category}</span>
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => {
                  setCategory(cat.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors text-left ${
                  category === cat.value
                    ? "text-green-700 bg-green-50/60"
                    : "text-slate-600"
                }`}
              >
                <span>{cat.label}</span>
                {category === cat.value && (
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PredictorPage() {
  // ── State (original logic preserved) ────────────────────────────────
  const [city, setCity] = useState("all");
  const [year, setYear] = useState("all");
  const [rank, setRank] = useState("");
  const [category, setCategory] = useState("2A");
  const [branch, setBranch] = useState("all");
  const [results, setResults] = useState<CollegeResult[]>([]);
  const [loading, setLoading] = useState(false);
  // ─────────────────────────────────────────────────────────────────────
 
  const [hasSearched, setHasSearched] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rankFocused, setRankFocused] = useState(false);
  const [inputError, setInputError] = useState("");
  const [rural, setRural] = useState(false);
  const [kannada, setKannada] = useState(false);
  const [female, setFemale] = useState(false);
  const [quota, setQuota] = useState("GM");
  const resultsRef = useRef<HTMLDivElement>(null);

  // ── Original Supabase logic — UNTOUCHED ──────────────────────────────
  async function predictColleges() {
    setInputError("");
    

    if (!rank || isNaN(Number(rank)) || Number(rank) < 1) {
      setInputError("Please enter a valid rank (e.g. 5000)");
      return;
    }

    setLoading(true);
    setHasSearched(true);

    let query = supabase
      .from("raw_cutoffs")
      .select("*")
      .eq("category", category)
      .eq("quota", quota);

    if (rural) query = query.eq("subcategory", "Rural");
    if (kannada) query = query.eq("subcategory", "Kannada");
    if (year !== "all") query = query.eq("year", Number(year));
    if (branch !== "all") query = query.eq("branch_name", branch);
    if (city !== "all") {
      query = query.ilike("college_name", `%${city}%`);
    }
    const { data, error } = await query
      .gte("cutoff_rank", Number(rank))
      .order("cutoff_rank", { ascending: true })
      .limit(50);

    if (error) {
      console.error(error);
    } else {

      const enhancedResults = await Promise.all(
        (data || []).map(async (college: Record<string, string | number>) => {

      try {

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const aiResponse = await fetch(
          `${apiUrl}/predict`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              year: Number(college.year),
              category: college.category,
              quota: college.quota,
              branch_name: college.branch_name,
              college_name: college.college_name,
            }),
          }
        );

        const aiData = await aiResponse.json();

        return {
          ...college,
          ai_cutoff: aiData.predicted_cutoff,
        };

      } catch (err) {

        console.error("AI prediction failed", err);

        return {
          ...college,
          ai_cutoff: null,
        };
      }
    })
  );

  setResults(enhancedResults);
}
    setLoading(false);

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }
  // ─────────────────────────────────────────────────────────────────────

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("KCET College Predictor Results", 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    const tableData = results.map((college: Record<string, string | number>) => [
      college.college_name,
      college.branch_name,
      college.category,
      college.quota,
      college.cutoff_rank,
      college.year,
    ]);
    autoTable(doc, {
      startY: 40,
      head: [["College", "Branch", "Category", "Quota", "Cutoff", "Year"]],
      body: tableData,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [22, 163, 74] },
    });
    doc.save("kcet-predictions.pdf");
  };

  return (
  

    <main className="relative min-h-screen bg-slate-50 text-slate-800 overflow-x-hidden font-sans">
      {/* Subtle dot grid background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400/40 to-transparent" />
      </div>

      <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-5 pt-28 pb-12 max-w-6xl mx-auto">
        <div className="text-center">

          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-green-200 bg-green-50 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] font-bold text-green-700 tracking-widest uppercase">
              2024–25 Counselling Data · Live
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.06] mb-5 text-slate-900">
            Find Your{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-green-600">Dream College</span>
              <span
                className="absolute bottom-1 left-0 right-0 h-3 bg-green-100 -z-0 rounded-sm"
                aria-hidden
              />
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-500 max-w-md mx-auto leading-relaxed mb-10 font-medium">
            Enter your KCET rank and category to get precision-matched college
            predictions — powered by real cutoff data.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <StatCard icon={Building2} value="800+" label="Colleges" color="bg-green-50 text-green-600" />
            <StatCard icon={Trophy} value="Real" label="Cutoff Data" color="bg-amber-50 text-amber-600" />
            <StatCard icon={Zap} value="Instant" label="Results" color="bg-blue-50 text-blue-600" />
            <StatCard icon={Star} value="Free" label="Forever" color="bg-pink-50 text-violet-600" />
          </div>
        </div>

        {/* ── Predictor Form ──────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">

            {/* Form header */}
            <div className="flex items-center gap-2.5 mb-6 pb-5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                <SlidersHorizontal className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">College Predictor</h2>
                <p className="text-xs text-slate-400 font-medium">Adjust filters to match your profile</p>
              </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">

              {/* Rank Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  KCET Rank
                </label>
                <div
                  className={`relative rounded-xl border transition-all duration-200 ${
                    inputError
                      ? "border-red-300 bg-red-50/50 ring-2 ring-red-100"
                      : rankFocused
                      ? "border-green-400 bg-white ring-2 ring-green-100"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={rank}
                    onChange={(e) => {
                      setRank(e.target.value);
                      setInputError("");
                    }}
                    onFocus={() => setRankFocused(true)}
                    onBlur={() => setRankFocused(false)}
                    onKeyDown={(e) => e.key === "Enter" && predictColleges()}
                    className="w-full bg-transparent px-3.5 py-3 text-sm text-slate-800 placeholder-slate-300 outline-none rounded-xl font-medium [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {inputError ? (
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    ) : rankFocused ? (
                      <Search className="h-4 w-4 text-green-500" />
                    ) : null}
                  </div>
                </div>
                {inputError && (
                  <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-red-400" />
                    {inputError}
                  </p>
                )}
              </div>

              {/* Category */}
              <CategoryDropdown category={category} setCategory={setCategory} />

              {/* Branch */}
              <SelectField label="Branch" value={branch} onChange={setBranch}>
                <option value="all">All Branches</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Computer Science and Engineering">Computer Science & Engg.</option>
                <option value="Information Science">Information Science</option>
                <option value="Electronics and Communication">Electronics & Communication</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
              </SelectField>

              {/* Quota */}
              <SelectField label="Quota" value={quota} onChange={setQuota}>
                <option value="GM">GM</option>
                <option value="HK">HK / 371J</option>
              </SelectField>

              {/* Year */}
              <SelectField label="Year" value={year} onChange={setYear}>
                <option value="all">All Years</option>
                <option value="2022">2022</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
              </SelectField>

              {/* City */}
              <SelectField label="City" value={city} onChange={setCity}>
                <option value="all">All Cities</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Mysore">Mysore</option>
                <option value="Belagavi">Belagavi</option>
                <option value="Hubli">Hubli</option>
                <option value="Tumkur">Tumkur</option>
                <option value="Mangalore">Mangalore</option>
              </SelectField>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-5 mb-6 px-1">
              <CheckboxField label="Rural" checked={rural} onChange={setRural} />
              <CheckboxField label="Kannada Medium" checked={kannada} onChange={setKannada} />
              <CheckboxField label="Female" checked={female} onChange={setFemale} />
            </div>

            {/* Submit */}
            <button
              onClick={predictColleges}
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-bold transition-all duration-150 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finding Colleges…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Predict My Colleges
                </>
              )}
            </button>

            {/* Chance legend */}
            <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-semibold">Admission chance:</span>
              {(["safe", "moderate", "dream"] as ChanceBadge[]).map((b) => {
                const c = BADGE_CONFIG[b];
                return (
                  <span
                    key={b}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${c.classes}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                    {c.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Results ────────────────────────────────────────────────────── */}
      {hasSearched && (
        <section ref={resultsRef} className="relative z-10 px-5 pb-24 max-w-4xl mx-auto">

          {/* Results header */}
          <div className="flex items-center justify-between mb-4 pt-2">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {loading
                  ? "Searching…"
                  : results.length > 0
                  ? `${results.length} colleges found`
                  : "No results found"}
              </h2>
              {!loading && results.length > 0 && (
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  For rank{" "}
                  <span className="text-green-600 font-bold">{rank}</span> · Sorted by
                  cutoff rank
                </p>
              )}
            </div>

            {!loading && results.length > 0 && (
              <button
                onClick={downloadPDF}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:border-green-300 hover:text-green-700 hover:bg-green-50 transition-all duration-150 shadow-sm"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            )}
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && hasSearched && results.length === 0 && (
            <EmptyState rank={rank} />
          )}

          {/* Result cards */}
          {!loading && results.length > 0 && (
            <div className="space-y-2.5">
              {results.map((item, index) => (
                <div
                  key={item.id ?? index}
                  className="opacity-0 animate-fade-up"
                  style={{
                    animationDelay: `${index * 45}ms`,
                    animationFillMode: "forwards",
                  }}
                >
                  <CollegeCard item={item} index={index} userRank={Number(rank)} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-100 bg-white py-8 px-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-green-600 flex items-center justify-center">
              <GraduationCap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-700">
              KCET<span className="text-green-600">Predict</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium text-center">
            Predictions based on historical KCET cutoff data. Not an official source.
            Actual admissions may vary.
          </p>
        </div>
      </footer>

      {/* ── Keyframe styles ─────────────────────────────────────────────── */}
      <style jsx global>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 9999px; }
        ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </main>
  );
}
