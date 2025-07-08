// app/api/cron/route.ts

import { whopSdk } from "@/lib/whop-sdk";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: Request) {
  const requestHeaders = await headers();
  const authHeader = requestHeaders.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tournamentId = yesterday.toISOString().split("T")[0];

    // 1. Get a list of all companies that have the app installed
    const { data: companies } = await supabaseAdmin
        .from("companies")
        .select('id, entry_fee_cents');

    if (!companies) {
        return NextResponse.json({ success: true, message: "No companies found to process." });
    }

    // 2. Loop through each company and process their tournament and notifications
    for (const company of companies) {
        const { id: companyId, entry_fee_cents: entryFeeCents } = company;
        
        // --- PAYOUT LOGIC ---
        const { data: winnerData } = await supabaseAdmin
            .from("scores")
            .select("user_id, score")
            .eq("tournament_id", tournamentId)
            // A more advanced app would filter scores by companyId here
            .order("score", { ascending: false })
            .limit(1)
            .single();

        if (winnerData) {
            const { count: playerCount } = await supabaseAdmin
                .from('scores')
                .select('*', { count: 'exact', head: true })
                .eq('tournament_id', tournamentId);

            const prizePool = ((playerCount || 0) * (entryFeeCents || 200)) / 100;

            if (prizePool > 0) {
                const winnerPayout = prizePool * 0.70;
                const developerPayout = prizePool * 0.15;
                const hostPayout = prizePool * 0.15;

                const companyLedger = await whopSdk.companies.getCompanyLedgerAccount({ companyId: companyId! });
                const ledgerAccountId = companyLedger?.ledgerAccount?.id;

                if (ledgerAccountId) {
                    await whopSdk.payments.payUser({ amount: winnerPayout, currency: 'usd', destinationId: winnerData.user_id, notes: `Flappy Royale Winner - ${tournamentId}`, ledgerAccountId, idempotenceKey: `${tournamentId}-winner-${companyId}-${winnerData.user_id}` });
                    await whopSdk.payments.payUser({ amount: developerPayout, currency: 'usd', destinationId: process.env.WHOP_AGENT_USER_ID!, notes: `Flappy Royale Dev Share - ${tournamentId}`, ledgerAccountId, idempotenceKey: `${tournamentId}-dev-${companyId}` });
                    await whopSdk.payments.payUser({ amount: hostPayout, currency: 'usd', destinationId: companyId, notes: `Flappy Royale Host Share - ${tournamentId}`, ledgerAccountId, idempotenceKey: `${tournamentId}-host-${companyId}` });
                    console.log(`Payouts processed for company ${companyId} for tournament ${tournamentId}.`);
                }
            }
        } else {
            console.log(`No winner for company ${companyId} in tournament ${tournamentId}.`);
        }
        
        // --- NOTIFICATION LOGIC ---
        // After handling payouts, send a notification to this company about the new tournament.
        const notificationInput = {
            companyId: companyId,
            title: "🏆Daily Flappy Bird Tournament Live!",
            content: "The Flappy Bird Royale leaderboard has reset. A fresh prize pool is up for grabs. Can you claim the top spot today?",
				url: "https://whop.com/apps/app_6TWUifgF6OQy2W/install/"
        };
        await whopSdk.notifications.sendPushNotification(notificationInput);
        console.log(`Sent 'New Tournament' notification to company ${companyId}.`);
    }

    return NextResponse.json({ success: true, message: "All tournament payouts and notifications processed." });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Cron job failed." }, { status: 500 });
  }
}


// // app/api/cron/route.ts

// import { whopSdk } from "@/lib/whop-sdk";
// import { createClient } from "@supabase/supabase-js";
// import { url } from "inspector";
// import { headers } from "next/headers";
// import { NextResponse } from "next/server";

// const supabaseAdmin = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_KEY!
// );

// export async function GET(request: Request) {
//   const requestHeaders = await headers();
//   const authHeader = requestHeaders.get('authorization');
//   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }

//   try {
//     // --- PAYOUT LOGIC FOR YESTERDAY'S TOURNAMENT ---
//     const yesterday = new Date();
//     yesterday.setDate(yesterday.getDate() - 1);
//     const tournamentId = yesterday.toISOString().split("T")[0];

//     const { data: winnerData, error: winnerError } = await supabaseAdmin
//       .from("scores")
//       .select("user_id, score")
//       .eq("tournament_id", tournamentId)
//       .order("score", { ascending: false })
//       .limit(1)
//       .single();

//     if (winnerError && winnerError.code !== 'PGRST116') {
//       throw winnerError;
//     }

//     if (winnerData) {
//       const { count: playerCount } = await supabaseAdmin
//           .from('scores')
//           .select('*', { count: 'exact', head: true })
//           .eq('tournament_id', tournamentId);
          
//       const prizePool = (playerCount || 0) * 2;

//       if (prizePool > 0) {
//         const winnerPayout = prizePool * 0.70;
//         const developerPayout = prizePool * 0.15;
//         const hostPayout = prizePool * 0.15;

//         const companyLedger = await whopSdk.companies.getCompanyLedgerAccount({ companyId: process.env.WHOP_HOST_COMPANY_ID! });
//         const ledgerAccountId = companyLedger?.ledgerAccount?.id;

//         if (!ledgerAccountId) throw new Error("Could not find a ledger account.");

//         // Payouts...
//         await whopSdk.payments.payUser({ amount: winnerPayout, currency: 'usd', destinationId: winnerData.user_id, notes: `Flappy Bird Royale Winner - ${tournamentId}`, ledgerAccountId, idempotenceKey: `${tournamentId}-winner-${winnerData.user_id}` });
//         await whopSdk.payments.payUser({ amount: developerPayout, currency: 'usd', destinationId: process.env.WHOP_AGENT_USER_ID!, notes: `Flappy Bird Royale Dev Share - ${tournamentId}`, ledgerAccountId, idempotenceKey: `${tournamentId}-dev-${process.env.WHOP_AGENT_USER_ID!}` });
//         await whopSdk.payments.payUser({ amount: hostPayout, currency: 'usd', destinationId: process.env.WHOP_HOST_COMPANY_ID!, notes: `Flappy Bird Royale Host Share - ${tournamentId}`, ledgerAccountId, idempotenceKey: `${tournamentId}-host-${process.env.WHOP_HOST_COMPANY_ID!}` });
        
//         console.log(`Payouts for tournament ${tournamentId} processed successfully.`);
//       }
//     } else {
//       console.log(`No players in tournament ${tournamentId}. No payout needed.`);
//     }

//     // --- NOTIFICATION LOGIC FOR TODAY'S TOURNAMENT ---
//     const notificationInput = {
//       companyId: process.env.WHOP_HOST_COMPANY_ID!,
//       title: "🏆 Daily Flappy Bird Tournament Live!",
//       content: "The Flappy Bird Royale leaderboard has reset. A fresh prize pool is up for grabs. Can you claim the top spot today?",
// 		url: "https://whop.com/apps/app_6TWUifgF6OQy2W/install/"
//     };
//     await whopSdk.notifications.sendPushNotification(notificationInput);
//     console.log("Sent 'New Tournament Live!' notification.");

//     return NextResponse.json({ success: true, message: "Payouts processed and notification sent." });

//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
//     console.error("Cron job failed:", errorMessage);
//     return NextResponse.json({ error: "Cron job failed." }, { status: 500 });
//   }
// }
