import { supabase } from "@/lib/supabase";

export async function getCutoffs() {
  const { data, error } = await supabase
    .from("raw_cutoffs")
    .select("*")
    .limit(20);

  console.log("DATA:", data);
  console.log("ERROR:", error);

  if (error) {
    return [];
  }

  return data;
}