// app/api/cron/route.ts

import { whopSdk } from "@/lib/whop-sdk";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// Initialize Supabase with the service role key for admin-level access
// IMPORTANT: In Supabase, go to Project Settings -> API -> Service Role Key and copy the secret key.
// Add this to your .env.local file as SUPABASE_SERVICE_KEY
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: Request) {
  // 1. Secure the endpoint
  // FIX: Added 'await' before headers()
  const requestHeaders = await headers();
  const authHeader = requestHeaders.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Determine yesterday's tournament ID
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tournamentId = yesterday.toISOString().split("T")[0];

    // 3. Find the winner from yesterday's tournament
    const { data: winnerData, error: winnerError } = await supabaseAdmin
      .from("scores")
      .select("user_id, score")
      .eq("tournament_id", tournamentId)
      .order("score", { ascending: false })
      .limit(1)
      .single(); // We only need the top player

    if (winnerError) {
      if (winnerError.code === 'PGRST116') { // No rows found
        console.log(`No players in tournament ${tournamentId}. No payout needed.`);
        return NextResponse.json({ success: true, message: "No players, no payout." });
      }
      throw winnerError;
    }

    if (!winnerData) {
      console.log(`No winner found for tournament ${tournamentId}.`);
      return NextResponse.json({ success: true, message: "No winner found." });
    }

    // 4. MOCK PRIZE POOL CALCULATION
    // In the real version, we would query our database for all payments for this tournamentId.
    // For now, we'll simulate a prize pool based on the winner's score.
    const mockPlayerCount = Math.floor(Math.random() * 20) + 5; // Simulate 5-25 players
    const prizePool = mockPlayerCount * 2; // Each player paid $2

    // 5. Calculate Payouts (70/15/15 split)
    const winnerPayout = prizePool * 0.70;
    const developerPayout = prizePool * 0.15;
    const hostPayout = prizePool * 0.15;

    // 6. MOCK PAYOUTS
    // In the real version, we would use whopSdk.payments.payUser() here.
    // For now, we just log the actions that would be taken.
    console.log("--- Daily Tournament Payout ---");
    console.log(`Tournament ID: ${tournamentId}`);
    console.log(`Prize Pool: $${prizePool.toFixed(2)}`);
    console.log(`Winner (${winnerData.user_id}) gets: $${winnerPayout.toFixed(2)}`);
    console.log(`Developer (${process.env.WHOP_AGENT_USER_ID}) gets: $${developerPayout.toFixed(2)}`);
    console.log(`Host (${process.env.WHOP_HOST_COMPANY_ID}) gets: $${hostPayout.toFixed(2)}`);
    console.log("-------------------------------");

    // You could optionally clear the leaderboard here, but filtering by tournamentId is safer.

    return NextResponse.json({ success: true, message: "Payouts processed successfully." });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Cron job failed:", errorMessage);
    return NextResponse.json({ error: "Cron job failed." }, { status: 500 });
  }
}
