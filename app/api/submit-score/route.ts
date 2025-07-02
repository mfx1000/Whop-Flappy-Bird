// app/api/submit-score/route.ts

import { whopSdk } from "@/lib/whop-sdk";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user
    const user = await whopSdk.verifyUserToken(await headers());
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get the score from the request body
    const { score } = await request.json();
    if (typeof score !== 'number') {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }

    // 3. Generate the ID for today's tournament
    const tournamentId = new Date().toISOString().split("T")[0];

    // 4. Fetch the user's current Whop profile info
    const userProfile = await whopSdk.users.getUser({ userId: user.userId });

    // 5. Get the user's existing score for today's tournament, if any
    const { data: existingScoreData, error: selectError } = await supabase
      .from("scores")
      .select("score")
      .eq("user_id", user.userId)
      .eq("tournament_id", tournamentId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // Ignore 'PGRST116' (No rows found)
        throw selectError;
    }

    // 6. Only update if the new score is higher than the existing one
    if (!existingScoreData || score > existingScoreData.score) {
      const { error: upsertError } = await supabase.from("scores").upsert({
        user_id: user.userId,
        username: userProfile.username,
        avatar_url: userProfile.profilePicture?.sourceUrl,
        score: score,
        tournament_id: tournamentId,
      }, { onConflict: 'user_id,tournament_id' }); // Upsert handles insert/update automatically

      if (upsertError) throw upsertError;

      return NextResponse.json({ success: true, message: "New high score submitted!" });
    }

    return NextResponse.json({ success: true, message: "Score was not higher than previous best." });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: `Failed to submit score: ${errorMessage}` }, { status: 500 });
  }
}