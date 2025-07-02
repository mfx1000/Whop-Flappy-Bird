// app/api/leaderboard/route.ts

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Supabase client
// Note: We use the public anon key here, as this is a public-facing route.
// Row Level Security should be enabled in Supabase for production.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // 1. Generate the ID for today's tournament to filter scores
    const tournamentId = new Date().toISOString().split("T")[0];

    // 2. Fetch the top 10 scores for the current tournament
    const { data: scores, error } = await supabase
      .from("scores")
      .select("username, score, avatar_url")
      .eq("tournament_id", tournamentId)
      .order("score", { ascending: false }) // Highest score first
      .limit(10);

    if (error) {
      throw error;
    }

    // 3. Return the leaderboard data
    return NextResponse.json(scores);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Error fetching leaderboard:", errorMessage);
    return NextResponse.json({ error: "Failed to fetch leaderboard." }, { status: 500 });
  }
}
