export type ChanceBadge = "safe" | "moderate" | "dream";

export interface CollegeResult {
  id?: string | number;
  college_name: string;
  branch_name: string;
  category: string;
  quota: string;
  cutoff_rank: number;
  round?: number;
  year?: number;
  ml?: null;
}
