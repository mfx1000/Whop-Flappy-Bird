// app/api/leaderboard/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const tournamentId = new Date().toISOString().split("T")[0];

    const { data: scores, error: scoresError } = await supabase
      .from("scores")
      .select("username, score, avatar_url")
      .eq("tournament_id", tournamentId)
      .order("score", { ascending: false })
      .limit(10);

    if (scoresError) throw scoresError;
    
    // Calculate prize pool
    const { count: playerCount, error: countError } = await supabase
        .from('scores')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId);
        
    if (countError) throw countError;

    // UPDATED: Changed prize pool calculation from * 1 to * 2
    const prizePool = (playerCount || 0) * 2; 

    return NextResponse.json({ scores, prizePool });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Error fetching leaderboard:", errorMessage);
    return NextResponse.json({ error: "Failed to fetch leaderboard." }, { status: 500 });
  }
}
