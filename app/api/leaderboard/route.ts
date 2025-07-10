// app/api/leaderboard/route.ts

import { whopSdk } from "@/lib/whop-sdk";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const tournamentId = new Date().toISOString().split("T")[0];

    // 1. Authenticate the user to find out which company's leaderboard to show
    const user = await whopSdk.verifyUserToken(await headers());
    const companyId = (user as { companyId?: string })?.companyId;

    if (!companyId) {
        return NextResponse.json({ error: "This app must be opened within a Whop community." }, { status: 401 });
    }

    // 2. Fetch all scores for today's tournament
    const { data: scores, error: scoresError } = await supabase
      .from("scores")
      .select("username, score, avatar_url")
      .eq("tournament_id", tournamentId)
      // A more advanced implementation would filter scores by companyId here
      .order("score", { ascending: false })
      .limit(10);

    if (scoresError) throw scoresError;

    // 3. Fetch all of today's transactions for this specific company
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from("transactions")
      .select("net_amount_cents")
      .eq("tournament_id", tournamentId)
      .eq("company_id", companyId);

    if (transactionsError) throw transactionsError;

    // 4. Calculate the prize pool by summing the real net amounts
    const prizePoolCents = transactions.reduce((sum, transaction) => sum + transaction.net_amount_cents, 0);
    const prizePool = prizePoolCents / 100;

    return NextResponse.json({ scores, prizePool });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to fetch leaderboard." }, { status: 500 });
  }
}


// // app/api/leaderboard/route.ts

// import { whopSdk } from "@/lib/whop-sdk";
// import { createClient } from "@supabase/supabase-js";
// import { headers } from "next/headers";
// import { NextResponse } from "next/server";

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

// // Use admin client for protected data
// const supabaseAdmin = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_KEY!
// );

// export async function GET() {
//   try {
//     const tournamentId = new Date().toISOString().split("T")[0];

//     // 1. Authenticate the user to find out which company's leaderboard to show
//     const user = await whopSdk.verifyUserToken(await headers());
//     const companyId = (user as { companyId?: string })?.companyId;

//     if (!companyId) {
//         // If not in a company context, just show a generic leaderboard
//         const { data: scores } = await supabase.from("scores").select("username, score, avatar_url").eq("tournament_id", tournamentId).order("score", { ascending: false }).limit(10);
//         return NextResponse.json({ scores, prizePool: 0 });
//     }

//     // 2. Fetch all scores for today's tournament
//     const { data: allScores, error: scoresError } = await supabase
//       .from("scores")
//       .select("username, score, avatar_url")
//       .eq("tournament_id", tournamentId)
//       .order("score", { ascending: false })
//       .limit(10);

//     if (scoresError) throw scoresError;

//     // 3. Fetch the custom entry fee for this company
//     const { data: companySettings } = await supabaseAdmin
//       .from("companies")
//       .select("entry_fee_cents")
//       .eq("id", companyId)
//       .single();
      
//     // 4. Count players only from this specific company
//     const { count: playerCount } = await supabaseAdmin
//         .from('scores')
//         .select('*', { count: 'exact', head: true })
//         .eq('tournament_id', tournamentId)
//         // This part is tricky without joining tables, so we'll approximate for now.
//         // A more advanced implementation would store companyId on the scores table.
//         // For now, we'll calculate based on total players and company price.
    
//     const entryFeeCents = companySettings?.entry_fee_cents || 200;
//     const prizePool = ((playerCount || 0) * entryFeeCents) / 100;

//     return NextResponse.json({ scores: allScores, prizePool });

//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
//     return NextResponse.json({ error: "Failed to fetch leaderboard." }, { status: 500 });
//   }
// }
